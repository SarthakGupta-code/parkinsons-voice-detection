/**
 * Report Controller
 * Handles report generation and sharing
 */

const puppeteer = require('puppeteer');
const AnalysisResult = require('../models/AnalysisResult');
const { logger } = require('../utils/logger');

/**
 * Get report data
 */
const getReport = async (req, res) => {
  try {
    const { id } = req.params; // analysis_id

    const result = await AnalysisResult.findByRecordingId(id);
    if (!result) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Analysis results not found',
        },
      });
    }

    res.json({
      success: true,
      data: {
        report: {
          analysis_id: result.id,
          risk_percentage: result.risk_percentage,
          confidence_level: result.confidence_level,
          biomarkers: result.biomarkers,
          analyzed_at: result.analyzed_at,
        },
      },
    });
  } catch (error) {
    logger.error(`Get report error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch report',
      },
    });
  }
};

/**
 * Generate PDF report
 */
const generatePDF = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await AnalysisResult.findByRecordingId(id);
    if (!result) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Analysis results not found',
        },
      });
    }

    // Generate HTML report
    const html = generateReportHTML(result);

    // Convert to PDF using Puppeteer
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(html);
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
    });
    await browser.close();

    res.contentType('application/pdf');
    res.send(pdf);
  } catch (error) {
    logger.error(`Generate PDF error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to generate PDF',
      },
    });
  }
};

/**
 * Share report
 */
const shareReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { method, recipient } = req.body;

    // In production, implement email/SMS sending
    logger.info(`Report sharing requested: ${method} to ${recipient}`);

    res.json({
      success: true,
      message: 'Report shared successfully',
    });
  } catch (error) {
    logger.error(`Share report error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to share report',
      },
    });
  }
};

/**
 * Generate HTML report template
 */
function generateReportHTML(result) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .risk-score { font-size: 48px; font-weight: bold; text-align: center; margin: 20px 0; }
        .low-risk { color: #4CAF50; }
        .moderate-risk { color: #FFA726; }
        .high-risk { color: #E57373; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Parkinson's Disease Voice Analysis Report</h1>
        <p>Generated: ${new Date(result.analyzed_at).toLocaleString()}</p>
      </div>
      <div class="risk-score ${getRiskClass(result.risk_percentage)}">
        Risk: ${result.risk_percentage}%
      </div>
      <p style="text-align: center;">Confidence: ${result.confidence_level}%</p>
      <h2>Key Biomarkers</h2>
      <table>
        <tr><th>Parameter</th><th>Value</th><th>Status</th></tr>
        ${generateBiomarkerRows(result.biomarkers)}
      </table>
      <p style="margin-top: 30px; font-size: 12px; color: #666;">
        This report is for clinical use only. Consult a healthcare professional for diagnosis.
      </p>
    </body>
    </html>
  `;
}

function getRiskClass(risk) {
  if (risk <= 30) return 'low-risk';
  if (risk <= 60) return 'moderate-risk';
  return 'high-risk';
}

function generateBiomarkerRows(biomarkers) {
  if (!biomarkers) return '';
  const top5 = Object.entries(biomarkers)
    .sort((a, b) => Math.abs(b[1].value) - Math.abs(a[1].value))
    .slice(0, 5);
  
  return top5.map(([key, data]) => `
    <tr>
      <td>${key.replace(/_/g, ' ')}</td>
      <td>${data.value} ${data.unit || ''}</td>
      <td>${data.status}</td>
    </tr>
  `).join('');
}

module.exports = {
  getReport,
  generatePDF,
  shareReport,
};

