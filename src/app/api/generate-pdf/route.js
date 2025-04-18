// File: app/api/generate-pdf/route.js
import { NextResponse } from 'next/server';
import PDFDocument from 'pdfkit';

export async function POST(request) {
  try {
    const order = await request.json();
    
    // Create a PDF document in memory
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];
    
    // Collect PDF data chunks
    doc.on('data', chunk => {
      chunks.push(chunk);
    });
    
    // Create a promise that resolves when the PDF is complete
    const pdfPromise = new Promise((resolve, reject) => {
      doc.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
      doc.on('error', reject);
    });
    
    // Add content to the PDF
    generateOrderPDF(doc, order);
    
    // Finalize the PDF
    doc.end();
    
    // Wait for the PDF to be generated
    const pdfBuffer = await pdfPromise;
    
    // Return the PDF as a response
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Order_${order.customerName.replace(/\s+/g, '_')}_${order.orderDate}.pdf"`
      }
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 });
  }
}

function generateOrderPDF(doc, order) {
  // Add header with logo
  doc.fontSize(20).text('Order Receipt', { align: 'center' });
  doc.moveDown();
  
  // Add order info
  doc.fontSize(12);
  doc.text(`Order Date: ${order.orderDate}`);
  doc.text(`Customer: ${order.customerName}`);
  
  if (order.purpose) {
    doc.text(`Purpose: ${order.purpose}`);
  }
  
  if (order.description) {
    doc.text(`Description: ${order.description}`);
  }
  
  doc.moveDown();
  
  // Add products table
  generateProductsTable(doc, order);
  
  doc.moveDown();
  
  // Add totals
  doc.text(`Total Sale Price: $${order.salePriceTotal.toFixed(2)}`, { align: 'right' });
  
  if (order.showActualPrice) {
    doc.text(`Total Cost Price: $${order.priceTotal.toFixed(2)}`, { align: 'right' });
  }
  
  // Add footer
  doc.fontSize(10).text('Thank you for your business!', {
    align: 'center',
    bottom: 30
  });
}

function generateProductsTable(doc, order) {
  const tableTop = doc.y;
  const itemsPerPage = 20;
  let itemCount = 0;
  
  // Table headers
  const tableHeaders = ['Part Number', 'Part Name', 'Category', 'Qty', 'Price', 'Total'];
  const columnWidths = [100, 150, 80, 50, 80, 80];
  const tableWidth = columnWidths.reduce((sum, width) => sum + width, 0);
  const startX = (doc.page.width - tableWidth) / 2;
  
  // Function to draw table headers
  function drawTableHeaders(y) {
    doc.font('Helvetica-Bold');
    let xPos = startX;
    
    tableHeaders.forEach((header, i) => {
      // Skip price columns if not showing actual price
      if (!order.showActualPrice && (header === 'Price' || header === 'Total')) {
        if (header === 'Price') {
          doc.text('Sale Price', xPos, y, { width: columnWidths[i] });
        } else {
          doc.text('Sale Total', xPos, y, { width: columnWidths[i] });
        }
      } else {
        doc.text(header, xPos, y, { width: columnWidths[i] });
      }
      xPos += columnWidths[i];
    });
    
    doc.font('Helvetica');
    doc.moveDown();
    return doc.y;
  }
  
  // Draw table headers
  let y = drawTableHeaders(tableTop);
  
  // Draw horizontal line
  doc.moveTo(startX, y - 5).lineTo(startX + tableWidth, y - 5).stroke();
  
  // Draw table rows
  order.products.forEach((product, index) => {
    // Check if we need a new page
    if (itemCount === itemsPerPage) {
      doc.addPage();
      y = 50;
      y = drawTableHeaders(y);
      doc.moveTo(startX, y - 5).lineTo(startX + tableWidth, y - 5).stroke();
      itemCount = 0;
    }
    
    let xPos = startX;
    const rowHeight = 20;
    
    // Part Number
    doc.text(product.manufacturerPart || 'N/A', xPos, y, { width: columnWidths[0] });
    xPos += columnWidths[0];
    
    // Part Name
    doc.text(product.partName || 'N/A', xPos, y, { width: columnWidths[1] });
    xPos += columnWidths[1];
    
    // Category
    doc.text(product.category || 'N/A', xPos, y, { width: columnWidths[2] });
    xPos += columnWidths[2];
    
    // Quantity
    doc.text(product.orderQty.toString(), xPos, y, { width: columnWidths[3] });
    xPos += columnWidths[3];
    
    // Price
    if (order.showActualPrice) {
      doc.text(`$${parseFloat(product.costPrice || 0).toFixed(2)}`, xPos, y, { width: columnWidths[4] });
    } else {
      doc.text(`$${parseFloat(product.salePrice || 0).toFixed(2)}`, xPos, y, { width: columnWidths[4] });
    }
    xPos += columnWidths[4];
    
    // Total
    if (order.showActualPrice) {
      doc.text(`$${(parseFloat(product.costPrice || 0) * product.orderQty).toFixed(2)}`, xPos, y, { width: columnWidths[5] });
    } else {
      doc.text(`$${(parseFloat(product.salePrice || 0) * product.orderQty).toFixed(2)}`, xPos, y, { width: columnWidths[5] });
    }
    
    y += rowHeight;
    itemCount++;
  });
  
  // Draw final horizontal line
  doc.moveTo(startX, y + 5).lineTo(startX + tableWidth, y + 5).stroke();
}