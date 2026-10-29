import React from 'react';
import { render, screen } from '@testing-library/react';
import Enunciado, { analizarEnunciado } from './Enunciado';

const TEXTO = `Misión: Configuración de Nave Espacial

Como nuevo cadete, debes declarar una variable.

Contexto de la misión:
Estás a bordo de la estación AstroCode-1.

**Objetivos:**
- Declara una variable llamada "edad"
- Asígnale el valor \`25\`

¡Completa esta configuración!`;

test('separa párrafos, etiquetas y listas', () => {
  expect(analizarEnunciado(TEXTO).map((b) => b.tipo)).toEqual(['parrafo', 'parrafo', 'titulo', 'parrafo', 'titulo', 'lista', 'parrafo']);
});

test('pinta las etiquetas como títulos, las listas y el código, sin dejar los asteriscos', () => {
  render(<Enunciado texto={TEXTO} />);
  expect(screen.getByRole('heading', { name: 'Objetivos' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Contexto de la misión' })).toBeInTheDocument();
  expect(screen.getAllByRole('listitem')).toHaveLength(2);
  expect(screen.getByText('25').tagName).toBe('CODE');
  expect(document.body.textContent).not.toContain('**');
});

test('una lista pegada a un párrafo y un texto sin formato también funcionan', () => {
  expect(analizarEnunciado('Haz esto:\n- uno\n- dos').map((b) => b.tipo)).toEqual(['titulo', 'lista']);
  expect(analizarEnunciado('Solo una línea de texto normal y corriente que no es un título')).toEqual([
    { tipo: 'parrafo', lineas: ['Solo una línea de texto normal y corriente que no es un título'] },
  ]);
});

test('no interpreta HTML: se queda como texto', () => {
  render(<Enunciado texto={'<img src=x onerror=alert(1)> y **negrita**'} />);
  expect(document.querySelector('img')).toBeNull();
  expect(screen.getByText('negrita').tagName).toBe('STRONG');
});
