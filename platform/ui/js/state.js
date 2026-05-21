// State Manager - Centralized Pub/Sub Store

class Store {
  constructor() {
    this.listeners = [];
    this.state = {
      lab: "01",
      activeView: "code",
      views: {
        code: { enabled: true, title: "Código" }
      },
      tree: [],
      editableFiles: [],
      readonlyFiles: [],
      currentFile: null,
      fileContents: {}, // maps file path to content string
      testResults: [],
      challenges: [],
      loading: true,
      loadingText: "Carregando status do laboratório...",
      saveStatus: ""
    };
  }

  // Subscribe a component to state updates
  subscribe(listener) {
    this.listeners.push(listener);
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Update state and notify all subscribers
  setState(update) {
    this.state = { ...this.state, ...update };
    this.notify();
  }

  notify() {
    this.listeners.forEach(listener => listener(this.state));
  }

  // Action: Load initial active lab status
  async loadStatus() {
    try {
      const res = await fetch("/api/status");
      if (!res.ok) throw new Error("Erro na rota de status");
      const data = await res.json();
      const lab = data.labAtivo || "01";
      this.setState({ lab });
      return lab;
    } catch (err) {
      console.warn("Erro ao obter status. Usando lab padrão '01'.", err);
      return "01";
    }
  }

  // Action: Switch active lab (POST /api/lab/:num)
  async switchLab(num) {
    const formattedLab = num.padStart(2, "0");
    this.setState({ loading: true, loadingText: `Alternando para o Laboratório ${formattedLab}...` });
    try {
      const res = await fetch(`/api/lab/${formattedLab}`, { method: "POST" });
      if (!res.ok) throw new Error("Falha ao se comunicar com o orquestrador.");
      
      // Force reload to completely refresh the environment
      window.location.reload();
    } catch (err) {
      alert(`Erro ao trocar de laboratório: ${err.message}`);
      this.setState({ loading: false });
    }
  }

  // Action: Load challenges manifest (GET /api/challenges/:lab)
  async loadChallenges() {
    const lab = this.state.lab;
    try {
      const res = await fetch(`/api/challenges/${lab}`);
      if (!res.ok) throw new Error("Manifesto não encontrado");
      const data = await res.json();
      
      // Determine what views/features are available for this lab
      const views = {
        code: { enabled: true, title: "Editor" }
      };

      if (data.diagram) {
        views.mermaid = { enabled: true, title: "Arquitetura", file: data.diagram };
      }

      // Automatically enable Swagger/API docs for FastAPI labs
      if (data.stack && data.stack.includes("fastapi")) {
        const port = 8000 + parseInt(lab, 10);
        views.swagger = { enabled: true, title: "Swagger API", url: `http://localhost:${port}/docs` };
      }

      // Add conditional observability views if we are in lab 05
      if (lab === "05") {
        views.grafana = { enabled: true, title: "Grafana", url: "http://localhost/grafana" };
      }

      this.setState({
        challenges: data.challenges || [],
        editableFiles: data.editableFiles || [],
        readonlyFiles: data.readonlyFiles || [],
        views
      });
    } catch (err) {
      console.error("Erro ao carregar desafios:", err);
    }
  }

  // Action: Load file list explorer (GET /api/tree/:lab)
  async loadTree() {
    const lab = this.state.lab;
    try {
      const res = await fetch(`/api/tree/${lab}`);
      if (!res.ok) throw new Error("Erro na árvore");
      const tree = await res.json();
      this.setState({ tree });
    } catch (err) {
      console.error("Erro ao carregar árvore de arquivos:", err);
      this.setState({ tree: [] });
    }
  }

  // Action: Load file content (GET /api/files/:lab/:path)
  async loadFile(path) {
    if (this.state.fileContents[path] !== undefined) {
      this.setState({ currentFile: path });
      return this.state.fileContents[path];
    }

    const lab = this.state.lab;
    try {
      const res = await fetch(`/api/files/${lab}/${path}`);
      if (!res.ok) throw new Error("Não foi possível carregar o arquivo.");
      const content = await res.text();
      
      const fileContents = { ...this.state.fileContents, [path]: content };
      this.setState({
        currentFile: path,
        fileContents
      });
      return content;
    } catch (err) {
      alert(err.message);
      return "";
    }
  }

  // Action: Save active file content (PUT /api/files/:lab/:path)
  async saveFile(path, content) {
    this.setState({ saveStatus: "Salvando..." });
    const lab = this.state.lab;
    try {
      const res = await fetch(`/api/files/${lab}/${path}`, {
        method: "PUT",
        headers: { "Content-Type": "text/plain" },
        body: content
      });

      if (!res.ok) throw new Error("Falha ao salvar.");

      const fileContents = { ...this.state.fileContents, [path]: content };
      this.setState({ fileContents, saveStatus: "Salvo." });
      
      setTimeout(() => {
        if (this.state.saveStatus === "Salvo.") {
          this.setState({ saveStatus: "" });
        }
      }, 2000);
    } catch (err) {
      this.setState({ saveStatus: "Erro ao salvar!" });
    }
  }

  // Action: Execute unit tests (POST /api/tests/:lab)
  async runVerification() {
    const lab = this.state.lab;
    this.setState({ loading: true, loadingText: "Executando testes automatizados dentro do container..." });
    try {
      const res = await fetch(`/api/tests/${lab}`, { method: "POST" });
      if (!res.ok) throw new Error("Erro na comunicação de testes");
      const data = await res.json();
      this.setState({ testResults: data.results || [], loading: false });
    } catch (err) {
      alert("Erro ao validar código. Verifique se o container do lab está rodando.");
      this.setState({ loading: false });
    }
  }
}

export const store = new Store();
export default store;
