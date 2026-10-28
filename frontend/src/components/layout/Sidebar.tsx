'use client';

import React from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  ShoppingCart,
  PlusCircle,
  Package,
  Users,
  LogOut,
  Store,
} from 'lucide-react';
import { clearAuth, getAuthUser } from '../../lib/auth';

interface SidebarProps {
  currentPath: string;
}

export default function Sidebar({ currentPath }: SidebarProps) {
  const user = getAuthUser();

  const handleLogout = () => {
    clearAuth();
    window.location.href = '/login';
  };

  const navLinks = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Riwayat Pesanan', href: '/orders', icon: ShoppingCart },
    { label: 'Buat Pesanan Baru', href: '/orders/new', icon: PlusCircle },
    { label: 'Manajemen Produk', href: '/products', icon: Package },
    { label: 'Data Pelanggan', href: '/customers', icon: Users },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 min-h-screen border-r border-slate-800">
      {/* Brand */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
          <Store className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-bold text-white tracking-tight leading-none text-base">Azatech</h1>
          <p className="text-[11px] text-slate-400 font-medium">Order Management</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1.5">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = currentPath === link.href || (link.href !== '/dashboard' && currentPath.startsWith(link.href) && link.href !== '/orders/new');
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                  : 'hover:bg-slate-800/80 hover:text-white text-slate-400'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User profile & Logout */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-emerald-700/50 border border-emerald-500/30 text-emerald-300 flex items-center justify-center text-xs font-bold">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-white truncate">{user?.name || 'Admin AZA'}</p>
            <p className="text-xs text-slate-400 truncate">{user?.email || 'admin@azatech.id'}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Keluar</span>
        </button>
      </div>
    </aside>
  );
}
