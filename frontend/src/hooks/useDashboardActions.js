import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export function useDashboardActions(refreshData) {
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const navigate = useNavigate();

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            await api.post('/logout');
        } catch (e) {
            console.error('Logout error:', e);
        }
        setTimeout(() => {
            localStorage.clear();
            navigate('/login');
        }, 1200);
    };

    const handleNavigateToWorkspace = (id) => {
        navigate(`/auditor/workspace/${id}`);
    };

    return {
        isLoggingOut,
        handleLogout,
        handleNavigateToWorkspace,
        refreshData
    };
}
