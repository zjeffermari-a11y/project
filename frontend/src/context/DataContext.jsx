import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api';

const DataContext = createContext();

export const useDataContext = () => {
    const context = useContext(DataContext);
    if (!context) {
        throw new Error('useDataContext must be used within a DataProvider');
    }
    return context;
};

export const DataProvider = ({ children }) => {
    const [engagements, setEngagements] = useState([]);
    const [auditees, setAuditees] = useState([]);
    const [availableAuditors, setAvailableAuditors] = useState([]);
    const [pendingUsers, setPendingUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [initialLoad, setInitialLoad] = useState(true);
    const [error, setError] = useState(null);
    const [lastFetched, setLastFetched] = useState(null);

    const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

    const fetchData = useCallback(async (force = false) => {
        const now = Date.now();
        if (!force && lastFetched && (now - lastFetched < CACHE_TTL)) {
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const user = JSON.parse(localStorage.getItem('user'));
            if (!user) {
                 setLoading(false);
                 setInitialLoad(false);
                 return;
            }

            // Parallel fetching for performance
            const fetchPromises = [
                api.get('/engagements'),
                api.get('/auditees')
            ];

            // Only managers and auditors get auditor list
            if (['director', 'division_chief', 'assistant_division_chief', 'lead_auditor', 'auditor'].includes(user.designation)) {
                fetchPromises.push(api.get('/users/auditors'));
            }

            // Only directors and division chiefs get pending users
            if (['director', 'division_chief', 'assistant_division_chief'].includes(user.designation)) {
                fetchPromises.push(api.get('/users/pending'));
            }

            const results = await Promise.allSettled(fetchPromises);

            if (results[0].status === 'fulfilled') setEngagements(results[0].value.data);
            if (results[1].status === 'fulfilled') setAuditees(results[1].value.data);
            
            // Map remaining results based on role-specific pushes
            let resIdx = 2;
            if (['director', 'division_chief', 'assistant_division_chief', 'lead_auditor', 'auditor'].includes(user.designation)) {
                if (results[resIdx]?.status === 'fulfilled') setAvailableAuditors(results[resIdx].value.data);
                resIdx++;
            }
            if (['director', 'division_chief', 'assistant_division_chief'].includes(user.designation)) {
                if (results[resIdx]?.status === 'fulfilled') setPendingUsers(results[resIdx].value.data);
            }

            setLastFetched(now);
        } catch (err) {
            console.error('Failed to sync data:', err);
            setError(err.message);
        } finally {
            setLoading(false);
            setInitialLoad(false);
        }
    }, [lastFetched]);

    // Background sync on focus
    useEffect(() => {
        const handleFocus = () => fetchData();
        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, [fetchData]);

    // Initial fetch
    useEffect(() => {
        fetchData();
    }, []);

    const value = {
        engagements,
        setEngagements,
        auditees,
        setAuditees,
        availableAuditors,
        setAvailableAuditors,
        pendingUsers,
        setPendingUsers,
        loading,
        initialLoad,
        error,
        refreshData: () => fetchData(true),
        lastFetched
    };

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
};
