import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldX } from 'lucide-react';
import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <ShieldX className="h-12 w-12 mx-auto text-red-600" />
          <CardTitle>Access Denied</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            You don't have permission to access this page.
          </p>
          <Link href="/dashboard">
            <Button>Go to Dashboard</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}