import {
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
  Typography
} from '@mui/material';
import React from 'react';
import DirectImageUpload from '../DirectImageUpload';
import {
  PET_DIALOG_MODES,
  PET_GENDERS,
  PET_SPECIES_OPTIONS
} from './petConstants';
import { formatCustomerDisplay } from './petUtils';

const PetDialog = ({
  open,
  onClose,
  dialogMode,
  formData,
  formErrors,
  onFormChange,
  onCreate,
  onUpdate,
  onImageUpload,
  onImageRemove,
  loading,
  imageUploading,
  customers,
  customerLoadState
}) => {
  const isViewMode = dialogMode === PET_DIALOG_MODES.VIEW;
  const isCreateMode = dialogMode === PET_DIALOG_MODES.CREATE;
  const isEditMode = dialogMode === PET_DIALOG_MODES.EDIT;

  const handleSubmit = () => {
    if (isCreateMode) {
      onCreate();
    } else if (isEditMode) {
      onUpdate();
    }
  };

  const getDialogTitle = () => {
    switch (dialogMode) {
      case PET_DIALOG_MODES.CREATE:
        return 'Thêm thú cưng mới';
      case PET_DIALOG_MODES.EDIT:
        return 'Chỉnh sửa thông tin thú cưng';
      case PET_DIALOG_MODES.VIEW:
        return 'Thông tin thú cưng';
      default:
        return '';
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        {getDialogTitle()}
      </DialogTitle>
      
      <DialogContent>
        <Box display="flex" flexDirection="column" gap={2} pt={1}>
          {/* Customer Selection */}
          <Autocomplete
            options={customers}
            getOptionLabel={(customer) => formatCustomerDisplay(customer)}
            value={customers.find(c => 
              (c.CustomerId || c.customerId) === formData.customerId
            ) || null}
            onChange={(event, newValue) => {
              const customerId = newValue ? (newValue.CustomerId || newValue.customerId) : '';
              onFormChange('customerId', customerId);
            }}
            disabled={isViewMode || isEditMode}
            loading={loading && customers.length === 0}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Chủ sở hữu"
                error={!!formErrors.customerId}
                helperText={formErrors.customerId || (customers.length === 0 ? 'Đang tải danh sách khách hàng...' : 'Gõ để tìm kiếm hoặc chọn từ danh sách')}
                fullWidth
                required
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loading && customers.length === 0 ? <CircularProgress color="inherit" size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
            renderOption={(props, customer) => (
              <Box component="li" {...props} key={customer.CustomerId || customer.customerId}>
                <Box sx={{ width: '100%' }}>
                  <Typography variant="body1" fontWeight="medium">
                    {customer.CustomerName || customer.customerName || customer.Username || customer.username || `Customer ${customer.CustomerId}`}
                  </Typography>
                  {(customer.PhoneNumber || customer.phoneNumber) && (
                    <Typography variant="body2" color="text.secondary">
                      {customer.PhoneNumber || customer.phoneNumber}
                    </Typography>
                  )}
                </Box>
              </Box>
            )}
          />

          {/* Pet Name */}
          <TextField
            label="Tên thú cưng"
            value={formData.name}
            onChange={(e) => onFormChange('name', e.target.value)}
            error={!!formErrors.name}
            helperText={formErrors.name}
            disabled={isViewMode}
            fullWidth
            required
          />

          {/* Species */}
          <TextField
            label="Loài"
            select
            value={formData.species}
            onChange={(e) => onFormChange('species', e.target.value)}
            error={!!formErrors.species}
            helperText={formErrors.species}
            disabled={isViewMode}
            fullWidth
            required
          >
            <MenuItem value="">Chọn loài</MenuItem>
            {PET_SPECIES_OPTIONS.map((species) => (
              <MenuItem key={species} value={species}>
                {species}
              </MenuItem>
            ))}
          </TextField>

          {/* Breed */}
          <TextField
            label="Giống"
            value={formData.breed}
            onChange={(e) => onFormChange('breed', e.target.value)}
            error={!!formErrors.breed}
            helperText={formErrors.breed}
            disabled={isViewMode}
            fullWidth
          />

          {/* Gender */}
          <TextField
            label="Giới tính"
            select
            value={formData.gender}
            onChange={(e) => onFormChange('gender', e.target.value)}
            error={!!formErrors.gender}
            helperText={formErrors.gender}
            disabled={isViewMode}
            fullWidth
          >
            <MenuItem value="">Chọn giới tính</MenuItem>
            <MenuItem value={PET_GENDERS.MALE}>{PET_GENDERS.MALE}</MenuItem>
            <MenuItem value={PET_GENDERS.FEMALE}>{PET_GENDERS.FEMALE}</MenuItem>
          </TextField>

          {/* Birth Date */}
          <TextField
            label="Ngày sinh"
            type="date"
            value={formData.birthDate}
            onChange={(e) => onFormChange('birthDate', e.target.value)}
            error={!!formErrors.birthDate}
            helperText={formErrors.birthDate}
            disabled={isViewMode}
            fullWidth
            InputLabelProps={{
              shrink: true,
            }}
            inputProps={{
              max: new Date().toISOString().split('T')[0] // Prevent future dates
            }}
            required
          />

          {/* Image Upload */}
          {!isViewMode && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Hình ảnh thú cưng
              </Typography>
              <DirectImageUpload
                currentImageUrl={formData.imageUrl}
                onImageUpload={onImageUpload}
                onImageRemove={onImageRemove}
                uploading={imageUploading}
                disabled={loading}
                accept="image/*"
                maxSize={5} // MB
              />
            </Box>
          )}

          {/* Image Display (View Mode) */}
          {isViewMode && formData.imageUrl && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Hình ảnh thú cưng
              </Typography>
              <Box
                component="img"
                src={formData.imageUrl}
                alt={formData.name}
                sx={{
                  width: '100%',
                  maxHeight: 300,
                  objectFit: 'cover',
                  borderRadius: 1,
                  border: '1px solid #ddd'
                }}
              />
            </Box>
          )}

          {/* Notes */}
          <TextField
            label="Ghi chú"
            multiline
            rows={3}
            value={formData.notes}
            onChange={(e) => onFormChange('notes', e.target.value)}
            error={!!formErrors.notes}
            helperText={formErrors.notes}
            disabled={isViewMode}
            fullWidth
            placeholder="Thêm ghi chú về thú cưng..."
          />
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} disabled={loading || imageUploading}>
          {isViewMode ? 'Đóng' : 'Hủy'}
        </Button>
        
        {!isViewMode && (
          <Button 
            variant="contained" 
            onClick={handleSubmit}
            disabled={loading || imageUploading}
            startIcon={(loading || imageUploading) ? <CircularProgress size={20} /> : null}
          >
            {(loading || imageUploading) ? (
              isCreateMode ? 'Đang thêm...' : 'Đang cập nhật...'
            ) : (
              isCreateMode ? 'Thêm thú cưng' : 'Cập nhật thú cưng'
            )}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default PetDialog; 