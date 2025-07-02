import {
  Add as AddIcon
} from '@mui/icons-material';
import {
  Alert,
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
import React, { useEffect, useState } from 'react';
import { DataTable, PageTemplate, SearchFilterBar } from '../components';
import { useToast } from '../components/ToastProvider';
import { appointmentService, customerService, doctorService, petService, serviceService } from '../services';

const AppointmentsPage = () => {
  const [appointments, setAppointments] = useState([]);
  const [pets, setPets] = useState([]);
  const [services, setServices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState('view'); // 'view', 'edit', 'create'
  const [statusFilter, setStatusFilter] = useState('all');

  // Toast hook
  const toast = useToast();

  // Form state
  const [formData, setFormData] = useState({
    petId: '',
    serviceId: '',
    doctorId: '',
    appointmentDate: '',
    appointmentTime: '',
    weight: '',
    age: '',
    isNewPet: false,
    notes: '',
    status: 0
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Starting to fetch appointments and related data...');
      
      const [appointmentsResult, petsResult, servicesResult, customersResult, doctorsResult] = await Promise.allSettled([
        appointmentService.getAllAppointments(),
        petService.getAllPets(),
        serviceService.getAllServices(),
        customerService.getCustomersForPetManagement(),
        doctorService.getAllDoctors()
      ]);
      
      console.log('📊 Appointments fetch result:', appointmentsResult);
      console.log('📊 Pets fetch result:', petsResult);
      console.log('📊 Services fetch result:', servicesResult);
      console.log('📊 Customers fetch result:', customersResult);
      console.log('📊 Doctors fetch result:', doctorsResult);
      
      // Process appointments
      let appointments = [];
      if (appointmentsResult.status === 'fulfilled') {
        appointments = Array.isArray(appointmentsResult.value) ? appointmentsResult.value : [];
        console.log('✅ Appointments loaded successfully:', appointments.length);
      } else {
        console.error('❌ Failed to load appointments:', appointmentsResult.reason);
        toast.showError('Không thể tải danh sách lịch hẹn');
      }

      // Process pets
      let pets = [];
      if (petsResult.status === 'fulfilled') {
        pets = Array.isArray(petsResult.value) ? petsResult.value : [];
        console.log('✅ Pets loaded successfully:', pets.length);
      } else {
        console.error('❌ Failed to load pets:', petsResult.reason);
        toast.showError('Không thể tải danh sách thú cưng');
      }

      // Process services  
      let services = [];
      if (servicesResult.status === 'fulfilled') {
        const servicesData = servicesResult.value;
        if (servicesData && servicesData.services && Array.isArray(servicesData.services)) {
          services = servicesData.services;
        } else if (Array.isArray(servicesData)) {
          services = servicesData;
        }
        console.log('✅ Services loaded successfully:', services.length);
      } else {
        console.error('❌ Failed to load services:', servicesResult.reason);
        toast.showError('Không thể tải danh sách dịch vụ');
      }

      // Process customers
      let customers = [];
      if (customersResult.status === 'fulfilled') {
        const customersData = customersResult.value;
        if (customersData && customersData.customers && Array.isArray(customersData.customers)) {
          customers = customersData.customers;
        } else if (Array.isArray(customersData)) {
          customers = customersData;
        }
        console.log('✅ Customers loaded successfully:', customers.length);
      } else {
        console.error('❌ Failed to load customers:', customersResult.reason);
        toast.showError('Không thể tải danh sách khách hàng');
      }

      // Process doctors
      let doctors = [];
      if (doctorsResult.status === 'fulfilled') {
        const doctorsData = doctorsResult.value;
        if (doctorsData && doctorsData.doctors && Array.isArray(doctorsData.doctors)) {
          doctors = doctorsData.doctors;
        } else if (Array.isArray(doctorsData)) {
          doctors = doctorsData;
        }
        console.log('✅ Doctors loaded successfully:', doctors.length);
      } else {
        console.error('❌ Failed to load doctors:', doctorsResult.reason);
        toast.showError('Không thể tải danh sách bác sĩ');
      }
      
      setAppointments(appointments);
      setPets(pets);
      setServices(services);
      setCustomers(customers);
      setDoctors(doctors);
      
      console.log('🎯 Final state update:');
      console.log('   - Appointments count:', appointments.length);
      console.log('   - Pets count:', pets.length);
      console.log('   - Services count:', services.length);
      console.log('   - Customers count:', customers.length);
      console.log('   - Doctors count:', doctors.length);
      
    } catch (error) {
      console.error('💥 Critical error in fetchData:', error);
      toast.showError('Đã xảy ra lỗi nghiêm trọng khi tải dữ liệu. Vui lòng thử lại.');
      // Ensure arrays even on error
      setAppointments([]);
      setPets([]);
      setServices([]);
      setCustomers([]);
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (searchValue) => {
    try {
      setLoading(true);
      setSearchTerm(searchValue);
      
      if (searchValue.trim()) {
        const data = await appointmentService.searchAppointments(searchValue);
        setAppointments(Array.isArray(data) ? data : []);
      } else {
        const data = await appointmentService.getAllAppointments();
        setAppointments(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error searching appointments:', error);
      toast.showError('Không thể tìm kiếm lịch hẹn. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusFilter = async (status) => {
    try {
      setLoading(true);
      setStatusFilter(status);
      
      if (status === 'all') {
        const data = await appointmentService.getAllAppointments();
        setAppointments(Array.isArray(data) ? data : []);
      } else {
        const data = await appointmentService.getAppointmentsByStatus(parseInt(status));
        setAppointments(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error filtering appointments:', error);
      toast.showError('Không thể lọc lịch hẹn. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const openDialog = (mode, appointment = null) => {
    setDialogMode(mode);
    setSelectedAppointment(appointment);
    
    if (mode === 'create') {
      setFormData({
        petId: '',
        serviceId: '',
        doctorId: '',
        appointmentDate: '',
        appointmentTime: '',
        weight: '',
        age: '',
        isNewPet: false,
        notes: '',
        status: 0
      });
    } else if (appointment) {
      console.log('🐾 Opening dialog for appointment:', appointment);
      
      setFormData({
        petId: appointment.PetId || appointment.petId || '',
        serviceId: appointment.ServiceId || appointment.serviceId || '',
        doctorId: appointment.DoctorId || appointment.doctorId || '',
        appointmentDate: appointment.AppointmentDate || appointment.appointmentDate ? 
          (appointment.AppointmentDate || appointment.appointmentDate).split('T')[0] : '',
        appointmentTime: appointment.AppointmentTime || appointment.appointmentTime || '',
        weight: appointment.Weight || appointment.weight || '',
        age: appointment.Age || appointment.age || '',
        isNewPet: appointment.IsNewPet || appointment.isNewPet || false,
        notes: appointment.Notes || appointment.notes || '',
        status: appointment.Status !== undefined ? appointment.Status : (appointment.status || 0)
      });
    }
    
    setFormErrors({});
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setSelectedAppointment(null);
    setFormData({
      petId: '',
      serviceId: '',
      doctorId: '',
      appointmentDate: '',
      appointmentTime: '',
      weight: '',
      age: '',
      isNewPet: false,
      notes: '',
      status: 0
    });
    setFormErrors({});
  };

  const handleFormChange = async (field, value) => {
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

    // Auto-fill age and weight when pet is selected
    if (field === 'petId' && value && (dialogMode === 'create' || dialogMode === 'edit')) {
      try {
        console.log('🐾 Auto-filling pet info for petId:', value);
        
        // Find selected pet
        const selectedPet = pets.find(p => (p.PetId || p.petId) === parseInt(value));
        if (selectedPet) {
          console.log('🐾 Selected pet:', selectedPet);
          
          const petName = selectedPet.Name || selectedPet.name;
          let autoFilledInfo = [];

          // Check if this is a manual refresh (same petId clicked again)
          const isManualRefresh = formData.petId === value;

          // Calculate age in months from birth date 
          const birthDate = selectedPet.BirthDate || selectedPet.birthDate;
          let ageInMonths = null;
          if (birthDate && (isManualRefresh || !formData.age || formData.age === '')) {
            ageInMonths = appointmentService.calculateAgeInMonths(birthDate);
            console.log('📅 Calculated age in months:', ageInMonths);
            autoFilledInfo.push(`Tuổi: ${ageInMonths} tháng`);
          }

          // Get latest weight from previous appointments
          let weightToFill = null;
          if (isManualRefresh || !formData.weight || formData.weight === '') {
            const medicalInfo = await appointmentService.getPetMedicalInfo(parseInt(value));
            console.log('⚖️ Medical info:', medicalInfo);
            
            if (medicalInfo.weight) {
              weightToFill = medicalInfo.weight;
              const weightDate = medicalInfo.lastWeightDate ? 
                new Date(medicalInfo.lastWeightDate).toLocaleDateString('vi-VN') : '';
              autoFilledInfo.push(`Cân nặng: ${weightToFill}kg${weightDate ? ` (${weightDate})` : ''}`);
            }
          }

          // Update form with calculated values
          if (ageInMonths !== null || weightToFill !== null) {
            setFormData(prev => ({
              ...prev,
              ...(ageInMonths !== null && { age: ageInMonths }),
              ...(weightToFill !== null && { weight: weightToFill })
            }));

            // Show info toast
            if (autoFilledInfo.length > 0) {
              const message = isManualRefresh 
                ? `🔄 Đã làm mới thông tin cho ${petName}: ${autoFilledInfo.join(', ')}`
                : `📋 Tự động điền thông tin cho ${petName}: ${autoFilledInfo.join(', ')}`;
              toast.showInfo(message);
            }
          }
        }
      } catch (error) {
        console.error('Error auto-filling pet info:', error);
        // Không hiển thị lỗi cho user vì đây là tính năng phụ
      }
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.petId) {
      errors.petId = 'Thú cưng là bắt buộc';
    }
    
    if (!formData.serviceId) {
      errors.serviceId = 'Dịch vụ là bắt buộc';
    }
    
    if (!formData.appointmentDate) {
      errors.appointmentDate = 'Ngày hẹn là bắt buộc';
    } else {
      // Validate date is not in the past
      const selectedDate = new Date(formData.appointmentDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to start of day
      
      if (selectedDate < today) {
        errors.appointmentDate = 'Ngày hẹn không thể trong quá khứ';
      }
    }
    
    if (!formData.appointmentTime) {
      errors.appointmentTime = 'Giờ hẹn là bắt buộc';
    }
    
    // Validate appointment time
    if (formData.appointmentDate && formData.appointmentTime) {
      const validation = appointmentService.isValidAppointmentTime(formData.appointmentDate, formData.appointmentTime);
      if (!validation.valid) {
        errors.appointmentTime = validation.message;
      }
    }

    // Validate weight if provided
    if (formData.weight && formData.weight !== '') {
      const weight = parseFloat(formData.weight);
      if (isNaN(weight) || weight < 0.1 || weight > 100) {
        errors.weight = 'Cân nặng phải từ 0.1 đến 100 kg';
      }
    }

    // Validate age if provided
    if (formData.age && formData.age !== '') {
      const age = parseInt(formData.age);
      if (isNaN(age) || age < 0 || age > 600) {
        errors.age = 'Tuổi phải từ 0 đến 600 tháng (50 năm)';
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateAppointment = async () => {
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      console.log('📝 Form data before create:', formData);
      
      await appointmentService.createAppointment(formData);
      await fetchData();
      closeDialog();
      toast.showSuccess('Đã thêm lịch hẹn thành công!');
    } catch (error) {
      console.error('❌ Error creating appointment:', error);
      
      // Extract error message from response
      let errorMessage = 'Không thể thêm lịch hẹn. Vui lòng thử lại.';
      if (error.message && error.message.includes('Bạn không có quyền')) {
        errorMessage = 'Bạn không có quyền thực hiện chức năng này.';
      } else if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAppointment = async () => {
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      const appointmentId = selectedAppointment.AppointmentId || selectedAppointment.appointmentId;
      await appointmentService.updateAppointment(appointmentId, formData);
      await fetchData();
      closeDialog();
      toast.showSuccess('Đã cập nhật lịch hẹn thành công!');
    } catch (error) {
      console.error('Error updating appointment:', error);
      toast.showError('Không thể cập nhật lịch hẹn. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (appointmentId, newStatus) => {
    try {
      console.log(`🔄 Updating appointment ${appointmentId} status to ${newStatus}`);
      
      // Show loading state
      const originalAppointments = [...appointments];
      const updatedAppointments = appointments.map(apt => 
        (apt.AppointmentId || apt.appointmentId) === appointmentId 
          ? { ...apt, Status: newStatus, status: newStatus }
          : apt
      );
      setAppointments(updatedAppointments);
      
      await appointmentService.updateAppointmentStatus(appointmentId, newStatus);
      
      // Refresh data to get updated information
      await fetchData();
      
      const statusInfo = appointmentService.getStatusInfo(newStatus);
      toast.showSuccess(`✅ Đã cập nhật trạng thái thành "${statusInfo.label}"`);
      console.log(`✅ Successfully updated appointment ${appointmentId} status`);
    } catch (error) {
      console.error('❌ Error updating status:', error);
      
      // Revert to original state on error
      await fetchData();
      
      let errorMessage = 'Không thể cập nhật trạng thái. Vui lòng thử lại.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message?.includes('404')) {
        errorMessage = 'Không tìm thấy lịch hẹn.';
      } else if (error.message?.includes('401') || error.message?.includes('403')) {
        errorMessage = 'Bạn không có quyền cập nhật trạng thái này.';
      }
      
      toast.showError(`❌ ${errorMessage}`);
    }
  };

  const handleDeleteAppointment = async (appointmentId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa lịch hẹn này?')) return;
    
    try {
      await appointmentService.deleteAppointment(appointmentId);
      await fetchData();
      toast.showSuccess('Đã xóa lịch hẹn thành công!');
    } catch (error) {
      console.error('Error deleting appointment:', error);
      toast.showError('Không thể xóa lịch hẹn. Vui lòng thử lại.');
    }
  };

  // Helper functions để get names - support both PascalCase and camelCase
  const getPetName = (petId) => {
    const pet = pets.find(p => (p.PetId || p.petId) === petId);
    return pet ? (pet.Name || pet.name) : 'Không xác định';
  };

  const getServiceName = (serviceId) => {
    const service = services.find(s => (s.ServiceId || s.serviceId) === serviceId);
    return service ? (service.Name || service.name || service.ServiceName || service.serviceName) : 'Không xác định';
  };

  const getDoctorName = (doctorId) => {
    if (!doctorId) return 'Chưa chỉ định';
    const doctor = doctors.find(d => (d.DoctorId || d.doctorId) === doctorId);
    return doctor ? (doctor.FullName || doctor.fullName || doctor.DoctorName || doctor.doctorName) : 'Không xác định';
  };

  const getCustomerName = (petId) => {
    const pet = pets.find(p => (p.PetId || p.petId) === petId);
    if (!pet) return 'Không xác định';
    
    const customerId = pet.CustomerId || pet.customerId;
    const customer = customers.find(c => (c.CustomerId || c.customerId) === customerId);
    return customer ? (customer.CustomerName || customer.customerName || customer.FullName || customer.fullName || customer.Username || customer.username) : 'Không xác định';
  };

  const getStatusChip = (status) => {
    const statusInfo = appointmentService.getStatusInfo(status);
    return (
      <Chip
        label={statusInfo.label} 
        color={statusInfo.color} 
        size="small"
      />
    );
  };

  const columns = [
    {
      field: 'appointmentId',
      label: 'ID',
      minWidth: 70,
      render: (row) => row.AppointmentId || row.appointmentId
    },
    {
      field: 'petName',
      label: 'Thú cưng',
      minWidth: 120,
      render: (row) => row.PetName || row.petName || getPetName(row.PetId || row.petId)
    },
    {
      field: 'customerName',
      label: 'Chủ sở hữu',
      minWidth: 150,
      render: (row) => row.CustomerName || row.customerName || getCustomerName(row.PetId || row.petId)
    },
    {
      field: 'doctorName',
      label: 'Bác sĩ',
      minWidth: 150,
      render: (row) => row.DoctorName || row.doctorName || getDoctorName(row.DoctorId || row.doctorId)
    },
    {
      field: 'serviceName',
      label: 'Dịch vụ',
      minWidth: 150,
      render: (row) => row.ServiceName || row.serviceName || getServiceName(row.ServiceId || row.serviceId)
    },
    {
      field: 'appointmentDate',
      label: 'Ngày hẹn',
      minWidth: 120,
      render: (row) => {
        const date = row.AppointmentDate || row.appointmentDate;
        return date ? new Date(date).toLocaleDateString('vi-VN') : 'Chưa có';
      }
    },
    {
      field: 'appointmentTime',
      label: 'Giờ hẹn',
      minWidth: 100,
      render: (row) => {
        const time = row.AppointmentTime || row.appointmentTime;
        return time ? time.substring(0, 5) : 'Chưa có'; // Show HH:mm format
      }
    },
    {
      field: 'status',
      label: 'Trạng thái',
      minWidth: 180,
      render: (row) => (
        <Box display="flex" alignItems="center" gap={1}>
          {getStatusChip(row.Status !== undefined ? row.Status : row.status)}
          <TextField
            select
            size="small"
            value={row.Status !== undefined ? row.Status : row.status}
            onChange={(e) => handleUpdateStatus(row.AppointmentId || row.appointmentId, parseInt(e.target.value))}
            sx={{ 
              minWidth: 120,
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  border: 'none'
                }
              }
            }}
          >
            {appointmentService.getStatusOptions().map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Box>
      )
    },
    {
      field: 'notes',
      label: 'Ghi chú',
      minWidth: 200,
      render: (row) => (row.Notes || row.notes) || 'Không có'
    }
  ];

  if (loading) {
    return (
      <PageTemplate title="Quản lý lịch hẹn" subtitle="Quản lý lịch hẹn khám bệnh cho thú cưng">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
      </Box>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate title="Quản lý lịch hẹn" subtitle="Quản lý lịch hẹn khám bệnh cho thú cưng">
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6">
            Danh sách lịch hẹn ({appointments.length})
              </Typography>
                <Button
                  variant="contained"
            startIcon={<AddIcon />}
            onClick={() => openDialog('create')}
          >
            Thêm lịch hẹn
                </Button>
              </Box>

        {/* Status Filter Tabs */}
        <Tabs 
          value={statusFilter} 
          onChange={(e, newValue) => handleStatusFilter(newValue)}
          sx={{ mb: 2 }}
        >
          <Tab label="Tất cả" value="all" />
          <Tab label="Chờ xác nhận" value="0" />
          <Tab label="Đã xác nhận" value="1" />
          <Tab label="Hoàn thành" value="2" />
          <Tab label="Đã hủy" value="3" />
        </Tabs>

        <SearchFilterBar
          searchValue={searchTerm}
          onSearchChange={handleSearch}
          placeholder="Tìm kiếm theo tên thú cưng, chủ sở hữu, dịch vụ..."
        />

        <DataTable
          columns={columns}
          data={appointments}
          loading={loading}
          emptyMessage="Không có lịch hẹn nào"
          onView={(row) => openDialog('view', row)}
          onEdit={(row) => openDialog('edit', row)}
          onDelete={(row) => handleDeleteAppointment(row.AppointmentId || row.appointmentId)}
        />
      </Paper>

      {/* Appointment Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={closeDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {dialogMode === 'create' && 'Thêm lịch hẹn mới'}
          {dialogMode === 'edit' && 'Chỉnh sửa lịch hẹn'}
          {dialogMode === 'view' && 'Thông tin lịch hẹn'}
        </DialogTitle>
        
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            <TextField
              label="Thú cưng"
              select
              value={formData.petId}
              onChange={(e) => handleFormChange('petId', e.target.value)}
              error={!!formErrors.petId}
              helperText={formErrors.petId}
              disabled={dialogMode === 'view'}
              fullWidth
            >
              {pets && pets.map((pet) => {
                const petId = pet.PetId || pet.petId;
                const petName = pet.Name || pet.name;
                return (
                  <MenuItem key={petId} value={petId}>
                    {petName} - {getCustomerName(petId)}
                </MenuItem>
                );
              })}
            </TextField>
            
            <TextField
              label="Dịch vụ"
              select
              value={formData.serviceId}
              onChange={(e) => handleFormChange('serviceId', e.target.value)}
              error={!!formErrors.serviceId}
              helperText={formErrors.serviceId}
              disabled={dialogMode === 'view'}
              fullWidth
            >
              {services && services.map((service) => {
                const serviceId = service.ServiceId || service.serviceId;
                const serviceName = service.Name || service.name || service.ServiceName || service.serviceName;
                const price = service.Price || service.price;
                return (
                  <MenuItem key={serviceId} value={serviceId}>
                    {serviceName} - {serviceService.formatPrice(price)}
                </MenuItem>
                );
              })}
            </TextField>

            <TextField
              label="Bác sĩ"
              select
              value={formData.doctorId}
              onChange={(e) => handleFormChange('doctorId', e.target.value)}
              disabled={dialogMode === 'view'}
              fullWidth
              helperText="Để trống nếu chưa chỉ định bác sĩ cụ thể"
            >
              <MenuItem value="">
                <em>Chưa chỉ định bác sĩ</em>
              </MenuItem>
              {doctors && doctors.map((doctor) => {
                const doctorId = doctor.DoctorId || doctor.doctorId;
                const doctorName = doctor.FullName || doctor.fullName || doctor.DoctorName || doctor.doctorName;
                const specialization = doctor.Specialization || doctor.specialization;
                return (
                  <MenuItem key={doctorId} value={doctorId}>
                    {doctorName} - {specialization || 'Bác sĩ tổng quát'}
                </MenuItem>
                );
              })}
            </TextField>
            
            <Box display="flex" gap={2}>
              <TextField
                label="Ngày hẹn"
                type="date"
                value={formData.appointmentDate}
                onChange={(e) => handleFormChange('appointmentDate', e.target.value)}
                error={!!formErrors.appointmentDate}
                helperText={formErrors.appointmentDate}
                disabled={dialogMode === 'view'}
                InputLabelProps={{ shrink: true }}
                inputProps={{ 
                  min: new Date().toISOString().split('T')[0] // Prevent selecting past dates
                }}
                fullWidth
              />
              
              <TextField
                label="Giờ hẹn"
                select
                value={formData.appointmentTime}
                onChange={(e) => handleFormChange('appointmentTime', e.target.value)}
                error={!!formErrors.appointmentTime}
                helperText={formErrors.appointmentTime}
                disabled={dialogMode === 'view'}
                fullWidth
              >
                {appointmentService.getTimeSlots().map((slot) => (
                  <MenuItem key={slot.value} value={slot.value}>
                    {slot.label}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
            
            {/* Weight and Age fields */}
            <Box display="flex" gap={2}>
              <TextField
                label="Cân nặng (kg)"
                type="number"
                value={formData.weight}
                onChange={(e) => handleFormChange('weight', e.target.value)}
                error={!!formErrors.weight}
                helperText={
                  formErrors.weight || (
                    dialogMode === 'view'
                      ? "Cân nặng tại thời điểm khám"
                      : "Tự động điền từ lần khám gần nhất khi chọn thú cưng (nếu trống)"
                  )
                }
                disabled={dialogMode === 'view'}
                fullWidth
                inputProps={{ min: 0.1, max: 100, step: 0.1 }}
              />
              
              <TextField
                label="Tuổi (tháng)"
                type="number"
                value={formData.age}
                onChange={(e) => handleFormChange('age', e.target.value)}
                error={!!formErrors.age}
                helperText={
                  formErrors.age || (
                    dialogMode === 'view'
                      ? "Tuổi tại thời điểm khám"
                      : "Tự động tính từ ngày sinh khi chọn thú cưng (nếu trống)"
                  )
                }
                disabled={dialogMode === 'view'}
                fullWidth
                inputProps={{ min: 0, max: 600 }}
              />
            </Box>

            {/* Auto-fill button for manual refresh */}
            {dialogMode !== 'view' && formData.petId && (
              <Box display="flex" justifyContent="center" mt={1}>
                <Button 
                  variant="outlined" 
                  size="small"
                  onClick={() => handleFormChange('petId', formData.petId)}
                  sx={{ textTransform: 'none' }}
                >
                  🔄 Làm mới thông tin thú cưng
                </Button>
              </Box>
            )}

            {/* Status field (only for edit mode) */}
            {dialogMode !== 'create' && (
              <TextField
                label="Trạng thái"
                select
                value={formData.status}
                onChange={(e) => handleFormChange('status', parseInt(e.target.value))}
                disabled={dialogMode === 'view'}
                fullWidth
              >
                {appointmentService.getStatusOptions().map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            )}
            
            <TextField
              label="Ghi chú"
              multiline
              rows={3}
              value={formData.notes}
              onChange={(e) => handleFormChange('notes', e.target.value)}
              disabled={dialogMode === 'view'}
              fullWidth
              placeholder="Nhập ghi chú về lịch hẹn..."
            />
            
            {dialogMode === 'view' && selectedAppointment && (
                          <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Cập nhật trạng thái nhanh:
                            </Typography>
                <Box display="flex" gap={1} flexWrap="wrap">
                  {appointmentService.getStatusOptions().map((status) => {
                    const appointmentId = selectedAppointment.AppointmentId || selectedAppointment.appointmentId;
                    const currentStatus = selectedAppointment.Status !== undefined ? selectedAppointment.Status : selectedAppointment.status;
                    return (
                    <Button
                      key={status.value}
                        variant={currentStatus === status.value ? "contained" : "outlined"}
                          size="small"
                      color={status.color}
                        onClick={() => handleUpdateStatus(appointmentId, status.value)}
                      disabled={loading}
                    >
                      {status.label}
                    </Button>
                    );
                  })}
                </Box>
              </Box>
            )}
          </Box>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={closeDialog} disabled={loading}>
            {dialogMode === 'view' ? 'Đóng' : 'Hủy'}
          </Button>
          {dialogMode === 'create' && (
            <Button 
              variant="contained" 
              onClick={handleCreateAppointment}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              {loading ? 'Đang thêm...' : 'Thêm'}
            </Button>
          )}
          {dialogMode === 'edit' && (
            <Button 
              variant="contained" 
              onClick={handleUpdateAppointment}
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

export default AppointmentsPage; 