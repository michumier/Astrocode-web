import React, { useState } from 'react';
import './Register.css';
import Welcome from './Welcome';


interface RegisterProps {
  onBackToLogin: () => void;
  onLoginSuccess?: () => void; // Función opcional para manejar el login exitoso después del registro
}

function Register({ onBackToLogin, onLoginSuccess }: RegisterProps) {
  const [formData, setFormData] = useState({
    nombre_usuario: '',
    correo_electronico: '',
    contrasena: '',
    confirmarContrasena: '',
    nombre_completo: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showWelcome, setShowWelcome] = useState(false);
  const [registeredUsername, setRegisteredUsername] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRegister = async () => {
    // Validaciones
    if (!formData.nombre_usuario || !formData.correo_electronico || !formData.contrasena || !formData.confirmarContrasena) {
      setMessage('Por favor, completa todos los campos obligatorios');
      return;
    }

    if (formData.contrasena !== formData.confirmarContrasena) {
      setMessage('Las contraseñas no coinciden');
      return;
    }

    if (formData.contrasena.length < 6) {
      setMessage('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.correo_electronico)) {
      setMessage('Por favor, ingresa un email válido');
      return;
    }

    setLoading(true);
    setMessage('');

    const registerMutation = `
      mutation CrearUsuario($input: CrearUsuarioInput!) {
        crearUsuario(input: $input) {
          id
          nombre_usuario
          correo_electronico
          nombre_completo
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
          query: registerMutation,
          variables: {
            input: {
              nombre_usuario: formData.nombre_usuario,
              correo_electronico: formData.correo_electronico,
              contrasena: formData.contrasena,
              nombre_completo: formData.nombre_completo || undefined
            }
          }
        })
      });

      const result = await response.json();
      
      if (result.errors) {
        setMessage('Error: ' + result.errors[0].message);
      } else if (result.data?.crearUsuario) {
        setMessage('¡Registro exitoso!');
        // Guardar el nombre de usuario para mostrarlo en la pantalla de bienvenida
        setRegisteredUsername(result.data.crearUsuario.nombre_usuario);
        
        // Guardar los datos de inicio de sesión para el login automático
        const loginData = {
          correo_electronico: formData.correo_electronico,
          contrasena: formData.contrasena
        };
        
        // Guardar temporalmente los datos de login en localStorage
        localStorage.setItem('tempLoginData', JSON.stringify(loginData));
        
        // Mostrar pantalla de bienvenida
        setShowWelcome(true);
      }
    } catch (error: any) {
      setMessage('Error de conexión: ' + error.message);
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Manejar el cierre de la pantalla de bienvenida
  const handleWelcomeComplete = async () => {
    // Si existe la función onLoginSuccess, la llamamos para ir al menú principal
    // Si no existe, volvemos al login
    if (onLoginSuccess) {
      try {
        // Recuperar los datos de inicio de sesión guardados temporalmente
        const tempLoginDataStr = localStorage.getItem('tempLoginData');
        if (!tempLoginDataStr) {
          throw new Error('No se encontraron datos de inicio de sesión');
        }
        
        const tempLoginData = JSON.parse(tempLoginDataStr);
        
        // Realizar login automático con los datos del usuario registrado
        const loginMutation = `
          mutation Login($input: LoginInput!) {
            login(input: $input) {
              token
              usuario {
                id
                nombre_usuario
                correo_electronico
                nombre_completo
              }
            }
          }
        `;

        const response = await fetch('http://localhost:4000/graphql', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: loginMutation,
            variables: {
              input: {
                correo_electronico: tempLoginData.correo_electronico,
                contrasena: tempLoginData.contrasena
              }
            }
          })
        });

        const result = await response.json();
        
        if (result.data?.login) {
          // Eliminar los datos temporales de inicio de sesión
          localStorage.removeItem('tempLoginData');
          
          // Guardar token en localStorage
          localStorage.setItem('token', result.data.login.token);
          localStorage.setItem('usuario', JSON.stringify(result.data.login.usuario));
          
          console.log('Registro: Token guardado correctamente');
          console.log('Registro: Usuario guardado correctamente');
          
          // Verificar que el token se guardó correctamente
          const savedToken = localStorage.getItem('token');
          if (savedToken) {
            try {
              const tokenData = JSON.parse(atob(savedToken.split('.')[1]));
              console.log('Registro: Token decodificado correctamente, expira en:', new Date(tokenData.exp * 1000).toLocaleString());
            } catch (error) {
              console.error('Registro: Error al decodificar el token:', error);
            }
          }
          
          // Llamar a la función de login exitoso inmediatamente
          console.log('Registro: Llamando a onLoginSuccess');
          onLoginSuccess();
          
          // Ya no forzamos la recarga, dejamos que Apollo Client maneje el token
          // window.location.reload();
        } else {
          // Si hay algún error en el login automático, volver al login normal
          onBackToLogin();
        }
      } catch (error) {
        console.error('Error en login automático:', error);
        onBackToLogin();
      }
    } else {
      // Si no hay función de login exitoso, volver al login
      onBackToLogin();
    }
  };

  // Si se debe mostrar la pantalla de bienvenida
  if (showWelcome) {
    return <Welcome onContinue={handleWelcomeComplete} username={registeredUsername} />;
  }

  return (
    <div className="login-bg">
      <div className="register-container">
        <img src="/Logo.png" alt="AstroCode Logo" className="logo-placeholder" />
        <h2 className="register-title">Crear Cuenta</h2>
        
        <input 
          className="login-input" 
          type="text" 
          name="nombre_usuario"
          placeholder="Nombre de usuario *" 
          value={formData.nombre_usuario}
          onChange={handleInputChange}
          disabled={loading}
        />
        
        <input 
          className="login-input" 
          type="email" 
          name="correo_electronico"
          placeholder="Correo electrónico *" 
          value={formData.correo_electronico}
          onChange={handleInputChange}
          disabled={loading}
        />
        
        <input 
          className="login-input" 
          type="text" 
          name="nombre_completo"
          placeholder="Nombre completo (opcional)" 
          value={formData.nombre_completo}
          onChange={handleInputChange}
          disabled={loading}
        />
        
        <input 
          className="login-input" 
          type="password" 
          name="contrasena"
          placeholder="Contraseña *" 
          value={formData.contrasena}
          onChange={handleInputChange}
          disabled={loading}
        />
        
        <input 
          className="login-input" 
          type="password" 
          name="confirmarContrasena"
          placeholder="Confirmar contraseña *" 
          value={formData.confirmarContrasena}
          onChange={handleInputChange}
          disabled={loading}
        />
        
        <button 
          className="login-btn" 
          onClick={handleRegister}
          disabled={loading}
        >
          {loading ? 'Registrando...' : 'Registrarse'}
        </button>

        <button 
          className="register-btn" 
          onClick={onBackToLogin}
          disabled={loading}
        >
          Volver al Login
        </button>
        
        {message && (
          <div className={`message ${message.includes('exitoso') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}

export default Register;