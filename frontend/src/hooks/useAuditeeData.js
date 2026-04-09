import { useState, useMemo } from 'react';

export function useAuditeeData(engagements = [], user = {}) {
    const data = useMemo(() => {
        let totalMovs = 0;
        let submittedMovsCount = 0;
        const pendingTasks = [];
        const recentSubmissions = [];
        const ongoingAudits = [];
        const followUpAudits = [];

        engagements.forEach(eng => {
            const myMovs = eng.movs?.filter(m => m.auditee_id === user.id) || [];
            if (myMovs.length === 0) return;

            const total = myMovs.length;
            const approved = myMovs.filter(m => m.status === 'approved').length;
            const submitted = myMovs.filter(m => m.status === 'submitted').length;
            const returned = myMovs.filter(m => m.status === 'returned').length;
            const pending = myMovs.filter(m => m.status === 'pending').length;
            const compRate = total === 0 ? 0 : Math.round((approved / total) * 100);

            if (['completed', 'follow_up'].includes(eng.status)) {
                followUpAudits.push({ 
                    eng, 
                    myMovs, 
                    total, 
                    approved, 
                    compRate,
                    status: eng.status
                });
            } else {
                ongoingAudits.push({ 
                    eng, 
                    myMovs, 
                    total, 
                    approved, 
                    submitted, 
                    returned, 
                    pending,
                    status: eng.status
                });
            }

            myMovs.forEach(mov => {
                totalMovs++;
                if (mov.status === 'submitted' || mov.status === 'approved') {
                    submittedMovsCount++;
                    recentSubmissions.push({
                        id: mov.id,
                        name: mov.requirement_name,
                        date: new Date(mov.updated_at).toLocaleDateString(),
                        status: mov.status,
                        statusLabel: mov.status === 'approved' ? 'Approved' : 'Pending Review'
                    });
                } else {
                    pendingTasks.push({
                        id: mov.id,
                        engId: eng.id,
                        title: mov.requirement_name,
                        type: mov.status === 'returned' ? 'Returned for Revision' : 'Initial MOV',
                        due: eng.end_date || 'TBD',
                        urgent: mov.status === 'returned'
                    });
                }
            });
        });

        // Sort recent submissions by date (descending)
        recentSubmissions.sort((a, b) => new Date(b.date) - new Date(a.date));

        const complianceRate = totalMovs === 0 ? 0 : Math.round((submittedMovsCount / totalMovs) * 100);

        return {
            complianceRate,
            ongoingAudits,
            followUpAudits,
            pendingTasks,
            recentSubmissions,
            totalMovs,
            submittedMovsCount
        };
    }, [engagements, user.id]);

    return data;
}
