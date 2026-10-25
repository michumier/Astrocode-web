import React, { useRef, useCallback } from 'react';
import PlanetParticles, { PlanetParticlesHandle } from './PlanetParticles';

interface PlanetConfig {
  name: string;
  key: string;
  orbitClass: string;
  planetClass: string;
  orbitSize: number;
  planetSize: number;
  orbitDuration: number;
}

const PLANETS: PlanetConfig[] = [
  { name: 'Mercurio', key: 'mercurio', orbitClass: 'orbit-mercury', planetClass: 'mercury', orbitSize: 130, planetSize: 24, orbitDuration: 12 },
  { name: 'Venus', key: 'venus', orbitClass: 'orbit-venus', planetClass: 'venus', orbitSize: 165, planetSize: 30, orbitDuration: 16 },
  { name: 'Tierra', key: 'tierra', orbitClass: 'orbit-earth', planetClass: 'earth', orbitSize: 200, planetSize: 40, orbitDuration: 20 },
  { name: 'Marte', key: 'marte', orbitClass: 'orbit-mars', planetClass: 'mars', orbitSize: 350, planetSize: 38, orbitDuration: 30 },
  { name: 'Júpiter', key: 'jupiter', orbitClass: 'orbit-jupiter', planetClass: 'jupiter', orbitSize: 430, planetSize: 46, orbitDuration: 38 },
  { name: 'Saturno', key: 'saturno', orbitClass: 'orbit-saturn', planetClass: 'saturn', orbitSize: 500, planetSize: 50, orbitDuration: 45 },
];

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
  const planetRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const handlePlanetClick = useCallback((planetKey: string) => {
    const el = planetRefs.current[planetKey];
    if (el && particlesRef.current) {
      const rect = el.getBoundingClientRect();
      const parentRect = el.closest('.solar-system')?.getBoundingClientRect() || el.parentElement?.getBoundingClientRect();
      if (parentRect) {
        const x = rect.left - parentRect.left + rect.width / 2;
        const y = rect.top - parentRect.top + rect.height / 2;
        particlesRef.current.explode(x, y);
      }
    }
    onPlanetSelect(planetKey);
  }, [onPlanetSelect]);

  return (
    <>
      <div className="sun"></div>
      {PLANETS.map((planet) => (
        <div
          key={planet.key}
          className={`orbit ${planet.orbitClass}`}
          style={{
            width: planet.orbitSize,
            height: planet.orbitSize,
            animationDuration: `${planet.orbitDuration}s`,
          }}
        >
          <div
            ref={(el) => { planetRefs.current[planet.key] = el; }}
            className={`planet ${planet.planetClass} ${selectedPlanet === planet.key ? 'selected' : ''} ${isPlanetUnlocked(planet.key) ? 'unlocked' : 'locked'}`}
            onClick={() => handlePlanetClick(planet.key)}
            title={!isPlanetUnlocked(planet.key) ? `Requiere ${planetRequirements[planet.key]} puntos` : ''}
          >
            <span className="planet-label">{planet.name}</span>
            {!isPlanetUnlocked(planet.key) && <span className="lock-icon">🔒</span>}
            {!isPlanetUnlocked(planet.key) && planetRequirements[planet.key] > 0 && (
              <span className="points-required">{planetRequirements[planet.key]}pts</span>
            )}
            {planet.key === 'saturno' && <div className="saturn-rings"></div>}
          </div>
        </div>
      ))}
      <PlanetParticles ref={particlesRef} />
    </>
  );
};

export default SolarSystem;
