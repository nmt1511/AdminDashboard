import {
    CloudUpload as CloudUploadIcon,
    Delete as DeleteIcon,
    PhotoCamera as PhotoCameraIcon
} from '@mui/icons-material';
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    IconButton,
    Paper,
    Typography,
    styled
} from '@mui/material';
import React, { useRef, useState } from 'react';
import { useToast } from './ToastProvider';

// Styled component for drag & drop area
const DropZone = styled(Paper)(({ theme, isDragActive, hasImage }) => ({
  border: `2px dashed ${isDragActive ? theme.palette.primary.main : theme.palette.grey[300]}`,
  borderRadius: theme.spacing(2),
  padding: theme.spacing(3),
  textAlign: 'center',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  backgroundColor: isDragActive ? theme.palette.primary[50] : 'transparent',
  position: 'relative',
  minHeight: hasImage ? 'auto' : 120,
  '&:hover': {
    borderColor: theme.palette.primary.main,
    backgroundColor: theme.palette.primary[50]
  }
}));

const HiddenInput = styled('input')({
  display: 'none'
});

const DirectImageUpload = ({ 
  value, 
  onChange, 
  disabled = false, 
  label = "Ảnh thú cưng",
  maxSize = 10 * 1024 * 1024, // 10MB
  acceptedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  uploadMode = 'preview' // 'preview' (chỉ preview) hoặc 'immediate' (upload ngay)
}) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const toast = useToast();

  // Upload to Cloudinary function
  const uploadToCloudinary = async (file) => {
    const cloudName = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      throw new Error('Cloudinary chưa được cấu hình. Vui lòng kiểm tra file .env');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    formData.append('cloud_name', cloudName);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || 'Upload thất bại');
    }

    return await response.json();
  };

  // Validate file
  const validateFile = (file) => {
    if (!acceptedFormats.includes(file.type)) {
      return 'Định dạng file không được hỗ trợ. Vui lòng chọn file JPG, PNG, GIF hoặc WebP.';
    }
    
    if (file.size > maxSize) {
      return `File quá lớn. Kích thước tối đa là ${Math.round(maxSize / 1024 / 1024)}MB.`;
    }
    
    return null;
  };

  // Handle file upload or preview
  const handleFileProcess = async (file) => {
    if (!file) return;

    const validation = validateFile(file);
    if (validation) {
      setError(validation);
      return;
    }

    setError(null);

    if (uploadMode === 'immediate') {
      // Upload ngay lập tức (chế độ cũ)
      setUploading(true);
      try {
        console.log('Uploading file:', file.name, 'Size:', file.size);
        const result = await uploadToCloudinary(file);
        console.log('Upload successful:', result);
        
        onChange(result.secure_url);
        toast.showSuccess(`Đã upload ảnh "${file.name}" thành công!`);
      } catch (err) {
        console.error('Upload error:', err);
        setError(err.message || 'Upload thất bại. Vui lòng thử lại.');
        toast.showError('Upload ảnh thất bại: ' + err.message);
      } finally {
        setUploading(false);
      }
    } else {
      // Chỉ preview local (chế độ mới)
      console.log('Preview mode - file selected:', file.name);
      onChange(file); // Trả về File object thay vì URL
    }
  };

  // Handle drag events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileProcess(files[0]);
    }
  };

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFileProcess(files[0]);
    }
    // Reset input value để có thể chọn lại cùng file
    e.target.value = '';
  };

  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleRemoveImage = () => {
    if (disabled) return;
    onChange('');
    setError(null);
  };

  // Get preview URL
  const getPreviewUrl = () => {
    if (!value) return null;
    
    if (typeof value === 'string') {
      // Đã có URL (đã upload hoặc existing)
      return value;
    } else if (value instanceof File) {
      // File local - tạo blob URL
      return URL.createObjectURL(value);
    }
    
    return null;
  };

  const previewUrl = getPreviewUrl();
  const isLocalFile = value instanceof File;
  const isExistingUrl = typeof value === 'string' && value.length > 0;

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 500 }}>
        {label}
      </Typography>

      <DropZone
        isDragActive={dragActive}
        hasImage={!!value}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleClick}
        sx={{ 
          opacity: disabled ? 0.6 : 1,
          cursor: disabled ? 'default' : 'pointer'
        }}
      >
        <HiddenInput
          ref={fileInputRef}
          type="file"
          accept={acceptedFormats.join(',')}
          onChange={handleFileSelect}
          disabled={disabled}
        />

        {previewUrl ? (
          // Show uploaded/preview image
          <Box sx={{ position: 'relative' }}>
            <Box
              component="img"
              src={previewUrl}
              alt="Preview"
              sx={{
                width: '100%',
                maxWidth: 200,
                height: 150,
                objectFit: 'cover',
                borderRadius: 1,
                mb: 1
              }}
              onError={() => setError('Không thể hiển thị ảnh')}
            />
            
            {!disabled && (
              <IconButton
                size="small"
                sx={{
                  position: 'absolute',
                  top: -8,
                  right: -8,
                  bgcolor: 'error.main',
                  color: 'white',
                  '&:hover': { bgcolor: 'error.dark' }
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveImage();
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            )}

            {/* Status indicator */}
            <Box display="flex" alignItems="center" justifyContent="center" gap={0.5} sx={{ mb: 1 }}>
              {isLocalFile && (
                <>
                  <PhotoCameraIcon fontSize="small" color="warning" />
                  <Typography variant="caption" color="warning.main" fontWeight="medium">
                    Ảnh mới (chưa lưu)
                  </Typography>
                </>
              )}
              {isExistingUrl && (
                <>
                  <CloudUploadIcon fontSize="small" color="success" />
                  <Typography variant="caption" color="success.main" fontWeight="medium">
                    Đã lưu trên cloud
                  </Typography>
                </>
              )}
            </Box>

            <Typography variant="body2" color="text.secondary">
              Click để thay đổi ảnh
            </Typography>
          </Box>
        ) : uploading ? (
          // Show loading state
          <Box>
            <CircularProgress size={40} sx={{ mb: 2 }} />
            <Typography variant="body1" color="text.secondary">
              Đang upload ảnh...
            </Typography>
          </Box>
        ) : (
          // Show upload area
          <Box>
            <PhotoCameraIcon sx={{ fontSize: 48, color: 'grey.400', mb: 1 }} />
            <Typography variant="h6" sx={{ mb: 1 }}>
              Kéo thả ảnh vào đây
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              hoặc click để chọn file
            </Typography>
            <Box display="flex" gap={1} justifyContent="center">
              <Button
                variant="contained"
                startIcon={<PhotoCameraIcon />}
                disabled={disabled}
                size="small"
              >
                Chọn ảnh
              </Button>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Hỗ trợ: JPG, PNG, GIF, WebP (tối đa {Math.round(maxSize / 1024 / 1024)}MB)
            </Typography>
            {uploadMode === 'preview' && (
              <Typography variant="caption" color="warning.main" sx={{ mt: 0.5, display: 'block', fontWeight: 'medium' }}>
                📌 Ảnh sẽ được lưu khi bạn ấn "Thêm" hoặc "Cập nhật"
              </Typography>
            )}
          </Box>
        )}
      </DropZone>

      {error && (
        <Alert severity="error" sx={{ mt: 1 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
    </Box>
  );
};

export default DirectImageUpload; 