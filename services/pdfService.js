const { PDFDocument, rgb } = require('pdf-lib');
const fontkit = require('@pdf-lib/fontkit');
const fs = require('fs').promises;
const path = require('path');

async function generatePDF(transaction) {
  try {
    const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit);

    // 1. Load Noto Sans font (supports ₹)
    const fontPath = path.join(__dirname, '../assets/fonts/NotoSans-Regular.ttf');
    const fontBytes = await fs.readFile(fontPath);
    const font = await pdfDoc.embedFont(fontBytes);

    // 2. Create PDF content
    const page = pdfDoc.addPage([595, 842]);
    const { width, height } = page.getSize();
    const margin = 50;
    let yPosition = height - margin;

    // 3. Draw content (with ₹ support)
    const details = [
      `Transaction ID: ${transaction.transaction_id}`,
      `Amount: ₹${Number(transaction.amount).toFixed(2)}`,
      `Type: ${transaction.type}`,
      `Date: ${new Date(transaction.datetime).toLocaleString('en-IN')}`,
      ...(transaction.details ? [`Details: ${transaction.details}`] : [])
    ];

    // Header
    page.drawText('Transaction Receipt', {
      x: margin,
      y: yPosition,
      size: 24,
      font,
      color: rgb(0, 0, 0)
    });
    yPosition -= 40;

    // Details
    details.forEach(text => {
      page.drawText(text, {
        x: margin,
        y: yPosition,
        size: 14,
        font,
        color: rgb(0, 0, 0)
      });
      yPosition -= 25;
    });

    return await pdfDoc.save();
  } catch (error) {
    console.error('PDF Generation Error:', error);
    throw new Error(`Failed to generate PDF: ${error.message}`);
  }
}

module.exports = { generatePDF };