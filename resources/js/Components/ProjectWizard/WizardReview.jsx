import React from 'react';
import { UserCircle2, Building2, FileText, Users, ClipboardList, CheckCircle2, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

function Section({ icon: Icon, label, color, children }) {
    return (
        <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl overflow-hidden">
            <div className={cn('flex items-center gap-2 px-4 py-3', color)}>
                <Icon size={15} />
                <h4 className="text-sm font-semibold">{label}</h4>
            </div>
            <div className="px-4 py-3 space-y-1.5">{children}</div>
        </div>
    );
}

function Row({ label, value }) {
    if (!value) return null;
    return (
        <div className="flex justify-between text-sm">
            <span className="text-slate-500">{label}</span>
            <span className="font-medium text-slate-800 dark:text-slate-200 text-right max-w-xs truncate">{value}</span>
        </div>
    );
}

export default function WizardReview({ data, markAsCompleted, setMarkAsCompleted }) {
    const PRIORITY_LABELS = { low: 'Low', medium: 'Medium', high: 'High', critical: 'Critical' };

    return (
        <div className="p-6 space-y-5">
            <div className="p-4 rounded-2xl bg-green-50 dark:bg-green-500/5 border border-green-200 dark:border-green-500/20 flex items-center gap-3">
                <CheckCircle2 size={18} className="text-green-600 shrink-0" />
                <div>
                    <p className="text-sm font-semibold text-green-700 dark:text-green-400">Ready to create!</p>
                    <p className="text-xs text-green-600/80 dark:text-green-400/70">Review the summary below, then click Create Project.</p>
                </div>
            </div>

            {/* Client */}
            {data.client && (
                <Section icon={UserCircle2} label="Client" color="bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400">
                    <Row label="Name" value={data.client.name} />
                    <Row label="ID" value={data.client.client_id} />
                    <Row label="Mobile" value={data.client.mobile} />
                </Section>
            )}

            {/* Project */}
            <Section icon={Building2} label="Project Information" color="bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400">
                <Row label="Title" value={data.title} />
                <Row label="Type" value={data.type === 'client' ? 'Client Project' : 'Internal Project'} />
                <Row label="Start Date" value={data.start_date} />
                <Row label="Deadline" value={data.deadline} />
                <Row label="Initial Status" value={
                    data.status === 'draft' ? 'Draft' :
                    data.status === 'running' ? 'Runing Project' :
                    data.status === 'handover' ? 'Handover' :
                    data.status === 'on-hold' ? 'ON Hold' :
                    data.status === 'cancelled' ? 'Cancelled' :
                    (data.status || 'Draft')
                } />
                <Row label="Site Address (User Input)" value={data.location || 'Not Specified'} />
                <Row label="Google Maps Location" value={data.map_location} />
                {data.description && (
                    <div className="pt-1">
                        <p className="text-xs text-slate-500 mb-1">Description</p>
                        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{data.description}</p>
                    </div>
                )}
            </Section>

            {/* Documents */}
            <Section icon={FileText} label={`Documents (${data.documents.length})`} color="bg-purple-100 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400">
                {data.documents.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No documents added</p>
                ) : data.documents.map(d => (
                    <div key={d.id} className="flex items-center gap-2 text-sm">
                        <FileText size={12} className="text-slate-400 shrink-0" />
                        <span className="text-slate-700 dark:text-slate-300">{d.name || d.file?.name}</span>
                    </div>
                ))}
            </Section>

            {/* Team */}
            <Section icon={Users} label={`Team Members (${data.team.length})`} color="bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400">
                {data.team.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No team members assigned</p>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {data.team.map(m => (
                            <span key={m.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300">
                                <span className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-[10px] font-bold">
                                    {m.name?.charAt(0)}
                                </span>
                                {m.name}
                            </span>
                        ))}
                    </div>
                )}
            </Section>

            {/* Tasks */}
            <Section icon={ClipboardList} label={`Tasks (${data.tasks.length})`} color="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                {data.tasks.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No tasks planned</p>
                ) : data.tasks.map((t, i) => (
                    <div key={t.id} className="flex items-center justify-between py-1">
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400 w-4">{i + 1}.</span>
                            <span className="text-sm text-slate-700 dark:text-slate-300">{t.title || 'Untitled Task'}</span>
                        </div>
                        <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium',
                            t.priority === 'critical' ? 'bg-red-100 text-red-700' :
                            t.priority === 'high'     ? 'bg-amber-100 text-amber-700' :
                            t.priority === 'medium'   ? 'bg-blue-100 text-blue-700' :
                                                        'bg-green-100 text-green-700'
                        )}>
                            {PRIORITY_LABELS[t.priority]}
                        </span>
                    </div>
                ))}
            </Section>

            {/* Mark as Handover Checkbox (for older uploaded data) */}
            <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 flex items-center gap-3 mt-4">
                <input
                    type="checkbox"
                    id="mark-completed-checkbox"
                    checked={markAsCompleted}
                    onChange={(e) => setMarkAsCompleted(e.target.checked)}
                    className="rounded border-slate-300 text-amber-500 focus:ring-amber-400 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="mark-completed-checkbox" className="text-sm font-semibold text-slate-750 dark:text-slate-200 cursor-pointer select-none">
                    Mark project as Handover (for older uploaded data)
                </label>
            </div>
        </div>
    );
}
