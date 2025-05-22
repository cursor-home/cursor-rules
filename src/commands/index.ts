import { 
  openConfigCommand 
} from './configPanelCommands';
import {
  openWelcomePageCommand
} from './welcomePageCommands';
import { 
  createCursorRulesCommand, 
  detectTechStackCommand,
  browseRulesCommand,
  recommendRulesCommand
} from './ruleOperationCommands';
import { utilCommands } from './utilCommands';

/**
 * 规则相关命令
 */
export const ruleCommands = [
    openConfigCommand,
    openWelcomePageCommand,
    createCursorRulesCommand,
    detectTechStackCommand,
    browseRulesCommand,
    recommendRulesCommand
];

/**
 * 所有命令
 */
export const allCommands = [
    ...ruleCommands,
    ...utilCommands
]; 