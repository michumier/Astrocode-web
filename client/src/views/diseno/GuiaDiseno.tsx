import React, { useState } from 'react';
import { Play, RotateCcw, Rocket } from 'lucide-react';
import { Aviso, BarraSuperior, Boton, Calificacion, Campo, CampoArea, CampoSelector, Constelacion, Enhorabuena, Etiqueta, Panel } from '../../components/ui';
import CodigoResaltado from '../../components/code-editor/CodigoResaltado';
import type { Estrella } from '../../components/ui';
import './GuiaDiseno.css';

// Muestrario del sistema de diseño (fase 6). Solo existe en desarrollo: /diseno
const COLORES = [
  { nombre: 'Noche', valor: '#0E1C2B', uso: 'fondo' },
  { nombre: 'Sarga', valor: '#15263A', uso: 'paneles' },
  { nombre: 'Relieve', valor: '#1C3149', uso: 'controles' },
  { nombre: 'Turquesa', valor: '#5CC8C2', uso: 'progreso' },
  { nombre: 'Oro', valor: '#F4B942', uso: 'acción y puntos' },
  { nombre: 'Coral', valor: '#FF7A59', uso: 'solo «Difícil»' },
];

const venus: Estrella[] = [
  { id: '1', titulo: 'Cuenta regresiva de lanzamiento', estado: 'hecha' },
  { id: '2', titulo: 'Comprobación del traje espacial', estado: 'hecha' },
  { id: '3', titulo: 'Bucles de órbita', estado: 'hecha' },
  { id: '4', titulo: 'Funciones de navegación', estado: 'hecha' },
  { id: '5', titulo: 'Lista de tripulantes', estado: 'hecha' },
  { id: '6', titulo: 'La cámara de Ceres', estado: 'siguiente' },
  { id: '7', titulo: 'Sabotaje en el reactor', estado: 'pendiente' },
  { id: '8', titulo: 'Aterrizaje en Ishtar', estado: 'pendiente' },
  { id: '9', titulo: 'Calculadora de combustible', estado: 'pendiente' },
];
const mercurio: Estrella[] = Array.from({ length: 6 }, (_, i) => ({ id: String(i), titulo: `Ejercicio ${i + 1}`, estado: 'hecha' as const }));
const marte: Estrella[] = Array.from({ length: 12 }, (_, i) => ({ id: String(i), titulo: `Ejercicio ${i + 1}`, estado: i === 0 ? 'siguiente' as const : 'pendiente' as const }));

const GuiaDiseno: React.FC = () => {
  const [cargando, setCargando] = useState(false);
  const [premio, setPremio] = useState(false);
  const probarCarga = () => {
    setCargando(true);
    setTimeout(() => setCargando(false), 1500);
  };

  return (
    <div className="guia-diseno">
      <BarraSuperior puntos={320} nombre="lucia" alPerfil={() => undefined} alSalir={() => undefined} />
      <main className="guia-diseno__cuerpo">
        <h1>Sistema de diseño</h1>
        <p className="guia-diseno__intro">Muestrario de la fase 6. Las pantallas se pasan a este sistema por subfases.</p>

        <Panel titulo="Color">
          <div className="guia-diseno__colores">
            {COLORES.map((c) => (
              <div key={c.nombre} className="guia-diseno__color">
                <i style={{ background: c.valor }} />
                <b>{c.nombre}</b>
                <span>{c.valor} · {c.uso}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel titulo="Tipografía">
          <div className="guia-diseno__tipos">
            <span className="t1">Elige tu próximo planeta</span>
            <span className="t2">La cámara de Ceres</span>
            <span className="t3">Objetivos del ejercicio</span>
            <span className="t4">Onest para leer: enunciados, botones y menús. Bricolage Grotesque para los títulos.</span>
            <code>for segundo in range(10, 0, -1):</code>
          </div>
        </Panel>

        <Panel titulo="Botones">
          <div className="guia-diseno__fila">
            <Boton variante="primario" icono={<Play size={16} fill="currentColor" aria-hidden="true" />}>Ejecutar</Boton>
            <Boton variante="primario" cargando={cargando} onClick={probarCarga}>{cargando ? 'Ejecutando…' : 'Probar la carga'}</Boton>
            <Boton variante="primario" disabled>Desactivado</Boton>
            <Boton variante="secundario">Enviar solución</Boton>
            <Boton variante="fantasma">Ver ranking completo</Boton>
            <Boton variante="peligro">Borrar progreso</Boton>
            <Boton variante="secundario" soloIcono aria-label="Reiniciar el código" icono={<RotateCcw size={18} aria-hidden="true" />} />
          </div>
          <div className="guia-diseno__fila">
            <Boton variante="primario" tamano="grande" icono={<Rocket size={18} aria-hidden="true" />}>Empezar reto</Boton>
            <Boton variante="secundario" tamano="peq">Filtrar</Boton>
            <Boton a="/" variante="secundario">Enlace con aspecto de botón</Boton>
            <span className="guia-diseno__oro"><Boton variante="oscuro">Sobre oro</Boton></span>
          </div>
        </Panel>

        <Panel titulo="Etiquetas">
          <div className="guia-diseno__fila">
            <Etiqueta tono="facil">Fácil</Etiqueta>
            <Etiqueta tono="intermedio">Intermedio</Etiqueta>
            <Etiqueta tono="dificil">Difícil</Etiqueta>
            <Etiqueta>200 pts</Etiqueta>
            <Etiqueta tono="turquesa">Hecho</Etiqueta>
          </div>
        </Panel>

        <Panel titulo="Campos">
          <div className="guia-diseno__campos">
            <Campo etiqueta="Correo electrónico" type="email" placeholder="tu@correo.com" />
            <Campo etiqueta="Nombre de cadete" defaultValue="lucia" ayuda="Así te verán en el ranking." />
            <Campo etiqueta="Contraseña" type="password" defaultValue="12345" error="Usa al menos 8 caracteres." />
            <CampoSelector etiqueta="Nivel" defaultValue="1"><option value="1">Fácil</option><option value="2">Intermedio</option></CampoSelector>
            <CampoArea etiqueta="Código base" codigo rows={3} defaultValue={`def saludar(nombre):
    return "Hola, " + nombre`} />
          </div>
        </Panel>

        <Panel titulo="Avisos">
          <div className="guia-diseno__campos">
            <Aviso tono="exito" titulo="Ejercicio superado · +100 pts">Se ha encendido una estrella en Venus.</Aviso>
            <Aviso tono="atencion" titulo="Te faltan 180 pts para Marte">El reto diario da +50.</Aviso>
            <Aviso tono="error" titulo="No se pudo ejecutar el código">Revisa la conexión e inténtalo de nuevo.</Aviso>
            <Aviso tono="info" titulo="Las pistas no regalan la solución" />
          </div>
        </Panel>

        <Panel titulo="Constelaciones" extra={<span className="guia-diseno__extra">la figura es siempre la misma para cada planeta</span>}>
          <div className="guia-diseno__constelaciones">
            <figure><Constelacion planeta="Venus" estrellas={venus} /><figcaption>Venus · 5 de 9</figcaption></figure>
            <figure><Constelacion planeta="Mercurio" estrellas={mercurio} /><figcaption>Mercurio · completa</figcaption></figure>
            <figure><Constelacion planeta="Marte" estrellas={marte} /><figcaption>Marte · recién abierto</figcaption></figure>
          </div>
        </Panel>
        <Panel titulo="Código de solo lectura y calificación">
          <div className="guia-diseno__campos">
            <CodigoResaltado etiqueta="Ejemplo" className="guia-diseno__codigo" codigo={`# Cuenta atrás
for segundo in range(3, 0, -1):
    print(segundo)
print("¡Despegue!")`} />
            <div className="guia-diseno__fila"><Calificacion estrellas={0} /><Calificacion estrellas={2} /><Calificacion estrellas={3} tamano={24} /></div>
            <div><Boton variante="secundario" onClick={() => setPremio(true)}>Abrir la enhorabuena</Boton></div>
          </div>
        </Panel>
      </main>
      {premio && (
        <Enhorabuena titulo="¡Misión cumplida!" subtitulo="Aterrizaje de emergencia" alVolver={() => setPremio(false)} alCerrar={() => setPremio(false)}
          datos={[{ valor: '+150', etiqueta: 'puntos' }, { valor: <Calificacion estrellas={2} tamano={24} />, etiqueta: 'estrellas' }]} />
      )}
    </div>
  );
};

export default GuiaDiseno;
