import {
    Add as AddIcon,
    CalendarToday as CalendarIcon,
    Person as PersonIcon,
    Pets as PetsIcon
} from '@mui/icons-material';
import {
    Alert,
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
    Tab,
    Tabs,
    TextField,
    Typography
} from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';
import DataTable from '../components/DataTable';
import PageTemplate from '../components/PageTemplate';
import SearchFilterBar from '../components/SearchFilterBar';
import { useToast } from '../components/ToastProvider';
import { appointmentService, petService, userService } from '../services';

const CustomersPage = () => {
  const [customers, setCustomers] = useState([]);
  const [pets, setPets] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState('view'); // 'view', 'edit', 'create'
  const [selectedTab, setSelectedTab] = useState(0);
  const [searchTimeout, setSearchTimeout] = useState(null);

  // Toast hook
  const toast = useToast();

  // Form state
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phoneNumber: '',
    customerName: '',
    address: '',
    gender: 0,
    role: 0,
    password: ''
  });
  const [formErrors, setFormErrors] = useState({});

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

  // Get all users (not just customers)
  const getCustomers = async () => {
    try {
      const users = await userService.getAllUsers();
      return Array.isArray(users) ? users : [];
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [customersData, petsData, appointmentsData] = await Promise.allSettled([
        getCustomers(),
        petService.getAllPets(),
        appointmentService.getAllAppointments()
      ]);
      
      setCustomers(customersData.status === 'fulfilled' ? customersData.value : []);
      setPets(petsData.status === 'fulfilled' ? petsData.value : []);
      setAppointments(appointmentsData.status === 'fulfilled' ? appointmentsData.value : []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.showError('Không thể tải dữ liệu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
      setHasLoaded(true);
    }
  };

  // Debounced search function
  const performSearch = useCallback(async (searchValue) => {
    try {
      setLoading(true);
      console.log('Performing search with value:', searchValue);
      
      if (searchValue.trim()) {
        const users = await userService.searchUsers(searchValue);
        console.log('Search results:', users);
        setCustomers(Array.isArray(users) ? users : []);
      } else {
        const customersData = await getCustomers();
        setCustomers(customersData);
      }
    } catch (error) {
      console.error('Error searching users:', error);
      toast.showError('Không thể tìm kiếm người dùng. Vui lòng thử lại.');
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

  const openDialog = (mode, customer = null) => {
    setDialogMode(mode);
    setSelectedCustomer(customer);
    setSelectedTab(0); // Reset to first tab
    
    if (mode === 'create') {
      setFormData({
        username: '',
        email: '',
        phoneNumber: '',
        customerName: '',
        address: '',
        gender: 0,
        role: 0,
        password: ''
      });
    } else if (customer) {
      setFormData({
        username: customer.username || '',
        email: customer.email || '',
        phoneNumber: customer.phoneNumber || '',
        customerName: customer.customerName || customer.fullName || '',
        address: customer.address || '',
        gender: customer.gender || 0,
        role: customer.role || 0,
        password: ''
      });
    }
    
    setFormErrors({});
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setSelectedCustomer(null);
    setFormData({
      username: '',
      email: '',
      phoneNumber: '',
      customerName: '',
      address: '',
      gender: 0,
      role: 0,
      password: ''
    });
    setFormErrors({});
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
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
    
    if (!formData.username.trim()) {
      errors.username = 'Tên đăng nhập là bắt buộc';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email là bắt buộc';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email không hợp lệ';
    }
    
    if (!formData.phoneNumber.trim()) {
      errors.phoneNumber = 'Số điện thoại là bắt buộc';
    }
    
    if (!formData.customerName.trim()) {
      errors.customerName = 'Tên khách hàng là bắt buộc';
    }
    
    if (dialogMode === 'create' && !formData.password.trim()) {
      errors.password = 'Mật khẩu là bắt buộc';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateCustomer = async () => {
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      const customerData = {
        ...formData
      };
      await userService.createUser(customerData);
      
      closeDialog();
      fetchData(); // Refresh data
      
      // Show success toast
      toast.showSuccess(`Đã tạo người dùng "${formData.customerName}" thành công!`);
      
    } catch (error) {
      console.error('Error creating customer:', error);
      toast.showError('Không thể tạo khách hàng. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCustomer = async () => {
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      const updateData = {
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        customerName: formData.customerName,
        address: formData.address,
        gender: formData.gender,
        role: formData.role
      };
      
      await userService.updateUser(selectedCustomer.userId, updateData);
      
      closeDialog();
      fetchData(); // Refresh data
      
      // Show success toast
      toast.showSuccess(`Đã cập nhật thông tin "${formData.customerName}" thành công!`);
      
    } catch (error) {
      console.error('Error updating customer:', error);
      toast.showError('Không thể cập nhật khách hàng. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCustomer = async (customerId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa người dùng này?')) return;
    
    try {
      setLoading(true);
      
      // Find customer name for success message
      const customer = customers.find(c => c.userId === customerId);
      const customerName = customer ? (customer.customerName || customer.fullName || 'người dùng') : 'người dùng';
      
      await userService.deleteUser(customerId);
      fetchData(); // Refresh data
      
      // Show success toast
      toast.showSuccess(`Đã xóa ${customerName} thành công!`);
      
    } catch (error) {
      console.error('Error deleting customer:', error);
      toast.showError('Không thể xóa người dùng. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const getCustomerPets = (userId) => {
    return pets.filter(pet => pet.userId === userId);
  };

  const getCustomerAppointments = (userId) => {
    const customerPets = getCustomerPets(userId);
    const petIds = customerPets.map(pet => pet.petId);
    return appointments.filter(appointment => petIds.includes(appointment.petId));
  };

  const getGenderChip = (gender) => {
    return (
      <Chip 
        label={gender === 0 ? 'Nam' : 'Nữ'} 
        size="small" 
        color={gender === 0 ? 'primary' : 'secondary'}
      />
    );
  };

  const formatPhoneNumber = (phone) => {
    if (!phone) return 'Chưa có';
    return phone.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3');
  };

  const getCustomerActivity = (customer) => {
    const customerPets = getCustomerPets(customer.userId);
    const customerAppointments = getCustomerAppointments(customer.userId);
    
    return {
      totalPets: customerPets.length,
      totalAppointments: customerAppointments.length,
      completedAppointments: customerAppointments.filter(apt => apt.status === 2).length,
      lastAppointment: customerAppointments.length > 0 ? 
        Math.max(...customerAppointments.map(apt => new Date(apt.appointmentDate))) : null,
      joinDate: customer.createdAt ? new Date(customer.createdAt).toLocaleDateString('vi-VN') : 'Chưa có'
    };
  };

  const columns = [
    {
      field: 'userId',
      label: 'ID',
      minWidth: 70,
      render: (row) => row.userId
    },
    {
      field: 'customerName',
      label: 'Tên khách hàng',
      minWidth: 150,
      render: (row) => row.customerName || row.fullName || 'Chưa có'
    },
    {
      field: 'username',
      label: 'Tên đăng nhập',
      minWidth: 120,
      render: (row) => row.username || 'Chưa có'
    },
    {
      field: 'email',
      label: 'Email',
      minWidth: 180,
      render: (row) => row.email || 'Chưa có'
    },
    {
      field: 'phoneNumber',
      label: 'Số điện thoại',
      minWidth: 130,
      render: (row) => formatPhoneNumber(row.phoneNumber)
    },
    {
      field: 'gender',
      label: 'Giới tính',
      minWidth: 100,
      render: (row) => getGenderChip(row.gender)
    },
    {
      field: 'role',
      label: 'Quyền hạn',
      minWidth: 120,
      render: (row) => (
        <Chip 
          label={
            row.role === 0 ? 'Khách hàng' :
            row.role === 1 ? 'Quản trị viên' :
            row.role === 2 ? 'Bác sĩ' : 'Không xác định'
          }
          color={
            row.role === 0 ? 'default' :
            row.role === 1 ? 'error' :
            row.role === 2 ? 'primary' : 'default'
          }
          size="small"
        />
      )
    },
    {
      field: 'address',
      label: 'Địa chỉ',
      minWidth: 200,
      render: (row) => row.address || 'Chưa có'
    },
    {
      field: 'activity',
      label: 'Hoạt động',
      minWidth: 120,
      render: (row) => {
        const activity = getCustomerActivity(row);
        return (
          <Box>
            <Typography variant="caption" display="block">
              {activity.totalPets} thú cưng
            </Typography>
            <Typography variant="caption" display="block">
              {activity.totalAppointments} lịch hẹn
          </Typography>
        </Box>
        );
      }
    }
  ];

  const CustomerDetailTabs = () => {
    if (!selectedCustomer) return null;
    
    const activity = getCustomerActivity(selectedCustomer);
    const customerPets = getCustomerPets(selectedCustomer.userId);
    const customerAppointments = getCustomerAppointments(selectedCustomer.userId);

    return (
      <Box sx={{ width: '100%' }}>
        <Tabs value={selectedTab} onChange={(e, newValue) => setSelectedTab(newValue)}>
          <Tab label="Thông tin cơ bản" />
          <Tab label={`Thú cưng (${customerPets.length})`} />
          <Tab label={`Lịch hẹn (${customerAppointments.length})`} />
        </Tabs>

        {/* Tab 0: Basic Info */}
        {selectedTab === 0 && (
          <Box sx={{ p: 3 }}>
            <Box display="flex" gap={3}>
              <Avatar sx={{ width: 80, height: 80, bgcolor: 'primary.main' }}>
                <PersonIcon sx={{ fontSize: 40 }} />
              </Avatar>
              
              <Box flex={1}>
                <Typography variant="h6" gutterBottom>
                  {selectedCustomer.customerName || selectedCustomer.fullName || 'Chưa có tên'}
                </Typography>
                
                <Box display="flex" flexDirection="column" gap={1}>
                  <Typography variant="body2">
                    <strong>Tên đăng nhập:</strong> {selectedCustomer.username || 'Chưa có'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Email:</strong> {selectedCustomer.email || 'Chưa có'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Số điện thoại:</strong> {formatPhoneNumber(selectedCustomer.phoneNumber)}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Giới tính:</strong> {getGenderChip(selectedCustomer.gender)}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Quyền hạn:</strong> 
                    <Chip 
                      label={
                        selectedCustomer.role === 0 ? 'Khách hàng' :
                        selectedCustomer.role === 1 ? 'Quản trị viên' :
                        selectedCustomer.role === 2 ? 'Bác sĩ' : 'Không xác định'
                      }
                      color={
                        selectedCustomer.role === 0 ? 'default' :
                        selectedCustomer.role === 1 ? 'error' :
                        selectedCustomer.role === 2 ? 'primary' : 'default'
                      }
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  </Typography>
                  <Typography variant="body2">
                    <strong>Địa chỉ:</strong> {selectedCustomer.address || 'Chưa có'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Ngày tham gia:</strong> {activity.joinDate}
                  </Typography>
                </Box>
              </Box>
              
              <Box textAlign="center">
                <Typography variant="h4" color="primary">
                  {activity.totalPets}
                </Typography>
                <Typography variant="caption">Thú cưng</Typography>
              </Box>
              
              <Box textAlign="center">
                <Typography variant="h4" color="secondary">
                  {activity.totalAppointments}
                </Typography>
                <Typography variant="caption">Lịch hẹn</Typography>
              </Box>
            </Box>
          </Box>
        )}

        {/* Tab 1: Pets */}
        {selectedTab === 1 && (
          <Box sx={{ p: 3 }}>
            {customerPets.length === 0 ? (
              <Typography color="text.secondary" textAlign="center" py={4}>
                Khách hàng chưa có thú cưng nào
              </Typography>
            ) : (
              <Box display="flex" flexDirection="column" gap={2}>
                {customerPets.map((pet) => (
                  <Paper key={pet.petId} sx={{ p: 2 }}>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Avatar sx={{ bgcolor: 'secondary.main' }}>
                        <PetsIcon />
                      </Avatar>
                      
                      <Box flex={1}>
                        <Typography variant="subtitle1">
                          {pet.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {pet.species} • {pet.breed} • {pet.age || 'Chưa xác định'} tuổi
                        </Typography>
                      </Box>
                      
                      <Chip 
                        label={pet.gender === 0 ? 'Đực' : 'Cái'} 
                        size="small" 
                        color={pet.gender === 0 ? 'primary' : 'secondary'}
                      />
                    </Box>
                  </Paper>
                ))}
              </Box>
            )}
          </Box>
        )}

        {/* Tab 2: Appointments */}
        {selectedTab === 2 && (
          <Box sx={{ p: 3 }}>
            {customerAppointments.length === 0 ? (
              <Typography color="text.secondary" textAlign="center" py={4}>
                Khách hàng chưa có lịch hẹn nào
              </Typography>
            ) : (
              <Box display="flex" flexDirection="column" gap={2}>
                {customerAppointments.map((appointment) => (
                  <Paper key={appointment.appointmentId} sx={{ p: 2 }}>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Avatar sx={{ bgcolor: 'warning.main' }}>
                        <CalendarIcon />
                      </Avatar>
                      
                      <Box flex={1}>
                        <Typography variant="subtitle1">
                          {new Date(appointment.appointmentDate).toLocaleDateString('vi-VN')} 
                          {' - '} 
                          {appointment.timeSlot}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {appointment.reason || 'Khám tổng quát'}
                        </Typography>
                      </Box>
                      
                      <Chip 
                        label={
                          appointment.status === 0 ? 'Chờ xác nhận' :
                          appointment.status === 1 ? 'Đã xác nhận' :
                          appointment.status === 2 ? 'Hoàn thành' : 'Đã hủy'
                        }
                        color={
                          appointment.status === 0 ? 'warning' :
                          appointment.status === 1 ? 'info' :
                          appointment.status === 2 ? 'success' : 'error'
                        }
                        size="small"
                      />
                    </Box>
                  </Paper>
                ))}
              </Box>
            )}
          </Box>
        )}
      </Box>
    );
  };

  if (!hasLoaded && loading) {
    return (
      <PageTemplate title="Quản lý người dùng" subtitle="Quản lý thông tin người dùng và hoạt động">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate title="Quản lý người dùng" subtitle="Quản lý thông tin người dùng và hoạt động">
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6">
            Danh sách người dùng ({customers.length})
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => openDialog('create')}
          >
            Thêm người dùng
          </Button>
        </Box>

        <SearchFilterBar
          searchValue={searchTerm}
          onSearchChange={(e) => handleSearch(e.target.value)}
          searchPlaceholder="Tìm kiếm theo tên, email, số điện thoại..."
        />

        <DataTable
          columns={columns}
          data={customers}
          loading={loading}
          emptyMessage="Không có người dùng nào"
          onView={(row) => openDialog('view', row)}
          onEdit={(row) => openDialog('edit', row)}
          onDelete={(row) => handleDeleteCustomer(row.userId)}
        />
      </Paper>

      {/* Customer Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={closeDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {dialogMode === 'create' && 'Thêm người dùng mới'}
          {dialogMode === 'edit' && 'Chỉnh sửa người dùng'}
          {dialogMode === 'view' && 'Thông tin người dùng'}
        </DialogTitle>
        
        <DialogContent>
          {dialogMode === 'view' ? (
            <CustomerDetailTabs />
          ) : (
            <Box display="flex" flexDirection="column" gap={2} pt={1}>
              <TextField
                label="Tên đăng nhập"
                value={formData.username}
                onChange={(e) => handleFormChange('username', e.target.value)}
                error={!!formErrors.username}
                helperText={formErrors.username}
                disabled={dialogMode === 'edit'}
                fullWidth
              />
              
              <TextField
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => handleFormChange('email', e.target.value)}
                error={!!formErrors.email}
                helperText={formErrors.email}
                fullWidth
              />
              
          <TextField
                label="Số điện thoại"
                value={formData.phoneNumber}
                onChange={(e) => handleFormChange('phoneNumber', e.target.value)}
                error={!!formErrors.phoneNumber}
                helperText={formErrors.phoneNumber}
            fullWidth
              />
              
              <TextField
                label="Họ và tên"
            value={formData.customerName}
                onChange={(e) => handleFormChange('customerName', e.target.value)}
                error={!!formErrors.customerName}
                helperText={formErrors.customerName}
                fullWidth
              />
              
          <TextField
                label="Địa chỉ"
                value={formData.address}
                onChange={(e) => handleFormChange('address', e.target.value)}
            fullWidth
                multiline
                rows={2}
              />
              
                        <TextField
                label="Giới tính"
                select
                value={formData.gender}
                onChange={(e) => handleFormChange('gender', parseInt(e.target.value))}
            fullWidth
              >
                <MenuItem value={0}>Nam</MenuItem>
                <MenuItem value={1}>Nữ</MenuItem>
              </TextField>
              
              <TextField
                label="Quyền hạn"
                select
                value={formData.role}
                onChange={(e) => handleFormChange('role', parseInt(e.target.value))}
                fullWidth
              >
                <MenuItem value={0}>Khách hàng</MenuItem>
                <MenuItem value={1}>Quản trị viên</MenuItem>
                <MenuItem value={2}>Bác sĩ</MenuItem>
              </TextField>
              
              {dialogMode === 'create' && (
          <TextField
                  label="Mật khẩu"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleFormChange('password', e.target.value)}
                  error={!!formErrors.password}
                  helperText={formErrors.password}
            fullWidth
                />
              )}
    </Box>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={closeDialog} disabled={loading}>
            {dialogMode === 'view' ? 'Đóng' : 'Hủy'}
          </Button>
          {dialogMode === 'create' && (
            <Button 
              variant="contained" 
              onClick={handleCreateCustomer}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              {loading ? 'Đang thêm...' : 'Thêm người dùng'}
            </Button>
          )}
          {dialogMode === 'edit' && (
            <Button 
              variant="contained" 
              onClick={handleUpdateCustomer}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              {loading ? 'Đang cập nhật...' : 'Cập nhật người dùng'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </PageTemplate>
  );
};

export default CustomersPage; 