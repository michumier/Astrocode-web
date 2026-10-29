import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Boton, Calificacion, Campo, Constelacion, Enhorabuena, colocarEstrellas, tonoDeNivel } from './index';
import { ALTO, ANCHO } from './Constelacion';
import type { Estrella } from './index';

describe('Constelación', () => {
  test('la misma figura para el mismo planeta y otra para otro planeta', () => {
    expect(colocarEstrellas('Venus', 9)).toEqual(colocarEstrellas('Venus', 9));
    expect(colocarEstrellas('Venus', 9)).not.toEqual(colocarEstrellas('Marte', 9));
  });

  test('las estrellas caben en el cielo y no se pisan', () => {
    for (const planeta of ['Mercurio', 'Venus', 'Tierra', 'Marte', 'Júpiter', 'Saturno']) {
      for (const n of [1, 2, 5, 9, 12]) {
        const puntos = colocarEstrellas(planeta, n);
        expect(puntos).toHaveLength(n);
        for (const p of puntos) {
          expect(p.x).toBeGreaterThanOrEqual(0);
          expect(p.x).toBeLessThanOrEqual(ANCHO);
          expect(p.y).toBeGreaterThanOrEqual(0);
          expect(p.y).toBeLessThanOrEqual(ALTO);
        }
        for (let i = 0; i < n; i++) {
          for (let j = i + 1; j < n; j++) {
            expect(Math.hypot(puntos[i].x - puntos[j].x, puntos[i].y - puntos[j].y)).toBeGreaterThan(14);
          }
        }
      }
    }
  });

  test('describe el progreso para lectores de pantalla', () => {
    const estrellas: Estrella[] = [
      { id: '1', titulo: 'Uno', estado: 'hecha' },
      { id: '2', titulo: 'Dos', estado: 'hecha' },
      { id: '3', titulo: 'La cámara de Ceres', estado: 'siguiente' },
      { id: '4', titulo: 'Cuatro', estado: 'pendiente' },
    ];
    render(<Constelacion planeta="Venus" estrellas={estrellas} />);
    expect(screen.getByRole('img')).toHaveAccessibleName(
      'Constelación de Venus: 2 de 4 ejercicios hechos; el siguiente es La cámara de Ceres'
    );
  });
});

describe('Botón', () => {
  test('mientras carga se desactiva y lo anuncia', () => {
    render(<Boton variante="primario" cargando>Ejecutar</Boton>);
    const boton = screen.getByRole('button', { name: 'Ejecutar' });
    expect(boton).toBeDisabled();
    expect(boton).toHaveAttribute('aria-busy', 'true');
    expect(boton).toHaveAttribute('type', 'button');
  });

  test('con «a» es un enlace de la web con aspecto de botón', () => {
    render(<MemoryRouter><Boton a="/ranking" variante="fantasma">Ver ranking</Boton></MemoryRouter>);
    const enlace = screen.getByRole('link', { name: 'Ver ranking' });
    expect(enlace).toHaveAttribute('href', '/ranking');
    expect(enlace).toHaveClass('ui-boton', 'ui-boton--fantasma');
  });

  test('solo con icono usa el aria-label', () => {
    render(<Boton soloIcono aria-label="Reiniciar el código" icono={<svg />}>Texto oculto</Boton>);
    expect(screen.getByRole('button', { name: 'Reiniciar el código' })).not.toHaveTextContent('Texto oculto');
  });
});

describe('Campo', () => {
  test('la etiqueta y el error quedan ligados al campo', () => {
    render(<Campo etiqueta="Contraseña" type="password" error="Usa al menos 8 caracteres." />);
    const campo = screen.getByLabelText('Contraseña');
    expect(campo).toHaveAttribute('aria-invalid', 'true');
    expect(campo).toHaveAccessibleDescription('Usa al menos 8 caracteres.');
  });
});

test('la dificultad da el tono de la etiqueta', () => {
  expect(tonoDeNivel('Fácil')).toBe('facil');
  expect(tonoDeNivel('Intermedio')).toBe('intermedio');
  expect(tonoDeNivel('Difícil')).toBe('dificil');
  expect(tonoDeNivel(null)).toBe('neutro');
});

describe('Enhorabuena', () => {
  test('lleva el foco a «Volver al mapa», se cierra con Escape y enseña la calificación', () => {
    const alCerrar = jest.fn();
    render(
      <Enhorabuena titulo="¡Misión cumplida!" datos={[{ valor: '+300', etiqueta: 'puntos' }, { valor: <Calificacion estrellas={2} />, etiqueta: 'estrellas' }]}
        alVolver={() => undefined} alCerrar={alCerrar} textoCerrar="Ver los vuelos" />,
    );
    expect(screen.getByRole('dialog', { name: '¡Misión cumplida!' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Volver al mapa' })).toHaveFocus();
    expect(screen.getByRole('img', { name: '2 de 3 estrellas' })).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    fireEvent.click(screen.getByRole('button', { name: 'Ver los vuelos' }));
    expect(alCerrar).toHaveBeenCalledTimes(2);
  });
});
