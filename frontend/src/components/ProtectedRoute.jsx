import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children, designation, designations }) {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');

    if (!token || !user) {
        return <Navigate to="/login" replace />;
    }

    if (designations && Array.isArray(designations)) {
        if (!designations.includes(user.designation)) {
            return <Navigate to="/" replace />;
        }
    } else if (designation && user.designation !== designation) {
        return <Navigate to="/" replace />;
    }

    return children;
}
