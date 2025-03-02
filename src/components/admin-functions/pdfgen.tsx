import puppeteer from 'puppeteer';

interface UserService {
    id: string;
    ServiceAvail: string;
    EquipmentAvail: string;
    CostsAvail: number | string | null; // Updated to handle Prisma decimal
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
    TotalAmntDue: number | string | null; // Updated to handle Prisma decimal
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
  
  type Reservation = {
    id: string;
    date: string;
    name: string;
    email: string;
    status: string;
    role: string;
    service: string;
    totalAmount: number | null | undefined;
  };
// interface DetailedReservation, UserService, UserTool, UtilTime, etc.

const generatePDF = async (reservation: DetailedReservation) => {
  // Launch a headless browser
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Create HTML content for the PDF
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
          }
          .header {
            text-align: center;
            margin-bottom: 20px;
          }
          .section {
            margin-bottom: 20px;
          }
          .section-title {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 10px;
            border-bottom: 1px solid #ccc;
            padding-bottom: 5px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
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
          }
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
        
        <div class="section">
          <div class="section-title">Account Information</div>
          <p>Name: ${reservation.accInfo.Name}</p>
          <p>Email: ${reservation.accInfo.email}</p>
          <p>Role: ${reservation.accInfo.Role}</p>
        </div>
        
        ${reservation.accInfo.Role === 'Client' && reservation.accInfo.ClientInfo ? `
          <div class="section">
            <div class="section-title">Client Information</div>
            <p>Contact Number: ${reservation.accInfo.ClientInfo.ContactNum}</p>
            <p>Address: ${reservation.accInfo.ClientInfo.Address}</p>
            <p>City: ${reservation.accInfo.ClientInfo.City}</p>
            <p>Province: ${reservation.accInfo.ClientInfo.Province}</p>
            <p>Zipcode: ${reservation.accInfo.ClientInfo.Zipcode}</p>
          </div>
        ` : ''}
        
        ${reservation.accInfo.Role === 'Business' && reservation.accInfo.BusinessInfo ? `
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
        ` : ''}
        
        ${reservation.UserServices && reservation.UserServices.length > 0 ? `
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
                ${reservation.UserServices.map((service: UserService) => `
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
        ` : ''}
        
        ${reservation.UserTools && reservation.UserTools.length > 0 ? `
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
                ${reservation.UserTools.map((tool: UserTool) => `
                  <tr>
                    <td>${tool.ToolUser || ''}</td>
                    <td>${tool.ToolQuantity || 0}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : ''}
        
        ${reservation.UtilTimes && reservation.UtilTimes.length > 0 ? `
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
                ${reservation.UtilTimes.map((time: UtilTime) => `
                  <tr>
                    <td>${time.DayNum || ''}</td>
                    <td>${time.StartTime || ''}</td>
                    <td>${time.EndTime || ''}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : ''}
      </body>
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
  
  // Return the PDF buffer
  return pdf;
};

// Function to download the PDF
// Replace your downloadPDF function with this:
export const downloadPDF = async (reservation: any) => {
  try {
    // Create a form data object
    const response = await fetch('/api/generate-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reservation),
    });
    
    if (!response.ok) {
      throw new Error('Failed to generate PDF');
    }
    
    // Get the PDF as a blob
    const blob = await response.blob();
    
    // Create a download link
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Reservation-${reservation.id}.pdf`;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error generating PDF:', error);
  }
};