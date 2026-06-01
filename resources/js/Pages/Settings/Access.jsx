import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import {
    Shield,
    Plus,
    Edit,
    Trash2,
    Eye,
    Check,
    X,
    ChevronDown,
    Users,
    Lock,
    Unlock,
} from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { cn } from '@/lib/utils';

const roles = [
    {
        id: 1,
        name: 'Super Admin',
        description: 'Full access to all modules and settings',
        color: 'from-red-500 to-rose-600',
        members: 2,
        permissions: {
            dashboard: { view: true, edit: true, delete: true },
            projects: { view: true, edit: true, delete: true },
            team: { view: true, edit: true, delete: true },
            frontOffice: { view: true, edit: true, delete: true },
            settings: { view: true, edit: true, delete: true },
            reports: { view: true, edit: true, delete: true },
        },
    },
    {
        id: 2,
        name: 'Project Manager',
        description: 'Manage projects, view team, limited settings',
        color: 'from-blue-500 to-indigo-600',
        members: 8,
        permissions: {
            dashboard: { view: true, edit: false, delete: false },
            projects: { view: true, edit: true, delete: false },
            team: { view: true, edit: false, delete: false },
            frontOffice: { view: true, edit: true, delete: false },
            settings: { view: false, edit: false, delete: false },
            reports: { view: true, edit: false, delete: false },
        },
    },
    {
        id: 3,
        name: 'Site Engineer',
        description: 'View and update assigned project details',
        color: 'from-green-500 to-emerald-600',
        members: 24,
        permissions: {
            dashboard: { view: true, edit: false, delete: false },
            projects: { view: true, edit: true, delete: false },
            team: { view: true, edit: false, delete: false },
            frontOffice: { view: false, edit: false, delete: false },
            settings: { view: false, edit: false, delete: false },
            reports: { view: false, edit: false, delete: false },
        },
    },
    {
        id: 4,
        name: 'Front Office',
        description: 'Manage client inquiries and office operations',
        color: 'from-purple-500 to-violet-600',
        members: 6,
        permissions: {
            dashboard: { view: true, edit: false, delete: false },
            projects: { view: true, edit: false, delete: false },
            team: { view: false, edit: false, delete: false },
            frontOffice: { view: true, edit: true, delete: true },
            settings: { view: false, edit: false, delete: false },
            reports: { view: false, edit: false, delete: false },
        },
    },
    {
        id: 5,
        name: 'Finance',
        description: 'Access financial data and reports',
        color: 'from-amber-500 to-orange-600',
        members: 4,
        permissions: {
            dashboard: { view: true, edit: false, delete: false },
            projects: { view: true, edit: false, delete: false },
            team: { view: false, edit: false, delete: false },
            frontOffice: { view: false, edit: false, delete: false },
            settings: { view: false, edit: false, delete: false },
            reports: { view: true, edit: true, delete: false },
        },
    },
];

const modules = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'projects', label: 'Projects' },
    { key: 'team', label: 'Team Members' },
    { key: 'frontOffice', label: 'Front Office' },
    { key: 'settings', label: 'Settings' },
    { key: 'reports', label: 'Reports' },
];

const permTypes = ['view', 'edit', 'delete'];

function PermBadge({ active }) {
    return (
        <div className={cn(
            'w-6 h-6 rounded-lg flex items-center justify-center',
            active ? 'bg-green-100 dark:bg-green-500/15 text-green-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
        )}>
            {active ? <Check size={12} /> : <X size={12} />}
        </div>
    );
}

export default function AccessPermissions() {
    const [selectedRole, setSelectedRole] = useState(roles[0]);
    const [localRoles, setLocalRoles] = useState(roles);

    function togglePermission(moduleKey, permType) {
        setLocalRoles(prev => prev.map(r => {
            if (r.id !== selectedRole.id) return r;
            return {
                ...r,
                permissions: {
                    ...r.permissions,
                    [moduleKey]: {
                        ...r.permissions[moduleKey],
                        [permType]: !r.permissions[moduleKey][permType],
                    }
                }
            };
        }));
        setSelectedRole(prev => ({
            ...prev,
            permissions: {
                ...prev.permissions,
                [moduleKey]: {
                    ...prev.permissions[moduleKey],
                    [permType]: !prev.permissions[moduleKey][permType],
                }
            }
        }));
    }

    const currentRole = localRoles.find(r => r.id === selectedRole.id);

    return (
        <AppLayout>
            <Head title="Access & Permissions" />

            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Access & Permissions</h1>
                <p className="text-sm text-slate-500 mt-0.5">Manage role-based access control for your team</p>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Roles List */}
                <div className="lg:w-72 shrink-0 space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Roles ({roles.length})</h3>
                        <button
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white"
                            style={{ background: 'linear-gradient(135deg, #f59e0b, #dc2626)' }}
                        >
                            <Plus size={12} /> Add Role
                        </button>
                    </div>

                    {localRoles.map((role) => (
                        <button
                            key={role.id}
                            onClick={() => setSelectedRole(role)}
                            className={cn(
                                'w-full text-left p-4 rounded-2xl border transition-all duration-200',
                                selectedRole.id === role.id
                                    ? 'border-amber-300 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-500/5 shadow-md'
                                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-md'
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center', role.color)}>
                                    <Shield size={16} className="text-white" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{role.name}</p>
                                    <p className="text-xs text-slate-500 mt-0.5 truncate">{role.description}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 mt-3">
                                <Users size={12} className="text-slate-400" />
                                <span className="text-xs text-slate-400">{role.members} members</span>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Permissions Table */}
                <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold text-slate-900 dark:text-slate-100">{currentRole.name}</h3>
                            <p className="text-xs text-slate-500 mt-0.5">{currentRole.description}</p>
                        </div>
                        <div className="flex gap-2">
                            <button className="w-8 h-8 rounded-xl flex items-center justify-center text-amber-600 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 transition-colors">
                                <Edit size={14} />
                            </button>
                            {currentRole.id !== 1 && (
                                <button className="w-8 h-8 rounded-xl flex items-center justify-center text-red-500 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 transition-colors">
                                    <Trash2 size={14} />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Module</th>
                                    {permTypes.map(p => (
                                        <th key={p} className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                            {p}
                                        </th>
                                    ))}
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">All</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                {modules.map((module) => {
                                    const perms = currentRole.permissions[module.key];
                                    const allEnabled = permTypes.every(p => perms[p]);
                                    return (
                                        <tr key={module.key} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <p className="font-medium text-slate-800 dark:text-slate-200">{module.label}</p>
                                            </td>
                                            {permTypes.map(ptype => (
                                                <td key={ptype} className="px-4 py-4 text-center">
                                                    <div className="flex justify-center">
                                                        <button
                                                            onClick={() => togglePermission(module.key, ptype)}
                                                            className="hover:scale-110 transition-transform"
                                                            disabled={currentRole.id === 1}
                                                        >
                                                            <PermBadge active={perms[ptype]} />
                                                        </button>
                                                    </div>
                                                </td>
                                            ))}
                                            <td className="px-4 py-4 text-center">
                                                <div className="flex justify-center">
                                                    <div className={cn(
                                                        'w-6 h-6 rounded-lg flex items-center justify-center',
                                                        allEnabled ? 'bg-green-100 dark:bg-green-500/15 text-green-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                                                    )}>
                                                        {allEnabled ? <Unlock size={12} /> : <Lock size={12} />}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800">
                        <p className="text-xs text-slate-400">
                            💡 Click on permission badges to toggle access. Super Admin permissions are locked.
                        </p>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
