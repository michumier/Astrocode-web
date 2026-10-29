import React, { useEffect, useRef, useState } from 'react';
import { Bomb, Bot, Bug, Rocket } from 'lucide-react';
import { Boton, Constelacion } from '../../components/ui';
import type { Estrella } from '../../components/ui';
import Starfield from '../../components/solar-system/Starfield';
import SistemaDecorativo from '../../components/solar-system/SistemaDecorativo';
import './Acceso.css';

// Constelación de ejemplo: dos estrellas encendidas, la siguiente en oro y el resto por encender
const EJEMPLO: Estrella[] = ['hecha', 'hecha', 'siguiente', 'pendiente', 'pendiente', 'pendiente', 'pendiente'].map((estado, i) => ({
  id: String(i),
  titulo: `Ejercicio ${i + 1}`,
  estado: estado as Estrella['estado'],
}));

const PASOS: { titulo: string; texto: string; dibujo: React.ReactNode }[] = [
  {
    titulo: 'Tu mapa es el sistema solar',
    texto: 'Cada planeta es un nivel. Mercurio, Venus y la Tierra están abiertos desde el principio; Marte, Júpiter y Saturno se abren al sumar 500, 1.000 y 1.500 puntos.',
    dibujo: <div className="bienvenida__sistema"><SistemaDecorativo /></div>,
  },
  {
    titulo: 'Cada ejercicio enciende una estrella',
    texto: 'Los ejercicios de un planeta forman su constelación. Resuelve uno y su estrella se enciende; la que parpadea en oro es la siguiente.',
    dibujo: <Constelacion planeta="Mercurio" estrellas={EJEMPLO} className="bienvenida__constelacion" />,
  },
  {
    titulo: 'Código que se ve funcionar',
    texto: 'Aterriza un cohete, encuentra el fallo que ha colado un saboteador o desactiva una bomba. Si te atascas, AstroTutor te da una pista.',
    dibujo: (
      <ul className="bienvenida__formatos" aria-hidden="true">
        <li><Rocket size={28} />Misiones</li>
        <li><Bug size={28} />Sabotajes</li>
        <li><Bomb size={28} />Retos</li>
        <li><Bot size={28} />AstroTutor</li>
      </ul>
    ),
  },
];

interface PropsBienvenida {
  nombre: string;
  alTerminar: () => void;
}

// Tres pasos tras crear la cuenta. Se pueden saltar.
const Bienvenida: React.FC<PropsBienvenida> = ({ nombre, alTerminar }) => {
  const [paso, setPaso] = useState(0);
  const titulo = useRef<HTMLHeadingElement>(null);
  const primeraVez = useRef(true);
  const ultimo = paso === PASOS.length - 1;
  const actual = PASOS[paso];

  // Al cambiar de paso, el foco va a su título para que el lector de pantalla lo lea
  useEffect(() => {
    if (primeraVez.current) { primeraVez.current = false; return; }
    titulo.current?.focus();
  }, [paso]);

  return (
    <div className="acceso bienvenida">
      <Starfield />
      <main className="bienvenida__tarjeta" aria-labelledby="bienvenida-titulo">
        <p className="bienvenida__saludo">Te damos la bienvenida, <strong>{nombre}</strong></p>
        <div className="bienvenida__dibujo" key={paso}>{actual.dibujo}</div>
        <h1 id="bienvenida-titulo" ref={titulo} tabIndex={-1}>{actual.titulo}</h1>
        <p className="bienvenida__texto">{actual.texto}</p>

        <div className="bienvenida__pie">
          <div className="bienvenida__puntos" role="group" aria-label="Pasos">
            {PASOS.map((p, i) => (
              <button key={p.titulo} type="button" className={i === paso ? 'activo' : ''} onClick={() => setPaso(i)}
                aria-label={`Paso ${i + 1} de ${PASOS.length}: ${p.titulo}`} aria-current={i === paso ? 'step' : undefined} />
            ))}
          </div>
          <div className="bienvenida__botones">
            {!ultimo && <Boton variante="fantasma" onClick={alTerminar}>Saltar</Boton>}
            <Boton variante="primario" tamano="grande" onClick={() => (ultimo ? alTerminar() : setPaso(paso + 1))}>
              {ultimo ? 'Ir al mapa' : 'Siguiente'}
            </Boton>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Bienvenida;
