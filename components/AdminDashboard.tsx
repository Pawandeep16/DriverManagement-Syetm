'use client';

import { useState, useEffect } from 'react';
import { getDrivers, getPunchLogs, getReturnForms, updateReturnForm, subscribeToReturnForms, subscribeToPunchLogs } from '@/lib/firestore';
import { Driver, PunchLog, ReturnForm } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  Users, 
  Clock, 
  FileText, 
  Search, 
  Eye, 
  CheckCircle, 
  XCircle,
  Calendar,
  TrendingUp
} from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';

export default function AdminDashboard() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [punchLogs, setPunchLogs] = useState<PunchLog[]>([]);
  const [returnForms, setReturnForms] = useState<ReturnForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState('overview');

  useEffect(() => {
    loadData();
    
    // Set up real-time listeners
    const unsubscribeForms = subscribeToReturnForms(setReturnForms);
    const unsubscribeLogs = subscribeToPunchLogs(setPunchLogs);
    
    return () => {
      unsubscribeForms();
      unsubscribeLogs();
    };
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadDrivers(),
        loadPunchLogs(),
        loadReturnForms()
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDrivers = async () => {
    const driversData = await getDrivers();
    setDrivers(driversData);
  };

  const loadPunchLogs = async () => {
    const logsData = await getPunchLogs();
    setPunchLogs(logsData);
  };

  const loadReturnForms = async () => {
    const formsData = await getReturnForms();
    setReturnForms(formsData);
  };

  const updateFormStatus = async (formId: string, status: 'approved' | 'rejected') => {
    try {
      await updateReturnForm(formId, { status });
      setReturnForms(prev => 
        prev.map(form => 
          form.id === formId ? { ...form, status } : form
        )
      );
    } catch (error) {
      console.error('Error updating form status:', error);
    }
  };

  const getDateLabel = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMM dd, yyyy');
  };

  const todayPunches = punchLogs.filter(log => isToday(log.timestamp));
  const activePunches = todayPunches.filter(log => log.type === 'in');
  const pendingForms = returnForms.filter(form => form.status === 'pending');

  const filteredDrivers = drivers.filter(driver =>
    driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.driverId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredLogs = punchLogs.filter(log =>
    log.driverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.driverId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredForms = returnForms.filter(form =>
    form.driverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    form.driverId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-center text-muted-foreground">Loading dashboard...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search drivers, forms..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="drivers">Drivers</TabsTrigger>
          <TabsTrigger value="logs">Punch Logs</TabsTrigger>
          <TabsTrigger value="forms">Return Forms</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Drivers</p>
                    <p className="text-3xl font-bold">{drivers.length}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Today</p>
                    <p className="text-3xl font-bold">{activePunches.length}</p>
                  </div>
                  <Clock className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Today's Punches</p>
                    <p className="text-3xl font-bold">{todayPunches.length}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Pending Forms</p>
                    <p className="text-3xl font-bold">{pendingForms.length}</p>
                  </div>
                  <FileText className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Punch Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {punchLogs.slice(0, 5).map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{log.driverName}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(log.timestamp, 'hh:mm a')}
                        </p>
                      </div>
                      <Badge variant={log.type === 'in' ? 'default' : 'secondary'}>
                        {log.type === 'in' ? 'In' : 'Out'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pending Return Forms</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingForms.slice(0, 5).map((form) => (
                    <div key={form.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{form.driverName}</p>
                        <p className="text-sm text-muted-foreground">
                          {form.totalItems} items • {format(form.submittedAt, 'hh:mm a')}
                        </p>
                      </div>
                      <Badge variant="outline">
                        Pending
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="drivers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Driver Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredDrivers.map((driver) => (
                  <Card key={driver.id} className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">{driver.name}</h3>
                        <Badge variant={driver.isActive ? 'default' : 'secondary'}>
                          {driver.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">ID: {driver.driverId}</p>
                      <p className="text-sm text-muted-foreground">{driver.email}</p>
                      {driver.phone && (
                        <p className="text-sm text-muted-foreground">{driver.phone}</p>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Punch Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Driver</th>
                      <th className="text-left p-2">ID</th>
                      <th className="text-left p-2">Type</th>
                      <th className="text-left p-2">Method</th>
                      <th className="text-left p-2">Time</th>
                      <th className="text-left p-2">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map((log) => (
                      <tr key={log.id} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-medium">{log.driverName}</td>
                        <td className="p-2 text-muted-foreground">{log.driverId}</td>
                        <td className="p-2">
                          <Badge variant={log.type === 'in' ? 'default' : 'secondary'}>
                            {log.type === 'in' ? 'In' : 'Out'}
                          </Badge>
                        </td>
                        <td className="p-2">
                          <Badge variant="outline">
                            {log.method === 'face' ? 'Face' : 'PIN'}
                          </Badge>
                        </td>
                        <td className="p-2">{format(log.timestamp, 'hh:mm a')}</td>
                        <td className="p-2">{getDateLabel(log.timestamp)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forms" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Return Forms</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredForms.map((form) => (
                  <Card key={form.id} className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{form.driverName}</h3>
                          <Badge 
                            variant={
                              form.status === 'approved' ? 'default' :
                              form.status === 'rejected' ? 'destructive' : 'secondary'
                            }
                          >
                            {form.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Driver ID: {form.driverId} • {form.totalItems} items
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Submitted: {format(form.submittedAt, 'MMM dd, yyyy hh:mm a')}
                        </p>
                        <div className="mt-2">
                          <p className="text-sm font-medium mb-1">Items:</p>
                          <div className="space-y-1">
                            {form.items.slice(0, 3).map((item, index) => (
                              <p key={index} className="text-xs text-muted-foreground">
                                {item.itemName} (Qty: {item.quantity}, {item.condition})
                              </p>
                            ))}
                            {form.items.length > 3 && (
                              <p className="text-xs text-muted-foreground">
                                +{form.items.length - 3} more items...
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {form.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => updateFormStatus(form.id, 'approved')}
                            className="flex items-center gap-1"
                          >
                            <CheckCircle className="h-3 w-3" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => updateFormStatus(form.id, 'rejected')}
                            className="flex items-center gap-1"
                          >
                            <XCircle className="h-3 w-3" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}