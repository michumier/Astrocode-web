import React, { useState, useEffect } from 'react';
import { gql, useMutation, useQuery } from '@apollo/client';
import './Exercise.css';

// GraphQL mutation for code execution
const EXECUTE_CODE = gql`
  mutation ExecuteCode($input: ExecuteCodeInput!) {
    executeCode(input: $input) {
      stdout
      stderr
      compile_output
      status {
        id
        description
      }
      time
      memory
    }
  }
`;

// GraphQL mutation for completing task
const COMPLETAR_TAREA = gql`
  mutation CompletarTarea($tareaId: ID!, $tiempoCompletado: Int!) {
    completarTarea(tareaId: $tareaId, tiempoCompletado: $tiempoCompletado) {
      success
      puntos
      tiempo
      mensaje
    }
  }
`;

// GraphQL query for checking if task is completed
const ES_TAREA_COMPLETADA = gql`
  query EsTareaCompletada($tareaId: ID!) {
    esTareaCompletada(tareaId: $tareaId)
  }
`;

interface ExerciseProps {
  onBackToDashboard?: () => void;
  exerciseData?: any;
}

const Exercise: React.FC<ExerciseProps> = ({ onBackToDashboard, exerciseData }) => {
  // All hooks must be declared at the top before any conditional logic
  const [code, setCode] = useState(exerciseData?.codigoBase || 'def sum_numbers(numbers):\n    total = 0\n    for num in numbers:\n        total += num\n    return total\n\n# Test the function\nnumbers = [1, 2, 3, 4, 5]\nresult = sum_numbers(numbers)\nprint(f"Sum: {result}")');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [showCongratulations, setShowCongratulations] = useState(false);
  const [completionData, setCompletionData] = useState<any>(null);
  
  // GraphQL mutation hooks
  const [executeCode] = useMutation(EXECUTE_CODE);
  const [completarTarea] = useMutation(COMPLETAR_TAREA);
  
  // GraphQL query hook
  const { data: tareaCompletadaData } = useQuery(ES_TAREA_COMPLETADA, {
    variables: { tareaId: exerciseData?.id },
    skip: !exerciseData?.id
  });
  
  // All useEffect hooks must also be at the top
  // Actualizar código cuando cambie exerciseData
  useEffect(() => {
    if (exerciseData?.codigoBase) {
      setCode(exerciseData.codigoBase);
    }
  }, [exerciseData]);

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
  
  // Debug: Imprimir datos del ejercicio
  // Debug logs removed to reduce console noise
  
  // Validar que exerciseData existe
  if (!exerciseData) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #0c1445 0%, #1a237e 50%, #283593 100%)',
        color: 'white',
        textAlign: 'center'
      }}>
        <h2>Error: No se ha seleccionado ningún ejercicio</h2>
        <p>Por favor, regresa al dashboard y selecciona un ejercicio válido.</p>
        <button 
          onClick={onBackToDashboard}
          style={{
            padding: '10px 20px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            marginTop: '20px'
          }}
        >
          Volver al Dashboard
        </button>
      </div>
    );
  }

  // Formatear tiempo en MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleReset = () => {
    setCode(exerciseData?.codigoBase || 'def sum_numbers(numbers):\n    total = 0\n    for num in numbers:\n        total += num\n    return total\n\n# Test the function\nnumbers = [1, 2, 3, 4, 5]\nresult = sum_numbers(numbers)\nprint(f"Sum: {result}")');
    setOutput('');
  };

  const handleRun = async () => {
    setIsRunning(true);
    setOutput('Ejecutando código...\n');
    
    try {
      const startTime = Date.now();
      
      const { data } = await executeCode({
        variables: {
          input: {
            sourceCode: code,
            languageId: 71, // Python 3
            stdin: ""
          }
        }
      });
      
      const endTime = Date.now();
      const executionTime = ((endTime - startTime) / 1000).toFixed(3);
      
      let outputText = '>>> Ejecutando código...\n\n';
       
       if (data?.executeCode?.stdout) {
         outputText += `Salida:\n${data.executeCode.stdout}\n\n`;
       }
       
       if (data?.executeCode?.stderr) {
         outputText += `Errores:\n${data.executeCode.stderr}\n\n`;
       }
       
       if (data?.executeCode?.compile_output) {
         outputText += `Errores de compilación:\n${data.executeCode.compile_output}\n\n`;
       }
       
       outputText += `Tiempo de ejecución: ${data?.executeCode?.time || executionTime}s\n`;
      
      // Comparar con resultado esperado si existe
       if (exerciseData?.resultadoEsperado && data?.executeCode?.stdout) {
         const expectedOutput = exerciseData.resultadoEsperado.trim();
         const actualOutput = data.executeCode.stdout.trim();
        
        if (expectedOutput === actualOutput) {
          outputText += '\n✅ ¡Resultado correcto! Tu código produce la salida esperada.';
          
          // Completar la tarea si es correcta
          try {
            const { data: completionResult } = await completarTarea({
              variables: {
                tareaId: exerciseData.id,
                tiempoCompletado: timer
              }
            });
            
            if (completionResult?.completarTarea?.success) {
              setCompletionData({
                titulo: exerciseData.titulo,
                puntos: completionResult.completarTarea.puntos,
                tiempo: completionResult.completarTarea.tiempo,
                mensaje: completionResult.completarTarea.mensaje
              });
              setShowCongratulations(true);
              setIsTimerRunning(false);
            }
          } catch (completionError: any) {
            console.log('Error al completar tarea:', completionError.message);
          }
        } else {
          outputText += '\n❌ El resultado no coincide con el esperado.';
        }
      }
      
      setOutput(outputText);
      
    } catch (error: any) {
      console.error('Error ejecutando código:', error);
      let errorMessage = 'Error desconocido';
      
      if (error.networkError) {
        errorMessage = 'Error de conexión con el servidor GraphQL. Verifica que el servidor esté ejecutándose.';
      } else if (error.graphQLErrors && error.graphQLErrors.length > 0) {
        errorMessage = error.graphQLErrors[0].message;
      } else {
        errorMessage = error.message || 'Error desconocido';
      }
      
      setOutput(`Error al ejecutar el código:\n${errorMessage}`);
    } finally {
      setIsRunning(false);
    }
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
                  <span className={`difficulty-badge ${exerciseData?.difficulty?.toLowerCase() || 'easy'}`}>
                    {exerciseData?.difficulty || 'Fácil'}
                  </span>
                  <span className="points-badge">{exerciseData?.points || 100} pts</span>
                </div>
              </div>
              <div className="statement-content">
                <h4>{exerciseData?.title || 'Suma de Números'}</h4>
                <p>{exerciseData?.description || 'Crea una función que reciba una lista de números y devuelva la suma de todos ellos.'}</p>
                {exerciseData?.resultadoEsperado && (
                  <div className="expected-result">
                    <h5>Resultado Esperado:</h5>
                    <pre><code>{exerciseData.resultadoEsperado}</code></pre>
                  </div>
                )}
                {!exerciseData && (
                  <>
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
                  </>
                )}
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
      
      {/* Ventana de felicitación */}
      {showCongratulations && completionData && (
        <div className="congratulations-overlay">
          <div className="congratulations-modal">
            <div className="congratulations-header">
              <h2>🎉 ¡Enhorabuena!</h2>
            </div>
            <div className="congratulations-content">
              <h3>Has completado el ejercicio:</h3>
              <h4 className="exercise-title">{completionData.titulo}</h4>
              
              <div className="completion-stats">
                <div className="stat-item">
                  <span className="stat-label">Puntos ganados:</span>
                  <span className="stat-value">{completionData.puntos}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Tiempo empleado:</span>
                  <span className="stat-value">{completionData.tiempo}</span>
                </div>
              </div>
              
              <p className="completion-message">{completionData.mensaje}</p>
              
              <button 
                className="back-to-menu-btn"
                onClick={() => {
                  setShowCongratulations(false);
                  if (onBackToDashboard) {
                    onBackToDashboard();
                  }
                }}
              >
                Volver al Menú Principal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Exercise;