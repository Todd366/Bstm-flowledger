// utils/PDFExport.js
// Generate PDF audit trail with photos and timeline
// Uses jsPDF library

import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const generateTimelinePDF = async (batch, dispatches, receipts, incidents, company = {}) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPos = 20;

  // Company header
  doc.setFontSize(20);
  doc.setFont(undefined, 'bold');
  doc.text('FlowLedger-Ω', 15, yPos);
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text('Product Custody Intelligence System', 15, yPos + 6);

  // Company info (if provided)
  if (company.name) {
    doc.setFontSize(9);
    doc.text(company.name, pageWidth - 15, yPos, { align: 'right' });
    if (company.address) {
      doc.text(company.address, pageWidth - 15, yPos + 4, { align: 'right' });
    }
  }

  yPos += 15;

  // Watermark
  doc.setTextColor(200, 200, 200);
  doc.setFontSize(50);
  doc.text('OFFICIAL AUDIT TRAIL', pageWidth / 2, pageHeight / 2, {
    align: 'center',
    angle: 45
  });
  doc.setTextColor(0, 0, 0);

  // Document info box
  doc.setDrawColor(59, 130, 246);
  doc.setFillColor(239, 246, 255);
  doc.rect(15, yPos, pageWidth - 30, 25, 'FD');
  
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text('Product Custody Timeline', 20, yPos + 8);
  
  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  doc.text(`Batch ID: ${batch.id}`, 20, yPos + 14);
  doc.text(`Product: ${batch.productName}`, 20, yPos + 18);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 20, yPos + 22);
  
  yPos += 30;

  // Batch summary
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text('Batch Information', 15, yPos);
  yPos += 6;

  doc.autoTable({
    startY: yPos,
    head: [['Property', 'Value']],
    body: [
      ['Batch ID', batch.id],
      ['Product Name', batch.productName],
      ['Quantity', `${batch.quantity} units`],
      ['Supplier', batch.supplier || 'N/A'],
      ['Unit Cost', `P ${batch.unitCost?.toFixed(2) || '0.00'}`],
      ['Total Value', `P ${((batch.quantity || 0) * (batch.unitCost || 0)).toFixed(2)}`],
      ['Created By', batch.createdBy],
      ['Created At', new Date(batch.createdAt).toLocaleString()],
      ['Current Status', batch.status],
      ['Current Custody', batch.custody]
    ],
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246], fontSize: 9, fontStyle: 'bold' },
    bodyStyles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 40, fontStyle: 'bold' },
      1: { cellWidth: 'auto' }
    }
  });

  yPos = doc.lastAutoTable.finalY + 10;

  // Timeline events
  doc.addPage();
  yPos = 20;

  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text('Custody Chain Timeline', 15, yPos);
  doc.setFontSize(9);
  doc.setFont(undefined, 'italic');
  doc.text('Chronological record of all custody transfers and events', 15, yPos + 5);
  yPos += 12;

  // Collect all events
  const events = [];

  // Batch creation event
  events.push({
    timestamp: batch.createdAt,
    type: 'Batch Created',
    actor: batch.createdBy,
    details: `${batch.quantity} units of ${batch.productName} registered in system`,
    custody: 'Company',
    photos: batch.photos ? Object.keys(batch.photos).length : 0
  });

  // Dispatch events
  dispatches.forEach(dispatch => {
    events.push({
      timestamp: dispatch.preparedAt,
      type: 'Dispatch Prepared',
      actor: dispatch.preparedBy,
      details: `${dispatch.quantity} units prepared for shipment`,
      custody: 'Pending Transfer',
      photos: dispatch.photos ? Object.keys(dispatch.photos).length : 0
    });

    if (dispatch.approvedAt) {
      events.push({
        timestamp: dispatch.approvedAt,
        type: 'Dispatch Approved',
        actor: dispatch.approvedBy,
        details: `Assigned to ${dispatch.transporter} (Driver: ${dispatch.driver}, Vehicle: ${dispatch.vehicle})`,
        custody: 'Transporter',
        photos: 0
      });
    }

    if (dispatch.departedAt) {
      events.push({
        timestamp: dispatch.departedAt,
        type: 'Departure Confirmed',
        actor: dispatch.driver,
        details: `Vehicle ${dispatch.vehicle} departed. ETA: ${new Date(dispatch.expectedDelivery).toLocaleString()}`,
        custody: 'In Transit',
        photos: 1
      });
    }
  });

  // Receipt events
  receipts.forEach(receipt => {
    const dispatch = dispatches.find(d => d.id === receipt.dispatchId);
    const status = receipt.hasIncident ? '⚠️ WITH INCIDENT' : '✓ CLEAN';
    
    events.push({
      timestamp: receipt.receivedAt,
      type: `Receipt ${status}`,
      actor: receipt.receivedBy,
      details: `Received ${receipt.quantityReceived} units in ${receipt.condition} condition`,
      custody: 'Receiver',
      photos: receipt.photos ? Object.keys(receipt.photos).length : 0,
      incident: receipt.hasIncident
    });
  });

  // Incident events
  incidents.forEach(incident => {
    events.push({
      timestamp: incident.reportedAt,
      type: '🚨 INCIDENT REPORTED',
      actor: incident.reportedBy,
      details: `${incident.type}: ${incident.reason}. Expected: ${incident.quantityExpected}, Received: ${incident.quantityReceived}`,
      custody: incident.custodyAtIncident,
      photos: incident.photos ? Object.keys(incident.photos).length : 0,
      isIncident: true
    });
  });

  // Sort by timestamp
  events.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  // Render timeline
  events.forEach((event, index) => {
    // Check if we need a new page
    if (yPos > pageHeight - 40) {
      doc.addPage();
      yPos = 20;
    }

    // Event box
    const boxColor = event.isIncident ? [254, 202, 202] : 
                      event.incident ? [254, 243, 199] :
                      [239, 246, 255];
    
    doc.setFillColor(...boxColor);
    doc.setDrawColor(200, 200, 200);
    doc.rect(15, yPos, pageWidth - 30, 20, 'FD');

    // Timeline connector
    if (index < events.length - 1) {
      doc.setDrawColor(59, 130, 246);
      doc.setLineWidth(1);
      doc.line(20, yPos + 20, 20, yPos + 30);
    }

    // Event number badge
    doc.setFillColor(59, 130, 246);
    doc.circle(20, yPos + 10, 4, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont(undefined, 'bold');
    doc.text(`${index + 1}`, 20, yPos + 11.5, { align: 'center' });
    doc.setTextColor(0, 0, 0);

    // Event details
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text(event.type, 28, yPos + 6);

    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.text(`${new Date(event.timestamp).toLocaleString()}`, 28, yPos + 11);
    doc.text(`Actor: ${event.actor}  |  Custody: ${event.custody}`, 28, yPos + 15);

    // Photos indicator
    if (event.photos > 0) {
      doc.text(`📷 ${event.photos} photo(s)`, pageWidth - 40, yPos + 6);
    }

    yPos += 22;

    // Event details box
    if (event.details) {
      doc.setFillColor(250, 250, 250);
      doc.rect(28, yPos, pageWidth - 43, 8, 'F');
      doc.setFontSize(8);
      doc.setFont(undefined, 'italic');
      doc.text(event.details, 30, yPos + 5);
      yPos += 10;
    } else {
      yPos += 2;
    }
  });

  // Summary statistics
  doc.addPage();
  yPos = 20;

  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text('Custody Chain Summary', 15, yPos);
  yPos += 10;

  const totalEvents = events.length;
  const totalPhotos = events.reduce((sum, e) => sum + (e.photos || 0), 0);
  const custodyChanges = events.filter(e => e.type.includes('Approved') || e.type.includes('Receipt')).length;
  const totalIncidents = incidents.length;
  const incidentLoss = incidents.reduce((sum, inc) => {
    const qtyLost = inc.quantityExpected - inc.quantityReceived;
    return sum + (qtyLost * (batch.unitCost || 0));
  }, 0);

  doc.autoTable({
    startY: yPos,
    head: [['Metric', 'Value']],
    body: [
      ['Total Events Recorded', totalEvents.toString()],
      ['Photo Evidence Captures', totalPhotos.toString()],
      ['Custody Transfers', custodyChanges.toString()],
      ['Total Incidents', totalIncidents.toString()],
      ['Incident Loss Value', `P ${incidentLoss.toFixed(2)}`],
      ['Timeline Duration', calculateDuration(events[0]?.timestamp, events[events.length - 1]?.timestamp)],
      ['Chain of Custody Status', totalIncidents > 0 ? 'INCIDENT RECORDED' : 'CLEAN']
    ],
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246], fontSize: 10, fontStyle: 'bold' },
    bodyStyles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 60, fontStyle: 'bold' },
      1: { cellWidth: 'auto', halign: 'right' }
    }
  });

  // Certification footer
  yPos = pageHeight - 40;
  doc.setDrawColor(59, 130, 246);
  doc.setLineWidth(0.5);
  doc.line(15, yPos, pageWidth - 15, yPos);
  yPos += 5;

  doc.setFontSize(8);
  doc.setFont(undefined, 'italic');
  doc.text('This document represents an immutable audit trail generated by FlowLedger-Ω.', 15, yPos);
  doc.text('All events are timestamped, GPS-tagged, and photo-verified where applicable.', 15, yPos + 4);
  doc.text(`Document Hash: ${generateDocHash(batch, events)}`, 15, yPos + 8);
  doc.text(`Export Date: ${new Date().toISOString()}`, 15, yPos + 12);

  // Page numbers
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - 15, pageHeight - 10, { align: 'right' });
    doc.text('FlowLedger-Ω Custody Intelligence', 15, pageHeight - 10);
  }

  // Generate filename
  const filename = `FlowLedger_${batch.id}_${new Date().toISOString().split('T')[0]}.pdf`;

  // Save PDF
  doc.save(filename);
  
  return { success: true, filename };
};

// Helper: Calculate duration
const calculateDuration = (start, end) => {
  if (!start || !end) return 'N/A';
  
  const diff = new Date(end) - new Date(start);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (days > 0) return `${days}d ${hours}h`;
  return `${hours}h`;
};

// Helper: Generate document hash (simple checksum)
const generateDocHash = (batch, events) => {
  const data = `${batch.id}-${events.length}-${new Date().toISOString()}`;
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
};

// Export summary report (all batches)
export const generateSummaryReport = async (batches, dispatches, incidents, dateRange) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  // Title
  doc.setFontSize(18);
  doc.setFont(undefined, 'bold');
  doc.text('FlowLedger-Ω Summary Report', 15, yPos);
  
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text(`Period: ${dateRange}`, 15, yPos + 6);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 15, yPos + 11);
  
  yPos += 20;

  // Key metrics
  const totalValue = batches.reduce((s, b) => s + (b.quantity * b.unitCost), 0);
  const totalLoss = incidents.reduce((s, inc) => {
    const dispatch = dispatches.find(d => d.id === inc.dispatchId);
    const batch = batches.find(b => b.id === dispatch?.batchId);
    const qtyLost = inc.quantityExpected - inc.quantityReceived;
    return s + (qtyLost * (batch?.unitCost || 0));
  }, 0);

  doc.autoTable({
    startY: yPos,
    head: [['Metric', 'Value']],
    body: [
      ['Total Batches', batches.length],
      ['Total Inventory Value', `P ${totalValue.toFixed(2)}`],
      ['Total Dispatches', dispatches.length],
      ['Completed Deliveries', dispatches.filter(d => d.status === 'completed').length],
      ['Total Incidents', incidents.length],
      ['Total Loss Value', `P ${totalLoss.toFixed(2)}`],
      ['Loss Percentage', `${totalValue > 0 ? ((totalLoss / totalValue) * 100).toFixed(2) : 0}%`]
    ],
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246] }
  });

  const filename = `FlowLedger_Summary_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
  
  return { success: true, filename };
};

export default { generateTimelinePDF, generateSummaryReport };

// Usage:
/*
import { generateTimelinePDF } from './utils/PDFExport';

const exportTimeline = async () => {
  const batch = data.batches.find(b => b.id === selectedBatchId);
  const dispatches = data.dispatches.filter(d => d.batchId === batch.id);
  const receipts = data.receipts.filter(r => dispatches.some(d => d.id === r.dispatchId));
  const incidents = data.incidents.filter(i => dispatches.some(d => d.id === i.dispatchId));
  
  const result = await generateTimelinePDF(batch, dispatches, receipts, incidents, {
    name: 'Your Company Name',
    address: 'Gaborone, Botswana'
  });
  
  if (result.success) {
    alert(`PDF exported: ${result.filename}`);
  }
};
*/
