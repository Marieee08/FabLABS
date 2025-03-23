// utils/fileUpload.ts
export async function uploadFiles(
    files: File[], 
    serviceName: string, 
    serviceId?: string, 
    reservationId?: string
  ) {
    if (!files.length) return [];
  
    const formData = new FormData();
    
    files.forEach((file) => {
      formData.append('files', file);
    });
    
    formData.append('serviceName', serviceName);
    if (serviceId) formData.append('serviceId', serviceId);
    if (reservationId) formData.append('reservationId', reservationId);
  
    try {
      const response = await fetch('/api/upload-file', {
        method: 'POST',
        body: formData,
      });
  
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to upload files');
      }
  
      return await response.json();
    } catch (error) {
      console.error('Error uploading files:', error);
      throw error;
    }
  }