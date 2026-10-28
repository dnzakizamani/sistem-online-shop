'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { api } from '../../lib/api';
import { Order, Customer, PaginationMeta } from '../../types/index';
import { formatRupiah, formatDateTimeIndo } from '../../utils/format';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Pagination from '../../components/ui/Pagination';
import {
  ShoppingCart,
  PlusCircle,
  FileSpreadsheet,
  Calendar,
  Filter,
  Eye,
  RotateCcw,
} from 'lucide-react';
import Link from 'next/link';

export default function OrdersPage() {
  const [page, setPage] = useState(1);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [customerId, setCustomerId] = useState('');

  // Fetch customers for filter
  const { data: customerData } = useQuery<{ customers: Customer[] }>({
    queryKey: ['customers-filter'],
    queryFn: async () => {
      const res = await api.get('/customers?per_page=100');
      return { customers: res.data.data };
    },
  });

  // Fetch orders
  const { data, isLoading, isError, error, refetch } = useQuery<{
    orders: Order[];
    meta: PaginationMeta;
  }>({
    queryKey: ['orders', page, from, to, customerId],
    queryFn: async () => {
      const res = await api.get('/orders', {
        params: {
          page,
          per_page: 10,
          from: from || undefined,
          to: to || undefined,
          customer_id: customerId || undefined,
        },
      });
      return {
        orders: res.data.data,
        meta: res.data.meta,
      };
    },
  });

  const handleResetFilters = () => {
    setFrom('');
    setTo('');
    setCustomerId('');
    setPage(1);
  };

  // Bonus feature: Export to CSV
  const handleExportCSV = () => {
    if (!data || data.orders.length === 0) {
      alert('Tidak ada data pesanan untuk diekspor');
      return;
    }

    const headers = ['No Order', 'Pelanggan', 'No HP', 'Tanggal', 'Jumlah Item', 'Total Pembayaran (Rp)'];
    const rows = data.orders.map((o) => [
      o.order_number,
      `"${o.customer_name}"`,
      `"${o.customer_phone || '-'}"`,
      `"${o.order_date}"`,
      o.items_count,
      o.total_amount,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `riwayat_pesanan_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Riwayat Pesanan</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Daftar seluruh transaksi penjualan dengan filter tanggal dan pelanggan.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-semibold transition-all shadow-xs"
              title="Unduh Data CSV (Bonus Feature)"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Export CSV</span>
            </button>
            <Link
              href="/orders/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-all shadow-emerald-600/20"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Buat Pesanan Baru</span>
            </Link>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-xs flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <Filter className="w-4 h-4 text-slate-400" />
            <span>Filter:</span>
          </div>

          {/* From Date */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-sm">
            <span className="text-xs text-slate-400">Dari:</span>
            <input
              type="date"
              value={from}
              onChange={(e) => {
                setFrom(e.target.value);
                setPage(1);
              }}
              className="bg-transparent text-slate-700 outline-none text-xs font-medium"
            />
          </div>

          {/* To Date */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-sm">
            <span className="text-xs text-slate-400">Sampai:</span>
            <input
              type="date"
              value={to}
              onChange={(e) => {
                setTo(e.target.value);
                setPage(1);
              }}
              className="bg-transparent text-slate-700 outline-none text-xs font-medium"
            />
          </div>

          {/* Customer Dropdown */}
          <div className="flex-1 min-w-[200px]">
            <select
              value={customerId}
              onChange={(e) => {
                setCustomerId(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-white text-slate-700 outline-none focus:border-emerald-500"
            >
              <option value="">Semua Pelanggan</option>
              {customerData?.customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.customer_name}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Filters */}
          {(from || to || customerId) && (
            <button
              onClick={handleResetFilters}
              className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
              title="Reset Filter"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
          {isLoading && <LoadingSpinner label="Memuat riwayat transaksi..." />}

          {isError && (
            <div className="p-8 text-center text-red-600 text-sm">
              <p className="font-semibold">Gagal memuat riwayat pesanan</p>
              <p className="text-xs text-slate-500 mt-1">{(error as any)?.response?.data?.message || (error as any)?.message || 'Terjadi kesalahan sistem'}</p>
              <button
                onClick={() => refetch()}
                className="mt-3 px-3 py-1.5 text-xs font-semibold bg-red-50 text-red-700 hover:bg-red-100 rounded-lg transition-colors"
              >
                Coba Lagi
              </button>
            </div>
          )}

          {!isLoading && !isError && data && (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/75 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="py-3.5 px-4">No. Order</th>
                      <th className="py-3.5 px-4">Pelanggan</th>
                      <th className="py-3.5 px-4">Tanggal Pesanan</th>
                      <th className="py-3.5 px-4 text-center">Jumlah Item</th>
                      <th className="py-3.5 px-4 text-right">Total Transaksi</th>
                      <th className="py-3.5 px-4 text-center w-24">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.orders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4">
                          <span className="font-mono font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md text-xs">
                            {ord.order_number}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800">
                          {ord.customer_name}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {formatDateTimeIndo(ord.order_date)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                            {ord.items_count} pcs
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-emerald-600">
                          {formatRupiah(ord.total_amount)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <Link
                            href={`/orders/${ord.id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Detail</span>
                          </Link>
                        </td>
                      </tr>
                    ))}
                    {data.orders.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400">
                          <ShoppingCart className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                          <p className="text-sm font-medium">Tidak ada transaksi pesanan ditemukan</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-4">
                <Pagination meta={data.meta} onPageChange={(p) => setPage(p)} />
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
