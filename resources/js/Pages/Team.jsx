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

function MemberCard({ member, index, onViewDetails }) {
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
                    <button 
                        onClick={() => onViewDetails(member)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                    >
                        <Eye size={13} />
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function Team({ members = [], pendingMembers = [], departments = [], designations = [], offices = [] }) {
    const [localMembers, setLocalMembers] = useState(members);
    const [localPending, setLocalPending] = useState(pendingMembers);
    const [localDepartments, setLocalDepartments] = useState(departments);
    const [localDesignations, setLocalDesignations] = useState(designations);
    const [localOffices, setLocalOffices] = useState(offices);

    const [activeTab, setActiveTab] = useState('active'); // 'active' or 'pending'
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

    // Configuration Management Modal
    const [showConfigModal, setShowConfigModal] = useState(false);
    const [newDeptName, setNewDeptName] = useState('');
    const [newDesigName, setNewDesigName] = useState('');
    const [configSaving, setConfigSaving] = useState(false);

    // Approval Flow States
    const [showApproveDrawer, setShowApproveDrawer] = useState(false);
    const [selectedPendingMember, setSelectedPendingMember] = useState(null);
    const [approvalSaving, setApprovalSaving] = useState(false);

    const [approvalForm, setApprovalForm] = useState({
        designation: '',
        salary: '',
        joining_date: new Date().toISOString().split('T')[0],
        department: '',
        office: '',
        role: 'Staff',
        password: '',
        send_email: true,
    });

    // Detailed Profile Viewer State
    const [showDetailsDrawer, setShowDetailsDrawer] = useState(false);
    const [selectedMemberDetails, setSelectedMemberDetails] = useState(null);

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
        designation: designations[0]?.name || '',
        salary: '',
        joining_date: new Date().toISOString().split('T')[0],
        department: departments[0]?.name || 'Engineering',
        office: offices[0]?.name || '',
        email: '',
        password: '',
        role: 'Staff',
        send_email: true,
    });

    useEffect(() => {
        setLocalMembers(members);
    }, [members]);

    useEffect(() => {
        setLocalPending(pendingMembers);
    }, [pendingMembers]);

    useEffect(() => {
        setLocalDepartments(departments);
        if (departments.length > 0 && !createForm.department) {
            setCreateForm(prev => ({ ...prev, department: departments[0].name }));
        }
    }, [departments]);

    useEffect(() => {
        setLocalDesignations(designations);
        if (designations.length > 0 && !createForm.designation) {
            setCreateForm(prev => ({ ...prev, designation: designations[0].name }));
        }
    }, [designations]);

    useEffect(() => {
        setLocalOffices(offices);
        if (offices.length > 0 && !createForm.office) {
            setCreateForm(prev => ({ ...prev, office: offices[0].name }));
        }
    }, [offices]);

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
        formData.append('office', createForm.office || '');
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
                            designation: designations[0]?.name || '',
                            salary: '',
                            joining_date: new Date().toISOString().split('T')[0],
                            department: departments[0]?.name || 'Engineering',
                            office: offices[0]?.name || '',
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
                    } else if (errors.designation || errors.salary || errors.joining_date || errors.department || errors.office) {
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

    // Approval Submission
    const handleApproveMemberSubmit = async (e) => {
        e.preventDefault();
        if (!selectedPendingMember) return;
        setApprovalSaving(true);

        try {
            const res = await axios.post(`/team/${selectedPendingMember.id}/approve`, approvalForm, {
                headers: { 'Accept': 'application/json' }
            });
            if (res.data.success) {
                router.reload({
                    only: ['members', 'pendingMembers'],
                    onSuccess: () => {
                        setShowApproveDrawer(false);
                        setSelectedPendingMember(null);
                        setSuccessToast('Team member registration approved and activated!');
                        setTimeout(() => setSuccessToast(''), 4000);
                    }
                });
            }
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || 'Failed to approve registration.');
        } finally {
            setApprovalSaving(false);
        }
    };

    // Rejection / Deletion of Member
    const handleRejectMember = async (memberId) => {
        if (!confirm('Are you sure you want to reject and delete this registration/member?')) return;
        
        try {
            const res = await axios.delete(`/team/${memberId}`, {
                headers: { 'Accept': 'application/json' }
            });
            if (res.data.success) {
                router.reload({
                    only: ['members', 'pendingMembers'],
                    onSuccess: () => {
                        setShowApproveDrawer(false);
                        setSelectedPendingMember(null);
                        setSuccessToast('Team member record removed successfully.');
                        setTimeout(() => setSuccessToast(''), 4000);
                    }
                });
            }
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || 'Failed to remove team member.');
        }
    };

    // Department Management
    const handleAddDepartment = async (e) => {
        e.preventDefault();
        if (!newDeptName) return;
        setConfigSaving(true);
        try {
            const res = await axios.post('/departments', { name: newDeptName }, {
                headers: { 'Accept': 'application/json' }
            });
            if (res.data.success) {
                setNewDeptName('');
                router.reload({
                    only: ['departments'],
                    onSuccess: () => {
                        setSuccessToast('Department added successfully!');
                        setTimeout(() => setSuccessToast(''), 4000);
                    }
                });
            }
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || 'Failed to add department. Make sure name is unique.');
        } finally {
            setConfigSaving(false);
        }
    };

    const handleDeleteDepartment = async (id) => {
        if (!confirm('Are you sure you want to delete this department?')) return;
        try {
            const res = await axios.delete(`/departments/${id}`, {
                headers: { 'Accept': 'application/json' }
            });
            if (res.data.success) {
                router.reload({
                    only: ['departments'],
                    onSuccess: () => {
                        setSuccessToast('Department deleted successfully.');
                        setTimeout(() => setSuccessToast(''), 4000);
                    }
                });
            }
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || 'Failed to delete department.');
        }
    };

    // Designation Management
    const handleAddDesignation = async (e) => {
        e.preventDefault();
        if (!newDesigName) return;
        setConfigSaving(true);
        try {
            const res = await axios.post('/designations', { name: newDesigName }, {
                headers: { 'Accept': 'application/json' }
            });
            if (res.data.success) {
                setNewDesigName('');
                router.reload({
                    only: ['designations'],
                    onSuccess: () => {
                        setSuccessToast('Designation added successfully!');
                        setTimeout(() => setSuccessToast(''), 4000);
                    }
                });
            }
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || 'Failed to add designation. Make sure name is unique.');
        } finally {
            setConfigSaving(false);
        }
    };

    const handleDeleteDesignation = async (id) => {
        if (!confirm('Are you sure you want to delete this designation?')) return;
        try {
            const res = await axios.delete(`/designations/${id}`, {
                headers: { 'Accept': 'application/json' }
            });
            if (res.data.success) {
                router.reload({
                    only: ['designations'],
                    onSuccess: () => {
                        setSuccessToast('Designation deleted successfully.');
                        setTimeout(() => setSuccessToast(''), 4000);
                    }
                });
            }
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || 'Failed to delete designation.');
        }
    };

    const generateRandomApprovalPassword = () => {
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*';
        let pass = '';
        for (let i = 0; i < 10; i++) {
            pass += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setApprovalForm(prev => ({ ...prev, password: pass }));
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

            {/* Tab Selection */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 mb-6">
                <div className="flex gap-4">
                    <button
                        onClick={() => setActiveTab('active')}
                        className={cn(
                            "pb-3 text-sm font-semibold border-b-2 transition-all px-1 cursor-pointer",
                            activeTab === 'active'
                                ? "border-amber-500 text-amber-600 dark:text-amber-400"
                                : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                        )}
                    >
                        Active Staff ({localMembers.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('pending')}
                        className={cn(
                            "pb-3 text-sm font-semibold border-b-2 transition-all px-1 flex items-center gap-1.5 cursor-pointer",
                            activeTab === 'pending'
                                ? "border-amber-500 text-amber-600 dark:text-amber-400"
                                : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                        )}
                    >
                        Pending Approvals
                        {localPending.length > 0 && (
                            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white shrink-0">
                                {localPending.length}
                            </span>
                        )}
                    </button>
                </div>
                <button
                    onClick={() => setShowConfigModal(true)}
                    className="pb-3 text-xs font-semibold text-slate-500 hover:text-amber-500 transition-colors flex items-center gap-1 cursor-pointer"
                >
                    ⚙ Manage Dept & Designations
                </button>
            </div>

            {activeTab === 'active' ? (
                <>
                    {/* Filters */}
                    <div className="flex flex-col sm:flex-row gap-3 mb-6">
                        <div className="relative flex-1 max-w-sm">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search active staff..."
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
                                        'px-3.5 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all cursor-pointer',
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
                        <div className="text-center py-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl animate-fade-in">
                            <Users className="mx-auto mb-4 text-slate-300 dark:text-slate-700" size={48} />
                            <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-1">No Team Members Found</h3>
                            <p className="text-sm text-slate-400">Add a new staff member or refine your search filters.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 animate-fade-in">
                            {filtered.map((member, i) => (
                                <MemberCard 
                                    key={member.id} 
                                    member={member} 
                                    index={i} 
                                    onViewDetails={(m) => {
                                        setSelectedMemberDetails(m);
                                        setShowDetailsDrawer(true);
                                    }}
                                />
                            ))}
                        </div>
                    )}
                </>
            ) : (
                <>
                    {/* Pending Approvals List */}
                    {localPending.length === 0 ? (
                        <div className="text-center py-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl animate-fade-in">
                            <UserCheck className="mx-auto mb-4 text-slate-300 dark:text-slate-700" size={48} />
                            <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-1">No Pending Approvals</h3>
                            <p className="text-sm text-slate-400">Prospects can register using the link on the portal's login page.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 animate-fade-in">
                            {localPending.map((p, i) => (
                                <div key={p.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 hover:shadow-lg transition-all duration-200 group flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm shrink-0 overflow-hidden">
                                                {p.photo_path ? (
                                                    <img src={p.photo_path} alt={p.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    p.avatar || p.name.charAt(0)
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-900 dark:text-slate-100">{p.name}</p>
                                                <p className="text-xs text-amber-500 font-medium">Pending Approval</p>
                                            </div>
                                        </div>
                                        <div className="space-y-2 text-xs text-slate-500 dark:text-slate-400 mb-4">
                                            <div className="flex items-center gap-2">
                                                <Briefcase size={12} />
                                                <span>Preferred Dept: {p.department || 'Not specified'}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Mail size={12} />
                                                <span className="truncate">{p.email}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Phone size={12} />
                                                <span>{p.phone || 'No phone'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setSelectedPendingMember(p);
                                            setApprovalForm({
                                                designation: p.designation || (localDesignations[0]?.name || ''),
                                                salary: '',
                                                joining_date: p.joining_date || new Date().toISOString().split('T')[0],
                                                department: p.department || (localDepartments[0]?.name || 'Engineering'),
                                                office: p.office || (localOffices[0]?.name || ''),
                                                role: 'Staff',
                                                password: '',
                                                send_email: true,
                                            });
                                            setShowApproveDrawer(true);
                                        }}
                                        className="w-full py-2.5 rounded-xl border border-amber-200 dark:border-amber-900/50 hover:bg-amber-50 dark:hover:bg-amber-950/20 text-xs font-bold text-amber-600 dark:text-amber-400 transition-all flex items-center justify-center gap-1 cursor-pointer"
                                    >
                                        Review & Approve
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </>
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
                                                {localDepartments.map(dept => (
                                                    <option key={dept.id} value={dept.name}>{dept.name}</option>
                                                ))}
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
                                            <select
                                                value={createForm.designation}
                                                onChange={e => setCreateForm({ ...createForm, designation: e.target.value })}
                                                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/50 text-slate-700 dark:text-slate-300"
                                            >
                                                {localDesignations.map(desig => (
                                                    <option key={desig.id} value={desig.name}>{desig.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Office Location</label>
                                            <select
                                                value={createForm.office}
                                                onChange={e => setCreateForm({ ...createForm, office: e.target.value })}
                                                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/50 text-slate-700 dark:text-slate-300"
                                            >
                                                {localOffices.map(off => (
                                                    <option key={off.id} value={off.name}>{off.name}</option>
                                                ))}
                                            </select>
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

            {/* Review & Approve Drawer */}
            {showApproveDrawer && selectedPendingMember && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-end">
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => {
                        setShowApproveDrawer(false);
                        setSelectedPendingMember(null);
                    }} />
                    <div className="relative w-full max-w-2xl h-full bg-white dark:bg-slate-900 shadow-2xl flex flex-col z-10 animate-slide-in-right">
                        <div className="p-5 border-b border-slate-100 dark:border-slate-800 shrink-0 flex items-center justify-between">
                            <div>
                                <h4 className="font-extrabold text-slate-900 dark:text-white text-base tracking-tight">Review & Approve Staff Registration</h4>
                                <p className="text-xs text-slate-500 mt-0.5">Approve user's profile and assign system credentials.</p>
                            </div>
                            <button type="button" onClick={() => {
                                setShowApproveDrawer(false);
                                setSelectedPendingMember(null);
                            }} className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 flex items-center justify-center transition-colors">
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleApproveMemberSubmit} className="flex-1 overflow-y-auto min-h-0 flex flex-col justify-between">
                            <div className="p-6 space-y-6">
                                {/* Profile overview */}
                                <div className="flex gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-800">
                                    <div className="w-16 h-16 rounded-2xl bg-amber-500 flex items-center justify-center text-white font-extrabold text-base shrink-0 overflow-hidden shadow-md">
                                        {selectedPendingMember.photo_path ? (
                                            <img src={selectedPendingMember.photo_path} alt={selectedPendingMember.name} className="w-full h-full object-cover" />
                                        ) : (
                                            selectedPendingMember.name.charAt(0)
                                        )}
                                    </div>
                                    <div className="space-y-1">
                                        <h5 className="font-bold text-slate-900 dark:text-white text-sm">{selectedPendingMember.name}</h5>
                                        <p className="text-xs text-slate-500">{selectedPendingMember.email}</p>
                                        <p className="text-xs text-slate-500">{selectedPendingMember.phone || 'No phone provided'}</p>
                                    </div>
                                </div>

                                {/* Self-Submitted profile info */}
                                <div className="space-y-3">
                                    <h6 className="text-[10px] uppercase font-mono font-bold tracking-widest text-slate-400">Self-Submitted Profile Details</h6>
                                    <div className="grid grid-cols-2 gap-4 text-xs">
                                        <div>
                                            <span className="text-slate-400 block">Gender</span>
                                            <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedPendingMember.gender || 'Not specified'}</span>
                                        </div>
                                        <div>
                                            <span className="text-slate-400 block">Department</span>
                                            <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedPendingMember.department || 'Engineering'}</span>
                                        </div>
                                        <div>
                                            <span className="text-slate-400 block">Registered Designation</span>
                                            <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedPendingMember.designation || 'Not specified'}</span>
                                        </div>
                                        <div>
                                            <span className="text-slate-400 block">Registered Office</span>
                                            <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedPendingMember.office || 'Not specified'}</span>
                                        </div>
                                        <div className="col-span-2">
                                            <span className="text-slate-400 block">Date of Joining</span>
                                            <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedPendingMember.joining_date || 'Not specified'}</span>
                                        </div>
                                    </div>
                                    <div className="text-xs pt-1">
                                        <span className="text-slate-400 block">Address</span>
                                        <p className="font-semibold text-slate-800 dark:text-slate-200 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 mt-1">{selectedPendingMember.address || 'Not provided'}</p>
                                    </div>
                                    {selectedPendingMember.emergency_contact_name && (
                                        <div className="text-xs pt-1 p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/10 grid grid-cols-2 gap-2 mt-1">
                                            <div>
                                                <span className="text-slate-400 block">Emergency Contact Name</span>
                                                <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedPendingMember.emergency_contact_name}</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-400 block">Emergency Contact Phone</span>
                                                <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedPendingMember.emergency_contact_phone}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="border-t border-slate-100 dark:border-slate-800 my-4" />

                                {/* Admin Action Fields */}
                                <div className="space-y-4">
                                    <h6 className="text-[10px] uppercase font-mono font-bold tracking-widest text-amber-600">Assign Job & System Roles (Admin Configuration)</h6>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Select Designation *</label>
                                            <select
                                                required
                                                value={approvalForm.designation}
                                                onChange={e => setApprovalForm({ ...approvalForm, designation: e.target.value })}
                                                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/50 text-slate-700 dark:text-slate-300"
                                            >
                                                <option value="">Select Designation</option>
                                                {localDesignations.map(desig => (
                                                    <option key={desig.id} value={desig.name}>{desig.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Confirm Department *</label>
                                            <select
                                                required
                                                value={approvalForm.department}
                                                onChange={e => setApprovalForm({ ...approvalForm, department: e.target.value })}
                                                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/50 text-slate-700 dark:text-slate-300"
                                            >
                                                {localDepartments.map(dept => (
                                                    <option key={dept.id} value={dept.name}>{dept.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Office Location *</label>
                                            <select
                                                required
                                                value={approvalForm.office}
                                                onChange={e => setApprovalForm({ ...approvalForm, office: e.target.value })}
                                                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/50 text-slate-700 dark:text-slate-300"
                                            >
                                                <option value="">Select Office</option>
                                                {localOffices.map(off => (
                                                    <option key={off.id} value={off.name}>{off.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Monthly Salary (CTC ₹) *</label>
                                            <input
                                                type="number"
                                                required
                                                value={approvalForm.salary}
                                                onChange={e => setApprovalForm({ ...approvalForm, salary: e.target.value })}
                                                placeholder="e.g. 50000"
                                                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/50 text-slate-800 dark:text-slate-200"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Date of Joining *</label>
                                            <input
                                                type="date"
                                                required
                                                value={approvalForm.joining_date}
                                                onChange={e => setApprovalForm({ ...approvalForm, joining_date: e.target.value })}
                                                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/50 text-slate-800 dark:text-slate-200"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">System Role *</label>
                                            <select
                                                required
                                                value={approvalForm.role}
                                                onChange={e => setApprovalForm({ ...approvalForm, role: e.target.value })}
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
                                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Temp/New Access Password</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={approvalForm.password}
                                                    onChange={e => setApprovalForm({ ...approvalForm, password: e.target.value })}
                                                    placeholder="Optional. Leaves original if empty."
                                                    className="flex-1 px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/50 text-slate-800 dark:text-slate-200 font-mono"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={generateRandomApprovalPassword}
                                                    className="px-3 py-2.5 text-xs font-semibold rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-100 border border-amber-200/55 flex items-center transition-all cursor-pointer"
                                                >
                                                    ⚡ Generate
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Send Credentials Checkbox */}
                                    <label className="flex items-start gap-2.5 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 cursor-pointer select-none group">
                                        <input
                                            type="checkbox"
                                            checked={approvalForm.send_email}
                                            onChange={e => setApprovalForm({ ...approvalForm, send_email: e.target.checked })}
                                            className="mt-0.5 rounded border-slate-300 dark:border-slate-700 text-amber-500 focus:ring-amber-400/50"
                                        />
                                        <div>
                                            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Email system credentials to approved member</p>
                                            <p className="text-[10px] text-slate-400 mt-0.5">Sends automated email containing portal URL & access passwords safely.</p>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {/* Drawer Footer Actions */}
                            <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between gap-2.5 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => handleRejectMember(selectedPendingMember.id)}
                                    className="px-4 py-2.5 rounded-xl border border-red-200 dark:border-red-900/50 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-55 dark:hover:bg-red-950/20 transition-all flex items-center gap-1 cursor-pointer"
                                >
                                    Reject & Delete
                                </button>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowApproveDrawer(false);
                                            setSelectedPendingMember(null);
                                        }}
                                        className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={approvalSaving}
                                        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 disabled:opacity-60 cursor-pointer"
                                    >
                                        {approvalSaving ? <Loader2 size={13} className="animate-spin" /> : null}
                                        Approve & Activate
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Manage Dept & Designations Modal */}
            {showConfigModal && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setShowConfigModal(false)} />
                    <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl flex flex-col z-10 max-h-[85vh] animate-fade-in overflow-hidden border border-slate-100 dark:border-slate-800">
                        {/* Header */}
                        <div className="p-5 border-b border-slate-100 dark:border-slate-800 shrink-0 flex items-center justify-between">
                            <div>
                                <h4 className="font-extrabold text-slate-900 dark:text-white text-base tracking-tight">Organization Configuration</h4>
                                <p className="text-xs text-slate-500 mt-0.5">Manage departments and designations dynamically.</p>
                            </div>
                            <button type="button" onClick={() => setShowConfigModal(false)} className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 flex items-center justify-center transition-colors">
                                <X size={18} />
                            </button>
                        </div>

                        {/* Body - 2 Columns */}
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto">
                            {/* Departments Column */}
                            <div className="space-y-4">
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Departments</div>
                                
                                <form onSubmit={handleAddDepartment} className="flex gap-2">
                                    <input
                                        type="text"
                                        required
                                        placeholder="Add department name..."
                                        value={newDeptName}
                                        onChange={e => setNewDeptName(e.target.value)}
                                        className="flex-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/50 text-slate-800 dark:text-slate-200"
                                    />
                                    <button
                                        type="submit"
                                        disabled={configSaving}
                                        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-60 cursor-pointer"
                                    >
                                        Add
                                    </button>
                                </form>

                                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                                    {localDepartments.map(dept => (
                                        <div key={dept.id} className="flex items-center justify-between p-2.5 rounded-xl border border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <span className="text-xs font-medium text-slate-750 dark:text-slate-200">{dept.name}</span>
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteDepartment(dept.id)}
                                                className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors cursor-pointer"
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                    ))}
                                    {localDepartments.length === 0 && (
                                        <p className="text-xs text-slate-400 text-center py-4">No departments configured yet.</p>
                                    )}
                                </div>
                            </div>

                            {/* Designations Column */}
                            <div className="space-y-4 border-t md:border-t-0 md:border-l border-slate-150 dark:border-slate-800 pt-6 md:pt-0 md:pl-6">
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Designations</div>
                                
                                <form onSubmit={handleAddDesignation} className="flex gap-2">
                                    <input
                                        type="text"
                                        required
                                        placeholder="Add designation title..."
                                        value={newDesigName}
                                        onChange={e => setNewDesigName(e.target.value)}
                                        className="flex-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/50 text-slate-800 dark:text-slate-200"
                                    />
                                    <button
                                        type="submit"
                                        disabled={configSaving}
                                        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-60 cursor-pointer"
                                    >
                                        Add
                                    </button>
                                </form>

                                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                                    {localDesignations.map(desig => (
                                        <div key={desig.id} className="flex items-center justify-between p-2.5 rounded-xl border border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <span className="text-xs font-medium text-slate-750 dark:text-slate-200">{desig.name}</span>
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteDesignation(desig.id)}
                                                className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors cursor-pointer"
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                    ))}
                                    {localDesignations.length === 0 && (
                                        <p className="text-xs text-slate-400 text-center py-4">No designations configured yet.</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end shrink-0">
                            <button
                                type="button"
                                onClick={() => setShowConfigModal(false)}
                                className="px-5 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold hover:opacity-90 transition-all cursor-pointer"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Detailed Member Profile Viewer Drawer */}
            {showDetailsDrawer && selectedMemberDetails && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-end">
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => {
                        setShowDetailsDrawer(false);
                        setSelectedMemberDetails(null);
                    }} />
                    <div className="relative w-full max-w-md h-full bg-white dark:bg-slate-900 shadow-2xl flex flex-col z-10 animate-slide-in-right">
                        {/* Header */}
                        <div className="p-5 border-b border-slate-100 dark:border-slate-800 shrink-0 flex items-center justify-between">
                            <h4 className="font-extrabold text-slate-900 dark:text-white text-base tracking-tight">Staff Member Profile</h4>
                            <button type="button" onClick={() => {
                                setShowDetailsDrawer(false);
                                setSelectedMemberDetails(null);
                            }} className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 flex items-center justify-center transition-colors">
                                <X size={18} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* Photo and Header Info */}
                            <div className="flex flex-col items-center text-center space-y-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-extrabold text-2xl overflow-hidden shadow-lg border-4 border-white dark:border-slate-800">
                                    {selectedMemberDetails.photo_path ? (
                                        <img src={selectedMemberDetails.photo_path} alt={selectedMemberDetails.name} className="w-full h-full object-cover" />
                                    ) : (
                                        selectedMemberDetails.avatar || selectedMemberDetails.name.charAt(0)
                                    )}
                                </div>
                                <div>
                                    <h5 className="font-extrabold text-slate-900 dark:text-white text-lg">{selectedMemberDetails.name}</h5>
                                    <p className="text-xs text-slate-500 font-medium">{selectedMemberDetails.designation || selectedMemberDetails.role}</p>
                                    <div className="mt-2 flex items-center justify-center gap-2">
                                        <span className={cn('px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase', 
                                            selectedMemberDetails.status === 'active' 
                                                ? 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400' 
                                                : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                                        )}>
                                            {selectedMemberDetails.status || 'Active'}
                                        </span>
                                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 uppercase">
                                            {selectedMemberDetails.role}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Contact Details */}
                            <div className="space-y-3">
                                <h6 className="text-[10px] uppercase font-mono font-bold tracking-widest text-slate-400">Contact Details</h6>
                                <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                                    <div className="flex justify-between py-1.5 border-b border-slate-50 dark:border-slate-800/40">
                                        <span className="text-slate-400">Email Address</span>
                                        <span className="font-semibold">{selectedMemberDetails.email}</span>
                                    </div>
                                    <div className="flex justify-between py-1.5 border-b border-slate-50 dark:border-slate-800/40">
                                        <span className="text-slate-400">Mobile Phone</span>
                                        <span className="font-semibold">{selectedMemberDetails.phone || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Employment Information */}
                            <div className="space-y-3">
                                <h6 className="text-[10px] uppercase font-mono font-bold tracking-widest text-slate-400">Employment Info</h6>
                                <div className="space-y-2 text-xs text-slate-700 dark:text-slate-350">
                                    <div className="flex justify-between py-1.5 border-b border-slate-50 dark:border-slate-800/40">
                                        <span className="text-slate-400">Department</span>
                                        <span className="font-semibold">{selectedMemberDetails.department || 'General'}</span>
                                    </div>
                                    <div className="flex justify-between py-1.5 border-b border-slate-50 dark:border-slate-800/40">
                                        <span className="text-slate-400">Office Location</span>
                                        <span className="font-semibold">{selectedMemberDetails.office || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between py-1.5 border-b border-slate-50 dark:border-slate-800/40">
                                        <span className="text-slate-400">Salary (CTC)</span>
                                        <span className="font-semibold">₹{selectedMemberDetails.salary ? Number(selectedMemberDetails.salary).toLocaleString('en-IN') : 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between py-1.5 border-b border-slate-50 dark:border-slate-800/40">
                                        <span className="text-slate-400">Joining Date</span>
                                        <span className="font-semibold">{selectedMemberDetails.joining_date || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Personal & Professional Profile */}
                            <div className="space-y-3">
                                <h6 className="text-[10px] uppercase font-mono font-bold tracking-widest text-slate-400">Personal Profile</h6>
                                <div className="space-y-2 text-xs text-slate-700 dark:text-slate-350">
                                    <div className="flex justify-between py-1.5 border-b border-slate-50 dark:border-slate-800/40">
                                        <span className="text-slate-400">Gender</span>
                                        <span className="font-semibold">{selectedMemberDetails.gender || 'Not specified'}</span>
                                    </div>
                                </div>
                                <div className="text-xs pt-1">
                                    <span className="text-slate-400 block mb-1">Residential Address</span>
                                    <p className="font-semibold text-slate-800 dark:text-slate-200 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">{selectedMemberDetails.address || 'N/A'}</p>
                                </div>
                            </div>

                            {/* Emergency Contacts */}
                            {selectedMemberDetails.emergency_contact_name && (
                                <div className="space-y-3">
                                    <h6 className="text-[10px] uppercase font-mono font-bold tracking-widest text-slate-400">Emergency Contact</h6>
                                    <div className="space-y-2 text-xs text-slate-700 dark:text-slate-350">
                                        <div className="flex justify-between py-1.5 border-b border-slate-50 dark:border-slate-800/40">
                                            <span className="text-slate-400">Contact Person</span>
                                            <span className="font-semibold">{selectedMemberDetails.emergency_contact_name}</span>
                                        </div>
                                        <div className="flex justify-between py-1.5 border-b border-slate-50 dark:border-slate-800/40">
                                            <span className="text-slate-400">Phone Number</span>
                                            <span className="font-semibold">{selectedMemberDetails.emergency_contact_phone}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end shrink-0">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowDetailsDrawer(false);
                                    setSelectedMemberDetails(null);
                                }}
                                className="px-5 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold hover:opacity-90 transition-all cursor-pointer"
                            >
                                Close Profile
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
