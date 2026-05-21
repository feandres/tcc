import { h } from '/vendor/preact/preact.module.js';
import htm from '/vendor/htm/htm.module.js';

const html = htm.bind(h);

export function ToolViewer({ url, title }) {
  if (!url) {
    return html`
      <div class="view-viewport" style="display: flex; align-items: center; justify-content: center; color: var(--text-muted);">
        Nenhuma ferramenta carregada para esta aba.
      </div>
    `;
  }

  return html`
    <div class="view-viewport">
      <iframe 
        src=${url} 
        title=${title || "Ferramenta Externa"} 
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
      ></iframe>
    </div>
  `;
}

export default ToolViewer;
