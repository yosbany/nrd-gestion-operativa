const fs = require('fs');
const { createCanvas } = require('canvas');

function createIcon(size, filename) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Red background
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(0, 0, size, size);
  
  // White text
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${size * 0.3}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('NRD', size / 2, size / 2 - size * 0.1);
  ctx.font = `bold ${size * 0.15}px Arial`;
  ctx.fillText('PEDIDOS', size / 2, size / 2 + size * 0.1);
  
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(filename, buffer);
  console.log(`Created ${filename}`);
}

// Check if canvas is available
try {
  const canvas = require('canvas');
  createIcon(192, 'icon-192.png');
  createIcon(512, 'icon-512.png');
  console.log('Icons created successfully!');
} catch (e) {
  console.log('Canvas module not available. Creating simple SVG icons instead...');
  // Create SVG icons as fallback
  const svg192 = `<svg width="192" height="192" xmlns="http://www.w3.org/2000/svg">
    <rect width="192" height="192" fill="#dc2626"/>
    <text x="96" y="80" font-family="Arial" font-size="48" font-weight="bold" fill="#ffffff" text-anchor="middle">NRD</text>
    <text x="96" y="120" font-family="Arial" font-size="24" font-weight="bold" fill="#ffffff" text-anchor="middle">PEDIDOS</text>
  </svg>`;
  const svg512 = `<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
    <rect width="512" height="512" fill="#dc2626"/>
    <text x="256" y="200" font-family="Arial" font-size="128" font-weight="bold" fill="#ffffff" text-anchor="middle">NRD</text>
    <text x="256" y="320" font-family="Arial" font-size="64" font-weight="bold" fill="#ffffff" text-anchor="middle">PEDIDOS</text>
  </svg>`;
  fs.writeFileSync('icon-192.svg', svg192);
  fs.writeFileSync('icon-512.svg', svg512);
  console.log('SVG icons created. Note: You may need to convert them to PNG manually.');
}
