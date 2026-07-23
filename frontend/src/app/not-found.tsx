import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 text-center">
      <div className="max-w-md space-y-6">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-rose-500/10 text-rose-500">
          <AlertCircle className="h-10 w-10" />
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground">404 - Page Not Found</h1>
          <p className="text-sm text-muted-foreground">
            The requested VOXORA page or resource does not exist or has been moved.
          </p>
        </div>
        <Link href="/dashboard">
          <Button className="w-full">Return to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
