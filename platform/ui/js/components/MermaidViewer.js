import { h } from '/vendor/preact/preact.module.js';
import { useEffect, useRef, useState } from '/vendor/preact/hooks.module.js';
import htm from '/vendor/htm/htm.module.js';

const mermaid = window.mermaid;
const html = htm.bind(h);

export function MermaidViewer({ lab }) {
  const containerRef = useRef(null);
  const [diagramText, setDiagramText] = useState("");
  const [error, setError] = useState(false);

  // Initialize mermaid once on component mount
  useEffect(() => {
    try {
      mermaid.initialize({
        startOnLoad: false,
        theme: 'dark',
        themeVariables: {
          background: '#0d0f12',
          primaryColor: '#1e222b',
          primaryTextColor: '#f0f3f6',
          lineColor: '#3b4252'
        },
        securityLevel: 'loose'
      });
    } catch (err) {
      console.error("Erro ao inicializar Mermaid:", err);
    }
  }, []);

  // Fetch diagram content whenever the active lab changes
  useEffect(() => {
    const fetchDiagram = async () => {
      setError(false);
      try {
        const res = await fetch(`/api/diagram/${lab}`);
        if (!res.ok) throw new Error();
        const text = await res.text();
        setDiagramText(text);
      } catch (err) {
        console.warn("Diagrama não encontrado ou erro na rota do diagrama para o lab:", lab);
        setDiagramText("");
        setError(true);
      }
    };
    fetchDiagram();
  }, [lab]);

  // Render SVG when diagramText changes
  useEffect(() => {
    if (!diagramText || !containerRef.current) return;

    const renderSVG = async () => {
      try {
        const uniqueId = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        const { svg } = await mermaid.render(uniqueId, diagramText);
        if (containerRef.current) {
          containerRef.current.innerHTML = svg;
        }
      } catch (err) {
        console.error("Erro ao renderizar SVG do Mermaid:", err);
        // Clear broken syntax states internally
        const badEl = document.getElementById(uniqueId);
        if (badEl) badEl.remove();
        
        if (containerRef.current) {
          containerRef.current.innerHTML = `
            <div style="padding: 24px; color: var(--danger); font-size: 13px; text-align: center;">
              ❌ Erro ao renderizar o diagrama Mermaid do Lab.
            </div>
          `;
        }
      }
    };

    renderSVG();
  }, [diagramText]);

  if (error) {
    return html`
      <div class="view-viewport" style="display: flex; align-items: center; justify-content: center; color: var(--text-muted);">
        Nenhum diagrama de arquitetura disponível para este laboratório.
      </div>
    `;
  }

  return html`
    <div class="view-viewport">
      <div class="mermaid-container" ref=${containerRef}>
        <div style="color: var(--text-muted); font-size: 13px;">Carregando diagrama...</div>
      </div>
    </div>
  `;
}

export default MermaidViewer;
