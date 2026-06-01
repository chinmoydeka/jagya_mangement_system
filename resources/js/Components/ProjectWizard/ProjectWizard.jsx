import React, { useState, useEffect, useCallback } from 'react';
import { router } from '@inertiajs/react';
import { X, ChevronRight, ChevronLeft, CheckCircle2, Save, Loader2 } from 'lucide-react';
import WizardStep1 from './WizardStep1';
import WizardStep2 from './WizardStep2';
import WizardStep3 from './WizardStep3';
import WizardStep4 from './WizardStep4';
import WizardReview from './WizardReview';
import { cn } from '@/lib/utils';

const STEPS = [
    { id: 1, label: 'Project & Client', short: 'Info' },
    { id: 2, label: 'Documents',        short: 'Docs' },
    { id: 3, label: 'Team Assignment',  short: 'Team' },
    { id: 4, label: 'Tasks & Planning', short: 'Tasks' },
    { id: 5, label: 'Review & Create',  short: 'Review' },
];

const DRAFT_KEY = 'jcms_project_draft';

const defaultData = {
    // Step 1
    client_id: null, client: null,
    title: '', type: 'client', description: '',
    start_date: '', deadline: '',
    location: '', map_coords: null,
    map_location: '', latitude: null, longitude: null,
    status: 'draft',
    // Step 2
    documents: [],
    // Step 3
    team: [],
    // Step 4
    tasks: [],
};

export default function ProjectWizard({ open, onClose }) {
    const [step, setStep] = useState(1);
    const [data, setData] = useState(defaultData);
    const [saving, setSaving] = useState(false);
    const [isDraft, setIsDraft] = useState(false);
    const [markAsCompleted, setMarkAsCompleted] = useState(false);

    // Load draft on open
    useEffect(() => {
        if (!open) return;
        try {
            const saved = localStorage.getItem(DRAFT_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                setData({ ...defaultData, ...(parsed.data || {}) });
                setStep(parsed.step || 1);
                setIsDraft(true);
            } else {
                setData(defaultData);
                setStep(1);
                setIsDraft(false);
                setMarkAsCompleted(false);
            }
        } catch { /* ignore */ }
    }, [open]);

    // Auto-save on every change
    const saveDraft = useCallback((nextData, nextStep) => {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ data: nextData, step: nextStep, ts: Date.now() }));
        setIsDraft(true);
    }, []);

    function update(fields) {
        const next = { ...data, ...fields };
        setData(next);
        saveDraft(next, step);
    }

    function canProceedFromStep1() {
        if (!data.title) return false;
        if (!data.start_date) return false;
        if (data.type === 'client' && !data.client_id) return false;
        return true;
    }

    function goNext() { 
        if (step === 1 && !canProceedFromStep1()) return;
        setStep(s => Math.min(s + 1, STEPS.length)); 
    }
    
    function goPrev() { setStep(s => Math.max(s - 1, 1)); }

    function clearDraft() {
        localStorage.removeItem(DRAFT_KEY);
        setIsDraft(false);
        setData(defaultData);
        setStep(1);
        setMarkAsCompleted(false);
    }

    function handleClose() {
        if (!confirm('Close wizard? Your draft is auto-saved and can be resumed.')) return;
        onClose();
    }

    async function handleCreate(asDraft = false) {
        setSaving(true);
        const formData = new FormData();
        formData.append('title', data.title);
        formData.append('type', data.type);
        formData.append('description', data.description || '');
        if (data.client_id) formData.append('client_id', data.client_id);
        formData.append('start_date', data.start_date || '');
        formData.append('deadline', data.deadline || '');
        formData.append('location', data.location || '');
        formData.append('map_location', data.map_location || '');
        if (data.latitude !== null && data.latitude !== undefined && data.latitude !== '') {
            formData.append('latitude', String(data.latitude));
        }
        if (data.longitude !== null && data.longitude !== undefined && data.longitude !== '') {
            formData.append('longitude', String(data.longitude));
        }
        let finalStatus = asDraft ? 'draft' : (data.status || 'running');
        if (!asDraft && markAsCompleted) {
            finalStatus = 'handover';
        }
        formData.append('status', finalStatus);
        
        data.team.forEach(m => {
            formData.append('team_ids[]', m.id);
        });

        // Add documents (file attachments)
        data.documents.forEach((doc, index) => {
            if (doc.file) {
                formData.append(`document_files[${index}]`, doc.file);
                formData.append(`document_names[${index}]`, doc.name || doc.file.name);
                formData.append(`document_descriptions[${index}]`, doc.description || '');
            }
        });

        // Add tasks
        data.tasks.forEach((t, index) => {
            formData.append(`tasks[${index}][title]`, t.title || 'Untitled Task');
            formData.append(`tasks[${index}][description]`, t.description || '');
            formData.append(`tasks[${index}][priority]`, t.priority || 'medium');
            formData.append(`tasks[${index}][status]`, t.status || 'to-do');
            if (t.assignee_id) formData.append(`tasks[${index}][assignee_id]`, t.assignee_id);
            if (t.collaborator_ids) {
                t.collaborator_ids.forEach(cid => {
                    formData.append(`tasks[${index}][collaborator_ids][]`, cid);
                });
            }

            // Task files
            if (t.attachments) {
                t.attachments.forEach((fileObj) => {
                    if (fileObj.file) {
                        formData.append(`task_files_${index}[]`, fileObj.file);
                    }
                });
            }

            // Task voice notes
            if (t.voice_notes) {
                t.voice_notes.forEach((vObj) => {
                    if (vObj.file) {
                        formData.append(`task_voices_${index}[]`, vObj.file);
                    }
                });
            }
        });

        router.post('/projects', formData, {
            onSuccess: () => {
                clearDraft();
                onClose();
            },
            onError: () => setSaving(false),
            onFinish: () => setSaving(false),
        });
    }

    if (!open) return null;

    const progress = ((step - 1) / (STEPS.length - 1)) * 100;

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" />

            {/* Full-screen Drawer */}
            <div className="fixed inset-y-0 right-0 z-50 w-full max-w-3xl bg-white dark:bg-slate-900 shadow-2xl flex flex-col">

                {/* ── Header ── */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                            style={{ background: 'linear-gradient(135deg, #f59e0b, #dc2626)' }}>
                            <span className="text-white font-bold text-sm">{step}</span>
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                                Create New Project
                            </h2>
                            <p className="text-xs text-slate-400">Step {step} of {STEPS.length} — {STEPS[step - 1].label}</p>
                        </div>
                        {isDraft && (
                            <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
                                Draft
                            </span>
                        )}
                    </div>
                    <button
                        onClick={handleClose}
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* ── Stepper ── */}
                <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
                    <div className="flex items-center gap-1">
                        {STEPS.map((s, i) => (
                            <React.Fragment key={s.id}>
                                <button
                                    onClick={() => s.id <= step && setStep(s.id)}
                                    className={cn(
                                        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                                        step === s.id
                                            ? 'text-white shadow-sm'
                                            : s.id < step
                                            ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10'
                                            : 'text-slate-400 cursor-default'
                                    )}
                                    style={step === s.id ? { background: 'linear-gradient(135deg, #f59e0b, #dc2626)' } : {}}
                                >
                                    {s.id < step
                                        ? <CheckCircle2 size={12} />
                                        : <span className="w-4 h-4 rounded-full border flex items-center justify-center text-[10px]"
                                            style={{ borderColor: step === s.id ? 'white' : 'currentColor' }}>{s.id}</span>
                                    }
                                    <span className="hidden sm:inline">{s.short}</span>
                                </button>
                                {i < STEPS.length - 1 && (
                                    <div className={cn('flex-1 h-0.5 rounded-full', s.id < step ? 'bg-green-300' : 'bg-slate-200 dark:bg-slate-700')} />
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                    {/* Progress bar */}
                    <div className="mt-2 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #f59e0b, #dc2626)' }}
                        />
                    </div>
                </div>

                {/* ── Step Content ── */}
                <div className="flex-1 overflow-y-auto">
                    {step === 1 && <WizardStep1 data={data} update={update} />}
                    {step === 2 && <WizardStep2 data={data} update={update} />}
                    {step === 3 && <WizardStep3 data={data} update={update} />}
                    {step === 4 && <WizardStep4 data={data} update={update} />}
                    {step === 5 && (
                        <WizardReview 
                            data={data} 
                            markAsCompleted={markAsCompleted} 
                            setMarkAsCompleted={setMarkAsCompleted} 
                        />
                    )}
                </div>

                {/* ── Footer ── */}
                <div className="flex items-center justify-between gap-2 sm:gap-3 px-4 sm:px-6 py-3.5 sm:py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 shrink-0">
                    <div className="flex items-center gap-2">
                        {step > 1 && (
                            <button
                                onClick={goPrev}
                                className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 transition-colors"
                            >
                                <ChevronLeft size={16} /> Back
                            </button>
                        )}
                        <button
                            onClick={handleClose}
                            className="hidden sm:inline-flex px-4 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
                        >
                            Close
                        </button>
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2">
                        {step === 5 ? (
                            <>
                                <button
                                    onClick={() => handleCreate(true)}
                                    disabled={saving}
                                    className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors disabled:opacity-60"
                                >
                                    <Save size={15} /> 
                                    <span className="hidden sm:inline">Save Draft</span>
                                    <span className="inline sm:hidden">Draft</span>
                                </button>
                                <button
                                    onClick={() => handleCreate(false)}
                                    disabled={saving || !data.title}
                                    className="inline-flex items-center gap-1.5 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white transition-all disabled:opacity-60"
                                    style={{ background: 'linear-gradient(135deg, #f59e0b, #dc2626)', boxShadow: '0 4px 14px rgba(245,158,11,0.3)' }}
                                >
                                    {saving ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                                    <span className="hidden sm:inline">Create Project</span>
                                    <span className="inline sm:hidden">Create</span>
                                </button>
                            </>
                        ) : (
                            <>
                                {step >= 2 && (
                                    <button
                                        onClick={goNext}
                                        className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
                                    >
                                        Skip
                                    </button>
                                )}
                                <button
                                    onClick={goNext}
                                    disabled={step === 1 && !canProceedFromStep1()}
                                    className="inline-flex items-center gap-1.5 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white transition-all disabled:opacity-60"
                                    style={{ background: 'linear-gradient(135deg, #f59e0b, #dc2626)', boxShadow: '0 4px 14px rgba(245,158,11,0.3)' }}
                                >
                                    <span className="hidden sm:inline">Save & Continue</span>
                                    <span className="inline sm:hidden">Continue</span>
                                    <ChevronRight size={16} />
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
