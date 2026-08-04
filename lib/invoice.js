// lib/invoice.js
import PDFDocument from 'pdfkit';
import { formatDate } from '@/lib/formatDate';

// Builds a PDF invoice in memory and resolves with a Buffer — used by
// the /api/account/orders/[id]/invoice route to stream a real
// downloadable file, not just a "print this page" workaround.
export function generateInvoicePdf(order, settings) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const storeName = settings?.store_name || 'Field & Co';
    const storeEmail = settings?.store_email || '';
    const storeAddress = settings?.store_address || '';
    const currency = settings?.currency || 'USD';

    doc.fontSize(20).text(storeName, { continued: false });
    doc.moveDown(0.3);
    doc.fontSize(9).fillColor('#666666').text(storeAddress);
    if (storeEmail) doc.text(storeEmail);
    doc.moveDown(1.5);

    doc.fillColor('#111111').fontSize(16).text('Invoice', { continued: false });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor('#333333');
    doc.text(`Invoice #: ${order.id.slice(0, 8).toUpperCase()}`);
    doc.text(`Date: ${formatDate(order.created_at)}`);
    doc.text(`Status: ${order.status}`);
    if (order.shipping_name) doc.text(`Billed to: ${order.shipping_name}`);
    if (order.email) doc.text(order.email);
    doc.moveDown(1.5);

    const tableTop = doc.y;
    doc.font('Helvetica-Bold');
    doc.text('Item', 50, tableTop, { width: 260 });
    doc.text('Qty', 310, tableTop, { width: 60, align: 'right' });
    doc.text('Price', 370, tableTop, { width: 80, align: 'right' });
    doc.text('Total', 450, tableTop, { width: 95, align: 'right' });
    doc.font('Helvetica');
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#dddddd').stroke();
    doc.moveDown(0.5);

    let subtotal = 0;
    for (const item of order.items || []) {
      const lineTotal = Number(item.price) * Number(item.qty);
      subtotal += lineTotal;
      const y = doc.y;
      doc.text(item.name, 50, y, { width: 260 });
      doc.text(String(item.qty), 310, y, { width: 60, align: 'right' });
      doc.text(`$${Number(item.price).toFixed(2)}`, 370, y, { width: 80, align: 'right' });
      doc.text(`$${lineTotal.toFixed(2)}`, 450, y, { width: 95, align: 'right' });
      doc.moveDown(0.6);
    }

    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#dddddd').stroke();
    doc.moveDown(0.8);

    const total = Number(order.total);
    const shipping = total - subtotal;
    doc.text(`Subtotal: $${subtotal.toFixed(2)} ${currency}`, { align: 'right' });
    if (shipping !== 0) doc.text(`Shipping: $${shipping.toFixed(2)} ${currency}`, { align: 'right' });
    doc.font('Helvetica-Bold').text(`Total: $${total.toFixed(2)} ${currency}`, { align: 'right' });

    doc.moveDown(2);
    doc.font('Helvetica').fontSize(8).fillColor('#999999').text('Thank you for your order.', { align: 'center' });

    doc.end();
  });
}
