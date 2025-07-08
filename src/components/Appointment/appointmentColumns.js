import { Box, MenuItem, TextField } from '@mui/material';
import React from 'react';
import { appointmentService } from '../../services';
import { APPOINTMENT_TABLE_MIN_WIDTHS } from './appointmentConstants';
import {
  formatAppointmentDate,
  formatAppointmentTime,
  getCustomerName,
  getDoctorName,
  getPetName,
  getServiceName,
  getStatusChip
} from './appointmentUtils';

/**
 * Get appointment table columns configuration
 */
export const getAppointmentTableColumns = ({
  pets,
  services,
  customers,
  doctors,
  onStatusUpdate
}) => [
  {
    field: 'appointmentId',
    label: 'ID',
    minWidth: APPOINTMENT_TABLE_MIN_WIDTHS.ID,
    render: (row) => row.AppointmentId || row.appointmentId
  },
  {
    field: 'petName',
    label: 'Thú cưng',
    minWidth: APPOINTMENT_TABLE_MIN_WIDTHS.PET_NAME,
    render: (row) => row.PetName || row.petName || getPetName(row.PetId || row.petId, pets)
  },
  {
    field: 'customerName',
    label: 'Chủ sở hữu',
    minWidth: APPOINTMENT_TABLE_MIN_WIDTHS.CUSTOMER_NAME,
    render: (row) => row.CustomerName || row.customerName || getCustomerName(row.PetId || row.petId, pets, customers)
  },
  {
    field: 'doctorName',
    label: 'Bác sĩ',
    minWidth: APPOINTMENT_TABLE_MIN_WIDTHS.DOCTOR_NAME,
    render: (row) => row.DoctorName || row.doctorName || getDoctorName(row.DoctorId || row.doctorId, doctors)
  },
  {
    field: 'serviceName',
    label: 'Dịch vụ',
    minWidth: APPOINTMENT_TABLE_MIN_WIDTHS.SERVICE_NAME,
    render: (row) => row.ServiceName || row.serviceName || getServiceName(row.ServiceId || row.serviceId, services)
  },
  {
    field: 'appointmentDate',
    label: 'Ngày hẹn',
    minWidth: APPOINTMENT_TABLE_MIN_WIDTHS.DATE,
    render: (row) => {
      const date = row.AppointmentDate || row.appointmentDate;
      return formatAppointmentDate(date);
    }
  },
  {
    field: 'appointmentTime',
    label: 'Giờ hẹn',
    minWidth: APPOINTMENT_TABLE_MIN_WIDTHS.TIME,
    render: (row) => {
      const time = row.AppointmentTime || row.appointmentTime;
      return formatAppointmentTime(time);
    }
  },
  {
    field: 'status',
    label: 'Trạng thái',
    minWidth: APPOINTMENT_TABLE_MIN_WIDTHS.STATUS,
    render: (row) => (
      <Box display="flex" alignItems="center" gap={1}>
        {getStatusChip(row.Status !== undefined ? row.Status : row.status)}
        <TextField
          select
          size="small"
          value={row.Status !== undefined ? row.Status : row.status}
          onChange={(e) => onStatusUpdate(
            row.AppointmentId || row.appointmentId, 
            parseInt(e.target.value)
          )}
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
    minWidth: APPOINTMENT_TABLE_MIN_WIDTHS.NOTES,
    render: (row) => (row.Notes || row.notes) || 'Không có'
  }
]; 