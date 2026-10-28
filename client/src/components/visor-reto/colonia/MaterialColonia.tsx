import React from 'react';
import { PropsMaterial } from '../MaterialGenerico';
import MapaColonia from './MapaColonia';
import './Colonia.css';

// Pestaña 🗺️ Mapas: cada mapa visible con la colonia inicial
const MaterialColonia: React.FC<PropsMaterial> = ({ material }) => (
  <div className="colonia-material">
    <div className="colonia-mapas">
      {material.map(({ nombre, material: m }) => (
        <figure key={nombre}>
          <figcaption>🗺️ {nombre}</figcaption>
          <MapaColonia mapa={m} titulo={`Mapa ${nombre}`} />
        </figure>
      ))}
    </div>
    <p className="colonia-leyenda">
      <span><i className="viva" /> colonia inicial</span>
      <span><i className="roca" /> roca (siempre muerta)</span>
      <span><i className="base" /> base humana: ¡no la toques!</span>
      <span><i className="zona" /> zona verde que hay que cubrir</span>
    </p>
    <p className="colonia-leyenda">Busca la puerta de 2 celdas del muro largo y la grieta de 1 celda del muro de la base.</p>
  </div>
);

export default MaterialColonia;
