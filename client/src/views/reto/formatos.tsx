import React from 'react';
import VisorGenerico, { PropsVisor } from '../../components/visor-reto/VisorGenerico';
import MaterialGenerico, { PropsMaterial } from '../../components/visor-reto/MaterialGenerico';
import { etiquetaFormato } from '../../components/visor-reto/etiquetas';

// Registro de formatos de reto (fase 5). Cada formato aporta su visor y su pestaña de material;
// los que no tienen aún los suyos usan los genéricos. Las misiones de pilotaje usan VisorMision.
export interface Formato {
  etiqueta: string;
  // Texto del botón que ejecuta un escenario visible
  probar: string;
  // Título de la pestaña con el material (manual, ejemplos, expediente...)
  tituloMaterial: string;
  // Título del modal al superarlo
  exito: string;
  Visor: React.FC<PropsVisor>;
  Material: React.FC<PropsMaterial>;
}

const GENERICO: Omit<Formato, 'etiqueta'> = {
  probar: '▶ Probar',
  tituloMaterial: '📎 Material',
  exito: '🎉 ¡Reto superado!',
  Visor: VisorGenerico,
  Material: MaterialGenerico,
};

const FORMATOS: Record<string, Partial<Formato>> = {
  pilotaje: { probar: '🚀 Lanzar', exito: '🎉 ¡Misión cumplida!' },
  diagnostico: { tituloMaterial: '🧪 Datos de calibración' },
};

export const formatoDe = (id: string): Formato => ({
  ...GENERICO,
  etiqueta: etiquetaFormato(id),
  ...FORMATOS[id],
});
