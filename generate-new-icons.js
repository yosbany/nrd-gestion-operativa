#!/usr/bin/env node

/**
 * Script para generar iconos de la aplicación NRD Gestión Operativa
 * 
 * Uso:
 *   node generate-new-icons.js
 * 
 * Requisitos:
 *   npm install canvas (opcional, para generar PNG directamente)
 *   O usar generate-icons.html en el navegador
 */

const fs = require('fs');
const path = require('path');

// Función para crear icono SVG
function createSVGIcon(size) {
  const fontSize1 = Math.round(size * 0.25); // NRD
  const fontSize2 = Math.round(size * 0.12); // GESTIÓN / OPERATIVA
  const y1 = Math.round(size / 2 - size * 0.12); // NRD
  const y2 = Math.round(size / 2 + size * 0.02); // GESTIÓN
  const y3 = Math.round(size / 2 + size * 0.14); // OPERATIVA
  
  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#dc2626;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#b91c1c;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#bgGradient)" rx="${size * 0.1}"/>
  
  <!-- Icono de proceso/operaciones (círculos conectados) -->
  <g opacity="0.3">
    <circle cx="${size * 0.3}" cy="${size * 0.25}" r="${size * 0.08}" fill="#ffffff"/>
    <circle cx="${size * 0.5}" cy="${size * 0.25}" r="${size * 0.08}" fill="#ffffff"/>
    <circle cx="${size * 0.7}" cy="${size * 0.25}" r="${size * 0.08}" fill="#ffffff"/>
    <line x1="${size * 0.38}" y1="${size * 0.25}" x2="${size * 0.42}" y2="${size * 0.25}" stroke="#ffffff" stroke-width="${size * 0.02}"/>
    <line x1="${size * 0.58}" y1="${size * 0.25}" x2="${size * 0.62}" y2="${size * 0.25}" stroke="#ffffff" stroke-width="${size * 0.02}"/>
  </g>
  
  <!-- Texto principal -->
  <text x="${size/2}" y="${y1}" font-family="Arial, sans-serif" font-size="${fontSize1}" font-weight="bold" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">NRD</text>
  <text x="${size/2}" y="${y2}" font-family="Arial, sans-serif" font-size="${fontSize2}" font-weight="bold" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">GESTIÓN</text>
  <text x="${size/2}" y="${y3}" font-family="Arial, sans-serif" font-size="${fontSize2}" font-weight="bold" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">OPERATIVA</text>
</svg>`;
}

// Función para crear icono PNG usando canvas (si está disponible)
function createPNGIcon(size, filename) {
  try {
    const { createCanvas } = require('canvas');
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    // Gradiente de fondo
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, '#dc2626');
    gradient.addColorStop(1, '#b91c1c');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    
    // Bordes redondeados (simulado)
    ctx.globalCompositeOperation = 'destination-in';
    ctx.beginPath();
    ctx.roundRect(0, 0, size, size, size * 0.1);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    
    // Icono de proceso (círculos conectados)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    const circleRadius = size * 0.08;
    const circleY = size * 0.25;
    ctx.beginPath();
    ctx.arc(size * 0.3, circleY, circleRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(size * 0.5, circleY, circleRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(size * 0.7, circleY, circleRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // Líneas conectando círculos
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = size * 0.02;
    ctx.beginPath();
    ctx.moveTo(size * 0.38, circleY);
    ctx.lineTo(size * 0.42, circleY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(size * 0.58, circleY);
    ctx.lineTo(size * 0.62, circleY);
    ctx.stroke();
    
    // Texto
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${size * 0.25}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('NRD', size / 2, size / 2 - size * 0.12);
    
    ctx.font = `bold ${size * 0.12}px Arial`;
    ctx.fillText('GESTIÓN', size / 2, size / 2 + size * 0.02);
    ctx.fillText('OPERATIVA', size / 2, size / 2 + size * 0.14);
    
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(filename, buffer);
    console.log(`✓ Creado ${filename} (${size}x${size})`);
    return true;
  } catch (e) {
    console.log(`✗ No se pudo crear PNG directamente: ${e.message}`);
    return false;
  }
}

// Función principal
function generateIcons() {
  console.log('Generando iconos para NRD Gestión Operativa...\n');
  
  const sizes = [192, 512];
  let pngCreated = false;
  
  // Intentar crear PNGs directamente
  try {
    require('canvas');
    sizes.forEach(size => {
      if (createPNGIcon(size, `icon-${size}.png`)) {
        pngCreated = true;
      }
    });
  } catch (e) {
    console.log('Canvas no disponible, generando SVGs...\n');
  }
  
  // Crear SVGs siempre
  sizes.forEach(size => {
    const svg = createSVGIcon(size);
    const filename = `icon-${size}.svg`;
    fs.writeFileSync(filename, svg);
    console.log(`✓ Creado ${filename} (${size}x${size})`);
  });
  
  console.log('\n✅ Iconos generados exitosamente!\n');
  
  if (!pngCreated) {
    console.log('📝 Nota: Se generaron archivos SVG. Para convertir a PNG:');
    console.log('   1. Abre generate-icons.html en tu navegador');
    console.log('   2. O instala canvas: npm install canvas');
    console.log('   3. O usa una herramienta online como https://cloudconvert.com/svg-to-png\n');
  }
}

// Ejecutar
if (require.main === module) {
  generateIcons();
}

module.exports = { generateIcons, createSVGIcon, createPNGIcon };
