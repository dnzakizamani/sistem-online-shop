'use client';

import { useEffect } from 'react';
import { isAuthenticated } from '../lib/auth';

export default function RootPage() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (isAuthenticated()) {
        window.location.replace('/dashboard');
      } else {
        window.location.replace('/login');
      }
    }
  }, []);

  return null;
}
