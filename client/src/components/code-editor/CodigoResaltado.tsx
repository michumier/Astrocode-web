import React, { useMemo } from 'react';
import { parser } from '@lezer/python';
import { highlightCode, tagHighlighter } from '@lezer/highlight';
import { REGLAS_RESALTADO } from './colores';

// Mismas reglas que el editor, pero dando nombres de clase para pintarlos aquí sin CodeMirror
const resaltador = tagHighlighter(REGLAS_RESALTADO.map(({ tag, clase }) => ({ tag, class: clase })));
const ESTILOS: Record<string, React.CSSProperties> = Object.fromEntries(
  REGLAS_RESALTADO.map(({ clase, color, cursiva }) => [clase, { color, fontStyle: cursiva ? 'italic' : undefined }]),
);

// Código Python de solo lectura con los colores del editor (guía de Python)
// Se puede enfocar con el teclado: en pantallas estrechas el código se desplaza de lado
const CodigoResaltado: React.FC<{ codigo: string; etiqueta: string; className?: string }> = ({ codigo, etiqueta, className }) => {
  const lineas = useMemo(() => {
    const salida: React.ReactNode[][] = [[]];
    let n = 0;
    highlightCode(
      codigo,
      parser.parse(codigo),
      resaltador,
      (texto, clases) => {
        const estilo = clases ? ESTILOS[clases.split(' ')[0]] : undefined;
        salida[salida.length - 1].push(estilo ? <span key={n++} style={estilo}>{texto}</span> : texto);
      },
      () => salida.push([]),
    );
    return salida;
  }, [codigo]);

  return (
    <pre className={className} tabIndex={0} aria-label={etiqueta}>
      <code>{lineas.map((linea, i) => <React.Fragment key={i}>{linea}{i < lineas.length - 1 ? '\n' : null}</React.Fragment>)}</code>
    </pre>
  );
};

export default CodigoResaltado;
