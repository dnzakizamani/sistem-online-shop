'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { api } from '../../lib/api';
import { DashboardSummary } from '../../types/index';
import { formatRupiah, formatDateIndo } from '../../utils/format';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import {
  TrendingUp,
  ShoppingBag,
  AlertTriangle,
  Package,
  ArrowUpRight,
  RefreshCw,
  PlusCircle,
} from 'lucide-react';
import Link from 'next/link';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function DashboardPage() {
  const { data, isLoading, isError, error, refetch } = useQuery<DashboardSummary>({
    queryKey: ['dashboard-summary'],
    queryFn: async () => {
      const res = await api.get('/dashboard/summary');
      return res.data.data;
    },
  });

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Dashboard Ringkasan
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Pantau performa penjualan, pesanan, dan status inventori secara real-time.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => refetch()}
              className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors shadow-xs"
              title="Perbarui Data"
            >
              <RefreshCw className="w-4 h-4" />
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

        {/* Loading & Error State */}
        {isLoading && <LoadingSpinner label="Memuat data dashboard..." />}
        {isError && (
          <div className="p-6 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm">
            Gagal memuat data dashboard: {(error as any)?.message || 'Terjadi kesalahan'}.
          </div>
        )}

        {data && (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Total Transaksi */}
              <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Total Transaksi
                  </p>
                  <p className="text-3xl font-extrabold text-slate-900 mt-2">
                    {data.total_transactions}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    <span className="text-emerald-600 font-semibold flex items-center">
                      <ArrowUpRight className="w-3.5 h-3.5" /> Berhasil
                    </span>
                    <span>sepanjang waktu</span>
                  </p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <ShoppingBag className="w-7 h-7" />
                </div>
              </div>

              {/* Total Penjualan (Rp) */}
              <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Total Omset Penjualan
                  </p>
                  <p className="text-3xl font-extrabold text-slate-900 mt-2">
                    {formatRupiah(data.total_sales_amount)}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Akumulasi seluruh transaksi</p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <TrendingUp className="w-7 h-7" />
                </div>
              </div>

              {/* Peringatan Stok Menipis */}
              <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Stok Menipis (&lt; 5)
                  </p>
                  <p className="text-3xl font-extrabold text-amber-600 mt-2">
                    {data.low_stock_products.length}{' '}
                    <span className="text-sm font-normal text-slate-400">produk</span>
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Perlu restock segera</p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <AlertTriangle className="w-7 h-7" />
                </div>
              </div>
            </div>

            {/* Daily Sales Chart (Bonus Feature) */}
            <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-xs">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Grafik Penjualan Harian (14 Hari Terakhir)</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Tren volume transaksi dan pendapatan</p>
                </div>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.daily_sales}>
                    <defs>
                      <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(d) => formatDateIndo(d)}
                      stroke="#94a3b8"
                      fontSize={11}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      fontSize={11}
                      tickFormatter={(val) => `Rp${(val / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      formatter={(val: any) => [formatRupiah(val), 'Pendapatan']}
                      labelFormatter={(label) => `Tanggal: ${formatDateIndo(label)}`}
                    />
                    <Area
                      type="monotone"
                      dataKey="total_amount"
                      stroke="#059669"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorAmount)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Grid: 5 Top Selling & Low Stock */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Top 5 Best Selling Products */}
              <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-xs flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Package className="w-5 h-5 text-emerald-600" />
                      5 Produk Terlaris
                    </h3>
                    <p className="text-xs text-slate-500">Berdasarkan total kuantitas terjual</p>
                  </div>
                </div>

                <div className="overflow-x-auto flex-1">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase">
                        <th className="py-3 px-2">Produk</th>
                        <th className="py-3 px-2 text-right">Terjual</th>
                        <th className="py-3 px-2 text-right">Total Nilai</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {data.top_selling_products.map((item, idx) => (
                        <tr key={item.product_id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-2">
                            <div className="font-semibold text-slate-800 flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 text-xs flex items-center justify-center font-bold">
                                {idx + 1}
                              </span>
                              <span>{item.product_name}</span>
                            </div>
                            <span className="text-xs text-slate-400 font-mono ml-7">
                              {item.product_code}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-right font-bold text-slate-800">
                            {item.total_quantity_sold} <span className="text-xs font-normal text-slate-500">pcs</span>
                          </td>
                          <td className="py-3 px-2 text-right font-semibold text-emerald-600">
                            {formatRupiah(item.total_revenue)}
                          </td>
                        </tr>
                      ))}
                      {data.top_selling_products.length === 0 && (
                        <tr>
                          <td colSpan={3} className="py-8 text-center text-slate-400 text-sm">
                            Belum ada data penjualan
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Low Stock Warning */}
              <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-xs flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-amber-500" />
                      Peringatan Stok Menipis (&lt; 5)
                    </h3>
                    <p className="text-xs text-slate-500">Produk yang persediaannya hampir habis</p>
                  </div>
                  <Link
                    href="/products"
                    className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                  >
                    Kelola Produk &rarr;
                  </Link>
                </div>

                <div className="overflow-x-auto flex-1">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase">
                        <th className="py-3 px-2">Kode & Nama</th>
                        <th className="py-3 px-2 text-right">Harga</th>
                        <th className="py-3 px-2 text-right">Sisa Stok</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {data.low_stock_products.map((prod) => (
                        <tr key={prod.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-2">
                            <p className="font-semibold text-slate-800">{prod.product_name}</p>
                            <p className="text-xs text-slate-400 font-mono">{prod.product_code}</p>
                          </td>
                          <td className="py-3 px-2 text-right text-slate-600">
                            {formatRupiah(prod.price)}
                          </td>
                          <td className="py-3 px-2 text-right">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                              {prod.stock} unit
                            </span>
                          </td>
                        </tr>
                      ))}
                      {data.low_stock_products.length === 0 && (
                        <tr>
                          <td colSpan={3} className="py-8 text-center text-emerald-600 text-sm">
                            Semua stok produk dalam kondisi aman (&ge; 5)
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
