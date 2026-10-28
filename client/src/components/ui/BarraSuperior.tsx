import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { LogOut, Star, UserRound } from 'lucide-react';
import './ui.css';

export interface EnlaceBarra {
  a: string;
  texto: string;
  // Sin esto, «Mapa» (/) se marcaría activo en todas las rutas
  exacto?: boolean;
}

export const ENLACES_ALUMNO: EnlaceBarra[] = [
  { a: '/', texto: 'Mapa', exacto: true },
  { a: '/guia', texto: 'Guía de Python' },
  { a: '/ranking', texto: 'Ranking' },
];

interface PropsBarra {
  puntos?: number | null;
  nombre?: string | null;
  enlaces?: EnlaceBarra[];
  alPerfil?: () => void;
  alSalir?: () => void;
}

const formatear = (n: number) => n.toLocaleString('es-ES');

const BarraSuperior: React.FC<PropsBarra> = ({ puntos, nombre, enlaces = ENLACES_ALUMNO, alPerfil, alSalir }) => {
  const [abierto, setAbierto] = useState(false);
  const caja = useRef<HTMLDivElement>(null);

  // El menú se cierra al pulsar fuera o con Escape
  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: MouseEvent) => { if (!caja.current?.contains(e.target as Node)) setAbierto(false); };
    const tecla = (e: KeyboardEvent) => { if (e.key === 'Escape') setAbierto(false); };
    document.addEventListener('mousedown', fuera);
    document.addEventListener('keydown', tecla);
    return () => {
      document.removeEventListener('mousedown', fuera);
      document.removeEventListener('keydown', tecla);
    };
  }, [abierto]);

  const inicial = (nombre || '?').trim().charAt(0).toUpperCase();

  return (
    <header className="ui-barra">
      <Link className="ui-barra__marca" to="/">
        <img src="/Logo.png" alt="" />
        <span className="ui-barra__nombre">AstroCode</span>
      </Link>
      <nav className="ui-barra__nav" aria-label="Principal">
        {enlaces.map((e) => (
          <NavLink key={e.a} to={e.a} end={e.exacto}>{e.texto}</NavLink>
        ))}
      </nav>
      <div className="ui-barra__der">
        {typeof puntos === 'number' && (
          <span className="ui-puntos" aria-label={`${formatear(puntos)} puntos`}>
            <Star size={18} fill="currentColor" aria-hidden="true" />{formatear(puntos)} pts
          </span>
        )}
        <div className="ui-avatar" ref={caja}>
          <button className="ui-avatar__boton" aria-label={`Menú de ${nombre || 'tu cuenta'}`} aria-haspopup="menu" aria-expanded={abierto}
            onClick={() => setAbierto((a) => !a)}>
            {inicial}
          </button>
          {abierto && (
            <div className="ui-menu" role="menu">
              {alPerfil && <button role="menuitem" onClick={() => { setAbierto(false); alPerfil(); }}><UserRound size={18} aria-hidden="true" />Mi perfil</button>}
              {alSalir && <button role="menuitem" onClick={() => { setAbierto(false); alSalir(); }}><LogOut size={18} aria-hidden="true" />Cerrar sesión</button>}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default BarraSuperior;
