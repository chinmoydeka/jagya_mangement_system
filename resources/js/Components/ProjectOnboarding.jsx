import React, { useState, useMemo, useRef, useEffect } from 'react';
import { router } from '@inertiajs/react';
import {
    Activity, FileText, DollarSign, Users, ChevronRight, Check, X,
    Upload, Loader2, Save, Trash2, Search, Plus, Mic, StopCircle,
    ChevronDown, Info, ClipboardList
} from 'lucide-react';
import { cn } from '@/lib/utils';
import axios from 'axios';
import TasksPlanningStep from './TasksPlanningStep';

export default function ProjectOnboarding({ project, onClose }) {
    const [step, setStep] = useState(1);
    const [submitting, setSubmitting] = useState(false);

    // Form states
    const [contractsForm, setContractsForm] = useState({
        agreements: [{ id: Date.now(), type: 'Civil Work Order', files: [], note: '' }],
        kycs: [{ id: Date.now() + 1, type: 'Civil Contractor', name: '', phone: '', address: '', photo: null, documents: [], note: '' }]
    });
    
    // Dynamic KYC types and Agreement types
    const [kycTypes, setKycTypes] = useState(['Civil Contractor', 'Interior Contractor', 'Plumber', 'Electrician', 'Labour']);
    const [newKycType, setNewKycType] = useState('');
    
    const [agreementTypes, setAgreementTypes] = useState(['Civil Work Order', 'Interior Work Order', 'Plumbing Agreement', 'Consulting Agreement']);
    const [newAgreementType, setNewAgreementType] = useState('');

    const [financeForm, setFinanceForm] = useState({
        amount: '',
        date: new Date().toISOString().split('T')[0],
        proof: null,
        note: ''
    });

    const [budgetForm, setBudgetForm] = useState(project.budget || '');

    const [milestonesForm, setMilestonesForm] = useState(
        project.payment_milestones && project.payment_milestones.length > 0
            ? project.payment_milestones
            : [
                { id: Date.now(), stage: 'Token amount or signing amount', percentage: 2 },
                { id: Date.now() + 1, stage: 'Plinth & Foundation', percentage: 35 },
                { id: Date.now() + 2, stage: 'Columns and Slab', percentage: 25 },
                { id: Date.now() + 3, stage: 'Brick wall and plaster', percentage: 30 },
                { id: Date.now() + 4, stage: 'Finishing', percentage: 8 }
            ]
    );

    const [teamForm, setTeamForm] = useState(
        project.team ? project.team.reduce((acc, m) => {
            acc[m.id] = { role: m.pivot?.role || 'Other', customRole: m.pivot?.role || '' };
            return acc;
        }, {}) : {}
    );
    const [teamSearch, setTeamSearch] = useState('');

    // Tasks Planning State
    const [tasks, setTasks] = useState([]);
    const [allMembers, setAllMembers] = useState([]);
    const [loadingMembers, setLoadingMembers] = useState(false);

    useEffect(() => {
        setLoadingMembers(true);
        axios.get('/projects/team-members')
            .then(res => {
                setAllMembers(res.data || []);
            })
            .catch(err => {
                console.error('Error fetching team members:', err);
            })
            .finally(() => {
                setLoadingMembers(false);
            });
    }, []);

    const steps = [
        { id: 1, title: 'Welcome', icon: Activity },
        { id: 2, title: 'Tasks & Planning', icon: ClipboardList },
        { id: 3, title: 'Payment Milestones', icon: DollarSign },
        { id: 4, title: 'Agreements', icon: FileText },
        { id: 5, title: 'KYC', icon: Users },
        { id: 6, title: 'Assign Engineers', icon: Users }
    ];

    const nextStep = () => setStep(s => Math.min(6, s + 1));
    const prevStep = () => setStep(s => Math.max(1, s - 1));

    const skipAll = () => {
        window.history.replaceState({}, '', `/projects/${project.id}`);
        onClose();
    };

    const submitAll = async () => {
        setSubmitting(true);
        try {
            const formData = new FormData();

            // 0. Tasks & Planning
            tasks.forEach((t, index) => {
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

            // 1. Agreements
            formData.append('agreements_count', contractsForm.agreements.length);
            contractsForm.agreements.forEach((a, idx) => {
                formData.append(`agreement_type_${idx}`, a.type || '');
                formData.append(`agreement_note_${idx}`, a.note || '');
                if (a.files && a.files.length > 0) {
                    a.files.forEach(file => {
                        formData.append(`agreement_files_${idx}[]`, file);
                    });
                }
            });

            // 2. KYCs
            formData.append('kycs_count', contractsForm.kycs.length);
            contractsForm.kycs.forEach((k, idx) => {
                formData.append(`kyc_type_${idx}`, k.type || '');
                formData.append(`kyc_name_${idx}`, k.name || '');
                formData.append(`kyc_phone_${idx}`, k.phone || '');
                formData.append(`kyc_address_${idx}`, k.address || '');
                formData.append(`kyc_note_${idx}`, k.note || '');
                if (k.photo) {
                    formData.append(`kyc_photo_${idx}`, k.photo);
                }
                if (k.documents && k.documents.length > 0) {
                    k.documents.forEach(file => {
                        formData.append(`kyc_docs_${idx}[]`, file);
                    });
                }
            });

            // 3. Finances
            if (financeForm.amount) {
                formData.append('payment_amount', financeForm.amount);
                formData.append('payment_date', financeForm.date || '');
                formData.append('payment_note', financeForm.note || '');
                if (financeForm.proof) {
                    formData.append('payment_proof', financeForm.proof);
                }
            }

            // 4. Team Assignments
            formData.append('team_assignments', JSON.stringify(teamForm));

            // 5. Payment Milestones
            formData.append('budget', budgetForm);
            formData.append('payment_milestones', JSON.stringify(milestonesForm));

            const response = await axios.post(`/projects/${project.id}/setup`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (response.data.success) {
                router.reload();
                onClose();
            }
        } catch (e) {
            console.error('Failed to submit onboarding setup details', e);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-slide-up flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                        <Activity size={18} className="text-amber-500" />
                        <h3 className="font-bold">Project Setup</h3>
                    </div>
                    <button onClick={skipAll} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                        <X size={18} />
                    </button>
                </div>

                {/* Stepper */}
                <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/25 border-b border-slate-150 dark:border-slate-800/80">
                    {/* Mobile Stepper View */}
                    <div className="flex sm:hidden flex-col gap-2">
                        <div className="flex justify-between items-center text-xs">
                            <span className="font-extrabold text-amber-600 dark:text-amber-500 uppercase tracking-widest">
                                Step {step} of {steps.length}
                            </span>
                            <span className="font-bold text-slate-700 dark:text-slate-355">
                                {steps[step - 1]?.title}
                            </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div 
                                style={{ width: `${(step / steps.length) * 100}%` }}
                                className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-350"
                            />
                        </div>
                    </div>

                    {/* Desktop Stepper View */}
                    <div className="hidden sm:flex justify-between py-2">
                        {steps.map((s, i) => (
                            <div key={s.id} className="flex flex-col items-center gap-2 relative z-10 flex-1">
                                <div className={cn(
                                    "w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 border-2 z-10 bg-white dark:bg-slate-900",
                                    step === s.id 
                                        ? "border-amber-500 text-amber-600 shadow-md scale-110" 
                                        : step > s.id 
                                            ? "border-amber-500 bg-amber-500 text-white"
                                            : "border-slate-200 dark:border-slate-800 text-slate-400"
                                )}>
                                    {step > s.id ? <Check size={14} /> : <s.icon size={13} />}
                                </div>
                                <span className={cn(
                                    "text-[9px] uppercase tracking-wider font-extrabold text-center px-1 max-w-[80px] break-words",
                                    step >= s.id ? "text-slate-800 dark:text-slate-200" : "text-slate-400"
                                )}>
                                    {s.title}
                                </span>
                                
                                {/* Connector Line */}
                                {i < steps.length - 1 && (
                                    <div className={cn(
                                        "absolute top-4.5 left-1/2 w-full h-0.5 -z-10 transition-colors duration-500",
                                        step > s.id ? "bg-amber-500" : "bg-slate-100 dark:bg-slate-800"
                                    )} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8">
                    {step === 1 && (
                        <div className="text-center animate-fade-in py-8">
                            <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl rotate-3">
                                <Activity size={40} className="text-white" />
                            </div>
                            <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-3">
                                {project.title} Created!
                            </h2>
                            <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                                Let's configure the essential details for your project. We'll set up your contracts, log the first client payment, and assign a site engineer.
                            </p>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6 animate-fade-in pr-2">
                            <TasksPlanningStep 
                                data={{ tasks, team: allMembers }} 
                                update={(fields) => {
                                    if (fields.tasks) {
                                        setTasks(fields.tasks);
                                    }
                                }} 
                            />
                        </div>
                    )}

                    {step === 4 && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Upload Agreements & Work Orders</h3>
                                    <p className="text-xs text-slate-500">Attach initial contracts dynamically.</p>
                                </div>
                                <button 
                                    onClick={() => setContractsForm(prev => ({...prev, agreements: [...prev.agreements, { id: Date.now(), type: 'Civil Work Order', files: [], note: '' }]}))}
                                    className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1"
                                >
                                    <Plus size={14} /> Add Agreement
                                </button>
                            </div>
                            
                            <div className="space-y-4">
                                {contractsForm.agreements.map((agreement, idx) => (
                                    <div key={agreement.id} className="bg-slate-50 dark:bg-slate-800/30 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Agreement {idx + 1}</span>
                                            {contractsForm.agreements.length > 1 && (
                                                <button onClick={() => setContractsForm(prev => ({...prev, agreements: prev.agreements.filter(a => a.id !== agreement.id)}))} className="text-red-500 hover:text-red-600">
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Agreement Type</label>
                                                <div className="flex gap-2">
                                                    <select 
                                                        value={agreementTypes.includes(agreement.type) ? agreement.type : 'Other'} 
                                                        onChange={e => {
                                                            const val = e.target.value;
                                                            setContractsForm(prev => ({...prev, agreements: prev.agreements.map(a => a.id === agreement.id ? {...a, type: val} : a)}));
                                                        }}
                                                        className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-amber-500"
                                                    >
                                                        {agreementTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                                        <option value="Other">Other (Add New)</option>
                                                    </select>
                                                </div>
                                                {(!agreementTypes.includes(agreement.type) || agreement.type === 'Other') && (
                                                    <div className="mt-2 flex gap-2">
                                                        <input 
                                                            type="text" 
                                                            placeholder="Custom Type" 
                                                            value={newAgreementType}
                                                            onChange={e => setNewAgreementType(e.target.value)}
                                                            className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-amber-500 placeholder-slate-400 dark:placeholder-slate-500"
                                                        />
                                                        <button 
                                                            type="button"
                                                            onClick={() => {
                                                                if (newAgreementType && !agreementTypes.includes(newAgreementType)) {
                                                                    setAgreementTypes(prev => [...prev, newAgreementType]);
                                                                    setContractsForm(prev => ({...prev, agreements: prev.agreements.map(a => a.id === agreement.id ? {...a, type: newAgreementType} : a)}));
                                                                    setNewAgreementType('');
                                                                }
                                                            }}
                                                            className="px-3 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
                                                        >
                                                            Add
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Upload File</label>
                                                <label className="border border-dashed border-slate-300 hover:border-blue-400 rounded-xl p-3 flex items-center gap-3 cursor-pointer bg-white transition-colors h-10 w-full">
                                                    <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                                                        <Upload size={12} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[10px] text-slate-600 truncate font-semibold">{agreement.files && agreement.files.length > 0 ? `${agreement.files.length} file(s) selected` : 'Select Files'}</p>
                                                    </div>
                                                    <input type="file" multiple onChange={e => setContractsForm(prev => ({...prev, agreements: prev.agreements.map(a => a.id === agreement.id ? {...a, files: Array.from(e.target.files)} : a)}))} className="hidden" />
                                                </label>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Note (Optional)</label>
                                            <input 
                                                type="text" 
                                                value={agreement.note}
                                                onChange={e => setContractsForm(prev => ({...prev, agreements: prev.agreements.map(a => a.id === agreement.id ? {...a, note: e.target.value} : a)}))}
                                                placeholder="Add a short note..."
                                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-amber-500 placeholder-slate-400 dark:placeholder-slate-500"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 5 && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Contractor / Labor KYCs</h3>
                                    <p className="text-xs text-slate-500">Attach initial labor agreements.</p>
                                </div>
                                <button 
                                    onClick={() => setContractsForm(prev => ({...prev, kycs: [...prev.kycs, { id: Date.now(), type: 'Civil Contractor', name: '', phone: '', address: '', photo: null, documents: [], note: '' }]}))}
                                    className="text-xs font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg hover:bg-amber-100 transition-colors flex items-center gap-1"
                                >
                                    <Plus size={14} /> Add KYC
                                </button>
                            </div>

                            <div className="space-y-4">
                                {contractsForm.kycs.map((kyc, idx) => (
                                    <div key={kyc.id} className="relative bg-slate-50 dark:bg-slate-800/30 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
                                        {kyc.photo && (
                                            <img 
                                                src={URL.createObjectURL(kyc.photo)} 
                                                alt="KYC Photo" 
                                                className="absolute top-4 right-10 w-10 h-10 rounded-full object-cover border-2 border-white dark:border-slate-800 shadow-sm z-10"
                                            />
                                        )}
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">KYC Record {idx + 1}</span>
                                            {contractsForm.kycs.length > 1 && (
                                                <button onClick={() => setContractsForm(prev => ({...prev, kycs: prev.kycs.filter(k => k.id !== kyc.id)}))} className="text-red-500 hover:text-red-600">
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Contractor Type</label>
                                                <div className="flex gap-2">
                                                    <select 
                                                        value={kycTypes.includes(kyc.type) ? kyc.type : 'Other'} 
                                                        onChange={e => {
                                                            const val = e.target.value;
                                                            setContractsForm(prev => ({...prev, kycs: prev.kycs.map(k => k.id === kyc.id ? {...k, type: val} : k)}));
                                                        }}
                                                        className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-amber-500"
                                                    >
                                                        {kycTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                                        <option value="Other">Other (Add New)</option>
                                                    </select>
                                                </div>
                                                {(!kycTypes.includes(kyc.type) || kyc.type === 'Other') && (
                                                    <div className="mt-2 flex gap-2">
                                                        <input 
                                                            type="text" 
                                                            placeholder="Custom Type" 
                                                            value={newKycType}
                                                            onChange={e => setNewKycType(e.target.value)}
                                                            className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-amber-500 placeholder-slate-400 dark:placeholder-slate-500"
                                                        />
                                                        <button 
                                                            type="button"
                                                            onClick={() => {
                                                                if (newKycType && !kycTypes.includes(newKycType)) {
                                                                    setKycTypes(prev => [...prev, newKycType]);
                                                                    setContractsForm(prev => ({...prev, kycs: prev.kycs.map(k => k.id === kyc.id ? {...k, type: newKycType} : k)}));
                                                                    setNewKycType('');
                                                                }
                                                            }}
                                                            className="px-3 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
                                                        >
                                                            Add
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Name</label>
                                                <input 
                                                    type="text" 
                                                    value={kyc.name}
                                                    onChange={e => setContractsForm(prev => ({...prev, kycs: prev.kycs.map(k => k.id === kyc.id ? {...k, name: e.target.value} : k)}))}
                                                    placeholder="Full Name"
                                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-amber-500 placeholder-slate-400 dark:placeholder-slate-500"
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Phone Number</label>
                                                <input 
                                                    type="tel" 
                                                    value={kyc.phone || ''}
                                                    onChange={e => setContractsForm(prev => ({...prev, kycs: prev.kycs.map(k => k.id === kyc.id ? {...k, phone: e.target.value} : k)}))}
                                                    placeholder="Contact Number"
                                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-amber-500 placeholder-slate-400 dark:placeholder-slate-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Address</label>
                                                <input 
                                                    type="text" 
                                                    value={kyc.address || ''}
                                                    onChange={e => setContractsForm(prev => ({...prev, kycs: prev.kycs.map(k => k.id === kyc.id ? {...k, address: e.target.value} : k)}))}
                                                    placeholder="Full Address"
                                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-amber-500 placeholder-slate-400 dark:placeholder-slate-500"
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                            <label className="border border-dashed border-slate-300 hover:border-amber-400 rounded-xl p-3 flex items-center gap-3 cursor-pointer bg-white transition-colors">
                                                <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
                                                    <Users size={14} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-bold text-slate-700">Photo</p>
                                                    <p className="text-[10px] text-slate-400 truncate">{kyc.photo ? kyc.photo.name : 'Upload Profile Photo'}</p>
                                                </div>
                                                <input type="file" accept="image/*" onChange={e => setContractsForm(prev => ({...prev, kycs: prev.kycs.map(k => k.id === kyc.id ? {...k, photo: e.target.files[0]} : k)}))} className="hidden" />
                                            </label>
                                            <label className="border border-dashed border-slate-300 hover:border-blue-400 rounded-xl p-3 flex items-center gap-3 cursor-pointer bg-white transition-colors">
                                                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                                                    <FileText size={14} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-bold text-slate-700">KYC Documents</p>
                                                    <p className="text-[10px] text-slate-400 truncate">{kyc.documents && kyc.documents.length > 0 ? `${kyc.documents.length} file(s) selected` : 'Aadhar, PAN, etc.'}</p>
                                                </div>
                                                <input type="file" multiple onChange={e => setContractsForm(prev => ({...prev, kycs: prev.kycs.map(k => k.id === kyc.id ? {...k, documents: Array.from(e.target.files)} : k)}))} className="hidden" />
                                            </label>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Note (Optional)</label>
                                            <input 
                                                type="text" 
                                                value={kyc.note || ''}
                                                onChange={e => setContractsForm(prev => ({...prev, kycs: prev.kycs.map(k => k.id === kyc.id ? {...k, note: e.target.value} : k)}))}
                                                placeholder="Add a short note..."
                                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-amber-500 placeholder-slate-400 dark:placeholder-slate-500"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-6 animate-fade-in flex-1 overflow-y-auto pr-2">
                            <div className="text-center mb-4">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Client Payment Structure</h3>
                                <p className="text-xs text-slate-500">Define milestones and promised payment percentages based on the budget.</p>
                                <div className="mt-3 inline-flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold">
                                    <span className="text-slate-500">Total Budget: ₹</span>
                                    <input
                                        type="number"
                                        step="1"
                                        min="0"
                                        value={budgetForm}
                                        onChange={e => setBudgetForm(e.target.value)}
                                        placeholder="0"
                                        className="w-32 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-amber-600 dark:text-amber-400 font-bold focus:ring-2 focus:ring-amber-500 text-right outline-none placeholder-slate-400 dark:placeholder-slate-500"
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                {milestonesForm.map((m, idx) => (
                                    <div key={m.id} className="p-4 bg-slate-50 dark:bg-slate-800/20 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3 relative group/milestone animate-slide-up">
                                        <div className="flex items-center gap-3">
                                            <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center text-xs font-bold shrink-0">
                                                {idx + 1}
                                            </div>
                                            <div className="flex-1">
                                                <input
                                                    type="text"
                                                    value={m.stage}
                                                    onChange={e => setMilestonesForm(prev => prev.map(item => item.id === m.id ? { ...item, stage: e.target.value } : item))}
                                                    placeholder="e.g. On Plinth Level Completion"
                                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-amber-500 placeholder-slate-400 dark:placeholder-slate-500"
                                                />
                                            </div>
                                            <div className="w-24 relative flex items-center">
                                                <input
                                                    type="number"
                                                    value={m.percentage}
                                                    onChange={e => setMilestonesForm(prev => prev.map(item => item.id === m.id ? { ...item, percentage: parseFloat(e.target.value) || '' } : item))}
                                                    placeholder="0"
                                                    min="0"
                                                    max="100"
                                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-xl pl-3 pr-6 py-2 text-xs font-bold focus:ring-2 focus:ring-amber-500 text-right placeholder-slate-400 dark:placeholder-slate-500"
                                                />
                                                <span className="absolute right-2 text-xs font-bold text-slate-400 pointer-events-none">%</span>
                                            </div>
                                            {milestonesForm.length > 1 && (
                                                <button
                                                    onClick={() => setMilestonesForm(prev => prev.filter(item => item.id !== m.id))}
                                                    className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors shrink-0"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                        <div className="pl-9 flex justify-between items-center text-[10px]">
                                            <span className="text-slate-400 uppercase font-bold tracking-wider">Calculated Amount:</span>
                                            <span className="text-slate-700 dark:text-slate-300 font-bold bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 px-2.5 py-1 rounded-lg">
                                                {(() => {
                                                    const b = parseFloat(budgetForm) || 0;
                                                    const p = parseFloat(m.percentage) || 0;
                                                    if (!b) return '—';
                                                    const rsVal = (b * p) / 100;
                                                    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(rsVal);
                                                })()}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-between items-center pt-2">
                                <button
                                    onClick={() => setMilestonesForm(prev => [...prev, { id: Date.now(), stage: '', percentage: 10 }])}
                                    className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/20 dark:hover:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-amber-200/50"
                                >
                                    <Plus size={14} /> Add Payment Milestone
                                </button>

                                <div className="text-right space-y-1">
                                    <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                        Total Promised: {' '}
                                        <span className={cn(
                                            'px-2 py-0.5 rounded-lg text-xs font-extrabold',
                                            milestonesForm.reduce((sum, item) => sum + (parseFloat(item.percentage) || 0), 0) === 100
                                                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400'
                                                : 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400'
                                        )}>
                                            {milestonesForm.reduce((sum, item) => sum + (parseFloat(item.percentage) || 0), 0)}%
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {milestonesForm.reduce((sum, item) => sum + (parseFloat(item.percentage) || 0), 0) !== 100 && (
                                <div className="bg-amber-50 dark:bg-amber-900/20 p-3.5 rounded-2xl border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2.5 shadow-sm">
                                    <Activity size={18} className="shrink-0 mt-0.5 text-amber-500" />
                                    <div>
                                        <span className="font-bold">Heads up:</span> Current milestone percentages sum to <span className="font-black underline">{milestonesForm.reduce((sum, item) => sum + (parseFloat(item.percentage) || 0), 0)}%</span> instead of exactly 100%. We recommend aligning the milestones to sum to exactly 100% of the budget.
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {step === 6 && (
                        <div className="space-y-6 animate-fade-in flex-1 overflow-y-auto pr-2">
                            <div className="text-center mb-6">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Assign Site Engineers</h3>
                                <p className="text-xs text-slate-500">Select the primary people responsible for execution updates.</p>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Select Team Members</label>
                                
                                <div className="relative mb-3">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                                    <input
                                        type="text"
                                        placeholder="Search team members..."
                                        value={teamSearch}
                                        onChange={e => setTeamSearch(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 placeholder-slate-400 dark:placeholder-slate-500"
                                    />
                                </div>
                                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                                    {loadingMembers ? (
                                        <div className="flex items-center justify-center p-6">
                                            <Loader2 className="animate-spin text-amber-500 mr-2" size={16} />
                                            <span className="text-xs text-slate-500">Loading team members...</span>
                                        </div>
                                    ) : allMembers && allMembers.length > 0 ? allMembers
                                        .filter(m => (m.name || '').toLowerCase().includes(teamSearch.toLowerCase()) || (m.role || '').toLowerCase().includes(teamSearch.toLowerCase()))
                                        .map(member => {
                                            const isSelected = !!teamForm[member.id];
                                            const assignment = teamForm[member.id] || { role: 'Site Engineer', customRole: '' };
                                            return (
                                            <div key={member.id} className="flex flex-col gap-2 p-3 bg-white border border-slate-200 rounded-xl hover:border-amber-400 hover:bg-amber-50/30 transition-colors">
                                                <label className="flex items-center gap-3 cursor-pointer">
                                                    <input 
                                                        type="checkbox" 
                                                        className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 border-slate-300"
                                                        checked={isSelected}
                                                        onChange={e => {
                                                            if (e.target.checked) {
                                                                setTeamForm(prev => ({...prev, [member.id]: { role: 'Site Engineer', customRole: '' }}));
                                                            } else {
                                                                const newForm = { ...teamForm };
                                                                delete newForm[member.id];
                                                                setTeamForm(newForm);
                                                            }
                                                        }}
                                                    />
                                                    <div className="flex-1">
                                                        <p className="text-sm font-bold text-slate-800">{member.name}</p>
                                                        <p className="text-[10px] text-slate-500">{member.role || 'Staff'}</p>
                                                    </div>
                                                </label>
                                                
                                                {isSelected && (
                                                    <div className="pl-7 pr-2 flex flex-col gap-2 mt-1 animate-fade-in">
                                                        <select
                                                            value={assignment.role}
                                                            onChange={e => setTeamForm(prev => ({...prev, [member.id]: { ...prev[member.id], role: e.target.value }}))}
                                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-amber-500"
                                                        >
                                                            <option value="Site Engineer">Site Engineer</option>
                                                            <option value="Project Manager">Project Manager</option>
                                                            <option value="Architect">Architect</option>
                                                            <option value="Other">Other (Add New)</option>
                                                        </select>
                                                        {assignment.role === 'Other' && (
                                                            <input
                                                                type="text"
                                                                placeholder="Enter custom role..."
                                                                value={assignment.customRole}
                                                                onChange={e => setTeamForm(prev => ({...prev, [member.id]: { ...prev[member.id], customRole: e.target.value }}))}
                                                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-amber-500 placeholder-slate-400 dark:placeholder-slate-500"
                                                                autoFocus
                                                            />
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}) : (
                                        <p className="text-sm text-slate-500 italic p-4 text-center border border-slate-200 border-dashed rounded-xl">No team members added to this project yet.</p>
                                    )}
                                </div>
                            </div>

                            <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-200 dark:border-amber-800 text-sm text-amber-800 dark:text-amber-200 mt-6 flex items-start gap-3">
                                <Activity size={20} className="shrink-0 mt-0.5" />
                                <p>You're all set! The site engineer will be able to post updates, attach photos with GPS coordinates, and add voice recordings from the Execution tab.</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Controls */}
                <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                    <button 
                        onClick={step === 1 ? skipAll : prevStep} 
                        className="px-6 py-2.5 rounded-xl font-bold text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                        {step === 1 ? 'Skip Setup' : 'Back'}
                    </button>
                    
                    <button 
                        onClick={step === 6 ? submitAll : nextStep}
                        disabled={submitting}
                        className="px-8 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl font-bold text-sm transition-all shadow-md flex items-center gap-2"
                    >
                        {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
                        {step === 6 ? 'Finish Setup' : 'Continue'} 
                        {step !== 6 && <ChevronRight size={16} />}
                    </button>
                </div>
            </div>
        </div>
    );
}
