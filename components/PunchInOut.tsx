'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getDriverByDriverId, createPunchLog, getLastPunchLog } from '@/lib/firestore';
import { Driver, PunchLog } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import FaceRecognition from './FaceRecognition';
import { Clock, User, Hash } from 'lucide-react';
import { format } from 'date-fns';

interface PunchInOutProps {
  onPunchSuccess: (punchLog: PunchLog) => void;
}

export default function PunchInOut({ onPunchSuccess }: PunchInOutProps) {
  const { user } = useAuth();
  const [driver, setDriver] = useState<Driver | null>(null);
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastPunch, setLastPunch] = useState<PunchLog | null>(null);
  const [method, setMethod] = useState<'face' | 'pin'>('pin');

  useEffect(() => {
    console.log("User from AuthContext:", user);
    if (user?.driverId) {
      loadDriverData();
      loadLastPunch();
    }
  }, [user]);

  const loadDriverData = async () => {
    if (!user?.driverId) return;

    try {
      const driverData = await getDriverByDriverId(user.driverId);
      if (driverData) {
        setDriver(driverData);
      }
    } catch (error) {
      console.error('Error loading driver data:', error);
    }
  };

  const loadLastPunch = async () => {
    if (!user?.driverId) return;

    try {
      const lastPunchData = await getLastPunchLog(user.driverId);
      if (lastPunchData) {
        setLastPunch(lastPunchData);
      }
    } catch (error) {
      console.error('Error loading last punch:', error);
    }
  };

  const handlePunch = async (type: 'in' | 'out', method: 'face' | 'pin') => {
    if (!driver) return;

    setLoading(true);
    try {
      const punchLog: Omit<PunchLog, 'id'> = {
        driverId: driver.driverId,
        driverName: driver.name,
        type,
        timestamp: new Date(),
        method,
      };

      const newPunchLog = await createPunchLog(punchLog);
      
      setLastPunch(newPunchLog);
      onPunchSuccess(newPunchLog);
      setPin('');
    } catch (error) {
      console.error('Error recording punch:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePinPunch = () => {
    if (!driver?.pin || pin !== driver.pin) {
      alert('Invalid PIN');
      return;
    }

    const punchType = !lastPunch || lastPunch.type === 'out' ? 'in' : 'out';
    handlePunch(punchType, 'pin');
  };

  const handleFaceVerified = (verified: boolean) => {
    if (verified) {
      const punchType = !lastPunch || lastPunch.type === 'out' ? 'in' : 'out';
      handlePunch(punchType, 'face');
    }
  };

  if (!driver) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading driver information...</p>
        </CardContent>
      </Card>
    );
  }

  const nextPunchType = !lastPunch || lastPunch.type === 'out' ? 'in' : 'out';
  const isLoggedIn = lastPunch?.type === 'in';

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Driver Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">ID:</span>
              <span className="font-medium">{driver.driverId}</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Name:</span>
              <span className="font-medium">{driver.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Status:</span>
              <Badge variant={isLoggedIn ? 'default' : 'secondary'}>
                {isLoggedIn ? 'Punched In' : 'Punched Out'}
              </Badge>
            </div>
          </div>

          {lastPunch && (
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Last activity: {lastPunch.type === 'in' ? 'Punched In' : 'Punched Out'} on{' '}
                {format(lastPunch.timestamp, 'MMM dd, yyyy at hh:mm a')}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Punch {nextPunchType === 'in' ? 'In' : 'Out'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={method} onValueChange={(value) => setMethod(value as 'face' | 'pin')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="pin">PIN Entry</TabsTrigger>
              <TabsTrigger value="face">Face Recognition</TabsTrigger>
            </TabsList>

            <TabsContent value="pin" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pin">Enter your PIN</Label>
                <Input
                  id="pin"
                  type="password"
                  placeholder="Enter PIN"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  maxLength={6}
                />
              </div>
              <Button 
                onClick={handlePinPunch}
                disabled={loading || pin.length < 4}
                className="w-full"
                size="lg"
              >
                {loading ? 'Processing...' : `Punch ${nextPunchType === 'in' ? 'In' : 'Out'}`}
              </Button>
            </TabsContent>

            <TabsContent value="face">
              {method === 'face' && (
                <FaceRecognition
                  onFaceVerified={handleFaceVerified}
                  driverFaceDescriptor={driver.faceDescriptor}
                />
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}