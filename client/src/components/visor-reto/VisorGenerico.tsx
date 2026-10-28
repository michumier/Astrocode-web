import React, { useEffect, useState } from 'react';
import './VisorReto.css';

export interface PropsVisor {
  escena: any;
  fotogramas: any[];
  exito: boolean;
  // Cambia en cada ejecución para reiniciar el visor
  idVuelo: number;
  onTick?: (tick: number) => void;
}

// Visor de reserva: enseña los datos de cada paso tal cual. Lo usan la calibración del motor
// y cualquier formato que todavía no tenga visor propio.
const VisorGenerico: React.FC<PropsVisor> = ({ escena, fotogramas, exito, idVuelo, onTick }) => {
  const ultimo = Math.max(fotogramas.length - 1, 0);
  const [indice, setIndice] = useState(ultimo);

  useEffect(() => {
    setIndice(ultimo);
  }, [idVuelo, ultimo]);

  useEffect(() => {
    onTick?.(indice);
  }, [indice, onTick]);

  return (
    <div className={`visor-generico ${exito ? 'exito' : 'fallo'}`}>
      <div className="visor-generico-cabecera">
        <strong>{exito ? '✅ Escenario superado' : '❌ Escenario fallido'}</strong>
        <span>Paso {indice + 1} de {fotogramas.length}</span>
      </div>
      {fotogramas.length > 1 && (
        <input
          type="range"
          min={0}
          max={ultimo}
          value={indice}
          onChange={(e) => setIndice(Number(e.target.value))}
          aria-label="Paso de la ejecución"
        />
      )}
      <div className="visor-generico-datos">
        <section>
          <h4>Escenario</h4>
          <pre>{JSON.stringify(escena, null, 2)}</pre>
        </section>
        <section>
          <h4>Estado en este paso</h4>
          <pre>{JSON.stringify(fotogramas[indice], null, 2)}</pre>
        </section>
      </div>
    </div>
  );
};

export default VisorGenerico;
