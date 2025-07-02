import apiService from './apiService';

const dashboardService = {
  // Get dashboard analytics
  getDashboardAnalytics: async (period = 'month', date = null) => {
    try {
      console.log('Getting dashboard analytics for period:', period);
      const params = { period };
      if (date) params.date = date;
      
      const response = await apiService.getWithParams('/Dashboard/analytics', params);
      console.log('Dashboard analytics response:', response);
      return response;
    } catch (error) {
      console.error('Error getting dashboard analytics:', error);
      throw error;
    }
  },

  // Get completion trends
  getCompletionTrends: async (period = 'month', periods = 12, date = null) => {
    try {
      console.log('Getting completion trends:', { period, periods });
      const params = { period, periods };
      if (date) params.date = date;
      
      const response = await apiService.getWithParams('/Dashboard/completion-trends', params);
      console.log('Completion trends response:', response);
      return response;
    } catch (error) {
      console.error('Error getting completion trends:', error);
      throw error;
    }
  },

  // Get performance comparison by period
  getPerformanceByPeriod: async (period = 'month', date = null) => {
    try {
      console.log('Getting performance by period:', period);
      const params = { period };
      if (date) params.date = date;
      
      const response = await apiService.getWithParams('/Dashboard/performance-by-period', params);
      console.log('Performance data response:', response);
      return response;
    } catch (error) {
      console.error('Error getting performance data:', error);
      throw error;
    }
  },

  // Format chart data for Chart.js
  formatChartData: (data, type = 'line') => {
    if (!data || data.length === 0) {
      return {
        labels: [],
        datasets: []
      };
    }

    // Handle different chart types
    switch (type) {
      case 'completion-trend':
        return {
          labels: data.map(item => item.period || ''),
          datasets: [
            {
              label: 'Tỷ lệ hoàn thành (%)',
              data: data.map(item => item.completionRate || 0),
              borderColor: 'rgb(75, 192, 192)',
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              tension: 0.1,
              fill: true
            },
            {
              label: 'Tổng số lịch hẹn',
              data: data.map(item => item.totalAppointments || 0),
              borderColor: 'rgb(255, 99, 132)',
              backgroundColor: 'rgba(255, 99, 132, 0.2)',
              yAxisID: 'y1',
              tension: 0.1
            }
          ]
        };

      case 'doctor-analysis':
        return {
          labels: data.map(item => item.doctorName || 'Unknown'),
          datasets: [
            {
              label: 'Tỷ lệ hoàn thành (%)',
              data: data.map(item => item.completionRate || 0),
              backgroundColor: [
                'rgba(255, 99, 132, 0.8)',
                'rgba(54, 162, 235, 0.8)',
                'rgba(255, 205, 86, 0.8)',
                'rgba(75, 192, 192, 0.8)',
                'rgba(153, 102, 255, 0.8)'
              ],
              borderColor: [
                'rgba(255, 99, 132, 1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 205, 86, 1)',
                'rgba(75, 192, 192, 1)',
                'rgba(153, 102, 255, 1)'
              ],
              borderWidth: 1
            }
          ]
        };

      case 'service-analysis':
        return {
          labels: data.map(item => item.serviceName || 'Unknown'),
          datasets: [
            {
              label: 'Số lượng lịch hẹn',
              data: data.map(item => item.totalAppointments || 0),
              backgroundColor: [
                'rgba(255, 99, 132, 0.8)',
                'rgba(54, 162, 235, 0.8)',
                'rgba(255, 205, 86, 0.8)',
                'rgba(75, 192, 192, 0.8)',
                'rgba(153, 102, 255, 0.8)',
                'rgba(255, 159, 64, 0.8)'
              ],
              borderColor: [
                'rgba(255, 99, 132, 1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 205, 86, 1)',
                'rgba(75, 192, 192, 1)',
                'rgba(153, 102, 255, 1)',
                'rgba(255, 159, 64, 1)'
              ],
              borderWidth: 1
            }
          ]
        };

      case 'time-series':
        return {
          labels: data.map(item => item.date || ''),
          datasets: [
            {
              label: 'Tổng số lịch hẹn',
              data: data.map(item => item.totalAppointments || 0),
              borderColor: 'rgb(75, 192, 192)',
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              tension: 0.1,
              fill: true
            },
            {
              label: 'Hoàn thành',
              data: data.map(item => item.completedAppointments || 0),
              borderColor: 'rgb(54, 162, 235)',
              backgroundColor: 'rgba(54, 162, 235, 0.2)',
              tension: 0.1
            },
            {
              label: 'Đã hủy',
              data: data.map(item => item.cancelledAppointments || 0),
              borderColor: 'rgb(255, 99, 132)',
              backgroundColor: 'rgba(255, 99, 132, 0.2)',
              tension: 0.1
            }
          ]
        };

      default:
        return {
          labels: data.map(item => item.label || item.period || item.date || ''),
          datasets: [
            {
              label: 'Dữ liệu',
              data: data.map(item => item.value || item.total || 0),
              borderColor: 'rgb(75, 192, 192)',
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
            }
          ]
        };
    }
  },

  // Get chart options for Chart.js
  getChartOptions: (type = 'line') => {
    const baseOptions = {
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: false
        }
      }
    };

    switch (type) {
      case 'completion-trend':
        return {
          ...baseOptions,
          scales: {
            y: {
              type: 'linear',
              display: true,
              position: 'left',
              title: {
                display: true,
                text: 'Tỷ lệ hoàn thành (%)'
              },
              min: 0,
              max: 100
            },
            y1: {
              type: 'linear',
              display: true,
              position: 'right',
              title: {
                display: true,
                text: 'Số lượng lịch hẹn'
              },
              grid: {
                drawOnChartArea: false,
              },
            }
          }
        };

      case 'doctor-analysis':
        return {
          ...baseOptions,
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Tỷ lệ hoàn thành (%)'
              },
              max: 100
            }
          }
        };

      case 'service-analysis':
        return {
          ...baseOptions,
          plugins: {
            ...baseOptions.plugins,
            legend: {
              position: 'right'
            }
          }
        };

      case 'time-series':
        return {
          ...baseOptions,
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Số lượng'
              }
            }
          }
        };

      default:
        return baseOptions;
    }
  },

  // Format period display
  formatPeriodDisplay: (period) => {
    const periods = {
      'day': 'Ngày',
      'week': 'Tuần', 
      'month': 'Tháng',
      'quarter': 'Quý',
      'year': 'Năm'
    };
    return periods[period] || 'Tháng';
  },

  // Format number with Vietnamese locale
  formatNumber: (number, type = 'number') => {
    if (typeof number !== 'number') return '0';
    
    switch (type) {
      case 'percentage':
        return `${new Intl.NumberFormat('vi-VN', { 
          minimumFractionDigits: 1, 
          maximumFractionDigits: 1 
        }).format(number)}%`;
      case 'currency':
        return new Intl.NumberFormat('vi-VN', { 
          style: 'currency', 
          currency: 'VND' 
        }).format(number);
      default:
        return new Intl.NumberFormat('vi-VN').format(number);
    }
  },

  getTodayAppointments: async () => {
    try {
      console.log('Calling API for today appointments...');
      const response = await apiService.get('/Dashboard/today');
      console.log('API Response:', response);
      return response;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }
};

export default dashboardService; 