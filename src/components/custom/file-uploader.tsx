// src\components\custom\file-uploader.tsx
import React, { useState } from 'react';
import { Upload, X, FileText, CheckCircle } from 'lucide-react';

interface FileUploaderProps {
  serviceName: string;
  onFileUpload: (files: File[]) => void;
  maxFiles?: number;
  acceptedFileTypes?: string;
}

export default function FileUploader({ 
  serviceName, 
  onFileUpload, 
  maxFiles = 5, 
  acceptedFileTypes = '*/*' 
}: FileUploaderProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{[key: string]: 'pending' | 'success' | 'error'}>({});

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files);
      handleFiles(newFiles);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      handleFiles(newFiles);
    }
  };

  const handleFiles = (newFiles: File[]) => {
    const validFiles = [...files];
    const statusUpdates: {[key: string]: 'pending' | 'success' | 'error'} = {...uploadStatus};

    newFiles.forEach(file => {
      if (validFiles.length < maxFiles) {
        validFiles.push(file);
        statusUpdates[file.name] = 'pending';
      }
    });

    setFiles(validFiles);
    setUploadStatus(statusUpdates);
    onFileUpload(validFiles);
  };

  const removeFile = (index: number) => {
    const newFiles = [...files];
    const removedFile = newFiles[index];
    newFiles.splice(index, 1);
    
    setFiles(newFiles);
    
    // Remove from status
    const newStatus = {...uploadStatus};
    delete newStatus[removedFile.name];
    setUploadStatus(newStatus);
    
    onFileUpload(newFiles);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  return (
    <div className="w-full">
      <div 
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById(`file-input-${serviceName}`)?.click()}
      >
        <input
          id={`file-input-${serviceName}`}
          type="file"
          className="hidden"
          multiple
          accept={acceptedFileTypes}
          onChange={handleFileChange}
        />
        <Upload className="h-10 w-10 mx-auto text-gray-400" />
        <p className="mt-2 text-sm text-gray-500">
          Drag and drop files here, or click to browse
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Maximum {maxFiles} files. All file types accepted.
        </p>
      </div>
      
      {files.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium mb-2">Selected Files ({files.length}/{maxFiles})</h4>
          <ul className="space-y-2">
            {files.map((file, index) => (
              <li 
                key={index}
                className="flex items-center justify-between p-2 bg-gray-50 rounded border"
              >
                <div className="flex items-center">
                  <FileText className="h-5 w-5 text-gray-500 mr-2" />
                  <div>
                    <p className="text-sm font-medium truncate max-w-xs">{file.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  {uploadStatus[file.name] === 'success' ? (
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  ) : null}
                  <button 
                    type="button" 
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(index);
                    }}
                    className="ml-2 text-gray-400 hover:text-red-500"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}