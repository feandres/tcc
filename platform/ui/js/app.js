import { h, render } from '/vendor/preact/preact.module.js';
import { useState, useEffect } from '/vendor/preact/hooks.module.js';
import htm from '/vendor/htm/htm.module.js';
import store from './state.js';
import LabSelector from './components/LabSelector.js';
import FileExplorer from './components/FileExplorer.js';
import CodeEditor from './components/CodeEditor.js';
import MermaidViewer from './components/MermaidViewer.js';
import ToolViewer from './components/ToolViewer.js';
import ChallengesPanel from './components/ChallengesPanel.js';

const html = htm.bind(h);

function App() {
  const [state, setState] = useState(store.state);

  // Subscribe to central state updates
  useEffect(() => {
    const unsubscribe = store.subscribe((newState) => {
      setState(newState);
    });
    return unsubscribe;
  }, []);

  // Initial load of lab, challenges, tree
  useEffect(() => {
    const initialize = async () => {
      const activeLab = await store.loadStatus();
      await Promise.all([
        store.loadChallenges(),
        store.loadTree()
      ]);
      
      // Auto-open first editable file if available
      const challengesRes = await fetch(`/api/challenges/${activeLab}`);
      if (challengesRes.ok) {
        const challengesData = await challengesRes.json();
        if (challengesData.editableFiles && challengesData.editableFiles.length > 0) {
          store.loadFile(challengesData.editableFiles[0]);
        }
      }
      
      store.setState({ loading: false });
    };

    initialize();
  }, []);

  const handleTabClick = (file) => {
    store.loadFile(file);
    store.setState({ activeView: "code" }); // Switch view to code when tab is clicked
  };

  const handleViewChange = (viewKey) => {
    store.setState({ activeView: viewKey });
  };

  const handleVerify = () => {
    store.runVerification();
  };

  // Render view-specific switcher tabs
  const renderViewTabs = () => {
    const viewsList = Object.keys(state.views).filter(key => state.views[key].enabled);
    if (viewsList.length <= 1) return null; // No need for tabs if only code view exists

    return html`
      <div class="view-tabs">
        ${viewsList.map(key => html`
          <button 
            key=${key} 
            class="view-tab-btn ${state.activeView === key ? 'active' : ''}"
            onClick=${() => handleViewChange(key)}
          >
            ${state.views[key].title}
          </button>
        `)}
      </div>
    `;
  };

  // Render the central panel viewport
  const renderViewport = () => {
    switch (state.activeView) {
      case "code":
        return html`
          <${CodeEditor} 
            currentFile=${state.currentFile}
            fileContents=${state.fileContents}
            editableFiles=${state.editableFiles}
          />
        `;
      case "mermaid":
        return html`<${MermaidViewer} lab=${state.lab} />`;
      case "swagger":
        return html`<${ToolViewer} url=${state.views.swagger.url} title="Swagger API Documentation" />`;
      case "grafana":
        return html`<${ToolViewer} url=${state.views.grafana.url} title="Grafana Metrics" />`;
      default:
        return html`<div class="view-viewport" style="padding: 16px;">Visualização não suportada.</div>`;
    }
  };

  return html`
    <div id="app">
      <!-- 1. Topbar -->
      <header id="topbar">
        <${LabSelector} activeLab=${state.lab} />
        
        <!-- Editable Files Tabs (Only visible when editor is active) -->
        <div id="tabs">
          ${state.activeView === "code" && state.editableFiles.map(file => {
            const isActive = file === state.currentFile;
            const displayName = file.split("/").pop(); // Get filename only
            return html`
              <button 
                key=${file}
                class="file-tab ${isActive ? 'active' : ''}"
                onClick=${() => handleTabClick(file)}
              >
                ${displayName}
              </button>
            `;
          })}
        </div>

        <div class="topbar-right">
          <span id="save-status">${state.saveStatus}</span>
        </div>
      </header>

      <!-- 2. Main Layout Container -->
      <main id="layout">
        <!-- Left: File Explorer Sidebar -->
        <aside id="sidebar">
          <${FileExplorer} 
            tree=${state.tree} 
            currentFile=${state.currentFile}
            editableFiles=${state.editableFiles}
          />
        </aside>

        <!-- Center: Dynamic View Area -->
        <section id="editor-container">
          ${renderViewTabs()}
          ${renderViewport()}
        </section>

        <!-- Right: Guided Challenge Tracker Panel -->
        <${ChallengesPanel} 
          challenges=${state.challenges}
          testResults=${state.testResults}
          onVerify=${handleVerify}
          loading=${state.loading && state.loadingText.includes("testes")}
        />
      </main>

      <!-- 3. Global Full-screen loading backdrop -->
      ${state.loading && !state.loadingText.includes("testes") && html`
        <div id="loader">
          <div class="spinner"></div>
          <div id="loader-text">${state.loadingText}</div>
        </div>
      `}
    </div>
  `;
}

// Bootstrap Preact application
render(html`<${App} />`, document.body);
