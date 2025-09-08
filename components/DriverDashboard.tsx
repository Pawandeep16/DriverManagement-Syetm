'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PunchLog } from '@/lib/types';
import PunchInOut from '@/components/PunchInOut';
import ReturnForm from '@/components/ReturnForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

export default function DriverDashboard() {
  const { user, logout } = useAuth();
  const [currentPunchLog, setCurrentPunchLog] = useState<PunchLog | null>(null);
  const [showReturnForm, setShowReturnForm] = useState(false);

  const handlePunchSuccess = (punchLog: PunchLog) => {
    if (punchLog.type === 'in') {
      setCurrentPunchLog(punchLog);
      setShowReturnForm(true);
    } else {
      setCurrentPunchLog(null);
      setShowReturnForm(false);
    }
  };

  const handleFormSubmitted = () => {
    setShowReturnForm(false);
    setCurrentPunchLog(null);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Driver Portal</h1>
          <p className="text-muted-foreground">Welcome back, {user?.email}</p>
        </div>
        <Button onClick={handleLogout} variant="outline" className="flex items-center gap-2">
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>

      {!showReturnForm && (
        <PunchInOut onPunchSuccess={handlePunchSuccess} />
      )}

      {showReturnForm && currentPunchLog && (
        <ReturnForm 
          punchLog={currentPunchLog} 
          onFormSubmitted={handleFormSubmitted}
        />
      )}
    </div>
  );
}