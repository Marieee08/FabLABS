// Import jsPDF and manually add the autoTable plugin
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Define interfaces for DetailedReservation
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

interface ClientInfo {
  ContactNum: string;
  Address: string;
  City: string;
  Province: string;
  Zipcode: number;
}

interface BusinessInfo {
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
}

interface AccountInfo {
  Name: string;
  email: string;
  Role: string;
  ClientInfo?: ClientInfo;
  BusinessInfo?: BusinessInfo;
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
  accInfo: AccountInfo;
}

/**
 * Format currency values
 * @param amount - The amount to format
 * @returns Formatted amount
 */
const formatCurrency = (amount: number | string | null): string => {
  if (amount === null || amount === undefined) return '0.00';
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return Number(numAmount).toFixed(2);
};

/**
 * Generates and downloads a PDF for a reservation using browser print capabilities
 * @param reservationData - The reservation data
 */
export const downloadPDF = (reservationData: DetailedReservation): void => {
  // Create a new window for printing
  const printWindow = window.open('', '_blank', 'width=800,height=600');
  
  if (!printWindow) {
    alert('Please allow pop-ups to generate the PDF');
    return;
  }
  
  // Create the HTML content for printing
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Reservation ${reservationData.id}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 20px;
          color: #333;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        h1 {
          font-size: 24px;
          margin-bottom: 10px;
        }
        h2 {
          font-size: 18px;
          margin-top: 25px;
          margin-bottom: 10px;
          border-bottom: 1px solid #ccc;
          padding-bottom: 5px;
        }
        .info-section {
          margin-bottom: 20px;
        }
        .info-item {
          margin-bottom: 8px;
        }
        .label {
          font-weight: bold;
          display: inline-block;
          min-width: 150px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
          margin-bottom: 20px;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        th {
          background-color: #f2f2f2;
        }
        .status {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-weight: bold;
        }
        .status-pending { background-color: #fff3cd; color: #856404; }
        .status-approved { background-color: #d1ecf1; color: #0c5460; }
        .status-completed { background-color: #d4edda; color: #155724; }
        .status-rejected { background-color: #f8d7da; color: #721c24; }
        .status-payment { background-color: #fff3cd; color: #856404; }
        .page-break { page-break-after: always; }
        .footer {
          position: fixed;
          bottom: 0;
          width: 100%;
          text-align: center;
          font-size: 12px;
          padding: 10px 0;
          border-top: 1px solid #ddd;
        }
        @media print {
          .no-print { display: none; }
          .page-break { page-break-after: always; }
        }
      </style>
    </head>
    <body>
      <div class="no-print" style="padding: 10px; background: #f0f0f0; margin-bottom: 20px;">
        <button onclick="window.print()" style="padding: 8px 12px;">Print PDF</button>
        <button onclick="window.close()" style="padding: 8px 12px; margin-left: 10px;">Close</button>
      </div>
      
      <div class="header">
        <h1>Reservation Details</h1>
      </div>
      
      <div class="info-section">
        <div class="info-item">
          <span class="label">Reservation ID:</span> ${reservationData.id}
        </div>
        <div class="info-item">
          <span class="label">Status:</span>
          <span class="status status-${reservationData.Status.toLowerCase().replace(' ', '-')}">
            ${reservationData.Status}
          </span>
        </div>
        <div class="info-item">
          <span class="label">Request Date:</span>
          ${new Date(reservationData.RequestDate).toLocaleDateString()}
        </div>
        <div class="info-item">
          <span class="label">Total Amount Due:</span>
          ₱${formatCurrency(reservationData.TotalAmntDue)}
        </div>
      </div>
      
      <h2>Customer Information</h2>
      <div class="info-section">
        <div class="info-item">
          <span class="label">Name:</span> ${reservationData.accInfo.Name}
        </div>
        <div class="info-item">
          <span class="label">Email:</span> ${reservationData.accInfo.email}
        </div>
        <div class="info-item">
          <span class="label">Role:</span> ${reservationData.accInfo.Role}
        </div>
        ${reservationData.accInfo.ClientInfo ? `
        <div class="info-item">
          <span class="label">Contact Number:</span> ${reservationData.accInfo.ClientInfo.ContactNum}
        </div>
        <div class="info-item">
          <span class="label">Address:</span> ${reservationData.accInfo.ClientInfo.Address}
        </div>
        <div class="info-item">
          <span class="label">City:</span> ${reservationData.accInfo.ClientInfo.City}
        </div>
        <div class="info-item">
          <span class="label">Province:</span> ${reservationData.accInfo.ClientInfo.Province}
        </div>
        <div class="info-item">
          <span class="label">Zipcode:</span> ${reservationData.accInfo.ClientInfo.Zipcode}
        </div>
        ` : ''}
      </div>
      
      ${reservationData.accInfo.BusinessInfo ? `
      <div class="page-break"></div>
      <h2>Business Information</h2>
      <div class="info-section">
        <div class="info-item">
          <span class="label">Company Name:</span> ${reservationData.accInfo.BusinessInfo.CompanyName}
        </div>
        <div class="info-item">
          <span class="label">Business Owner:</span> ${reservationData.accInfo.BusinessInfo.BusinessOwner}
        </div>
        <div class="info-item">
          <span class="label">Business Permit:</span> ${reservationData.accInfo.BusinessInfo.BusinessPermitNum}
        </div>
        <div class="info-item">
          <span class="label">TIN Number:</span> ${reservationData.accInfo.BusinessInfo.TINNum}
        </div>
        <div class="info-item">
          <span class="label">Company ID:</span> ${reservationData.accInfo.BusinessInfo.CompanyIDNum}
        </div>
        <div class="info-item">
          <span class="label">Company Email:</span> ${reservationData.accInfo.BusinessInfo.CompanyEmail}
        </div>
        <div class="info-item">
          <span class="label">Contact Person:</span> ${reservationData.accInfo.BusinessInfo.ContactPerson}
        </div>
        <div class="info-item">
          <span class="label">Designation:</span> ${reservationData.accInfo.BusinessInfo.Designation}
        </div>
        <div class="info-item">
          <span class="label">Company Address:</span> ${reservationData.accInfo.BusinessInfo.CompanyAddress}
        </div>
        <div class="info-item">
          <span class="label">Products:</span> ${reservationData.accInfo.BusinessInfo.Manufactured}
        </div>
        <div class="info-item">
          <span class="label">Production Frequency:</span> ${reservationData.accInfo.BusinessInfo.ProductionFrequency}
        </div>
        <div class="info-item">
          <span class="label">Bulk Production:</span> ${reservationData.accInfo.BusinessInfo.Bulk}
        </div>
      </div>
      ` : ''}
      
      <div class="page-break"></div>
      <h2>Services Information</h2>
      <table>
        <thead>
          <tr>
            <th>Service</th>
            <th>Equipment</th>
            <th>Duration</th>
            <th>Cost</th>
          </tr>
        </thead>
        <tbody>
          ${reservationData.UserServices.map(service => `
          <tr>
            <td>${service.ServiceAvail}</td>
            <td>${service.EquipmentAvail}</td>
            <td>${service.MinsAvail || 0} mins</td>
            <td>₱${formatCurrency(service.CostsAvail)}</td>
          </tr>
          `).join('')}
        </tbody>
      </table>
      
      <h2>Schedule</h2>
      <table>
        <thead>
          <tr>
            <th>Day</th>
            <th>Start Time</th>
            <th>End Time</th>
          </tr>
        </thead>
        <tbody>
          ${reservationData.UtilTimes.map(time => `
          <tr>
            <td>Day ${time.DayNum}</td>
            <td>${time.StartTime ? new Date(time.StartTime).toLocaleString() : 'Not set'}</td>
            <td>${time.EndTime ? new Date(time.EndTime).toLocaleString() : 'Not set'}</td>
          </tr>
          `).join('')}
        </tbody>
      </table>
      
      ${reservationData.UserTools && reservationData.UserTools.length > 0 ? `
      <h2>Tools Information</h2>
      <table>
        <thead>
          <tr>
            <th>Tool</th>
            <th>Quantity</th>
          </tr>
        </thead>
        <tbody>
          ${reservationData.UserTools.map(tool => `
          <tr>
            <td>${tool.ToolUser}</td>
            <td>${tool.ToolQuantity}</td>
          </tr>
          `).join('')}
        </tbody>
      </table>
      ` : ''}
      
      <div class="footer">
        Generated on: ${new Date().toLocaleString()}
      </div>
    </body>
    </html>
  `;
  
  // Write to the new window and trigger the print dialog
  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
  
  // Focus the new window
  printWindow.focus();
};