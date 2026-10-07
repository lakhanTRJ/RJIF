const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const pdfHeader = Buffer.from('%PDF-');
const pdfEndMarker = Buffer.from('%%EOF');

export function detectMediaMime(bytes) {
  if (!Buffer.isBuffer(bytes)) return '';
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)
    return 'image/jpeg';
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(pngSignature)) return 'image/png';
  if (
    bytes.length >= 12 &&
    bytes.toString('ascii', 0, 4) === 'RIFF' &&
    bytes.toString('ascii', 8, 12) === 'WEBP'
  )
    return 'image/webp';
  if (
    bytes.length >= 10 &&
    bytes.subarray(0, pdfHeader.length).equals(pdfHeader) &&
    bytes.subarray(Math.max(0, bytes.length - 4096)).includes(pdfEndMarker)
  )
    return 'application/pdf';
  return '';
}
