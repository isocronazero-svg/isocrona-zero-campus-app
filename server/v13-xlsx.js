"use strict";

// Minimal XLSX writer: inline strings, single worksheet, no external dependencies.
const zlib = require("node:zlib");
function crc32(buf) {
  let crc = 0xffffffff;
  for (const byte of buf) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function xml(value) {
  return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;")
    .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, "");
}
function colName(index) {
  let out = "";
  for (let n = index + 1; n > 0; n = Math.floor((n - 1) / 26)) out = String.fromCharCode(65 + ((n - 1) % 26)) + out;
  return out;
}
function zip(entries) {
  const locals = [], centrals = [];
  let offset = 0;
  for (const [name, body] of entries) {
    const filename = Buffer.from(name), raw = Buffer.from(body), data = zlib.deflateRawSync(raw);
    const crc = crc32(raw);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(20, 4); local.writeUInt16LE(0, 6);
    local.writeUInt16LE(8, 8); local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18); local.writeUInt32LE(raw.length, 22);
    local.writeUInt16LE(filename.length, 26);
    locals.push(local, filename, data);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0); central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6); central.writeUInt16LE(0, 8); central.writeUInt16LE(8, 10);
    central.writeUInt32LE(crc, 16); central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(raw.length, 24); central.writeUInt16LE(filename.length, 28);
    central.writeUInt32LE(offset, 42);
    centrals.push(central, filename);
    offset += local.length + filename.length + data.length;
  }
  const directory = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10); end.writeUInt32LE(directory.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, directory, end]);
}
function workbookXlsx({ headers, rows }) {
  const lines = [headers, ...rows].map((values, r) =>
    '<row r="' + (r + 1) + '">' + values.map((value, c) =>
      '<c r="' + colName(c) + (r + 1) + '" t="inlineStr"><is><t xml:space="preserve">' +
      xml(value) + '</t></is></c>').join("") + '</row>').join("");
  const sheet = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>' + lines + '</sheetData></worksheet>';
  return zip([
    ["[Content_Types].xml", '<?xml version="1.0" encoding="UTF-8"?>' +
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
      '<Default Extension="xml" ContentType="application/xml"/>' +
      '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
      '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>'],
    ["_rels/.rels", '<?xml version="1.0" encoding="UTF-8"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'],
    ["xl/workbook.xml", '<?xml version="1.0" encoding="UTF-8"?>' +
      '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
      '<sheets><sheet name="Socios" sheetId="1" r:id="rId1"/></sheets></workbook>'],
    ["xl/_rels/workbook.xml.rels", '<?xml version="1.0" encoding="UTF-8"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>'],
    ["xl/worksheets/sheet1.xml", sheet]
  ]);
}
module.exports = { workbookXlsx };
