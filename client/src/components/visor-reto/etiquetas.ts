// Etiquetas de cada formato de reto (fase 5) para el mapa y las listas.
// Va aparte del registro de formatos para no cargar los visores en el dashboard.
export const ETIQUETAS: Record<string, string> = {
  pilotaje: '🚀 Misión',
  diagnostico: '🧪 Calibración',
  bomba: '💣 Bomba',
};

export const etiquetaFormato = (formato?: string | null) => ETIQUETAS[formato || ''] || '🧪 Reto';

// Tareas que se abren en la vista de simulación (VistaReto) en lugar del ejercicio normal
export const esSimulacion = (tipo?: string | null) => tipo === 'pilotaje' || tipo === 'reto';
