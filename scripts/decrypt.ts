import fs from 'fs';
const pdfjsLib = require("pdfjs-dist/legacy/build/pdf.js");



const data = new Uint8Array(fs.readFileSync('./resource/012024-12024.pdf'));

(async () => {
  const loadingTask = pdfjsLib.getDocument({
    data,
    password: '181994585', // PDF password
  });

  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;
  console.log('Number of pages:', numPages);

  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => item.str).join(' ');
    console.log(`Page ${i} text:`, pageText);
  }
})();
