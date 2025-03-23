// src\app\api\user\upload-file\route.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getAuth } from '@clerk/nextjs/server';
import formidable from 'formidable';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '@/lib/prisma';

// Disable the default body parser to handle file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Authenticate user
  const { userId } = getAuth(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Parse multipart form data
    const form = formidable({
      multiples: true,
      uploadDir: path.join(process.cwd(), 'tmp'),
      keepExtensions: true,
    });

    const [fields, files] = await new Promise<[formidable.Fields, formidable.Files]>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });

    // Extract form fields
    const serviceId = Array.isArray(fields.serviceId) ? fields.serviceId[0] : fields.serviceId;
    const reservationId = Array.isArray(fields.reservationId) ? fields.reservationId[0] : fields.reservationId;
    const serviceName = Array.isArray(fields.serviceName) ? fields.serviceName[0] : fields.serviceName;

    if (!serviceId || !serviceName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create directories if they don't exist
    const baseUploadDir = path.join(process.cwd(), 'public', 'user-uploads');
    const serviceDir = path.join(baseUploadDir, serviceName.replace(/\s+/g, '-').toLowerCase());
    const reservationDir = path.join(serviceDir, reservationId || userId);

    if (!fs.existsSync(baseUploadDir)) fs.mkdirSync(baseUploadDir);
    if (!fs.existsSync(serviceDir)) fs.mkdirSync(serviceDir);
    if (!fs.existsSync(reservationDir)) fs.mkdirSync(reservationDir);

    // Process uploaded files
    const fileArray = Array.isArray(files.files) ? files.files : [files.files];
    const savedFiles = [];

    for (const file of fileArray) {
      if (!file) continue;

      // Generate unique filename
      const fileExt = path.extname(file.originalFilename || '');
      const fileName = `${uuidv4()}${fileExt}`;
      const finalPath = path.join(reservationDir, fileName);

      // Move file from temp directory to final location
      fs.copyFileSync(file.filepath, finalPath);
      fs.unlinkSync(file.filepath);

      // Create relative path for database storage
      const relativePath = `/user-uploads/${serviceName.replace(/\s+/g, '-').toLowerCase()}/${reservationId || userId}/${fileName}`;
      
      savedFiles.push({
        originalName: file.originalFilename,
        path: relativePath,
        size: file.size,
      });

      // Update database if serviceId is provided
      if (serviceId) {
        await prisma.userService.update({
          where: { id: serviceId },
          data: { File: relativePath },
        });
      }
    }

    return res.status(200).json({ 
      success: true, 
      files: savedFiles 
    });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ error: 'Failed to upload files' });
  }
}