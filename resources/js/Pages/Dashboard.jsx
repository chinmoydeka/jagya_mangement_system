import React from 'react';
import { Head } from '@inertiajs/react';
import {
    Building2,
    Users,
    TrendingUp,
    CheckCircle2,
    Clock,
    AlertCircle,
    ArrowUpRight,
    MapPin,
    Hammer,
    IndianRupee,
    BarChart3,
} from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { cn } from '@/lib/utils';

const stats = [
    {
        label: 'Total Projects',
        value: '2,148',
        change: '+12 this month',
        trend: 'up',
        icon: Building2,
        color: 'amber',
        bg: 'from-amber-500/20 to-orange-500/10',
        iconBg: 'bg-amber-500/15 text-amber-600',
    },
    {
        label: 'Active Projects',
        value: '342',
        change: '+8 this week',
        trend: 'up',
        icon: Hammer,
        color: 'blue',
        bg: 'from-blue-500/20 to-cyan-500/10',
        iconBg: 'bg-blue-500/15 text-blue-600',
    },
    {
        label: 'Team Members',
        value: '128',
        change: '6 departments',
        trend: 'neutral',
        icon: Users,
        color: 'purple',
        bg: 'from-purple-500/20 to-pink-500/10',
        iconBg: 'bg-purple-500/15 text-purple-600',
    },
    {
        label: 'Revenue (Cr)',
        value: '₹48.6',
        change: '+18% YoY',
        trend: 'up',
        icon: IndianRupee,
        color: 'green',
        bg: 'from-green-500/20 to-emerald-500/10',
        iconBg: 'bg-green-500/15 text-green-600',
    },
];

const recentProjects = [
    { id: 'P-2148', name: 'Greenfield Residency Phase 3', location: 'Guwahati', status: 'active', completion: 68, budget: '₹ 2,40,00,000' },
    { id: 'P-2147', name: 'Brahmaputra Heights', location: 'Jorhat', status: 'active', completion: 45, budget: '₹ 1,80,00,000' },
    { id: 'P-2146', name: 'Assam Valley Villas', location: 'Silchar', status: 'completed', completion: 100, budget: '₹ 3,20,00,000' },
    { id: 'P-2145', name: 'Kaziranga Enclave', location: 'Tezpur', status: 'on-hold', completion: 30, budget: '₹ 1,20,00,000' },
    { id: 'P-2144', name: 'Barak Valley Homes', location: 'Cachar', status: 'active', completion: 82, budget: '₹ 2,10,00,000' },
];

const statusConfig = {
    active: { label: 'Active', className: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400' },
    completed: { label: 'Completed', className: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400' },
    'on-hold': { label: 'On Hold', className: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400' },
    planning: { label: 'Planning', className: 'bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400' },
};

const activities = [
    { icon: CheckCircle2, color: 'text-green-500', text: 'Greenfield Phase 3 — 2nd floor slab completed', time: '2h ago' },
    { icon: Users, color: 'text-blue-500', text: 'New team member Rahul Bora added to Site Engineering', time: '4h ago' },
    { icon: AlertCircle, color: 'text-amber-500', text: 'Kaziranga Enclave project put on hold — pending NOC', time: '1d ago' },
    { icon: Building2, color: 'text-purple-500', text: 'New project Barak Valley Homes — Phase 2 initiated', time: '2d ago' },
    { icon: CheckCircle2, color: 'text-green-500', text: 'Assam Valley Villas — Final inspection passed', time: '3d ago' },
];

function StatCard({ stat }) {
    const Icon = stat.icon;
    return (
        <div className={cn(
            'relative overflow-hidden rounded-2xl p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900',
            'hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200'
        )}>
            <div className={cn('absolute inset-0 opacity-40 bg-gradient-to-br', stat.bg)} />
            <div className="relative flex items-start justify-between">
                <div className="space-y-3">
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', stat.iconBg)}>
                        <Icon size={18} />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{stat.label}</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">{stat.value}</p>
                    </div>
                </div>
                <ArrowUpRight size={16} className="text-slate-400" />
            </div>
            <div className="relative mt-3 flex items-center gap-1">
                <TrendingUp size={12} className="text-green-500" />
                <span className="text-xs text-slate-500">{stat.change}</span>
            </div>
        </div>
    );
}

export default function Dashboard({ auth }) {
    return (
        <AppLayout title="Dashboard">
            <Head title="Dashboard" />

            {/* Welcome Banner */}
            <div className="rounded-2xl p-6 mb-6 relative overflow-hidden"
                style={{
                    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #1c1917 100%)',
                }}>
                <div className="absolute inset-0 opacity-10"
                    style={{
                        backgroundImage: 'linear-gradient(#f59e0b 1px, transparent 1px), linear-gradient(to right, #f59e0b 1px, transparent 1px)',
                        backgroundSize: '40px 40px',
                    }} />
                <div className="absolute right-0 top-0 h-full w-1/3 opacity-20"
                    style={{ background: 'radial-gradient(circle at right center, #f59e0b, transparent 70%)' }} />
                <div className="relative">
                    <p className="text-amber-400 text-sm font-medium">Good morning 👋</p>
                    <h2 className="text-2xl font-bold text-white mt-1">
                        {auth?.user?.name || 'Admin'}
                    </h2>
                    <p className="text-slate-400 text-sm mt-1">
                        Here's what's happening at Jagya Construction today.
                    </p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
                {stats.map((stat) => (
                    <StatCard key={stat.label} stat={stat} />
                ))}
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Recent Projects Table */}
                <div className="xl:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100">Recent Projects</h3>
                        <a href="/projects" className="text-xs text-amber-600 font-medium hover:text-amber-700 flex items-center gap-1">
                            View all <ArrowUpRight size={12} />
                        </a>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left border-b border-slate-100 dark:border-slate-800">
                                    <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Project</th>
                                    <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Location</th>
                                    <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                    <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Progress</th>
                                    <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Budget</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                {recentProjects.map((project) => {
                                    const s = statusConfig[project.status];
                                    return (
                                        <tr key={project.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="px-5 py-3.5">
                                                <div>
                                                    <p className="font-medium text-slate-900 dark:text-slate-100">{project.name}</p>
                                                    <p className="text-xs text-slate-400">{project.id}</p>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                                                    <MapPin size={12} />
                                                    <span>{project.location}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium', s.className)}>
                                                    {s.label}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full"
                                                            style={{
                                                                width: `${project.completion}%`,
                                                                background: project.completion === 100
                                                                    ? 'linear-gradient(90deg, #10b981, #059669)'
                                                                    : 'linear-gradient(90deg, #f59e0b, #dc2626)',
                                                            }}
                                                        />
                                                    </div>
                                                    <span className="text-xs text-slate-500 w-8 shrink-0">{project.completion}%</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5 font-medium text-slate-700 dark:text-slate-300">
                                                {project.budget}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Activity Feed */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100">Recent Activity</h3>
                        <Clock size={16} className="text-slate-400" />
                    </div>
                    <div className="p-4 space-y-4">
                        {activities.map((activity, i) => {
                            const Icon = activity.icon;
                            return (
                                <div key={i} className="flex items-start gap-3">
                                    <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-slate-100 dark:bg-slate-800', activity.color)}>
                                        <Icon size={14} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm text-slate-700 dark:text-slate-300 leading-snug">{activity.text}</p>
                                        <p className="text-xs text-slate-400 mt-0.5">{activity.time}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
