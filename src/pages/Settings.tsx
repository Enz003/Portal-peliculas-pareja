import React from 'react';
import { PageHeader } from '../components/PageHeader';

export function SettingsPage() {
  return (
    <div>
      <PageHeader title="Ajustes" subtitle="Configuración de entorno / backend" />

      <div className="grid">
        <div className="card col-12">
          <h3>Backend (proyecto aparte)</h3>
          <div className="sub" style={{ marginTop: 8 }}>
            Este frontend fue preparado para que el backend viva en otro repo.
            Todas las llamadas al backend están centralizadas en <code>src/api</code>.
          </div>

          <div style={{ marginTop: 12 }}>
            <div className="badge">Modo demo (sin backend): <strong>por defecto</strong></div>
            <div className="sub" style={{ marginTop: 6 }}>
              Se usa una implementación mock con <code>localStorage</code>.
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <div className="badge">Modo backend real</div>
            <div className="sub" style={{ marginTop: 6 }}>
              Creá un archivo <code>.env</code> en la raíz del proyecto con:
              <pre style={{ whiteSpace: 'pre-wrap', marginTop: 10 }}>
VITE_API_BASE_URL=http://localhost:3000
              </pre>
              y levantá tu backend en esa URL.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
