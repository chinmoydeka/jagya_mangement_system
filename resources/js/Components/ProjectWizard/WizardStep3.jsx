import React, { useState, useEffect } from 'react';
import { Search, Users, CheckCircle2, Loader2 } from 'lucide-react';
import axios from 'axios';
import { cn } from '@/lib/utils';

const DEPARTMENTS = ['All', 'Engineering', 'Architecture', 'Finance', 'HR', 'Front Office', 'IT', 'Marketing'];

const GRAD_COLORS = [
    'from-amber-400 to-orange-500', 'from-blue-400 to-indigo-500',
    'from-green-400 to-emerald-500', 'from-purple-400 to-pink-500',
    'from-red-400 to-rose-500', 'from-teal-400 to-cyan-500',
];

export default function WizardStep3({ data, update }) {
    const [allMembers, setAllMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [deptFilter, setDeptFilter] = useState('All');

    const [desigFilter, setDesigFilter] = useState('All');

    useEffect(() => {
        axios.get('/projects/team-members')
            .then(r => setAllMembers(r.data))
            .finally(() => setLoading(false));
    }, []);

    const designations = ['All', ...new Set((Array.isArray(allMembers) ? allMembers : []).map(m => m.designation || m.role || '').filter(Boolean))];

    const filtered = (Array.isArray(allMembers) ? allMembers : []).filter(m => {
        const matchSearch = (m.name || '').toLowerCase().includes(search.toLowerCase()) ||
            (m.role || '').toLowerCase().includes(search.toLowerCase());
        const matchDept = deptFilter === 'All' || (m.department || '') === deptFilter;
        const desig = m.designation || m.role || '';
        const matchDesig = desigFilter === 'All' || desig === desigFilter;
        return matchSearch && matchDept && matchDesig;
    });

    function toggleMember(member) {
        const selected = data.team;
        const exists = selected.find(m => m.id === member.id);
        update({ team: exists ? selected.filter(m => m.id !== member.id) : [...selected, member] });
    }

    const isSelected = (id) => data.team.some(m => m.id === id);

    return (
        <div className="p-6 space-y-5">
            <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                    Select team members to assign to this project. You can update this later.
                </p>
            </div>

            {/* Selected count */}
            {data.team.length > 0 && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20">
                    <CheckCircle2 size={14} className="text-amber-600" />
                    <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
                        {data.team.length} member{data.team.length !== 1 ? 's' : ''} selected
                    </span>
                    <div className="flex -space-x-2 ml-2">
                        {data.team.slice(0, 5).map((m, i) => (
                            <div key={m.id} className={cn('w-6 h-6 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center text-white text-[10px] font-bold bg-gradient-to-br overflow-hidden relative', GRAD_COLORS[i % GRAD_COLORS.length])}>
                                <span className="absolute inset-0 flex items-center justify-center text-[10px]">
                                    {(m.name || '?').charAt(0).toUpperCase()}
                                </span>
                                {m.photo_path && (
                                    <img
                                        src={m.photo_path}
                                        alt={m.name}
                                        className="absolute inset-0 w-full h-full object-cover"
                                        onError={e => { e.target.style.display = 'none'; }}
                                    />
                                )}
                            </div>
                        ))}
                        {data.team.length > 5 && <div className="w-6 h-6 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] text-slate-600">+{data.team.length - 5}</div>}
                    </div>
                </div>
            )}

            {/* Search & Filter */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search members..."
                        className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/50 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500"
                    />
                </div>
                <div className="flex gap-2 shrink-0">
                    <select
                        value={deptFilter}
                        onChange={e => setDeptFilter(e.target.value)}
                        className="px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/50 text-slate-700 dark:text-slate-300"
                    >
                        {DEPARTMENTS.map(d => <option key={d} value={d}>{d === 'All' ? 'All Depts' : d}</option>)}
                    </select>
                    <select
                        value={desigFilter}
                        onChange={e => setDesigFilter(e.target.value)}
                        className="px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/50 text-slate-700 dark:text-slate-300 max-w-[150px] sm:max-w-none"
                    >
                        {designations.map(d => <option key={d} value={d}>{d === 'All' ? 'All Roles' : d}</option>)}
                    </select>
                </div>
            </div>

            {/* Member Grid */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 size={24} className="animate-spin text-amber-500" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                    <Users size={36} className="mb-3 opacity-30" />
                    <p className="text-sm">No members found</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {filtered.map((member, i) => {
                        const selected = isSelected(member.id);
                        return (
                            <button
                                key={member.id}
                                type="button"
                                onClick={() => toggleMember(member)}
                                className={cn(
                                    'flex items-center gap-3 p-3.5 rounded-2xl border-2 text-left transition-all',
                                    selected
                                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-500/5'
                                        : 'border-slate-200 dark:border-slate-700 hover:border-amber-300 bg-white dark:bg-slate-800/50'
                                )}
                            >
                                <div className={cn(
                                    'w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0 bg-gradient-to-br overflow-hidden relative',
                                    GRAD_COLORS[i % GRAD_COLORS.length]
                                )}>
                                    <span className="absolute inset-0 flex items-center justify-center text-sm">
                                        {(member.name || '?').charAt(0).toUpperCase()}
                                    </span>
                                    {member.photo_path && (
                                        <img
                                            src={member.photo_path}
                                            alt={member.name}
                                            className="absolute inset-0 w-full h-full object-cover"
                                            onError={e => { e.target.style.display = 'none'; }}
                                        />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">{member.name}</p>
                                    <p className="text-xs text-slate-500 truncate">{member.role}</p>
                                </div>
                                <div className={cn(
                                    'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors',
                                    selected ? 'border-amber-500 bg-amber-500' : 'border-slate-300 dark:border-slate-600'
                                )}>
                                    {selected && <CheckCircle2 size={12} className="text-white" />}
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
