import React, { useRef, useState } from 'react';
import { gql, useMutation } from '@apollo/client';
import { Bot, Eye, EyeOff, LogIn, Orbit, Rocket, UserPlus } from 'lucide-react';
import { Aviso, Boton, Campo } from '../../components/ui';
import Starfield from '../../components/solar-system/Starfield';
import SistemaDecorativo from '../../components/solar-system/SistemaDecorativo';
import Bienvenida from './Bienvenida';
import './Acceso.css';

export const LOGIN = gql`
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

export const CREAR_USUARIO = gql`
  mutation CrearUsuario($input: CrearUsuarioInput!) {
    crearUsuario(input: $input) {
      id
      nombre_usuario
    }
  }
`;

type Modo = 'entrar' | 'crear';
type Datos = { usuario: string; correo: string; nombre: string; contrasena: string; repetir: string };
export type Errores = Partial<Record<keyof Datos, string>>;

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Las mismas reglas que comprueba la API al registrar: así se sabe antes de enviar
export const validarRegistro = (d: Datos): Errores => {
  const e: Errores = {};
  if (!/^[\w.-]{3,30}$/.test(d.usuario.trim())) e.usuario = 'Entre 3 y 30 caracteres: letras, números, punto, guion o guion bajo.';
  if (!CORREO.test(d.correo.trim())) e.correo = 'Escribe un correo válido (por ejemplo, ana@correo.com).';
  if (d.contrasena.length < 8 || d.contrasena.length > 128) e.contrasena = 'Tiene que tener al menos 8 caracteres.';
  if (!e.contrasena && d.repetir !== d.contrasena) e.repetir = 'Las contraseñas no coinciden.';
  return e;
};

const mensajeDeError = (e: any) => {
  if (e?.networkError) return 'No hay conexión con el servidor. Comprueba que está en marcha e inténtalo de nuevo.';
  const m: string = e?.graphQLErrors?.[0]?.message || e?.message || 'Algo ha fallado. Inténtalo de nuevo.';
  if (/credenciales/i.test(m)) return 'El correo o la contraseña no son correctos.';
  if (/ya existe/i.test(m)) return 'Ya hay una cuenta con ese nombre de usuario o ese correo.';
  return m;
};

const VACIO: Datos = { usuario: '', correo: '', nombre: '', contrasena: '', repetir: '' };

interface PropsAcceso {
  onLoginSuccess?: () => void;
}

// Entrar y crear cuenta (fase 6.4). Tras crear la cuenta se entra al momento y se enseña la bienvenida.
const Acceso: React.FC<PropsAcceso> = ({ onLoginSuccess }) => {
  const [modo, setModo] = useState<Modo>('entrar');
  const [datos, setDatos] = useState<Datos>(VACIO);
  const [errores, setErrores] = useState<Errores>({});
  const [fallo, setFallo] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [verContrasena, setVerContrasena] = useState(false);
  const [bienvenida, setBienvenida] = useState<string | null>(null);
  const formulario = useRef<HTMLFormElement>(null);

  const [login, { loading: entrando }] = useMutation(LOGIN);
  const [crear, { loading: creando }] = useMutation(CREAR_USUARIO);
  const ocupado = entrando || creando;
  const esEntrar = modo === 'entrar';

  const cambiar = (campo: keyof Datos) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value;
    setDatos((d) => ({ ...d, [campo]: valor }));
    if (errores[campo]) setErrores((er) => ({ ...er, [campo]: undefined }));
  };

  // Al cambiar de pestaña se conserva el correo, pero no la contraseña
  const cambiarModo = (nuevo: Modo) => {
    setModo(nuevo);
    setDatos((d) => ({ ...d, contrasena: '', repetir: '' }));
    setErrores({});
    setFallo(null);
    setAviso(null);
  };

  // Con errores, el foco va al primer campo que hay que corregir
  const mostrarErrores = (er: Errores) => {
    setErrores(er);
    const hay = Object.values(er).some(Boolean);
    if (hay) setTimeout(() => formulario.current?.querySelector<HTMLInputElement>('[aria-invalid="true"]')?.focus(), 0);
    return hay;
  };

  const entrar = async (correo: string, contrasena: string) => {
    const { data } = await login({ variables: { input: { correo_electronico: correo, contrasena } } });
    localStorage.setItem('token', data.login.token);
    localStorage.setItem('usuario', JSON.stringify(data.login.usuario));
    return data.login.usuario;
  };

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (ocupado) return;
    setFallo(null);
    setAviso(null);
    const correo = datos.correo.trim();

    if (esEntrar) {
      const er: Errores = {};
      if (!CORREO.test(correo)) er.correo = 'Escribe tu correo (por ejemplo, ana@correo.com).';
      if (!datos.contrasena) er.contrasena = 'Escribe tu contraseña.';
      if (mostrarErrores(er)) return;
      try {
        await entrar(correo, datos.contrasena);
        onLoginSuccess?.();
      } catch (err) {
        setFallo(mensajeDeError(err));
      }
      return;
    }

    if (mostrarErrores(validarRegistro(datos))) return;
    try {
      await crear({
        variables: {
          input: {
            nombre_usuario: datos.usuario.trim(),
            correo_electronico: correo,
            contrasena: datos.contrasena,
            nombre_completo: datos.nombre.trim() || undefined,
          },
        },
      });
    } catch (err) {
      setFallo(mensajeDeError(err));
      return;
    }
    // La contraseña solo vive en memoria: se entra al momento y se olvida (nunca va a localStorage)
    try {
      const usuario = await entrar(correo, datos.contrasena);
      setDatos(VACIO);
      setBienvenida(usuario.nombre_usuario);
    } catch {
      setDatos((d) => ({ ...d, contrasena: '', repetir: '' }));
      setModo('entrar');
      setAviso('Tu cuenta está creada. Entra con tu correo y tu contraseña.');
    }
  };

  if (bienvenida) return <Bienvenida nombre={bienvenida} alTerminar={() => onLoginSuccess?.()} />;

  const ojo = (
    <Boton type="button" variante="fantasma" tamano="peq" soloIcono onClick={() => setVerContrasena((v) => !v)}
      aria-label={verContrasena ? 'Ocultar la contraseña' : 'Mostrar la contraseña'} aria-pressed={verContrasena}
      icono={verContrasena ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />} />
  );

  return (
    <div className="acceso">
      <Starfield />
      <main className="acceso__cuerpo">
        <section className="acceso__escaparate" aria-labelledby="acceso-lema">
          <div className="acceso__marca">
            <img src="/Logo.png" alt="" width="56" height="56" />
            <span>AstroCode</span>
          </div>
          <h1 id="acceso-lema">Aprende Python viajando por el sistema solar</h1>
          <p className="acceso__lema">Escribe código de verdad, míralo aterrizar un cohete y enciende una estrella por cada ejercicio.</p>
          <ul className="acceso__puntos">
            <li><Orbit size={20} aria-hidden="true" />Seis planetas, de Mercurio a Saturno</li>
            <li><Rocket size={20} aria-hidden="true" />Misiones, sabotajes y retos que se ven funcionar</li>
            <li><Bot size={20} aria-hidden="true" />AstroTutor te da pistas sin soltarte la solución</li>
          </ul>
        </section>

        <div className="acceso__lado">
          <div className="acceso__sistema"><SistemaDecorativo /></div>
          <section className="acceso__tarjeta">
            <div className="acceso__modos" role="tablist" aria-label="Acceso">
              <button type="button" role="tab" id="acceso-tab-entrar" aria-selected={esEntrar} aria-controls="acceso-formulario"
                onClick={() => cambiarModo('entrar')}>Entrar</button>
              <button type="button" role="tab" id="acceso-tab-crear" aria-selected={!esEntrar} aria-controls="acceso-formulario"
                onClick={() => cambiarModo('crear')}>Crear cuenta</button>
            </div>

            <div id="acceso-formulario" role="tabpanel" aria-labelledby={esEntrar ? 'acceso-tab-entrar' : 'acceso-tab-crear'}>
              <form ref={formulario} className="acceso__formulario" noValidate onSubmit={enviar} aria-busy={ocupado}>
                <div className="acceso__cabecera">
                  <h2>{esEntrar ? 'Hola de nuevo' : 'Empieza tu viaje'}</h2>
                  <p>{esEntrar ? 'Entra para seguir donde lo dejaste.' : 'Solo lo justo para guardar tu progreso.'}</p>
                </div>

                {aviso && <Aviso tono="exito" titulo="Cuenta creada">{aviso}</Aviso>}
                {fallo && <Aviso tono="error" titulo={esEntrar ? 'No se pudo entrar' : 'No se pudo crear la cuenta'}>{fallo}</Aviso>}

                {!esEntrar && (
                  <Campo etiqueta="Nombre de usuario" name="usuario" autoComplete="username" value={datos.usuario} onChange={cambiar('usuario')}
                    error={errores.usuario} ayuda="Es el nombre que verán los demás en el ranking." disabled={ocupado} />
                )}
                <Campo etiqueta="Correo electrónico" name="correo" type="email" inputMode="email" autoComplete="email"
                  value={datos.correo} onChange={cambiar('correo')} error={errores.correo} disabled={ocupado} />
                {!esEntrar && (
                  <Campo etiqueta="Nombre completo (opcional)" name="nombre" autoComplete="name" value={datos.nombre}
                    onChange={cambiar('nombre')} disabled={ocupado} />
                )}
                <Campo etiqueta="Contraseña" name="contrasena" type={verContrasena ? 'text' : 'password'}
                  autoComplete={esEntrar ? 'current-password' : 'new-password'} value={datos.contrasena} onChange={cambiar('contrasena')}
                  error={errores.contrasena} ayuda={esEntrar ? undefined : 'Al menos 8 caracteres.'} accesorio={ojo} disabled={ocupado} />
                {!esEntrar && (
                  <Campo etiqueta="Repite la contraseña" name="repetir" type={verContrasena ? 'text' : 'password'} autoComplete="new-password"
                    value={datos.repetir} onChange={cambiar('repetir')} error={errores.repetir} disabled={ocupado} />
                )}

                <Boton type="submit" variante="primario" tamano="grande" anchoCompleto cargando={ocupado}
                  icono={esEntrar ? <LogIn size={18} aria-hidden="true" /> : <UserPlus size={18} aria-hidden="true" />}>
                  {esEntrar ? (entrando ? 'Entrando…' : 'Entrar') : (ocupado ? 'Creando tu cuenta…' : 'Crear cuenta')}
                </Boton>

                <p className="acceso__cambio">
                  {esEntrar ? '¿Primera vez aquí?' : '¿Ya tienes cuenta?'}{' '}
                  <button type="button" className="acceso__enlace" onClick={() => cambiarModo(esEntrar ? 'crear' : 'entrar')}>
                    {esEntrar ? 'Crea tu cuenta' : 'Entra'}
                  </button>
                </p>
              </form>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Acceso;
