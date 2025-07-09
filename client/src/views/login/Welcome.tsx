import React, { useState } from 'react';
import './Welcome.css';

interface WelcomeProps {
  onContinue: () => void;
  username: string;
}

const Welcome: React.FC<WelcomeProps> = ({ onContinue, username }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      // Guardar en localStorage que ya se mostró la bienvenida
      localStorage.setItem('welcomeShown', 'true');
      onContinue();
    }
  };

  const handleSkip = () => {
    // Guardar en localStorage que ya se mostró la bienvenida
    localStorage.setItem('welcomeShown', 'true');
    onContinue();
  };

  return (
    <div className="welcome-overlay">
      <div className="welcome-modal">
        <div className="welcome-header">
          <img src="/Logo.png" alt="AstroCode Logo" className="welcome-logo" />
          <h1 className="welcome-title">¡Bienvenido a AstroCode, {username}!</h1>
        </div>

        <div className="welcome-content">
          {currentStep === 1 && (
            <div className="welcome-step">
              <div className="welcome-image">
                <img src="/img/welcome-planets.svg" alt="Sistema Solar" className="planets-image" />
              </div>
              <div className="welcome-text">
                <h2>Tu viaje espacial comienza ahora</h2>
                <p>
                  En AstroCode, te embarcarás en una aventura de programación a través del sistema solar. 
                  Cada planeta representa un nivel de conocimiento que podrás desbloquear a medida que 
                  completes ejercicios y ganes puntos.
                </p>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="welcome-step">
              <div className="welcome-image">
                <img src="/img/welcome-challenges.svg" alt="Desafíos de programación" className="challenges-image" />
              </div>
              <div className="welcome-text">
                <h2>Supera desafíos, desbloquea planetas</h2>
                <p>
                  Comienza en la Tierra y avanza hacia planetas más lejanos resolviendo ejercicios de programación. 
                  Cada desafío completado te acercará más a convertirte en un maestro de la programación y 
                  explorar nuevos mundos.
                </p>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="welcome-step">
              <div className="welcome-image">
                <img src="/img/welcome-journey.svg" alt="Viaje de aprendizaje" className="journey-image" />
              </div>
              <div className="welcome-text">
                <h2>¡Prepárate para despegar!</h2>
                <p>
                  Tu nave espacial está lista para partir. Completa ejercicios, gana puntos y desbloquea 
                  nuevos planetas en tu viaje por el universo de la programación. ¡La aventura te espera!
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="welcome-footer">
          <div className="step-indicators">
            {Array.from({ length: totalSteps }).map((_, index) => (
              <div 
                key={index} 
                className={`step-indicator ${currentStep === index + 1 ? 'active' : ''}`}
                onClick={() => setCurrentStep(index + 1)}
              />
            ))}
          </div>
          <div className="welcome-buttons">
            <button className="welcome-skip-button" onClick={handleSkip}>
              Saltar
            </button>
            <button className="welcome-button" onClick={handleNext}>
              {currentStep < totalSteps ? 'Siguiente' : 'Comenzar aventura'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Welcome;