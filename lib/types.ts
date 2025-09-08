export interface Driver {
  id: string;
  name: string;
  email: string;
  driverId: string;
  phone?: string;
  pin?: string;
  faceDescriptor?: number[];
  createdAt: Date;
  isActive: boolean;
}

export interface PunchLog {
  id: string;
  driverId: string;
  driverName: string;
  type: 'in' | 'out';
  timestamp: Date;
  method: 'face' | 'pin';
  location?: string;
}

export interface ReturnItem {
  itemName: string;
  quantity: number;
  condition: 'good' | 'damaged' | 'missing';
  notes?: string;
}

export interface ReturnForm {
  id: string;
  driverId: string;
  driverName: string;
  punchLogId: string;
  items: ReturnItem[];
  totalItems: number;
  submittedAt: Date;
  status: 'pending' | 'approved' | 'rejected';
}

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'driver';
  driverId?: string;
}