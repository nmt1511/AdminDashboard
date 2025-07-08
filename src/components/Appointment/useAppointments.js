import { useEffect, useState } from 'react';
import { appointmentService, customerService, doctorService, petService, serviceService } from '../../services';
import { useToast } from '../ToastProvider';
import {
    APPOINTMENT_ERROR_MESSAGES,
    APPOINTMENT_STATUS_FILTERS,
    APPOINTMENT_SUCCESS_MESSAGES
} from './appointmentConstants';
import { processApiData } from './appointmentUtils';

/**
 * Custom hook for appointments management
 * Handles all data fetching, CRUD operations, search and filter
 */
export const useAppointments = () => {
  // State
  const [appointments, setAppointments] = useState([]);
  const [pets, setPets] = useState([]);
  const [services, setServices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(APPOINTMENT_STATUS_FILTERS.ALL);

  const toast = useToast();

  /**
   * Sort appointments by date (newest first)
   */
  const sortAppointmentsByDate = (appointmentsArray) => {
    return [...appointmentsArray].sort((a, b) => {
      const dateA = new Date(`${a.AppointmentDate || a.appointmentDate} ${a.AppointmentTime || a.appointmentTime}`);
      const dateB = new Date(`${b.AppointmentDate || b.appointmentDate} ${b.AppointmentTime || b.appointmentTime}`);
      return dateB - dateA;
    });
  };

  /**
   * Fetch all required data
   */
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Starting to fetch appointments and related data...');
      
      const results = await Promise.allSettled([
        appointmentService.getAllAppointments(),
        petService.getAllPets(1, 1000),
        serviceService.getAllServices(),
        customerService.getCustomersForPetManagement(),
        doctorService.getAllDoctors()
      ]);
      
      const processedData = processApiData(results);
      
      // Sort appointments by date before setting state
      const sortedAppointments = sortAppointmentsByDate(processedData.appointments);
      setAppointments(sortedAppointments);
      setPets(processedData.pets);
      setServices(processedData.services);
      setCustomers(processedData.customers);
      setDoctors(processedData.doctors);
      
      // Show errors for failed requests
      const { errors } = processedData;
      if (errors.appointments) {
        console.error('❌ Failed to load appointments:', errors.appointments);
        toast.showError('Không thể tải danh sách lịch hẹn');
      }
      if (errors.pets) {
        console.error('❌ Failed to load pets:', errors.pets);
        toast.showError('Không thể tải danh sách thú cưng');
      }
      if (errors.services) {
        console.error('❌ Failed to load services:', errors.services);
        toast.showError('Không thể tải danh sách dịch vụ');
      }
      if (errors.customers) {
        console.error('❌ Failed to load customers:', errors.customers);
        toast.showError('Không thể tải danh sách khách hàng');
      }
      if (errors.doctors) {
        console.error('❌ Failed to load doctors:', errors.doctors);
        toast.showError('Không thể tải danh sách bác sĩ');
      }
      
      console.log('🎯 Data fetched successfully:', {
        appointments: processedData.appointments.length,
        pets: processedData.pets.length,
        services: processedData.services.length,
        customers: processedData.customers.length,
        doctors: processedData.doctors.length
      });
      
    } catch (error) {
      console.error('💥 Critical error in fetchData:', error);
      toast.showError(APPOINTMENT_ERROR_MESSAGES.FETCH_FAILED);
      setError(APPOINTMENT_ERROR_MESSAGES.FETCH_FAILED);
      
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

  /**
   * Search appointments
   */
  const handleSearch = async (searchValue) => {
    try {
      setLoading(true);
      setError(null);
      setSearchTerm(searchValue || '');
      
      let data;
      if (searchValue?.trim()) {
        console.log('Searching appointments with term:', searchValue);
        data = await appointmentService.searchAppointments(searchValue);
      } else {
        console.log('Empty search term, fetching all appointments');
        data = await appointmentService.getAllAppointments();
      }
      
      // Sort appointments by date before setting state
      const sortedAppointments = sortAppointmentsByDate(Array.isArray(data) ? data : []);
      console.log('Setting appointments:', sortedAppointments.length);
      setAppointments(sortedAppointments);
    } catch (error) {
      console.error('Error searching appointments:', error);
      setError(APPOINTMENT_ERROR_MESSAGES.SEARCH_FAILED);
      toast.showError(APPOINTMENT_ERROR_MESSAGES.SEARCH_FAILED);
      setAppointments([]); // Reset to empty array on error
    } finally {
      setLoading(false);
    }
  };

  /**
   * Filter appointments by status
   */
  const handleStatusFilter = async (status) => {
    try {
      setLoading(true);
      setStatusFilter(status);
      
      let data;
      if (status === APPOINTMENT_STATUS_FILTERS.ALL) {
        data = await appointmentService.getAllAppointments();
      } else {
        data = await appointmentService.getAppointmentsByStatus(parseInt(status));
      }
      
      // Sort appointments by date before setting state
      const sortedAppointments = sortAppointmentsByDate(Array.isArray(data) ? data : []);
      setAppointments(sortedAppointments);
    } catch (error) {
      console.error('Error filtering appointments by status:', error);
      toast.showError('Không thể lọc lịch hẹn theo trạng thái. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Create new appointment
   */
  const createAppointment = async (appointmentData) => {
    try {
      setLoading(true);
      
      await appointmentService.createAppointment(appointmentData);
      
      // Refresh data
      await fetchData();
      
      toast.showSuccess(APPOINTMENT_SUCCESS_MESSAGES.CREATE_SUCCESS);
      return { success: true };
      
    } catch (error) {
      console.error('Error creating appointment:', error);
      toast.showError(APPOINTMENT_ERROR_MESSAGES.CREATE_FAILED);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update existing appointment
   */
  const updateAppointment = async (appointmentId, appointmentData) => {
    try {
      setLoading(true);
      
      await appointmentService.updateAppointment(appointmentId, appointmentData);
      
      // Refresh data
      await fetchData();
      
      toast.showSuccess(APPOINTMENT_SUCCESS_MESSAGES.UPDATE_SUCCESS);
      return { success: true };
      
    } catch (error) {
      console.error('Error updating appointment:', error);
      toast.showError(APPOINTMENT_ERROR_MESSAGES.UPDATE_FAILED);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update appointment status only
   */
  const updateAppointmentStatus = async (appointmentId, newStatus) => {
    try {
      await appointmentService.updateAppointmentStatus(appointmentId, newStatus);
      
      // Update local state immediately for better UX
      setAppointments(prev => prev.map(appointment => {
        const id = appointment.AppointmentId || appointment.appointmentId;
        if (id === appointmentId) {
          return {
            ...appointment,
            Status: newStatus,
            status: newStatus
          };
        }
        return appointment;
      }));
      
      toast.showSuccess(APPOINTMENT_SUCCESS_MESSAGES.STATUS_UPDATE_SUCCESS);
      
    } catch (error) {
      console.error('Error updating appointment status:', error);
      toast.showError(APPOINTMENT_ERROR_MESSAGES.STATUS_UPDATE_FAILED);
      
      // Refresh data on error to ensure consistency
      await fetchData();
    }
  };

  /**
   * Delete appointment
   */
  const deleteAppointment = async (appointmentId) => {
    try {
      await appointmentService.deleteAppointment(appointmentId);
      
      // Remove from local state immediately
      setAppointments(prev => prev.filter(appointment => {
        const id = appointment.AppointmentId || appointment.appointmentId;
        return id !== appointmentId;
      }));
      
      toast.showSuccess(APPOINTMENT_SUCCESS_MESSAGES.DELETE_SUCCESS);
      return { success: true };
      
    } catch (error) {
      console.error('Error deleting appointment:', error);
      toast.showError(APPOINTMENT_ERROR_MESSAGES.DELETE_FAILED);
      return { success: false, error };
    }
  };

  // Load data on mount
  useEffect(() => {
    fetchData();
  }, []);

  return {
    // State
    appointments,
    pets,
    services,
    customers,
    doctors,
    loading,
    error,
    searchTerm,
    statusFilter,
    
    // Actions
    fetchData,
    handleSearch,
    handleStatusFilter,
    createAppointment,
    updateAppointment,
    updateAppointmentStatus,
    deleteAppointment,
    
    // Setters for external control
    setError,
    setSearchTerm,
    setStatusFilter
  };
}; 