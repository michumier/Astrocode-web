// Paleta común de los retos con rejillas y píxeles (lengua alienígena, nebulosa). Diseño D8.
export const PALETA: { nombre: string; color: string }[] = [
  { nombre: 'negro', color: '#101320' },
  { nombre: 'azul', color: '#1e88e5' },
  { nombre: 'rojo', color: '#e53935' },
  { nombre: 'verde', color: '#43a047' },
  { nombre: 'amarillo', color: '#fdd835' },
  { nombre: 'gris', color: '#9e9e9e' },
  { nombre: 'morado', color: '#8e24aa' },
  { nombre: 'naranja', color: '#fb8c00' },
  { nombre: 'cian', color: '#00bcd4' },
  { nombre: 'granate', color: '#880e4f' },
];

// Texto legible encima de cada color (para el modo «ver números»)
export const textoSobre = (valor: number) => ([4, 5, 8].includes(valor) ? '#111' : '#fff');
