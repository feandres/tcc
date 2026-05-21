import { h } from '/vendor/preact/preact.module.js';
import htm from '/vendor/htm/htm.module.js';

const html = htm.bind(h);

export function ChallengesPanel({ challenges, testResults, onVerify, loading }) {
  
  const handleVerify = () => {
    onVerify();
  };

  return html`
    <div id="challenges-panel">
      <div class="action-area">
        <button 
          class="btn-primary" 
          onClick=${handleVerify} 
          disabled=${loading}
        >
          ${loading ? html`<span class="spinner" style="width: 14px; height: 14px; border-width: 2px;"></span> Validando...` : "▶ Verificar Código"}
        </button>
      </div>

      <div class="panel-content">
        <div id="challenges-list">
          ${challenges && challenges.length > 0
            ? challenges.map(ch => {
                // Find test result matching this challenge's testId
                const result = testResults.find(r => r.testId === ch.testId);
                const passed = result ? result.passed : null;

                let cardClass = "challenge-card pending";
                if (passed === true) {
                  cardClass = "challenge-card passed";
                } else if (passed === false) {
                  cardClass = "challenge-card failed";
                }

                return html`
                  <div key=${ch.id} class=${cardClass}>
                    <div class="challenge-header">
                      <span class="challenge-status">
                        <strong>${ch.title}</strong>
                      </span>
                      <span class="challenge-badge ${ch.type}">${ch.type}</span>
                    </div>
                    <p class="challenge-objective">${ch.objective}</p>
                    ${passed === false && result.message && html`
                      <div class="error-msg">${result.message}</div>
                    `}
                  </div>
                `;
              })
            : html`
                <div style="padding: 16px; color: var(--text-muted); font-size: 13px; text-align: center;">
                  Carregando desafios...
                </div>
              `
          }
        </div>
      </div>
    </div>
  `;
}

export default ChallengesPanel;
