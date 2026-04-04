# Xanadu

Versión estática lista para subir a GitHub Pages.

## Archivos principales
- `index.html`: estructura
- `app.js`: lógica y persistencia
- `theme.css`: capa visual
- `sw.js`: service worker offline
- `manifest.json`: PWA mínima

## Subida a GitHub
1. Crear o abrir el repositorio.
2. Subir todos los archivos de esta carpeta a la raíz del repo.
3. En GitHub: **Settings → Pages**.
4. En **Build and deployment**, elegir **Deploy from a branch**.
5. Elegir rama `main` y carpeta `/root`.
6. Guardar.

## Observaciones
- Guarda datos en `localStorage` del navegador.
- Permite exportar/importar JSON.
- Funciona offline luego de la primera carga.
- El service worker usa cache versionado `xanadu-cache-v1`.
