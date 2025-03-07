// Import jsPDF library
import jsPDF from 'jspdf';
import 'jspdf-autotable';

/**
 * Generates and downloads a PDF for a reservation
 * @param {DetailedReservation} reservationData - The reservation data
 */
export const downloadPDF = (reservationData) => {
  // Create a new PDF document
  const doc = new jsPDF();
  
  // Set font size and add title
  doc.setFontSize(20);
  doc.text('Reservation Details', 105, 15, { align: 'center' });
  
  // Add reservation ID and status
  doc.setFontSize(12);
  doc.text(`Reservation ID: ${reservationData.id}`, 14, 30);
  doc.text(`Status: ${reservationData.Status}`, 14, 40);
  doc.text(`Request Date: ${new Date(reservationData.RequestDate).toLocaleDateString()}`, 14, 50);
  doc.text(`Total Amount Due: ₱${formatCurrency(reservationData.TotalAmntDue)}`, 14, 60);
  
  // Add customer information
  doc.setFontSize(16);
  doc.text('Customer Information', 14, 75);
  doc.setFontSize(12);
  doc.text(`Name: ${reservationData.accInfo.Name}`, 14, 85);
  doc.text(`Email: ${reservationData.accInfo.email}`, 14, 95);
  doc.text(`Role: ${reservationData.accInfo.Role}`, 14, 105);
  
  // Add contact information if available
  if (reservationData.accInfo.ClientInfo) {
    doc.text(`Contact Number: ${reservationData.accInfo.ClientInfo.ContactNum}`, 14, 115);
    doc.text(`Address: ${reservationData.accInfo.ClientInfo.Address}`, 14, 125);
    doc.text(`City: ${reservationData.accInfo.ClientInfo.City}`, 14, 135);
    doc.text(`Province: ${reservationData.accInfo.ClientInfo.Province}`, 14, 145);
    doc.text(`Zipcode: ${reservationData.accInfo.ClientInfo.Zipcode}`, 14, 155);
  }
  
  // Add a new page if business info is available
  if (reservationData.accInfo.BusinessInfo) {
    doc.addPage();
    doc.setFontSize(16);
    doc.text('Business Information', 14, 15);
    doc.setFontSize(12);
    
    const businessInfo = reservationData.accInfo.BusinessInfo;
    doc.text(`Company Name: ${businessInfo.CompanyName}`, 14, 25);
    doc.text(`Business Owner: ${businessInfo.BusinessOwner}`, 14, 35);
    doc.text(`Business Permit Number: ${businessInfo.BusinessPermitNum}`, 14, 45);
    doc.text(`TIN Number: ${businessInfo.TINNum}`, 14, 55);
    doc.text(`Company ID Number: ${businessInfo.CompanyIDNum}`, 14, 65);
    doc.text(`Company Email: ${businessInfo.CompanyEmail}`, 14, 75);
    doc.text(`Contact Person: ${businessInfo.ContactPerson}`, 14, 85);
    doc.text(`Designation: ${businessInfo.Designation}`, 14, 95);
    doc.text(`Company Address: ${businessInfo.CompanyAddress}`, 14, 105);
    doc.text(`Products Manufactured: ${businessInfo.Manufactured}`, 14, 115);
    doc.text(`Production Frequency: ${businessInfo.ProductionFrequency}`, 14, 125);
    doc.text(`Bulk Production: ${businessInfo.Bulk}`, 14, 135);
  }
  
  // Add services information on a new page
  doc.addPage();
  doc.setFontSize(16);
  doc.text('Services Information', 14, 15);
  
  // Create table for services
  const servicesTableData = reservationData.UserServices.map(service => [
    service.ServiceAvail,
    service.EquipmentAvail,
    `${service.MinsAvail || 0} mins`,
    `₱${formatCurrency(service.CostsAvail)}`
  ]);
  
  doc.autoTable({
    startY: 25,
    head: [['Service', 'Equipment', 'Duration', 'Cost']],
    body: servicesTableData,
  });
  
  // Add schedule information
  const scheduleStartY = doc.lastAutoTable.finalY + 20;
  doc.setFontSize(16);
  doc.text('Schedule Information', 14, scheduleStartY);
  
  const scheduleTableData = reservationData.UtilTimes.map(time => [
    `Day ${time.DayNum}`,
    time.StartTime ? new Date(time.StartTime).toLocaleString() : 'Not set',
    time.EndTime ? new Date(time.EndTime).toLocaleString() : 'Not set'
  ]);
  
  doc.autoTable({
    startY: scheduleStartY + 10,
    head: [['Day', 'Start Time', 'End Time']],
    body: scheduleTableData,
  });
  
  // Add tools information if available
  if (reservationData.UserTools && reservationData.UserTools.length > 0) {
    const toolsStartY = doc.lastAutoTable.finalY + 20;
    doc.setFontSize(16);
    doc.text('Tools Information', 14, toolsStartY);
    
    const toolsTableData = reservationData.UserTools.map(tool => [
      tool.ToolUser,
      tool.ToolQuantity
    ]);
    
    doc.autoTable({
      startY: toolsStartY + 10,
      head: [['Tool', 'Quantity']],
      body: toolsTableData,
    });
  }
  
  // Add footer with date generated
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, doc.internal.pageSize.height - 10);
    doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width - 30, doc.internal.pageSize.height - 10);
  }
  
  // Save the PDF
  doc.save(`Reservation_${reservationData.id}.pdf`);
};

/**
 * Format currency values
 * @param {number|string|null} amount - The amount to format
 * @returns {string} - Formatted amount
 */
const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '0.00';
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return Number(numAmount).toFixed(2);
};