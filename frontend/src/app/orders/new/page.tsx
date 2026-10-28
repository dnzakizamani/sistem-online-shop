'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import { api } from '../../../lib/api';
import { Customer, Product } from '../../../types/index';
import { formatRupiah } from '../../../utils/format';
import {
  Plus,
  Trash2,
  ShoppingCart,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Package,
} from 'lucide-react';
import Link from 'next/link';

interface OrderRowItem {
  id: string; // client temporary key
  product_id: number | '';
  quantity: number;
}

export default function CreateOrderPage() {
  const router = useRouter();

  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [items, setItems] = useState<OrderRowItem[]>([
    { id: '1', product_id: '', quantity: 1 },
  ]);
  const [serverErrors, setServerErrors] = useState<Record<string, string[]>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Fetch all active customers for dropdown
  const { data: customerData } = useQuery<{ customers: Customer[] }>({
    queryKey: ['customers-all'],
    queryFn: async () => {
      const res = await api.get('/customers?per_page=100');
      return { customers: res.data.data };
    },
  });

  // Fetch all active products for dropdown
  const { data: productData } = useQuery<{ products: Product[] }>({
    queryKey: ['products-all'],
    queryFn: async () => {
      const res = await api.get('/products?per_page=100');
      return { products: res.data.data };
    },
  });

  const products = productData?.products || [];
  const customers = customerData?.customers || [];

  // Product helper map
  const productMap = new Map<number, Product>();
  products.forEach((p) => productMap.set(p.id, p));

  // Add row
  const handleAddRow = () => {
    setItems((prev) => [
      ...prev,
      { id: Math.random().toString(), product_id: '', quantity: 1 },
    ]);
  };

  // Remove row
  const handleRemoveRow = (id: string) => {
    if (items.length <= 1) {
      alert('Pesanan harus memiliki minimal 1 produk');
      return;
    }
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  // Update item field
  const handleItemChange = (
    id: string,
    field: 'product_id' | 'quantity',
    value: number | ''
  ) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, [field]: value } : it))
    );
  };

  // Calculate real-time grand total
  const grandTotal = items.reduce((acc, it) => {
    if (!it.product_id) return acc;
    const prod = productMap.get(Number(it.product_id));
    if (!prod) return acc;
    return acc + prod.price * (it.quantity || 0);
  }, 0);

  // Create order mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      setServerErrors({});
      setGlobalError(null);

      if (!selectedCustomerId) {
        throw new Error('Silakan pilih pelanggan terlebih dahulu');
      }

      const validItems = items.filter((it) => it.product_id !== '');
      if (validItems.length === 0) {
        throw new Error('Silakan pilih minimal 1 produk untuk dipesan');
      }

      // Check duplicates
      const seen = new Set();
      for (const it of validItems) {
        if (seen.has(it.product_id)) {
          throw new Error('Terdapat produk yang sama dipilih lebih dari satu kali. Gabungkan jumlah kuantitasnya.');
        }
        seen.add(it.product_id);
      }

      // Notice: client only sends customer_id and items [{ product_id, quantity }]
      // Price and totals are NEVER accepted from client, as strictly required!
      const payload = {
        customer_id: selectedCustomerId,
        items: validItems.map((it) => ({
          product_id: Number(it.product_id),
          quantity: Number(it.quantity),
        })),
      };

      const res = await api.post('/orders', payload);
      return res.data;
    },
    onSuccess: (data) => {
      const orderId = data.data.id;
      router.push(`/orders/${orderId}`);
    },
    onError: (err: any) => {
      if (err.response?.data?.errors) {
        setServerErrors(err.response.data.errors);
      }
      setGlobalError(err.response?.data?.message || err.message || 'Gagal memproses pesanan');
    },
  });

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link
            href="/orders"
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Buat Transaksi Pesanan Baru
            </h1>
            <p className="text-slate-500 text-sm">
              Input data pelanggan dan item produk yang akan dibeli.
            </p>
          </div>
        </div>

        {/* Global Error Banner */}
        {globalError && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
            <div>
              <p className="font-semibold">Terjadi Kesalahan Transaksi</p>
              <p className="mt-0.5">{globalError}</p>
            </div>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate();
          }}
          className="space-y-6"
        >
          {/* Customer Selection Card */}
          <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">
                1
              </span>
              Pilih Pelanggan
            </h2>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-2">
                Nama Pelanggan <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none bg-white font-medium text-slate-800"
              >
                <option value="">-- Pilih Pelanggan --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.customer_name} ({c.customer_address} - {c.phone || 'No HP -'})
                  </option>
                ))}
              </select>
              {serverErrors.customer_id && (
                <p className="text-xs text-red-500 mt-1.5">{serverErrors.customer_id[0]}</p>
              )}
            </div>
          </div>

          {/* Items Section */}
          <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">
                  2
                </span>
                Item Produk Pesanan
              </h2>
              <button
                type="button"
                onClick={handleAddRow}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Baris</span>
              </button>
            </div>

            <div className="space-y-4">
              {items.map((item, index) => {
                const selectedProd = item.product_id
                  ? productMap.get(Number(item.product_id))
                  : null;
                const unitPrice = selectedProd ? selectedProd.price : 0;
                const subtotal = unitPrice * (item.quantity || 0);

                // Specific server error for this row index (e.g. "items.0.quantity")
                const rowStockError =
                  serverErrors[`items.${index}.quantity`]?.[0] ||
                  serverErrors[`items.${index}.product_id`]?.[0];

                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-xl border transition-all ${
                      rowStockError
                        ? 'border-red-300 bg-red-50/40 ring-2 ring-red-100'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
                    }`}
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                      {/* Product Selector */}
                      <div className="sm:col-span-5">
                        <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                          Produk #{index + 1}
                        </label>
                        <select
                          required
                          value={item.product_id}
                          onChange={(e) =>
                            handleItemChange(
                              item.id,
                              'product_id',
                              e.target.value ? Number(e.target.value) : ''
                            )
                          }
                          className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white font-medium text-slate-800 outline-none focus:border-emerald-500"
                        >
                          <option value="">-- Pilih Produk --</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              [{p.product_code}] {p.product_name} (Stok: {p.stock})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Quantity */}
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                          Jumlah
                        </label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={item.quantity}
                          onChange={(e) =>
                            handleItemChange(
                              item.id,
                              'quantity',
                              parseInt(e.target.value, 10) || 1
                            )
                          }
                          className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white font-medium text-slate-800 outline-none focus:border-emerald-500"
                        />
                      </div>

                      {/* Unit Price */}
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                          Harga Satuan
                        </label>
                        <p className="text-sm font-semibold text-slate-700 py-2">
                          {formatRupiah(unitPrice)}
                        </p>
                      </div>

                      {/* Subtotal */}
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                          Subtotal
                        </label>
                        <p className="text-sm font-bold text-emerald-600 py-2">
                          {formatRupiah(subtotal)}
                        </p>
                      </div>

                      {/* Delete Row Button */}
                      <div className="sm:col-span-1 flex items-center justify-end sm:justify-center pt-2 sm:pt-4">
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(item.id)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Hapus Baris"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Server Error Highlight on this row */}
                    {rowStockError && (
                      <div className="mt-2 text-xs font-semibold text-red-600 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{rowStockError}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Total Summary Footer */}
            <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase font-semibold text-slate-400 tracking-wider">
                  Total Pembayaran
                </p>
                <p className="text-3xl font-extrabold text-emerald-600 mt-1">
                  {formatRupiah(grandTotal)}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  *Harga dan subtotal akan dihitung ulang secara resmi di sisi server
                </p>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Link
                  href="/orders"
                  className="flex-1 sm:flex-none px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors text-center"
                >
                  Batal
                </Link>
                <button
                  type="submit"
                  disabled={createMutation.isPending || grandTotal <= 0}
                  className="flex-1 sm:flex-none px-6 py-3 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {createMutation.isPending ? (
                    <span>Memproses Transaksi...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Konfirmasi & Simpan Pesanan</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
