import React from 'react';
import './App.css';

function App() {
  return (
    <div className="login-bg">
      <div className="login-container">
        <div className="logo-placeholder">LOGO</div>
        <input className="login-input" type="text" placeholder="Usuario" />
        <input className="login-input" type="password" placeholder="Contraseña" />
        <button className="login-btn">Acceder</button>
        <button className="register-btn">Registrarse</button>
      </div>
    </div>
  );
}

export default App;
