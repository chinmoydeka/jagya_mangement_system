import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import {
    Phone,
    Plus,
    Search,
    User,
    Clock,
    MessageSquare,
    CheckCircle2,
    AlertCircle,
    Mail,
    MapPin,
    Calendar,
    ArrowRight,
    Star,
    Filter,
} from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { cn } from '@/lib/utils';

const inquiries = [
    { id: 'INQ-0841', name: 'Hemanta Bhuyan', phone: '+91 98765 11111', email: 'hemanta@email.com', location: 'Guwahati', type: 'Residential Plot', status: 'new', date: '2024-05-30', notes: 'Interested in 3BHK, budget ₹45L', priority: 'high' },
    { id: 'INQ-0840', name: 'Lakshmi Devi', phone: '+91 87654 22222', email: 'lakshmi@email.com', location: 'Jorhat', type: 'Apartment', status: 'follow-up', date: '2024-05-29', notes: 'Site visit scheduled for Saturday', priority: 'medium' },
    { id: 'INQ-0839', name: 'Arun Phukan', phone: '+91 76543 33333', email: 'arun@email.com', location: 'Dibrugarh', type: 'Villa', status: 'converted', date: '2024-05-28', notes: 'Booked Unit B-204, Greenfield', priority: 'low' },
    { id: 'INQ-0838', name: 'Sabina Khatun', phone: '+91 65432 44444', email: 'sabina@email.com', location: 'Silchar', type: 'Commercial', status: 'new', date: '2024-05-28', notes: 'Wants office space ground floor', priority: 'high' },
    { id: 'INQ-0837', name: 'Biren Dutta', phone: '+91 54321 55555', email: 'biren@email.com', location: 'Tezpur', type: 'Residential Plot', status: 'follow-up', date: '2024-05-27', notes: 'Needs loan assistance info', priority: 'medium' },
    { id: 'INQ-0836', name: 'Nilufar Begum', phone: '+91 43210 66666', email: 'nilufar@email.com', location: 'Nagaon', type: 'Apartment', status: 'cold', date: '2024-05-26', notes: 'Not responding to calls', priority: 'low' },
];

const statusConfig = {
    new: { label: 'New', className: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400', icon: AlertCircle },
    'follow-up': { label: 'Follow Up', className: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400', icon: Clock },
    converted: { label: 'Converted', className: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400', icon: CheckCircle2 },
    cold: { label: 'Cold', className: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400', icon: AlertCircle },
};

const priorityConfig = {
    high: 'border-l-red-500',
    medium: 'border-l-amber-500',
    low: 'border-l-slate-300',
};

const todayTasks = [
    { time: '09:30 AM', task: 'Follow-up call – Lakshmi Devi', done: true },
    { time: '11:00 AM', task: 'Site visit with Hemanta Bhuyan', done: false },
    { time: '02:00 PM', task: 'Email loan docs to Biren Dutta', done: false },
    { time: '04:00 PM', task: 'Team briefing – new inquiries', done: false },
];

export default function FrontOffice() {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const filtered = inquiries.filter((i) => {
        const matchSearch = i.name.toLowerCase().includes(search.toLowerCase()) ||
            i.location.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === 'all' || i.status === statusFilter;
        return matchSearch && matchStatus;
    });

    return (
        <AppLayout>
            <Head title="Front Office" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Front Office</h1>
                    <p className="text-sm text-slate-500 mt-0.5">Client inquiries and lead management</p>
                </div>
                <button
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
                    style={{ background: 'linear-gradient(135deg, #f59e0b, #dc2626)', boxShadow: '0 4px 14px rgba(245,158,11,0.3)' }}
                >
                    <Plus size={16} />
                    New Inquiry
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {[
                    { label: 'Total Inquiries', value: inquiries.length, color: 'text-blue-600 bg-blue-50 dark:bg-blue-500/10' },
                    { label: 'New Today', value: 2, color: 'text-green-600 bg-green-50 dark:bg-green-500/10' },
                    { label: 'Follow Ups', value: inquiries.filter(i => i.status === 'follow-up').length, color: 'text-amber-600 bg-amber-50 dark:bg-amber-500/10' },
                    { label: 'Converted', value: inquiries.filter(i => i.status === 'converted').length, color: 'text-purple-600 bg-purple-50 dark:bg-purple-500/10' },
                ].map(s => (
                    <div key={s.label} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
                        <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{s.value}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Inquiries List */}
                <div className="xl:col-span-2 space-y-4">
                    {/* Search & Filter */}
                    <div className="flex gap-3">
                        <div className="relative flex-1">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search inquiries..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-3 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/50 text-slate-700 dark:text-slate-300"
                        >
                            <option value="all">All Status</option>
                            <option value="new">New</option>
                            <option value="follow-up">Follow Up</option>
                            <option value="converted">Converted</option>
                            <option value="cold">Cold</option>
                        </select>
                    </div>

                    {/* Inquiry Cards */}
                    <div className="space-y-3">
                        {filtered.map((inq) => {
                            const s = statusConfig[inq.status];
                            const StatusIcon = s.icon;
                            return (
                                <div
                                    key={inq.id}
                                    className={cn(
                                        'bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 border-l-4 hover:shadow-md transition-all duration-200',
                                        priorityConfig[inq.priority]
                                    )}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-start gap-3 min-w-0 flex-1">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center shrink-0">
                                                <User size={18} className="text-slate-500" />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <p className="font-semibold text-slate-900 dark:text-slate-100">{inq.name}</p>
                                                    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', s.className)}>
                                                        <StatusIcon size={10} />
                                                        {s.label}
                                                    </span>
                                                </div>
                                                <div className="flex flex-wrap gap-3 mt-1">
                                                    <span className="text-xs text-slate-500 flex items-center gap-1"><Phone size={10} />{inq.phone}</span>
                                                    <span className="text-xs text-slate-500 flex items-center gap-1"><MapPin size={10} />{inq.location}</span>
                                                    <span className="text-xs text-slate-500 flex items-center gap-1"><Calendar size={10} />{inq.date}</span>
                                                </div>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-600 dark:text-slate-400">{inq.type}</span>
                                                </div>
                                                {inq.notes && (
                                                    <p className="text-xs text-slate-500 mt-2 italic">"{inq.notes}"</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-1 shrink-0">
                                            <button className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors">
                                                <Phone size={14} />
                                            </button>
                                            <button className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors">
                                                <MessageSquare size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Today's Tasks */}
                <div className="space-y-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                            <h3 className="font-semibold text-slate-900 dark:text-slate-100">Today's Schedule</h3>
                            <p className="text-xs text-slate-400 mt-0.5">Thursday, 30 May 2024</p>
                        </div>
                        <div className="p-4 space-y-3">
                            {todayTasks.map((task, i) => (
                                <div key={i} className="flex items-start gap-3">
                                    <div className={cn(
                                        'w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5',
                                        task.done ? 'bg-green-500' : 'border-2 border-slate-200 dark:border-slate-700'
                                    )}>
                                        {task.done && <CheckCircle2 size={12} className="text-white" />}
                                    </div>
                                    <div>
                                        <p className={cn('text-sm', task.done ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-slate-300')}>
                                            {task.task}
                                        </p>
                                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                                            <Clock size={10} /> {task.time}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="px-4 pb-4">
                            <button className="w-full py-2 rounded-xl text-xs font-medium text-amber-600 border border-amber-200 dark:border-amber-500/20 hover:bg-amber-50 dark:hover:bg-amber-500/5 transition-colors flex items-center justify-center gap-1">
                                <Plus size={12} /> Add Task
                            </button>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">This Month</h3>
                        <div className="space-y-3">
                            {[
                                { label: 'Total Calls', value: 148, max: 200, color: 'from-blue-500 to-indigo-500' },
                                { label: 'Site Visits', value: 32, max: 50, color: 'from-amber-500 to-orange-500' },
                                { label: 'Conversions', value: 18, max: 30, color: 'from-green-500 to-emerald-500' },
                            ].map((stat) => (
                                <div key={stat.label}>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-slate-500">{stat.label}</span>
                                        <span className="font-medium text-slate-700 dark:text-slate-300">{stat.value}</span>
                                    </div>
                                    <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className={cn('h-full rounded-full bg-gradient-to-r', stat.color)}
                                            style={{ width: `${(stat.value / stat.max) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
