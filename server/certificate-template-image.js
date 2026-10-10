const fs = require("node:fs");
const path = require("node:path");

// The bundled Word template uses an 8-bit RGB PNG. Reuse its compressed pixels
// directly, without redrawing the signature or recompressing the artwork.
function buildTemplateImageObject(png) {
  if (!png.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) ||
      png.length < 33 || png.toString("ascii", 12, 16) !== "IHDR" ||
      png[24] !== 8 || png[25] !== 2 || png[26] !== 0 || png[27] !== 0 || png[28] !== 0) {
    throw new Error("La imagen institucional debe ser PNG RGB de 8 bits sin entrelazado");
  }
  const width = png.readUInt32BE(16), height = png.readUInt32BE(20), chunks = [];
  if (!width || !height || width > 10000 || height > 10000) throw new Error("Dimensiones de plantilla no validas");
  for (let offset = 8; offset < png.length;) {
    if (offset + 12 > png.length) throw new Error("Plantilla PNG incompleta");
    const length = png.readUInt32BE(offset), type = png.toString("ascii", offset + 4, offset + 8);
    if (offset + length + 12 > png.length) throw new Error("Plantilla PNG incompleta");
    if (type === "IDAT") chunks.push(png.subarray(offset + 8, offset + 8 + length));
    offset += length + 12;
  }
  const data = Buffer.concat(chunks);
  if (!data.length) throw new Error("La plantilla PNG no contiene imagen");
  return `<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /FlateDecode /DecodeParms << /Predictor 15 /Colors 3 /BitsPerComponent 8 /Columns ${width} >> /Length ${data.length} >>\nstream\n${data.toString("latin1")}\nendstream`;
}

let templateImage;
function getCertificateTemplateImage() {
  if (!templateImage) templateImage = buildTemplateImageObject(fs.readFileSync(path.join(__dirname, "../data/cert-template-inspect/word/media/image1.png")));
  return templateImage;
}

module.exports = { buildTemplateImageObject, getCertificateTemplateImage };
