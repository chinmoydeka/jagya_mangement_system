import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
    UserCircle2, Plus, Search, Eye, Edit, Trash2,
    MoreVertical, Phone, Mail, MapPin, Building2,
    CheckCircle2, XCircle, Filter,
} from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { cn } from '@/lib/utils';
import ClientFormDrawer from '@/Components/Clients/ClientFormDrawer';

const statusConfig = {
    active: { label: 'Active', className: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400' },
    inactive: { label: 'Inactive', className: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400' },
};

function ClientRow({ client, onEdit, onDelete, onDisable }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const s = statusConfig[client.status] || statusConfig.active;

    return (
        <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group">
            <td className="px-5 py-4">
                <span className="text-xs font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                    {client.client_id}
                </span>
            </td>
            <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-sm font-bold shrink-0 overflow-hidden relative">
                        <span className="absolute inset-0 flex items-center justify-center">
                            {client.name?.charAt(0).toUpperCase()}
                        </span>
                        {client.photo_path && (
                            <img
                                src={client.photo_path}
                                alt={client.name}
                                className="absolute inset-0 w-full h-full object-cover"
                                onError={e => { e.target.style.display = 'none'; }}
                            />
                        )}
                    </div>
                    <div>
                        <Link
                            href={`/clients/${client.id}`}
                            className="font-semibold text-slate-900 dark:text-slate-100 hover:text-amber-600 transition-colors"
                        >
                            {client.name}
                        </Link>
                        <p className="text-xs text-slate-400 mt-0.5">{client.created_at}</p>
                    </div>
                </div>
            </td>
            <td className="px-5 py-4">
                <div className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-300">
                    <Phone size={12} className="text-slate-400" />
                    {client.mobile}
                </div>
            </td>
            <td className="px-5 py-4">
                <div className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-300">
                    <Mail size={12} className="text-slate-400" />
                    <span className="truncate max-w-[160px]">{client.email || '—'}</span>
                </div>
            </td>
            <td className="px-5 py-4">
                <div className="flex items-center gap-1 text-sm text-slate-500">
                    <MapPin size={12} className="text-slate-400" />
                    {client.city || '—'}
                </div>
            </td>
            <td className="px-5 py-4">
                <div className="flex items-center gap-1">
                    <Building2 size={14} className="text-amber-500" />
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        {client.projects_count}
                    </span>
                </div>
            </td>
            <td className="px-5 py-4">
                <span className={cn('inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium', s.className)}>
                    {s.label}
                </span>
            </td>
            <td className="px-5 py-4">
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link
                        href={`/clients/${client.id}`}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                        title="View"
                    >
                        <Eye size={15} />
                    </Link>
                    <button
                        onClick={() => onEdit(client)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors"
                        title="Edit"
                    >
                        <Edit size={15} />
                    </button>
                    <button
                        onClick={() => onDisable(client)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-500/10 transition-colors"
                        title={client.status === 'active' ? 'Disable' : 'Enable'}
                    >
                        {client.status === 'active' ? <XCircle size={15} /> : <CheckCircle2 size={15} />}
                    </button>
                    <button
                        onClick={() => onDelete(client)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                        title="Delete"
                    >
                        <Trash2 size={15} />
                    </button>
                </div>
            </td>
        </tr>
    );
}

export default function ClientsIndex({ clients = [] }) {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [editingClient, setEditingClient] = useState(null);

    const filtered = clients.filter((c) => {
        const matchSearch =
            c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.mobile?.includes(search) ||
            c.client_id?.toLowerCase().includes(search.toLowerCase()) ||
            c.city?.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === 'all' || c.status === statusFilter;
        return matchSearch && matchStatus;
    });

    function handleEdit(client) {
        setEditingClient(client);
        setDrawerOpen(true);
    }

    function handleNew() {
        setEditingClient(null);
        setDrawerOpen(true);
    }

    function handleDisable(client) {
        if (!confirm(`${client.status === 'active' ? 'Disable' : 'Enable'} client "${client.name}"?`)) return;
        router.put(`/clients/${client.id}`, {
            ...client,
            status: client.status === 'active' ? 'inactive' : 'active',
        });
    }

    function handleDelete(client) {
        if (!confirm(`Permanently delete client "${client.name}"? This cannot be undone.`)) return;
        router.delete(`/clients/${client.id}`);
    }

    const activeCount = clients.filter(c => c.status === 'active').length;
    const totalProjects = clients.reduce((s, c) => s + (c.projects_count || 0), 0);

    return (
        <AppLayout>
            <Head title="Clients" />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Clients</h1>
                    <p className="text-sm text-slate-500 mt-0.5">
                        {clients.length} total clients · {activeCount} active
                    </p>
                </div>
                <button
                    onClick={handleNew}
                    id="btn-add-client"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:shadow-lg hover:-translate-y-0.5"
                    style={{ background: 'linear-gradient(135deg, #f59e0b, #dc2626)', boxShadow: '0 4px 14px rgba(245,158,11,0.3)' }}
                >
                    <Plus size={16} />
                    Add Client
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {[
                    { label: 'Total Clients', value: clients.length, color: 'text-blue-600 bg-blue-50 dark:bg-blue-500/10', icon: UserCircle2 },
                    { label: 'Active', value: activeCount, color: 'text-green-600 bg-green-50 dark:bg-green-500/10', icon: CheckCircle2 },
                    { label: 'Inactive', value: clients.length - activeCount, color: 'text-slate-600 bg-slate-100 dark:bg-slate-700', icon: XCircle },
                    { label: 'Total Projects', value: totalProjects, color: 'text-amber-600 bg-amber-50 dark:bg-amber-500/10', icon: Building2 },
                ].map(s => (
                    <div key={s.label} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 flex items-center gap-3">
                        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', s.color)}>
                            <s.icon size={18} />
                        </div>
                        <div>
                            <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{s.value}</p>
                            <p className="text-xs text-slate-500">{s.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Table Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                {/* Table Toolbar */}
                <div className="flex flex-col sm:flex-row gap-3 p-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="relative flex-1 max-w-sm">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by name, mobile, city..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/50 text-slate-700 dark:text-slate-300 placeholder-slate-400"
                        />
                    </div>
                    <div className="flex gap-2">
                        {['all', 'active', 'inactive'].map(s => (
                            <button
                                key={s}
                                onClick={() => setStatusFilter(s)}
                                className={cn(
                                    'px-3.5 py-2 rounded-xl text-sm font-medium capitalize transition-all',
                                    statusFilter === s
                                        ? 'text-white shadow-md'
                                        : 'bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                                )}
                                style={statusFilter === s ? { background: 'linear-gradient(135deg, #f59e0b, #dc2626)' } : {}}
                            >
                                {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Client ID</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Mobile</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">City</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Projects</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
                            {filtered.map((client) => (
                                <ClientRow
                                    key={client.id}
                                    client={client}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                    onDisable={handleDisable}
                                />
                            ))}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="px-5 py-16 text-center">
                                        <div className="flex flex-col items-center gap-3 text-slate-400">
                                            <UserCircle2 size={40} className="opacity-30" />
                                            <p className="text-sm font-medium">No clients found</p>
                                            <p className="text-xs">
                                                {search ? 'Try adjusting your search.' : 'Click "Add Client" to get started.'}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                {filtered.length > 0 && (
                    <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400">
                        Showing {filtered.length} of {clients.length} clients
                    </div>
                )}
            </div>

            {/* Create/Edit Drawer */}
            <ClientFormDrawer
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                client={editingClient}
            />
        </AppLayout>
    );
}
