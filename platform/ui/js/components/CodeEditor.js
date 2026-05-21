import { h } from '/vendor/preact/preact.module.js';
import { useEffect, useRef } from '/vendor/preact/hooks.module.js';
import htm from '/vendor/htm/htm.module.js';
import { EditorState, EditorView, basicSetup, python, oneDark, keymap } from '/vendor/codemirror/codemirror.bundle.js';
import store from '../state.js';

const html = htm.bind(h);

export function CodeEditor({ currentFile, fileContents, editableFiles }) {
  const containerRef = useRef(null);
  const viewRef = useRef(null);
  const statesRef = useRef({}); // Stores EditorState instances per file to preserve undo history and scroll position

  // Helper to check if file is editable
  const isEditable = currentFile ? editableFiles.includes(currentFile) : false;

  // Handle saving the file
  const handleSave = () => {
    if (!currentFile || !viewRef.current) return;
    const content = viewRef.current.state.doc.toString();
    store.saveFile(currentFile, content);
  };

  // 1. Initialize Editor View once on mount
  useEffect(() => {
    if (!containerRef.current) return;

    const view = new EditorView({
      parent: containerRef.current
    });

    viewRef.current = view;

    return () => {
      view.destroy();
    };
  }, []);

  // 2. Load or restore state when currentFile changes
  useEffect(() => {
    const view = viewRef.current;
    if (!view || !currentFile) return;

    // Save previous file's state
    const previousFile = Object.keys(statesRef.current).find(
      key => statesRef.current[key] === view.state
    );
    if (previousFile && previousFile !== currentFile) {
      statesRef.current[previousFile] = view.state;
    }

    const savedState = statesRef.current[currentFile];

    if (savedState) {
      // Restore state
      view.setState(savedState);
    } else {
      // Create new state
      const content = fileContents[currentFile] || "";
      const state = EditorState.create({
        doc: content,
        extensions: [
          basicSetup,
          python(),
          oneDark,
          EditorView.editable.of(isEditable),
          EditorView.lineWrapping,
          keymap.of([
            {
              key: "Mod-s",
              run: () => {
                handleSave();
                return true;
              }
            }
          ])
        ]
      });
      statesRef.current[currentFile] = state;
      view.setState(state);
    }

    // Set focus
    view.focus();

  }, [currentFile]);

  // 3. Keep state sync if fileContents updates externally
  useEffect(() => {
    const view = viewRef.current;
    if (!view || !currentFile) return;

    const currentDoc = view.state.doc.toString();
    const externalDoc = fileContents[currentFile];

    if (externalDoc !== undefined && currentDoc !== externalDoc) {
      // Re-create state to sync contents (e.g. initial loads or resets)
      const state = EditorState.create({
        doc: externalDoc,
        extensions: [
          basicSetup,
          python(),
          oneDark,
          EditorView.editable.of(isEditable),
          EditorView.lineWrapping,
          keymap.of([
            {
              key: "Mod-s",
              run: () => {
                handleSave();
                return true;
              }
            }
          ])
        ]
      });
      statesRef.current[currentFile] = state;
      view.setState(state);
    }
  }, [fileContents, currentFile]);

  return html`
    <div id="editor" ref=${containerRef}></div>
  `;
}

export default CodeEditor;
