import { h } from '/vendor/preact/preact.module.js';
import htm from '/vendor/htm/htm.module.js';
import store from '../state.js';

const html = htm.bind(h);

export function LabSelector({ activeLab }) {
  const onChange = (e) => {
    store.switchLab(e.target.value);
  };

  return html`
    <div class="topbar-left">
      <span class="logo">⚡ microlab</span>
      <select value=${activeLab} onChange=${onChange}>
        <option value="01">Lab 01 — Monólito</option>
        <option value="02">Lab 02 — Monólito Modular</option>
        <option value="03">Lab 03 — Quebra de Serviços</option>
        <option value="04">Lab 04 — Mensageria</option>
        <option value="05">Lab 05 — Escalabilidade</option>
      </select>
    </div>
  `;
}

export default LabSelector;
