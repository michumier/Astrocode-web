import { EditorView } from '@codemirror/view';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { Tag, tags as t } from '@lezer/highlight';

// Tema del editor con la paleta de AstroCode (fase 6.2), en lugar de «One Dark»
const colores = {
  fondo: '#0a1521',
  texto: '#e6eef6',
  tenue: '#46607a',
  linea: 'rgba(255, 255, 255, 0.035)',
  seleccion: 'rgba(244, 185, 66, 0.22)',
  cursor: '#f4b942',
  clave: '#ff9e7a',
  cadena: '#9be2c9',
  comentario: '#7189a3',
  funcion: '#f4b942',
  numero: '#c9a7ff',
  propiedad: '#8fd3ff',
};

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

// Reglas de color del código: las usan el editor y el código de solo lectura (CodigoResaltado)
export const REGLAS_RESALTADO: { tag: Tag | Tag[]; clase: string; color: string; cursiva?: boolean }[] = [
  { tag: [t.keyword, t.controlKeyword, t.operatorKeyword, t.definitionKeyword, t.moduleKeyword], clase: 'clave', color: colores.clave },
  { tag: [t.string, t.special(t.string)], clase: 'cadena', color: colores.cadena },
  { tag: t.comment, clase: 'comentario', color: colores.comentario, cursiva: true },
  { tag: [t.function(t.variableName), t.function(t.propertyName), t.definition(t.function(t.variableName))], clase: 'funcion', color: colores.funcion },
  { tag: [t.number, t.bool, t.null, t.atom], clase: 'numero', color: colores.numero },
  { tag: [t.propertyName, t.className, t.definition(t.className)], clase: 'propiedad', color: colores.propiedad },
  { tag: [t.self, t.standard(t.variableName)], clase: 'propio', color: colores.numero, cursiva: true },
  { tag: t.invalid, clase: 'invalido', color: '#ff6b7d' },
];

export const resaltado = HighlightStyle.define(
  REGLAS_RESALTADO.map(({ tag, color, cursiva }) => ({ tag, color, ...(cursiva ? { fontStyle: 'italic' } : {}) })),
);

export const temaAstro = [tema, syntaxHighlighting(resaltado)];
