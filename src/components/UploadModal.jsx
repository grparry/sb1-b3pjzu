import React, { useState, useCallback, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { X, Upload, File, AlertCircle, Image as ImageIcon } from 'lucide-react';

function UploadModal({ onClose, onUpload, acceptedTypes = '*', multiple = true }) {
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState({});
  const [previews, setPreviews] = useState({});
  const [totalProgress, setTotalProgress] = useState(0);
  const fileInputRef = useRef(null);
  const modalRef = useRef(null);

  // Clean up previews when component unmounts
  useEffect(() => {
    return () => {
      Object.values(previews).forEach(url => URL.revokeObjectURL(url));
    };
  }, [previews]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && !isUploading) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose, isUploading]);

  // Focus trap for accessibility
  useEffect(() => {
    const handleTab = (e) => {
      if (!modalRef.current) return;
      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };
    document.addEventListener('keydown', handleTab);
    return () => document.removeEventListener('keydown', handleTab);
  }, []);

  // Update total progress
  useEffect(() => {
    if (files.length === 0) {
      setTotalProgress(0);
      return;
    }
    
    const progress = Object.values(uploadProgress);
    if (progress.length === 0) return;
    
    const total = progress.reduce((acc, curr) => acc + curr, 0);
    setTotalProgress(Math.round(total / files.length));
  }, [uploadProgress, files]);

  const generatePreview = useCallback((file) => {
    if (file.type.startsWith('image/')) {
      const previewUrl = URL.createObjectURL(file);
      setPreviews(prev => ({ ...prev, [file.name]: previewUrl }));
    }
  }, []);

  const checkDuplicateFileName = useCallback((fileName) => {
    return files.some(file => file.name === fileName);
  }, [files]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const validateFiles = useCallback((fileList) => {
    const validFiles = [];
    const errors = [];

    Array.from(fileList).forEach(file => {
      // Check for duplicates
      if (checkDuplicateFileName(file.name)) {
        errors.push(`${file.name} already exists`);
        return;
      }

      // Check file type
      if (acceptedTypes !== '*') {
        const fileType = file.type;
        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
        const acceptedTypesList = acceptedTypes.split(',');
        
        const isValidType = acceptedTypesList.some(type => {
          if (type.startsWith('.')) {
            return fileExtension === type.toLowerCase();
          }
          return fileType.match(new RegExp(type.replace('*', '.*')));
        });

        if (!isValidType) {
          errors.push(`${file.name} is not a valid file type`);
          return;
        }
      }

      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        errors.push(`${file.name} is too large (max 10MB)`);
        return;
      }

      validFiles.push(file);
      generatePreview(file);
    });

    return { validFiles, errors };
  }, [acceptedTypes, checkDuplicateFileName, generatePreview]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    setError(null);

    const { validFiles, errors } = validateFiles(e.dataTransfer.files);
    
    if (errors.length > 0) {
      setError(errors.join(', '));
      return;
    }

    if (!multiple && validFiles.length > 1) {
      setError('Only one file can be uploaded at a time');
      return;
    }

    setFiles(prev => [...prev, ...validFiles]);
  }, [multiple, validateFiles]);

  const handleFileSelect = useCallback((e) => {
    setError(null);
    const { validFiles, errors } = validateFiles(e.target.files);
    
    if (errors.length > 0) {
      setError(errors.join(', '));
      return;
    }

    if (!multiple && validFiles.length > 1) {
      setError('Only one file can be uploaded at a time');
      return;
    }

    setFiles(prev => [...prev, ...validFiles]);
  }, [multiple, validateFiles]);

  const handlePaste = useCallback((e) => {
    e.preventDefault();
    setError(null);

    const items = Array.from(e.clipboardData.items);
    const validItems = items.filter(item => item.kind === 'file');
    
    if (validItems.length === 0) return;
    
    const pastedFiles = validItems.map(item => item.getAsFile());
    const { validFiles, errors } = validateFiles(pastedFiles);
    
    if (errors.length > 0) {
      setError(errors.join(', '));
      return;
    }

    if (!multiple && validFiles.length > 1) {
      setError('Only one file can be uploaded at a time');
      return;
    }

    setFiles(prev => [...prev, ...validFiles]);
  }, [multiple, validateFiles]);

  const handleUpload = async () => {
    try {
      setIsUploading(true);
      setError(null);
      
      // Upload files sequentially with progress tracking
      for (const file of files) {
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
        
        // Create a custom upload function that tracks progress
        const formData = new FormData();
        formData.append('file', file);
        
        try {
          await new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            
            xhr.upload.addEventListener('progress', (event) => {
              if (event.lengthComputable) {
                const progress = Math.round((event.loaded * 100) / event.total);
                setUploadProgress(prev => ({ ...prev, [file.name]: progress }));
              }
            });
            
            xhr.addEventListener('load', () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
                resolve(xhr.response);
              } else {
                reject(new Error(`Upload failed: ${xhr.statusText}`));
              }
            });
            
            xhr.addEventListener('error', () => {
              reject(new Error('Upload failed'));
            });
            
            // Pass the file to the onUpload callback
            onUpload([file]);
          });
        } catch (err) {
          setError(`Failed to upload ${file.name}: ${err.message}`);
          break;
        }
      }
      
      onClose();
    } catch (err) {
      console.error('Error uploading files:', err);
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = useCallback((index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const acceptedTypesLabel = acceptedTypes === '*' 
    ? 'all files' 
    : acceptedTypes
        .split(',')
        .map(type => type.startsWith('.') ? type.slice(1).toUpperCase() : type)
        .join(', ');

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={(e) => e.target === e.currentTarget && !isUploading && onClose()}
      onPaste={handlePaste}
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-modal-title"
    >
      <div 
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl"
        role="document"
      >
        <div className="p-6 border-b flex justify-between items-center">
          <h2 id="upload-modal-title" className="text-xl font-semibold">Upload Files</h2>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
            disabled={isUploading}
            aria-label="Close upload modal"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div 
              className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700"
              role="alert"
            >
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center ${
              isDragging ? 'border-sky-500 bg-sky-50' : 'border-gray-300'
            } focus-within:border-sky-500 focus-within:ring-1 focus-within:ring-sky-500`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
            tabIndex={0}
            role="button"
            aria-label={`Drag and drop files here or click to select files. Accepts ${acceptedTypesLabel}`}
          >
            <Upload size={48} className="mx-auto text-gray-400 mb-4" aria-hidden="true" />
            <p className="text-gray-600 mb-2">
              Drag and drop your files here, or{' '}
              <span className="text-sky-500">browse</span>
            </p>
            <p className="text-sm text-gray-500">
              Accepts {acceptedTypesLabel}
            </p>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileSelect}
              accept={acceptedTypes}
              multiple={multiple}
              aria-label={`Select ${multiple ? 'files' : 'a file'}`}
            />
          </div>

          {files.length > 0 && (
            <div className="mt-4" role="region" aria-label="Selected files">
              {isUploading && (
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Total Progress</span>
                    <span>{totalProgress}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-sky-500 transition-all duration-300"
                      style={{ width: `${totalProgress}%` }}
                    />
                  </div>
                </div>
              )}
              <div className="space-y-2">
                {files.map((file, index) => (
                  <div key={file.name} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0">
                      {file.type.startsWith('image/') && previews[file.name] ? (
                        <img 
                          src={previews[file.name]} 
                          alt={file.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                          {file.type.startsWith('image/') ? (
                            <ImageIcon size={24} className="text-gray-400" />
                          ) : (
                            <File size={24} className="text-gray-400" />
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-grow min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      {isUploading && uploadProgress[file.name] !== undefined && (
                        <div className="mt-1">
                          <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-sky-500 transition-all duration-300"
                              style={{ width: `${uploadProgress[file.name]}%` }}
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {uploadProgress[file.name]}%
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <button
                      onClick={() => removeFile(index)}
                      className="flex-shrink-0 text-gray-400 hover:text-gray-600"
                      disabled={isUploading}
                    >
                      <X size={20} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            disabled={isUploading}
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={files.length === 0 || isUploading}
            className="px-4 py-2 text-sm font-medium text-white bg-sky-500 rounded-md hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                Uploading...
              </>
            ) : (
              <>Upload {files.length} {files.length === 1 ? 'File' : 'Files'}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

UploadModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  onUpload: PropTypes.func.isRequired,
  acceptedTypes: PropTypes.string,
  multiple: PropTypes.bool
};

export default UploadModal;