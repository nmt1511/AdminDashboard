import apiService from './apiService';
import appointmentService from './appointmentService';
import authService from './authService';
import cloudinaryService from './cloudinaryService';
import customerService from './customerService';
import dashboardService from './dashboardService';
import doctorService from './doctorService';
import newsService from './newsService';
import petService from './petService';
import serviceService from './serviceService';
import userService from './userService';

export {
  apiService, appointmentService, authService, cloudinaryService, customerService, dashboardService, doctorService, newsService, petService, serviceService, userService
};

export default {
  auth: authService,
  api: apiService,
  cloudinary: cloudinaryService,
  user: userService,
  pet: petService,
  appointment: appointmentService,
  customer: customerService,
  news: newsService,
  service: serviceService,
  doctor: doctorService
}; 