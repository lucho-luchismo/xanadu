# Xanadu — paquete final para GitHub Pages

## Qué incluye
- App web instalable (PWA)
- Funciona sin conexión una vez cargada
- Base local con IndexedDB
- Exportar / importar JSON
- Imagen de tapa con cámara en celular y archivo en desktop
- Idioma por defecto: Español
- Guardián por defecto: se completa con el último guardián cargado con valor
- Joyitas con límite blando recomendado de 12

## Cómo subir a GitHub Pages
1. Creá un repositorio nuevo en GitHub, por ejemplo `xanadu`.
2. Subí todos los archivos de esta carpeta al repositorio.
3. En GitHub, andá a **Settings > Pages**.
4. En **Build and deployment**, elegí:
   - **Source:** Deploy from a branch
   - **Branch:** `main`
   - **Folder:** `/ (root)`
5. Guardá.
6. Esperá unos segundos y abrí la URL que te da GitHub Pages.

## Uso offline
- Abrí la app una vez con internet.
- Después ya puede abrirse sin conexión.
- Si la instalás como app, funciona mejor en celular.

## Cómo pasar el JSON del celular a la PC
### En celular
1. Tocá **Exportar JSON**.
2. Si aparece compartir, elegí **Archivos**, **Guardar en Archivos** o enviátelo por mail/Drive/WhatsApp.
3. Si no aparece compartir, el navegador descargará el archivo.

### En PC
1. Abrí la app.
2. Tocá **Importar JSON**.
3. Elegí el archivo exportado desde el celular.

## Notas
- Esta versión no sincroniza automáticamente entre dispositivos.
- Cada dispositivo tiene su propia base local.
- La transferencia entre dispositivos se hace con export/import JSON.
