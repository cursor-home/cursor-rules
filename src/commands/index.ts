import { generateCodeCommand, streamConversationCommand, advancedConversationCommand } from './aiCommands';
import { openConfigCommand, openWelcomePageCommand, createCursorRulesCommand, detectTechStackCommand } from './ruleCommands';

/**
 * AI相关命令
 */
export const aiCommands = [
    generateCodeCommand,
    streamConversationCommand,
    advancedConversationCommand
];

/**
 * 规则相关命令
 */
export const ruleCommands = [
    openConfigCommand,
    openWelcomePageCommand,
    createCursorRulesCommand,
    detectTechStackCommand
];

/**
 * 所有命令
 */
export const allCommands = [
    ...ruleCommands,
    ...aiCommands
]; 