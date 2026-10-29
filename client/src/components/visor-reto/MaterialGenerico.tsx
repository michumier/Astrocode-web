import React from 'react';
import './VisorReto.css';

export interface PropsMaterial {
  // Un elemento por escenario visible: lo que el alumno puede estudiar antes de ejecutar
  material: { nombre: string; material: any }[];
  // Línea a la que saltar cuando el visor lo pide (por ejemplo, «ver la línea 1.204 del registro»)
  foco?: { escenario: string; linea: number; n: number } | null;
}

// Material de reserva: los datos públicos de cada escenario visible, tal cual
const MaterialGenerico: React.FC<PropsMaterial> = ({ material }) => (
  <div className="material-generico">
    {material.map((m) => (
      <section key={m.nombre}>
        <h3>{m.nombre}</h3>
        {m.material?.explicacion && <p>{m.material.explicacion}</p>}
        <pre>{JSON.stringify(m.material, null, 2)}</pre>
      </section>
    ))}
  </div>
);

export default MaterialGenerico;
