import React, { useState } from 'react';
import './Register.css';


interface RegisterProps {
  onBackToLogin: () => void;
}

function Register({ onBackToLogin }: RegisterProps) {
  const [formData, setFormData] = useState({
    nombre_usuario: '',
    correo_electronico: '',
    contrasena: '',
    confirmarContrasena: '',
    nombre_completo: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

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
      const response = await fetch('http://localhost:4001/graphql', {
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
        setMessage('¡Registro exitoso! Ya puedes iniciar sesión.');
        // Limpiar formulario
        setFormData({
          nombre_usuario: '',
          correo_electronico: '',
          contrasena: '',
          confirmarContrasena: '',
          nombre_completo: ''
        });
        // Regresar al login después de 2 segundos
        setTimeout(() => {
          onBackToLogin();
        }, 2000);
      }
    } catch (error: any) {
      setMessage('Error de conexión: ' + error.message);
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

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