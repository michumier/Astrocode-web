import React, { useState } from 'react';
import './App.css';
import Register from './Register';


interface LoginAppProps {
  onLoginSuccess?: () => void;
}

function App({ onLoginSuccess }: LoginAppProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showRegister, setShowRegister] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setMessage('Por favor, completa todos los campos');
      return;
    }

    setLoading(true);
    setMessage('');

    const loginMutation = `
      mutation Login($input: LoginInput!) {
        login(input: $input) {
          token
          usuario {
            id
            nombre_usuario
            correo_electronico
            nombre_completo
            puntos
          }
        }
      }
    `;

    try {
      const response = await fetch('http://localhost:4000/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: loginMutation,
          variables: {
            input: {
              correo_electronico: email,
              contrasena: password
            }
          }
        })
      });

      const result = await response.json();
      
      if (result.errors) {
        setMessage('Error: ' + result.errors[0].message);
      } else if (result.data?.login) {
        // Guardar token en localStorage
        const token = result.data.login.token;
        localStorage.setItem('token', token);
        localStorage.setItem('usuario', JSON.stringify(result.data.login.usuario));
        
        console.log('Login: Token guardado correctamente');
        console.log('Login: Usuario guardado correctamente');
        
        // Verificar que el token se guardó correctamente
        const savedToken = localStorage.getItem('token');
        if (savedToken) {
          try {
            const tokenParts = savedToken.split('.');
            if (tokenParts.length !== 3) {
              throw new Error('Formato de token inválido');
            }
            const tokenData = JSON.parse(atob(tokenParts[1]));
            console.log('Login: Token decodificado correctamente, expira en:', new Date(tokenData.exp * 1000).toLocaleString());
            console.log('Login: Payload del token:', JSON.stringify(tokenData, null, 2));
          } catch (error) {
            console.error('Login: Error al decodificar el token:', error);
          }
        }
        
        setMessage('¡Login exitoso! Bienvenido ' + result.data.login.usuario.nombre_usuario);
        
        // Llamar a la función de login exitoso inmediatamente
        if (onLoginSuccess) {
          console.log('Login: Llamando a onLoginSuccess');
          onLoginSuccess();
        }
        // Ya no forzamos la recarga, dejamos que Apollo Client maneje el token
        // window.location.reload();
      }
    } catch (error: any) {
      setMessage('Error de conexión: ' + error.message);
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };



  // Mostrar componente de registro si showRegister es true
  if (showRegister) {
    return <Register 
      onBackToLogin={() => setShowRegister(false)} 
      onLoginSuccess={onLoginSuccess} 
    />;
  }

  return (
    <div className="login-bg">
      <div className="login-container">
        <img src="/Logo.png" alt="AstroCode Logo" className="logo-placeholder" />
        <input 
          className="login-input" 
          type="email" 
          placeholder="Correo electrónico" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />
        <input 
          className="login-input" 
          type="password" 
          placeholder="Contraseña" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleLogin();
            }
          }}
          disabled={loading}
        />
        <button 
          className="login-btn" 
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? 'Cargando...' : 'Acceder'}
        </button>

        <button 
          className="register-btn"
          onClick={() => setShowRegister(true)}
          disabled={loading}
        >
          Registrarse
        </button>
        
        {message && (
          <div className={`message ${message.includes('✅') || message.includes('exitoso') || message.includes('Bienvenido') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}
        

      </div>
    </div>
  );
}

export default App;
