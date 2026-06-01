import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
    UserCircle2, Phone, Mail, MapPin, Building2,
    Calendar, Clock, ArrowLeft, FileText, CreditCard,
    ChevronRight, CheckCircle2, Edit, Camera, Navigation,
} from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { cn } from '@/lib/utils';
import ClientFormDrawer from '@/Components/Clients/ClientFormDrawer';

const statusConfig = {
    active:    { label: 'Active',    className: 'bg-green-100 text-green-700' },
    draft:     { label: 'Draft',     className: 'bg-slate-100 text-slate-600' },
    planning:  { label: 'Planning',  className: 'bg-purple-100 text-purple-700' },
    'on-hold': { label: 'On Hold',   className: 'bg-amber-100 text-amber-700' },
    completed: { label: 'Completed', className: 'bg-blue-100 text-blue-700' },
    cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-700' },
};

function InfoItem({ label, value, icon: Icon }) {
    if (!value) return null;
    return (
        <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                <Icon size={14} className="text-slate-500" />
            </div>
            <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">{label}</p>
                <p className="text-sm text-slate-800 dark:text-slate-200 mt-0.5 font-medium">{value}</p>
            </div>
        </div>
    );
}

export default function ClientShow({ client }) {
    const [editDrawerOpen, setEditDrawerOpen] = useState(false);
    const projects = client.projects || [];
    const activeProjects = projects.filter(p => p.status === 'active').length;
    const completedProjects = projects.filter(p => p.status === 'completed').length;

    return (
        <AppLayout>
            <Head title={`Client – ${client.name}`} />

            {/* Back + Edit header */}
            <div className="flex items-center justify-between mb-6">
                <Link
                    href="/clients"
                    className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-amber-600 transition-colors"
                >
                    <ArrowLeft size={16} />
                    Back to Clients
                </Link>
                <button
                    onClick={() => setEditDrawerOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:shadow-lg hover:-translate-y-0.5"
                    style={{ background: 'linear-gradient(135deg, #f59e0b, #dc2626)', boxShadow: '0 4px 14px rgba(245,158,11,0.25)' }}
                >
                    <Edit size={15} />
                    Edit Client
                </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Left: Client Profile */}
                <div className="xl:col-span-1 space-y-4">
                    {/* Profile Card */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                        <div className="h-20 relative" style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)' }}>
                            <div className="absolute inset-0 opacity-10"
                                style={{
                                    backgroundImage: 'linear-gradient(#f59e0b 1px, transparent 1px), linear-gradient(to right, #f59e0b 1px, transparent 1px)',
                                    backgroundSize: '24px 24px',
                                }} />
                        </div>
                        <div className="px-6 pb-6">
                            {/* Avatar with edit overlay */}
                            <div className="relative -mt-8 w-16 h-16 group">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-2xl font-bold border-4 border-white dark:border-slate-900 shadow-lg overflow-hidden relative">
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
                                {/* Edit photo hint */}
                                <button
                                    onClick={() => setEditDrawerOpen(true)}
                                    className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                    title="Change photo"
                                >
                                    <Camera size={16} className="text-white" />
                                </button>
                            </div>

                            <div className="mt-3">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{client.name}</h2>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                                        {client.client_id}
                                    </span>
                                    <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-medium', statusConfig[client.status]?.className || 'bg-slate-100 text-slate-600')}>
                                        {statusConfig[client.status]?.label || client.status}
                                    </span>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-slate-100 dark:border-slate-800">
                                {[
                                    { label: 'Total', value: projects.length },
                                    { label: 'Active', value: activeProjects },
                                    { label: 'Done', value: completedProjects },
                                ].map(s => (
                                    <div key={s.label} className="text-center">
                                        <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{s.value}</p>
                                        <p className="text-xs text-slate-400">{s.label}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Contact Info */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Contact Information</h3>
                            <button
                                onClick={() => setEditDrawerOpen(true)}
                                className="text-xs text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1"
                            >
                                <Edit size={12} /> Edit
                            </button>
                        </div>
                        <InfoItem label="Mobile" value={client.mobile} icon={Phone} />
                        {client.alternate_mobile && (
                            <InfoItem label="Alternate Mobile" value={client.alternate_mobile} icon={Phone} />
                        )}
                        <InfoItem label="Email" value={client.email} icon={Mail} />
                        {client.address && (
                            <InfoItem
                                label="Address"
                                value={[client.address, client.city, client.state, client.pincode].filter(Boolean).join(', ')}
                                icon={MapPin}
                            />
                        )}
                        {(client.latitude && client.longitude || client.map_location) && (
                            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                    <Navigation size={12} className="text-amber-500" /> Client Location Map
                                </h4>
                                <div className="w-full h-44 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 relative bg-slate-100">
                                    <iframe
                                        title="Client Location Map"
                                        width="100%"
                                        height="100%"
                                        frameBorder="0"
                                        scrolling="no"
                                        marginHeight="0"
                                        marginWidth="0"
                                        src={
                                            client.latitude && client.longitude
                                                ? `https://www.google.com/maps?q=${client.latitude},${client.longitude}&z=15&output=embed`
                                                : `https://maps.google.com/maps?q=${encodeURIComponent(client.map_location)}&output=embed`
                                        }
                                    />
                                </div>
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                        <MapPin size={12} className="text-amber-500 shrink-0" />
                                        <a
                                            href={
                                                client.map_location 
                                                    ? client.map_location 
                                                    : `https://www.google.com/maps?q=${client.latitude},${client.longitude}`
                                            }
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-amber-600 hover:text-amber-700 hover:underline font-semibold truncate"
                                        >
                                            View on Google Maps ↗
                                        </a>
                                    </div>
                                    <a
                                        href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Here is the site/client location details for *${client.name}*:\n\n📍 Address: ${[client.address, client.city, client.state, client.pincode].filter(Boolean).join(', ')}\n🌐 Google Maps Link: ${client.map_location ? client.map_location : `https://www.google.com/maps?q=${client.latitude},${client.longitude}`}`)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow hover:shadow-md transition-all shrink-0"
                                    >
                                        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                                            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.504-5.729-1.464L0 24zm6.59-4.846c1.666.988 3.396 1.472 5.351 1.473 5.4 0 9.791-4.387 9.794-9.786.001-2.614-1.012-5.074-2.853-6.918C17.049 2.08 14.596 1.072 12 1.072 6.602 1.072 2.213 5.46 2.21 10.86c0 1.905.496 3.766 1.436 5.437l-.988 3.606 3.69-.968z" />
                                        </svg>
                                        Share Location on WhatsApp
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Legal Info */}
                    {(client.pan_number || client.gst_number || client.aadhaar_number) && (
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Legal Information</h3>
                                <button
                                    onClick={() => setEditDrawerOpen(true)}
                                    className="text-xs text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1"
                                >
                                    <Edit size={12} /> Edit
                                </button>
                            </div>
                            <InfoItem label="PAN Number" value={client.pan_number} icon={CreditCard} />
                            <InfoItem label="GST Number" value={client.gst_number} icon={FileText} />
                            <InfoItem label="Aadhaar Number" value={client.aadhaar_number ? '••••-••••-' + client.aadhaar_number.slice(-4) : null} icon={CreditCard} />
                        </div>
                    )}

                    {/* Notes */}
                    {client.notes && (
                        <div className="bg-amber-50 dark:bg-amber-500/5 rounded-2xl border border-amber-200 dark:border-amber-500/20 p-5">
                            <h3 className="text-sm font-semibold text-amber-700 dark:text-amber-400 mb-2">Notes</h3>
                            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{client.notes}</p>
                        </div>
                    )}
                </div>

                {/* Right: Projects */}
                <div className="xl:col-span-2">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                            <div>
                                <h3 className="font-semibold text-slate-900 dark:text-slate-100">Associated Projects</h3>
                                <p className="text-xs text-slate-400 mt-0.5">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
                            </div>
                            <Link
                                href="/projects"
                                className="text-xs text-amber-600 font-medium hover:text-amber-700 flex items-center gap-1"
                            >
                                All Projects <ChevronRight size={12} />
                            </Link>
                        </div>

                        {projects.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                                <Building2 size={36} className="mb-3 opacity-30" />
                                <p className="text-sm font-medium">No projects yet</p>
                                <p className="text-xs mt-1">Create a project and link it to this client.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                                            <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Project</th>
                                            <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                                            <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Start Date</th>
                                            <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Deadline</th>
                                            <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                            <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Progress</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                        {projects.map((project) => {
                                            const s = statusConfig[project.status] || statusConfig.draft;
                                            return (
                                                <tr key={project.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                                    <td className="px-5 py-4">
                                                        <Link
                                                            href={`/projects/${project.id}`}
                                                            className="font-medium text-slate-900 dark:text-slate-100 hover:text-amber-600 transition-colors"
                                                        >
                                                            {project.title}
                                                        </Link>
                                                        <p className="text-xs text-slate-400 font-mono">{project.project_id}</p>
                                                    </td>
                                                    <td className="px-5 py-4 capitalize">
                                                        <span className="text-xs px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                                            {project.type}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-4 text-slate-500">
                                                        <div className="flex items-center gap-1">
                                                            <Calendar size={12} />
                                                            {project.start_date || '—'}
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4 text-slate-500">
                                                        <div className="flex items-center gap-1">
                                                            <Clock size={12} />
                                                            {project.deadline || '—'}
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium', s.className)}>
                                                            {s.label}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <div className="flex items-center gap-2 min-w-[100px]">
                                                            <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full rounded-full"
                                                                    style={{
                                                                        width: `${project.completion || 0}%`,
                                                                        background: project.completion === 100
                                                                            ? 'linear-gradient(90deg, #10b981, #059669)'
                                                                            : 'linear-gradient(90deg, #f59e0b, #dc2626)',
                                                                    }}
                                                                />
                                                            </div>
                                                            <span className="text-xs text-slate-500 w-8">{project.completion || 0}%</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Edit Drawer */}
            <ClientFormDrawer
                open={editDrawerOpen}
                onClose={() => setEditDrawerOpen(false)}
                client={client}
                onSaved={() => router.reload()}
            />
        </AppLayout>
    );
}
