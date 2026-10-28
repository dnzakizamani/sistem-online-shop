'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { api } from '../../lib/api';
import { Customer, PaginationMeta } from '../../types/index';
import { formatDateIndo } from '../../utils/format';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Pagination from '../../components/ui/Pagination';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { Plus, Search, Edit2, Trash2, Users, Phone, MapPin } from 'lucide-react';

export default function CustomersPage() {
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  // Form modal state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [gender, setGender] = useState<'Pria' | 'Wanita'>('Pria');
  const [birthDate, setBirthDate] = useState('');
  const [phone, setPhone] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string[]>>({});

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch customers
  const { data, isLoading, refetch } = useQuery<{
    customers: Customer[];
    meta: PaginationMeta;
  }>({
    queryKey: ['customers', page, search],
    queryFn: async () => {
      const res = await api.get('/customers', {
        params: { page, per_page: 10, search: search || undefined },
      });
      return {
        customers: res.data.data,
        meta: res.data.meta,
      };
    },
  });

  const handleOpenCreate = () => {
    setEditingCustomer(null);
    setName('');
    setAddress('');
    setGender('Pria');
    setBirthDate('');
    setPhone('');
    setFormErrors({});
    setIsFormOpen(true);
  };

  const handleOpenEdit = (c: Customer) => {
    setEditingCustomer(c);
    setName(c.customer_name);
    setAddress(c.customer_address);
    setGender(c.gender);
    setBirthDate(c.birth_date);
    setPhone(c.phone || '');
    setFormErrors({});
    setIsFormOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        customer_name: name,
        customer_address: address,
        gender,
        birth_date: birthDate,
        phone: phone || null,
      };
      if (editingCustomer) {
        return await api.put(`/customers/${editingCustomer.id}`, payload);
      } else {
        return await api.post('/customers', payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setIsFormOpen(false);
    },
    onError: (err: any) => {
      if (err.response?.data?.errors) {
        setFormErrors(err.response.data.errors);
      } else {
        alert(err.response?.data?.message || 'Gagal menyimpan pelanggan');
      }
    },
  });

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await api.delete(`/customers/${deleteTarget.id}`);
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setDeleteTarget(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menghapus pelanggan');
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
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Data Pelanggan</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Kelola informasi profil, kontak, dan riwayat pelanggan.
            </p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-all shadow-emerald-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Pelanggan</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-xs">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Cari nama pelanggan..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
            />
          </div>
        </div>

        {/* Customers Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
          {isLoading && <LoadingSpinner label="Memuat data pelanggan..." />}

          {!isLoading && data && (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/75 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="py-3.5 px-4">Nama Pelanggan</th>
                      <th className="py-3.5 px-4">Alamat</th>
                      <th className="py-3.5 px-4">Gender</th>
                      <th className="py-3.5 px-4">Tgl Lahir</th>
                      <th className="py-3.5 px-4">No. HP</th>
                      <th className="py-3.5 px-4 text-center w-28">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.customers.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-slate-900">
                          {c.customer_name}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate" title={c.customer_address}>
                          <span className="flex items-center gap-1.5 truncate">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{c.customer_address}</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              c.gender === 'Pria'
                                ? 'bg-blue-50 text-blue-700'
                                : 'bg-pink-50 text-pink-700'
                            }`}
                          >
                            {c.gender}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {formatDateIndo(c.birth_date)}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {c.phone ? (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3.5 h-3.5 text-slate-400" />
                              <span>{c.phone}</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">-</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(c)}
                              className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Edit Pelanggan"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(c)}
                              className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Hapus Pelanggan"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {data.customers.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400">
                          <Users className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                          <p className="text-sm font-medium">Tidak ada data pelanggan</p>
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

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingCustomer ? 'Edit Data Pelanggan' : 'Tambah Pelanggan Baru'}
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
              Nama Lengkap <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Budi Santoso"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none"
            />
            {formErrors.customer_name && (
              <p className="text-xs text-red-500 mt-1">{formErrors.customer_name[0]}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
              Alamat Lengkap <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Contoh: Jl. Sudirman No. 45, Jakarta"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none"
            />
            {formErrors.customer_address && (
              <p className="text-xs text-red-500 mt-1">{formErrors.customer_address[0]}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
                Jenis Kelamin <span className="text-red-500">*</span>
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as 'Pria' | 'Wanita')}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-emerald-500 outline-none bg-white"
              >
                <option value="Pria">Pria</option>
                <option value="Wanita">Wanita</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
                Tanggal Lahir <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-emerald-500 outline-none"
              />
              {formErrors.birth_date && (
                <p className="text-xs text-red-500 mt-1">{formErrors.birth_date[0]}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
              Nomor Handphone
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Contoh: 081234567890"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none"
            />
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
              {saveMutation.isPending ? 'Menyimpan...' : 'Simpan Pelanggan'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Konfirmasi Hapus Pelanggan"
        message={`Apakah Anda yakin ingin menghapus pelanggan "${deleteTarget?.customer_name}"?`}
        confirmLabel="Hapus Pelanggan"
        isLoading={isDeleting}
      />
    </DashboardLayout>
  );
}
