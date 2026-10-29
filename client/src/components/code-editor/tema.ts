import { EditorView } from '@codemirror/view';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { colores, REGLAS_RESALTADO } from './colores';

const tema = EditorView.theme({
  '&': { color: colores.texto, backgroundColor: colores.fondo },
  '.cm-content': { caretColor: colores.cursor, fontFamily: 'var(--ac-mono)' },
  '.cm-cursor, .cm-dropCursor': { borderLeftColor: colores.cursor, borderLeftWidth: '2px' },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': { backgroundColor: colores.seleccion },
  '.cm-activeLine': { backgroundColor: colores.linea },
  '.cm-gutters': { backgroundColor: colores.fondo, color: colores.tenue, border: 'none' },
  '.cm-activeLineGutter': { backgroundColor: colores.linea, color: '#a9bccf' },
  '.cm-matchingBracket, .cm-nonmatchingBracket': { backgroundColor: 'rgba(92, 200, 194, 0.22)', outline: 'none' },
  '.cm-placeholder': { color: colores.tenue },
  '.cm-tooltip': { backgroundColor: '#1c3149', border: 'none', borderRadius: '10px', color: colores.texto },
  '.cm-tooltip-autocomplete > ul > li[aria-selected]': { backgroundColor: '#233b57', color: colores.texto },
  '.cm-foldPlaceholder': { backgroundColor: '#1c3149', border: 'none', color: '#a9bccf' },
}, { dark: true });

export const resaltado = HighlightStyle.define(
  REGLAS_RESALTADO.map(({ tag, color, cursiva }) => ({ tag, color, ...(cursiva ? { fontStyle: 'italic' } : {}) })),
);

export const temaAstro = [tema, syntaxHighlighting(resaltado)];
