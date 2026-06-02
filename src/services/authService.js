import { authAPI } from './api';

// Login
export const loginUser = async (email, password) => {
  try {
    // Validation
    if (!email || !password) {
      throw new Error('Email dan password harus diisi');
    }
    if (!email.includes('@')) {
      throw new Error('Email tidak valid');
    }
    if (password.length < 6) {
      throw new Error('Password minimal 6 karakter');
    }
    
    return {
      success: true,
      data: {
        user: {
          id: 1,
          name: 'Test User',
          email: email
        },
        token: 'test-token-' + Date.now()
      }
    };
  } catch (error) {
    console.error('Error logging in:', error);
    throw error;
  }
};

// Register
export const registerUser = async (name, email, password, confirmPassword) => {
  try {
    // Validation
    if (!name || !email || !password || !confirmPassword) {
      throw new Error('Semua field harus diisi');
    }
    if (!email.includes('@')) {
      throw new Error('Email tidak valid');
    }
    if (password.length < 6) {
      throw new Error('Password minimal 6 karakter');
    }
    if (password !== confirmPassword) {
      throw new Error('Konfirmasi password tidak cocok');
    }
    
    const response = await authAPI.register({
      full_name: name,
      email,
      password,
    });

    return response.data;
  } catch (error) {
    console.error('Error registering:', error);
    throw error;
  }
};

// Logout
export const logoutUser = async () => {
  try {
    return {
      success: true,
      message: 'Logout successful'
    };
  } catch (error) {
    console.error('Error logging out:', error);
    throw error;
  }
};

// Get current user
export const getCurrentUser = async (token) => {
  try {
    return {
      success: true,
      data: null
    };
  } catch (error) {
    console.error('Error fetching current user:', error);
    throw error;
  }
};

// Update profile
export const updateProfile = async (profileData, token) => {
  try {  
    return {
      success: true,
      data: profileData
    };
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
};

// Change password
export const changePassword = async (oldPassword, newPassword, confirmPassword, token) => {
  try {
    // Validation
    if (!oldPassword || !newPassword || !confirmPassword) {
      throw new Error('Semua field harus diisi');
    }
    if (newPassword.length < 6) {
      throw new Error('Password minimal 6 karakter');
    }
    if (newPassword !== confirmPassword) {
      throw new Error('Konfirmasi password tidak cocok');
    }
    
    return {
      success: true,
      message: 'Password changed successfully'
    };
  } catch (error) {
    console.error('Error changing password:', error);
    throw error;
  }
};
