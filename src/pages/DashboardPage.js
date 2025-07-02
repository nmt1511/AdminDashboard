import {
  Alert,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Typography
} from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip
} from 'chart.js';
import React, { useEffect, useMemo, useState } from 'react';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import ContentCard from '../components/ContentCard';
import PageTemplate from '../components/PageTemplate';
import { useToast } from '../components/ToastProvider';
import {
  appointmentService,
  authService,
  dashboardService,
  doctorService,
  newsService,
  petService,
  serviceService,
  userService
} from '../services';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    Filler
);

const DashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [todayAppointments, setTodayAppointments] = useState(null);
  
  // Basic dashboard data
  const [dashboardData, setDashboardData] = useState({
    users: { total: 0, admins: 0, customers: 0 },
    pets: { total: 0, bySpecies: {} },
    appointments: { total: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0 },
    doctors: { total: 0, averageExperience: 0 },
    services: { total: 0 },
    news: { total: 0, recent: [] }
  });

  // Analytics data
  const [analyticsData, setAnalyticsData] = useState(null);
  const [completionTrends, setCompletionTrends] = useState([]);
  const [performanceData, setPerformanceData] = useState(null);

  // Memoized chart data & options to avoid unnecessary recalculations
  const completionTrendChart = useMemo(() => {
    return {
      data: dashboardService.formatChartData(completionTrends, 'completion-trend'),
      options: {
        ...dashboardService.getChartOptions('completion-trend'),
        maintainAspectRatio: false
      }
    };
  }, [completionTrends]);

  const doctorAnalysisChart = useMemo(() => {
    return {
      data: dashboardService.formatChartData(analyticsData?.doctorAnalysis ?? [], 'doctor-analysis'),
      options: {
        ...dashboardService.getChartOptions('doctor-analysis'),
        maintainAspectRatio: false
      }
    };
  }, [analyticsData]);

  const serviceAnalysisChart = useMemo(() => {
    return {
      data: dashboardService.formatChartData(analyticsData?.serviceAnalysis ?? [], 'service-analysis'),
      options: {
        ...dashboardService.getChartOptions('service-analysis'),
        maintainAspectRatio: false
      }
    };
  }, [analyticsData]);

  const timeSeriesChart = useMemo(() => {
    return {
      data: dashboardService.formatChartData(analyticsData?.timeSeriesData ?? [], 'time-series'),
      options: {
        ...dashboardService.getChartOptions('time-series'),
        maintainAspectRatio: false
      }
    };
  }, [analyticsData]);

  // Toast hook
  const toast = useToast();

  useEffect(() => {
    fetchDashboardData();
    fetchAnalyticsData();
    fetchTodayAppointments();
  }, []);

  useEffect(() => {
    fetchAnalyticsData();
  }, [selectedPeriod, selectedDate]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch data from all services in parallel
      const [
        usersData,
        petsData,
        appointmentsData,
        doctorsData,
        servicesData,
        newsData
      ] = await Promise.allSettled([
        userService.getAllUsers(),
        petService.getAllPets(),
        appointmentService.getAllAppointments(),
        doctorService.getAllDoctors(),
        serviceService.getAllServices(),
        newsService.getAllNews()
      ]);

      // Process users data
      const users = usersData.status === 'fulfilled' ? usersData.value : [];
      const usersStats = {
        total: users.length,
        admins: users.filter(user => user.role === 1).length,
        customers: users.filter(user => user.role === 0).length
      };

      // Process pets data
      const pets = petsData.status === 'fulfilled' ? petsData.value : [];
      const petsStats = {
        total: pets.length,
        bySpecies: pets.reduce((acc, pet) => {
          const species = pet.species || 'Không xác định';
          acc[species] = (acc[species] || 0) + 1;
          return acc;
        }, {})
      };

      // Process appointments data
      const appointments = appointmentsData.status === 'fulfilled' ? appointmentsData.value : [];
      const appointmentsStats = {
        total: appointments.length,
        pending: appointments.filter(apt => apt.status === 0).length,
        confirmed: appointments.filter(apt => apt.status === 1).length,
        completed: appointments.filter(apt => apt.status === 2).length,
        cancelled: appointments.filter(apt => apt.status === 3).length
      };

      // Process doctors data
      const doctors = doctorsData.status === 'fulfilled' ? doctorsData.value : [];
      // Ensure doctors is an array before processing
      const doctorsArray = Array.isArray(doctors) ? doctors : [];
      const doctorsStats = doctorService.getDoctorStats(doctorsArray);

      // Process services data
      const services = servicesData.status === 'fulfilled' ? servicesData.value : [];
      const servicesStats = {
        total: services.length
      };

      // Process news data
      const news = newsData.status === 'fulfilled' ? newsData.value : [];
      const newsStats = {
        total: news.length,
        recent: news
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 5)
          .map(item => newsService.formatNewsData(item))
      };

      setDashboardData({
        users: usersStats,
        pets: petsStats,
        appointments: appointmentsStats,
        doctors: doctorsStats,
        services: servicesStats,
        news: newsStats
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        toast.showError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        authService.clearAuthData();
        window.location.href = '/login';
      } else {
        setError('Không thể tải dữ liệu dashboard. Vui lòng thử lại.');
        toast.showError('Không thể tải dữ liệu dashboard. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalyticsData = async () => {
    try {
      setAnalyticsLoading(true);
      console.log('Fetching analytics data for period:', selectedPeriod);

      // Check authentication before making API calls
      if (!authService.isAdminAuthenticated()) {
        console.error('User not authenticated or not admin');
        toast.showError('Bạn cần đăng nhập với quyền admin để xem phân tích.');
        return;
      }

      const dateParam = selectedPeriod === 'day' ? selectedDate.toISOString().split('T')[0] : null;

      // Fetch analytics data in parallel
      const [analyticsResponse, trendsResponse, performanceResponse] = await Promise.allSettled([
        dashboardService.getDashboardAnalytics(selectedPeriod, dateParam),
        dashboardService.getCompletionTrends(selectedPeriod, 12, dateParam),
        dashboardService.getPerformanceByPeriod(selectedPeriod, dateParam)
      ]);

      if (analyticsResponse.status === 'fulfilled') {
        // Kiểm tra nếu response có thuộc tính data
        const analyticsData = analyticsResponse.value?.data || analyticsResponse.value;
        setAnalyticsData(analyticsData);
        console.log('Analytics data:', analyticsData);
      } else {
        console.error('Analytics error:', analyticsResponse.reason);
        if (analyticsResponse.reason?.message?.includes('401') || analyticsResponse.reason?.message?.includes('Unauthorized')) {
          toast.showError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
          authService.clearAuthData();
          window.location.href = '/login';
          return;
        }
      }

      if (trendsResponse.status === 'fulfilled') {
        // Kiểm tra nếu response có thuộc tính data
        const trendsData = trendsResponse.value?.data || trendsResponse.value;
        setCompletionTrends(trendsData);
        console.log('Trends data:', trendsData);
      } else {
        console.error('Trends error:', trendsResponse.reason);
      }

      if (performanceResponse.status === 'fulfilled') {
        // Kiểm tra nếu response có thuộc tính data
        const performanceData = performanceResponse.value?.data || performanceResponse.value;
        setPerformanceData(performanceData);
        console.log('Performance data:', performanceData);
      } else {
        console.error('Performance error:', performanceResponse.reason);
      }

    } catch (error) {
      console.error('Error fetching analytics data:', error);
      if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        toast.showError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        authService.clearAuthData();
        window.location.href = '/login';
      } else {
        toast.showError('Không thể tải dữ liệu phân tích. Vui lòng thử lại.');
      }
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const fetchTodayAppointments = async () => {
    try {
      setLoading(true);
      console.log('Fetching today appointments...');
      const response = await dashboardService.getTodayAppointments();
      console.log('Today appointments response:', response);
      // Kiểm tra nếu response có thuộc tính data
      const appointmentsData = response?.data || response;
      setTodayAppointments(appointmentsData);
    } catch (error) {
      console.error('Error fetching today appointments:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
        toast.showError(`Không thể tải dữ liệu lịch hẹn hôm nay: ${error.response.data.message || 'Lỗi không xác định'}`);
      } else if (error.request) {
        console.error('No response received:', error.request);
        toast.showError('Không thể kết nối đến server');
      } else {
        toast.showError('Không thể tải dữ liệu lịch hẹn hôm nay');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodChange = (event) => {
    setSelectedPeriod(event.target.value);
  };

  const handleDateChange = (newValue) => {
    setSelectedDate(newValue);
  };

  // Stat card component without icons - clean design
  const StatCard = ({ title, value, subtitle, color = 'primary', change = null, large = false }) => (
    <Card 
      sx={{ 
        height: '100%',
        background: large ? `linear-gradient(135deg, ${
          color === 'primary' ? '#1976d2 0%, #1565c0 100%' : 
          color === 'success' ? '#2e7d32 0%, #1b5e20 100%' :
          color === 'warning' ? '#ed6c02 0%, #e65100 100%' :
          color === 'error' ? '#d32f2f 0%, #c62828 100%' :
          '#9c27b0 0%, #7b1fa2 100%'})` : 'white',
        color: large ? 'white' : 'inherit',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: large ? '0 12px 24px rgba(0,0,0,0.15)' : '0 8px 16px rgba(0,0,0,0.1)'
        }
      }}
    >
      <CardContent sx={{ p: large ? 4 : 3 }}>
        <Typography 
          variant={large ? "h2" : "h3"} 
          component="div" 
          color={large ? 'inherit' : `${color}.main`} 
          sx={{ 
            fontWeight: 'bold', 
            mb: 1,
            fontSize: large ? '3rem' : '2rem'
          }}
        >
          {loading ? <CircularProgress size={large ? 40 : 32} color={large ? 'inherit' : color} /> : dashboardService.formatNumber(value)}
        </Typography>
        <Typography 
          variant={large ? "h5" : "h6"} 
          component="div" 
          gutterBottom 
          sx={{ 
            fontWeight: 500,
            opacity: large ? 0.9 : 1
          }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography 
            variant="body2" 
            color={large ? 'inherit' : 'text.secondary'} 
            sx={{ 
              mb: change ? 1 : 0,
              opacity: large ? 0.8 : 1
            }}
          >
            {subtitle}
          </Typography>
        )}
        {change && (
          <Typography 
            variant="caption" 
            color={change > 0 ? 'success.main' : change < 0 ? 'error.main' : 'text.secondary'}
            sx={{ 
              display: 'flex', 
              alignItems: 'center',
              fontWeight: 500,
              fontSize: '0.875rem',
              backgroundColor: large ? 'rgba(255,255,255,0.2)' : 'transparent',
              padding: large ? '4px 8px' : 0,
              borderRadius: large ? 1 : 0,
              color: large ? 'white' : undefined
            }}
          >
            {change > 0 ? '↗' : change < 0 ? '↘' : '→'} {Math.abs(change)}%
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  const getTopSpecies = () => {
    const species = dashboardData.pets.bySpecies;
    const sorted = Object.entries(species)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3);
    return sorted.map(([name, count]) => `${name}: ${count}`).join(', ');
  };

  if (error) {
    return (
      <PageTemplate>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate>
      {/* Today's Appointments */}
      <Box sx={{ mb: 3 }}>
        <ContentCard 
          title={`Lịch hẹn hôm nay (${todayAppointments?.date || 'Đang tải...'})`}
          sx={{ p: 2 }}
        >
          {loading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : todayAppointments?.appointments?.length > 0 ? (
            <>
              <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
                <Grid item xs={12} sm={3}>
                  <Box textAlign="center" sx={{ 
                    p: 2,
                    border: '1px solid rgba(0, 0, 0, 0.12)',
                    borderRadius: 1,
                    backgroundColor: 'background.paper'
                  }}>
                    <Typography variant="h4" color="primary.main" sx={{ fontWeight: 'bold' }}>
                      {todayAppointments.total}
                    </Typography>
                    <Typography variant="body2">Tổng lịch hẹn hôm nay</Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={9}>
                  <Grid container spacing={2}>
                    <Grid item xs={6} sm={4}>
                      <Box textAlign="center" sx={{
                        p: 2,
                        border: '1px solid rgba(0, 0, 0, 0.12)',
                        borderRadius: 1,
                        backgroundColor: 'background.paper',
                        '&:hover': {
                          boxShadow: 1
                        }
                      }}>
                        <Typography variant="h5" color="warning.main" sx={{ fontWeight: 'bold' }}>
                          {todayAppointments.pending}
                        </Typography>
                        <Typography variant="body2">Chờ xác nhận</Typography>
                      </Box>
                    </Grid>

                    <Grid item xs={6} sm={4}>
                      <Box textAlign="center" sx={{
                        p: 2,
                        border: '1px solid rgba(0, 0, 0, 0.12)',
                        borderRadius: 1,
                        backgroundColor: 'background.paper',
                        '&:hover': {
                          boxShadow: 1
                        }
                      }}>
                        <Typography variant="h5" color="success.main" sx={{ fontWeight: 'bold' }}>
                          {todayAppointments.completed}
                        </Typography>
                        <Typography variant="body2">Hoàn thành</Typography>
                      </Box>
                    </Grid>

                    <Grid item xs={6} sm={4}>
                      <Box textAlign="center" sx={{
                        p: 2,
                        border: '1px solid rgba(0, 0, 0, 0.12)',
                        borderRadius: 1,
                        backgroundColor: 'background.paper',
                        '&:hover': {
                          boxShadow: 1
                        }
                      }}>
                        <Typography variant="h5" color="error.main" sx={{ fontWeight: 'bold' }}>
                          {todayAppointments.cancelled}
                        </Typography>
                        <Typography variant="body2">Đã hủy</Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>

              {/* Today's Appointments List */}
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>Chi tiết lịch hẹn:</Typography>
                <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                  {todayAppointments.appointments.map((appointment) => (
                    <Card key={appointment.appointmentId} sx={{ mb: 2, p: 2 }}>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={3}>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {appointment.appointmentTime}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {appointment.statusText}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <Typography variant="subtitle1">
                            {appointment.petName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {appointment.customerName}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={5}>
                          <Typography variant="subtitle1">
                            {appointment.serviceName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Bác sĩ: {appointment.doctorName || 'Chưa phân công'}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Card>
                  ))}
                </Box>
              </Box>
            </>
          ) : (
            <Alert severity="info">Không có lịch hẹn nào trong ngày hôm nay</Alert>
          )}
        </ContentCard>
      </Box>

      {/* Tổng & Trạng thái lịch hẹn */}
      <Box sx={{ mb: 3 }}>
        <ContentCard title="Lịch hẹn" sx={{ p: 2 }}>
          <Grid container spacing={2} alignItems="center">
            {/* Tổng lịch hẹn */}
            <Grid item xs={12} sm={3}>
              <Box textAlign="center" sx={{ 
                mb: { xs: 2, sm: 0 },
                p: 2,
                border: '1px solid rgba(0, 0, 0, 0.12)',
                borderRadius: 1,
                backgroundColor: 'background.paper'
              }}>
                <Typography variant="h4" color="primary.main" sx={{ fontWeight: 'bold' }}>
                  {dashboardData.appointments.total}
                </Typography>
                <Typography variant="body2">Tổng lịch hẹn</Typography>
              </Box>
            </Grid>

            {/* Trạng thái chi tiết */}
            <Grid item xs={12} sm={9}>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={4}>
                  <Box textAlign="center" sx={{
                    p: 2,
                    border: '1px solid rgba(0, 0, 0, 0.12)',
                    borderRadius: 1,
                    backgroundColor: 'background.paper',
                    '&:hover': {
                      boxShadow: 1
                    }
                  }}>
                    <Typography variant="h5" color="warning.main" sx={{ fontWeight: 'bold' }}>
                      {dashboardData.appointments.pending}
                    </Typography>
                    <Typography variant="body2">Chờ xác nhận</Typography>
                  </Box>
                </Grid>

                <Grid item xs={6} sm={4}>
                  <Box textAlign="center" sx={{
                    p: 2,
                    border: '1px solid rgba(0, 0, 0, 0.12)',
                    borderRadius: 1,
                    backgroundColor: 'background.paper',
                    '&:hover': {
                      boxShadow: 1
                    }
                  }}>
                    <Typography variant="h5" color="success.main" sx={{ fontWeight: 'bold' }}>
                      {dashboardData.appointments.completed}
                    </Typography>
                    <Typography variant="body2">Hoàn thành</Typography>
                  </Box>
                </Grid>

                <Grid item xs={6} sm={4}>
                  <Box textAlign="center" sx={{
                    p: 2,
                    border: '1px solid rgba(0, 0, 0, 0.12)',
                    borderRadius: 1,
                    backgroundColor: 'background.paper',
                    '&:hover': {
                      boxShadow: 1
                    }
                  }}>
                    <Typography variant="h5" color="error.main" sx={{ fontWeight: 'bold' }}>
                      {dashboardData.appointments.cancelled}
                    </Typography>
                    <Typography variant="body2">Đã hủy</Typography>
                  </Box>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </ContentCard>
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* Analytics Section */}
      <Box sx={{ mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h4" component="h2" sx={{ fontWeight: 'bold', mb: 1 }}>
              Phân tích hiệu suất
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Theo dõi xu hướng và hiệu quả hoạt động - {dashboardService.formatPeriodDisplay(selectedPeriod)}
            </Typography>
          </Box>
          <Box display="flex" gap={2}>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Thời kỳ</InputLabel>
              <Select
                value={selectedPeriod}
                onChange={handlePeriodChange}
                label="Thời kỳ"
              >
                <MenuItem value="day">Ngày</MenuItem>
                <MenuItem value="week">Tuần</MenuItem>
                <MenuItem value="month">Tháng</MenuItem>
                <MenuItem value="quarter">Quý</MenuItem>
                <MenuItem value="year">Năm</MenuItem>
              </Select>
            </FormControl>

            {selectedPeriod === 'day' && (
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Chọn ngày"
                  value={selectedDate}
                  onChange={handleDateChange}
                  slotProps={{ textField: { size: 'small', sx: { minWidth: 150 } } }}
                />
              </LocalizationProvider>
            )}
          </Box>
        </Box>

        {analyticsLoading ? (
          <Box display="flex" justifyContent="center" p={6}>
            <CircularProgress size={50} />
          </Box>
        ) : analyticsData ? (
          <Grid container spacing={2}>
            {/* Row 1: Completion & Cancellation Rates + Doctor Performance */}
            <Grid item xs={12} md={8}>
              <ContentCard title="Xu hướng tỷ lệ hoàn thành theo thời gian">
                <Box sx={{ height: 350 }}>
                  <Line data={completionTrendChart.data} options={completionTrendChart.options} />
                </Box>
              </ContentCard>
            </Grid>

            <Grid item xs={12} md={4}>
              <ContentCard title="Tỷ lệ hoàn thành / hủy">
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="success.main" sx={{ fontWeight: 'bold' }}>
                        {dashboardService.formatNumber(analyticsData.overallStats.completionRate, 'percentage')}
                      </Typography>
                      <Typography variant="subtitle2">Hoàn thành</Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={6}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="error.main" sx={{ fontWeight: 'bold' }}>
                        {dashboardService.formatNumber((analyticsData.overallStats.cancelledAppointments / analyticsData.overallStats.totalAppointments * 100) || 0, 'percentage')}
                      </Typography>
                      <Typography variant="subtitle2">Hủy</Typography>
                    </Box>
                  </Grid>
                </Grid>
              </ContentCard>

              <Box mt={2}>
                <ContentCard title="Hiệu suất bác sĩ">
                  <Box sx={{ height: 200 }}>
                    <Bar data={doctorAnalysisChart.data} options={doctorAnalysisChart.options} />
                  </Box>
                </ContentCard>
              </Box>
            </Grid>

            {/* Row 2: Service Analysis */}
            <Grid item xs={12}>
              <ContentCard title="Phân tích dịch vụ phổ biến">
                <Box sx={{ height: 300 }}>
                  <Doughnut data={serviceAnalysisChart.data} options={serviceAnalysisChart.options} />
                </Box>
              </ContentCard>
            </Grid>
          </Grid>
        ) : (
          <Alert severity="info" sx={{ mt: 2 }}>
            Không có dữ liệu phân tích cho khoảng thời gian này.
          </Alert>
        )}
      </Box>
    </PageTemplate>
  );
};

export default DashboardPage;
