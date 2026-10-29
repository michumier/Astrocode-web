import React from 'react';
import './Enunciado.css';

// Pinta **negrita** y `código` dentro de una línea. Todo es texto: no se usa innerHTML.
export const enLinea = (texto: string): React.ReactNode[] =>
  texto.split(/(\*\*[^*\n]+\*\*|`[^`\n]+`)/g).map((parte, i) => {
    if (parte.startsWith('**') && parte.endsWith('**') && parte.length > 4) return <strong key={i}>{parte.slice(2, -2)}</strong>;
    if (parte.startsWith('`') && parte.endsWith('`') && parte.length > 2) return <code key={i}>{parte.slice(1, -1)}</code>;
    return <React.Fragment key={i}>{parte}</React.Fragment>;
  });

const VINETA = /^\s*[-*•]\s+/;

// Una línea corta que termina en «:» (con o sin negrita) es el título de lo que viene debajo
const esEtiqueta = (linea: string) => {
  const limpia = linea.trim().replace(/^\*\*(.*)\*\*$/, '$1');
  return limpia.endsWith(':') && limpia.length <= 48 && !VINETA.test(linea);
};

const textoEtiqueta = (linea: string) => linea.trim().replace(/^\*\*(.*)\*\*$/, '$1').replace(/:$/, '');

type Bloque =
  | { tipo: 'titulo'; texto: string }
  | { tipo: 'parrafo'; lineas: string[] }
  | { tipo: 'lista'; items: string[] };

// Convierte el enunciado (párrafos separados por líneas en blanco, etiquetas «Objetivos:» y listas
// con guiones) en bloques. Exportada para las pruebas.
export function analizarEnunciado(texto: string): Bloque[] {
  const bloques: Bloque[] = [];
  for (const crudo of texto.replace(/\r\n/g, '\n').split(/\n\s*\n/)) {
    const lineas = crudo.split('\n').filter((l) => l.trim());
    let parrafo: string[] = [];
    let lista: string[] = [];
    const cerrar = () => {
      if (parrafo.length) bloques.push({ tipo: 'parrafo', lineas: parrafo });
      if (lista.length) bloques.push({ tipo: 'lista', items: lista });
      parrafo = [];
      lista = [];
    };
    for (const linea of lineas) {
      if (VINETA.test(linea)) {
        if (parrafo.length) { bloques.push({ tipo: 'parrafo', lineas: parrafo }); parrafo = []; }
        lista.push(linea.replace(VINETA, ''));
      } else if (esEtiqueta(linea)) {
        cerrar();
        bloques.push({ tipo: 'titulo', texto: textoEtiqueta(linea) });
      } else {
        if (lista.length) { bloques.push({ tipo: 'lista', items: lista }); lista = []; }
        parrafo.push(linea.trim());
      }
    }
    cerrar();
  }
  return bloques;
}

const Enunciado: React.FC<{ texto: string; className?: string }> = ({ texto, className }) => (
  <div className={['enunciado', className].filter(Boolean).join(' ')}>
    {analizarEnunciado(texto).map((b, i) => {
      if (b.tipo === 'titulo') return <h3 key={i}>{enLinea(b.texto)}</h3>;
      if (b.tipo === 'lista') return <ul key={i}>{b.items.map((item, j) => <li key={j}>{enLinea(item)}</li>)}</ul>;
      return (
        <p key={i}>
          {b.lineas.map((l, j) => <React.Fragment key={j}>{j > 0 && <br />}{enLinea(l)}</React.Fragment>)}
        </p>
      );
    })}
  </div>
);

export default Enunciado;
