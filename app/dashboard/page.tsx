'use client';

import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminDashboard from '@/components/AdminDashboard';
import DriverDashboard from '@/components/DriverDashboard';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {user?.role === 'admin' ? <AdminDashboard /> : <DriverDashboard />}
      </div>
    </ProtectedRoute>
  );
}