import { Search } from '@mui/icons-material';
import {
    Box,
    FormControl,
    InputAdornment,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    TextField
} from '@mui/material';
import React from 'react';

const SearchFilterBar = ({ 
  searchValue, 
  onSearchChange, 
  searchPlaceholder = "Tìm kiếm...",
  filters = [],
  children,
  variant = "standard" // "standard" | "paper"
}) => {
  const content = (
    <Box sx={{ 
      display: 'flex', 
      gap: 2, 
      flexWrap: 'wrap',
      alignItems: 'center'
    }}>
      <TextField
        placeholder={searchPlaceholder}
        value={searchValue}
        onChange={onSearchChange}
        sx={{ 
          flex: 1, 
          minWidth: 300,
          '& .MuiOutlinedInput-root': { 
            borderRadius: 2,
            backgroundColor: 'background.paper'
          }
        }}
        size="small"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search sx={{ color: 'text.secondary' }} />
            </InputAdornment>
          ),
        }}
      />
      
      {filters.map((filter, index) => (
        <FormControl key={index} sx={{ minWidth: filter.minWidth || 120 }} size="small">
          <InputLabel>{filter.label}</InputLabel>
          <Select
            value={filter.value}
            onChange={filter.onChange}
            label={filter.label}
            sx={{ borderRadius: 2 }}
          >
            {filter.options.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      ))}
      
      {children}
    </Box>
  );

  if (variant === "paper") {
    return (
      <Paper 
        elevation={0} 
        sx={{ 
          p: 2, 
          border: '1px solid', 
          borderColor: 'divider',
          borderRadius: 2
        }}
      >
        {content}
      </Paper>
    );
  }

  return content;
};

export default SearchFilterBar; 