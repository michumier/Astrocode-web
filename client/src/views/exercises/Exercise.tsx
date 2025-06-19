import React, { useState } from 'react';
import './Exercise.css';

const Exercise: React.FC = () => {
  const [code, setCode] = useState('');

  const handleReset = () => {
    setCode('');
  };

  const handleRun = () => {
    // Aquí se implementaría la lógica para ejecutar el código
    console.log('Running code:', code);
  };

  return (
    <div className="exercise-container">
      <div className="layout-container">
        <header className="header">
          <div className="header-left">
            <div className="logo-icon">
              <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M42.4379 44C42.4379 44 36.0744 33.9038 41.1692 24C46.8624 12.9336 42.2078 4 42.2078 4L7.01134 4C7.01134 4 11.6577 12.932 5.96912 23.9969C0.876273 33.9029 7.27094 44 7.27094 44L42.4379 44Z"
                  fill="currentColor"
                />
              </svg>
            </div>
            <h2 className="app-title">PyQuest</h2>
          </div>
          <div className="header-right">
            <div className="nav-links">
              <a href="#" className="nav-link">Home</a>
              <a href="#" className="nav-link">Learn</a>
              <a href="#" className="nav-link">Practice</a>
              <a href="#" className="nav-link">Projects</a>
              <a href="#" className="nav-link">Community</a>
            </div>
            <div className="header-buttons">
              <button className="login-btn">
                <span>Login</span>
              </button>
              <button className="cart-btn">
                <svg xmlns="http://www.w3.org/2000/svg" width="20px" height="20px" fill="currentColor" viewBox="0 0 256 256">
                  <path d="M222.14,58.87A8,8,0,0,0,216,56H54.68L49.79,29.14A16,16,0,0,0,34.05,16H16a8,8,0,0,0,0,16h18L59.56,172.29a24,24,0,0,0,5.33,11.27,28,28,0,1,0,44.4,8.44h45.42A27.75,27.75,0,0,0,152,204a28,28,0,1,0,28-28H83.17a8,8,0,0,1-7.87-6.57L72.13,152h116a24,24,0,0,0,23.61-19.71l12.16-66.86A8,8,0,0,0,222.14,58.87ZM96,204a12,12,0,1,1-12-12A12,12,0,0,1,96,204Zm96,0a12,12,0,1,1-12-12A12,12,0,0,1,192,204Zm4-74.57A8,8,0,0,1,188.1,136H69.22L57.59,72H206.41Z" />
                </svg>
              </button>
            </div>
          </div>
        </header>
        
        <div className="main-content">
          <div className="content-container">
            <h2 className="exercise-title">Find the bug</h2>
            <p className="exercise-description">
              The code below is supposed to print the sum of all the numbers in the list. However, it contains a bug. Can you find and fix it?
            </p>
            
            <div className="code-input-container">
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="def sum_numbers(numbers):"
                className="code-textarea"
              />
            </div>
            
            <div className="button-container">
              <button onClick={handleReset} className="reset-btn">
                <span>Reset</span>
              </button>
              <button onClick={handleRun} className="run-btn">
                <span>Run</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Exercise;