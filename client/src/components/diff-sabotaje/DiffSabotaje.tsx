import React from 'react';
import './DiffSabotaje.css';

// Diff coloreado de un sabotaje: líneas con - (antes, en rojo) y + (después, en verde)
const DiffSabotaje: React.FC<{ diff: string }> = ({ diff }) => (
  <pre className="diff-sabotaje">
    {diff
      .split('\n')
      .filter((l) => !l.startsWith('---') && !l.startsWith('+++') && !l.startsWith('@@'))
      .map((linea, i) => (
        <span key={i} className={linea.startsWith('-') ? 'diff-quitada' : linea.startsWith('+') ? 'diff-anadida' : ''}>
          {linea}
          {'\n'}
        </span>
      ))}
  </pre>
);

export default DiffSabotaje;
