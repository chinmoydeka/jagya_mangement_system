import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import {
    Users,
    Plus,
    Search,
    Mail,
    Phone,
    MoreVertical,
    Shield,
    UserCheck,
    Briefcase,
    Edit,
    Trash2,
    Eye,
    X,
    Upload,
    Loader2,
} from 'lucide-react';
import axios from 'axios';
import AppLayout from '@/Layouts/AppLayout';
import ImageCropperModal from '@/Components/ImageCropperModal';
import { cn } from '@/lib/utils';

const GRAD_COLORS = [
    'from-amber-400 to-orange-500',
    'from-blue-400 to-indigo-500',
    'from-green-400 to-emerald-500',
    'from-purple-400 to-pink-500',
    'from-red-400 to-rose-500',
    'from-teal-400 to-cyan-500',
];

const statusConfig = {
    active: { label: 'Active', className: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400' },
    'on-leave': { label: 'On Leave', className: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400' },
    inactive: { label: 'Inactive', className: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400' },
};

function MemberCard({ member, index }) {
    const s = statusConfig[member.status || 'active'] || statusConfig.active;
    const gradientClass = GRAD_COLORS[index % GRAD_COLORS.length];

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className={cn('w-12 h-12 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white font-bold text-sm shrink-0 overflow-hidden', gradientClass)}>
                        {member.photo_path ? (
                            <img src={member.photo_path} alt={member.name} className="w-full h-full object-cover" />
                        ) : (
                            member.avatar || (member.name || '?').charAt(0)
                        )}
                    </div>
                    <div>
                        <p className="font-semibold text-slate-900 dark:text-slate-100">{member.name}</p>
                        <p className="text-xs text-slate-500">{member.designation || member.role}</p>
                    </div>
                </div>
                <button className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors opacity-0 group-hover:opacity-100">
                    <MoreVertical size={16} />
                </button>
            </div>

            <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs">
                    <Briefcase size={12} />
                    <span>{member.department || 'General'}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs">
                    <Mail size={12} />
                    <span className="truncate">{member.email}</span>
                </div>
                {member.phone && (
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs">
                        <Phone size={12} />
                        <span>{member.phone}</span>
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium', s.className)}>
                        {s.label}
                    </span>
                    {member.projects > 0 && (
                        <span className="text-xs text-slate-400">{member.projects} project{member.projects !== 1 ? 's' : ''}</span>
                    )}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors">
                        <Eye size={13} />
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function Team({ members = [] }) {
    const [localMembers, setLocalMembers] = useState(members);
    const [activeDept, setActiveDept] = useState('All');
    const [search, setSearch] = useState('');
    
    // Form and Drawer States
    const [showAddDrawer, setShowAddDrawer] = useState(false);
    const [createStep, setCreateStep] = useState(1);
    const [saving, setSaving] = useState(false);
    const [successToast, setSuccessToast] = useState('');
    const [formErrors, setFormErrors] = useState({});
    
    // For Cropper
    const [cropModalOpen, setCropModalOpen] = useState(false);
    const [rawOriginalFile, setRawOriginalFile] = useState(null);

    useEffect(() => {
        if (showAddDrawer) {
            setFormErrors({});
        }
    }, [showAddDrawer]);

    const [createForm, setCreateForm] = useState({
        name: '',
        phone: '',
        photo: null,
        photoPreview: null,
        designation: '',
        salary: '',
        joining_date: new Date().toISOString().split('T')[0],
        department: 'Engineering',
        email: '',
        password: '',
        role: 'Staff',
        send_email: true,
    });

    useEffect(() => {
        setLocalMembers(members);
    }, [members]);

    // Unique departments extracted dynamically
    const dynamicDepts = ['All', ...new Set(localMembers.map(m => m.department).filter(Boolean))];

    const filtered = localMembers.filter((m) => {
        const matchSearch =
            (m.name || '').toLowerCase().includes(search.toLowerCase()) ||
            (m.designation || m.role || '').toLowerCase().includes(search.toLowerCase());
        const matchDept = activeDept === 'All' || m.department === activeDept;
        return matchSearch && matchDept;
    });

    const deptCounts = {};
    localMembers.forEach((m) => {
        if (m.department) {
            deptCounts[m.department] = (deptCounts[m.department] || 0) + 1;
        }
    });

    // Generate random secure password
    const generateRandomPassword = () => {
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*';
        let pass = '';
        for (let i = 0; i < 10; i++) {
            pass += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setCreateForm(prev => ({ ...prev, password: pass }));
    };

    // Form submission
    const handleCreateMemberSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        const formData = new FormData();
        formData.append('name', createForm.name);
        formData.append('phone', createForm.phone || '');
        if (createForm.photo) {
            formData.append('photo', createForm.photo);
        }
        formData.append('designation', createForm.designation || '');
        formData.append('salary', createForm.salary || '');
        formData.append('joining_date', createForm.joining_date || '');
        formData.append('department', createForm.department || '');
        formData.append('email', createForm.email);
        formData.append('password', createForm.password);
        formData.append('role', createForm.role);
        formData.append('send_email', createForm.send_email ? '1' : '0');

        try {
            const res = await axios.post('/team', formData, {
                headers: { 
                    'Content-Type': 'multipart/form-data',
                    'Accept': 'application/json'
                }
            });
            
            if (res.data.success) {
                // Reload Inertia props to sync DB cleanly
                router.reload({
                    only: ['members'],
                    onSuccess: () => {
                        setShowAddDrawer(false);
                        setCreateStep(1);
                        setCreateForm({
                            name: '',
                            phone: '',
                            photo: null,
                            photoPreview: null,
                            designation: '',
                            salary: '',
                            joining_date: new Date().toISOString().split('T')[0],
                            department: 'Engineering',
                            email: '',
                            password: '',
                            role: 'Staff',
                            send_email: true,
                        });
                        setSuccessToast('New staff member added and welcomed successfully!');
                        setTimeout(() => setSuccessToast(''), 4000);
                    }
                });
            }
        } catch (err) {
            console.error(err);
            if (err.response?.data?.errors) {
                const errors = err.response.data.errors;
                setFormErrors(errors);
                
                const errorKeys = Object.keys(errors);
                if (errorKeys.length > 0) {
                    alert(`Validation Error: ${errors[errorKeys[0]][0]}`);
                    
                    if (errors.email || errors.password || errors.role) {
                        setCreateStep(3);
                    } else if (errors.designation || errors.salary || errors.joining_date || errors.department) {
                        setCreateStep(2);
                    } else {
                        setCreateStep(1);
                    }
                }
            } else {
                alert(err.response?.data?.message || 'Failed to save team member. Please try again.');
            }
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
        <AppLayout>
            <Head title="Team Members" />

            {/* Float success toast */}
            {successToast && (
                <div className="fixed bottom-6 right-6 z-[99999] px-4 py-3 bg-slate-900 dark:bg-slate-800 text-white rounded-xl shadow-2xl flex items-center gap-2 border border-slate-700/50 animate-slide-in-right">
                    <span className="text-emerald-400">✓</span>
                    <span className="text-xs font-semibold">{successToast}</span>
                </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Team Members</h1>
                    <p className="text-sm text-slate-500 mt-0.5">{localMembers.length} members across {Object.keys(deptCounts).length} departments</p>
                </div>
                <button
                    onClick={() => setShowAddDrawer(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:shadow-lg hover:-translate-y-0.5"
                    style={{ background: 'linear-gradient(135deg, #f59e0b, #dc2626)', boxShadow: '0 4px 14px rgba(245,158,11,0.3)' }}
                >
                    <Plus size={16} />
                    Add Member
                </button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {[
                    { label: 'Total Members', value: localMembers.length, icon: Users, color: 'text-blue-600 bg-blue-50 dark:bg-blue-500/10' },
                    { label: 'Active', value: localMembers.filter(m => m.status === 'active').length, icon: UserCheck, color: 'text-green-600 bg-green-50 dark:bg-green-500/10' },
                    { label: 'Departments', value: Object.keys(deptCounts).length, icon: Briefcase, color: 'text-purple-600 bg-purple-50 dark:bg-purple-500/10' },
                    { label: 'On Leave', value: localMembers.filter(m => m.status === 'on-leave').length, icon: Shield, color: 'text-amber-600 bg-amber-50 dark:bg-amber-500/10' },
                ].map(s => (
                    <div key={s.label} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 flex items-center gap-3">
                        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', s.color)}>
                            <s.icon size={18} />
                        </div>
                        <div>
                            <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{s.value}</p>
                            <p className="text-xs text-slate-500">{s.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="relative flex-1 max-w-sm">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by name or role..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/50 text-slate-700 dark:text-slate-300 placeholder-slate-400"
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                    {dynamicDepts.map((d) => (
                        <button
                            key={d}
                            onClick={() => setActiveDept(d)}
                            className={cn(
                                'px-3.5 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all',
                                activeDept === d
                                    ? 'text-white shadow-md'
                                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                            )}
                            style={activeDept === d ? { background: 'linear-gradient(135deg, #f59e0b, #dc2626)' } : {}}
                        >
                            {d}
                        </button>
                    ))}
                </div>
            </div>

            {/* Members Grid */}
            {filtered.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
                    <Users className="mx-auto mb-4 text-slate-300 dark:text-slate-700" size={48} />
                    <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-1">No Team Members Found</h3>
                    <p className="text-sm text-slate-400">Add a new staff member or refine your search filters.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                    {filtered.map((member, i) => (
                        <MemberCard key={member.id} member={member} index={i} />
                    ))}
                </div>
            )}

            {/* Dynamic Add Team Member Popup & 3-Step Wizard Drawer */}
            {showAddDrawer && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-end">
                    {/* Backdrop */}
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setShowAddDrawer(false)} />
                    
                    {/* Drawer Container */}
                    <div className="relative w-full max-w-md h-full bg-white dark:bg-slate-900 shadow-2xl flex flex-col z-10 animate-slide-in-right">
                        {/* Drawer Header */}
                        <div className="p-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
                            <div className="flex items-center justify-between">
                                <h4 className="font-extrabold text-slate-900 dark:text-white text-base tracking-tight">Create Staff Member</h4>
                                <button type="button" onClick={() => setShowAddDrawer(false)} className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 flex items-center justify-center transition-colors">
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Drawer Body - Wizard Form */}
                        <form onSubmit={handleCreateMemberSubmit} className="flex-1 overflow-y-auto min-h-0 flex flex-col justify-between">
                            <div className="p-5 space-y-4">
                                {/* Step Indicators */}
                                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-2">
                                    <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-amber-600">
                                        Step {createStep} of 3
                                    </span>
                                    <div className="flex gap-1">
                                        {[1, 2, 3].map(step => (
                                            <div key={step} className={cn("h-1.5 w-6 rounded-full transition-colors", step <= createStep ? "bg-amber-500" : "bg-slate-200 dark:bg-slate-700")} />
                                        ))}
                                    </div>
                                </div>

                                {/* STEP 1: Personal Information */}
                                {createStep === 1 && (
                                    <div className="space-y-4 animate-fade-in">
                                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Personal Details</div>
                                        
                                        {/* Photo Upload */}
                                        <div className="flex flex-col items-center gap-2.5 py-2">
                                            <div className="relative group w-20 h-20 rounded-full border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center bg-slate-50 dark:bg-slate-800 overflow-hidden shrink-0">
                                                {createForm.photoPreview ? (
                                                    <img src={createForm.photoPreview} alt="Avatar Preview" className="w-full h-full object-cover" />
                                                ) : (
                                                    <Upload size={20} className="text-slate-400 group-hover:text-amber-500 transition-colors" />
                                                )}
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={e => {
                                                        const file = e.target.files[0];
                                                        if (file) {
                                                            setRawOriginalFile(file);
                                                            setCropModalOpen(true);
                                                        }
                                                        e.target.value = '';
                                                    }}
                                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                                />
                                            </div>
                                            <span className="text-[10px] text-slate-400">Upload profile photo (Max 2MB)</span>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Name *</label>
                                            <input
                                                type="text"
                                                required
                                                value={createForm.name}
                                                onChange={e => setCreateForm({ ...createForm, name: e.target.value })}
                                                placeholder="e.g. Ramesh Sharma"
                                                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/50 text-slate-800 dark:text-slate-200"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Mobile / Phone Number</label>
                                            <input
                                                type="tel"
                                                value={createForm.phone}
                                                onChange={e => setCreateForm({ ...createForm, phone: e.target.value })}
                                                placeholder="e.g. +91 98765 43210"
                                                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/50 text-slate-800 dark:text-slate-200"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Department</label>
                                            <select
                                                value={createForm.department}
                                                onChange={e => setCreateForm({ ...createForm, department: e.target.value })}
                                                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/50 text-slate-700 dark:text-slate-300"
                                            >
                                                <option value="Engineering">Engineering</option>
                                                <option value="Architecture">Architecture</option>
                                                <option value="Finance">Finance</option>
                                                <option value="HR">HR</option>
                                                <option value="Front Office">Front Office</option>
                                                <option value="IT">IT</option>
                                                <option value="Marketing">Marketing</option>
                                            </select>
                                        </div>
                                    </div>
                                )}

                                {/* STEP 2: Job / Employment Info */}
                                {createStep === 2 && (
                                    <div className="space-y-4 animate-fade-in">
                                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Job Details</div>

                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Designation / Role Title</label>
                                            <input
                                                type="text"
                                                value={createForm.designation}
                                                onChange={e => setCreateForm({ ...createForm, designation: e.target.value })}
                                                placeholder="e.g. Site Supervisor, Junior Architect"
                                                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/50 text-slate-800 dark:text-slate-200"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Salary / Monthly CTC (₹)</label>
                                            <input
                                                type="number"
                                                value={createForm.salary}
                                                onChange={e => setCreateForm({ ...createForm, salary: e.target.value })}
                                                placeholder="e.g. 45000"
                                                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/50 text-slate-800 dark:text-slate-200"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Date of Joining</label>
                                            <input
                                                type="date"
                                                value={createForm.joining_date}
                                                onChange={e => setCreateForm({ ...createForm, joining_date: e.target.value })}
                                                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/50 text-slate-800 dark:text-slate-200"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* STEP 3: Portal Credentials & System Role */}
                                {createStep === 3 && (
                                    <div className="space-y-4 animate-fade-in">
                                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Portal Account</div>

                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Email Address *</label>
                                            <input
                                                type="email"
                                                required
                                                value={createForm.email}
                                                onChange={e => {
                                                    setCreateForm({ ...createForm, email: e.target.value });
                                                    setFormErrors(prev => ({ ...prev, email: null }));
                                                }}
                                                placeholder="e.g. staffname@jagyaconstruction.in"
                                                className={cn(
                                                    "w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/50 text-slate-800 dark:text-slate-200",
                                                    formErrors.email ? "border-red-500 bg-red-50 focus:ring-red-500/20" : "border-slate-200 dark:border-slate-700"
                                                )}
                                            />
                                            {formErrors.email && (
                                                <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded-lg flex items-center gap-2">
                                                    <span className="text-red-600 font-bold">⚠️</span>
                                                    <p className="text-xs text-red-700 font-semibold">
                                                        {Array.isArray(formErrors.email) ? formErrors.email[0] : formErrors.email}
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">System Role *</label>
                                            <select
                                                value={createForm.role}
                                                onChange={e => setCreateForm({ ...createForm, role: e.target.value })}
                                                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/50 text-slate-700 dark:text-slate-300"
                                            >
                                                <option value="Admin">Admin (Full Access)</option>
                                                <option value="Project Manager">Project Manager</option>
                                                <option value="Engineer">Engineer</option>
                                                <option value="Accountant">Accountant</option>
                                                <option value="Staff">Staff / Supervisor</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Password *</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    required
                                                    value={createForm.password}
                                                    onChange={e => setCreateForm({ ...createForm, password: e.target.value })}
                                                    placeholder="Type password or tap generate"
                                                    className="flex-1 px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/50 text-slate-800 dark:text-slate-200 font-mono"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={generateRandomPassword}
                                                    className="px-3 py-2.5 text-xs font-semibold rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-100 border border-amber-200/50 flex items-center gap-1 transition-all"
                                                >
                                                    ⚡ Generate
                                                </button>
                                            </div>
                                        </div>

                                        {/* Send Email Checkbox */}
                                        <label className="flex items-start gap-2.5 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 cursor-pointer select-none group">
                                            <input
                                                type="checkbox"
                                                checked={createForm.send_email}
                                                onChange={e => setCreateForm({ ...createForm, send_email: e.target.checked })}
                                                className="mt-0.5 rounded border-slate-300 dark:border-slate-700 text-amber-500 focus:ring-amber-400/50"
                                            />
                                            <div>
                                                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Email portal credentials to staff</p>
                                                <p className="text-[10px] text-slate-400 mt-0.5">Sends automated email containing portal URL & password credentials securely.</p>
                                            </div>
                                        </label>
                                    </div>
                                )}
                            </div>

                            {/* Drawer Footer Actions */}
                            <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-end gap-2.5 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (createStep > 1) setCreateStep(createStep - 1);
                                        else setShowAddDrawer(false);
                                    }}
                                    className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                                >
                                    {createStep === 1 ? 'Cancel' : 'Back'}
                                </button>
                                
                                {createStep < 3 ? (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (createStep === 1 && !createForm.name) {
                                                alert('Please enter staff name');
                                                return;
                                            }
                                            setCreateStep(createStep + 1);
                                        }}
                                        className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold transition-all shadow-md"
                                    >
                                        Next Step
                                    </button>
                                ) : (
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
                                    >
                                        {saving ? <Loader2 size={13} className="animate-spin" /> : null}
                                        ✓ Finish & Create
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
            <ImageCropperModal
                isOpen={cropModalOpen}
                onClose={() => {
                    setCropModalOpen(false);
                    setRawOriginalFile(null);
                }}
                originalFile={rawOriginalFile}
                onCropComplete={(croppedFile, previewUrl) => {
                    setCreateForm(prev => ({
                        ...prev,
                        photo: croppedFile,
                        photoPreview: previewUrl
                    }));
                    setCropModalOpen(false);
                    setRawOriginalFile(null);
                }}
            />
        </>
    );
}
