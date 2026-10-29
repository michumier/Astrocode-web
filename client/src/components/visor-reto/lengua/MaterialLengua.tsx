import React, { useState } from 'react';
import { PropsMaterial } from '../MaterialGenerico';
import { PALETA } from '../paleta';
import Rejilla from './Rejilla';
import './Lengua.css';

// Pestaña 🛸 Ejemplos: cada escenario visible es una pareja entrada → respuesta de los alienígenas
const MaterialLengua: React.FC<PropsMaterial> = ({ material }) => {
  const [numeros, setNumeros] = useState(false);
  return (
    <div className="lengua-material">
      <div className="lengua-barra">
        <span>Estudia qué hacen los alienígenas con cada rejilla:</span>
        <label>
          <input type="checkbox" checked={numeros} onChange={(e) => setNumeros(e.target.checked)} /> 🔢 Ver números
        </label>
      </div>
      {material.map(({ nombre, material: m }) => (
        <section key={nombre} className="lengua-ejemplo">
          <h3>{nombre}</h3>
          <div className="lengua-pareja">
            <Rejilla celdas={m.entrada} titulo="Entrada" numeros={numeros} maximo={110} />
            <span className="lengua-flecha" aria-hidden="true">➜</span>
            <Rejilla celdas={m.salida} titulo="Respuesta" numeros={numeros} maximo={110} />
          </div>
        </section>
      ))}
      <p className="lengua-leyenda">
        {PALETA.map((p, i) => (
          <span key={p.nombre}><i style={{ background: p.color }} /> {i} {p.nombre}</span>
        ))}
      </p>
    </div>
  );
};

export default MaterialLengua;
