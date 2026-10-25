import React, { useEffect, useRef } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { keymap, Decoration, DecorationSet, placeholder as placeholderExt } from '@codemirror/view';
import { EditorState, StateEffect, StateField, Compartment } from '@codemirror/state';
import { indentUnit } from '@codemirror/language';
import { python } from '@codemirror/lang-python';
import { oneDark } from '@codemirror/theme-one-dark';
import './CodeEditor.css';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  // Ctrl+Enter
  onRun?: () => void;
  // Línea (1-based) donde Python dio error: se marca en rojo
  lineaError?: number | null;
  // Línea que se está ejecutando (la usará la caja negra)
  lineaActiva?: number | null;
  readOnly?: boolean;
  placeholder?: string;
}

// ---- Marcado de líneas (error y línea activa) mediante decoraciones ----
const marcarLineas = StateEffect.define<{ error: number | null; activa: number | null }>();

const lineaErrorDeco = Decoration.line({ class: 'cm-linea-error' });
const lineaActivaDeco = Decoration.line({ class: 'cm-linea-activa' });

const campoLineas = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update(decos, tr) {
    decos = decos.map(tr.changes);
    for (const efecto of tr.effects) {
      if (efecto.is(marcarLineas)) {
        const marcas = [];
        const { error, activa } = efecto.value;
        const total = tr.state.doc.lines;
        if (activa && activa >= 1 && activa <= total) {
          marcas.push(lineaActivaDeco.range(tr.state.doc.line(activa).from));
        }
        if (error && error >= 1 && error <= total && error !== activa) {
          marcas.push(lineaErrorDeco.range(tr.state.doc.line(error).from));
        }
        marcas.sort((a, b) => a.from - b.from);
        decos = Decoration.set(marcas);
      }
    }
    return decos;
  },
  provide: (campo) => EditorView.decorations.from(campo),
});

const CodeEditor: React.FC<CodeEditorProps> = ({ value, onChange, onRun, lineaError = null, lineaActiva = null, readOnly = false, placeholder }) => {
  const contenedor = useRef<HTMLDivElement>(null);
  const vista = useRef<EditorView | null>(null);
  // Las props cambian en cada render: se leen desde refs dentro de los callbacks del editor
  const onChangeRef = useRef(onChange);
  const onRunRef = useRef(onRun);
  onChangeRef.current = onChange;
  onRunRef.current = onRun;
  const soloLectura = useRef(new Compartment());

  // Crear el editor una sola vez
  useEffect(() => {
    if (!contenedor.current) return;
    const view = new EditorView({
      parent: contenedor.current,
      state: EditorState.create({
        doc: value,
        extensions: [
          keymap.of([
            { key: 'Mod-Enter', preventDefault: true, run: () => { onRunRef.current?.(); return true; } },
          ]),
          basicSetup,
          python(),
          oneDark,
          indentUnit.of('    '),
          EditorState.tabSize.of(4),
          campoLineas,
          soloLectura.current.of(EditorState.readOnly.of(readOnly)),
          placeholder ? placeholderExt(placeholder) : [],
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              onChangeRef.current(update.state.doc.toString());
            }
          }),
          EditorView.contentAttributes.of({ 'aria-label': 'Editor de código Python' }),
        ],
      }),
    });
    vista.current = view;
    return () => view.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Si el valor cambia desde fuera (reset, otro ejercicio), sustituir el contenido
  useEffect(() => {
    const view = vista.current;
    if (view && value !== view.state.doc.toString()) {
      view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: value } });
    }
  }, [value]);

  useEffect(() => {
    vista.current?.dispatch({ effects: marcarLineas.of({ error: lineaError, activa: lineaActiva }) });
  }, [lineaError, lineaActiva, value]);

  useEffect(() => {
    vista.current?.dispatch({ effects: soloLectura.current.reconfigure(EditorState.readOnly.of(readOnly)) });
  }, [readOnly]);

  return <div ref={contenedor} className="code-editor-cm" data-testid="code-editor" />;
};

export default CodeEditor;

// Busca la línea del error en el traceback de Python (la última referencia al archivo del alumno)
export function lineaDeError(stderr: string | null | undefined): number | null {
  if (!stderr) return null;
  const coincidencias = Array.from(stderr.matchAll(/File "[^"]*main\.py", line (\d+)/g));
  if (coincidencias.length === 0) return null;
  return Number(coincidencias[coincidencias.length - 1][1]);
}
