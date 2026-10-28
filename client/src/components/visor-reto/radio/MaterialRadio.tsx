import React from 'react';
import { PropsMaterial } from '../MaterialGenerico';
import { Pista, useReproductor, Volumen } from './Pista';
import './Radio.css';

// Pestaña 📻 Frecuencias: qué hay que transmitir (y cómo suena) o qué señal llega en cada escenario visible
const MaterialRadio: React.FC<PropsMaterial> = ({ material }) => {
  const { sonando, progreso, tocar, volumen, setVolumen } = useReproductor();
  return (
    <div className="radio-material">
      <div className="radio-cabecera">
        <span>Entrena el oído: escucha cada señal antes de programarla.</span>
        <Volumen volumen={volumen} setVolumen={setVolumen} />
      </div>
      {material.map(({ nombre, material: m }) => {
        const senal = m.variante === 'descifrar' ? m.senal : m.objetivo;
        return (
          <section key={nombre}>
            <h4>📻 {nombre}</h4>
            {m.variante === 'sos' && <p>senal = <code>{`{"nota": "${m.nota}", "repeticiones": ${m.repeticiones}}`}</code></p>}
            {m.variante === 'morse' && <p>senal = <code>{`{"mensaje": "${m.mensaje}", "nota": "${m.nota}"}`}</code></p>}
            {m.variante === 'descifrar' && <p>Llegan <strong>{m.senal.length}</strong> parejas, con estática y duraciones imprecisas.</p>}
            <button className="radio-boton secundario" onClick={() => tocar(nombre, senal)}>
              {sonando === nombre ? '📡 Sonando…' : m.variante === 'descifrar' ? '🔊 Escuchar la señal' : '🎧 Escuchar la señal objetivo'}
            </button>
            <Pista titulo={m.variante === 'descifrar' ? 'Recibida' : 'Objetivo'} senal={senal}
              progreso={sonando === nombre ? progreso : null} />
            {m.variante === 'descifrar' && (
              <details>
                <summary>Ver la señal como lista</summary>
                <p className="radio-lista">{m.senal.map(([n, d]: [string, number]) => `("${n}", ${d})`).join(', ')}</p>
              </details>
            )}
          </section>
        );
      })}
      <p className="radio-leyenda">Cada barra es un pitido (más alta, nota más aguda); los huecos son silencios y las zonas grises, estática.</p>
    </div>
  );
};

export default MaterialRadio;
