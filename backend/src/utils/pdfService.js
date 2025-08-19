import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';

// Generates a PDF for a quote and returns it as a Buffer
export async function generateQuotePDF(quote) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      // Try to load logo
      const logoPath = path.join(process.cwd(), '..', 'frontend', 'public', 'images', 'logo.png');
      let hasLogo = false;
      
      try {
        if (fs.existsSync(logoPath)) {
          // Add logo to the top right
          doc.image(logoPath, doc.page.width - 150, 50, { width: 100 });
          hasLogo = true;
        }
      } catch (error) {
        console.warn('Logo not found:', error.message);
      }
      
      // Header
      const textStartY = hasLogo ? 160 : 50;
      
      doc
        .fontSize(20)
        .text('Eagles Events', doc.page.width - 50, textStartY, { align: 'right', width: 300 })
        .moveDown(0.2)
        .fontSize(10)
        .fillColor('#666')
        .text(process.env.COMPANY_ADDRESS || 'Address: 7280 Nhlangala Street Protea Glen SOWETO', { align: 'right' })
        .text(process.env.COMPANY_PHONE || 'Phone: 083-989-4082 / 068-078-0301', { align: 'right' })
        .text(process.env.COMPANY_EMAIL || 'Email: eaglesevents581@gmail.com', { align: 'right' })
        .moveDown(1)
        .fillColor('#000');

      // Title
      doc
        .fontSize(22)
        .text('Quotation', { align: 'left' })
        .moveDown(0.5);

      // Quote meta
      const createdAt = new Date(quote.createdAt || Date.now());
      const eventDate = new Date(quote.eventDate);
      doc
        .fontSize(12)
        .text(`Reference: ${quote.reference || quote._id}`)
        .text(`Quote Date: ${createdAt.toLocaleString()}`)
        .text(`Event Date: ${eventDate.toLocaleString()}`)
        .moveDown(1);

      // Customer details
      doc.fontSize(14).text('Customer Details', { underline: true }).moveDown(0.5);
      doc.fontSize(12)
        .text(`Name: ${quote.customerName}`)
        .text(`Company: ${quote.company || '-'}`)
        .text(`Email: ${quote.email}`)
        .text(`Phone: ${quote.phone}`)
        .text(`Location: ${quote.location}`)
        .moveDown(1);

      // Event details
      doc.fontSize(14).text('Event Details', { underline: true }).moveDown(0.5);
      doc.fontSize(12)
        .text(`Type: ${quote.eventType}${quote.eventType === 'other' && quote.eventTypeOther ? ` (${quote.eventTypeOther})` : ''}`)
        .text(`Guest Count: ${quote.guestCount}`)
        .text(`Services: ${(quote.services || []).join(', ') || '-'}`)
        .moveDown(1);

      // Items table header
      doc.fontSize(14).text('Selected Items', { underline: true }).moveDown(0.5);
      doc.fontSize(12).text('Item', 50, doc.y);
      doc.text('Qty', 300, doc.y, { width: 50, align: 'right' });
      doc.text('Price (ZAR)', 360, doc.y, { width: 90, align: 'right' });
      doc.text('Total (ZAR)', 455, doc.y, { width: 90, align: 'right' });
      doc.moveDown(0.2);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#ccc').stroke().strokeColor('#000');

      // Items rows
      const toNumber = (v, d = 0) => {
        const n = Number(v);
        return Number.isFinite(n) ? n : d;
      };
      const currency = new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' });
      (quote.items || []).forEach((item) => {
        const qty = toNumber(item?.quantity, 0);
        const price = toNumber(item?.price, 0);
        const total = toNumber(qty * price, 0);
        const y = toNumber(doc.y + 5, 0);
        doc.text(String(item?.name || '-'), 50, y, { width: 240 });
        doc.text(String(qty), 300, y, { width: 50, align: 'right' });
        doc.text(currency.format(price), 360, y, { width: 90, align: 'right' });
        doc.text(currency.format(total), 455, y, { width: 90, align: 'right' });
        doc.moveDown(1);
      });

      // Summary
      doc.moveDown(0.5);
      doc.moveTo(300, doc.y).lineTo(545, doc.y).strokeColor('#ccc').stroke().strokeColor('#000');
      doc.moveDown(0.5);

      const subtotal = toNumber(quote.totalAmount, 0);
      doc.fontSize(12)
        .text('Subtotal:', 360, doc.y, { width: 90, align: 'right' })
        .text(currency.format(subtotal), 455, doc.y, { width: 90, align: 'right' })
        .moveDown(1);

      // Payment
      const methodMap = { card: 'Credit/Debit Card', bank_transfer: 'EFT/Bank Transfer', cash: 'Cash', mobile: 'Mobile Payment' };
      doc.fontSize(14).text('Payment Information', { underline: true }).moveDown(0.5);
      doc.fontSize(12)
        .text(`Method: ${methodMap[quote.paymentMethod] || quote.paymentMethod || '-'}`)
        .text(`Payment Status: ${(quote.paymentStatus || 'pending').toUpperCase()}`)
        .moveDown(1);

      // Notes
      if (quote.notes) {
        doc.fontSize(14).text('Notes', { underline: true }).moveDown(0.5);
        doc.fontSize(12).text(String(quote.notes), { width: 495 });
        doc.moveDown(1);
      }

      // Footer
      doc.moveDown(2);
      doc.fontSize(10).fillColor('#666')
        .text('Thank you for choosing Eagles Events. We will contact you shortly to confirm details.', { align: 'center' })
        .text('This quotation is valid for 14 days unless otherwise stated.', { align: 'center' })
        .fillColor('#000');

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
