import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Paper,
  TextField,
  Typography
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import DataTable from '../components/DataTable';
import PageTemplate from '../components/PageTemplate';
import SearchFilterBar from '../components/SearchFilterBar';
import { useToast } from '../components/ToastProvider';
import { newsService } from '../services';

const NewsPage = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNews, setSelectedNews] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState('view'); // 'view', 'edit', 'create'
  const [viewMode, setViewMode] = useState('table'); // 'table', 'cards'

  // Toast hook
  const toast = useToast();

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tags: '',
    imageUrl: ''
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await newsService.getAllNews();
      setNews(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching news:', error);
      setError(`Không thể tải danh sách tin tức: ${error.message}`);
      toast.showError('Không thể tải danh sách tin tức. Vui lòng thử lại.');
      setNews([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (searchValue) => {
    setSearchTerm(searchValue);
    
    // Clear previous timeout
    if (window.newsSearchTimeout) {
      clearTimeout(window.newsSearchTimeout);
    }
    
    // Set new timeout for debouncing (wait 500ms after user stops typing)
    window.newsSearchTimeout = setTimeout(async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (searchValue.trim()) {
          const data = await newsService.searchNews(searchValue.trim());
          setNews(Array.isArray(data) ? data : []);
        } else {
          await fetchNews();
        }
      } catch (error) {
        console.error('Error searching news:', error);
        setError(`Lỗi tìm kiếm: ${error.message}`);
        toast.showError('Không thể tìm kiếm tin tức. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    }, 500);
  };

  const openDialog = (mode, newsItem = null) => {
    setDialogMode(mode);
    setSelectedNews(newsItem);
    
    if (mode === 'create') {
      setFormData({
        title: '',
        content: '',
        tags: '',
        imageUrl: ''
      });
    } else if (newsItem) {
      setFormData({
        title: newsItem.title || '',
        content: newsItem.content || '',
        tags: newsItem.tags || '',
        imageUrl: newsItem.imageUrl || ''
      });
    }
    
    setFormErrors({});
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setSelectedNews(null);
    setFormData({
      title: '',
      content: '',
      tags: '',
      imageUrl: ''
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
    const validation = newsService.validateNewsData(formData);
    setFormErrors(validation.errors);
    return validation.isValid;
  };

  const handleCreateNews = async () => {
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      await newsService.createNews(formData);
      await fetchNews();
      closeDialog();
      
      // Show success toast
      toast.showSuccess(`Đã tạo tin tức "${formData.title}" thành công!`);
      
    } catch (error) {
      console.error('Error creating news:', error);
      toast.showError('Không thể tạo tin tức mới. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateNews = async () => {
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      const newsId = selectedNews.newsId || selectedNews.NewsId;
      await newsService.updateNews(newsId, formData);
      await fetchNews();
      closeDialog();
      
      // Show success toast
      toast.showSuccess(`Đã cập nhật tin tức "${formData.title}" thành công!`);
      
    } catch (error) {
      console.error('Error updating news:', error);
      toast.showError('Không thể cập nhật tin tức. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNews = async (newsId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa tin tức này?')) return;
    
    try {
      // Find news title for success message
      const newsItem = news.find(n => n.newsId === newsId);
      const newsTitle = newsItem ? newsItem.title : 'tin tức';
      
      await newsService.deleteNews(newsId);
      await fetchNews();
      
      // Show success toast
      toast.showSuccess(`Đã xóa "${newsTitle}" thành công!`);
      
    } catch (error) {
      console.error('Error deleting news:', error);
      toast.showError('Không thể xóa tin tức. Vui lòng thử lại.');
    }
  };



  const columns = [
    {
      field: 'newsId',
      label: 'ID',
      minWidth: 70,
      render: (row) => row.newsId
    },
    {
      field: 'title',
      label: 'Tiêu đề',
      minWidth: 250,
      render: (row) => (
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          {row.title || 'Chưa có tiêu đề'}
        </Typography>
      )
    },

    {
      field: 'content',
      label: 'Nội dung',
      minWidth: 300,
      render: (row) => {
        const preview = row.content ? (row.content.length > 100 ? row.content.substring(0, 100) + '...' : row.content) : 'Chưa có nội dung';
        return (
          <Typography variant="body2" color="text.secondary">
            {preview}
          </Typography>
        );
      }
    },
    {
      field: 'tags',
      label: 'Tags',
      minWidth: 150,
      render: (row) => {
        if (!row.tags) return 'Chưa có';
        const tags = row.tags.split(',').map(tag => tag.trim()).slice(0, 3);
        return (
          <Box>
            {tags.map((tag, index) => (
              <Chip 
                key={index}
                label={tag} 
          size="small"
                variant="outlined"
                sx={{ mr: 0.5, mb: 0.5 }}
              />
            ))}
          </Box>
        );
      }
    },
    {
      field: 'createdAt',
      label: 'Ngày tạo',
      minWidth: 120,
      render: (row) => row.createdAt ? new Date(row.createdAt).toLocaleDateString('vi-VN') : 'Chưa có'
    },
    {
      field: 'actions',
      label: 'Thao tác',
      minWidth: 180,
      render: (row) => (
        <Box display="flex" gap={0.5}>
          <IconButton 
            size="small" 
            onClick={() => openDialog('view', row)}
            color="primary"
            title="Xem chi tiết"
          >
            <ViewIcon />
          </IconButton>
          <IconButton 
            size="small" 
            onClick={() => openDialog('edit', row)}
            color="warning"
            title="Chỉnh sửa"
          >
            <EditIcon />
          </IconButton>
          <IconButton 
            size="small" 
            onClick={() => handleDeleteNews(row.newsId)}
            color="error"
            title="Xóa"
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      )
    }
  ];

  const NewsCard = ({ newsItem }) => {
    const formattedNews = newsService.formatNewsData(newsItem);
    
    return (
      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {formattedNews.imageUrl && (
          <Box
            component="img"
            src={formattedNews.imageUrl}
            alt={formattedNews.title}
                  sx={{
                    height: 200,
              objectFit: 'cover',
              width: '100%'
            }}
          />
        )}
        <CardContent sx={{ flexGrow: 1 }}>
          <Box display="flex" justifyContent="flex-end" alignItems="center" mb={1}>
            <Typography variant="caption" color="text.secondary">
              {formattedNews.createdAt}
            </Typography>
                    </Box>
          
          <Typography variant="h6" component="h3" gutterBottom>
            {formattedNews.title}
          </Typography>
          
          <Typography variant="body2" color="text.secondary" mb={2}>
            {formattedNews.preview}
                  </Typography>
                  
          {formattedNews.tagsArray.length > 0 && (
            <Box mb={2}>
              {formattedNews.tagsArray.slice(0, 3).map((tag, index) => (
                      <Chip
                        key={index}
                  label={tag} 
                        size="small"
                        variant="outlined"
                  sx={{ mr: 0.5, mb: 0.5 }}
                      />
                    ))}
                  </Box>
          )}
                </CardContent>
                
        <CardActions sx={{ justifyContent: 'flex-end' }}>
          <Button 
            size="small" 
            onClick={() => openDialog('view', newsItem)}
            startIcon={<ViewIcon />}
            color="primary"
          >
            Xem
          </Button>
          <Button
            size="small"
            onClick={() => openDialog('edit', newsItem)}
            startIcon={<EditIcon />}
            color="warning"
          >
            Sửa
          </Button>
          <Button
            size="small"
            color="error"
            onClick={() => handleDeleteNews(newsItem.newsId)}
            startIcon={<DeleteIcon />}
          >
            Xóa
          </Button>
        </CardActions>
              </Card>
    );
  };

  // Show loading but with timeout to prevent infinite spinner
  const [showLoading, setShowLoading] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setShowLoading(false), 5000);
    if (news.length > 0) setShowLoading(false);
    return () => clearTimeout(timer);
  }, [news.length]);

  if (loading && news.length === 0 && showLoading) {
    return (
      <PageTemplate title="Quản lý tin tức" subtitle="Quản lý bài viết và tin tức cho khách hàng">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate title="Quản lý tin tức" subtitle="Quản lý bài viết và tin tức cho khách hàng">
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6">
            Danh sách tin tức ({news.length})
          </Typography>
          <Box display="flex" gap={1}>
            <Button
              variant={viewMode === 'table' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => setViewMode('table')}
            >
              Bảng
            </Button>
            <Button
              variant={viewMode === 'cards' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => setViewMode('cards')}
            >
              Thẻ
            </Button>


            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => openDialog('create')}
            >
              Thêm tin tức
            </Button>
          </Box>
        </Box>

        <SearchFilterBar
          searchValue={searchTerm}
          onSearchChange={(e) => handleSearch(e.target.value)}
          searchPlaceholder="Tìm kiếm theo tiêu đề, nội dung, tags..."
        />

        {viewMode === 'table' ? (
          <DataTable
            columns={columns}
            data={news}
            loading={loading}
            emptyMessage="Không có tin tức nào"
          />
        ) : (
          <Grid container spacing={3} sx={{ mt: 1 }}>
            {news.map((newsItem) => (
              <Grid item xs={12} sm={6} md={4} key={newsItem.newsId}>
                <NewsCard newsItem={newsItem} />
              </Grid>
            ))}
            {news.length === 0 && !loading && (
          <Grid item xs={12}>
                <Typography textAlign="center" color="text.secondary">
                  Không có tin tức nào
                </Typography>
              </Grid>
            )}
          </Grid>
        )}
      </Paper>

      {/* News Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={closeDialog}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          {dialogMode === 'create' && 'Thêm tin tức mới'}
          {dialogMode === 'edit' && 'Chỉnh sửa tin tức'}
          {dialogMode === 'view' && 'Chi tiết tin tức'}
        </DialogTitle>
        
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            <TextField
              label="Tiêu đề"
              value={formData.title}
              onChange={(e) => handleFormChange('title', e.target.value)}
              error={!!formErrors.title}
              helperText={formErrors.title}
              disabled={dialogMode === 'view'}
              fullWidth
            />
            
            <TextField
              label="Tags"
              value={formData.tags}
              onChange={(e) => handleFormChange('tags', e.target.value)}
              error={!!formErrors.tags}
              helperText={formErrors.tags || "Ngăn cách bằng dấu phẩy. Ví dụ: thú cưng, chăm sóc, tiêm phòng"}
              disabled={dialogMode === 'view'}
              fullWidth
              placeholder="Ngăn cách bằng dấu phẩy"
            />
          
          <TextField
              label="Nội dung"
              multiline
              rows={dialogMode === 'view' ? 8 : 6}
              value={formData.content}
              onChange={(e) => handleFormChange('content', e.target.value)}
              error={!!formErrors.content}
              helperText={formErrors.content || `${formData.content.length} ký tự`}
              disabled={dialogMode === 'view'}
            fullWidth
          />
          
          <TextField
              label="URL hình ảnh"
              value={formData.imageUrl}
              onChange={(e) => handleFormChange('imageUrl', e.target.value)}
              disabled={dialogMode === 'view'}
            fullWidth
            placeholder="https://example.com/image.jpg"
          />
          
            {formData.imageUrl && (
              <Box display="flex" justifyContent="center">
                <Box
                  component="img"
                  src={formData.imageUrl}
                  alt="Preview"
            sx={{ 
                    maxWidth: '100%',
                    maxHeight: 200,
                    objectFit: 'cover',
                    borderRadius: 1
                  }}
          />
        </Box>
            )}
            
            {dialogMode === 'view' && selectedNews && (
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Thông tin bổ sung:
                </Typography>
                <Typography variant="body2">
                  Ngày tạo: {selectedNews.createdAt ? new Date(selectedNews.createdAt).toLocaleString('vi-VN') : 'Chưa có'}
                </Typography>
                <Typography variant="body2">
                  Độ dài nội dung: {selectedNews.content?.length || 0} ký tự
                </Typography>
                {selectedNews.tags && (
                  <Typography variant="body2">
                    Tags: {selectedNews.tags}
                  </Typography>
                )}
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
              onClick={handleCreateNews}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              {loading ? 'Đang thêm...' : 'Thêm'}
            </Button>
          )}
          {dialogMode === 'edit' && (
            <Button 
              variant="contained" 
              onClick={handleUpdateNews}
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

export default NewsPage; 