import { toast } from 'react-hot-toast';
export const downloadPDF = async (reservation: any) => {
  try {
    // Show a loading indicator
    const loadingToast = toast?.loading ? toast.loading('Generating PDF...') : null;
    
    console.log('Sending reservation data to generate PDF:', reservation.id);
    
    const response = await fetch('/api/admin/pdf-generation/generate-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reservation),
    });

    console.log('PDF generation response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      
      // Dismiss loading toast if using toast notifications
      if (loadingToast && toast?.dismiss) toast.dismiss(loadingToast);
      
      // Show error toast if using toast notifications
      if (toast?.error) toast.error('Failed to generate PDF');
      
      throw new Error(`Failed to generate PDF: ${response.status} ${response.statusText}`);
    }

    // Get the blob from the response
    const blob = await response.blob();
    
    // Create download link
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Reservation-${reservation.id}.pdf`;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 100);

    // Dismiss loading toast and show success toast if using toast notifications
    if (loadingToast && toast?.dismiss) toast.dismiss(loadingToast);
    if (toast?.success) toast.success('PDF downloaded successfully');
    
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    
    // Show error toast if using toast notifications
    if (toast?.error) toast.error(`Error generating PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    
    return false;
  }
};