import {
    Add as AddIcon,
    Pets as PetsIcon
} from '@mui/icons-material';
import {
    Alert,
    Autocomplete,
    Avatar,
    Box,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    MenuItem,
    Paper,
    TextField,
    Typography
} from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';
import { DataTable, DirectImageUpload, PageTemplate, SearchFilterBar } from '../components';
import { useToast } from '../components/ToastProvider';
import { cloudinaryService, customerService, petService } from '../services';

const PetsPage = () => {
  const [pets, setPets] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPet, setSelectedPet] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState('view'); // 'view', 'edit', 'create'
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);

  // Toast hook
  const toast = useToast();

  // Form state
  const [formData, setFormData] = useState({
    customerId: '',
    name: '',
    species: '',
    breed: '',
    gender: '',
    birthDate: '',
    weight: '',
    color: '',
    imageUrl: '',
    notes: ''
  });
  const [formErrors, setFormErrors] = useState({});
  
  // Image upload tracking
  const [pendingImageFile, setPendingImageFile] = useState(null); // File chờ upload
  const [originalImageUrl, setOriginalImageUrl] = useState(''); // URL gốc để cleanup

  useEffect(() => {
    fetchData();
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Starting to fetch pets and customers data...');
      
      // Fetch pets and customers in parallel
      const [petsResult, customersResult] = await Promise.allSettled([
        petService.getAllPets(),
        customerService.getCustomersForPetManagement()
      ]);
      
      console.log('📊 Pets fetch result:', petsResult);
      console.log('📊 Customers fetch result:', customersResult);
      
      // Process pets data
      let pets = [];
      if (petsResult.status === 'fulfilled') {
        pets = Array.isArray(petsResult.value) ? petsResult.value : [];
        console.log('✅ Pets loaded successfully:', pets.length, 'pets');
      } else {
        console.error('❌ Failed to load pets:', petsResult.reason);
        toast.showError('Không thể tải danh sách thú cưng');
      }
      
      // Process customers data  
      let customers = [];
      if (customersResult.status === 'fulfilled') {
        const customersData = customersResult.value;
        console.log('📋 Raw customers data:', customersData);
        
        if (customersData && customersData.customers && Array.isArray(customersData.customers)) {
          customers = customersData.customers;
          console.log('✅ Customers loaded successfully:', customers.length, 'customers');
          console.log('📋 First customer sample:', customers[0]);
        } else {
          console.warn('⚠️ Unexpected customer data structure:', customersData);
        }
      } else {
        console.error('❌ Failed to load customers:', customersResult.reason);
        const errorMsg = customersResult.reason?.message || 'Unknown error';
        toast.showError(`Không thể tải danh sách khách hàng: ${errorMsg}`);
      }
      
      // Update state
      setPets(pets);
      setCustomers(customers);
      
      console.log('🎯 Final state update:');
      console.log('   - Pets count:', pets.length);
      console.log('   - Customers count:', customers.length);
      console.log('   - Customers in state:', customers);
      
    } catch (error) {
      console.error('💥 Critical error in fetchData:', error);
      toast.showError('Đã xảy ra lỗi nghiêm trọng khi tải dữ liệu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // Debounced search function
  const performSearch = useCallback(async (searchValue) => {
    try {
      setLoading(true);
      console.log('Performing search with value:', searchValue);
      
      let data;
      if (searchValue.trim()) {
        data = await petService.searchPets(searchValue);
        console.log('Search results:', data);
      } else {
        data = await petService.getAllPets();
        console.log('Get all pets results:', data);
      }
      
      console.log('Search data (should be array):', data, 'isArray:', Array.isArray(data));
      setPets(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error searching pets:', error);
      toast.showError('Không thể tìm kiếm thú cưng. Vui lòng thử lại.');
      setPets([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const handleSearch = (searchValue) => {
    console.log('handleSearch called with:', searchValue);
    setSearchTerm(searchValue);
    
    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    // Set new timeout for debounced search
    const timeout = setTimeout(() => {
      performSearch(searchValue);
    }, 500); // 500ms delay
    
    setSearchTimeout(timeout);
  };

  const openDialog = (mode, pet = null) => {
    setDialogMode(mode);
    setSelectedPet(pet);
    
    if (mode === 'create') {
      setFormData({
        customerId: '',
        name: '',
        species: '',
        breed: '',
        birthDate: '',
        imageUrl: '',
        gender: ''
      });
      setOriginalImageUrl('');
      setPendingImageFile(null);
    } else if (pet) {
      console.log('🐾 Opening edit dialog for pet:', pet);
      
      const currentImageUrl = pet.ImageUrl || pet.imageUrl || '';
      setFormData({
        customerId: pet.CustomerId || pet.customerId || '',
        name: pet.Name || pet.name || '',
        species: pet.Species || pet.species || '',
        breed: pet.Breed || pet.breed || '',
        birthDate: petService.formatBirthDateForInput(pet.BirthDate || pet.birthDate),
        imageUrl: currentImageUrl,
        gender: pet.Gender || pet.gender || ''
      });
      setOriginalImageUrl(currentImageUrl);
      setPendingImageFile(null);
    }
    
    setFormErrors({});
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setSelectedPet(null);
    setFormData({
      customerId: '',
      name: '',
      species: '',
      breed: '',
      birthDate: '',
      imageUrl: '',
      gender: ''
    });
    setFormErrors({});
    
    // Cleanup image states
    setPendingImageFile(null);
    setOriginalImageUrl('');
  };

  const handleFormChange = (field, value) => {
    if (field === 'imageUrl') {
      // Handle image changes
      if (value instanceof File) {
        // New file selected
        setPendingImageFile(value);
        setFormData(prev => ({
          ...prev,
          [field]: value
        }));
      } else {
        // URL string or empty
        setPendingImageFile(null);
        setFormData(prev => ({
          ...prev,
          [field]: value
        }));
      }
    } else {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    }
    
    // Clear error for this field
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.customerId) {
      errors.customerId = 'Khách hàng là bắt buộc';
    }
    
    if (!formData.name.trim()) {
      errors.name = 'Tên thú cưng là bắt buộc';
    }
    
    if (!formData.species.trim()) {
      errors.species = 'Loài là bắt buộc';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreatePet = async () => {
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      
      let imageUrl = formData.imageUrl;
      
      // Upload image if there's a pending file
      if (pendingImageFile) {
        console.log('Uploading image before creating pet...');
        try {
          const uploadResult = await cloudinaryService.uploadFile(pendingImageFile);
          imageUrl = uploadResult.secure_url;
          console.log('Image uploaded successfully:', imageUrl);
          toast.showSuccess('Đã upload ảnh thành công!');
        } catch (uploadError) {
          console.error('Image upload failed:', uploadError);
          toast.showError('Upload ảnh thất bại: ' + uploadError.message);
          setLoading(false);
          return; // Stop if image upload fails
        }
      }
      
      const petData = {
        customerId: formData.customerId,
        name: formData.name,
        species: formData.species,
        breed: formData.breed,
        birthDate: formData.birthDate || null,
        imageUrl: imageUrl || null,
        gender: formData.gender || null
      };
      
      console.log('Attempting to create pet with data:', petData);
      
      await petService.createPet(petData);
      await fetchData();
      closeDialog();
      
      // Show success toast
      toast.showSuccess(`Đã thêm thú cưng "${formData.name}" thành công!`);
      
    } catch (error) {
      console.error('Error creating pet:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      // Show error toast with specific message
      let errorMessage = 'Không thể thêm thú cưng. ';
      if (error.message.includes('401')) {
        errorMessage += 'Phiên đăng nhập đã hết hạn.';
      } else if (error.message.includes('403')) {
        errorMessage += 'Bạn không có quyền thực hiện chức năng này.';
      } else if (error.message.includes('400')) {
        errorMessage += 'Dữ liệu không hợp lệ: ' + error.message;
      } else if (error.message.includes('500')) {
        errorMessage += 'Lỗi máy chủ. Vui lòng thử lại sau.';
      } else {
        errorMessage += 'Vui lòng thử lại. Lỗi: ' + error.message;
      }
      
      toast.showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePet = async () => {
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      
      let imageUrl = formData.imageUrl;
      
      // Upload image if there's a pending file
      if (pendingImageFile) {
        console.log('Uploading new image before updating pet...');
        try {
          const uploadResult = await cloudinaryService.uploadFile(pendingImageFile);
          imageUrl = uploadResult.secure_url;
          console.log('Image uploaded successfully:', imageUrl);
          toast.showSuccess('Đã upload ảnh mới thành công!');
        } catch (uploadError) {
          console.error('Image upload failed:', uploadError);
          toast.showError('Upload ảnh thất bại: ' + uploadError.message);
          setLoading(false);
          return; // Stop if image upload fails
        }
      }
      
      const petData = {
        name: formData.name,
        species: formData.species,
        breed: formData.breed,
        birthDate: formData.birthDate || null,
        imageUrl: imageUrl || null,
        gender: formData.gender || null
      };
      
      console.log('Attempting to update pet with data:', petData);
      console.log('Pet ID:', selectedPet.PetId || selectedPet.petId);
      
      await petService.updatePet(selectedPet.PetId || selectedPet.petId, petData);
      await fetchData();
      closeDialog();
      
      // Show success toast
      toast.showSuccess(`Đã cập nhật thông tin thú cưng "${formData.name}" thành công!`);
      
    } catch (error) {
      console.error('Error updating pet:', error);
      toast.showError('Không thể cập nhật thú cưng. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePet = async (petId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa thú cưng này?')) return;
    
    try {
      // Find pet name for success message
      const pet = pets.find(p => (p.PetId || p.petId) === petId);
      const petName = pet ? (pet.Name || pet.name) : 'thú cưng';
      
      await petService.deletePet(petId);
      await fetchData();
      
      // Show success toast
      toast.showSuccess(`Đã xóa ${petName} thành công!`);
      
    } catch (error) {
      console.error('Error deleting pet:', error);
      toast.showError('Không thể xóa thú cưng. Vui lòng thử lại.');
    }
  };

  const getCustomerName = (customerId) => {
    console.log('🔍 Looking for customer with ID:', customerId);
    console.log('🔍 Available customers:', customers.length);
    console.log('🔍 Customers data:', customers);
    
    if (!customers || customers.length === 0) {
      console.log('⚠️ No customers available');
      return 'Đang tải...';
    }
    
    const customer = customers.find(c => {
      // Try multiple field name variations for compatibility
      const id1 = c.CustomerId;
      const id2 = c.customerId;
      const id3 = c.customerID;
      
      const match = id1 === customerId || id2 === customerId || id3 === customerId;
      
      if (match) {
        console.log('✅ Found matching customer:', c);
      }
      
      return match;
    });
    
    if (customer) {
      // Try multiple name field variations
      const name = customer.CustomerName || 
      customer.customerName || 
      customer.fullName || 
                   customer.Username ||
      customer.username || 
                   `Customer ${customer.CustomerId || customer.customerId}`;
      
      console.log('✅ Customer name found:', name);
      return name;
    } else {
      console.log('❌ Customer not found for ID:', customerId);
      console.log('🔍 Available customer IDs:', customers.map(c => c.CustomerId || c.customerId));
      return 'Không tìm thấy';
    }
  };

  const getSpeciesChip = (species) => {
    const colorMap = {
      'Chó': 'primary',
      'Mèo': 'secondary',
      'Chim': 'info',
      'Thỏ': 'warning',
      'Hamster': 'success'
    };
    
    return (
      <Chip 
        label={species || 'Không xác định'} 
        color={colorMap[species] || 'default'} 
        size="small"
      />
    );
  };

  const columns = [
    {
      field: 'avatar',
      label: '',
      minWidth: 60,
      render: (row) => (
        <Avatar
          src={row.ImageUrl || row.imageUrl}
          sx={{ width: 40, height: 40 }}
        >
          <PetsIcon />
        </Avatar>
      )
    },
    {
      field: 'name',
      label: 'Tên',
      minWidth: 120,
      render: (row) => row.Name || row.name || 'Chưa có tên'
    },
    {
      field: 'species',
      label: 'Loài',
      minWidth: 100,
      render: (row) => getSpeciesChip(row.Species || row.species)
    },
    {
      field: 'breed',
      label: 'Giống',
      minWidth: 120,
      render: (row) => row.Breed || row.breed || 'Không xác định'
    },
    {
      field: 'gender',
      label: 'Giới tính',
      minWidth: 80,
      render: (row) => row.Gender || row.gender || 'Chưa có'
    },
    {
      field: 'age',
      label: 'Tuổi',
      minWidth: 80,
      render: (row) => petService.calculateAge(row.BirthDate || row.birthDate)
    },
    {
      field: 'customerId',
      label: 'Chủ sở hữu',
      minWidth: 150,
      render: (row) => getCustomerName(row.CustomerId || row.customerId)
    }
  ];

  if (loading && pets.length === 0) {
    return (
      <PageTemplate title="Quản lý thú cưng" subtitle="Quản lý thông tin thú cưng trong hệ thống">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate title="Quản lý thú cưng" subtitle="Quản lý thông tin thú cưng trong hệ thống">
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6">
            Danh sách thú cưng ({Array.isArray(pets) ? pets.length : 0})
          </Typography>
          <Box display="flex" gap={2}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => openDialog('create')}
            >
              Thêm thú cưng
            </Button>
          </Box>
        </Box>

        <SearchFilterBar
          searchValue={searchTerm}
          onSearchChange={(e) => handleSearch(e.target.value)}
          searchPlaceholder="Tìm kiếm theo tên, loài, giống, chủ sở hữu..."
        />

        <DataTable
          columns={columns}
          data={Array.isArray(pets) ? pets : []}
          loading={loading}
          emptyMessage="Không có thú cưng nào"
          onView={(row) => openDialog('view', row)}
          onEdit={(row) => openDialog('edit', row)}
          onDelete={(row) => handleDeletePet(row.PetId || row.petId)}
        />
      </Paper>

      {/* Pet Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={closeDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {dialogMode === 'create' && 'Thêm thú cưng mới'}
          {dialogMode === 'edit' && 'Chỉnh sửa thú cưng'}
          {dialogMode === 'view' && 'Thông tin thú cưng'}
        </DialogTitle>
        
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            <Autocomplete
              options={customers}
              getOptionLabel={(customer) => {
                if (!customer) return '';
                
                // Backend trả về CustomerName từ bảng Customer và PhoneNumber từ bảng User
                const name = customer.CustomerName || customer.customerName || customer.Username || customer.username || `Customer ${customer.CustomerId}`;
                const phone = customer.PhoneNumber || customer.phoneNumber || '';
                
                return phone ? `${name} - ${phone}` : name;
              }}
              value={customers.find(c => 
                (c.CustomerId || c.customerId) === formData.customerId
              ) || null}
              onChange={(event, newValue) => {
                const customerId = newValue ? (newValue.CustomerId || newValue.customerId) : '';
                console.log('Selected customer:', newValue, 'CustomerId:', customerId);
                handleFormChange('customerId', customerId);
              }}
              disabled={dialogMode === 'view'}
              loading={loading && customers.length === 0}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Chủ sở hữu"
                  error={!!formErrors.customerId}
                  helperText={formErrors.customerId || (customers.length === 0 ? 'Đang tải danh sách khách hàng...' : 'Gõ để tìm kiếm hoặc chọn từ danh sách')}
                  fullWidth
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
                    <Typography variant="body2" color="text.secondary">
                      📞 {customer.PhoneNumber || customer.phoneNumber || 'Chưa có SĐT'} • ✉️ {customer.Email || customer.email || 'Chưa có email'}
                      {customer.Address && ` • 🏠 ${customer.Address}`}
                    </Typography>
                  </Box>
                </Box>
              )}
              noOptionsText="Không tìm thấy khách hàng nào"
              loadingText="Đang tải danh sách khách hàng..."
              clearText="Xóa lựa chọn"
              openText="Mở danh sách"
              closeText="Đóng danh sách"
              filterOptions={(options, { inputValue }) => {
                if (!inputValue) return options;
                
                const searchTerm = inputValue.toLowerCase();
                return options.filter(customer => {
                  const name = (customer.CustomerName || customer.customerName || customer.Username || customer.username || '').toLowerCase();
                  const phone = (customer.PhoneNumber || customer.phoneNumber || '').toLowerCase();
                  const email = (customer.Email || customer.email || '').toLowerCase();
                  const address = (customer.Address || customer.address || '').toLowerCase();
                  
                  return name.includes(searchTerm) || 
                         phone.includes(searchTerm) || 
                         email.includes(searchTerm) ||
                         address.includes(searchTerm);
                });
              }}
              isOptionEqualToValue={(option, value) => {
                return (option.CustomerId || option.customerId) === (value.CustomerId || value.customerId);
              }}
            />
            
            <Box display="flex" gap={2}>
              <TextField
                label="Tên thú cưng"
                value={formData.name}
                onChange={(e) => handleFormChange('name', e.target.value)}
                error={!!formErrors.name}
                helperText={formErrors.name}
                disabled={dialogMode === 'view'}
                fullWidth
              />
              
              <TextField
                label="Loài"
                select
                value={formData.species}
                onChange={(e) => handleFormChange('species', e.target.value)}
                error={!!formErrors.species}
                helperText={formErrors.species}
                disabled={dialogMode === 'view'}
                fullWidth
              >
                {petService.getSpeciesOptions().map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
            
            <Box display="flex" gap={2}>
              <TextField
                label="Giống"
                value={formData.breed}
                onChange={(e) => handleFormChange('breed', e.target.value)}
                disabled={dialogMode === 'view'}
                fullWidth
              />
              
              <TextField
                label="Giới tính"
                select
                value={formData.gender}
                onChange={(e) => handleFormChange('gender', e.target.value)}
                disabled={dialogMode === 'view'}
                fullWidth
              >
                {petService.getGenderOptions().map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
            
            <TextField
              label="Ngày sinh"
              type="date"
              value={formData.birthDate}
              onChange={(e) => handleFormChange('birthDate', e.target.value)}
              disabled={dialogMode === 'view'}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            
            <DirectImageUpload
              label="Ảnh thú cưng"
              value={formData.imageUrl}
              onChange={(value) => handleFormChange('imageUrl', value)}
              disabled={dialogMode === 'view'}
              uploadMode="preview"
            />
          </Box>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={closeDialog} disabled={loading}>
            {dialogMode === 'view' ? 'Đóng' : 'Hủy'}
          </Button>
          {dialogMode === 'create' && (
            <Button 
              variant="contained" 
              onClick={handleCreatePet}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              {loading ? 'Đang thêm...' : 'Thêm'}
            </Button>
          )}
          {dialogMode === 'edit' && (
            <Button 
              variant="contained" 
              onClick={handleUpdatePet}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              {loading ? 'Đang cập nhật...' : 'Cập nhật'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </PageTemplate>
  );
};

export default PetsPage; 