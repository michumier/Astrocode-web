import React from 'react';
import { PropsMaterial } from '../MaterialGenerico';
import { COLOR_CABLE } from './piezas';
import './Bomba.css';

// Pestaña 📕 Manual: las reglas y las bombas de los escenarios visibles
const MaterialBomba: React.FC<PropsMaterial> = ({ material }) => {
  const variante = material[0]?.material?.variante;
  const columnas: string[][] | undefined = material[0]?.material?.columnas;

  return (
    <div className="bomba-manual">
      <section>
        <h3>📕 Módulo de cables</h3>
        <p className="bomba-manual-nota">
          Las posiciones empiezan en 0 («el segundo» es la posición 1). Los cables no se mueven al cortarlos.
        </p>
        <h4>Paso 1 · Primer corte <small>(la primera regla que se cumpla)</small></h4>
        <ol>
          <li>Si no hay ningún cable rojo → corta el <strong>segundo</strong>.</li>
          <li>Si el último cable es blanco → corta el <strong>último</strong>.</li>
          <li>Si hay más de un cable azul → corta el <strong>último cable azul</strong>.</li>
          <li>Si la última cifra de la serie es impar → corta el <strong>último</strong>.</li>
          <li>En cualquier otro caso → corta el <strong>primero</strong>.</li>
        </ol>
        <h4>Paso 2 · ¿Otro corte? <small>(según el color del cable cortado)</small></h4>
        <ul>
          <li><strong>Azul</strong> → corta también el de su derecha (si era el último, nada más).</li>
          <li><strong>Rojo</strong> → nada más.</li>
          <li><strong>Otro color</strong> → si la serie tiene vocal, corta también el último que quede sin cortar.</li>
        </ul>
      </section>

      {variante === 'modulos' && (
        <section>
          <h3>🔴 Módulo del botón <small>(la primera regla que se cumpla)</small></h3>
          <ol>
            <li>Azul y pone «ABORTAR» → <strong>mantener</strong>.</li>
            <li>Más de una batería y pone «DETONAR» → <strong>pulsar</strong>.</li>
            <li>Blanco → <strong>mantener</strong>.</li>
            <li>En otro caso → <strong>pulsar</strong>.</li>
          </ol>
          <h3>⌨️ Módulo del teclado</h3>
          <p>Solo una columna contiene los 4 símbolos: púlsalos en el orden de esa columna.</p>
          {columnas && (
            <table className="bomba-columnas">
              <thead>
                <tr>{columnas.map((_, i) => <th key={i}>{'ABCD'[i]}</th>)}</tr>
              </thead>
              <tbody>
                {columnas[0].map((_, fila) => (
                  <tr key={fila}>{columnas.map((c, i) => <td key={i}>{c[fila]}</td>)}</tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}

      <section>
        <h3>🧨 Bombas de los escenarios visibles</h3>
        {material.map(({ nombre, material: m }) => (
          <div key={nombre} className="bomba-ficha">
            <strong>{nombre}</strong>
            <div className="bomba-ficha-cables">
              {m.bomba.cables.map((color: string, i: number) => (
                <span key={i} className="bomba-chip" style={{ borderColor: COLOR_CABLE[color]?.color }}>
                  <small>{i}</small> {color}
                </span>
              ))}
            </div>
            <span>Serie <code>{m.bomba.serie}</code></span>
            {variante === 'modulos' && (
              <span>
                {' · '}{m.bomba.baterias} baterías · botón {m.bomba.boton.color} «{m.bomba.boton.texto}» · teclado {m.bomba.teclado.join(' ')}
              </span>
            )}
          </div>
        ))}
      </section>
    </div>
  );
};

export default MaterialBomba;
