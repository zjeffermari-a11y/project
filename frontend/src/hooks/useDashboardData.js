import { useMemo } from 'react';

export function useDashboardData(engagements = [], user = {}) {
    const stats = useMemo(() => {
        if (!engagements) return { totalEngagements: 0, totalCompleted: 0, totalCount: 0, totalMovs: 0, complianceRate: 0 };

        let mCount = 0;
        let mSub = 0;
        
        engagements.forEach(eng => {
            if (eng.movs) {
                eng.movs.forEach(m => {
                    mCount++;
                    if (m.status === 'approved' || m.status === 'submitted') mSub++;
                });
            }
        });

        const totalCompleted = engagements.filter(e => e.status === 'completed').length;
        const totalCount = engagements.length;
        const totalOngoing = engagements.filter(e => e.status !== 'completed' && e.status !== 'follow_up').length;

        return {
            totalEngagements: totalOngoing,
            totalCompleted,
            totalCount,
            totalMovs: mCount,
            complianceRate: totalCount === 0 ? 0 : Math.round((totalCompleted / totalCount) * 100)
        };
    }, [engagements]);

    const allActivities = useMemo(() => {
        const activities = [];
        engagements.forEach(eng => {
            if (eng.created_at) {
                activities.push({
                    id: `eng-${eng.id}`,
                    engagementId: eng.id,
                    type: 'engagement',
                    title: eng.title,
                    action: 'Created',
                    user: 'System',
                    date: new Date(eng.created_at)
                });
            }
            if (eng.movs) {
                eng.movs.forEach(mov => {
                    if (mov.updated_at && mov.status !== 'pending') {
                        activities.push({
                            id: `mov-${mov.id}`,
                            engagementId: eng.id,
                            type: 'mov',
                            title: `MOV: ${mov.requirement_name}`,
                            action: mov.status === 'approved' ? 'Approved' : mov.status === 'returned' ? 'Returned' : 'Updated',
                            user: mov.auditee?.name || 'User',
                            date: new Date(mov.updated_at)
                        });
                    }
                });
            }
            if (eng.documents) {
                eng.documents.forEach(doc => {
                    if (doc.created_at) {
                        activities.push({
                            id: `doc-${doc.id}`,
                            engagementId: eng.id,
                            type: 'document',
                            title: doc.name,
                            action: 'Uploaded',
                            user: doc.uploader?.name || 'Unknown',
                            date: new Date(doc.created_at)
                        });
                    }
                });
            }
        });

        return activities.sort((a, b) => b.date - a.date);
    }, [engagements]);

    const recentActivities = useMemo(() => allActivities.slice(0, 5), [allActivities]);

    const getFilteredEngagements = (filter = 'all') => {
        return engagements.filter(eng => {
            if (filter === 'ongoing') return eng.status !== 'completed' && eng.status !== 'follow_up';
            if (filter === 'follow_up') return eng.status === 'follow_up';
            if (filter === 'completed') return eng.status === 'completed';
            return true;
        });
    };

    return {
        stats,
        allActivities,
        recentActivities,
        getFilteredEngagements
    };
}
