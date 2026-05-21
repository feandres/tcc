import { h } from '/vendor/preact/preact.module.js';
import htm from '/vendor/htm/htm.module.js';
import store from '../state.js';

const html = htm.bind(h);

export function FileExplorer({ tree, currentFile, editableFiles }) {
  
  const onFileClick = (path) => {
    store.loadFile(path);
  };

  const renderNodes = (nodes) => {
    return nodes.map(node => {
      if (node.type === "dir") {
        return html`
          <div key=${node.name}>
            <div class="tree-item folder">
               ${node.name}
            </div>
            <div class="children">
              ${renderNodes(node.children || [])}
            </div>
          </div>
        `;
      } else {
        const isEditable = editableFiles.includes(node.path);
        const isActive = node.path === currentFile;
        const classes = `tree-item file ${isActive ? 'active' : ''} ${!isEditable ? 'readonly' : ''}`;
        
        return html`
          <div 
            key=${node.path} 
            class=${classes} 
            onClick=${() => onFileClick(node.path)}
          >
            ${node.name} ${!isEditable && html`<span style="font-size: 10px; color: var(--text-muted); opacity: 0.8;">(locked)</span>`}
          </div>
        `;
      }
    });
  };

  return html`
    <div style="display: flex; flex-direction: column; height: 100%;">
      <div class="explorer-header">Explorador</div>
      <div class="tree-container">
        ${tree && tree.length > 0 
          ? renderNodes(tree) 
          : html`<div style="padding: 12px; color: var(--text-muted); font-size: 13px;">Carregando arquivos...</div>`
        }
      </div>
    </div>
  `;
}

export default FileExplorer;
