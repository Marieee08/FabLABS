// File: pages/api/pdf-generation.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

// Define interfaces for type safety
interface UserService {
  id: string;
  ServiceAvail: string;
  EquipmentAvail: string;
  CostsAvail: number | string | null;
  MinsAvail: number | null;
}

interface UserTool {
  id: string;
  ToolUser: string;
  ToolQuantity: number;
}

interface UtilTime {
  id: number;
  DayNum: number | null;
  StartTime: string | null;
  EndTime: string | null;
}

interface DetailedReservation {
  id: number;
  Status: string;
  RequestDate: string;
  TotalAmntDue: number | string | null;
  BulkofCommodity: string | null;
  UserServices: UserService[];
  UserTools: UserTool[];
  UtilTimes: UtilTime[];
  accInfo: {
    Name: string;
    email: string;
    Role: string;
    ClientInfo?: {
      ContactNum: string;
      Address: string;
      City: string;
      Province: string;
      Zipcode: number;
    };
    BusinessInfo?: {
      CompanyName: string;
      BusinessOwner: string;
      BusinessPermitNum: string;
      TINNum: string;
      CompanyIDNum: string;
      CompanyEmail: string;
      ContactPerson: string;
      Designation: string;
      CompanyAddress: string;
      CompanyCity: string;
      CompanyProvince: string;
      CompanyZipcode: number;
      CompanyPhoneNum: string;
      CompanyMobileNum: string;
      Manufactured: string;
      ProductionFrequency: string;
      Bulk: string;
    };
  };
}

// Configure the API route
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '8mb', // Increased size limit for larger payloads
    },
  },
};

// Helper functions to render sections of the PDF
const renderClientInfo = (reservation: DetailedReservation) => {
  if (reservation.accInfo.Role === 'Client' && reservation.accInfo.ClientInfo) {
    return `
      <div class="section">
        <div class="section-title">Client Information</div>
        <p><strong>Name:</strong> ${reservation.accInfo.Name || 'N/A'}</p>
        <p><strong>Email:</strong> ${reservation.accInfo.email || 'N/A'}</p>
        <p><strong>Contact Number:</strong> ${reservation.accInfo.ClientInfo.ContactNum || 'N/A'}</p>
        <p><strong>Address:</strong> ${reservation.accInfo.ClientInfo.Address || 'N/A'}</p>
        <p><strong>City:</strong> ${reservation.accInfo.ClientInfo.City || 'N/A'}</p>
        <p><strong>Province:</strong> ${reservation.accInfo.ClientInfo.Province || 'N/A'}</p>
        <p><strong>Zipcode:</strong> ${reservation.accInfo.ClientInfo.Zipcode || 'N/A'}</p>
      </div>
    `;
  }
  return '';
};

const renderBusinessInfo = (reservation: DetailedReservation) => {
  if (reservation.accInfo.Role === 'Business' && reservation.accInfo.BusinessInfo) {
    return `
      <div class="section">
        <div class="section-title">Business Information</div>
        <p><strong>Company:</strong> ${reservation.accInfo.BusinessInfo.CompanyName || 'N/A'}</p>
        <p><strong>Owner:</strong> ${reservation.accInfo.BusinessInfo.BusinessOwner || 'N/A'}</p>
        <p><strong>Business Permit:</strong> ${reservation.accInfo.BusinessInfo.BusinessPermitNum || 'N/A'}</p>
        <p><strong>TIN Number:</strong> ${reservation.accInfo.BusinessInfo.TINNum || 'N/A'}</p>
        <p><strong>Company ID:</strong> ${reservation.accInfo.BusinessInfo.CompanyIDNum || 'N/A'}</p>
        <p><strong>Company Email:</strong> ${reservation.accInfo.BusinessInfo.CompanyEmail || 'N/A'}</p>
        <p><strong>Contact Person:</strong> ${reservation.accInfo.BusinessInfo.ContactPerson || 'N/A'}</p>
        <p><strong>Designation:</strong> ${reservation.accInfo.BusinessInfo.Designation || 'N/A'}</p>
        <p><strong>Address:</strong> ${reservation.accInfo.BusinessInfo.CompanyAddress || 'N/A'}, 
           ${reservation.accInfo.BusinessInfo.CompanyCity || 'N/A'}, 
           ${reservation.accInfo.BusinessInfo.CompanyProvince || 'N/A'}, 
           ${reservation.accInfo.BusinessInfo.CompanyZipcode || 'N/A'}</p>
        <p><strong>Phone:</strong> ${reservation.accInfo.BusinessInfo.CompanyPhoneNum || 'N/A'}</p>
        <p><strong>Mobile:</strong> ${reservation.accInfo.BusinessInfo.CompanyMobileNum || 'N/A'}</p>
        <p><strong>Manufactured Products:</strong> ${reservation.accInfo.BusinessInfo.Manufactured || 'N/A'}</p>
        <p><strong>Production Frequency:</strong> ${reservation.accInfo.BusinessInfo.ProductionFrequency || 'N/A'}</p>
        <p><strong>Bulk:</strong> ${reservation.accInfo.BusinessInfo.Bulk || 'N/A'}</p>
      </div>
    `;
  }
  return '';
};

const renderServices = (reservation: DetailedReservation) => {
  if (reservation.UserServices && reservation.UserServices.length > 0) {
    return `
      <div class="section">
        <div class="section-title">Services</div>
        <table>
          <thead>
            <tr>
              <th>Service</th>
              <th>Equipment</th>
              <th>Cost</th>
              <th>Minutes</th>
            </tr>
          </thead>
          <tbody>
            ${reservation.UserServices.map((service) => `
              <tr>
                <td>${service.ServiceAvail || 'N/A'}</td>
                <td>${service.EquipmentAvail || 'N/A'}</td>
                <td>${service.CostsAvail !== null ? service.CostsAvail : 'N/A'}</td>
                <td>${service.MinsAvail !== null ? service.MinsAvail : 'N/A'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }
  return '';
};

const renderTools = (reservation: DetailedReservation) => {
  if (reservation.UserTools && reservation.UserTools.length > 0) {
    return `
      <div class="section">
        <div class="section-title">Tools</div>
        <table>
          <thead>
            <tr>
              <th>Tool</th>
              <th>Quantity</th>
            </tr>
          </thead>
          <tbody>
            ${reservation.UserTools.map((tool) => `
              <tr>
                <td>${tool.ToolUser || 'N/A'}</td>
                <td>${tool.ToolQuantity || 0}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }
  return '';
};

const renderSchedule = (reservation: DetailedReservation) => {
  if (reservation.UtilTimes && reservation.UtilTimes.length > 0) {
    return `
      <div class="section">
        <div class="section-title">Schedule</div>
        <table>
          <thead>
            <tr>
              <th>Day</th>
              <th>Start Time</th>
              <th>End Time</th>
            </tr>
          </thead>
          <tbody>
            ${reservation.UtilTimes.map((time) => `
              <tr>
                <td>${time.DayNum !== null ? time.DayNum : 'N/A'}</td>
                <td>${time.StartTime || 'N/A'}</td>
                <td>${time.EndTime || 'N/A'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }
  return '';
};

const renderBulkCommodity = (reservation: DetailedReservation) => {
  if (reservation.BulkofCommodity) {
    return `
      <div class="section">
        <div class="section-title">Bulk of Commodity</div>
        <p>${reservation.BulkofCommodity}</p>
      </div>
    `;
  }
  return '';
};

// Main handler function
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // IMPORTANT: Set CORS headers first thing
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  console.log(`PDF Generation API called with method: ${req.method}`);
  
  // Only allow POST requests
  if (req.method !== 'POST') {
    console.log(`Method not allowed: ${req.method}`);
    return res.status(405).json({ 
      error: 'Method not allowed', 
      message: 'This endpoint only accepts POST requests',
      allowedMethods: ['POST']
    });
  }

  try {
    // Log the request body to help with debugging
    console.log('Request body received:', typeof req.body);
    
    // Parse the reservation data
    let reservation: DetailedReservation;
    
    // Handle both string and object content types
    if (typeof req.body === 'string') {
      try {
        reservation = JSON.parse(req.body);
      } catch (e) {
        console.error('Failed to parse JSON string body:', e);
        return res.status(400).json({ 
          error: 'Invalid JSON in request body',
          message: 'Could not parse the provided data as JSON'
        });
      }
    } else {
      reservation = req.body;
    }
    
    // Validate required fields
    if (!reservation || !reservation.id) {
      console.log('Invalid reservation data:', reservation);
      return res.status(400).json({ 
        error: 'Invalid reservation data', 
        message: 'The reservation data is missing required fields',
        received: typeof reservation,
        hasId: Boolean(reservation?.id)
      });
    }
    
    console.log('Generating PDF for reservation ID:', reservation.id);
    
    try {
      // Initialize puppeteer
      let browser;
      
      try {
        // Launch browser with minimal options first
        browser = await puppeteer.launch({
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
          headless: true,
          executablePath: process.env.CHROMIUM_PATH || await chromium.executablePath(),
        });
      } catch (browserError) {
        console.error('Error launching browser with default options:', browserError);
        
        // Fallback launch options
        browser = await puppeteer.launch({
          args: ['--no-sandbox'],
          headless: true,
          ignoreDefaultArgs: ['--disable-extensions'],
        });
      }
      
      const page = await browser.newPage();

      // Create HTML content with proper formatting and error handling
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reservation ${reservation.id}</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                padding: 20px;
                line-height: 1.5;
              }
              .header { 
                text-align: center; 
                margin-bottom: 30px;
                padding-bottom: 10px;
                border-bottom: 2px solid #333;
              }
              .section { 
                margin-bottom: 25px; 
                page-break-inside: avoid;
              }
              .section-title { 
                font-size: 16px; 
                font-weight: bold; 
                margin-bottom: 10px; 
                background-color: #f5f5f5;
                padding: 5px 10px;
                border-left: 4px solid #333;
              }
              table { 
                width: 100%; 
                border-collapse: collapse; 
                margin-bottom: 10px;
              }
              table, th, td { 
                border: 1px solid #ddd; 
              }
              th, td { 
                padding: 8px; 
                text-align: left; 
              }
              th { 
                background-color: #f2f2f2; 
                font-weight: bold;
              }
              tr:nth-child(even) {
                background-color: #f9f9f9;
              }
              p { 
                margin: 5px 0; 
              }
              strong {
                font-weight: bold;
              }
              .status-badge {
                display: inline-block;
                padding: 5px 10px;
                border-radius: 4px;
                font-weight: bold;
                background-color: #e0e0e0;
              }
              .status-pending { background-color: #fff3cd; color: #856404; }
              .status-approved { background-color: #d4edda; color: #155724; }
              .status-rejected { background-color: #f8d7da; color: #721c24; }
              .status-completed { background-color: #cce5ff; color: #004085; }
              .footer {
                margin-top: 30px;
                text-align: center;
                font-size: 12px;
                color: #666;
                border-top: 1px solid #ddd;
                padding-top: 10px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Reservation Details</h1>
              <p>
                <strong>Reservation ID:</strong> ${reservation.id}
                <span class="status-badge ${
                  reservation.Status?.toLowerCase() === 'pending' ? 'status-pending' : 
                  reservation.Status?.toLowerCase() === 'approved' ? 'status-approved' : 
                  reservation.Status?.toLowerCase() === 'rejected' ? 'status-rejected' : 
                  reservation.Status?.toLowerCase() === 'completed' ? 'status-completed' : ''
                }">
                  ${reservation.Status || 'Unknown'}
                </span>
              </p>
              <p><strong>Date:</strong> ${
                reservation.RequestDate ? 
                new Date(reservation.RequestDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }) : 'N/A'
              }</p>
              <p><strong>Total Amount Due:</strong> ${
                reservation.TotalAmntDue !== null && reservation.TotalAmntDue !== undefined ? 
                `₱${Number(reservation.TotalAmntDue).toFixed(2)}` : 
                'N/A'
              }</p>
            </div>
            
            ${renderClientInfo(reservation)}
            ${renderBusinessInfo(reservation)}
            ${renderBulkCommodity(reservation)}
            ${renderServices(reservation)}
            ${renderTools(reservation)}
            ${renderSchedule(reservation)}
            
            <div class="footer">
              <p>Generated on ${new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</p>
            </div>
          </body>
        </html>
      `;

      await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' });
      
      // Generate PDF with basic options for better compatibility
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true
      });

      await browser.close();
      
      console.log('PDF generated successfully for reservation ID:', reservation.id);

      // Set appropriate headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=Reservation-${reservation.id}.pdf`);
      res.setHeader('Content-Length', pdf.length);
      
      // Send the PDF
      return res.status(200).send(pdf);
    } catch (pdfError) {
      console.error('Error during PDF generation:', pdfError);
      return res.status(500).json({ 
        error: 'PDF Generation Failed', 
        message: pdfError instanceof Error ? pdfError.message : 'Unknown PDF generation error',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error in API handler:', error);
    
    // Enhanced error response
    return res.status(500).json({ 
      error: 'Server Error', 
      message: error instanceof Error ? error.message : 'An unexpected error occurred',
      timestamp: new Date().toISOString()
    });
  }
}