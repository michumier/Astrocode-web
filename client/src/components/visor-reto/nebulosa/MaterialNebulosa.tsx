import React, { useState } from 'react';
import { PropsMaterial } from '../MaterialGenerico';
import { PALETA } from '../paleta';
import Lienzo from './Lienzo';
import './Nebulosa.css';

// Pestaña 🎯 Objetivos: la imagen que hay que pintar en cada lienzo visible
const MaterialNebulosa: React.FC<PropsMaterial> = ({ material }) => {
  const [pixel, setPixel] = useState<{ nombre: string; x: number; y: number; color: string } | null>(null);
  return (
    <div className="nebulosa-material">
      <div className="nebulosa-lienzos">
        {material.map(({ nombre, material: m }) => (
          <Lienzo key={nombre} imagen={m.objetivo} ancho={m.ancho} alto={m.alto} titulo={nombre}
            onPixel={(p) => setPixel(p ? { nombre, ...p, color: m.objetivo[p.y * m.ancho + p.x] } : null)} />
        ))}
      </div>
      <p className="nebulosa-pixel">
        {pixel
          ? <>{pixel.nombre} · (x={pixel.x}, y={pixel.y}) · <strong>{PALETA[Number(pixel.color)]?.nombre}</strong> ({pixel.color})</>
          : 'Pasa el ratón por la imagen: la esquina de arriba a la izquierda es (0, 0) y la y crece hacia abajo.'}
      </p>
      <p className="nebulosa-leyenda">
        {PALETA.map((p, i) => (
          <span key={p.nombre}><i style={{ background: p.color }} /> {i} {p.nombre}</span>
        ))}
      </p>
    </div>
  );
};

export default MaterialNebulosa;
