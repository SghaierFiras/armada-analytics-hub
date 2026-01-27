/**
 * Export Utilities
 * Generic export functionality for CSV, XLSX, and PDF formats
 * Consolidates 16 export functions into a reusable service
 */

import { formatNumber, formatDate } from './formatters.js';

/**
 * Export Service Class
 * Handles data export in multiple formats
 */
export class ExportService {
  /**
   * Export data in specified format
   * @param {object} config - Export configuration
   * @param {string} config.title - Report title
   * @param {string} config.format - Export format ('csv', 'xlsx', 'pdf', 'json')
   * @param {string} config.filename - Base filename (without extension)
   * @param {object} config.data - Data to export
   * @param {object} config.filters - Applied filters (optional)
   * @param {array} config.sections - Data sections to export
   */
  static export(config) {
    const {
      title,
      format,
      filename,
      data,
      filters = {},
      sections = []
    } = config;

    const timestamp = new Date().toISOString().split('T')[0];
    const fullFilename = `${filename}-${timestamp}`;

    switch (format) {
      case 'csv':
        this.exportToCSV({ title, filename: fullFilename, data, filters, sections });
        break;
      case 'xlsx':
        this.exportToXLSX({ title, filename: fullFilename, data, filters, sections });
        break;
      case 'pdf':
        this.exportToPDF({ title, filename: fullFilename, data, filters, sections });
        break;
      case 'json':
        this.exportToJSON({ title, filename: fullFilename, data, filters });
        break;
      default:
        console.error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Export to CSV format
   * @param {object} config - Export configuration
   */
  static exportToCSV(config) {
    const { title, filename, data, filters, sections } = config;
    let csv = `${title}\n`;
    csv += `Export Date: ${formatDate(new Date(), 'iso')}\n`;

    // Add filters if present
    if (filters && Object.keys(filters).length > 0) {
      const filterStr = Object.entries(filters)
        .map(([key, value]) => `${key}=${value}`)
        .join(', ');
      csv += `Filters: ${filterStr}\n`;
    }

    csv += '\n';

    // Add sections
    sections.forEach(section => {
      csv += this.sectionToCSV(section);
      csv += '\n';
    });

    this.downloadFile(csv, `${filename}.csv`, 'text/csv');
  }

  /**
   * Convert section to CSV format
   * @param {object} section - Section configuration
   * @returns {string} CSV string
   */
  static sectionToCSV(section) {
    let csv = `${section.title}\n`;

    if (section.type === 'table') {
      // Table with headers and rows
      csv += section.headers.join(',') + '\n';
      section.rows.forEach(row => {
        csv += row.map(cell => this.escapeCSV(cell)).join(',') + '\n';
      });
    } else if (section.type === 'summary') {
      // Key-value pairs
      csv += 'Metric,Value\n';
      Object.entries(section.data).forEach(([key, value]) => {
        csv += `${this.escapeCSV(key)},${this.escapeCSV(value)}\n`;
      });
    }

    return csv + '\n';
  }

  /**
   * Escape CSV cell value
   * @param {any} value - Cell value
   * @returns {string} Escaped value
   */
  static escapeCSV(value) {
    if (value === null || value === undefined) return '';

    const str = String(value);

    // If contains comma, quote, or newline, wrap in quotes and escape quotes
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }

    return str;
  }

  /**
   * Export to XLSX format
   * @param {object} config - Export configuration
   */
  static exportToXLSX(config) {
    const { title, filename, data, filters, sections } = config;

    if (typeof XLSX === 'undefined') {
      console.error('XLSX library not loaded');
      alert('Excel export requires the XLSX library. Please check your configuration.');
      return;
    }

    const wb = XLSX.utils.book_new();

    // Create summary sheet if filters exist
    if (filters && Object.keys(filters).length > 0) {
      const summaryData = [
        [title],
        [`Export Date: ${formatDate(new Date(), 'iso')}`],
        [],
        ['Filter', 'Value'],
        ...Object.entries(filters)
      ];

      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      summarySheet['!cols'] = [{ wch: 20 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');
    }

    // Create sheets for each section
    sections.forEach((section, index) => {
      const sheet = this.sectionToXLSXSheet(section);
      const sheetName = this.sanitizeSheetName(section.title || `Sheet${index + 1}`);
      XLSX.utils.book_append_sheet(wb, sheet, sheetName);
    });

    XLSX.writeFile(wb, `${filename}.xlsx`);
  }

  /**
   * Convert section to XLSX sheet
   * @param {object} section - Section configuration
   * @returns {object} XLSX sheet
   */
  static sectionToXLSXSheet(section) {
    let data = [];

    if (section.type === 'table') {
      data = [
        [section.title],
        [],
        section.headers,
        ...section.rows
      ];
    } else if (section.type === 'summary') {
      data = [
        [section.title],
        [],
        ['Metric', 'Value'],
        ...Object.entries(section.data)
      ];
    }

    const sheet = XLSX.utils.aoa_to_sheet(data);

    // Set column widths
    const colWidths = section.headers ? section.headers.map(() => ({ wch: 15 })) : [{ wch: 25 }, { wch: 20 }];
    sheet['!cols'] = colWidths;

    return sheet;
  }

  /**
   * Sanitize sheet name for Excel
   * @param {string} name - Sheet name
   * @returns {string} Sanitized name
   */
  static sanitizeSheetName(name) {
    // Excel sheet names cannot contain: \ / * ? [ ] :
    // Max length is 31 characters
    return name
      .replace(/[\\/*?[\]:]/g, '')
      .substring(0, 31);
  }

  /**
   * Export to PDF format
   * @param {object} config - Export configuration
   */
  static exportToPDF(config) {
    const { title, filename, data, filters, sections } = config;

    if (typeof jsPDF === 'undefined' || typeof window.jspdf === 'undefined') {
      console.error('jsPDF library not loaded');
      alert('PDF export requires the jsPDF library. Please check your configuration.');
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    let yPosition = 20;

    // Title
    doc.setFontSize(20);
    doc.setTextColor(30, 64, 175); // Primary blue
    doc.text(title, 14, yPosition);
    yPosition += 10;

    // Date
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Export Date: ${formatDate(new Date(), 'iso')}`, 14, yPosition);
    yPosition += 10;

    // Filters
    if (filters && Object.keys(filters).length > 0) {
      const filterStr = Object.entries(filters)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
      doc.text(`Filters: ${filterStr}`, 14, yPosition);
      yPosition += 10;
    }

    // Add sections
    sections.forEach((section, index) => {
      // Check if we need a new page
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      yPosition = this.addSectionToPDF(doc, section, yPosition);
      yPosition += 10; // Space between sections
    });

    doc.save(`${filename}.pdf`);
  }

  /**
   * Add section to PDF
   * @param {object} doc - jsPDF document
   * @param {object} section - Section configuration
   * @param {number} yPosition - Current Y position
   * @returns {number} New Y position
   */
  static addSectionToPDF(doc, section, yPosition) {
    // Section title
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text(section.title, 14, yPosition);
    yPosition += 7;

    if (section.type === 'table') {
      // Use autoTable for tables
      doc.autoTable({
        startY: yPosition,
        head: [section.headers],
        body: section.rows,
        theme: 'grid',
        headStyles: {
          fillColor: [30, 64, 175],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        margin: { left: 14, right: 14 },
        styles: {
          fontSize: 9,
          cellPadding: 3
        }
      });

      return doc.lastAutoTable.finalY + 10;
    } else if (section.type === 'summary') {
      // Use autoTable for summary
      const tableData = Object.entries(section.data).map(([key, value]) => [key, value]);

      doc.autoTable({
        startY: yPosition,
        head: [['Metric', 'Value']],
        body: tableData,
        theme: 'grid',
        headStyles: {
          fillColor: [30, 64, 175],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        margin: { left: 14, right: 14 },
        styles: {
          fontSize: 9,
          cellPadding: 3
        },
        columnStyles: {
          0: { cellWidth: 100 },
          1: { cellWidth: 60, halign: 'right' }
        }
      });

      return doc.lastAutoTable.finalY + 10;
    }

    return yPosition;
  }

  /**
   * Export to JSON format
   * @param {object} config - Export configuration
   */
  static exportToJSON(config) {
    const { title, filename, data, filters } = config;

    const exportData = {
      title,
      exportDate: formatDate(new Date(), 'iso'),
      filters,
      data
    };

    const json = JSON.stringify(exportData, null, 2);
    this.downloadFile(json, `${filename}.json`, 'application/json');
  }

  /**
   * Download file to user's browser
   * @param {string} content - File content
   * @param {string} filename - Filename
   * @param {string} mimeType - MIME type
   */
  static downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Helper: Convert object to table rows
   * @param {object} obj - Object to convert
   * @returns {array} Array of rows [key, value]
   */
  static objectToRows(obj) {
    return Object.entries(obj).map(([key, value]) => [key, value]);
  }

  /**
   * Helper: Convert array of objects to table format
   * @param {array} arr - Array of objects
   * @returns {object} Table with headers and rows
   */
  static arrayToTable(arr) {
    if (!arr || arr.length === 0) {
      return { headers: [], rows: [] };
    }

    const headers = Object.keys(arr[0]);
    const rows = arr.map(obj => headers.map(key => obj[key]));

    return { headers, rows };
  }

  /**
   * Helper: Format table data for export
   * @param {array} data - Array of objects
   * @param {object} columnConfig - Column configuration (optional)
   * @returns {object} Formatted table
   */
  static formatTableData(data, columnConfig = {}) {
    if (!data || data.length === 0) {
      return { headers: [], rows: [] };
    }

    const headers = columnConfig.columns || Object.keys(data[0]);
    const formatters = columnConfig.formatters || {};

    const rows = data.map(obj => {
      return headers.map(key => {
        const value = obj[key];
        const formatter = formatters[key];

        if (formatter && typeof formatter === 'function') {
          return formatter(value);
        }

        return value !== null && value !== undefined ? value : '';
      });
    });

    const displayHeaders = columnConfig.displayHeaders || headers;

    return {
      headers: displayHeaders,
      rows
    };
  }
}

export default ExportService;
