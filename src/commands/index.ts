import { 
  openConfigCommand 
} from './configPanelCommands';
import {
  openWelcomePageCommand
} from './welcomePageCommands';
import { 
  createCursorRulesCommand
} from './ruleOperationCommands';
import { loggerCommands } from './loggerCommands';

/**
 * 规则相关命令
 */
export const ruleCommands = [
    openConfigCommand,
    openWelcomePageCommand,
    createCursorRulesCommand
];

/**
 * 所有命令
 */
export const allCommands = [
    ...ruleCommands,
    ...loggerCommands
]; 