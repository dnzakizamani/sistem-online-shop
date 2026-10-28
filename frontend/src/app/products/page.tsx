'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { api } from '../../lib/api';
import { Product, PaginationMeta } from '../../types/index';
import { formatRupiah } from '../../utils/format';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Pagination from '../../components/ui/Pagination';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { Plus, Search, Edit2, Trash2, Package, AlertCircle } from 'lucide-react';

export default function ProductsPage() {
  const queryClient = useQueryClient();

  // State filters
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('created_at_desc');

  // Modal form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formStock, setFormStock] = useState<number | string>('');
  const [formPrice, setFormPrice] = useState<number | string>('');
  const [formErrors, setFormErrors] = useState<Record<string, string[]>>({});

  // Confirm delete state
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch products query
  const { data, isLoading, isError, refetch } = useQuery<{
    products: Product[];
    meta: PaginationMeta;
  }>({
    queryKey: ['products', page, search, sort],
    queryFn: async () => {
      const res = await api.get('/products', {
        params: { page, per_page: 10, search: search || undefined, sort },
      });
      return {
        products: res.data.data,
        meta: res.data.meta,
      };
    },
  });

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingProduct(null);
    setFormCode('');
    setFormName('');
    setFormStock('');
    setFormPrice('');
    setFormErrors({});
    setIsFormOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setFormCode(p.product_code);
    setFormName(p.product_name);
    setFormStock(p.stock);
    setFormPrice(p.price);
    setFormErrors({});
    setIsFormOpen(true);
  };

  // Submit Create or Update
  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        product_code: formCode,
        product_name: formName,
        stock: Number(formStock),
        price: Number(formPrice),
      };
      if (editingProduct) {
        return await api.put(`/products/${editingProduct.id}`, payload);
      } else {
        return await api.post('/products', payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsFormOpen(false);
    },
    onError: (err: any) => {
      if (err.response?.data?.errors) {
        setFormErrors(err.response.data.errors);
      } else {
        alert(err.response?.data?.message || 'Gagal menyimpan produk');
      }
    },
  });

  // Handle Soft Delete
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await api.delete(`/products/${deleteTarget.id}`);
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setDeleteTarget(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menghapus produk');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Manajemen Produk</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Kelola katalog barang, stok persediaan, dan harga produk.
            </p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-all shadow-emerald-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Produk</span>
          </button>
        </div>

        {/* Filter Bar */}
        <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-xs flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Cari kode atau nama produk..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
            />
          </div>
          <div className="w-full sm:w-auto">
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setPage(1);
              }}
              className="w-full sm:w-auto px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 focus:border-emerald-500 outline-none bg-white"
            >
              <option value="created_at_desc">Terbaru</option>
              <option value="name_asc">Nama (A - Z)</option>
              <option value="name_desc">Nama (Z - A)</option>
              <option value="price_asc">Harga Terendah</option>
              <option value="price_desc">Harga Tertinggi</option>
              <option value="stock_asc">Stok Paling Sedikit</option>
              <option value="stock_desc">Stok Paling Banyak</option>
            </select>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
          {isLoading && <LoadingSpinner label="Memuat produk..." />}

          {!isLoading && data && (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/75 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="py-3.5 px-4">Kode</th>
                      <th className="py-3.5 px-4">Nama Produk</th>
                      <th className="py-3.5 px-4 text-right">Stok</th>
                      <th className="py-3.5 px-4 text-right">Harga Satuan</th>
                      <th className="py-3.5 px-4 text-center w-28">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.products.map((prod) => (
                      <tr key={prod.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-medium text-slate-700">
                          {prod.product_code}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-900">
                          {prod.product_name}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                              prod.stock < 5
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {prod.stock} unit
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-semibold text-emerald-600">
                          {formatRupiah(prod.price)}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(prod)}
                              className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Edit Produk"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(prod)}
                              className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Hapus Produk (Soft Delete)"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {data.products.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-slate-400">
                          <Package className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                          <p className="text-sm font-medium">Tidak ada produk ditemukan</p>
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

      {/* Form Modal (Tambah / Edit) */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingProduct ? 'Edit Data Produk' : 'Tambah Produk Baru'}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate();
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
              Kode Produk <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formCode}
              onChange={(e) => setFormCode(e.target.value)}
              placeholder="Contoh: P0025"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none uppercase font-mono"
            />
            {formErrors.product_code && (
              <p className="text-xs text-red-500 mt-1">{formErrors.product_code[0]}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
              Nama Produk <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Contoh: Kopi Luwak 200g"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none"
            />
            {formErrors.product_name && (
              <p className="text-xs text-red-500 mt-1">{formErrors.product_name[0]}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
                Stok <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                required
                value={formStock}
                onChange={(e) => setFormStock(e.target.value)}
                placeholder="0"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none"
              />
              {formErrors.stock && (
                <p className="text-xs text-red-500 mt-1">{formErrors.stock[0]}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
                Harga (Rp) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                required
                value={formPrice}
                onChange={(e) => setFormPrice(e.target.value)}
                placeholder="10000"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none"
              />
              {formErrors.price && (
                <p className="text-xs text-red-500 mt-1">{formErrors.price[0]}</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-sm shadow-emerald-600/20 disabled:opacity-50"
            >
              {saveMutation.isPending ? 'Menyimpan...' : 'Simpan Produk'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Konfirmasi Hapus Produk"
        message={`Apakah Anda yakin ingin menghapus produk "${deleteTarget?.product_name}"? Produk ini akan di-soft delete dan riwayat transaksi sebelumnya tetap aman.`}
        confirmLabel="Hapus Produk"
        isLoading={isDeleting}
      />
    </DashboardLayout>
  );
}
