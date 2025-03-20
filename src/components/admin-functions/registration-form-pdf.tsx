import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  AutoTableResult,
  AutoTableColumnOption
} from '@/components/admin-functions/pdf-types';

// Define interfaces for the registration form data
interface BusinessInfo {
  CompanyName: string;
  BusinessOwner: string;
  BusinessPermitNo: string;
  TINNo: string;
  Email: string;
  ContactPerson: string;
  PositionDesignation: string;
  CompanyAddress: string;
  City: string;
  Province: string;
  ZipCode: string;
  PhoneNo: string;
  MobileNo: string;
  CommodityManufactured: string;
  ProductionFrequency: string; // Daily, Weekly, or Monthly
  BulkOfCommodity: string; // in volume or weight
}

interface ClientInfo {
  Name: string;
  CompanyIDNo: string;
  TINNo: string;
  ContactNo: string;
  Address: string;
  City: string;
  Province: string;
  ZipCode: string;
}

interface RegistrationFormData {
  businessInfo: BusinessInfo;
  clientInfoList: ClientInfo[];
  numberOfClients: number;
}

/**
 * Generates a PDF for a registration form using browser print capabilities
 * This is a fallback method that uses HTML and browser printing
 * @param formData - The registration form data
 */
const generatePrintPDF = (formData: RegistrationFormData): void => {
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
      <title>Registration Form</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 20px;
          color: #333;
        }
        .header {
          text-align: center;
          margin-bottom: 20px;
          position: relative;
        }
        .logo-left {
          position: absolute;
          left: 20px;
          top: 0;
          width: 60px;
          height: 60px;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .logo-right {
          position: absolute;
          right: 20px;
          top: 0;
          width: 60px;
          height: 60px;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        h1 {
          font-size: 16px;
          margin-bottom: 5px;
        }
        h2 {
          font-size: 18px;
          margin-top: 5px;
          margin-bottom: 15px;
        }
        .section-header {
          background-color: #ddd;
          padding: 5px;
          font-weight: bold;
          margin-top: 15px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 5px;
        }
        th, td {
          border: 1px solid #000;
          padding: 5px;
          text-align: left;
        }
        @media print {
          .no-print { display: none; }
          button { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="no-print" style="padding: 10px; background: #f0f0f0; margin-bottom: 20px;">
        <button onclick="window.print()" style="padding: 8px 12px;">Print PDF</button>
        <button onclick="window.close()" style="padding: 8px 12px; margin-left: 10px;">Close</button>
      </div>
     
      <div class="header">
        <div class="logo-left">
          <img src="/images/logos/fablab_logo.png" alt="FabLab Logo" width="60" height="60">
        </div>
        <div class="logo-right">
          <img src="/images/logos/dti_logo.png" alt="DTI Logo" width="60" height="60">
        </div>
        <h1>FABRICATION LABORATORY SHARED SERVICE FACILITY</h1>
        <h2>REGISTRATION FORM</h2>
        <p>Philippine Science High School-Eastern Visayas Campus (PSHS-EVC)<br>AH26 Brgy. Pawing, Palo, Leyte 6501</p>
      </div>
     
      <div class="section-header">BUSINESS INFORMATION</div>
      <table>
        <tr>
          <td width="30%"><strong>Company Name:</strong></td>
          <td colspan="3">${formData.businessInfo?.CompanyName || ''}</td>
        </tr>
        <tr>
          <td><strong>Company/Business Owner:</strong></td>
          <td>${formData.businessInfo?.BusinessOwner || ''}</td>
          <td width="15%"><strong>TIN No.:</strong></td>
          <td>${formData.businessInfo?.TINNo || ''}</td>
        </tr>
        <tr>
          <td><strong>Business Permit No.:</strong></td>
          <td>${formData.businessInfo?.BusinessPermitNo || ''}</td>
          <td><strong>E-mail:</strong></td>
          <td>${formData.businessInfo?.Email || ''}</td>
        </tr>
        <tr>
          <td><strong>Contact Person:</strong></td>
          <td>${formData.businessInfo?.ContactPerson || ''}</td>
          <td><strong>Position/Designation:</strong></td>
          <td>${formData.businessInfo?.PositionDesignation || ''}</td>
        </tr>
        <tr>
          <td><strong>Company Address:</strong></td>
          <td colspan="3">${formData.businessInfo?.CompanyAddress || ''}</td>
        </tr>
        <tr>
          <td><strong>City:</strong></td>
          <td>${formData.businessInfo?.City || ''}</td>
          <td><strong>Province:</strong></td>
          <td>${formData.businessInfo?.Province || ''}</td>
        </tr>
        <tr>
          <td><strong>Phone No.:</strong></td>
          <td>${formData.businessInfo?.PhoneNo || ''}</td>
          <td><strong>Mobile No.:</strong></td>
          <td>${formData.businessInfo?.MobileNo || ''}</td>
        </tr>
        <tr>
          <td><strong>Commodity/Products Manufactured:</strong></td>
          <td colspan="3">${formData.businessInfo?.CommodityManufactured || ''}</td>
        </tr>
        <tr>
          <td><strong>Frequency of Production:<br>(Daily, Weekly, or Monthly)</strong></td>
          <td colspan="3">${formData.businessInfo?.ProductionFrequency || ''}</td>
        </tr>
        <tr>
          <td><strong>Bulk of Commodity per Production<br>(in volume or weight):</strong></td>
          <td colspan="3">${formData.businessInfo?.BulkOfCommodity || ''}</td>
        </tr>
      </table>
     
      <div class="section-header">CLIENT'S INFORMATION</div>
      <table>
        <tr>
          <td width="30%"><strong>Number of Client(s) to Use Facility:</strong></td>
          <td>${formData.numberOfClients || '0'}</td>
        </tr>
      </table>
     
      <table>
        <tr>
          <td colspan="4" style="background-color: #ddd;"><strong>Name of Client(s) to Use Facility:</strong></td>
        </tr>
        ${formData.clientInfoList?.map((client, index) => `
          <tr>
            <td width="20%"><strong>${index+1}. Name:</strong></td>
            <td colspan="3">${client.Name || ''}</td>
          </tr>
          <tr>
            <td><strong>Company ID No.:</strong></td>
            <td>${client.CompanyIDNo || ''}</td>
            <td width="15%"><strong>TIN No.:</strong></td>
            <td>${client.TINNo || ''}</td>
          </tr>
          <tr>
            <td><strong>Contact No.:</strong></td>
            <td colspan="3">${client.ContactNo || ''}</td>
          </tr>
          <tr>
            <td><strong>Address:</strong></td>
            <td colspan="3">${client.Address || ''}</td>
          </tr>
          <tr>
            <td><strong>City:</strong></td>
            <td>${client.City || ''}</td>
            <td><strong>Province:</strong></td>
            <td>${client.Province || ''}</td>
          </tr>
        `).join('') || `
          <tr>
            <td width="20%"><strong>1. Name:</strong></td>
            <td colspan="3"></td>
          </tr>
          <tr>
            <td><strong>Company ID No.:</strong></td>
            <td></td>
            <td width="15%"><strong>TIN No.:</strong></td>
            <td></td>
          </tr>
          <tr>
            <td><strong>Contact No.:</strong></td>
            <td colspan="3"></td>
          </tr>
          <tr>
            <td><strong>Address:</strong></td>
            <td colspan="3"></td>
          </tr>
          <tr>
            <td><strong>City:</strong></td>
            <td></td>
            <td><strong>Province:</strong></td>
            <td></td>
          </tr>
        `}
      </table>
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

/**
 * Main function to generate and download a PDF registration form
 * @param formData - The registration form data
 */
export const downloadRegistrationFormPDF = (formData: RegistrationFormData): void => {
  try {
    console.log('Starting registration form PDF generation with data:', formData);
    
    // Ensure formData has default values to prevent null/undefined errors
    const safeFormData = {
      businessInfo: {
        CompanyName: formData.businessInfo?.CompanyName || '',
        BusinessOwner: formData.businessInfo?.BusinessOwner || '',
        BusinessPermitNo: formData.businessInfo?.BusinessPermitNo || '',
        TINNo: formData.businessInfo?.TINNo || '',
        Email: formData.businessInfo?.Email || '',
        ContactPerson: formData.businessInfo?.ContactPerson || '',
        PositionDesignation: formData.businessInfo?.PositionDesignation || '',
        CompanyAddress: formData.businessInfo?.CompanyAddress || '',
        City: formData.businessInfo?.City || '',
        Province: formData.businessInfo?.Province || '',
        ZipCode: formData.businessInfo?.ZipCode || '',
        PhoneNo: formData.businessInfo?.PhoneNo || '',
        MobileNo: formData.businessInfo?.MobileNo || '',
        CommodityManufactured: formData.businessInfo?.CommodityManufactured || '',
        ProductionFrequency: formData.businessInfo?.ProductionFrequency || '',
        BulkOfCommodity: formData.businessInfo?.BulkOfCommodity || ''
      },
      clientInfoList: Array.isArray(formData.clientInfoList) ? formData.clientInfoList : [],
      numberOfClients: formData.numberOfClients || 0
    };
    
    // Initialize jsPDF
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
   
    // Check if autoTable is available
    if (typeof autoTable !== 'function') {
      console.warn('jspdf-autotable function not available, falling back to browser print');
      generatePrintPDF(safeFormData);
      return;
    }
   
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 10;
    const contentWidth = pageWidth - (margin * 2);
   
    // Add header with logos and title
    try {
      // Left logo (FabLab logo)
      try {
        const leftLogoUrl = '/images/logos/left_logo.png';
        doc.addImage(leftLogoUrl, 'PNG', margin, 10, 20, 20);
      } catch (error) {
        console.error('Error adding left logo:', error);
        // Fallback to placeholder rectangle
        doc.rect(margin, 10, 20, 20);
        doc.text('LOGO', margin + 10, 20, { align: 'center' });
      }
     
      // Right logo (DTI logo)
      try {
        const rightLogoUrl = '/images/logos/dti_logo.png';
        doc.addImage(rightLogoUrl, 'PNG', pageWidth - margin - 20, 10, 20, 20);
      } catch (error) {
        console.error('Error adding right logo:', error);
        // Fallback to placeholder rectangle
        doc.rect(pageWidth - margin - 20, 10, 20, 20);
        doc.text('DTI', pageWidth - margin - 10, 20, { align: 'center' });
      }
     
      // Add title
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('FABRICATION LABORATORY SHARED SERVICE FACILITY', pageWidth / 2, 15, { align: 'center' });
     
      doc.setFontSize(14);
      doc.text('REGISTRATION FORM', pageWidth / 2, 22, { align: 'center' });
     
      // Add subtitle
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('Philippine Science High School-Eastern Visayas Campus (PSHS-EVC)', pageWidth / 2, 28, { align: 'center' });
      doc.text('AH26 Brgy. Pawing, Palo, Leyte 6501', pageWidth / 2, 33, { align: 'center' });
    } catch (headerError) {
      console.error('Error creating header:', headerError);
    }
   
    // Add business information section
    let yPosition = 40;
    try {
      // Section header
      doc.setFillColor(200, 200, 200);
      doc.rect(margin, yPosition, contentWidth, 7, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('BUSINESS INFORMATION', margin + 2, yPosition + 5);
     
      yPosition += 7;
     
      // Business Information Tables
      
      // Company Name row
      const companyNameData: AutoTableColumnOption[][] = [
        [{ content: 'Company Name:', styles: { fontStyle: 'bold' } }, 
         { content: safeFormData.businessInfo.CompanyName }]
      ];
     
      const companyNameResult = autoTable(doc, {
        startY: yPosition,
        head: [],
        body: companyNameData,
        theme: 'grid',
        styles: { fontSize: 9 },
        margin: { left: margin, right: margin }
      });
     
      yPosition = companyNameResult.finalY || (yPosition + 10);
     
      // Business Owner and TIN row
      const ownerTinData: AutoTableColumnOption[][] = [
        [{ content: 'Company/Business Owner:', styles: { fontStyle: 'bold' } }, 
         { content: safeFormData.businessInfo.BusinessOwner },
         { content: 'TIN No.:', styles: { fontStyle: 'bold' } }, 
         { content: safeFormData.businessInfo.TINNo }]
      ];
     
      const ownerTinResult = autoTable(doc, {
        startY: yPosition,
        head: [],
        body: ownerTinData,
        theme: 'grid',
        styles: { fontSize: 9 },
        margin: { left: margin, right: margin },
        columnStyles: {
          0: { cellWidth: 50 },
          1: { cellWidth: 'auto' },
          2: { cellWidth: 25 },
          3: { cellWidth: 'auto' }
        }
      });
     
      yPosition = ownerTinResult.finalY || (yPosition + 10);
     
      // Business Permit and Email row
      const permitEmailData: AutoTableColumnOption[][] = [
        [{ content: 'Business Permit No.:', styles: { fontStyle: 'bold' } }, 
         { content: safeFormData.businessInfo.BusinessPermitNo },
         { content: 'E-mail:', styles: { fontStyle: 'bold' } }, 
         { content: safeFormData.businessInfo.Email }]
      ];
     
      const permitEmailResult = autoTable(doc, {
        startY: yPosition,
        head: [],
        body: permitEmailData,
        theme: 'grid',
        styles: { fontSize: 9 },
        margin: { left: margin, right: margin },
        columnStyles: {
          0: { cellWidth: 50 },
          1: { cellWidth: 'auto' },
          2: { cellWidth: 25 },
          3: { cellWidth: 'auto' }
        }
      });
     
      yPosition = permitEmailResult.finalY || (yPosition + 10);
     
      // Contact Person and Position row
      const contactPositionData: AutoTableColumnOption[][] = [
        [{ content: 'Contact Person:', styles: { fontStyle: 'bold' } }, 
         { content: safeFormData.businessInfo.ContactPerson },
         { content: 'Position/Designation:', styles: { fontStyle: 'bold' } }, 
         { content: safeFormData.businessInfo.PositionDesignation }]
      ];
     
      const contactPositionResult = autoTable(doc, {
        startY: yPosition,
        head: [],
        body: contactPositionData,
        theme: 'grid',
        styles: { fontSize: 9 },
        margin: { left: margin, right: margin },
        columnStyles: {
          0: { cellWidth: 50 },
          1: { cellWidth: 'auto' },
          2: { cellWidth: 50 },
          3: { cellWidth: 'auto' }
        }
      });
     
      yPosition = contactPositionResult.finalY || (yPosition + 10);
     
      // Company Address row
      const addressData: AutoTableColumnOption[][] = [
        [{ content: 'Company Address:', styles: { fontStyle: 'bold' } }, 
         { content: safeFormData.businessInfo.CompanyAddress }]
      ];
     
      const addressResult = autoTable(doc, {
        startY: yPosition,
        head: [],
        body: addressData,
        theme: 'grid',
        styles: { fontSize: 9 },
        margin: { left: margin, right: margin }
      });
     
      yPosition = addressResult.finalY || (yPosition + 10);
     
      // City, Province, Zip code row
      const cityProvinceData: AutoTableColumnOption[][] = [
        [{ content: 'City:', styles: { fontStyle: 'bold' } }, 
         { content: safeFormData.businessInfo.City },
         { content: 'Province:', styles: { fontStyle: 'bold' } }, 
         { content: safeFormData.businessInfo.Province },
         { content: 'Zip code:', styles: { fontStyle: 'bold' } }, 
         { content: safeFormData.businessInfo.ZipCode }]
      ];
     
      const cityProvinceResult = autoTable(doc, {
        startY: yPosition,
        head: [],
        body: cityProvinceData,
        theme: 'grid',
        styles: { fontSize: 9 },
        margin: { left: margin, right: margin },
        columnStyles: {
          0: { cellWidth: 20 },
          1: { cellWidth: 'auto' },
          2: { cellWidth: 25 },
          3: { cellWidth: 'auto' },
          4: { cellWidth: 25 },
          5: { cellWidth: 'auto' }
        }
      });
     
      yPosition = cityProvinceResult.finalY || (yPosition + 10);
     
      // Phone and Mobile row
      const phoneMobileData: AutoTableColumnOption[][] = [
        [{ content: 'Phone No.:', styles: { fontStyle: 'bold' } }, 
         { content: safeFormData.businessInfo.PhoneNo },
         { content: 'Mobile No.:', styles: { fontStyle: 'bold' } }, 
         { content: safeFormData.businessInfo.MobileNo }]
      ];
     
      const phoneMobileResult = autoTable(doc, {
        startY: yPosition,
        head: [],
        body: phoneMobileData,
        theme: 'grid',
        styles: { fontSize: 9 },
        margin: { left: margin, right: margin },
        columnStyles: {
          0: { cellWidth: 30 },
          1: { cellWidth: 'auto' },
          2: { cellWidth: 30 },
          3: { cellWidth: 'auto' }
        }
      });
     
      yPosition = phoneMobileResult.finalY || (yPosition + 10);
     
      // Commodity/Products Manufactured row
      const commodityData: AutoTableColumnOption[][] = [
        [{ content: 'Commodity/Products Manufactured:', styles: { fontStyle: 'bold' } }, 
         { content: safeFormData.businessInfo.CommodityManufactured }]
      ];
     
      const commodityResult = autoTable(doc, {
        startY: yPosition,
        head: [],
        body: commodityData,
        theme: 'grid',
        styles: { fontSize: 9 },
        margin: { left: margin, right: margin }
      });
     
      yPosition = commodityResult.finalY || (yPosition + 10);
     
      // Frequency of Production row
      const frequencyData: AutoTableColumnOption[][] = [
        [{ content: 'Frequency of Production:\n(Daily, Weekly, or Monthly)', styles: { fontStyle: 'bold' } }, 
         { content: safeFormData.businessInfo.ProductionFrequency }]
      ];
     
      const frequencyResult = autoTable(doc, {
        startY: yPosition,
        head: [],
        body: frequencyData,
        theme: 'grid',
        styles: { fontSize: 9 },
        margin: { left: margin, right: margin }
      });
     
      yPosition = frequencyResult.finalY || (yPosition + 10);
     
      // Bulk of Commodity row
      const bulkData: AutoTableColumnOption[][] = [
        [{ content: 'Bulk of Commodity per Production\n(in volume or weight):', styles: { fontStyle: 'bold' } }, 
         { content: safeFormData.businessInfo.BulkOfCommodity }]
      ];
     
      const bulkResult = autoTable(doc, {
        startY: yPosition,
        head: [],
        body: bulkData,
        theme: 'grid',
        styles: { fontSize: 9 },
        margin: { left: margin, right: margin }
      });
     
      yPosition = bulkResult.finalY || (yPosition + 10);
    } catch (businessInfoError) {
      console.error('Error creating business info section:', businessInfoError);
      yPosition = 150; // Fallback position
    }
   
    // Add client information section
    try {
      // Section header
      doc.setFillColor(200, 200, 200);
      doc.rect(margin, yPosition + 5, contentWidth, 7, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('CLIENT\'S INFORMATION', margin + 2, yPosition + 10);
     
      yPosition += 12;
     
      // Number of clients row
      const clientNumberData: AutoTableColumnOption[][] = [
        [{ content: 'Number of Client(s) to Use Facility:', styles: { fontStyle: 'bold' } }, 
         { content: safeFormData.numberOfClients.toString() }]
      ];
     
      const clientNumberResult = autoTable(doc, {
        startY: yPosition,
        head: [],
        body: clientNumberData,
        theme: 'grid',
        styles: { fontSize: 9 },
        margin: { left: margin, right: margin }
      });
     
      yPosition = clientNumberResult.finalY || (yPosition + 8);
     
      // Client details header - use direct rectangle fill instead of table fill
      doc.setFillColor(220, 220, 220);
      doc.rect(margin, yPosition, contentWidth, 7, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('Name of Client(s) to Use Facility:', margin + 2, yPosition + 5);
     
      yPosition += 8;
     
      // Add client entries (ensure at least 2 entries as in the image)
      const clientsToDisplay = safeFormData.clientInfoList.length > 0 
        ? safeFormData.clientInfoList 
        : [{ Name: '', CompanyIDNo: '', TINNo: '', ContactNo: '', Address: '', City: '', Province: '', ZipCode: '' },
           { Name: '', CompanyIDNo: '', TINNo: '', ContactNo: '', Address: '', City: '', Province: '', ZipCode: '' }];
      
      for (let i = 0; i < Math.max(2, clientsToDisplay.length); i++) {
        const client = clientsToDisplay[i] || {
          Name: '',
          CompanyIDNo: '',
          TINNo: '',
          ContactNo: '',
          Address: '',
          City: '',
          Province: '',
          ZipCode: ''
        };
        
        // Name row
        const nameData: AutoTableColumnOption[][] = [
          [{ content: `${i+1}. Name:`, styles: { fontStyle: 'bold' } }, 
           { content: client.Name }]
        ];
        
        const nameResult = autoTable(doc, {
          startY: yPosition,
          head: [],
          body: nameData,
          theme: 'grid',
          styles: { fontSize: 9 },
          margin: { left: margin, right: margin }
        });
        
        yPosition = nameResult.finalY || (yPosition + 7);
        
        // Company ID and TIN row
        const idTinData: AutoTableColumnOption[][] = [
          [{ content: 'Company ID No.:', styles: { fontStyle: 'bold' } }, 
           { content: client.CompanyIDNo },
           { content: 'TIN No.:', styles: { fontStyle: 'bold' } }, 
           { content: client.TINNo }]
        ];
        
        const idTinResult = autoTable(doc, {
          startY: yPosition,
          head: [],
          body: idTinData,
          theme: 'grid',
          styles: { fontSize: 9 },
          margin: { left: margin, right: margin },
          columnStyles: {
            0: { cellWidth: 40 },
            1: { cellWidth: 'auto' },
            2: { cellWidth: 25 },
            3: { cellWidth: 'auto' }
          }
        });
        
        yPosition = idTinResult.finalY || (yPosition + 7);
        
        // Contact No row
        const contactData: AutoTableColumnOption[][] = [
          [{ content: 'Contact No.:', styles: { fontStyle: 'bold' } }, 
           { content: client.ContactNo }]
        ];
        
        const contactResult = autoTable(doc, {
          startY: yPosition,
          head: [],
          body: contactData,
          theme: 'grid',
          styles: { fontSize: 9 },
          margin: { left: margin, right: margin }
        });
        
        yPosition = contactResult.finalY || (yPosition + 7);
        
        // Address row
        const addressData: AutoTableColumnOption[][] = [
          [{ content: 'Address:', styles: { fontStyle: 'bold' } }, 
           { content: client.Address }]
        ];
        
        const addressResult = autoTable(doc, {
          startY: yPosition,
          head: [],
          body: addressData,
          theme: 'grid',
          styles: { fontSize: 9 },
          margin: { left: margin, right: margin }
        });
        
        yPosition = addressResult.finalY || (yPosition + 7);
        
        // City, Province, Zipcode row
        const cityProvinceData: AutoTableColumnOption[][] = [
          [{ content: 'City:', styles: { fontStyle: 'bold' } }, 
           { content: client.City },
           { content: 'Province:', styles: { fontStyle: 'bold' } }, 
           { content: client.Province },
           { content: 'Zipcode:', styles: { fontStyle: 'bold' } }, 
           { content: client.ZipCode }]
        ];
        
        const cityProvinceResult = autoTable(doc, {
          startY: yPosition,
          head: [],
          body: cityProvinceData,
          theme: 'grid',
          styles: { fontSize: 9 },
          margin: { left: margin, right: margin },
          columnStyles: {
            0: { cellWidth: 20 },
            1: { cellWidth: 'auto' },
            2: { cellWidth: 25 },
            3: { cellWidth: 'auto' },
            4: { cellWidth: 25 },
            5: { cellWidth: 'auto' }
          }
        });
        
        yPosition = cityProvinceResult.finalY || (yPosition + 7);
        
        // Add some space between client entries
        if (i < Math.max(2, clientsToDisplay.length) - 1) {
          yPosition += 2;
        }
      }
    } catch (clientInfoError) {
      console.error('Error creating client info section:', clientInfoError);
    }
   
    // Save the PDF
    doc.save(`Registration_Form.pdf`);
    console.log('Registration form PDF saved successfully');
  } catch (error) {
    console.error('Error generating registration form PDF:', error);
    // Fall back to browser print method
    try {
      generatePrintPDF(formData);
    } catch (printError) {
      console.error('Even fallback print failed:', printError);
      alert(`Unable to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
};