import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function LoadingSpinner({ label = 'Memuat data...', size = 'md' }: LoadingSpinnerProps) {
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-7 h-7',
    lg: 'w-10 h-10',
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-500">
      <Loader2 className={`${sizeMap[size]} animate-spin text-emerald-600`} />
      {label && <p className="text-sm font-medium">{label}</p>}
    </div>
  );
}
