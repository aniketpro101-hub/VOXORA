'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NumbersRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/instances');
  }, [router]);

  return null;
}
