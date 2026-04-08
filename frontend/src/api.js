import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    }
});

// Request Interceptor: Attach Token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response Interceptor: Global 401 Handling
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response && error.response.status === 401) {
            console.warn("Session expired or unauthorized. Clearing local state.");
            
            // Wipe local storage
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            
            // Force a hard redirect to login to flush DataContext and React memory
            window.location.href = '/login?expired=true';
        }
        return Promise.reject(error);
    }
);

export default api;
