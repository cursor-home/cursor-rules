/**
 * configPanel/types.ts
 * 
 * Type definitions for the configuration panel
 */
import * as vscode from 'vscode';
import { Rule } from '../../types';

/**
 * VSCode API interface
 */
export interface VSCodeAPI {
  postMessage: (message: any) => void;
  getState: () => any;
  setState: (state: any) => void;
}

/**
 * Config panel props
 */
export interface ConfigPanelProps {
  vscode: VSCodeAPI;
}

/**
 * Config item interface
 */
export interface ConfigItem {
  id: string;
  label: string;
  type: string;
  value: string | boolean | number;
  options?: Array<{
    label: string;
    value: string;
  }>;
}

/**
 * Config item component interface
 */
export interface ConfigItemProps {
  title: string;
  description: string;
  onSelect: () => void;
  isActive: boolean;
}

/**
 * Tech stack info interface
 */
export interface TechStackInfo {
  languages: string[];
  frameworks: string[];
  libraries: string[];
  tools: string[];
  confidence: number;
  projectType?: string | null;
  recommendedTemplateId?: string | null;
}

/**
 * General settings component interface
 */
export interface GeneralSettingsProps {
  config: ConfigItem[];
  onConfigChange: (id: string, value: string | boolean | number) => void;
  ruleTemplates: Rule[];
}

/**
 * Tech stack info component interface
 */
export interface TechStackInfoProps {
  techStackInfo: TechStackInfo | null;
  detecting: boolean;
  onDetect: () => void;
  onApplyRecommendedTemplate: () => void;
  getRecommendedTemplate: () => string;
  ruleTemplates: Rule[];
}

/**
 * Template preview component interface
 */
export interface TemplatePreviewProps {
  currentTemplate: Rule | null;
  previewContent: string;
  onCreateTemplate: () => void;
}

/**
 * About section component interface
 */
export interface AboutSectionProps {
  // No props needed currently
}

/**
 * Single config item component interface
 */
export interface ConfigInputItemProps {
  config: ConfigItem;
  onChange: (value: string | boolean | number) => void;
}

/**
 * Navigation bar item
 */
export interface NavItem {
  id: string;
  label: string;
  icon: string;
}

/**
 * Navigation bar component interface
 */
export interface NavigationBarProps {
  navItems: NavItem[];
  activePageId: string;
  setActivePage: (pageId: string) => void;
}

/**
 * Shared page component interface
 */
export interface PageProps {
  vscode: VSCodeAPI;
}

/**
 * GitHub stats data
 */
export interface GitHubStats {
  stars: number;
  forks: number;
  lastUpdated: number;
}

/**
 * GitHub data hook return value
 */
export interface UseGitHubStatsReturn {
  stats: GitHubStats | null;
  loading: boolean;
  error: string | null;
  refreshStats: () => void;
}

/**
 * Navigation state hook return value
 */
export interface UseNavigationReturn {
  activePageId: string;
  setActivePage: (pageId: string) => void;
  navItems: NavItem[];
}

/**
 * Rule list hook return value
 */
export interface UseRuleListReturn {
  rules: Rule[];
  loading: boolean;
  error: string | null;
  refreshRules: (includeBuiltIn?: boolean) => void;
}

/**
 * Rule card props
 */
export interface RuleCardProps {
  rule: Rule;
}

/**
 * General settings page props
 */
export interface GeneralSettingsPageProps {
  config: ConfigItem[];
  selectedTemplateIndex: number | null;
  previewContent: string;
  handleConfigChange: (id: string, value: string | boolean | number) => void;
  handleCreateTemplate: () => void;
}

/**
 * Rule list page props
 */
export interface RuleListPageProps {
  vscode: VSCodeAPI;
  onRuleCardClick?: (ruleId: string) => void;
}

/**
 * Add rule page props
 */
export interface AddRulePageProps {
  vscode: VSCodeAPI;
}

/**
 * Plugin settings page props
 */
export interface PluginSettingsPageProps {
  config: ConfigItem[];
  handleConfigChange: (id: string, value: string | boolean | number) => void;
} 