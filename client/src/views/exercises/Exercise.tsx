import React, { useState, useEffect } from 'react';
import './Exercise.css';

interface ExerciseProps {
  onBackToDashboard?: () => void;
}

const Exercise: React.FC<ExerciseProps> = ({ onBackToDashboard }) => {
  const [code, setCode] = useState('def sum_numbers(numbers):\n    total = 0\n    for num in numbers:\n        total += num\n    return total\n\n# Test the function\nnumbers = [1, 2, 3, 4, 5]\nresult = sum_numbers(numbers)\nprint(f"Sum: {result}")');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(true);

  // Generar estrellas para el fondo
  useEffect(() => {
    const generateStars = () => {
      const starsContainer = document.querySelector('.stars');
      if (starsContainer) {
        starsContainer.innerHTML = '';
        for (let i = 0; i < 200; i++) {
          const star = document.createElement('div');
          star.className = 'star';
          star.style.left = Math.random() * 100 + '%';
          star.style.top = Math.random() * 100 + '%';
          star.style.animationDelay = Math.random() * 3 + 's';
          starsContainer.appendChild(star);
        }
      }
    };

    generateStars();
  }, []);

  // Temporizador
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimer(prevTimer => prevTimer + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // Formatear tiempo en MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleReset = () => {
    setCode('def sum_numbers(numbers):\n    total = 0\n    for num in numbers:\n        total += num\n    return total\n\n# Test the function\nnumbers = [1, 2, 3, 4, 5]\nresult = sum_numbers(numbers)\nprint(f"Sum: {result}")');
    setOutput('');
  };

  const handleRun = () => {
    setIsRunning(true);
    setOutput('Ejecutando código...\n');
    
    // Simular ejecución del código
    setTimeout(() => {
      try {
        // Aquí se implementaría la lógica real para ejecutar el código
        // Por ahora simulamos una salida
        setOutput('>>> Ejecutando código Python...\n\nSum: 15\n\n>>> Ejecución completada exitosamente.');
      } catch (error) {
        setOutput(`Error: ${error}`);
      } finally {
        setIsRunning(false);
      }
    }, 1500);
  };

  return (
    <div className="exercise-screen">
      {/* Fondo de estrellas */}
      <div className="stars"></div>
      
      {/* Header */}
      <header className="exercise-header">
        <div className="exercise-header-content">
          <div className="exercise-logo">
            <img 
              src="/Logo.png" 
              alt="AstroCode Logo" 
              className="exercise-logo-img" 
            />
          </div>
          <h1 className="exercise-title-header">AstroCode - Ejercicio</h1>
          <div className="exercise-header-actions">
            <button 
              className="exercise-back-btn"
              onClick={onBackToDashboard}
            >
              ← Volver
            </button>
            <button className="exercise-help-btn">
              ?
            </button>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="exercise-main">
        <div className="exercise-content">
          {/* Panel izquierdo - Editor de código */}
          <div className="code-panel">
            <div className="panel-header">
              <h3>Editor de Código</h3>
              <div className="panel-actions">
                <div className="timer-display">
                  <span className="timer-icon">⏱️</span>
                  <span className="timer-text">{formatTime(timer)}</span>
                </div>
                <button onClick={handleReset} className="action-btn reset-btn">
                  Reset
                </button>
                <button 
                  onClick={handleRun} 
                  className={`action-btn run-btn ${isRunning ? 'running' : ''}`}
                  disabled={isRunning}
                >
                  {isRunning ? 'Ejecutando...' : '▶ Ejecutar'}
                </button>
              </div>
            </div>
            <div className="code-editor">
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="code-textarea"
                placeholder="Escribe tu código aquí..."
                spellCheck={false}
              />
            </div>
          </div>

          {/* Panel derecho - Enunciado y Terminal */}
          <div className="right-panel">
            {/* Panel de enunciado */}
            <div className="exercise-statement-panel">
              <div className="panel-header">
                <h3>Enunciado del Ejercicio</h3>
                <div className="exercise-info">
                  <span className="difficulty-badge easy">Fácil</span>
                  <span className="points-badge">100 pts</span>
                </div>
              </div>
              <div className="statement-content">
                <h4>Suma de Números</h4>
                <p>Crea una función que reciba una lista de números y devuelva la suma de todos ellos.</p>
                <div className="requirements">
                  <h5>Requisitos:</h5>
                  <ul>
                    <li>La función debe llamarse <code>sum_numbers</code></li>
                    <li>Debe recibir un parámetro <code>numbers</code> (lista)</li>
                    <li>Debe retornar la suma total</li>
                    <li>Maneja listas vacías retornando 0</li>
                  </ul>
                </div>
                <div className="example">
                  <h5>Ejemplo:</h5>
                  <code>sum_numbers([1, 2, 3, 4, 5]) → 15</code>
                </div>
              </div>
            </div>

            {/* Panel de terminal */}
            <div className="output-panel">
              <div className="panel-header">
                <h3>Terminal de Salida</h3>
                <div className="terminal-controls">
                  <div className="terminal-dots">
                    <span className="dot red"></span>
                    <span className="dot yellow"></span>
                    <span className="dot green"></span>
                  </div>
                </div>
              </div>
              <div className="terminal-output">
                <pre className="output-text">{output || 'Presiona "Ejecutar" para ver la salida del código...'}</pre>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Exercise;