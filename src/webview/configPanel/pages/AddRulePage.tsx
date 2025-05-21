/**
 * configPanel/pages/AddRulePage.tsx
 * 
 * Add/Create new rule page component
 */
import * as React from 'react';
import { useState } from 'react';
import { VSCodeAPI } from '../types';
import { TechStackCriteria } from '../../../types';
import '../styles/Pages.css';
import '../styles/AddRulePage.css';

interface AddRulePageProps {
  vscode: VSCodeAPI;
}

export const AddRulePage: React.FC<AddRulePageProps> = ({ vscode }) => {
  // Form state
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [content, setContent] = useState<string>('# Rule Title\n\n## Section 1\n- Guideline 1\n- Guideline 2\n\n## Section 2\n- Guideline 3\n- Guideline 4');
  
  // Tech stack criteria
  const [languages, setLanguages] = useState<string>('');
  const [frameworks, setFrameworks] = useState<string>('');
  const [libraries, setLibraries] = useState<string>('');
  const [tools, setTools] = useState<string>('');
  
  // Error state
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!name.trim()) {
      setError('Rule name is required');
      return;
    }
    
    if (!content.trim()) {
      setError('Rule content is required');
      return;
    }
    
    // Build tech stack criteria
    const techStack: TechStackCriteria = {};
    
    if (languages.trim()) {
      techStack.languages = languages.split(',').map(lang => lang.trim());
    }
    
    if (frameworks.trim()) {
      techStack.frameworks = frameworks.split(',').map(framework => framework.trim());
    }
    
    if (libraries.trim()) {
      techStack.libraries = libraries.split(',').map(lib => lib.trim());
    }
    
    if (tools.trim()) {
      techStack.tools = tools.split(',').map(tool => tool.trim());
    }
    
    // Build rule data
    const ruleData = {
      name,
      description,
      content,
      techStack: Object.keys(techStack).length > 0 ? techStack : undefined
    };
    
    // Send to extension
    setSaving(true);
    setError(null);
    
    vscode.postMessage({
      type: 'createRule',
      rule: ruleData
    });
  };
  
  // Handle cancel
  const handleCancel = () => {
    vscode.postMessage({
      type: 'navigateTo',
      page: 'rules'
    });
  };

  // Listen for response from extension
  React.useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      
      if (message.type === 'ruleCreated') {
        setSaving(false);
        
        if (message.success) {
          // Navigate back to rule list
          vscode.postMessage({
            type: 'navigateTo',
            page: 'rules'
          });
        } else {
          setError(message.error || 'Failed to create rule');
        }
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [vscode]);

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h2>Add New Rule</h2>
          <p className="page-description">
            Create a new Cursor Rule for your project.
          </p>
        </div>
      </div>

      {error && (
        <div className="error-message form-error">
          <div className="error-icon">⚠️</div>
          <div className="error-detail">{error}</div>
        </div>
      )}

      <form className="rule-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="rule-name">Rule Name *</label>
          <input 
            type="text" 
            id="rule-name" 
            value={name} 
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter rule name"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="rule-description">Description</label>
          <input 
            type="text" 
            id="rule-description" 
            value={description} 
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of the rule"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="rule-content">Rule Content *</label>
          <textarea 
            id="rule-content" 
            value={content} 
            onChange={(e) => setContent(e.target.value)}
            rows={12}
            placeholder="Enter rule content in Markdown format"
            required
          />
        </div>
        
        <fieldset className="tech-stack-fieldset">
          <legend>Tech Stack Criteria</legend>
          <p className="fieldset-description">Specify which tech stack this rule applies to (comma-separated values)</p>
          
          <div className="form-group">
            <label htmlFor="tech-languages">Languages</label>
            <input 
              type="text" 
              id="tech-languages" 
              value={languages} 
              onChange={(e) => setLanguages(e.target.value)}
              placeholder="e.g. TypeScript, JavaScript"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="tech-frameworks">Frameworks</label>
            <input 
              type="text" 
              id="tech-frameworks" 
              value={frameworks} 
              onChange={(e) => setFrameworks(e.target.value)}
              placeholder="e.g. React, Next.js"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="tech-libraries">Libraries</label>
            <input 
              type="text" 
              id="tech-libraries" 
              value={libraries} 
              onChange={(e) => setLibraries(e.target.value)}
              placeholder="e.g. Redux, Tailwind"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="tech-tools">Tools</label>
            <input 
              type="text" 
              id="tech-tools" 
              value={tools} 
              onChange={(e) => setTools(e.target.value)}
              placeholder="e.g. Webpack, ESLint"
            />
          </div>
        </fieldset>
        
        <div className="form-actions">
          <button type="button" className="cancel-button" onClick={handleCancel}>
            Cancel
          </button>
          <button type="submit" className="submit-button" disabled={saving}>
            {saving ? 'Creating...' : 'Create Rule'}
          </button>
        </div>
      </form>
    </div>
  );
}; 