import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { TechStackInfo } from '../types';
import { addToTechStack } from './packageDetector';

/**
 * 数据库配置文件信息接口
 */
interface DatabaseConfigInfo {
  patterns: string[];
  database: string;
  type: 'tools' | 'frameworks' | 'libraries';
  validate?: (filePath: string) => Promise<boolean>;
}

/**
 * 分析项目中使用的数据库技术
 * @param workspaceFolder 工作区文件夹
 * @param result 技术栈结果对象
 */
export async function analyzeDatabases(
  workspaceFolder: vscode.WorkspaceFolder,
  result: TechStackInfo
): Promise<void> {
  try {
    // 1. 检查常见数据库配置文件
    await checkDatabaseConfigFiles(workspaceFolder, result);
    
    // 2. 分析项目代码中的数据库连接字符串
    await findDatabaseConnectionStrings(workspaceFolder, result);
    
    // 3. 检查Docker中的数据库
    await checkDockerDatabases(workspaceFolder, result);
    
    // 4. 分析ORM相关配置
    await analyzeORMConfigs(workspaceFolder, result);
  } catch (error) {
    console.error('Error analyzing database technologies:', error);
  }
}

/**
 * 检查数据库配置文件
 */
async function checkDatabaseConfigFiles(
  workspaceFolder: vscode.WorkspaceFolder,
  result: TechStackInfo
): Promise<void> {
  // 遍历数据库配置文件列表
  for (const dbConfig of databaseConfigs) {
    for (const pattern of dbConfig.patterns) {
      try {
        const files = await vscode.workspace.findFiles(
          new vscode.RelativePattern(workspaceFolder, pattern),
          '{**/node_modules/**,**/dist/**,**/build/**}',
          1
        );
        
        if (files.length > 0) {
          const filePath = files[0].fsPath;
          
          // 如果有验证函数，则调用验证
          if (dbConfig.validate) {
            const isValid = await dbConfig.validate(filePath);
            if (!isValid) continue;
          }
          
          // 添加数据库到技术栈
          addToTechStack(result, dbConfig.type, dbConfig.database);
          break;
        }
      } catch (error) {
        console.error(`Error checking database pattern ${pattern}:`, error);
      }
    }
  }
}

/**
 * 在项目代码中查找数据库连接字符串
 */
async function findDatabaseConnectionStrings(
  workspaceFolder: vscode.WorkspaceFolder,
  result: TechStackInfo
): Promise<void> {
  // 查找可能包含数据库连接字符串的文件
  const configFiles = await vscode.workspace.findFiles(
    new vscode.RelativePattern(workspaceFolder, 
      '{**/*.env,**/*.env.*,**/config*.{js,ts,json,yml,yaml},**/database*.{js,ts,json,yml,yaml},**/application*.{properties,yml,yaml}}'),
    '{**/node_modules/**,**/dist/**,**/build/**}',
    10
  );
  
  for (const file of configFiles) {
    try {
      const document = await vscode.workspace.openTextDocument(file);
      const content = document.getText();
      
      // 检查各种数据库的连接字符串模式
      if (content.match(/mongodb(\+srv)?:\/\//i)) {
        addToTechStack(result, 'libraries', 'MongoDB');
      }
      
      if (content.match(/mysql:\/\//i) || content.match(/jdbc:mysql/i)) {
        addToTechStack(result, 'libraries', 'MySQL');
      }
      
      if (content.match(/postgres(ql)?:\/\//i) || content.match(/jdbc:postgresql/i)) {
        addToTechStack(result, 'libraries', 'PostgreSQL');
      }
      
      if (content.match(/redis:\/\//i)) {
        addToTechStack(result, 'libraries', 'Redis');
      }
      
      if (content.match(/sqlite:\/\//i) || content.match(/jdbc:sqlite/i)) {
        addToTechStack(result, 'libraries', 'SQLite');
      }
      
      if (content.match(/mssql:\/\//i) || content.match(/jdbc:sqlserver/i)) {
        addToTechStack(result, 'libraries', 'SQL Server');
      }
      
      if (content.match(/oracle:\/\//i) || content.match(/jdbc:oracle/i)) {
        addToTechStack(result, 'libraries', 'Oracle');
      }
      
      if (content.match(/neo4j:\/\//i) || content.match(/bolt:\/\//i)) {
        addToTechStack(result, 'libraries', 'Neo4j');
      }
      
      if (content.match(/elasticsearch:\/\//i) || 
          content.match(/localhost:9200/i) || 
          content.match(/elasticsearch\.client/i)) {
        addToTechStack(result, 'libraries', 'Elasticsearch');
      }
      
      if (content.match(/cassandra:/i) || content.match(/datastax/i)) {
        addToTechStack(result, 'libraries', 'Cassandra');
      }
      
      if (content.match(/dynamodb/i) || content.match(/aws\.dynamodb/i)) {
        addToTechStack(result, 'libraries', 'DynamoDB');
      }
      
      if (content.match(/firestore/i) || content.match(/firebase\/firestore/i)) {
        addToTechStack(result, 'libraries', 'Firestore');
      }
    } catch (error) {
      console.error(`Error analyzing file for database connections: ${file.fsPath}`, error);
    }
  }
}

/**
 * 检查Docker配置中的数据库
 */
async function checkDockerDatabases(
  workspaceFolder: vscode.WorkspaceFolder,
  result: TechStackInfo
): Promise<void> {
  const dockerFiles = await vscode.workspace.findFiles(
    new vscode.RelativePattern(workspaceFolder, '{**/Dockerfile,**/docker-compose.{yml,yaml}}'),
    '{**/node_modules/**}',
    5
  );
  
  for (const file of dockerFiles) {
    try {
      const document = await vscode.workspace.openTextDocument(file);
      const content = document.getText().toLowerCase();
      
      // 检查Docker镜像和服务
      if (content.includes('mongo:') || content.includes('image: mongo')) {
        addToTechStack(result, 'libraries', 'MongoDB');
      }
      
      if (content.includes('mysql:') || content.includes('image: mysql')) {
        addToTechStack(result, 'libraries', 'MySQL');
      }
      
      if (content.includes('postgres:') || content.includes('image: postgres')) {
        addToTechStack(result, 'libraries', 'PostgreSQL');
      }
      
      if (content.includes('redis:') || content.includes('image: redis')) {
        addToTechStack(result, 'libraries', 'Redis');
      }
      
      if (content.includes('elasticsearch:') || content.includes('image: elasticsearch')) {
        addToTechStack(result, 'libraries', 'Elasticsearch');
      }
      
      if (content.includes('neo4j:') || content.includes('image: neo4j')) {
        addToTechStack(result, 'libraries', 'Neo4j');
      }
      
      if (content.includes('mssql:') || content.includes('image: mcr.microsoft.com/mssql')) {
        addToTechStack(result, 'libraries', 'SQL Server');
      }
      
      if (content.includes('cassandra:') || content.includes('image: cassandra')) {
        addToTechStack(result, 'libraries', 'Cassandra');
      }
      
      if (content.includes('couchbase:') || content.includes('image: couchbase')) {
        addToTechStack(result, 'libraries', 'Couchbase');
      }
      
      if (content.includes('mariadb:') || content.includes('image: mariadb')) {
        addToTechStack(result, 'libraries', 'MariaDB');
      }
    } catch (error) {
      console.error(`Error analyzing Docker file for databases: ${file.fsPath}`, error);
    }
  }
}

/**
 * 分析ORM配置
 */
async function analyzeORMConfigs(
  workspaceFolder: vscode.WorkspaceFolder,
  result: TechStackInfo
): Promise<void> {
  // TypeORM 配置检查
  const typeormFiles = await vscode.workspace.findFiles(
    new vscode.RelativePattern(workspaceFolder, '{**/ormconfig.{json,js,ts},**/typeorm.config.{js,ts}}'),
    '{**/node_modules/**}',
    1
  );
  
  if (typeormFiles.length > 0) {
    addToTechStack(result, 'libraries', 'TypeORM');
    
    // 尝试从配置中检测数据库类型
    try {
      const document = await vscode.workspace.openTextDocument(typeormFiles[0]);
      const content = document.getText();
      
      if (content.includes('"type": "mysql"') || content.includes('type: "mysql"') || 
          content.includes("type: 'mysql'")) {
        addToTechStack(result, 'libraries', 'MySQL');
      } else if (content.includes('"type": "postgres"') || content.includes('type: "postgres"') || 
                content.includes("type: 'postgres'")) {
        addToTechStack(result, 'libraries', 'PostgreSQL');
      } else if (content.includes('"type": "sqlite"') || content.includes('type: "sqlite"') || 
                content.includes("type: 'sqlite'")) {
        addToTechStack(result, 'libraries', 'SQLite');
      } else if (content.includes('"type": "mongodb"') || content.includes('type: "mongodb"') || 
                content.includes("type: 'mongodb'")) {
        addToTechStack(result, 'libraries', 'MongoDB');
      }
    } catch (error) {
      console.error('Error analyzing TypeORM config:', error);
    }
  }
  
  // Sequelize 配置检查
  const sequelizeFiles = await vscode.workspace.findFiles(
    new vscode.RelativePattern(workspaceFolder, '{**/.sequelizerc,**/sequelize.config.{js,json}}'),
    '{**/node_modules/**}',
    1
  );
  
  if (sequelizeFiles.length > 0) {
    addToTechStack(result, 'libraries', 'Sequelize');
  }
  
  // Mongoose 检查
  const mongooseFiles = await vscode.workspace.findFiles(
    new vscode.RelativePattern(workspaceFolder, '{**/mongoose.{js,ts},**/mongoose/**.{js,ts}}'),
    '{**/node_modules/**}',
    1
  );
  
  if (mongooseFiles.length > 0) {
    addToTechStack(result, 'libraries', 'Mongoose');
    addToTechStack(result, 'libraries', 'MongoDB');
  }
  
  // Prisma 检查
  const prismaFiles = await vscode.workspace.findFiles(
    new vscode.RelativePattern(workspaceFolder, '{**/prisma/schema.prisma,**/prisma/**/*.prisma}'),
    '{**/node_modules/**}',
    1
  );
  
  if (prismaFiles.length > 0) {
    addToTechStack(result, 'libraries', 'Prisma');
    
    // 尝试从Prisma配置中检测数据库类型
    try {
      const document = await vscode.workspace.openTextDocument(prismaFiles[0]);
      const content = document.getText();
      
      if (content.includes('provider = "mysql"') || content.includes('provider = "mysql"')) {
        addToTechStack(result, 'libraries', 'MySQL');
      } else if (content.includes('provider = "postgresql"') || content.includes('provider = "postgres"')) {
        addToTechStack(result, 'libraries', 'PostgreSQL');
      } else if (content.includes('provider = "sqlite"')) {
        addToTechStack(result, 'libraries', 'SQLite');
      } else if (content.includes('provider = "mongodb"')) {
        addToTechStack(result, 'libraries', 'MongoDB');
      } else if (content.includes('provider = "sqlserver"')) {
        addToTechStack(result, 'libraries', 'SQL Server');
      }
    } catch (error) {
      console.error('Error analyzing Prisma config:', error);
    }
  }
  
  // Hibernate 检查 (Java)
  const hibernateFiles = await vscode.workspace.findFiles(
    new vscode.RelativePattern(workspaceFolder, '{**/hibernate.cfg.xml,**/application.properties}'),
    '{**/node_modules/**}',
    1
  );
  
  if (hibernateFiles.length > 0) {
    addToTechStack(result, 'libraries', 'Hibernate');
    
    // 尝试从配置中检测数据库类型
    try {
      const document = await vscode.workspace.openTextDocument(hibernateFiles[0]);
      const content = document.getText();
      
      if (content.includes('mysql') || content.includes('jdbc:mysql')) {
        addToTechStack(result, 'libraries', 'MySQL');
      } else if (content.includes('postgresql') || content.includes('jdbc:postgresql')) {
        addToTechStack(result, 'libraries', 'PostgreSQL');
      } else if (content.includes('oracle') || content.includes('jdbc:oracle')) {
        addToTechStack(result, 'libraries', 'Oracle');
      } else if (content.includes('sqlserver') || content.includes('jdbc:sqlserver')) {
        addToTechStack(result, 'libraries', 'SQL Server');
      } else if (content.includes('db2') || content.includes('jdbc:db2')) {
        addToTechStack(result, 'libraries', 'DB2');
      }
    } catch (error) {
      console.error('Error analyzing Hibernate config:', error);
    }
  }
  
  // Django 检查 (Python)
  const djangoFiles = await vscode.workspace.findFiles(
    new vscode.RelativePattern(workspaceFolder, '{**/settings.py}'),
    '{**/node_modules/**,**/.venv/**,**/env/**}',
    5
  );
  
  for (const file of djangoFiles) {
    try {
      const document = await vscode.workspace.openTextDocument(file);
      const content = document.getText();
      
      if (content.includes('DATABASES') && content.includes('django.db')) {
        addToTechStack(result, 'libraries', 'Django ORM');
        
        if (content.includes('django.db.backends.mysql')) {
          addToTechStack(result, 'libraries', 'MySQL');
        } else if (content.includes('django.db.backends.postgresql')) {
          addToTechStack(result, 'libraries', 'PostgreSQL');
        } else if (content.includes('django.db.backends.sqlite3')) {
          addToTechStack(result, 'libraries', 'SQLite');
        } else if (content.includes('django.db.backends.oracle')) {
          addToTechStack(result, 'libraries', 'Oracle');
        } else if (content.includes('sql_server.pyodbc')) {
          addToTechStack(result, 'libraries', 'SQL Server');
        } else if (content.includes('djongo')) {
          addToTechStack(result, 'libraries', 'MongoDB');
        }
      }
    } catch (error) {
      console.error(`Error analyzing Django file: ${file.fsPath}`, error);
    }
  }
  
  // SQLAlchemy 检查 (Python)
  const sqlalchemyFiles = await vscode.workspace.findFiles(
    new vscode.RelativePattern(workspaceFolder, '{**/*.py}'),
    '{**/node_modules/**,**/.venv/**,**/env/**,**/tests/**}',
    50
  );
  
  let hasSqlAlchemy = false;
  
  for (const file of sqlalchemyFiles) {
    try {
      const document = await vscode.workspace.openTextDocument(file);
      const content = document.getText();
      
      if (content.includes('from sqlalchemy import') || content.includes('import sqlalchemy')) {
        hasSqlAlchemy = true;
        addToTechStack(result, 'libraries', 'SQLAlchemy');
        
        // 从连接字符串检测数据库类型
        if (content.includes('mysql+') || content.includes('mysql://')) {
          addToTechStack(result, 'libraries', 'MySQL');
        } else if (content.includes('postgresql+') || content.includes('postgresql://')) {
          addToTechStack(result, 'libraries', 'PostgreSQL');
        } else if (content.includes('sqlite:///')) {
          addToTechStack(result, 'libraries', 'SQLite');
        } else if (content.includes('oracle+') || content.includes('oracle://')) {
          addToTechStack(result, 'libraries', 'Oracle');
        } else if (content.includes('mssql+') || content.includes('mssql://')) {
          addToTechStack(result, 'libraries', 'SQL Server');
        }
        
        break;
      }
    } catch (error) {
      // 忽略单个文件错误
      continue;
    }
  }
}

/**
 * 数据库配置文件列表
 */
const databaseConfigs: DatabaseConfigInfo[] = [
  // 关系型数据库
  {
    patterns: ['**/my.cnf', '**/my.ini', '**/*.mysql.cnf'],
    database: 'MySQL',
    type: 'libraries'
  },
  {
    patterns: ['**/postgresql.conf', '**/pg_hba.conf', '**/.pgpass'],
    database: 'PostgreSQL',
    type: 'libraries'
  },
  {
    patterns: ['**/*.db', '**/*.sqlite', '**/*.sqlite3'],
    database: 'SQLite',
    type: 'libraries'
  },
  {
    patterns: ['**/tnsnames.ora', '**/sqlnet.ora'],
    database: 'Oracle',
    type: 'libraries'
  },
  {
    patterns: ['**/db2cli.ini', '**/db2inst*.env'],
    database: 'DB2',
    type: 'libraries'
  },
  {
    patterns: ['**/sql-server-2019.repo', '**/mssql.conf'],
    database: 'SQL Server',
    type: 'libraries'
  },
  
  // NoSQL 数据库
  {
    patterns: ['**/mongod.conf', '**/mongodb.conf'],
    database: 'MongoDB',
    type: 'libraries'
  },
  {
    patterns: ['**/redis.conf', '**/sentinel.conf'],
    database: 'Redis',
    type: 'libraries'
  },
  {
    patterns: ['**/elasticsearch.yml', '**/elasticsearch.json'],
    database: 'Elasticsearch',
    type: 'libraries'
  },
  {
    patterns: ['**/cassandra.yaml'],
    database: 'Cassandra',
    type: 'libraries'
  },
  {
    patterns: ['**/couchbase.conf', '**/couchbase-server.conf'],
    database: 'Couchbase',
    type: 'libraries'
  },
  {
    patterns: ['**/neo4j.conf'],
    database: 'Neo4j',
    type: 'libraries'
  },
  
  // 列式数据库
  {
    patterns: ['**/clickhouse-server.xml'],
    database: 'ClickHouse',
    type: 'libraries'
  },
  {
    patterns: ['**/hbase-site.xml'],
    database: 'HBase',
    type: 'libraries'
  },
  
  // 图数据库
  {
    patterns: ['**/janus-graph.properties'],
    database: 'JanusGraph',
    type: 'libraries'
  },
  {
    patterns: ['**/orientdb-server-config.xml'],
    database: 'OrientDB',
    type: 'libraries'
  },
  
  // 时序数据库
  {
    patterns: ['**/influxdb.conf'],
    database: 'InfluxDB',
    type: 'libraries'
  },
  {
    patterns: ['**/prometheus.yml'],
    database: 'Prometheus',
    type: 'libraries'
  },
  {
    patterns: ['**/timescaledb.conf'],
    database: 'TimescaleDB',
    type: 'libraries'
  },
  
  // ORM 和数据库工具
  {
    patterns: ['**/typeorm.config.{js,ts}', '**/ormconfig.{json,js,ts}'],
    database: 'TypeORM',
    type: 'libraries'
  },
  {
    patterns: ['**/.sequelizerc', '**/sequelize.config.{js,json}'],
    database: 'Sequelize',
    type: 'libraries'
  },
  {
    patterns: ['**/prisma/schema.prisma'],
    database: 'Prisma',
    type: 'libraries'
  },
  {
    patterns: ['**/knexfile.{js,ts}'],
    database: 'Knex.js',
    type: 'libraries'
  },
  {
    patterns: ['**/liquibase.properties', '**/changelog.xml'],
    database: 'Liquibase',
    type: 'libraries'
  },
  {
    patterns: ['**/flyway.conf', '**/.flywayrc'],
    database: 'Flyway',
    type: 'libraries'
  },
  {
    patterns: ['**/hibernate.cfg.xml', '**/hibernate.properties'],
    database: 'Hibernate',
    type: 'libraries'
  },
]; 