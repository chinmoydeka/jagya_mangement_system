import React, { useState, useEffect, useCallback } from 'react';
import { router } from '@inertiajs/react';
import { X, ChevronRight, ChevronLeft, CheckCircle2, Save, Loader2 } from 'lucide-react';
import WizardStep1 from './WizardStep1';
import WizardStep2 from './WizardStep2';
import WizardStep3 from './WizardStep3';
import WizardReview from './WizardReview';
import { cn } from '@/lib/utils';

const STEPS = [
    { id: 1, label: 'Project & Client', short: 'Info' },
    { id: 2, label: 'Documents',        short: 'Docs' },
    { id: 3, label: 'Work Information',  short: 'Work' },
    { id: 4, label: 'Review & Create',  short: 'Review' },
];

const DRAFT_KEY = 'jcms_project_draft';

const defaultData = {
    // Step 1
    client_id: null, client: null,
    client_source: 'Office',
    client_source_member_name: '',
    client_source_member_id: null,
    title: '', type: 'client', description: '',
    agreement_date: '', start_date: '', deadline: '',
    location: '', map_coords: null,
    map_location: '', latitude: null, longitude: null,
    status: 'draft',
    // Step 2
    documents: [],
    // Step 3
    work_type: 'RCC',
    rcc_foundation: '',
    rcc_finishing: '',
    rcc_class: 'A Class',
    assam_roof_type: 'Tin',
    assam_wood_quality: 'Standard',
    assam_rooms: '',
    other_scope: '',
    plinth_area: '',
    slab_area: '',
    head_room: false,
    remarks: '',
    other_info: '',
    road_size: '',
    road_direction: 'North',
    setup_files: [],
    setup_voices: [],
};

const mapProjectToData = (project) => {
    if (!project) return defaultData;
    return {
        id: project.id,
        // Step 1
        client_id: project.client_id || null,
        client: project.client || null,
        client_source: project.client_source || 'Office',
        client_source_member_name: project.client_source_member_name || '',
        client_source_member_id: project.client_source_member_id || null,
        title: project.title || '',
        type: project.type || 'client',
        description: project.description || '',
        agreement_date: project.agreement_date ? project.agreement_date.split('T')[0] : '',
        start_date: project.start_date ? project.start_date.split('T')[0] : '',
        deadline: project.deadline ? project.deadline.split('T')[0] : '',
        location: project.location || '',
        map_location: project.map_location || '',
        latitude: project.latitude || null,
        longitude: project.longitude || null,
        status: project.status || 'draft',
        budget: project.budget ? Math.round(parseFloat(project.budget)) : '',
        // Step 2
        documents: (project.documents || [])
            .filter(doc => ['general', 'agreement', 'kyc'].includes(doc.category))
            .map(doc => ({
                id: doc.id,
                name: doc.document_name,
                description: doc.description || '',
                category: doc.category || 'general',
                file_type: doc.file_type,
                file_size: doc.file_size,
                file_path: doc.file_path,
                file: null,
            })),
        // Step 3
        work_type: project.work_type || 'RCC',
        rcc_foundation: project.rcc_foundation || '',
        rcc_finishing: project.rcc_finishing || '',
        rcc_class: project.rcc_class || 'A Class',
        assam_roof_type: project.assam_type_details?.roof_type || 'Tin',
        assam_wood_quality: project.assam_type_details?.wood_quality || 'Standard',
        assam_rooms: project.assam_type_details?.rooms || '',
        other_scope: project.assam_type_details?.other_scope || '',
        plinth_area: project.plinth_area || '',
        slab_area: project.slab_area || '',
        head_room: !!project.head_room,
        remarks: project.remarks || '',
        other_info: project.other_info || '',
        road_size: project.road_size || '',
        road_direction: project.road_direction || 'North',
        setup_files: [],
        setup_voices: [],
    };
};

export default function ProjectWizard({ open, onClose, project = null }) {
    const isEditMode = !!project;
    const [step, setStep] = useState(1);
    const [data, setData] = useState(defaultData);
    const [saving, setSaving] = useState(false);
    const [isDraft, setIsDraft] = useState(false);
    const [markAsCompleted, setMarkAsCompleted] = useState(false);

    // Load draft or project data on open
    useEffect(() => {
        if (!open) return;
        if (isEditMode) {
            setData(mapProjectToData(project));
            setStep(1);
            setIsDraft(false);
            setMarkAsCompleted(false);
        } else {
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
        }
    }, [open, project]);

    // Auto-save on every change (creation mode only)
    const saveDraft = useCallback((nextData, nextStep) => {
        if (isEditMode) return;
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ data: nextData, step: nextStep, ts: Date.now() }));
        setIsDraft(true);
    }, [isEditMode]);

    function update(fields) {
        const next = { ...data, ...fields };
        setData(next);
        saveDraft(next, step);
    }

    function canProceedFromStep1() {
        if (data.type === 'client') {
            if (!data.client_id) return false;
            if (data.client_source === 'Team Member' && !data.client_source_member_name?.trim()) return false;
        }
        return true;
    }

    // Auto-generate project name (title) on review step
    // Format: work type + foundation in + class with + plinth area and + slab area
    useEffect(() => {
        if (step === 4) {
            const wt = data.work_type || 'RCC';
            const fd = data.work_type === 'RCC' && data.rcc_foundation ? ` ${data.rcc_foundation}` : '';
            const cl = data.work_type === 'RCC' && data.rcc_class ? ` in ${data.rcc_class}` : '';
            const pa = data.plinth_area || '0';
            const sa = data.slab_area || '0';
            const generatedTitle = `${wt}${fd}${cl} with ${pa} sq ft plinth area and ${sa} sq ft as slab area`;
            if (data.title !== generatedTitle) {
                // update state without calling update(fields) which saves to localstorage to avoid loop
                const next = { ...data, title: generatedTitle };
                setData(next);
                if (!isEditMode) {
                    localStorage.setItem(DRAFT_KEY, JSON.stringify({ data: next, step: step, ts: Date.now() }));
                }
            }
        }
    }, [step, data.work_type, data.rcc_foundation, data.rcc_class, data.plinth_area, data.slab_area, isEditMode]);

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
        if (isEditMode) {
            if (!confirm('Close wizard? Unsaved changes will be lost.')) return;
            onClose();
        } else {
            if (!confirm('Close wizard? Your draft is auto-saved and can be resumed.')) return;
            onClose();
        }
    }

    async function handleCreate(asDraft = false) {
        setSaving(true);
        const formData = new FormData();
        
        if (isEditMode) {
            formData.append('_method', 'PUT');
        }

        formData.append('title', data.title);
        formData.append('type', data.type);
        formData.append('description', data.description || '');
        if (data.client_id) {
            formData.append('client_id', data.client_id);
            formData.append('client_source', data.client_source || 'Office');
            if (data.client_source_member_name) {
                formData.append('client_source_member_name', data.client_source_member_name);
            }
            if (data.client_source_member_id) {
                formData.append('client_source_member_id', String(data.client_source_member_id));
            }
        }
        formData.append('agreement_date', data.agreement_date || '');
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
        
        // Append Work Information fields
        formData.append('work_type', data.work_type || 'RCC');
        formData.append('plinth_area', data.plinth_area || '');
        formData.append('slab_area', data.slab_area || '');
        formData.append('head_room', data.head_room ? '1' : '0');
        formData.append('remarks', data.remarks || '');
        formData.append('other_info', data.other_info || '');
        formData.append('road_size', data.road_size || '');
        formData.append('road_direction', data.road_direction || 'North');

        if (data.work_type === 'RCC') {
            formData.append('rcc_foundation', data.rcc_foundation || '');
            formData.append('rcc_finishing', data.rcc_finishing || '');
            formData.append('rcc_class', data.rcc_class || 'A Class');
        } else {
            formData.append('assam_type_details', JSON.stringify({
                roof_type: data.assam_roof_type || 'Tin',
                wood_quality: data.assam_wood_quality || 'Standard',
                rooms: data.assam_rooms || '',
                other_scope: data.other_scope || ''
            }));
        }

        if (data.setup_files) {
            data.setup_files.forEach((fileObj) => {
                if (fileObj.file) {
                    formData.append('setup_files[]', fileObj.file);
                }
            });
        }

        if (data.setup_voices) {
            data.setup_voices.forEach((vObj) => {
                if (vObj.file) {
                    formData.append('setup_voices[]', vObj.file);
                }
            });
        }

        // Add documents (file attachments)
        data.documents.forEach((doc, index) => {
            if (doc.id && typeof doc.id === 'number') {
                formData.append(`document_ids[${index}]`, String(doc.id));
            }
            if (doc.file) {
                formData.append(`document_files[${index}]`, doc.file);
            } else if (doc.media_file_id) {
                formData.append(`document_media_file_ids[${index}]`, doc.media_file_id);
            }
            formData.append(`document_names[${index}]`, doc.name || '');
            formData.append(`document_descriptions[${index}]`, doc.description || '');
            formData.append(`document_categories[${index}]`, doc.category || 'general');
        });

        const url = isEditMode ? `/projects/${project.id}` : '/projects';

        router.post(url, formData, {
            onSuccess: () => {
                if (!isEditMode) {
                    clearDraft();
                }
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
                                {isEditMode ? 'Modify Project Details' : 'Create New Project'}
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
                    {step === 4 && (
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
                        {step === 4 ? (
                            <>
                                {!isEditMode && (
                                    <button
                                        onClick={() => handleCreate(true)}
                                        disabled={saving}
                                        className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors disabled:opacity-60"
                                    >
                                        <Save size={15} /> 
                                        <span className="hidden sm:inline">Save Draft</span>
                                        <span className="inline sm:hidden">Draft</span>
                                    </button>
                                )}
                                <button
                                    onClick={() => handleCreate(false)}
                                    disabled={saving || !data.title}
                                    className="inline-flex items-center gap-1.5 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white transition-all disabled:opacity-60"
                                    style={{ background: 'linear-gradient(135deg, #f59e0b, #dc2626)', boxShadow: '0 4px 14px rgba(245,158,11,0.3)' }}
                                >
                                    {saving ? <Loader2 size={15} className="animate-spin" /> : (isEditMode ? <Save size={15} /> : <CheckCircle2 size={15} />)}
                                    <span className="hidden sm:inline">{isEditMode ? 'Save Changes' : 'Create Project'}</span>
                                    <span className="inline sm:hidden">{isEditMode ? 'Save' : 'Create'}</span>
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

