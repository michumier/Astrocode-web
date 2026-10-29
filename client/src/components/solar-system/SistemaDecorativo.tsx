import React from 'react';
import { PLANETS } from './SolarSystem';
import './SolarSystem.css';

// El mismo sistema solar del mapa, solo para mirar (acceso y bienvenida): sin botones ni etiquetas.
// Mide 640 px como el del mapa; quien lo use lo escala con su contenedor.
const SistemaDecorativo: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`ss-sistema ss-sistema--decorativo${className ? ` ${className}` : ''}`} aria-hidden="true">
    <div className="ss-sol" />
    {PLANETS.map((planeta) => (
      <div
        key={planeta.key}
        className="ss-orbita ss-orbita--abierta"
        style={{
          width: planeta.orbitSize,
          height: planeta.orbitSize,
          '--ss-d': `${planeta.orbitDuration}s`,
          '--ss-desfase': `-${(planeta.orbitDuration * planeta.inicio).toFixed(1)}s`,
        } as React.CSSProperties}
      >
        <div className="ss-planeta">
          <span className={`ss-cuerpo ss-${planeta.key}`} style={{ width: planeta.planetSize, height: planeta.planetSize }} />
        </div>
      </div>
    ))}
  </div>
);

export default SistemaDecorativo;
