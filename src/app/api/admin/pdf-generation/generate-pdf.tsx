import type { NextApiRequest, NextApiResponse } from 'next';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

// Configure the API route
export const config = {
  runtime: 'nodejs',
  api: {
    responseLimit: false,
    bodyParser: {
      sizeLimit: '4mb', // Adjust as needed
    },
  },
};

// Helper functions to render sections of the PDF
const renderClientInfo = (reservation: any) => {
  if (reservation.accInfo.Role === 'Client' && reservation.accInfo.ClientInfo) {
    return `
      <div class="section">
        <div class="section-title">Client Information</div>
        <p>Contact Number: ${reservation.accInfo.ClientInfo.ContactNum}</p>
        <p>Address: ${reservation.accInfo.ClientInfo.Address}</p>
        <p>City: ${reservation.accInfo.ClientInfo.City}</p>
        <p>Province: ${reservation.accInfo.ClientInfo.Province}</p>
        <p>Zipcode: ${reservation.accInfo.ClientInfo.Zipcode}</p>
      </div>
    `;
  }
  return '';
};

const renderBusinessInfo = (reservation: any) => {
  if (reservation.accInfo.Role === 'Business' && reservation.accInfo.BusinessInfo) {
    return `
      <div class="section">
        <div class="section-title">Business Information</div>
        <p>Company: ${reservation.accInfo.BusinessInfo.CompanyName}</p>
        <p>Owner: ${reservation.accInfo.BusinessInfo.BusinessOwner}</p>
        <p>Business Permit: ${reservation.accInfo.BusinessInfo.BusinessPermitNum}</p>
        <p>TIN Number: ${reservation.accInfo.BusinessInfo.TINNum}</p>
        <p>Company Email: ${reservation.accInfo.BusinessInfo.CompanyEmail}</p>
        <p>Contact Person: ${reservation.accInfo.BusinessInfo.ContactPerson}</p>
        <p>Designation: ${reservation.accInfo.BusinessInfo.Designation}</p>
        <p>Address: ${reservation.accInfo.BusinessInfo.CompanyAddress}, ${reservation.accInfo.BusinessInfo.CompanyCity}, ${reservation.accInfo.BusinessInfo.CompanyProvince}, ${reservation.accInfo.BusinessInfo.CompanyZipcode}</p>
        <p>Phone: ${reservation.accInfo.BusinessInfo.CompanyPhoneNum}</p>
        <p>Mobile: ${reservation.accInfo.BusinessInfo.CompanyMobileNum}</p>
      </div>
    `;
  }
  return '';
};

const renderServices = (reservation: any) => {
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
            ${reservation.UserServices.map((service: any) => `
              <tr>
                <td>${service.ServiceAvail || ''}</td>
                <td>${service.EquipmentAvail || ''}</td>
                <td>${service.CostsAvail || 'N/A'}</td>
                <td>${service.MinsAvail || 'N/A'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }
  return '';
};

const renderTools = (reservation: any) => {
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
            ${reservation.UserTools.map((tool: any) => `
              <tr>
                <td>${tool.ToolUser || ''}</td>
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

const renderSchedule = (reservation: any) => {
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
            ${reservation.UtilTimes.map((time: any) => `
              <tr>
                <td>${time.DayNum || ''}</td>
                <td>${time.StartTime || ''}</td>
                <td>${time.EndTime || ''}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const reservation = req.body;

    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: process.env.CHROMIUM_PATH || await chromium.executablePath(),
      headless: true,
    });
    const page = await browser.newPage();

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { text-align: center; margin-bottom: 20px; }
            .section { margin-bottom: 20px; }
            .section-title { font-size: 16px; font-weight: bold; margin-bottom: 10px; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; }
            table, th, td { border: 1px solid #ddd; }
            th, td { padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Reservation Details</h1>
            <p>Reservation ID: ${reservation.id}</p>
            <p>Status: ${reservation.Status}</p>
            <p>Date: ${new Date(reservation.RequestDate).toLocaleDateString()}</p>
            <p>Total Amount Due: ${reservation.TotalAmntDue || 'N/A'}</p>
          </div>
          ${renderClientInfo(reservation)}
          ${renderBusinessInfo(reservation)}
          ${renderServices(reservation)}
          ${renderTools(reservation)}
          ${renderSchedule(reservation)}
        </body>
      </html>
    `;

    await page.setContent(htmlContent);
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' },
    });

    await browser.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Reservation-${reservation.id}.pdf`);
    res.send(pdf);
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ error: 'Failed to generate PDF', details: error instanceof Error ? error.message : 'Unknown error' });
  }
}