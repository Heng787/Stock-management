import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDate, formatCurrency, formatID } from '../utils/format';

/**
 * Generates a professional PDF report for a supplier's performance.
 */
export const generateSupplierPDF = (supplier, transactions, stats) => {
  const doc = new jsPDF();
  const primaryColor = [147, 51, 234]; // #9333EA
  const secondaryColor = [243, 232, 255]; // #F3E8FF
  const textColor = [31, 41, 55]; // #1F2937
  const mutedColor = [107, 114, 128]; // #6B7280

  // 1. HEADER BRANDING
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 15, 'F');
  
  doc.setFillColor(...primaryColor);
  doc.roundedRect(14, 25, 12, 12, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('S', 18.5, 33);

  doc.setTextColor(...textColor);
  doc.setFontSize(24);
  doc.text(supplier.name, 32, 35);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...mutedColor);
  doc.text('SUPPLIER PERFORMANCE ANALYSIS', 32, 40);

  // 2. CONTACT INFO SECTION
  doc.setDrawColor(229, 231, 235);
  doc.line(14, 50, 196, 50);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textColor);
  doc.text('Provider Details', 14, 60);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...mutedColor);
  doc.text(`Email: ${supplier.email || 'N/A'}`, 14, 67);
  doc.text(`Phone: ${supplier.phone || 'N/A'}`, 14, 73);
  doc.text(`Address: ${supplier.address || 'N/A'}`, 14, 79);

  // 3. STAT CARDS
  const drawStatCard = (x, y, label, value, isPrimary = false) => {
    if (isPrimary) {
      doc.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    } else {
      doc.setFillColor(249, 250, 251);
    }
    doc.roundedRect(x, y, 42, 25, 4, 4, 'F');
    
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...mutedColor);
    doc.text(label.toUpperCase(), x + 5, y + 8);
    
    doc.setFontSize(12);
    if (isPrimary) {
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    } else {
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    }
    doc.text(String(value), x + 5, y + 18);
  };

  drawStatCard(100, 55, 'Procurement', formatCurrency(stats.totalSpent), true);
  drawStatCard(147, 55, 'Orders', String(stats.fulfilledOrders), false);
  drawStatCard(100, 85, 'Rating', `${supplier.rating ?? 5.0}/5.0`, false);
  drawStatCard(147, 85, 'Reliability', stats.reliability, false);

  // 4. TRANSACTION TABLE
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textColor);
  doc.text('Complete Shipment History', 14, 125);
  
  const tableData = transactions.map(t => [
    formatDate(t.createdAt),
    formatID(t._id),
    t.status,
    formatCurrency(t.total)
  ]);
  
  autoTable(doc, {
    startY: 132,
    head: [['DATE', 'REFERENCE', 'STATUS', 'TOTAL AMOUNT']],
    body: tableData,
    theme: 'plain',
    headStyles: { 
      fillColor: [255, 255, 255],
      textColor: primaryColor,
      fontSize: 8,
      fontStyle: 'bold',
      cellPadding: { bottom: 4, top: 4 }
    },
    styles: {
      fontSize: 9,
      cellPadding: 6,
      textColor: textColor,
      lineColor: [243, 244, 246],
      lineWidth: 0.1,
    },
    columnStyles: {
      3: { halign: 'right', fontStyle: 'bold' }
    },
    didDrawPage: (data) => {
      doc.setFontSize(8);
      doc.setTextColor(...mutedColor);
      doc.text(
        `Page ${data.pageNumber} - Confidential Stock Management Report`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }
  });

  doc.save(`${supplier.name.replace(/\s+/g, '_')}_Performance_Report.pdf`);
};
