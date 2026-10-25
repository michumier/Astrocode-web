import React from 'react';

// Muestra el texto de la IA interpretando solo **negrita** y `código`.
// No usa innerHTML: todo se pinta como texto, así que no hay riesgo de inyectar HTML.
const TextoIA: React.FC<{ texto: string; className?: string }> = ({ texto, className }) => {
  const partes = texto.split(/(\*\*[^*\n]+\*\*|`[^`\n]+`)/g);
  return (
    <p className={className}>
      {partes.map((parte, i) => {
        if (parte.startsWith('**') && parte.endsWith('**') && parte.length > 4) {
          return <strong key={i}>{parte.slice(2, -2)}</strong>;
        }
        if (parte.startsWith('`') && parte.endsWith('`') && parte.length > 2) {
          return <code key={i}>{parte.slice(1, -1)}</code>;
        }
        return <React.Fragment key={i}>{parte}</React.Fragment>;
      })}
    </p>
  );
};

export default TextoIA;
