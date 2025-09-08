'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card } from '@/components/ui/card';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'driver';
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (requiredRole && user.role !== requiredRole) {
        router.push('/unauthorized');
      }
    }
  }, [user, loading, requiredRole, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-center text-muted-foreground">Loading...</p>
        </Card>
      </div>
    );
  }

  if (!user || (requiredRole && user.role !== requiredRole)) {
    return null;
  }

  return <>{children}</>;
}