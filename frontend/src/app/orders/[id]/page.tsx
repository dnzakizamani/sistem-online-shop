'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import { api } from '../../../lib/api';
import { OrderDetail } from '../../../types/index';
import { formatRupiah, formatDateTimeIndo } from '../../../utils/format';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import {
  ArrowLeft,
  Printer,
  ShoppingBag,
  User,
  Calendar,
  MapPin,
  Phone,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';

export default function OrderDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const { data: order, isLoading, isError } = useQuery<OrderDetail>({
    queryKey: ['order-detail', id],
    queryFn: async () => {
      const res = await api.get(`/orders/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back and Action Buttons */}
        <div className="flex items-center justify-between gap-4 print:hidden">
          <Link
            href="/orders"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Daftar Pesanan</span>
          </Link>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-semibold transition-all shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Invoice</span>
          </button>
        </div>

        {isLoading && <LoadingSpinner label="Memuat detail pesanan..." />}
        {isError && (
          <div className="p-6 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm">
            Pesanan tidak ditemukan atau terjadi kesalahan saat memuat data.
          </div>
        )}

        {order && (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden p-6 sm:p-10">
            {/* Invoice Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between pb-8 border-b border-slate-100 gap-4">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 mb-3">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Transaksi Selesai
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
                  {order.order_number}
                </h1>
                <p className="text-slate-500 text-xs mt-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Waktu Transaksi: {formatDateTimeIndo(order.order_date)}</span>
                </p>
              </div>

              <div className="text-left sm:text-right">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Diterbitkan Oleh
                </p>
                <p className="font-bold text-slate-800 text-sm mt-1">{order.created_by.name}</p>
                <p className="text-xs text-slate-500">{order.created_by.email}</p>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">PT Laksmada Aza Simetri</p>
              </div>
            </div>

            {/* Customer Information Block */}
            <div className="py-6 border-b border-slate-100">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Informasi Pelanggan
              </h2>
              <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-400 font-medium">Nama Pelanggan</p>
                  <p className="text-base font-bold text-slate-900 mt-0.5">
                    {order.customer.customer_name}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Gender: {order.customer.gender}</span>
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-400 font-medium">Alamat Pengiriman</p>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5 flex items-start gap-1.5">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <span>{order.customer.customer_address}</span>
                  </p>
                  <p className="text-xs text-slate-600 mt-1 flex items-center gap-1.5 ml-5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{order.customer.phone || 'Nomor telepon tidak dicantumkan'}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Order Items Table */}
            <div className="py-6">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                Rincian Barang & Harga Saat Transaksi (Snapshot)
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
                      <th className="py-3 px-2">No</th>
                      <th className="py-3 px-2">Kode & Nama Produk</th>
                      <th className="py-3 px-2 text-right">Harga Satuan (Snapshot)</th>
                      <th className="py-3 px-2 text-center">Jumlah</th>
                      <th className="py-3 px-2 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {order.items.map((item, index) => (
                      <tr key={item.id}>
                        <td className="py-3.5 px-2 text-slate-400 font-medium text-xs">
                          {index + 1}
                        </td>
                        <td className="py-3.5 px-2">
                          <p className="font-semibold text-slate-900">{item.product_name}</p>
                          <p className="text-xs font-mono text-slate-400">{item.product_code}</p>
                        </td>
                        <td className="py-3.5 px-2 text-right text-slate-600 font-medium">
                          {formatRupiah(item.unit_price)}
                        </td>
                        <td className="py-3.5 px-2 text-center font-bold text-slate-800">
                          {item.quantity}
                        </td>
                        <td className="py-3.5 px-2 text-right font-bold text-slate-900">
                          {formatRupiah(item.subtotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Total Section */}
            <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-400 max-w-sm">
                *Nilai <code>unit_price</code> menyimpan harga produk pada saat order dibuat sehingga laporan historis tetap akurat meskipun harga produk berubah di masa depan.
              </div>

              <div className="bg-slate-50 rounded-2xl p-5 w-full sm:w-80 text-right">
                <p className="text-xs uppercase font-semibold text-slate-400">Total Pembayaran</p>
                <p className="text-3xl font-extrabold text-emerald-600 mt-1">
                  {formatRupiah(order.total_amount)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
