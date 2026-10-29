import React, { useRef, useCallback } from 'react';
import { Lock } from 'lucide-react';
import PlanetParticles, { PlanetParticlesHandle } from './PlanetParticles';
import './SolarSystem.css';

interface PlanetConfig {
  name: string;
  key: string;
  orbitSize: number;
  planetSize: number;
  orbitDuration: number;
  // Punto de la órbita en el que arranca (0-1): así no salen todos en fila
  inicio: number;
}

export const PLANETS: PlanetConfig[] = [
  { name: 'Mercurio', key: 'mercurio', orbitSize: 150, planetSize: 30, orbitDuration: 14, inicio: 0.08 },
  { name: 'Venus', key: 'venus', orbitSize: 236, planetSize: 38, orbitDuration: 20, inicio: 0.42 },
  { name: 'Tierra', key: 'tierra', orbitSize: 324, planetSize: 46, orbitDuration: 27, inicio: 0.7 },
  { name: 'Marte', key: 'marte', orbitSize: 418, planetSize: 42, orbitDuration: 35, inicio: 0.18 },
  { name: 'Júpiter', key: 'jupiter', orbitSize: 518, planetSize: 62, orbitDuration: 44, inicio: 0.55 },
  { name: 'Saturno', key: 'saturno', orbitSize: 620, planetSize: 54, orbitDuration: 54, inicio: 0.86 },
];

const formatear = (n: number) => n.toLocaleString('es-ES');

interface SolarSystemProps {
  selectedPlanet: string | null;
  onPlanetSelect: (planetKey: string) => void;
  isPlanetUnlocked: (planetKey: string) => boolean;
  planetRequirements: Record<string, number>;
}

const SolarSystem: React.FC<SolarSystemProps> = ({
  selectedPlanet,
  onPlanetSelect,
  isPlanetUnlocked,
  planetRequirements
}) => {
  const particlesRef = useRef<PlanetParticlesHandle>(null);
  const planetRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const handlePlanetClick = useCallback((planetKey: string) => {
    const el = planetRefs.current[planetKey];
    if (el && particlesRef.current && isPlanetUnlocked(planetKey)) {
      const rect = el.getBoundingClientRect();
      const parentRect = el.closest('.ss-sistema')?.getBoundingClientRect();
      if (parentRect) {
        // El lienzo de partículas mide lo mismo que el sistema en pantalla (también si está escalado)
        particlesRef.current.explode(rect.left - parentRect.left + rect.width / 2, rect.top - parentRect.top + rect.height / 2);
      }
    }
    onPlanetSelect(planetKey);
  }, [onPlanetSelect, isPlanetUnlocked]);

  return (
    <div className="ss-sistema">
      <div className="ss-sol" />
      {PLANETS.map((planet) => {
        const abierto = isPlanetUnlocked(planet.key);
        const puntos = planetRequirements[planet.key];
        const estilo = {
          width: planet.orbitSize,
          height: planet.orbitSize,
          '--ss-d': `${planet.orbitDuration}s`,
          '--ss-desfase': `-${(planet.orbitDuration * planet.inicio).toFixed(1)}s`,
        } as React.CSSProperties;
        return (
          <div key={planet.key} className={`ss-orbita ${abierto ? 'ss-orbita--abierta' : ''} ${selectedPlanet === planet.key ? 'ss-orbita--activa' : ''}`} style={estilo}>
            <div className="ss-planeta">
              <button
                ref={(el) => { planetRefs.current[planet.key] = el; }}
                className={`ss-cuerpo ss-${planet.key} ${abierto ? '' : 'ss-cuerpo--bloqueado'} ${selectedPlanet === planet.key ? 'ss-cuerpo--elegido' : ''}`}
                style={{ width: planet.planetSize, height: planet.planetSize }}
                onClick={() => handlePlanetClick(planet.key)}
                aria-label={abierto ? `${planet.name}: ver sus ejercicios` : `${planet.name}: se abre con ${formatear(puntos)} puntos`}
                aria-pressed={selectedPlanet === planet.key}
              />
              <span className={`ss-etiqueta ${abierto ? '' : 'ss-etiqueta--bloqueada'}`} aria-hidden="true">
                {abierto ? planet.name : <><Lock size={11} strokeWidth={2.6} />{formatear(puntos)} pts</>}
              </span>
            </div>
          </div>
        );
      })}
      <PlanetParticles ref={particlesRef} />
    </div>
  );
};

export default SolarSystem;
