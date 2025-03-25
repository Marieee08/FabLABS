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
 
  // Wait for content to load before printing
  printWindow.onload = () => {
    printWindow.print();
    printWindow.close();
  };
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
      // Add title first (no logos yet, to ensure title is visible)
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
     
      // Left logo (FabLab logo) - Add with error handling after text to ensure text is visible
      try {
        const leftLogoUrl = '/images/logos/left_logo.png';
        doc.addImage(leftLogoUrl, 'PNG', margin, 10, 20, 20);
      } catch (error) {
        console.error('Error adding left logo:', error);
        // Fallback to a text representation
        doc.setFontSize(8);
        doc.text('FABLAB', margin + 10, 20, { align: 'center' });
      }
     
      // Right logo (DTI logo) - Add with error handling
      try {
        const rightLogoUrl = '/images/logos/dti_logo.png';
        doc.addImage(rightLogoUrl, 'PNG', pageWidth - margin - 20, 10, 20, 20);
      } catch (error) {
        console.error('Error adding right logo:', error);
        // Fallback to a text representation
        doc.setFontSize(8);
        doc.text('DTI', pageWidth - margin - 10, 20, { align: 'center' });
      }
    } catch (headerError) {
      console.error('Error creating header:', headerError);
    }
   
    // Add business information section
    let yPosition = 40;
    try {
      // Section header
      doc.setFillColor(200, 200, 200);
      doc.rect(margin, yPosition, contentWidth, 7, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('BUSINESS INFORMATION', margin + 2, yPosition + 5);
     
      yPosition += 7; // Increased spacing after section header
     
      // Business Information Tables with cell borders
      const labelWidth = 60;
      const cellHeight = 7;
     
      // Function to draw a bordered cell
      const drawCell = (x: number, y: number, width: number, height: number, text: string, isHeader: boolean = false) => {
        // Draw cell border
        doc.setDrawColor(0);
        doc.rect(x, y, width, height);
       
        // Set text style and add text
        if (isHeader) {
          doc.setFont('helvetica', 'bold');
        } else {
          doc.setFont('helvetica', 'normal');
        }
       
        // Add text with 2mm padding
        doc.text(text, x + 2, y + height/2 + 2);
      };
     
      // Company Name row
      doc.setFontSize(9);
      drawCell(margin, yPosition, labelWidth, cellHeight, 'Company Name:', true);
      drawCell(margin + labelWidth, yPosition, contentWidth - labelWidth, cellHeight, safeFormData.businessInfo.CompanyName);
     
      yPosition += cellHeight;
     
      // Business Owner and TIN row
      const ownerWidth = 100;
      const tinLabelWidth = 30;
      drawCell(margin, yPosition, labelWidth, cellHeight, 'Company/Business Owner:', true);
      drawCell(margin + labelWidth, yPosition, ownerWidth - labelWidth, cellHeight, safeFormData.businessInfo.BusinessOwner);
      drawCell(margin + ownerWidth, yPosition, tinLabelWidth, cellHeight, 'TIN No.:', true);
      drawCell(margin + ownerWidth + tinLabelWidth, yPosition, contentWidth - ownerWidth - tinLabelWidth, cellHeight, safeFormData.businessInfo.TINNo);
     
      yPosition += cellHeight;
     
      // Business Permit and Email row
      const permitWidth = 100;
      const emailLabelWidth = 30;
      drawCell(margin, yPosition, labelWidth, cellHeight, 'Business Permit No.:', true);
      drawCell(margin + labelWidth, yPosition, permitWidth - labelWidth, cellHeight, safeFormData.businessInfo.BusinessPermitNo);
      drawCell(margin + permitWidth, yPosition, emailLabelWidth, cellHeight, 'E-mail:', true);
      drawCell(margin + permitWidth + emailLabelWidth, yPosition, contentWidth - permitWidth - emailLabelWidth, cellHeight, safeFormData.businessInfo.Email);
     
      yPosition += cellHeight;
     
      // Contact Person and Position row
      const contactWidth = 100;
      const positionLabelWidth = 50;
      drawCell(margin, yPosition, labelWidth, cellHeight, 'Contact Person:', true);
      drawCell(margin + labelWidth, yPosition, contactWidth - labelWidth, cellHeight, safeFormData.businessInfo.ContactPerson);
      drawCell(margin + contactWidth, yPosition, positionLabelWidth, cellHeight, 'Position/Designation:', true);
      drawCell(margin + contactWidth + positionLabelWidth, yPosition, contentWidth - contactWidth - positionLabelWidth, cellHeight, safeFormData.businessInfo.PositionDesignation);
     
      yPosition += cellHeight;
     
      // Company Address row
      drawCell(margin, yPosition, labelWidth, cellHeight, 'Company Address:', true);
      drawCell(margin + labelWidth, yPosition, contentWidth - labelWidth, cellHeight, safeFormData.businessInfo.CompanyAddress);
     
      yPosition += cellHeight;
     
      // City, Province, Zip code row
      const cityWidth = 50;
      const provinceWidth = 50;
      const zipLabelWidth = 25;
      const zipValueWidth = 15;
      drawCell(margin, yPosition, 20, cellHeight, 'City:', true);
      drawCell(margin + 20, yPosition, cityWidth, cellHeight, safeFormData.businessInfo.City);
      drawCell(margin + 20 + cityWidth, yPosition, 30, cellHeight, 'Province:', true);
      drawCell(margin + 20 + cityWidth + 30, yPosition, provinceWidth, cellHeight, safeFormData.businessInfo.Province);
      drawCell(margin + 20 + cityWidth + 30 + provinceWidth, yPosition, zipLabelWidth, cellHeight, 'Zip code:', true);
      drawCell(margin + 20 + cityWidth + 30 + provinceWidth + zipLabelWidth, yPosition, zipValueWidth, cellHeight, safeFormData.businessInfo.ZipCode);
     
      yPosition += cellHeight;
     
      // Phone and Mobile row
      const phoneWidth = 60;
      const mobileLabelWidth = 35;
      drawCell(margin, yPosition, 30, cellHeight, 'Phone No.:', true);
      drawCell(margin + 30, yPosition, phoneWidth, cellHeight, safeFormData.businessInfo.PhoneNo);
      drawCell(margin + 30 + phoneWidth, yPosition, mobileLabelWidth, cellHeight, 'Mobile No.:', true);
      drawCell(margin + 30 + phoneWidth + mobileLabelWidth, yPosition, contentWidth - (30 + phoneWidth + mobileLabelWidth), cellHeight, safeFormData.businessInfo.MobileNo);
     
      yPosition += cellHeight;
     
      // Commodity/Products Manufactured row
      drawCell(margin, yPosition, 80, cellHeight, 'Commodity/Products Manufactured:', true);
      drawCell(margin + 80, yPosition, contentWidth - 80, cellHeight, safeFormData.businessInfo.CommodityManufactured);
     
      yPosition += cellHeight;
     
      // Frequency of Production row
      const freqLabelHeight = 12; // Taller cell for extra text
      drawCell(margin, yPosition, 80, freqLabelHeight, 'Frequency of Production:\n(Daily, Weekly, or Monthly)', true);
      drawCell(margin + 80, yPosition, contentWidth - 80, freqLabelHeight, safeFormData.businessInfo.ProductionFrequency);
     
      yPosition += freqLabelHeight;
     
      // Bulk of Commodity row
      const bulkLabelHeight = 12; // Taller cell for extra text
      drawCell(margin, yPosition, 80, bulkLabelHeight, 'Bulk of Commodity per Production:\n(in volume or weight)', true);
      drawCell(margin + 80, yPosition, contentWidth - 80, bulkLabelHeight, safeFormData.businessInfo.BulkOfCommodity);
     
      yPosition += bulkLabelHeight + 3; // Add a bit of extra spacing
    } catch (businessInfoError) {
      console.error('Error creating business info section:', businessInfoError);
      yPosition += 15; // Move down a bit if there's an error
    }
   
    // Add client information section
    try {
      // Check if we need to add a new page
      if (yPosition > 180) {
        doc.addPage();
        yPosition = 20;
      }
     
      // Section header
      doc.setFillColor(200, 200, 200);
      doc.rect(margin, yPosition, contentWidth, 7, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('CLIENT\'S INFORMATION', margin + 2, yPosition + 5);
     
      yPosition += 7;
     
      // Function to draw a bordered cell (reused from business section)
      const drawCell = (x: number, y: number, width: number, height: number, text: string, isHeader: boolean = false) => {
        // Draw cell border
        doc.setDrawColor(0);
        doc.rect(x, y, width, height);
       
        // Set text style and add text
        if (isHeader) {
          doc.setFont('helvetica', 'bold');
        } else {
          doc.setFont('helvetica', 'normal');
        }
       
        // Add text with 2mm padding
        doc.text(text, x + 2, y + height/2 + 2);
      };
     
      // Number of clients row
      const cellHeight = 7;
      const labelWidth = 80;
      doc.setFontSize(9);
      drawCell(margin, yPosition, labelWidth, cellHeight, 'Number of Client(s) to Use Facility:', true);
      drawCell(margin + labelWidth, yPosition, contentWidth - labelWidth, cellHeight, safeFormData.numberOfClients.toString());
     
      yPosition += cellHeight;
     
      // Client details header
      doc.setFillColor(220, 220, 220);
      doc.rect(margin, yPosition, contentWidth, 7, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('Name of Client(s) to Use Facility:', margin + 2, yPosition + 5);
     
      yPosition += cellHeight;
     
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
       
        // Check if we need to add a new page for this client
        if (yPosition > 220) {
          doc.addPage();
          yPosition = 20;
        }
       
        // Name row
        drawCell(margin, yPosition, labelWidth/2, cellHeight, `${i+1}. Name:`, true);
        drawCell(margin + labelWidth/2, yPosition, contentWidth - labelWidth/2, cellHeight, client.Name);
       
        yPosition += cellHeight;
       
        // Company ID and TIN row
        const idWidth = 40;
        const idValueWidth = 60;
        const tinLabelWidth = 30;
        drawCell(margin, yPosition, idWidth, cellHeight, 'Company ID No.:', true);
        drawCell(margin + idWidth, yPosition, idValueWidth, cellHeight, client.CompanyIDNo);
        drawCell(margin + idWidth + idValueWidth, yPosition, tinLabelWidth, cellHeight, 'TIN No.:', true);
        drawCell(margin + idWidth + idValueWidth + tinLabelWidth, yPosition, contentWidth - (idWidth + idValueWidth + tinLabelWidth), cellHeight, client.TINNo);
       
        yPosition += cellHeight;
       
        // Contact No row
        drawCell(margin, yPosition, idWidth, cellHeight, 'Contact No.:', true);
        drawCell(margin + idWidth, yPosition, contentWidth - idWidth, cellHeight, client.ContactNo);
       
        yPosition += cellHeight;
       
        // Address row
        drawCell(margin, yPosition, idWidth, cellHeight, 'Address:', true);
        drawCell(margin + idWidth, yPosition, contentWidth - idWidth, cellHeight, client.Address);
       
        yPosition += cellHeight;
       
        // City, Province, Zipcode row
        const cityLabelWidth = 20;
        const cityWidth = 50;
        const provinceLabelWidth = 30;
        const provinceWidth = 50;
        const zipLabelWidth = 30;
       
        drawCell(margin, yPosition, cityLabelWidth, cellHeight, 'City:', true);
        drawCell(margin + cityLabelWidth, yPosition, cityWidth, cellHeight, client.City);
       
        drawCell(margin + cityLabelWidth + cityWidth, yPosition, provinceLabelWidth, cellHeight, 'Province:', true);
        drawCell(margin + cityLabelWidth + cityWidth + provinceLabelWidth, yPosition, provinceWidth, cellHeight, client.Province);
       
        drawCell(margin + cityLabelWidth + cityWidth + provinceLabelWidth + provinceWidth, yPosition, zipLabelWidth, cellHeight, 'Zipcode:', true);
        drawCell(margin + cityLabelWidth + cityWidth + provinceLabelWidth + provinceWidth + zipLabelWidth, yPosition,
            contentWidth - (cityLabelWidth + cityWidth + provinceLabelWidth + provinceWidth + zipLabelWidth), cellHeight, client.ZipCode);
       
        yPosition += cellHeight + 5; // Add extra space between client entries
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

 