import React from 'react';

// Colores de los cables y una textura distinta para cada uno (para no depender solo del color)
export const COLOR_CABLE: Record<string, { color: string; trazo?: string }> = {
  rojo: { color: '#e53935' },
  azul: { color: '#1e88e5', trazo: '14 5' },
  blanco: { color: '#f5f5f5', trazo: '3 4' },
  amarillo: { color: '#fdd835', trazo: '20 4 3 4' },
  negro: { color: '#2b2b2b', trazo: '8 8' },
};

export const COLOR_BOTON: Record<string, string> = {
  azul: '#1e88e5',
  rojo: '#e53935',
  blanco: '#f5f5f5',
  amarillo: '#fdd835',
};

interface PropsCable {
  indice: number;
  color: string;
  y: number;
  cortado: boolean;
  // El corte que se acaba de hacer (lleva las tijeras)
  ultimoCorte: boolean;
  // Tras una explosión: cables que había que cortar y no se cortaron
  debiaCortarse: boolean;
}

export const Cable: React.FC<PropsCable> = ({ indice, color, y, cortado, ultimoCorte, debiaCortarse }) => {
  const estilo = COLOR_CABLE[color] || { color: '#999' };
  const corte = 205;
  return (
    <g className={`bomba-cable ${cortado ? 'cortado' : ''}`}>
      <text x={4} y={y + 4} className="bomba-cable-indice">{indice}</text>
      <circle cx={24} cy={y} r={5} className="bomba-borne" />
      <circle cx={300} cy={y} r={5} className="bomba-borne" />
      {/* Contorno para que el negro y el blanco se vean sobre cualquier fondo */}
      {[0, 1].map((capa) => (
        <g key={capa}>
          <path
            d={cortado ? `M24 ${y} L${corte - 8} ${y}` : `M24 ${y} L300 ${y}`}
            stroke={capa === 0 ? '#000' : estilo.color}
            strokeWidth={capa === 0 ? 9 : 6}
            strokeDasharray={capa === 1 ? estilo.trazo : undefined}
            strokeLinecap="round"
            fill="none"
          />
          {cortado && (
            <path d={`M${corte + 8} ${y} L300 ${y}`} stroke={capa === 0 ? '#000' : estilo.color}
              strokeWidth={capa === 0 ? 9 : 6} strokeDasharray={capa === 1 ? estilo.trazo : undefined}
              strokeLinecap="round" fill="none" />
          )}
        </g>
      ))}
      <text x={60} y={y - 8} className="bomba-cable-nombre">{color}</text>
      {ultimoCorte && <text x={corte - 10} y={y + 6} className="bomba-tijeras">✂</text>}
      {cortado && !ultimoCorte && <text x={corte - 6} y={y - 6} className="bomba-chispa">✦</text>}
      {debiaCortarse && (
        <text x={296} y={y - 8} textAnchor="end" className="bomba-debia">✂ había que cortarlo</text>
      )}
    </g>
  );
};

export const BotonBomba: React.FC<{ boton: { color: string; texto: string }; accion?: string }> = ({ boton, accion }) => (
  <div className="bomba-boton-zona">
    <div
      className={`bomba-boton ${accion ? `accion-${accion}` : ''}`}
      style={{ background: COLOR_BOTON[boton.color] || '#888', color: boton.color === 'blanco' || boton.color === 'amarillo' ? '#111' : '#fff' }}
      aria-label={`Botón ${boton.color} que pone ${boton.texto}`}
    >
      {boton.texto}
    </div>
    <span className="bomba-boton-color">{boton.color}</span>
    {accion && <span className="bomba-boton-accion">{accion === 'pulsar' ? '👆 pulsado' : '✋ mantenido'}</span>}
  </div>
);

export const TeclaBomba: React.FC<{ simbolo: string; orden: number }> = ({ simbolo, orden }) => (
  <div className={`bomba-tecla ${orden >= 0 ? 'pulsada' : ''}`}>
    <span>{simbolo}</span>
    {orden >= 0 && <span className="bomba-tecla-orden">{orden + 1}</span>}
  </div>
);
