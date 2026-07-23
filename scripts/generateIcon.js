const fs = require('fs');
const path = require('path');

function createIcoFile(outputPath) {
  const width = 32;
  const height = 32;
  const numPixels = width * height;
  const bmpHeaderSize = 40;
  const pixelDataSize = numPixels * 4;
  const maskDataSize = Math.ceil(numPixels / 8);
  const totalImageSize = bmpHeaderSize + pixelDataSize + maskDataSize;

  // ICO Header (6 bytes)
  const icoHeader = Buffer.alloc(6);
  icoHeader.writeUInt16LE(0, 0); // Reserved
  icoHeader.writeUInt16LE(1, 2); // Type 1 (.ICO)
  icoHeader.writeUInt16LE(1, 4); // 1 Image

  // Directory Entry (16 bytes)
  const dirEntry = Buffer.alloc(16);
  dirEntry.writeUInt8(width, 0);       // Width
  dirEntry.writeUInt8(height, 1);      // Height
  dirEntry.writeUInt8(0, 2);           // Color count (0 = >= 256)
  dirEntry.writeUInt8(0, 3);           // Reserved
  dirEntry.writeUInt16LE(1, 4);        // Color planes (1)
  dirEntry.writeUInt16LE(32, 6);       // Bits per pixel (32-bit RGBA)
  dirEntry.writeUInt32LE(totalImageSize, 8); // Size of image data
  dirEntry.writeUInt32LE(22, 12);      // Offset of image data (6 + 16 = 22)

  // BITMAPINFOHEADER (40 bytes)
  const bmpHeader = Buffer.alloc(40);
  bmpHeader.writeUInt32LE(40, 0);       // Header size
  bmpHeader.writeInt32LE(width, 4);     // Width
  bmpHeader.writeInt32LE(height * 2, 8); // Height (doubled for ICO mask)
  bmpHeader.writeUInt16LE(1, 12);       // Planes (1)
  bmpHeader.writeUInt16LE(32, 14);      // Bit count (32 RGBA)
  bmpHeader.writeUInt32LE(0, 16);       // Compression (BI_RGB)
  bmpHeader.writeUInt32LE(pixelDataSize + maskDataSize, 20); // Image size
  bmpHeader.writeInt32LE(0, 24);        // X pixels per meter
  bmpHeader.writeInt32LE(0, 28);        // Y pixels per meter
  bmpHeader.writeUInt32LE(0, 32);       // Colors used
  bmpHeader.writeUInt32LE(0, 36);       // Important colors

  // RGBA Pixel Data (Bottom-Up)
  const pixelData = Buffer.alloc(pixelDataSize);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const offset = ((height - 1 - y) * width + x) * 4;
      // Blue gradient for VOXORA branding
      pixelData.writeUInt8(255, offset);     // Blue
      pixelData.writeUInt8(102, offset + 1); // Green
      pixelData.writeUInt8(0, offset + 2);   // Red
      pixelData.writeUInt8(255, offset + 3); // Alpha (Opaque)
    }
  }

  // Mask Data (Zero = Opaque)
  const maskData = Buffer.alloc(maskDataSize, 0);

  const finalIcoBuffer = Buffer.concat([icoHeader, dirEntry, bmpHeader, pixelData, maskData]);
  fs.writeFileSync(outputPath, finalIcoBuffer);
  console.log(`✅ Valid ICO file generated at: ${outputPath} (${finalIcoBuffer.length} bytes)`);
}

const buildDir = path.join(__dirname, '../build');
if (!fs.existsSync(buildDir)) fs.mkdirSync(buildDir, { recursive: true });
createIcoFile(path.join(buildDir, 'icon.ico'));
