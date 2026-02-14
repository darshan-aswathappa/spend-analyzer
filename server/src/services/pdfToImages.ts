// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { createCanvas } = require('canvas');
import fs from 'fs';

// Disable the web worker — not available in Node.js
pdfjsLib.GlobalWorkerOptions.workerSrc = '';

/**
 * Renders each page of a PDF to a base64 JPEG data URL.
 * Caps at 10 pages to stay within GPT-4o context limits.
 */
export async function pdfToBase64Images(filePath: string): Promise<string[]> {
  const data = new Uint8Array(fs.readFileSync(filePath));
  const pdfDocument = await pdfjsLib.getDocument({ data }).promise;

  const numPages = Math.min(pdfDocument.numPages, 10);
  const images: string[] = [];

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdfDocument.getPage(pageNum);
    const viewport = page.getViewport({ scale: 2.0 }); // 2x for legibility

    const canvas = createCanvas(viewport.width, viewport.height);
    const ctx = canvas.getContext('2d');

    await page.render({
      canvasContext: ctx,
      viewport,
    }).promise;

    // JPEG at 85% quality — good balance of size and GPT readability
    images.push(canvas.toDataURL('image/jpeg', 0.85));
  }

  return images;
}
