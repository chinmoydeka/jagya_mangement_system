import React, { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
    Building2, Plus, Search, MapPin, Calendar,
    Users, Eye, Edit, MoreVertical, Clock, Bookmark,
    LayoutGrid, List, Trash2, Settings
} from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { cn } from '@/lib/utils';
import ProjectWizard from '@/Components/ProjectWizard/ProjectWizard';

const STATUS_CFG = {
    'draft':     { label: 'Draft',          dot: 'bg-slate-400',  chip: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400 font-bold' },
    'running':   { label: 'Runing Project', dot: 'bg-green-500',  chip: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400 font-bold' },
    'handover':  { label: 'Handover',       dot: 'bg-blue-500',   chip: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400 font-bold' },
    'on-hold':   { label: 'ON Hold',        dot: 'bg-amber-500',  chip: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400 font-bold' },
    'cancelled': { label: 'Cancelled',      dot: 'bg-red-500',    chip: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400 font-bold' },
};

const FILTERS = ['All Agreement', 'Runing Project', 'Handover', 'ON Hold', 'Cancelled'];

export default function Projects({ projects: serverProjects }) {
    const [wizardOpen, setWizardOpen] = useState(false);
    const [activeFilter, setActiveFilter] = useState('All Agreement');
    const [search, setSearch] = useState('');
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

    // Check if we have server projects, otherwise fallback to static demo
    const [projects, setProjects] = useState(() => {
        return (serverProjects && serverProjects.length > 0) ? serverProjects : [
            { id: 1, project_id: 'P-2148', title: 'Greenfield Residency Phase 3', type: 'client', location: 'Guwahati, Kamrup', status: 'running', completion: 68, budget: 24000000, start_date: 'Jan 2024', deadline: 'Dec 2024', team_count: 12, tasks_count: 8, client: { name: 'Ramesh Sharma' } },
            { id: 2, project_id: 'P-2147', title: 'Brahmaputra Heights Tower A', type: 'client', location: 'Jorhat', status: 'running', completion: 45, budget: 18000000, start_date: 'Mar 2024', deadline: 'Mar 2025', team_count: 8, tasks_count: 5, client: { name: 'Green Homes Pvt Ltd' } },
            { id: 3, project_id: 'P-2146', title: 'Assam Valley Villas', type: 'client', location: 'Silchar, Cachar', status: 'handover', completion: 100, budget: 32000000, start_date: 'Jun 2023', deadline: 'Jun 2024', team_count: 15, tasks_count: 20, client: { name: 'NE Developers' } },
            { id: 4, project_id: 'P-2145', title: 'Kaziranga Enclave', type: 'client', location: 'Tezpur, Sonitpur', status: 'on-hold', completion: 30, budget: 12000000, start_date: 'Oct 2023', deadline: 'Oct 2024', team_count: 6, tasks_count: 3, client: null },
            { id: 5, project_id: 'P-2144', title: 'Barak Valley Homes Phase 2', type: 'client', location: 'Cachar', status: 'running', completion: 82, budget: 21000000, start_date: 'Aug 2023', deadline: 'Sep 2024', team_count: 10, tasks_count: 12, client: { name: 'Priya Constructions' } },
            { id: 6, project_id: 'P-2143', title: 'Dibrugarh Smart Homes', type: 'internal', location: 'Dibrugarh', status: 'draft', completion: 5, budget: 40000000, start_date: 'May 2024', deadline: 'May 2026', team_count: 4, tasks_count: 2, client: null },
            { id: 7, project_id: 'P-2142', title: 'Nalbari Residency Block B', type: 'client', location: 'Nalbari', status: 'running', completion: 55, budget: 15000000, start_date: 'Feb 2024', deadline: 'Feb 2025', team_count: 9, tasks_count: 7, client: { name: 'MK Properties' } },
            { id: 8, project_id: 'P-2141', title: 'Bongaigaon Township', type: 'client', location: 'Bongaigaon', status: 'draft', completion: 0, budget: 85000000, start_date: null, deadline: null, team_count: 0, tasks_count: 0, client: { name: 'City Corp' } },
        ];
    });

    useEffect(() => {
        if (serverProjects) {
            setProjects(serverProjects);
        }
    }, [serverProjects]);

    const filtered = projects.filter((p) => {
        const matchSearch =
            p.title.toLowerCase().includes(search.toLowerCase()) ||
            (p.location || '').toLowerCase().includes(search.toLowerCase()) ||
            (p.project_id || '').toLowerCase().includes(search.toLowerCase());
        const matchFilter =
            activeFilter === 'All Agreement' ||
            p.status === (
                activeFilter === 'Runing Project' ? 'running' :
                activeFilter === 'ON Hold' ? 'on-hold' :
                activeFilter.toLowerCase().replace(' ', '-')
            );
        return matchSearch && matchFilter;
    });

    const hasDraft = !!localStorage.getItem?.('jcms_project_draft');

    function handleDeleteProject(id) {
        if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) return;
        
        router.delete(`/projects/${id}`, {
            onSuccess: () => {
                setProjects(prev => prev.filter(p => p.id !== id));
            }
        });
    }

    function handleDiscardLocalDraft() {
        if (!confirm('Discard your unsaved local project wizard draft?')) return;
        localStorage.removeItem('jcms_project_draft');
        window.location.reload();
    }

    return (
        <AppLayout>
            <Head title="Projects" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Projects</h1>
                    <p className="text-sm text-slate-500 mt-0.5">
                        {projects.length} projects across Assam
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {hasDraft && (
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() => setWizardOpen(true)}
                                className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-medium text-amber-700 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 hover:bg-amber-100 transition-colors"
                            >
                                <Clock size={15} /> Continue Draft
                            </button>
                            <button
                                onClick={handleDiscardLocalDraft}
                                className="p-2.5 rounded-xl text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-500/10 border border-red-200 dark:border-red-500/20 transition-colors"
                                title="Discard Local Draft"
                            >
                                <Trash2 size={15} />
                            </button>
                        </div>
                    )}
                    <button
                        id="btn-create-project"
                        onClick={() => setWizardOpen(true)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:shadow-lg hover:-translate-y-0.5"
                        style={{ background: 'linear-gradient(135deg, #f59e0b, #dc2626)', boxShadow: '0 4px 14px rgba(245,158,11,0.3)' }}
                    >
                        <Plus size={16} /> Create New Project
                    </button>
                </div>
            </div>

            {/* Filters and View Switcher */}
            <div className="flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center mb-6">
                <div className="flex flex-col sm:flex-row gap-3 flex-1 max-w-2xl">
                    <div className="relative flex-1 max-w-sm">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search projects, locations..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/50 text-slate-700 dark:text-slate-300 placeholder-slate-400"
                        />
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                        {FILTERS.map((f) => (
                            <button
                                key={f}
                                onClick={() => setActiveFilter(f)}
                                className={cn(
                                    'px-3.5 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all',
                                    activeFilter === f
                                        ? 'text-white shadow-md'
                                        : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                                )}
                                style={activeFilter === f ? { background: 'linear-gradient(135deg, #f59e0b, #dc2626)' } : {}}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                {/* View Switcher */}
                <div className="flex items-center gap-1.5 self-end md:self-auto bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={cn(
                            'p-2 rounded-lg transition-all',
                            viewMode === 'grid'
                                ? 'bg-white dark:bg-slate-900 text-amber-600 shadow-sm'
                                : 'text-slate-400 hover:text-slate-600'
                        )}
                        title="Grid View"
                    >
                        <LayoutGrid size={16} />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={cn(
                            'p-2 rounded-lg transition-all',
                            viewMode === 'list'
                                ? 'bg-white dark:bg-slate-900 text-amber-600 shadow-sm'
                                : 'text-slate-400 hover:text-slate-600'
                        )}
                        title="List View"
                    >
                        <List size={16} />
                    </button>
                </div>
            </div>

            {/* Content View Modes */}
            {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                    {filtered.map((project) => {
                        const s = STATUS_CFG[project.status] || STATUS_CFG.draft;
                        const budgetDisplay = project.budget ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(project.budget) : null;

                        return (
                            <div key={project.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group flex flex-col">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                            <span className="text-xs font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                                {project.project_id}
                                            </span>
                                            <span className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium', s.chip)}>
                                                <span className={cn('w-1.5 h-1.5 rounded-full', s.dot)} />
                                                {s.label}
                                            </span>
                                            {project.type === 'internal' && (
                                                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400">
                                                    INTERNAL
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="font-semibold text-slate-900 dark:text-slate-100 leading-tight line-clamp-2 text-sm">
                                            {project.title}
                                        </h3>
                                        {project.client && (
                                            <div className="flex items-center gap-2 mt-2">
                                                <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-bold overflow-hidden border border-amber-200 shrink-0 relative">
                                                    <span className="absolute inset-0 flex items-center justify-center text-xs">
                                                        {project.client.name?.charAt(0).toUpperCase()}
                                                    </span>
                                                    {project.client.photo_path && (
                                                        <img
                                                            src={project.client.photo_path}
                                                            alt={project.client.name}
                                                            className="absolute inset-0 w-full h-full object-cover"
                                                            onError={e => { e.target.style.display = 'none'; }}
                                                        />
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-500 font-medium truncate">{project.client.name}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-1.5 mb-4 flex-1">
                                    {project.location && (
                                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                            <MapPin size={11} /> {project.location}
                                        </div>
                                    )}
                                    {project.start_date && (
                                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                            <Calendar size={11} /> Started {project.start_date}
                                            {project.deadline && <span className="text-slate-400">· Due {project.deadline}</span>}
                                        </div>
                                    )}
                                    <div className="flex items-center gap-3 text-xs text-slate-500">
                                        <span className="flex items-center gap-1"><Users size={11} /> {project.team_count || 0}</span>
                                        <span className="flex items-center gap-1"><Bookmark size={11} /> {project.tasks_count || 0} tasks</span>
                                    </div>
                                </div>

                                {/* Progress */}
                                <div className="mb-4">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-xs text-slate-500">Progress</span>
                                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{project.completion}%</span>
                                    </div>
                                    <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all"
                                            style={{
                                                width: `${project.completion}%`,
                                                background: project.completion === 100
                                                    ? 'linear-gradient(90deg,#10b981,#059669)'
                                                    : project.completion > 70
                                                    ? 'linear-gradient(90deg,#3b82f6,#6366f1)'
                                                    : 'linear-gradient(90deg,#f59e0b,#dc2626)',
                                            }}
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center justify-between mt-auto">
                                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                        {budgetDisplay || '—'}
                                    </span>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Link
                                            href={`/projects/${project.id}`}
                                            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                                        >
                                            <Eye size={14} />
                                        </Link>
                                         <Link
                                            href={`/projects/${project.id}`}
                                            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors"
                                        >
                                            <Edit size={14} />
                                        </Link>
                                        {project.status === 'draft' && (
                                            <>
                                                <Link
                                                    href={`/projects/${project.id}?setup=true`}
                                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors"
                                                    title="Setup Project"
                                                >
                                                    <Settings size={14} />
                                                </Link>
                                                <button
                                                    onClick={() => handleDeleteProject(project.id)}
                                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                                                    title="Delete Draft Project"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                /* List View (Table) */
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Project ID</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider min-w-[320px]">Project Name</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Client / Type</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Timeline</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Budget</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Progress</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                {filtered.map((project) => {
                                    const s = STATUS_CFG[project.status] || STATUS_CFG.draft;
                                    return (
                                        <tr key={project.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-500">
                                                {project.project_id}
                                            </td>
                                            <td className="px-6 py-4 min-w-[320px]">
                                                <Link href={`/projects/${project.id}`} className="block hover:text-amber-500 transition-colors group/link">
                                                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover/link:text-amber-500">
                                                        {project.title}
                                                    </div>
                                                    {project.location && (
                                                        <div className="text-xs text-slate-405 dark:text-slate-400 flex items-center gap-1 mt-0.5 group-hover/link:text-amber-500/80">
                                                            <MapPin size={10} /> {project.location}
                                                        </div>
                                                    )}
                                                </Link>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {project.type === 'internal' ? (
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400">
                                                        INTERNAL
                                                    </span>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-bold overflow-hidden border border-amber-200 shrink-0 relative">
                                                            <span className="absolute inset-0 flex items-center justify-center text-[10px]">
                                                                {project.client?.name?.charAt(0).toUpperCase() || '—'}
                                                            </span>
                                                            {project.client?.photo_path && (
                                                                <img
                                                                    src={project.client.photo_path}
                                                                    alt={project.client.name}
                                                                    className="absolute inset-0 w-full h-full object-cover"
                                                                    onError={e => { e.target.style.display = 'none'; }}
                                                                />
                                                            )}
                                                        </div>
                                                        <span className="text-sm text-slate-800 dark:text-slate-200 font-medium truncate max-w-[150px]">{project.client?.name || '—'}</span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                                {project.start_date ? `${project.start_date} - ${project.deadline || '—'}` : '—'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900 dark:text-slate-100">
                                                {project.budget ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(project.budget) : '—'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2 max-w-[120px]">
                                                    <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full"
                                                            style={{
                                                                width: `${project.completion}%`,
                                                                background: project.completion === 100
                                                                    ? '#10b981'
                                                                    : project.completion > 70
                                                                    ? '#3b82f6'
                                                                    : '#f59e0b',
                                                            }}
                                                        />
                                                    </div>
                                                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{project.completion}%</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium', s.chip)}>
                                                    <span className={cn('w-1.5 h-1.5 rounded-full', s.dot)} />
                                                    {s.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Link
                                                        href={`/projects/${project.id}`}
                                                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                                                    >
                                                        <Eye size={16} />
                                                    </Link>
                                                    <Link
                                                        href={`/projects/${project.id}`}
                                                        className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors"
                                                    >
                                                        <Edit size={16} />
                                                    </Link>
                                                    {project.status === 'draft' && (
                                                        <>
                                                            <Link
                                                                href={`/projects/${project.id}?setup=true`}
                                                                className="p-1.5 rounded-lg text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors"
                                                                title="Setup Project"
                                                            >
                                                                <Settings size={16} />
                                                            </Link>
                                                            <button
                                                                onClick={() => handleDeleteProject(project.id)}
                                                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                                                                title="Delete Draft Project"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {filtered.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <Building2 size={48} className="mb-4 opacity-30" />
                    <p className="text-sm font-medium">No projects found</p>
                    <p className="text-xs mt-1">Try adjusting your search or filter</p>
                </div>
            )}

            {/* Wizard */}
            <ProjectWizard open={wizardOpen} onClose={() => setWizardOpen(false)} />
        </AppLayout>
    );
}
