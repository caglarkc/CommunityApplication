# 📱 Frontend Integration Documentation

## 📋 Overview

This documentation provides comprehensive guidelines for frontend developers integrating with the Topluluk Backend microservices architecture. The backend consists of multiple specialized services that handle different aspects of the community management system.

## 🏗️ Backend Architecture Overview

```
Frontend Apps → Backend Microservices
     ↓
┌─────────────────────────────────────────┐
│           API Endpoints                 │
├─────────────────────────────────────────┤
│ Auth Service (Port 16040)               │
│ • User authentication                   │
│ • Session management                    │
│ • Token validation                      │
├─────────────────────────────────────────┤
│ Community Service (Port 16041)          │
│ • Community creation                    │
│ • File upload integration               │
│ • Role management                       │
└─────────────────────────────────────────┘
```

## 🔗 Service Endpoints

### Base URLs

```javascript
const API_ENDPOINTS = {
  AUTH_SERVICE: 'http://localhost:16040',
  COMMUNITY_SERVICE: 'http://localhost:16041',
  // Note: Upload service (16042) is internal only
};
```

### CORS Configuration

All services are configured to accept requests from:
- `http://localhost:3000` (React development)
- `http://localhost:5173` (Vite development)

## 🔐 Authentication Flow

### 1. User Registration

**Endpoint**: `POST /api/v1/auth/register`

```javascript
const registerUser = async (userData) => {
  try {
    const response = await fetch(`${API_ENDPOINTS.AUTH_SERVICE}/api/v1/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: userData.name,
        surname: userData.surname,
        email: userData.email,
        phone: userData.phone,
        password: userData.password,
        status: "user",
        universityName: userData.universityName,      // Optional
        universityDepartment: userData.universityDepartment, // Optional
        classYear: userData.classYear                 // Optional
      })
    });

    const result = await response.json();
    
    if (response.ok) {
      return result;
    } else {
      throw new Error(result.message || 'Registration failed');
    }
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};
```

### 2. User Login

**Endpoint**: `POST /api/v1/auth/login`

```javascript
const loginUser = async (credentials, deviceInfo) => {
  try {
    const response = await fetch(`${API_ENDPOINTS.AUTH_SERVICE}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: credentials.email,     // or phone
        password: credentials.password,
        deviceInfo: {
          platform: deviceInfo.platform,    // 'ios', 'android', 'web'
          model: deviceInfo.model,           // Device model
          version: deviceInfo.version        // OS version
        }
      })
    });

    const result = await response.json();
    
    if (response.ok) {
      // Store token securely
      localStorage.setItem('authToken', result.accessToken);
      return result;
    } else {
      throw new Error(result.message || 'Login failed');
    }
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};
```

### 3. Authentication Check (App Startup)

**Endpoint**: `POST /api/v1/auth/check`

```javascript
const checkAuthStatus = async (deviceInfo) => {
  try {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      return { isValid: false, reason: 'no_token' };
    }

    const response = await fetch(`${API_ENDPOINTS.AUTH_SERVICE}/api/v1/auth/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        deviceInfo: {
          platform: deviceInfo.platform,
          model: deviceInfo.model,
          version: deviceInfo.version
        }
      })
    });

    const result = await response.json();
    
    if (result.isValid) {
      return result;
    } else {
      // Clear invalid token
      if (result.clearToken) {
        localStorage.removeItem('authToken');
      }
      return result;
    }
  } catch (error) {
    console.error('Auth check error:', error);
    localStorage.removeItem('authToken');
    return { isValid: false, reason: 'network_error' };
  }
};
```

### 4. Token Refresh

**Endpoint**: `POST /api/v1/auth/refresh`

```javascript
const refreshToken = async (deviceInfo) => {
  try {
    const token = localStorage.getItem('authToken');
    
    const response = await fetch(`${API_ENDPOINTS.AUTH_SERVICE}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        deviceInfo: deviceInfo
      })
    });

    const result = await response.json();
    
    if (response.ok) {
      // Update stored token
      localStorage.setItem('authToken', result.accessToken);
      return result;
    } else {
      throw new Error(result.message || 'Token refresh failed');
    }
  } catch (error) {
    console.error('Token refresh error:', error);
    throw error;
  }
};
```

### 5. Logout

**Endpoint**: `POST /api/v1/auth/logout`

```javascript
const logoutUser = async () => {
  try {
    const token = localStorage.getItem('authToken');
    
    const response = await fetch(`${API_ENDPOINTS.AUTH_SERVICE}/api/v1/auth/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    // Clear token regardless of response
    localStorage.removeItem('authToken');
    
    return await response.json();
  } catch (error) {
    console.error('Logout error:', error);
    // Still clear token on error
    localStorage.removeItem('authToken');
  }
};
```

## 🏘️ Community Management

### Create Community with Files

**Endpoint**: `POST /api/v1/community-create/create`

```javascript
const createCommunity = async (communityData, files) => {
  try {
    const token = localStorage.getItem('authToken');
    
    // Create FormData for file upload
    const formData = new FormData();
    
    // Add text fields
    formData.append('name', communityData.name);
    formData.append('description', communityData.description);
    formData.append('universityName', communityData.universityName);
    formData.append('universityDepartment', communityData.universityDepartment);
    formData.append('leaderId', communityData.leaderId);
    
    // Add required files
    if (files.presidentDocument) {
      formData.append('presidentDocument', files.presidentDocument);
    }
    if (files.communityLogo) {
      formData.append('communityLogo', files.communityLogo);
    }
    
    // Add optional files
    if (files.coverPhoto) {
      formData.append('coverPhoto', files.coverPhoto);
    }

    const response = await fetch(`${API_ENDPOINTS.COMMUNITY_SERVICE}/api/v1/community-create/create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
        // Don't set Content-Type for FormData
      },
      body: formData
    });

    const result = await response.json();
    
    if (response.ok) {
      return result;
    } else {
      throw new Error(result.message || 'Community creation failed');
    }
  } catch (error) {
    console.error('Community creation error:', error);
    throw error;
  }
};
```

## 🔧 Utility Functions

### Device Information Helper

```javascript
const getDeviceInfo = () => {
  const userAgent = navigator.userAgent;
  
  let platform = 'web';
  let model = 'Browser';
  let version = 'Unknown';
  
  // Detect platform
  if (/iPhone|iPad|iPod/.test(userAgent)) {
    platform = 'ios';
    model = /iPhone/.test(userAgent) ? 'iPhone' : 'iPad';
    const match = userAgent.match(/OS (\d+)_(\d+)/);
    if (match) {
      version = `${match[1]}.${match[2]}`;
    }
  } else if (/Android/.test(userAgent)) {
    platform = 'android';
    model = 'Android Device';
    const match = userAgent.match(/Android (\d+\.?\d*)/);
    if (match) {
      version = match[1];
    }
  } else {
    // Web browser
    model = getBrowserName();
    version = getBrowserVersion();
  }
  
  return { platform, model, version };
};

const getBrowserName = () => {
  const userAgent = navigator.userAgent;
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari')) return 'Safari';
  if (userAgent.includes('Edge')) return 'Edge';
  return 'Unknown Browser';
};

const getBrowserVersion = () => {
  const userAgent = navigator.userAgent;
  const match = userAgent.match(/(Chrome|Firefox|Safari|Edge)\/(\d+)/);
  return match ? match[2] : 'Unknown';
};
```

### HTTP Client with Token Management

```javascript
class APIClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
    this.deviceInfo = getDeviceInfo();
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = localStorage.getItem('authToken');
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    }
    
    const config = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };
    
    try {
      const response = await fetch(url, config);
      const data = await response.json();
      
      if (response.ok) {
        return data;
      } else {
        // Handle token expiration
        if (response.status === 401) {
          localStorage.removeItem('authToken');
          window.location.href = '/login';
        }
        throw new Error(data.message || 'API request failed');
      }
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }

  // GET request
  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  // POST request
  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // POST with FormData (for file uploads)
  async postFormData(endpoint, formData) {
    return this.request(endpoint, {
      method: 'POST',
      headers: {}, // Let browser set Content-Type for FormData
      body: formData,
    });
  }
}

// Service clients
const authAPI = new APIClient(API_ENDPOINTS.AUTH_SERVICE);
const communityAPI = new APIClient(API_ENDPOINTS.COMMUNITY_SERVICE);
```

## 📱 React Integration Examples

### Auth Context Provider

```jsx
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setLoading(true);
      const deviceInfo = getDeviceInfo();
      const result = await checkAuthStatus(deviceInfo);
      
      if (result.isValid) {
        setIsAuthenticated(true);
        // Optionally fetch user details
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      const deviceInfo = getDeviceInfo();
      const result = await loginUser(credentials, deviceInfo);
      
      setUser(result.user);
      setIsAuthenticated(true);
      
      return result;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await logoutUser();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    checkAuthStatus,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
```

### Protected Route Component

```jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
```

### Login Component

```jsx
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const LoginForm = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(formData);
      navigate('/dashboard');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}
      
      <input
        type="email"
        name="email"
        placeholder="Email"
        value={formData.email}
        onChange={handleChange}
        required
      />
      
      <input
        type="password"
        name="password"
        placeholder="Password"
        value={formData.password}
        onChange={handleChange}
        required
      />
      
      <button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
};

export default LoginForm;
```

### Community Creation Component

```jsx
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const CreateCommunityForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    universityName: '',
    universityDepartment: ''
  });
  
  const [files, setFiles] = useState({
    presidentDocument: null,
    communityLogo: null,
    coverPhoto: null
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { user } = useAuth();

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e) => {
    setFiles({
      ...files,
      [e.target.name]: e.target.files[0]
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const communityData = {
        ...formData,
        leaderId: user.id
      };

      const result = await createCommunity(communityData, files);
      
      // Handle success
      console.log('Community created:', result);
      
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} encType="multipart/form-data">
      {error && <div className="error">{error}</div>}
      
      {/* Text inputs */}
      <input
        type="text"
        name="name"
        placeholder="Community Name"
        value={formData.name}
        onChange={handleInputChange}
        required
      />
      
      <textarea
        name="description"
        placeholder="Community Description"
        value={formData.description}
        onChange={handleInputChange}
        required
      />
      
      <input
        type="text"
        name="universityName"
        placeholder="University Name"
        value={formData.universityName}
        onChange={handleInputChange}
        required
      />
      
      <input
        type="text"
        name="universityDepartment"
        placeholder="Department"
        value={formData.universityDepartment}
        onChange={handleInputChange}
        required
      />
      
      {/* File inputs */}
      <div>
        <label>President Document (Required):</label>
        <input
          type="file"
          name="presidentDocument"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleFileChange}
          required
        />
      </div>
      
      <div>
        <label>Community Logo (Required):</label>
        <input
          type="file"
          name="communityLogo"
          accept=".jpg,.jpeg,.png,.webp"
          onChange={handleFileChange}
          required
        />
      </div>
      
      <div>
        <label>Cover Photo (Optional):</label>
        <input
          type="file"
          name="coverPhoto"
          accept=".jpg,.jpeg,.png,.webp"
          onChange={handleFileChange}
        />
      </div>
      
      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create Community'}
      </button>
    </form>
  );
};

export default CreateCommunityForm;
```

## 🔍 Error Handling Best Practices

### Error Types and Handling

```javascript
const handleAPIError = (error, context) => {
  console.error(`Error in ${context}:`, error);
  
  // Network errors
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return 'Network error. Please check your connection.';
  }
  
  // HTTP errors
  if (error.message.includes('401')) {
    localStorage.removeItem('authToken');
    window.location.href = '/login';
    return 'Session expired. Please login again.';
  }
  
  if (error.message.includes('403')) {
    return 'Access denied. You don\'t have permission for this action.';
  }
  
  if (error.message.includes('404')) {
    return 'Resource not found.';
  }
  
  if (error.message.includes('409')) {
    return 'Conflict. The resource already exists.';
  }
  
  if (error.message.includes('413')) {
    return 'File too large. Maximum size is 10MB.';
  }
  
  if (error.message.includes('500')) {
    return 'Server error. Please try again later.';
  }
  
  // Default error message
  return error.message || 'An unexpected error occurred.';
};
```

## 🧪 Testing Considerations

### API Testing with Mock Data

```javascript
// Mock API responses for testing
const mockAuthAPI = {
  login: async (credentials) => {
    return {
      success: true,
      accessToken: 'mock-token',
      user: {
        id: 'mock-user-id',
        email: credentials.email,
        name: 'Mock User'
      }
    };
  },
  
  checkAuth: async () => {
    return {
      isValid: true,
      userId: 'mock-user-id'
    };
  }
};

// Use in tests
if (process.env.NODE_ENV === 'test') {
  // Use mock API
} else {
  // Use real API
}
```

## 🔧 Configuration Management

### Environment Variables

```javascript
// .env file
REACT_APP_AUTH_SERVICE_URL=http://localhost:16040
REACT_APP_COMMUNITY_SERVICE_URL=http://localhost:16041
REACT_APP_ENVIRONMENT=development

// Config file
const config = {
  authServiceURL: process.env.REACT_APP_AUTH_SERVICE_URL || 'http://localhost:16040',
  communityServiceURL: process.env.REACT_APP_COMMUNITY_SERVICE_URL || 'http://localhost:16041',
  environment: process.env.REACT_APP_ENVIRONMENT || 'development'
};

export default config;
```

This documentation provides a solid foundation for frontend developers to integrate with the Topluluk backend services effectively. 