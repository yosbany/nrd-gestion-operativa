
# Cómo crear los iconos para la PWA

Los iconos son necesarios para que la app sea instalable. Tienes dos opciones:

## Opción 1: Usar el generador HTML (Recomendado)
1. Abre el archivo generate-icons.html en tu navegador
2. Haz clic en los botones para descargar icon-192.png e icon-512.png
3. Coloca los archivos en la raíz del proyecto

## Opción 2: Instalar dependencias y usar este script
npm install sharp
node create-png-icons.js

## Opción 3: Usar una herramienta online
- Visita https://realfavicongenerator.net/
- Sube una imagen de 512x512px
- Descarga los iconos generados
- Renombra icon-192.png e icon-512.png y colócalos en la raíz

## Opción 4: Crear manualmente
Crea dos imágenes PNG:
- icon-192.png (192x192 píxeles)
- icon-512.png (512x512 píxeles)
Con fondo rojo (#dc2626) y texto blanco "NRD PEDIDOS"
