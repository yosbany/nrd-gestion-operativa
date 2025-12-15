# Generar Iconos para NRD Gestión Operativa

Este documento explica cómo generar los iconos necesarios para la aplicación PWA.

## Opción 1: Script Node.js (Recomendado)

### Con Canvas instalado (genera PNG directamente):
```bash
npm install canvas
node generate-new-icons.js
```

### Sin Canvas (genera SVG, luego convertir):
```bash
node generate-new-icons.js
# Luego usar generate-icons.html o convertir manualmente
```

## Opción 2: Generador HTML (Más fácil)

1. Abre `generate-icons.html` en tu navegador
2. Haz clic en los botones para descargar:
   - `icon-192.png`
   - `icon-512.png`
3. Los archivos se descargarán automáticamente

## Opción 3: Scripts Legacy

También puedes usar los scripts originales (actualizados con el nuevo texto):

```bash
# Con canvas
node create-icons.js

# Con sharp
npm install sharp
node create-png-icons.js
```

## Especificaciones de los Iconos

- **Tamaños requeridos:**
  - `icon-192.png` - 192x192 píxeles
  - `icon-512.png` - 512x512 píxeles

- **Diseño:**
  - Fondo: Gradiente rojo (#dc2626 a #b91c1c)
  - Texto: Blanco (#ffffff)
  - Texto principal: "NRD" (tamaño grande)
  - Texto secundario: "GESTIÓN OPERATIVA" (dos líneas)
  - Icono decorativo: Círculos conectados (representando procesos)

## Verificación

Después de generar los iconos, verifica que:
1. Los archivos `icon-192.png` e `icon-512.png` existen en la raíz del proyecto
2. Los iconos se ven correctamente en `manifest.json`
3. La aplicación se puede instalar como PWA

## Notas

- Los iconos SVG se generan siempre como respaldo
- Si no tienes Node.js, usa la opción 2 (HTML)
- Los iconos deben tener esquinas redondeadas para mejor apariencia en dispositivos móviles
