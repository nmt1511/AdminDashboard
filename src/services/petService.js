import apiService from './apiService';

class PetService {
  // Get all pets (admin)
  async getAllPets() {
    const result = await apiService.getWithParams('Pet/admin', { page: 1, limit: 1000 });
    console.log('getAllPets response:', result);
    // Backend trả về { pets: [...], pagination: {...} }
    return result?.pets || [];
  }

  // Get pet by ID (admin)
  async getPetById(id) {
    return await apiService.getById('Pet/admin', id);
  }

  // Create new pet (admin) - requires customerId in query params
  async createPet(petData) {
    const { customerId, name, species, breed, birthDate, imageUrl, gender } = petData;
    
    // Chỉ gửi các trường mà backend mong đợi
    const petDto = {
      name: name || '',
      species: species || null,
      breed: breed || null,
      birthDate: birthDate || null,
      imageUrl: imageUrl || null,
      gender: gender || null
    };
    
    // Tạo query string với customerId
    const queryParams = new URLSearchParams({ customerId: customerId.toString() });
    const url = `Pet/admin?${queryParams.toString()}`;
    
    console.log('Creating pet with data:', petDto);
    console.log('Customer ID:', customerId);
    
    // Gọi API với customerId làm query parameter
    return await apiService.create(url, petDto);
  }

  // Update pet (admin)
  async updatePet(id, petData) {
    const { name, species, breed, birthDate, imageUrl, gender } = petData;
    
    // Chỉ gửi các trường mà backend mong đợi
    const petDto = {
      name: name || '',
      species: species || null,
      breed: breed || null,
      birthDate: birthDate || null,
      imageUrl: imageUrl || null,
      gender: gender || null
    };
    
    console.log('Updating pet with data:', petDto);
    
    return await apiService.update('Pet/admin', id, petDto);
  }

  // Delete pet (admin)
  async deletePet(id) {
    return await apiService.delete('Pet/admin', id);
  }



  // Search pets (admin)
  async searchPets(searchTerm) {
    const result = await apiService.getWithParams('Pet/admin/search', { query: searchTerm, page: 1, limit: 1000 });
    console.log('searchPets response:', result);
    // Backend trả về { pets: [...], pagination: {...}, searchQuery: "..." }
    return result?.pets || [];
  }

  // Get pets by customer (admin)
  async getPetsByCustomer(customerId) {
    return await apiService.getWithParams('Pet/admin', { customerId, page: 1, limit: 1000 });
  }

  // Get pet species options
  getSpeciesOptions() {
    return [
      { value: 'Chó', label: 'Chó' },
      { value: 'Mèo', label: 'Mèo' },
      { value: 'Chim', label: 'Chim' },
      { value: 'Thỏ', label: 'Thỏ' },
      { value: 'Hamster', label: 'Hamster' },
      { value: 'Khác', label: 'Khác' }
    ];
  }

  // Get gender options
  getGenderOptions() {
    return [
      { value: 'Đực', label: 'Đực' },
      { value: 'Cái', label: 'Cái' }
    ];
  }

  // Format pet data for display
  formatPetData(pet) {
    return {
      ...pet,
      birthDate: pet.birthDate ? new Date(pet.birthDate).toLocaleDateString('vi-VN') : 'Chưa có',
      age: pet.birthDate ? this.calculateAge(pet.birthDate) : 'Chưa có'
    };
  }

  // Calculate age from birth date
  calculateAge(birthDate) {
    const today = new Date();
    const birth = new Date(birthDate);
    const diffTime = Math.abs(today - birth);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) {
      return `${diffDays} ngày`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} tháng`;
    } else {
      const years = Math.floor(diffDays / 365);
      const months = Math.floor((diffDays % 365) / 30);
      return months > 0 ? `${years} năm ${months} tháng` : `${years} năm`;
    }
  }

  // Format birth date for form input (YYYY-MM-DD)
  formatBirthDateForInput(birthDate) {
    if (!birthDate) return '';
    
    console.log('🗓️ Formatting birth date for input:', birthDate, 'Type:', typeof birthDate);
    
    try {
      // Handle different input formats
      if (typeof birthDate === 'string') {
        // Case 1: Already in YYYY-MM-DD format
        if (/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
          console.log('🗓️ Already in YYYY-MM-DD format:', birthDate);
          return birthDate;
        }
        
        // Case 2: ISO datetime string (YYYY-MM-DDTHH:mm:ss)
        if (birthDate.includes('T')) {
          const formatted = birthDate.split('T')[0];
          console.log('🗓️ Converted from ISO datetime:', formatted);
          return formatted;
        }
        
        // Case 3: DD/MM/YYYY format
        if (birthDate.includes('/')) {
          const parts = birthDate.split('/');
          if (parts.length === 3) {
            // Assume DD/MM/YYYY and convert to YYYY-MM-DD
            const [day, month, year] = parts;
            const formatted = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            console.log('🗓️ Converted from DD/MM/YYYY:', formatted);
            return formatted;
          }
        }
        
        // Case 4: Try parsing as Date
        const date = new Date(birthDate);
        if (!isNaN(date.getTime())) {
          const formatted = date.toISOString().split('T')[0];
          console.log('🗓️ Converted from Date string:', formatted);
          return formatted;
        }
      }
      
      // Case 5: Date object
      if (birthDate instanceof Date) {
        const formatted = birthDate.toISOString().split('T')[0];
        console.log('🗓️ Converted from Date object:', formatted);
        return formatted;
      }
      
      console.log('🗓️ Could not format birth date, returning empty string');
      return '';
    } catch (error) {
      console.error('🗓️ Error formatting birth date:', error);
      return '';
    }
  }
}

const petService = new PetService();
export default petService; 