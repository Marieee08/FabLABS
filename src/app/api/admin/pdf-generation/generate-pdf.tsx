// pages/api/generate-pdf.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import puppeteer from 'puppeteer';

// Copy the interface definitions from your existing code
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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const reservation: DetailedReservation = req.body;
    
    // Launch a headless browser
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    // Create HTML content for the PDF (same as your existing function)
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <!-- Your HTML template here -->
        <!-- Copy from your existing generatePDF function -->
      </html>
    `;
    
    // Set content to the page
    await page.setContent(htmlContent);
    
    // Generate PDF
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      }
    });
    
    // Close the browser
    await browser.close();
    
    // Send the PDF as response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Reservation-${reservation.id}.pdf`);
    res.send(pdf);
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
}