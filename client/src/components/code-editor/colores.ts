import { Tag, tags as t } from '@lezer/highlight';

// Paleta del código (fase 6.2). Va aparte de tema.ts para que el código de solo lectura
// (CodigoResaltado) la use sin cargar CodeMirror
export const colores = {
  fondo: '#0a1521',
  texto: '#e6eef6',
  tenue: '#6b8299', // números de línea: el más apagado que aún pasa AA (4,6:1)
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
