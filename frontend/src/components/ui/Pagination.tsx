'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PaginationMeta } from '../../types/index';

interface PaginationProps {
  meta?: PaginationMeta;
  onPageChange: (page: number) => void;
}

export default function Pagination({ meta, onPageChange }: PaginationProps) {
  if (!meta || meta.total_pages <= 1) return null;

  const { page, total_pages, total, per_page } = meta;
  const startItem = (page - 1) * per_page + 1;
  const endItem = Math.min(page * per_page, total);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-2 border-t border-slate-100 text-sm text-slate-600">
      <div>
        Menampilkan <span className="font-semibold text-slate-800">{startItem}</span> -{' '}
        <span className="font-semibold text-slate-800">{endItem}</span> dari{' '}
        <span className="font-semibold text-slate-800">{total}</span> data
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Halaman Sebelumnya"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <span className="px-3 py-1 font-medium text-slate-800 bg-slate-50 rounded-lg border border-slate-200 text-xs">
          Hal. {page} dari {total_pages}
        </span>

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= total_pages}
          className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Halaman Berikutnya"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
