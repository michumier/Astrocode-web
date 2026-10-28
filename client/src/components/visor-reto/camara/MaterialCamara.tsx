import React from 'react';
import { PropsMaterial } from '../MaterialGenerico';
import './Camara.css';

const formatear = (n: number) => n.toLocaleString('es-ES');

// Pestaña 🏦 Cámaras: los datos públicos de cada cámara visible
const MaterialCamara: React.FC<PropsMaterial> = ({ material }) => (
  <div className="camara-material">
    {material.map(({ nombre, material: m }) => (
      <section key={nombre}>
        <h4>🏦 {nombre}</h4>
        {m.variante === 'huella' && (
          <>
            <p>Huella del PIN: <code className="camara-huella">{m.huella}</code></p>
            <p>PIN de <strong>{m.cifras} cifras</strong>{m.candidatos ? <> · el espía consiguió <strong>{formatear(m.candidatos.length)} candidatos</strong></> : <> · sin lista del espía: hay que probar los {formatear(10 ** m.cifras)} posibles</>}</p>
            {m.candidatos && (
              <details>
                <summary>Ver los primeros candidatos</summary>
                <p className="camara-lista">{m.candidatos.slice(0, 60).join(' · ')}{m.candidatos.length > 60 ? ' …' : ''}</p>
              </details>
            )}
          </>
        )}
        {m.variante === 'binaria' && (
          <p>Código entre <strong>{formatear(m.minimo)}</strong> y <strong>{formatear(m.maximo)}</strong> · <strong>{m.intentos} intentos</strong> antes de la alarma</p>
        )}
        {m.variante === 'combinacion' && (
          <p>4 cifras distintas ({formatear(m.combinaciones)} combinaciones posibles) · <strong>{m.intentos} intentos</strong></p>
        )}
      </section>
    ))}
    {material[0]?.material?.variante === 'combinacion' && (
      <p className="camara-leyenda">● = cifra correcta en su sitio (exacto) · ○ = cifra que está, pero en otro sitio (descolocado)</p>
    )}
  </div>
);

export default MaterialCamara;
