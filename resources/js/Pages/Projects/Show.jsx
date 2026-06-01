import React, { useState, useEffect, useRef } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
    Building2, Calendar, MapPin, Users, Bookmark, FileText, CheckCircle2, Clock,
    ArrowLeft, Edit, Save, Plus, X, Trash2, Loader2, PlayCircle, Info, Upload,
    Mic, Send, Paperclip, MessageSquare, Download, Check, AlertTriangle, UserPlus, UserMinus, Navigation,
    Activity, DollarSign, CalendarDays, ChevronDown, ChevronLeft, ChevronRight, Settings, Camera, Video, Phone, Search, Mail
} from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { cn } from '@/lib/utils';
import axios from 'axios';
import ProjectOnboarding from '@/Components/ProjectOnboarding';
import ImageCropperModal from '@/Components/ImageCropperModal';
import Divider from '@mui/material/Divider';

// Format date without time — only DD/MM/YYYY
function fmtDate(val) {
    if (!val) return 'Not set';
    const d = new Date(val);
    if (isNaN(d)) return val;
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

const STATUS_OPTIONS = [
    { value: 'draft', label: 'Draft', color: 'bg-slate-100 text-slate-700 border-slate-200' },
    { value: 'running',       label: 'Runing Project', color: 'bg-green-100 text-green-700 border-green-200' },
    { value: 'handover',      label: 'Handover',       color: 'bg-blue-100 text-blue-700 border-blue-200' },
    { value: 'on-hold',       label: 'ON Hold',        color: 'bg-amber-100 text-amber-700 border-amber-200' },
    { value: 'cancelled',     label: 'Cancelled',      color: 'bg-red-100 text-red-700 border-red-200' },
];

const PRIORITIES = [
    { value: 'low',      label: 'Low' },
    { value: 'medium',   label: 'Medium' },
    { value: 'high',     label: 'High' },
    { value: 'critical', label: 'Critical' },
];

const inputCls = `w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200
    dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/50
    text-slate-800 dark:text-slate-200 placeholder-slate-400`;

const parseKycDescription = (desc) => {
    if (!desc) return {};
    const lines = desc.split('\n');
    const details = {};
    lines.forEach(l => {
        const parts = l.split(': ');
        if (parts.length >= 2) {
            const key = parts[0].toLowerCase().trim();
            const val = parts.slice(1).join(': ').trim();
            details[key] = val;
        }
    });
    return details;
};

export default function Show({ project: initialProject }) {
    const [project, setProject] = useState(initialProject);
    const [activeTab, setActiveTab] = useState('overview');
    const [selectedKyc, setSelectedKyc] = useState(null);
    const [selectedAgreement, setSelectedAgreement] = useState(null);
    const [showSetupModal, setShowSetupModal] = useState(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            return params.get('setup') === 'true';
        }
        return false;
    });
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [allMembers, setAllMembers] = useState([]);
    const [loadingMembers, setLoadingMembers] = useState(false);
    const [addingMember, setAddingMember]     = useState(false);
    const [removingMemberId, setRemovingMemberId] = useState(null);
    const [showAddMemberPopup, setShowAddMemberPopup] = useState(false);
    const [memberSearch, setMemberSearch] = useState('');
    const [projectTeamSearch, setProjectTeamSearch] = useState('');

    // ── Create New Team Member Flow ──
    const [createMode, setCreateMode] = useState(false);
    const [createStep, setCreateStep] = useState(1);
    const [formErrors, setFormErrors] = useState({});
    const [cropModalOpen, setCropModalOpen] = useState(false);
    const [rawOriginalFile, setRawOriginalFile] = useState(null);

    // ── Execution Tab Flow ──
    const [showUpdateForm, setShowUpdateForm] = useState(false);
    const [submittingUpdate, setSubmittingUpdate] = useState(false);
    const [updateForm, setUpdateForm] = useState({
        type: 'work_update',
        content: '',
        latitude: '',
        longitude: '',
        photos: [],
        voice_notes: []
    });
    const [geoLoading, setGeoLoading] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [updateMediaRecorder, setUpdateMediaRecorder] = useState(null);
    const [audioChunks, setAudioChunks] = useState([]);

    const handlePhotoSelect = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            setUpdateForm(prev => ({ ...prev, photos: [...prev.photos, ...files] }));
            // Automatically capture location
            if (navigator.geolocation && !updateForm.latitude) {
                setGeoLoading(true);
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        setUpdateForm(prev => ({
                            ...prev,
                            latitude: position.coords.latitude.toString(),
                            longitude: position.coords.longitude.toString()
                        }));
                        setGeoLoading(false);
                    },
                    (error) => {
                        console.error("Error capturing location", error);
                        setGeoLoading(false);
                    }
                );
            }
        }
    };

    const audioChunksRef = useRef([]);

    const startRecording = async () => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            alert("Microphone recording requires a Secure Context (HTTPS or localhost). If you are accessing this server remotely via HTTP, please use HTTPS or localhost to record a voice note.");
            return;
        }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            setUpdateMediaRecorder(recorder);
            
            audioChunksRef.current = [];
            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };
            
            recorder.onstop = () => {
                const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const file = new File([blob], `voice_note_${Date.now()}.webm`, { type: 'audio/webm' });
                setUpdateForm(prev => ({ ...prev, voice_notes: [...prev.voice_notes, file] }));
                stream.getTracks().forEach(track => track.stop());
            };
            
            recorder.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Error accessing microphone", err);
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                alert("Microphone access was denied. Please grant microphone permission in your browser settings.");
            } else {
                alert("Could not access microphone: " + err.message);
            }
        }
    };

    const stopRecording = () => {
        return new Promise((resolve) => {
            if (updateMediaRecorder && updateMediaRecorder.state !== 'inactive') {
                updateMediaRecorder.onstop = () => {
                    const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                    const file = new File([blob], `voice_note_${Date.now()}.webm`, { type: 'audio/webm' });
                    setUpdateForm(prev => ({ ...prev, voice_notes: [...prev.voice_notes, file] }));
                    updateMediaRecorder.stream.getTracks().forEach(track => track.stop());
                    resolve(file);
                };
                updateMediaRecorder.stop();
                setIsRecording(false);
            } else {
                resolve(null);
            }
        });
    };

    const submitUpdate = async (e) => {
        e.preventDefault();
        setSubmittingUpdate(true);
        
        // Ensure recording is stopped and capture the final file before submitting
        let pendingAudioFile = null;
        if (isRecording) {
            pendingAudioFile = await stopRecording();
        }
        
        const fd = new FormData();
        fd.append('type', updateForm.type);
        if (updateForm.content) fd.append('content', updateForm.content);
        if (updateForm.latitude) fd.append('latitude', updateForm.latitude);
        if (updateForm.longitude) fd.append('longitude', updateForm.longitude);
        
        updateForm.photos.forEach(file => {
            fd.append('photos[]', file);
        });
        
        updateForm.voice_notes.forEach(file => {
            fd.append('voice_notes[]', file);
        });
        
        if (pendingAudioFile) {
            fd.append('voice_notes[]', pendingAudioFile);
        }

        try {
            const res = await axios.post(`/projects/${project.id}/updates`, fd, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (res.data.success) {
                setProject(prev => ({
                    ...prev,
                    updates: [res.data.update, ...(prev.updates || [])]
                }));
                setShowUpdateForm(false);
                setUpdateForm({ type: 'work_update', content: '', latitude: '', longitude: '', photos: [], voice_notes: [] });
            }
        } catch (err) {
            alert('Failed to post update.');
        } finally {
            setSubmittingUpdate(false);
        }
    };

    // ── Finance Tab Flow ──
    const [activePlanningTab, setActivePlanningTab] = useState('overview');
    const [financeSubTab, setFinanceSubTab] = useState('schedule');
    const [showPaymentForm, setShowPaymentForm] = useState(false);
    const [submittingPayment, setSubmittingPayment] = useState(false);
    const [paymentForm, setPaymentForm] = useState({
        payment_type: 'client_installment',
        amount: '',
        payment_date: new Date().toISOString().split('T')[0],
        description: '',
        payment_proofs: [],
        collection_reason: '',
    });

    // ── Milestone Installment Schedule States & Handlers ──
    const [milestones, setMilestones] = useState(project.payment_milestones || []);
    const [isSavingMilestones, setIsSavingMilestones] = useState(false);
    const [newMilestoneForm, setNewMilestoneForm] = useState({ title: '', percentage: '', due_date: '', status: 'Pending' });
    const [showNewMilestone, setShowNewMilestone] = useState(false);

    useEffect(() => {
        setMilestones(project.payment_milestones || []);
    }, [project.payment_milestones]);

    const handleInitStandardPlan = () => {
        const standard = [
            { id: 'ms_1', title: 'Booking & Agreement Advance', percentage: 15, due_date: '', status: 'Pending' },
            { id: 'ms_2', title: 'On Foundation & Plinth completion', percentage: 20, due_date: '', status: 'Pending' },
            { id: 'ms_3', title: 'On First Roof Slab casting', percentage: 25, due_date: '', status: 'Pending' },
            { id: 'ms_4', title: 'On Brickwork & Interior Plastering', percentage: 25, due_date: '', status: 'Pending' },
            { id: 'ms_5', title: 'On Final Finishing & Handover', percentage: 15, due_date: '', status: 'Pending' }
        ];
        saveMilestonesToServer(standard);
    };

    const saveMilestonesToServer = async (updatedList) => {
        setIsSavingMilestones(true);
        try {
            await axios.post(`/projects/${project.id}`, {
                _method: 'PUT',
                title: project.title,
                type: project.type,
                payment_milestones: updatedList
            });
            router.reload({ only: ['project'] });
        } catch (err) {
            console.error(err);
            alert('Failed to save installment schedule.');
        } finally {
            setIsSavingMilestones(false);
        }
    };

    const handleAddMilestone = () => {
        if (!newMilestoneForm.title || !newMilestoneForm.percentage) {
            alert('Please enter milestone name and percentage.');
            return;
        }
        const updated = [
            ...milestones,
            {
                id: `ms_${Date.now()}`,
                stage: newMilestoneForm.title,
                title: newMilestoneForm.title,
                percentage: parseFloat(newMilestoneForm.percentage),
                due_date: newMilestoneForm.due_date || '',
                status: newMilestoneForm.status || 'Pending'
            }
        ];
        saveMilestonesToServer(updated);
        setNewMilestoneForm({ title: '', percentage: '', due_date: '', status: 'Pending' });
        setShowNewMilestone(false);
    };

    const handleUpdateMilestone = (id, fields) => {
        const updated = milestones.map(m => m.id === id ? { ...m, ...fields } : m);
        setMilestones(updated);
    };

    const handleDeleteMilestone = (id) => {
        if (confirm('Are you sure you want to delete this installment milestone?')) {
            const updated = milestones.filter(m => m.id !== id);
            saveMilestonesToServer(updated);
        }
    };

    const checkPaymentStatus = (milestone) => {
        const mTitle = milestone ? (milestone.stage || milestone.title || '') : '';
        if (!milestone || !mTitle || typeof mTitle !== 'string') {
            return {
                status: 'Scheduled',
                label: 'Scheduled',
                color: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
            };
        }

        // Search project's recorded ledger collections for matching milestone title in description
        const payment = (project.payments || []).find(p => 
            p.payment_type === 'client_installment' && 
            p.description && 
            typeof p.description === 'string' &&
            p.description.toLowerCase().includes(mTitle.toLowerCase())
        );

        if (payment) {
            return {
                status: 'Received',
                label: 'Collected',
                color: 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-250 dark:border-emerald-500/25',
                date: payment.payment_date,
                amount: payment.amount
            };
        }

        if (milestone.due_date) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const due = new Date(milestone.due_date);
            due.setHours(0, 0, 0, 0);

            if (due < today) {
                return {
                    status: 'Overdue',
                    label: 'Overdue',
                    color: 'bg-rose-100 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-250 dark:border-rose-500/25'
                };
            } else if (due.getTime() - today.getTime() <= 3 * 24 * 60 * 60 * 1000) {
                return {
                    status: 'Due Soon',
                    label: 'Due Soon',
                    color: 'bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-250 dark:border-amber-500/25'
                };
            }
        }

        return {
            status: 'Scheduled',
            label: 'Scheduled',
            color: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
        };
    };

    const handleMarkAsPaidClick = (milestone, msAmount) => {
        const mTitle = milestone ? (milestone.stage || milestone.title || '') : '';
        setFinanceSubTab('ledger');
        setShowPaymentForm(true);
        setPaymentForm({
            payment_type: 'client_installment',
            amount: Math.round(msAmount).toString(),
            payment_date: new Date().toISOString().split('T')[0],
            description: `Milestone Collection: ${mTitle}`,
            payment_proofs: [],
            collection_reason: mTitle
        });
        setTimeout(() => {
            const formEl = document.querySelector('form');
            if (formEl) {
                formEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 150);
    };


    const submitPayment = async (e) => {
        e.preventDefault();
        setSubmittingPayment(true);
        const fd = new FormData();
        fd.append('payment_type', paymentForm.payment_type);
        fd.append('amount', paymentForm.amount);
        fd.append('payment_date', paymentForm.payment_date);
        if (paymentForm.description) fd.append('description', paymentForm.description);
        
        paymentForm.payment_proofs.forEach(file => {
            fd.append('payment_proofs[]', file);
        });

        try {
            const res = await axios.post(`/projects/${project.id}/payments`, fd, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (res.data.success) {
                setProject(prev => ({
                    ...prev,
                    payments: [res.data.payment, ...(prev.payments || [])]
                }));
                setShowPaymentForm(false);
                setPaymentForm({ payment_type: 'client_installment', amount: '', payment_date: new Date().toISOString().split('T')[0], description: '', payment_proofs: [], collection_reason: '' });
            }
        } catch (err) {
            alert('Failed to post payment.');
        } finally {
            setSubmittingPayment(false);
        }
    };

    // ── Notice Flow ──
    const [showNoticeModal, setShowNoticeModal] = useState(false);
    const [submittingNotice, setSubmittingNotice] = useState(false);
    const [resendingNoticeId, setResendingNoticeId] = useState(null);
    const [noticeForm, setNoticeForm] = useState({
        type: 'general',
        title: '',
        content: '',
        methods: ['email', 'whatsapp'],
        attachments: []
    });

    const handleMethodToggle = (method) => {
        setNoticeForm(prev => {
            const methods = prev.methods.includes(method)
                ? prev.methods.filter(m => m !== method)
                : [...prev.methods, method];
            return { ...prev, methods };
        });
    };

    const submitNotice = async (e) => {
        e.preventDefault();
        setSubmittingNotice(true);
        const fd = new FormData();
        fd.append('type', noticeForm.type);
        fd.append('title', noticeForm.title);
        fd.append('content', noticeForm.content);
        noticeForm.methods.forEach(m => fd.append('methods[]', m));
        noticeForm.attachments.forEach(file => fd.append('attachments[]', file));

        try {
            const res = await axios.post(`/projects/${project.id}/notices`, fd, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (res.data.success) {
                setProject(prev => ({
                    ...prev,
                    notices: [res.data.notice, ...(prev.notices || [])]
                }));
                setShowNoticeModal(false);
                setNoticeForm({ type: 'general', title: '', content: '', methods: ['email', 'whatsapp'], attachments: [] });
            }
        } catch (err) {
            alert('Failed to post notice.');
        } finally {
            setSubmittingNotice(false);
        }
    };

    const resendNotice = async (notice) => {
        setResendingNoticeId(notice.id);
        try {
            const res = await axios.post(`/projects/${project.id}/notices/${notice.id}/resend`, {
                methods: notice.methods
            });
            if (res.data.success) {
                setProject(prev => ({
                    ...prev,
                    notices: prev.notices.map(n => n.id === notice.id ? res.data.notice : n)
                }));
            }
        } catch (err) {
            alert('Failed to resend notice.');
        } finally {
            setResendingNoticeId(null);
        }
    };

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

    const generateRandomPassword = () => {
        const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$*%";
        let pwd = "";
        for (let i = 0; i < 8; i++) {
            pwd += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setCreateForm(prev => ({ ...prev, password: pwd }));
    };

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
        formData.append('project_id', project.id);

        try {
            const res = await axios.post('/projects/team-members/create', formData, {
                headers: { 
                    'Content-Type': 'multipart/form-data',
                    'Accept': 'application/json'
                }
            });
            if (res.data.success) {
                // Add to project team
                setProject(prev => ({
                    ...prev,
                    team: [...(prev.team || []), res.data.member]
                }));
                // Add to all members list
                setAllMembers(prev => [...prev, res.data.member]);
                
                // Reset form and close
                setShowAddMemberPopup(false);
                setCreateMode(false);
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
                
                // Toast notifications can be shown via state
                setSuccessToast('New staff member created and assigned successfully!');
                setTimeout(() => setSuccessToast(''), 4000);
            }
        } catch (err) {
            console.error(err);
            if (err.response?.data?.errors) {
                const errors = err.response.data.errors;
                setFormErrors(errors);
                
                const errorKeys = Object.keys(errors);
                if (errorKeys.length > 0) {
                    if (errors.email || errors.password || errors.role) {
                        setCreateStep(3);
                    } else if (errors.designation || errors.salary || errors.joining_date || errors.department) {
                        setCreateStep(2);
                    } else {
                        setCreateStep(1);
                    }
                }
            } else {
                alert(err.response?.data?.message || 'Failed to create member. Please try again.');
            }
        } finally {
            setSaving(false);
        }
    };

    // Sync local state when props refresh
    useEffect(() => {
        if (initialProject) setProject(initialProject);
    }, [initialProject]);

    // Fetch ALL system users for team assignment (used in edit mode & team tab)
    useEffect(() => {
        if (showAddMemberPopup) {
            setFormErrors({});
            setLoadingMembers(true);
            axios.get('/projects/team-members')
                .then(res => setAllMembers(res.data))
                .catch(err => console.error('Failed to load team list', err))
                .finally(() => setLoadingMembers(false));
        }
    }, [showAddMemberPopup]);

    // Add member to project team dynamically
    const handleAddMember = async (member) => {
        if (project.team?.find(m => m.id === member.id)) return;
        setAddingMember(true);
        try {
            await axios.post(`/projects/${project.id}/team`, { user_id: member.id });
            setProject(prev => ({ ...prev, team: [...(prev.team || []), member] }));
            setShowAddMemberPopup(false);
            setMemberSearch('');
        } catch (e) { console.error(e); }
        finally { setAddingMember(false); }
    };

    // Remove member from project team dynamically
    const handleRemoveMember = async (memberId) => {
        setRemovingMemberId(memberId);
        try {
            await axios.delete(`/projects/${project.id}/team/${memberId}`);
            setProject(prev => ({ ...prev, team: prev.team.filter(m => m.id !== memberId) }));
        } catch (e) { console.error(e); }
        finally { setRemovingMemberId(null); }
    };

    // Inline Details Form State
    const [form, setForm] = useState({
        title: project.title || '',
        description: project.description || '',
        type: project.type || 'client',
        status: project.status || 'draft',
        location: project.location || '',
        map_location: project.map_location || '',
        latitude: project.latitude || '',
        longitude: project.longitude || '',
        budget: project.budget || '',
        start_date: project.start_date || '',
        deadline: project.deadline || '',
        completion_percentage: project.completion_percentage || 0,
        team_ids: project.team ? project.team.map(m => m.id) : [],
    });

    // Document Modal State
    const [showUploadDocModal, setShowUploadDocModal] = useState(false);
    const [uploadingDoc, setUploadingDoc] = useState(false);
    const [docForm, setDocForm] = useState({ name: '', description: '', file: null });

    // Task Modal State
    const [showAddTaskModal, setShowAddTaskModal] = useState(false);
    const [addingTask, setAddingTask] = useState(false);
    const [taskForm, setTaskForm] = useState({ title: '', description: '', priority: 'medium', assignee_id: '' });

    // Rich Task Detail Drawer/Modal State
    const [selectedTask, setSelectedTask] = useState(null);
    const [commentText, setCommentText] = useState('');
    const [commentFile, setCommentFile] = useState(null);
    const [commentVoice, setCommentVoice] = useState(null);
    const [submittingComment, setSubmittingComment] = useState(false);

    // Audited Delete Requests State
    const [showDeleteRequestModal, setShowDeleteRequestModal] = useState(false);
    const [deleteRequestItem, setDeleteRequestItem] = useState({ type: '', id: null, name: '' });
    const [deleteReason, setDeleteReason] = useState('');
    const [submittingDeleteRequest, setSubmittingDeleteRequest] = useState(false);
    const [successToast, setSuccessToast] = useState('');

    // Events and Sidebar Calendar State & Handlers
    const [calendarMonth, setCalendarMonth] = useState(new Date());
    const [selectedCalendarDate, setSelectedCalendarDate] = useState(new Date());
    const [showAddEventModal, setShowAddEventModal] = useState(false);
    const [submittingEvent, setSubmittingEvent] = useState(false);
    const [eventForm, setEventForm] = useState({
        title: '',
        description: '',
        event_date: '',
        event_time: '10:00'
    });

    const [activeSidebarTab, setActiveSidebarTab] = useState('tasks');
    const [sidebarTaskIndex, setSidebarTaskIndex] = useState(0);
    const [sidebarEventIndex, setSidebarEventIndex] = useState(0);

    const handleAddEvent = async (e) => {
        e.preventDefault();
        if (!eventForm.title || !eventForm.event_date) {
            alert('Please specify a title and event date.');
            return;
        }
        setSubmittingEvent(true);
        try {
            const dateStr = eventForm.event_date;
            const timeStr = eventForm.event_time || '00:00';
            const fullDateTime = `${dateStr} ${timeStr}:00`;
            const res = await axios.post(`/projects/${project.id}/events`, {
                title: eventForm.title,
                description: eventForm.description,
                event_date: fullDateTime
            });
            if (res.data.success) {
                setProject(prev => ({
                    ...prev,
                    events: [...(prev.events || []), res.data.event]
                }));
                setShowAddEventModal(false);
                setEventForm({ title: '', description: '', event_date: '', event_time: '10:00' });
                setSuccessToast('Event added successfully!');
                setTimeout(() => setSuccessToast(''), 3000);
            }
        } catch (err) {
            console.error(err);
            alert('An error occurred while creating the event.');
        } finally {
            setSubmittingEvent(false);
        }
    };

    // Audio recording state inside Task detail popup
    const [isRecordingComment, setIsRecordingComment] = useState(false);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const recordingIntervalRef = useRef(null);
    const chunksRef = useRef([]);

    // Format seconds
    const formatTime = (secs) => {
        const m = Math.floor(secs / 60).toString().padStart(2, '0');
        const s = (secs % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    // Toggle voice recording for comments
    const toggleCommentVoiceRecord = async () => {
        if (isRecordingComment) {
            if (mediaRecorder) mediaRecorder.stop();
            setIsRecordingComment(false);
            clearInterval(recordingIntervalRef.current);
        } else {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                alert("Microphone recording requires a Secure Context (HTTPS or localhost). If you are accessing this server remotely via HTTP, please connect using secure HTTPS or localhost to record a voice note.");
                return;
            }
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const recorder = new MediaRecorder(stream);
                chunksRef.current = [];
                recorder.ondataavailable = (e) => {
                    if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
                };
                recorder.onstop = () => {
                    const blob = new Blob(chunksRef.current, { type: 'audio/wav' });
                    const file = new File([blob], `comment_voice_${Date.now()}.wav`, { type: 'audio/wav' });
                    setCommentVoice(file);
                    stream.getTracks().forEach(t => t.stop());
                };
                setMediaRecorder(recorder);
                recorder.start();
                setIsRecordingComment(true);
                setRecordingDuration(0);
                recordingIntervalRef.current = setInterval(() => {
                    setRecordingDuration(prev => prev + 1);
                }, 1000);
            } catch (err) {
                console.error(err);
                if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                    alert("Microphone access was denied. Please grant microphone permission in your browser settings.");
                } else {
                    alert("Could not access microphone: " + err.message);
                }
            }
        }
    };

    // Update Task Status
    const handleUpdateTaskStatus = (taskId, newStatus) => {
        axios.post(`/tasks/${taskId}/update`, { status: newStatus })
            .then(res => {
                if (res.data.success) {
                    setProject(res.data.project);
                    setSelectedTask(res.data.task);
                }
            })
            .catch(err => alert('Failed to update status.'));
    };

    // Submit Comment
    const handleAddComment = (e) => {
        e.preventDefault();
        if (!commentText && !commentFile && !commentVoice) return;

        setSubmittingComment(true);
        const fd = new FormData();
        if (commentText) fd.append('comment_text', commentText);
        if (commentFile) fd.append('comment_file', commentFile);
        if (commentVoice) fd.append('comment_voice', commentVoice);

        axios.post(`/tasks/${selectedTask.id}/update`, fd)
            .then(res => {
                if (res.data.success) {
                    setProject(res.data.project);
                    setSelectedTask(res.data.task);
                    setCommentText('');
                    setCommentFile(null);
                    setCommentVoice(null);
                }
            })
            .catch(err => alert('Failed to add comment.'))
            .finally(() => setSubmittingComment(false));
    };

    // Trigger secure delete request popup
    const triggerDeleteRequest = (type, id, name) => {
        setDeleteRequestItem({ type, id, name });
        setDeleteReason('');
        setShowDeleteRequestModal(true);
    };

    // Submit secure auditing delete request
    const handleSubmitDeleteRequest = (e) => {
        e.preventDefault();
        if (!deleteReason) return;

        setSubmittingDeleteRequest(true);
        axios.post('/delete-requests', {
            item_type: deleteRequestItem.type,
            item_id: deleteRequestItem.id,
            reason: deleteReason
        })
        .then(res => {
            if (res.data.success) {
                setShowDeleteRequestModal(false);
                setSelectedTask(null);
                setSuccessToast(res.data.message);
                setTimeout(() => setSuccessToast(''), 6000);
            }
        })
        .catch(err => alert('Failed to submit delete request.'))
        .finally(() => setSubmittingDeleteRequest(false));
    };

    const isInternal = project.type === 'internal';

    function handleSaveDetails(e) {
        e.preventDefault();
        setSaving(true);
        router.put(`/projects/${project.id}`, form, {
            onSuccess: () => {
                setEditing(false);
            },
            onError: () => {
                alert('An error occurred while saving details.');
            },
            onFinish: () => setSaving(false)
        });
    }

    function handleUploadDocument(e) {
        e.preventDefault();
        if (!docForm.file) return;

        setUploadingDoc(true);
        const fd = new FormData();
        fd.append('file', docForm.file);
        fd.append('name', docForm.name || docForm.file.name);
        fd.append('description', docForm.description);

        router.post(`/projects/${project.id}/documents`, fd, {
            onSuccess: () => {
                setShowUploadDocModal(false);
                setDocForm({ name: '', description: '', file: null });
            },
            onError: () => {
                alert('Failed to upload document.');
            },
            onFinish: () => setUploadingDoc(false)
        });
    }

    function handleCreateTask(e) {
        e.preventDefault();
        if (!taskForm.title) return;

        setAddingTask(true);
        router.post(`/projects/${project.id}/tasks`, taskForm, {
            onSuccess: () => {
                setShowAddTaskModal(false);
                setTaskForm({ title: '', description: '', priority: 'medium', assignee_id: '' });
            },
            onError: () => {
                alert('Failed to create task.');
            },
            onFinish: () => setAddingTask(false)
        });
    }

    return (
        <AppLayout>
            <Head title={`Project Details - ${project.title}`} />

            {/* Custom style to guarantee scrollbars are completely hidden on mobile devices */}
            <style dangerouslySetInnerHTML={{ __html: `
                .no-scrollbar::-webkit-scrollbar {
                    display: none !important;
                    width: 0 !important;
                    height: 0 !important;
                }
                .no-scrollbar {
                    -ms-overflow-style: none !important;
                    scrollbar-width: none !important;
                }
            ` }} />

            {/* Glowing success Toast notification */}
            {successToast && (
                <div className="fixed bottom-6 right-6 z-50 max-w-md bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border border-amber-500/30 flex gap-3 animate-slide-up">
                    <CheckCircle2 className="text-amber-500 shrink-0 mt-0.5" size={18} />
                    <div>
                        <p className="font-semibold text-xs text-amber-400 uppercase tracking-wider">Security Audit Triggered</p>
                        <p className="text-xs text-slate-350 mt-1">{successToast}</p>
                    </div>
                    <button type="button" onClick={() => setSuccessToast('')} className="text-slate-400 hover:text-white shrink-0 self-start">
                        <X size={14} />
                    </button>
                </div>
            )}

            {/* Back Button & Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <Link
                        href="/projects"
                        className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                    >
                        <ArrowLeft size={16} />
                    </Link>
                    <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-xs font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                {project.project_id}
                            </span>
                            {isInternal && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400">
                                    INTERNAL
                                </span>
                            )}
                            <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider',
                                STATUS_OPTIONS.find(o => o.value === project.status)?.color || 'bg-slate-100 text-slate-700'
                            )}>
                                {project.status}
                            </span>
                        </div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                            {project.title}
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => {
                            setForm({
                                title: project.title || '',
                                description: project.description || '',
                                type: project.type || 'client',
                                status: project.status || 'draft',
                                location: project.location || '',
                                map_location: project.map_location || '',
                                latitude: project.latitude || '',
                                longitude: project.longitude || '',
                                budget: project.budget || '',
                                start_date: project.start_date || '',
                                deadline: project.deadline || '',
                                completion_percentage: project.completion_percentage || 0,
                                team_ids: project.team ? project.team.map(m => m.id) : [],
                            });
                            setEditing(!editing);
                        }}
                        className={cn(
                            'inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all border',
                            editing
                                ? 'bg-slate-50 text-slate-755 border-slate-200 hover:bg-slate-100'
                                : 'bg-white text-slate-700 dark:bg-slate-900 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:bg-slate-50'
                        )}
                    >
                        {editing ? <X size={15} /> : <Edit size={15} />}
                        {editing ? 'Cancel' : 'Modify details'}
                    </button>

                    {project.status === 'draft' ? (
                        <button
                            type="button"
                            onClick={() => setShowSetupModal(true)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm animate-pulse"
                        >
                            <Settings size={15} />
                            Setup Project
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setShowSetupModal(true)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-850 dark:hover:bg-slate-800 rounded-xl text-sm font-semibold transition-colors shadow-sm"
                        >
                            <Settings size={15} />
                            Modify Setup
                        </button>
                    )}

                    {/* Audited Delete Project Button */}
                    <button
                        type="button"
                        onClick={() => triggerDeleteRequest('project', project.id, project.title)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 border border-red-200 hover:bg-red-50 text-red-600 rounded-xl text-sm font-semibold transition-colors"
                    >
                        <Trash2 size={15} />
                        Delete Project
                    </button>
                </div>
            </div>

            {/* Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* ── Main Panel (Left 2 cols) ── */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Tabs - Mobile View (Sleek Horizontal Scrollable Pill Tracker) */}
                    <div className="flex sm:hidden overflow-x-auto gap-2 pb-3 mb-2 -mx-4 px-4 no-scrollbar scroll-smooth shrink-0">
                        {[
                            { id: 'overview',  label: 'Overview',   icon: Building2 },
                            { id: 'work_info', label: 'Work Info',  icon: Activity },
                            { id: 'execution', label: 'Site Update',  icon: Camera },
                            { id: 'finances',  label: 'Finances',   icon: DollarSign },
                            { id: 'contracts', label: 'Contracts',  icon: FileText },
                            { id: 'planning',  label: 'Planning',   icon: Bookmark },
                            { id: 'documents', label: 'Docs',       icon: FileText },
                            { id: 'team',      label: 'Team',       icon: Users },
                        ].map(t => {
                            const Icon = t.icon;
                            const isActive = activeTab === t.id;
                            return (
                                <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => setActiveTab(t.id)}
                                    className={cn(
                                        'flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-300 shadow-sm border shrink-0',
                                        isActive
                                            ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-transparent scale-105 shadow-amber-500/25 shadow-md'
                                            : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200/60 dark:border-slate-800/60'
                                    )}
                                >
                                    <Icon size={14} />
                                    {t.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Tabs - PC/Tablet View (Same exact horizontal row layout with "More" dropdown) */}
                    <div className="hidden sm:flex border-b border-slate-200 dark:border-slate-800 flex-nowrap">
                        {[
                            { id: 'overview',  label: 'Overview',   icon: Building2 },
                            { id: 'work_info', label: 'Work Info',  icon: Activity },
                            { id: 'execution', label: 'Site Update',  icon: Camera },
                            { id: 'finances',  label: 'Finances',   icon: DollarSign },
                            { id: 'contracts', label: 'Contracts',  icon: FileText },
                        ].map(t => (
                            <button
                                key={t.id}
                                type="button"
                                onClick={() => setActiveTab(t.id)}
                                className={cn(
                                    'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-all whitespace-nowrap',
                                    activeTab === t.id
                                        ? 'border-amber-500 text-amber-600 font-semibold'
                                        : 'border-transparent text-slate-400 hover:text-slate-600'
                                )}
                            >
                                <t.icon size={15} />
                                {t.label}
                            </button>
                        ))}

                        <div className="relative group sm:ml-auto">
                            <button className={cn(
                                "flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-all whitespace-nowrap",
                                ['planning', 'documents', 'team'].includes(activeTab) 
                                    ? 'border-amber-500 text-amber-600 font-semibold' 
                                    : 'border-transparent text-slate-400 hover:text-slate-600'
                            )}>
                                More <ChevronDown size={14} className="transition-transform group-hover:rotate-180" />
                            </button>
                            <div className="absolute right-0 top-full w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden py-1">
                                {[
                                    { id: 'planning',  label: 'Planning',   icon: Bookmark },
                                    { id: 'documents', label: 'Docs & Agreements',  icon: FileText },
                                    { id: 'team',      label: 'Team',       icon: Users },
                                ].map(t => (
                                    <button
                                        key={t.id}
                                        type="button"
                                        onClick={() => setActiveTab(t.id)}
                                        className={cn(
                                            'w-full text-left flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all',
                                            activeTab === t.id
                                                ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600'
                                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                        )}
                                    >
                                        <t.icon size={15} />
                                        {t.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Tab Body */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-sm">
                        {activeTab === 'overview' && (
                            editing ? (
                                <form onSubmit={handleSaveDetails} className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="sm:col-span-2">
                                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Project Title</label>
                                            <input
                                                type="text"
                                                value={form.title}
                                                onChange={e => setForm({ ...form, title: e.target.value })}
                                                className={inputCls}
                                                required
                                            />
                                        </div>

                                        <div className="sm:col-span-2">
                                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Description</label>
                                            <textarea
                                                value={form.description}
                                                onChange={e => setForm({ ...form, description: e.target.value })}
                                                rows={4}
                                                className={cn(inputCls, 'resize-none')}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Status</label>
                                            <select
                                                value={form.status}
                                                onChange={e => setForm({ ...form, status: e.target.value })}
                                                className={inputCls}
                                            >
                                                {STATUS_OPTIONS.map(o => (
                                                    <option key={o.value} value={o.value}>{o.label}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Completion Percentage (%)</label>
                                            <input
                                                type="number"
                                                min={0}
                                                max={100}
                                                value={form.completion_percentage}
                                                onChange={e => setForm({ ...form, completion_percentage: parseInt(e.target.value) || 0 })}
                                                className={inputCls}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Site Address (User Input)</label>
                                            <input
                                                type="text"
                                                value={form.location}
                                                onChange={e => setForm({ ...form, location: e.target.value })}
                                                className={inputCls}
                                                placeholder="e.g. Beltola, Guwahati"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Google Maps Location</label>
                                            <input
                                                type="text"
                                                value={form.map_location}
                                                onChange={e => setForm({ ...form, map_location: e.target.value })}
                                                className={inputCls}
                                                placeholder="Google Maps Geocoded Location"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Latitude</label>
                                                <input
                                                    type="number"
                                                    step="any"
                                                    value={form.latitude}
                                                    onChange={e => setForm({ ...form, latitude: e.target.value })}
                                                    className={inputCls}
                                                    placeholder="Latitude"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Longitude</label>
                                                <input
                                                    type="number"
                                                    step="any"
                                                    value={form.longitude}
                                                    onChange={e => setForm({ ...form, longitude: e.target.value })}
                                                    className={inputCls}
                                                    placeholder="Longitude"
                                                />
                                            </div>
                                        </div>

                                         <div className="sm:col-span-2 bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80">
                                             <label className="block text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-2">Project Budget Configuration</label>
                                             <div className="relative mt-1 rounded-2xl shadow-sm">
                                                 <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                                                     <span className="text-xl font-bold text-slate-400">₹</span>
                                                 </div>
                                                 <input
                                                     type="number"
                                                     step="1"
                                                     min="0"
                                                     value={form.budget}
                                                     onChange={e => setForm({ ...form, budget: e.target.value })}
                                                     className="block w-full rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pl-9 pr-12 py-3.5 text-2xl font-black text-slate-800 dark:text-slate-100 focus:border-amber-400 focus:ring-amber-400/50"
                                                     placeholder="0"
                                                 />
                                             </div>
                                             
                                             {/* Live formatted representation in rupees & words */}
                                             <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                                                 <span className="text-slate-500 font-medium">Live Valuation:</span>
                                                 <span className="font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2.5 py-1 rounded-lg">
                                                     {(() => {
                                                         const num = parseFloat(form.budget) || 0;
                                                         if (!num) return '₹ 0 (Zero Rupees)';
                                                         const rupees = num;
                                                         const formatter = new Intl.NumberFormat('en-IN', {
                                                             style: 'currency',
                                                             currency: 'INR',
                                                             maximumFractionDigits: 0
                                                         });
                                                         
                                                         let words = '';
                                                         const crores = Math.floor(rupees / 10000000);
                                                         const lakhs = Math.floor((rupees % 10000000) / 100000);
                                                         const thousands = Math.floor((rupees % 100000) / 1000);
                                                         
                                                         if (crores > 0) words += `${crores} Crore${crores > 1 ? 's' : ''}`;
                                                         if (lakhs > 0) words += `${words ? ' ' : ''}${lakhs} Lakh${lakhs > 1 ? 's' : ''}`;
                                                         if (thousands > 0) words += `${words ? ' ' : ''}${thousands} Thousand${thousands > 1 ? 's' : ''}`;
                                                         
                                                         return `${formatter.format(rupees)} (${words || 'Zero'} Rupees)`;
                                                     })()}
                                                 </span>
                                             </div>

                                             {/* Preset Buttons for Quick Tuning */}
                                             <div className="mt-3 flex flex-wrap gap-2">
                                                 {[100000, 500000, 1000000, 10000000].map((val) => {
                                                     const label = val >= 10000000 ? `${val/10000000} Cr` : val >= 100000 ? `${val/100000} L` : val;
                                                     return (
                                                         <button
                                                             key={val}
                                                             type="button"
                                                             onClick={() => {
                                                                 const current = parseFloat(form.budget) || 0;
                                                                 setForm({ ...form, budget: current + val });
                                                             }}
                                                             className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-sm"
                                                         >
                                                             +{label}
                                                         </button>
                                                     );
                                                 })}
                                                 <button
                                                     type="button"
                                                     onClick={() => setForm({ ...form, budget: '' })}
                                                     className="px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-xl transition-colors shadow-sm ml-auto"
                                                 >
                                                     Clear
                                                 </button>
                                             </div>
                                         </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Start Date</label>
                                            <input
                                                type="date"
                                                value={form.start_date}
                                                onChange={e => setForm({ ...form, start_date: e.target.value })}
                                                className={inputCls}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Deadline</label>
                                            <input
                                                type="date"
                                                value={form.deadline}
                                                onChange={e => setForm({ ...form, deadline: e.target.value })}
                                                className={inputCls}
                                            />
                                        </div>

                                        {/* Assign New Team Members Section */}
                                        <div className="sm:col-span-2">
                                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Assign Team Members</label>
                                            {allMembers.length > 0 ? (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 border border-slate-200 dark:border-slate-800 rounded-xl max-h-48 overflow-y-auto bg-slate-50 dark:bg-slate-900">
                                                    {allMembers.map(m => {
                                                        const checked = form.team_ids.includes(m.id);
                                                        return (
                                                            <label key={m.id} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-white dark:hover:bg-slate-800 cursor-pointer text-sm">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={checked}
                                                                    onChange={() => {
                                                                        const updatedIds = checked
                                                                            ? form.team_ids.filter(id => id !== m.id)
                                                                            : [...form.team_ids, m.id];
                                                                        setForm({ ...form, team_ids: updatedIds });
                                                                    }}
                                                                    className="rounded border-slate-300 text-amber-500 focus:ring-amber-400"
                                                                />
                                                                <div>
                                                                    <p className="font-semibold text-slate-800 dark:text-slate-200">{m.name}</p>
                                                                    <p className="text-[10px] text-slate-400 capitalize">{m.role}</p>
                                                                </div>
                                                            </label>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-xs text-slate-400 italic">
                                                    <Loader2 size={12} className="animate-spin" /> Loading available team members...
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                                        <button
                                            type="button"
                                            onClick={() => setEditing(false)}
                                            className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={saving}
                                            className="inline-flex items-center gap-1.5 px-5 py-2 text-sm font-semibold text-white rounded-xl bg-amber-500 hover:bg-amber-600 transition-colors"
                                        >
                                            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                            Save Changes
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div className="space-y-6">
                                    {project.work_type && (
                                        <div className="relative overflow-hidden bg-gradient-to-br from-amber-500/5 via-slate-50/50 to-white dark:from-amber-500/5 dark:via-slate-900/40 dark:to-slate-950 backdrop-blur-3xl border border-amber-500/20 dark:border-amber-500/10 shadow-[0_20px_50px_rgba(245,158,11,0.05)] rounded-3xl sm:rounded-[2.5rem] p-4 sm:p-6 md:p-8">
                                            {/* Beautiful Decorative Top Light */}
                                            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent"></div>
                                            
                                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 mb-4 sm:pb-6 sm:mb-6 border-b border-slate-200/50 dark:border-slate-800/50 gap-4">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                                                        <h4 className="text-[10px] font-black text-amber-500 tracking-widest uppercase">Specifications</h4>
                                                    </div>
                                                    <h3 className="text-xl font-extrabold text-slate-800 dark:text-white tracking-tight">
                                                        Technical Work Information
                                                    </h3>
                                                </div>
                                                <span className="px-4 py-2 rounded-2xl bg-amber-500/10 dark:bg-amber-500/25 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-black uppercase tracking-widest shadow-sm">
                                                    {project.work_type}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                                                {/* Section 1: Structure Specifications */}
                                                <div className="bg-white/60 dark:bg-slate-900/60 p-4 sm:p-5 rounded-3xl border border-slate-200/50 dark:border-slate-800/80 shadow-sm space-y-4 hover:shadow-md transition-shadow">
                                                    <div className="flex items-center gap-2">
                                                        <div className="p-2 bg-amber-500/10 rounded-xl text-amber-600 dark:text-amber-400 shrink-0">
                                                            <Activity size={16} />
                                                        </div>
                                                        <h5 className="text-[11px] font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-wider">Structure Specs</h5>
                                                    </div>
                                                    {project.work_type === 'RCC' && (
                                                        <div className="space-y-2.5">
                                                            <div className="flex justify-between items-center text-xs">
                                                                <span className="text-slate-500 dark:text-slate-400 font-medium">Foundation:</span>
                                                                <span className="font-extrabold text-slate-800 dark:text-slate-200 bg-slate-100/80 dark:bg-slate-800 px-2 py-0.5 rounded-lg">{project.rcc_foundation || '—'}</span>
                                                            </div>
                                                            <div className="flex justify-between items-center text-xs">
                                                                <span className="text-slate-500 dark:text-slate-400 font-medium">Class Type:</span>
                                                                <span className="font-extrabold text-slate-800 dark:text-slate-200 bg-slate-100/80 dark:bg-slate-800 px-2 py-0.5 rounded-lg">{project.rcc_class || '—'}</span>
                                                            </div>
                                                            <div className="space-y-1 pt-1.5 border-t border-slate-100 dark:border-slate-800/80">
                                                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Finishing Plan:</span>
                                                                <p className="text-xs font-semibold text-slate-700 dark:text-slate-350 italic leading-relaxed">
                                                                    {project.rcc_finishing || '—'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {project.work_type === 'ASSAM TYPE' && (
                                                        <div className="space-y-2.5">
                                                            <div className="flex justify-between items-center text-xs">
                                                                <span className="text-slate-500 dark:text-slate-400 font-medium">Roof Type:</span>
                                                                <span className="font-extrabold text-slate-800 dark:text-slate-200 bg-slate-100/80 dark:bg-slate-800 px-2 py-0.5 rounded-lg">{project.assam_type_details?.roof_type || '—'}</span>
                                                            </div>
                                                            <div className="flex justify-between items-center text-xs">
                                                                <span className="text-slate-500 dark:text-slate-400 font-medium">Wood Quality:</span>
                                                                <span className="font-extrabold text-slate-800 dark:text-slate-200 bg-slate-100/80 dark:bg-slate-800 px-2 py-0.5 rounded-lg">{project.assam_type_details?.wood_quality || '—'}</span>
                                                            </div>
                                                            <div className="flex justify-between items-center text-xs">
                                                                <span className="text-slate-500 dark:text-slate-400 font-medium">No. of Rooms:</span>
                                                                <span className="font-extrabold text-slate-800 dark:text-slate-200 bg-slate-100/80 dark:bg-slate-800 px-2 py-0.5 rounded-lg">{project.assam_type_details?.rooms || '—'}</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {!['RCC', 'ASSAM TYPE'].includes(project.work_type) && (
                                                        <div className="space-y-2">
                                                            <span className="text-xs text-slate-650 dark:text-slate-300 block font-medium leading-relaxed italic">
                                                                {project.assam_type_details?.other_scope || 'No specific details provided.'}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Section 2: Area & Headroom */}
                                                <div className="bg-white/60 dark:bg-slate-900/60 p-4 sm:p-5 rounded-3xl border border-slate-200/50 dark:border-slate-800/80 shadow-sm space-y-4 hover:shadow-md transition-shadow">
                                                    <div className="flex items-center gap-2">
                                                        <div className="p-2 bg-amber-500/10 rounded-xl text-amber-600 dark:text-amber-400 shrink-0">
                                                            <Building2 size={16} />
                                                        </div>
                                                        <h5 className="text-[11px] font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-wider">Area & Scale</h5>
                                                    </div>
                                                    <div className="space-y-2.5">
                                                        <div className="flex justify-between items-center text-xs">
                                                            <span className="text-slate-500 dark:text-slate-400 font-medium">Plinth Area:</span>
                                                            <span className="font-extrabold text-slate-800 dark:text-slate-200 bg-slate-100/80 dark:bg-slate-800 px-2 py-0.5 rounded-lg">{project.plinth_area || '—'}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center text-xs">
                                                            <span className="text-slate-500 dark:text-slate-400 font-medium">Slab Area:</span>
                                                            <span className="font-extrabold text-slate-800 dark:text-slate-200 bg-slate-100/80 dark:bg-slate-800 px-2 py-0.5 rounded-lg">{project.slab_area || '—'}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center text-xs">
                                                            <span className="text-slate-500 dark:text-slate-400 font-medium">Head-room:</span>
                                                            <span className={cn(
                                                                "px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider shadow-sm",
                                                                project.head_room ? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/25 dark:text-emerald-400 border border-emerald-500/10" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200/20"
                                                            )}>
                                                                {project.head_room ? 'Available' : 'N/A'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Section 3: Site Logistics */}
                                                <div className="bg-white/60 dark:bg-slate-900/60 p-4 sm:p-5 rounded-3xl border border-slate-200/50 dark:border-slate-800/80 shadow-sm space-y-4 hover:shadow-md transition-shadow">
                                                    <div className="flex items-center gap-2">
                                                        <div className="p-2 bg-amber-500/10 rounded-xl text-amber-600 dark:text-amber-400 shrink-0">
                                                            <MapPin size={16} />
                                                        </div>
                                                        <h5 className="text-[11px] font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-wider">Logistics & Site</h5>
                                                    </div>
                                                    <div className="space-y-2.5">
                                                        <div className="flex justify-between items-center text-xs">
                                                            <span className="text-slate-500 dark:text-slate-400 font-medium">Road Size:</span>
                                                            <span className="font-extrabold text-slate-800 dark:text-slate-200 bg-slate-100/80 dark:bg-slate-800 px-2 py-0.5 rounded-lg">{project.road_size || '—'}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center text-xs">
                                                            <span className="text-slate-500 dark:text-slate-400 font-medium">Road Direction:</span>
                                                            <span className="font-extrabold text-slate-800 dark:text-slate-200 bg-slate-100/80 dark:bg-slate-800 px-2 py-0.5 rounded-lg">{project.road_direction || '—'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {(project.remarks || project.other_info) && (
                                                <div className="mt-6 pt-5 border-t border-slate-200/50 dark:border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    {project.remarks && (
                                                        <div className="bg-white/40 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200/30 dark:border-slate-800/40">
                                                            <span className="text-[9px] font-bold text-amber-500 uppercase tracking-widest block mb-1">Remarks & Notations</span>
                                                            <p className="text-xs text-slate-700 dark:text-slate-300 font-semibold leading-relaxed">{project.remarks}</p>
                                                        </div>
                                                    )}
                                                    {project.other_info && (
                                                        <div className="bg-white/40 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200/30 dark:border-slate-800/40">
                                                            <span className="text-[9px] font-bold text-amber-500 uppercase tracking-widest block mb-1">Other Supplementary Info</span>
                                                            <p className="text-xs text-slate-700 dark:text-slate-300 font-semibold leading-relaxed">{project.other_info}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div>
                                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Description</h3>
                                        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                                            {project.description || 'No description provided.'}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                                        <div className="col-span-2 sm:col-span-1">
                                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Site Address (User Input)</h4>
                                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{project.location || 'Not Specified'}</p>
                                        </div>
                                        <div className="col-span-2 sm:col-span-2">
                                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Google Maps Location</h4>
                                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex flex-wrap items-center gap-1.5">
                                                {project.map_location ? (
                                                    <>
                                                        <MapPin size={14} className="text-amber-500 shrink-0" />
                                                        <span>{project.map_location}</span>
                                                        {project.latitude && project.longitude && (
                                                            <span className="text-[10px] font-mono bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-400 px-1.5 py-0.5 rounded shrink-0">
                                                                ({parseFloat(project.latitude).toFixed(4)}, {parseFloat(project.longitude).toFixed(4)})
                                                            </span>
                                                        )}
                                                    </>
                                                ) : (
                                                    'Not Specified'
                                                )}
                                            </p>
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Budget</h4>
                                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                                                {project.budget ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(project.budget) : 'Not Specified'}
                                            </p>
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Start Date</h4>
                                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{fmtDate(project.start_date)}</p>
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Deadline</h4>
                                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{fmtDate(project.deadline)}</p>
                                        </div>
                                    </div>

                                    {/* Google Maps Embed for Location */}
                                    {(project.map_location || project.location) && (
                                        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                                <Navigation size={12} className="text-amber-500" /> Site Location Map
                                            </h4>
                                            <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 h-48 sm:h-64 bg-slate-100">
                                                {project.latitude && project.longitude ? (
                                                    <iframe
                                                        title="Site Location"
                                                        width="100%"
                                                        height="100%"
                                                        style={{ border: 0 }}
                                                        loading="lazy"
                                                        allowFullScreen
                                                        src={`https://maps.google.com/maps?q=${project.latitude},${project.longitude}&z=16&output=embed`}
                                                    />
                                                ) : project.map_coords ? (
                                                    <iframe
                                                        title="Site Location"
                                                        width="100%"
                                                        height="100%"
                                                        style={{ border: 0 }}
                                                        loading="lazy"
                                                        allowFullScreen
                                                        src={`https://maps.google.com/maps?q=${project.map_coords.lat},${project.map_coords.lng}&z=16&output=embed`}
                                                    />
                                                ) : (
                                                    <iframe
                                                        title="Site Location"
                                                        width="100%"
                                                        height="100%"
                                                        style={{ border: 0 }}
                                                        loading="lazy"
                                                        allowFullScreen
                                                        src={`https://maps.google.com/maps?q=${encodeURIComponent(project.map_location || project.location)}&output=embed`}
                                                    />
                                                )}
                                            </div>
                                            <div className="flex flex-col gap-1.5 mt-3">
                                                <p className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1">
                                                    <MapPin size={12} className="text-amber-500 shrink-0" />
                                                    <strong className="text-slate-700 dark:text-slate-300">Site Address:</strong> {project.location || '—'}
                                                </p>
                                                {project.map_location && (
                                                    <p className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1">
                                                        <Navigation size={12} className="text-amber-500 shrink-0" />
                                                        <strong className="text-slate-700 dark:text-slate-300">Map Location:</strong> {project.map_location}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Onboarding Setup Details Panel */}
                                    {project.status !== 'draft' && (
                                        <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-6">
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                                    <Activity size={12} className="text-amber-500" /> Onboarding Setup Details
                                                </h4>
                                                <button
                                                    onClick={() => setShowSetupModal(true)}
                                                    className="text-xs font-bold text-amber-500 hover:text-amber-650 flex items-center gap-1 transition-colors"
                                                >
                                                    <Settings size={12} /> Modify Onboarding Setup
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {/* Agreements & Contracts Card */}
                                                <div className="bg-slate-50 dark:bg-slate-800/20 border border-slate-150 dark:border-slate-800 rounded-2xl p-4 space-y-3">
                                                    <h5 className="text-xs font-bold text-slate-700 dark:text-slate-350 flex items-center gap-1.5">
                                                        <FileText size={14} className="text-blue-500" /> Agreements & Work Orders
                                                    </h5>
                                                    {(() => {
                                                        const agreementDocs = project.documents?.filter(d => d.category === 'agreement') || [];
                                                        if (agreementDocs.length === 0) {
                                                            return <p className="text-xs text-slate-400 italic">No agreements uploaded during setup.</p>;
                                                        }

                                                        const groupedAgreements = {};
                                                        agreementDocs.forEach(d => {
                                                            const type = d.document_name || 'General Agreement';
                                                            if (!groupedAgreements[type]) {
                                                                groupedAgreements[type] = {
                                                                    type,
                                                                    note: d.description || '',
                                                                    created_at: d.created_at,
                                                                    docs: []
                                                                };
                                                            }
                                                            groupedAgreements[type].docs.push(d);
                                                        });

                                                        return (
                                                            <div className="space-y-2">
                                                                {Object.values(groupedAgreements).map((a, idx) => (
                                                                    <div
                                                                        key={idx}
                                                                        onClick={() => setSelectedAgreement(a)}
                                                                        className="flex justify-between items-center p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-blue-300 transition-colors group cursor-pointer"
                                                                    >
                                                                        <div className="flex-1 min-w-0 pr-2">
                                                                            <h6 className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate group-hover:text-blue-600 transition-colors">{a.type}</h6>
                                                                            <p className="text-[10px] text-slate-400 font-medium truncate">{a.docs.length} File{a.docs.length !== 1 ? 's' : ''}</p>
                                                                        </div>
                                                                        <span className="text-[10px] text-blue-550 font-bold bg-blue-50 dark:bg-blue-500/10 px-1.5 py-0.5 rounded shrink-0">View Details</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        );
                                                    })()}
                                                </div>

                                                {/* Onboarding Payment Card */}
                                                <div className="bg-slate-50 dark:bg-slate-800/20 border border-slate-150 dark:border-slate-800 rounded-2xl p-4 space-y-3">
                                                    <h5 className="text-xs font-bold text-slate-700 dark:text-slate-350 flex items-center gap-1.5">
                                                        <DollarSign size={14} className="text-emerald-500" /> Onboarding Setup Payment
                                                    </h5>
                                                    {project.payments?.length > 0 ? (
                                                        <div className="space-y-2">
                                                            {project.payments.map(p => (
                                                                <div
                                                                    key={p.id}
                                                                    className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1.5 text-xs"
                                                                >
                                                                    <div className="flex justify-between items-center">
                                                                        <span className="font-bold text-emerald-600">+ ₹{Number(p.amount).toLocaleString('en-IN')}</span>
                                                                        <span className="text-[10px] text-slate-405 dark:text-slate-400 font-semibold">{p.payment_date ? new Date(p.payment_date).toLocaleDateString('en-IN') : ''}</span>
                                                                    </div>
                                                                    <p className="text-slate-500 dark:text-slate-400 text-[10px] line-clamp-1">{p.description}</p>
                                                                    {p.payment_proofs && p.payment_proofs.length > 0 && (
                                                                        <a
                                                                            href={p.payment_proofs[0]}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="inline-flex items-center gap-1 text-[10px] text-blue-500 font-bold mt-1 hover:underline"
                                                                        >
                                                                            <FileText size={10} /> View Payment Proof
                                                                        </a>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p className="text-xs text-slate-400 italic">No onboarding payments logged yet.</p>
                                                    )}
                                                </div>

                                                {/* Contractor KYCs Card */}
                                                <div className="bg-slate-50 dark:bg-slate-800/20 border border-slate-150 dark:border-slate-800 rounded-2xl p-4 space-y-3 md:col-span-2">
                                                    <h5 className="text-xs font-bold text-slate-700 dark:text-slate-355 flex items-center gap-1.5">
                                                        <Users size={14} className="text-indigo-500" /> Contractor & Labor KYCs
                                                    </h5>
                                                    {(() => {
                                                        const kycDocs = project.documents?.filter(d => d.category === 'kyc') || [];
                                                        if (kycDocs.length === 0) {
                                                            return <p className="text-xs text-slate-400 italic">No contractor KYC details logged yet.</p>;
                                                        }

                                                        const contractors = {};
                                                        kycDocs.forEach(d => {
                                                            const parsed = parseKycDescription(d.description);
                                                            const name = parsed.name || 'Unknown Contractor';
                                                            if (!contractors[name]) {
                                                                contractors[name] = {
                                                                    name,
                                                                    phone: parsed.phone || '',
                                                                    address: parsed.address || '',
                                                                    note: parsed.note || '',
                                                                    type: d.document_name.includes('(') ? d.document_name.split('(')[1].split(')')[0] : 'General',
                                                                    photo: null,
                                                                    docs: []
                                                                };
                                                            }

                                                            if (d.document_name.toLowerCase().includes('photo')) {
                                                                contractors[name].photo = d.file_path;
                                                            } else {
                                                                contractors[name].docs.push(d);
                                                            }
                                                        });

                                                        return (
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                                {Object.values(contractors).map((c, idx) => (
                                                                    <div 
                                                                        key={idx} 
                                                                        onClick={() => setSelectedKyc(c)}
                                                                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex gap-3 text-xs shadow-sm cursor-pointer hover:border-indigo-300 group transition-colors"
                                                                    >
                                                                        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 overflow-hidden shrink-0 border border-slate-100 dark:border-slate-800 flex items-center justify-center relative text-indigo-500">
                                                                            {c.photo ? (
                                                                                <img src={c.photo} alt={c.name} className="w-full h-full object-cover" />
                                                                            ) : (
                                                                                <Users size={18} />
                                                                            )}
                                                                        </div>
                                                                        <div className="flex-1 min-w-0 space-y-0.5">
                                                                            <div className="flex justify-between items-start gap-1">
                                                                                <h6 className="font-bold text-slate-850 dark:text-slate-200 truncate group-hover:text-indigo-600 transition-colors">{c.name}</h6>
                                                                            </div>
                                                                            <p className="text-[10px] font-bold text-indigo-650 bg-indigo-50 dark:bg-indigo-500/10 px-1.5 py-0.5 rounded shrink-0 inline-block">{c.type}</p>
                                                                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold truncate pt-1">{c.phone}</p>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        );
                                                    })()}
                                                </div>

                                                {/* Promised Payment Milestones Card */}
                                                <div className="bg-slate-50 dark:bg-slate-800/20 border border-slate-150 dark:border-slate-800 rounded-2xl p-4 space-y-3 md:col-span-2">
                                                    <h5 className="text-xs font-bold text-slate-700 dark:text-slate-355 flex items-center gap-1.5">
                                                        <DollarSign size={14} className="text-amber-500" /> Promised Payment Milestones & Structure
                                                    </h5>
                                                    {project.payment_milestones && project.payment_milestones.length > 0 ? (
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                            {project.payment_milestones.map((m, idx) => {
                                                                const budget = parseFloat(project.budget) || 0;
                                                                const pct = parseFloat(m.percentage) || 0;
                                                                let calculatedAmount = '—';
                                                                
                                                                if (budget) {
                                                                    const rsVal = (budget * pct) / 100;
                                                                    calculatedAmount = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(rsVal);
                                                                }
                                                                return (
                                                                    <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex items-center justify-between gap-3 text-xs shadow-sm">
                                                                        <div className="flex items-center gap-2.5 min-w-0">
                                                                            <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">
                                                                                {pct}%
                                                                            </div>
                                                                            <div className="min-w-0">
                                                                                <p className="font-bold text-slate-800 dark:text-slate-200 truncate">{m.stage || 'General Milestone'}</p>
                                                                                <p className="text-[10px] text-slate-400 font-medium">Calculated: {calculatedAmount}</p>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    ) : (
                                                        <p className="text-xs text-slate-400 italic">No promised payment milestones defined during setup.</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        )}

                        {activeTab === 'work_info' && (
                            <div className="space-y-4 sm:space-y-6 animate-fade-in">
                                {/* Premium Technical Work Specifications Section */}
                                {project.work_type ? (
                                    <div className="relative overflow-hidden bg-gradient-to-br from-amber-500/5 via-slate-50/50 to-white dark:from-amber-500/5 dark:via-slate-900/40 dark:to-slate-950 backdrop-blur-3xl border border-amber-500/20 dark:border-amber-500/10 shadow-[0_20px_50px_rgba(245,158,11,0.05)] rounded-3xl sm:rounded-[2.5rem] p-4 sm:p-6 md:p-8">
                                        {/* Beautiful Decorative Top Light */}
                                        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent"></div>
                                        
                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 mb-4 sm:pb-6 sm:mb-6 border-b border-slate-200/50 dark:border-slate-800/50 gap-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                                                    <h4 className="text-[10px] font-black text-amber-500 tracking-widest uppercase">Specifications</h4>
                                                </div>
                                                <h3 className="text-xl font-extrabold text-slate-800 dark:text-white tracking-tight">
                                                    Technical Work Information
                                                </h3>
                                            </div>
                                            <span className="px-4 py-2 rounded-2xl bg-amber-500/10 dark:bg-amber-500/25 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-black uppercase tracking-widest shadow-sm">
                                                {project.work_type}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                                            {/* Section 1: Structure Specifications */}
                                            <div className="bg-white/60 dark:bg-slate-900/60 p-4 sm:p-5 rounded-3xl border border-slate-200/50 dark:border-slate-800/80 shadow-sm space-y-4 hover:shadow-md transition-shadow">
                                                <div className="flex items-center gap-2">
                                                    <div className="p-2 bg-amber-500/10 rounded-xl text-amber-600 dark:text-amber-400 shrink-0">
                                                        <Activity size={16} />
                                                    </div>
                                                    <h5 className="text-[11px] font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-wider">Structure Specs</h5>
                                                </div>
                                                {project.work_type === 'RCC' && (
                                                    <div className="space-y-2.5">
                                                        <div className="flex justify-between items-center text-xs">
                                                            <span className="text-slate-500 dark:text-slate-400 font-medium">Foundation:</span>
                                                            <span className="font-extrabold text-slate-800 dark:text-slate-200 bg-slate-100/80 dark:bg-slate-800 px-2 py-0.5 rounded-lg">{project.rcc_foundation || '—'}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center text-xs">
                                                            <span className="text-slate-500 dark:text-slate-400 font-medium">Class Type:</span>
                                                            <span className="font-extrabold text-slate-800 dark:text-slate-200 bg-slate-100/80 dark:bg-slate-800 px-2 py-0.5 rounded-lg">{project.rcc_class || '—'}</span>
                                                        </div>
                                                        <div className="space-y-1 pt-1.5 border-t border-slate-100 dark:border-slate-800/80">
                                                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Finishing Plan:</span>
                                                            <p className="text-xs font-semibold text-slate-700 dark:text-slate-350 italic leading-relaxed">
                                                                {project.rcc_finishing || '—'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}
                                                {project.work_type === 'ASSAM TYPE' && (
                                                    <div className="space-y-2.5">
                                                        <div className="flex justify-between items-center text-xs">
                                                            <span className="text-slate-500 dark:text-slate-400 font-medium">Roof Type:</span>
                                                            <span className="font-extrabold text-slate-800 dark:text-slate-200 bg-slate-100/80 dark:bg-slate-800 px-2 py-0.5 rounded-lg">{project.assam_type_details?.roof_type || '—'}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center text-xs">
                                                            <span className="text-slate-500 dark:text-slate-400 font-medium">Wood Quality:</span>
                                                            <span className="font-extrabold text-slate-800 dark:text-slate-200 bg-slate-100/80 dark:bg-slate-800 px-2 py-0.5 rounded-lg">{project.assam_type_details?.wood_quality || '—'}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center text-xs">
                                                            <span className="text-slate-500 dark:text-slate-400 font-medium">No. of Rooms:</span>
                                                            <span className="font-extrabold text-slate-800 dark:text-slate-200 bg-slate-100/80 dark:bg-slate-800 px-2 py-0.5 rounded-lg">{project.assam_type_details?.rooms || '—'}</span>
                                                        </div>
                                                    </div>
                                                )}
                                                {!['RCC', 'ASSAM TYPE'].includes(project.work_type) && (
                                                    <div className="space-y-2">
                                                        <span className="text-xs text-slate-650 dark:text-slate-300 block font-medium leading-relaxed italic">
                                                            {project.assam_type_details?.other_scope || 'No specific details provided.'}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Section 2: Area & Headroom */}
                                            <div className="bg-white/60 dark:bg-slate-900/60 p-4 sm:p-5 rounded-3xl border border-slate-200/50 dark:border-slate-800/80 shadow-sm space-y-4 hover:shadow-md transition-shadow">
                                                <div className="flex items-center gap-2">
                                                    <div className="p-2 bg-amber-500/10 rounded-xl text-amber-600 dark:text-amber-400 shrink-0">
                                                        <Building2 size={16} />
                                                    </div>
                                                    <h5 className="text-[11px] font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-wider">Area & Scale</h5>
                                                </div>
                                                <div className="space-y-2.5">
                                                    <div className="flex justify-between items-center text-xs">
                                                        <span className="text-slate-500 dark:text-slate-400 font-medium">Plinth Area:</span>
                                                        <span className="font-extrabold text-slate-800 dark:text-slate-200 bg-slate-100/80 dark:bg-slate-800 px-2 py-0.5 rounded-lg">{project.plinth_area || '—'}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-xs">
                                                        <span className="text-slate-500 dark:text-slate-400 font-medium">Slab Area:</span>
                                                        <span className="font-extrabold text-slate-800 dark:text-slate-200 bg-slate-100/80 dark:bg-slate-800 px-2 py-0.5 rounded-lg">{project.slab_area || '—'}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-xs">
                                                        <span className="text-slate-500 dark:text-slate-400 font-medium">Head-room:</span>
                                                        <span className={cn(
                                                            "px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider shadow-sm",
                                                            project.head_room ? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/25 dark:text-emerald-400 border border-emerald-500/10" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200/20"
                                                        )}>
                                                            {project.head_room ? 'Available' : 'N/A'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Section 3: Site Logistics */}
                                            <div className="bg-white/60 dark:bg-slate-900/60 p-4 sm:p-5 rounded-3xl border border-slate-200/50 dark:border-slate-800/80 shadow-sm space-y-4 hover:shadow-md transition-shadow">
                                                <div className="flex items-center gap-2">
                                                    <div className="p-2 bg-amber-500/10 rounded-xl text-amber-600 dark:text-amber-400 shrink-0">
                                                        <MapPin size={16} />
                                                    </div>
                                                    <h5 className="text-[11px] font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-wider">Logistics & Site</h5>
                                                </div>
                                                <div className="space-y-2.5">
                                                    <div className="flex justify-between items-center text-xs">
                                                        <span className="text-slate-500 dark:text-slate-400 font-medium">Road Size:</span>
                                                        <span className="font-extrabold text-slate-800 dark:text-slate-200 bg-slate-100/80 dark:bg-slate-800 px-2 py-0.5 rounded-lg">{project.road_size || '—'}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-xs">
                                                        <span className="text-slate-500 dark:text-slate-400 font-medium">Road Direction:</span>
                                                        <span className="font-extrabold text-slate-800 dark:text-slate-200 bg-slate-100/80 dark:bg-slate-800 px-2 py-0.5 rounded-lg">{project.road_direction || '—'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {(project.remarks || project.other_info) && (
                                            <div className="mt-6 pt-5 border-t border-slate-200/50 dark:border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {project.remarks && (
                                                    <div className="bg-white/40 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200/30 dark:border-slate-800/40">
                                                        <span className="text-[9px] font-bold text-amber-500 uppercase tracking-widest block mb-1">Remarks & Notations</span>
                                                        <p className="text-xs text-slate-700 dark:text-slate-300 font-semibold leading-relaxed">{project.remarks}</p>
                                                    </div>
                                                )}
                                                {project.other_info && (
                                                    <div className="bg-white/40 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200/30 dark:border-slate-800/40">
                                                        <span className="text-[9px] font-bold text-amber-500 uppercase tracking-widest block mb-1">Other Supplementary Info</span>
                                                        <p className="text-xs text-slate-700 dark:text-slate-300 font-semibold leading-relaxed">{project.other_info}</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl border border-white/60 dark:border-white/5 shadow-md rounded-[2rem] p-10 text-center flex flex-col items-center justify-center">
                                        <div className="w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-950/20 text-amber-500 flex items-center justify-center mb-4">
                                            <AlertTriangle size={28} />
                                        </div>
                                        <h4 className="text-lg font-extrabold text-slate-800 dark:text-white mb-2">No Technical Specs Mapped</h4>
                                        <p className="text-xs text-slate-500 max-w-sm mb-6">Technical work specs are not set up for this project yet. Please run project setup to establish specifications.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'execution' && (
                            <div className="space-y-6">
                                {/* Header & Actions */}
                                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center shadow-lg rotate-3">
                                            <Camera size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Site Update Log</h3>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">See and post construction updates with photos, videos, notes, attachments, and voice notes.</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowUpdateForm(!showUpdateForm)}
                                        className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-all shadow-md flex items-center gap-2"
                                    >
                                        {showUpdateForm ? <X size={16} /> : <Plus size={16} />}
                                        {showUpdateForm ? 'Close Form' : 'Post Update'}
                                    </button>
                                </div>

                                {/* Post Update Form */}
                                {showUpdateForm && (
                                    <form onSubmit={submitUpdate} className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-amber-200 shadow-xl animate-slide-up relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-orange-500"></div>
                                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-6 uppercase tracking-wider flex items-center gap-2">
                                            <MessageSquare size={16} className="text-amber-500" /> New Update
                                        </h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Update Type</label>
                                                <select
                                                    value={updateForm.type}
                                                    onChange={e => setUpdateForm({ ...updateForm, type: e.target.value })}
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                                >
                                                    <option value="work_update">General Work Update</option>
                                                    <option value="drawing">Drawing / Plan Upload</option>
                                                    <option value="site_engineer_report">Site Engineer Report</option>
                                                    <option value="remark">Remark / Notation</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex justify-between items-center">
                                                    Attach Documents / Photos
                                                    {geoLoading && <span className="text-amber-500 flex items-center gap-1 text-[10px] animate-pulse"><Loader2 size={10} className="animate-spin" /> Fetching GPS...</span>}
                                                    {updateForm.latitude && !geoLoading && <span className="text-emerald-500 flex items-center gap-1 text-[10px]"><MapPin size={10} /> GPS Locked</span>}
                                                </label>
                                                <label className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 border-dashed rounded-xl px-4 py-3 text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors text-slate-600 font-medium">
                                                    <Upload size={16} />
                                                    {updateForm.photos.length > 0 ? `${updateForm.photos.length} File(s) Selected` : 'Select Photos, Videos or Files (PDF, Excel...)'}
                                                    <input type="file" multiple onChange={handlePhotoSelect} className="hidden" />
                                                </label>
                                            </div>
                                        </div>

                                        <div className="mb-5">
                                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Description / Notes</label>
                                            <textarea
                                                value={updateForm.content}
                                                onChange={e => setUpdateForm({ ...updateForm, content: e.target.value })}
                                                rows="3"
                                                placeholder="What's happening on site?"
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 resize-none"
                                            ></textarea>
                                        </div>

                                        <div className="mb-6">
                                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Voice Recordings</label>
                                            <div className="flex items-center gap-4">
                                                {!isRecording ? (
                                                    <button type="button" onClick={startRecording} className="w-full sm:w-auto bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl px-4 py-3 text-sm flex items-center justify-center gap-2 transition-colors font-medium">
                                                        <Mic size={16} /> Start Recording
                                                    </button>
                                                ) : (
                                                    <button type="button" onClick={stopRecording} className="w-full sm:w-auto bg-rose-500 hover:bg-rose-600 text-white shadow-md shadow-rose-500/30 rounded-xl px-4 py-3 text-sm flex items-center justify-center gap-2 transition-all font-bold animate-pulse">
                                                        <span className="w-2.5 h-2.5 rounded-full bg-white"></span> Stop Recording
                                                    </button>
                                                )}
                                                {updateForm.voice_notes.length > 0 && (
                                                    <span className="text-sm font-medium text-slate-600">{updateForm.voice_notes.length} recording(s) ready</span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex justify-end pt-4 border-t border-slate-100">
                                            <button
                                                type="submit"
                                                disabled={submittingUpdate}
                                                className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 flex items-center gap-2"
                                            >
                                                {submittingUpdate ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                                Post Update
                                            </button>
                                        </div>
                                    </form>
                                )}

                                {/* Updates Timeline */}
                                <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                                    {project.updates && project.updates.length > 0 ? project.updates.map((update, idx) => (
                                        <div key={update.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                            {/* Timeline Icon */}
                                            <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white dark:border-slate-900 bg-amber-100 text-amber-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                                                {update.type === 'drawing' ? <FileText size={16} /> : update.type === 'site_engineer_report' ? <Users size={16} /> : <Activity size={16} />}
                                            </div>
                                            {/* Content Card */}
                                            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md transition-all">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500 bg-amber-50 px-2 py-1 rounded-md">
                                                        {update.type.replace(/_/g, ' ')}
                                                    </span>
                                                    <span className="text-xs text-slate-400 font-medium">{new Date(update.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                                {update.content && <p className="text-sm text-slate-700 dark:text-slate-300 mt-3 whitespace-pre-wrap">{update.content}</p>}
                                                
                                                {/* Attachments (Photos, Videos, and Files) */}
                                                {update.photos && update.photos.length > 0 && (() => {
                                                    const images = [];
                                                    const videos = [];
                                                    const docs = [];
                                                    
                                                    update.photos.forEach(file => {
                                                        const lower = file.toLowerCase();
                                                        if (lower.endsWith('.mp4') || lower.endsWith('.mov') || lower.endsWith('.quicktime') || lower.endsWith('.webm') || lower.endsWith('.m4v') || lower.endsWith('.3gp')) {
                                                            videos.push(file);
                                                        } else if (lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.gif') || lower.endsWith('.webp') || lower.endsWith('.heic')) {
                                                            images.push(file);
                                                        } else {
                                                            docs.push(file);
                                                        }
                                                    });

                                                    return (
                                                        <div className="mt-4 space-y-4">
                                                             {/* Image Grid */}
                                                             {images.length > 0 && (
                                                                 <div className="grid grid-cols-2 gap-2">
                                                                     {images.map((photo, pIdx) => (
                                                                         <a key={pIdx} href={photo} target="_blank" rel="noopener noreferrer" className="block relative overflow-hidden rounded-xl border border-slate-200 hover:border-amber-400 group/img shadow-sm">
                                                                             <img src={photo} alt="Update" className="object-cover w-full h-32 group-hover/img:scale-105 transition-transform duration-300" />
                                                                         </a>
                                                                     ))}
                                                                 </div>
                                                             )}

                                                             {/* Video Grid */}
                                                             {videos.length > 0 && (
                                                                 <div className="space-y-2">
                                                                     {videos.map((video, vIdx) => (
                                                                         <div key={vIdx} className="rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-950">
                                                                             <video src={video} controls className="w-full max-h-60" />
                                                                         </div>
                                                                     ))}
                                                                 </div>
                                                             )}

                                                             {/* Documents List */}
                                                             {docs.length > 0 && (
                                                                 <div className="space-y-2">
                                                                     {docs.map((doc, dIdx) => {
                                                                         const parts = doc.split('/');
                                                                         const displayName = parts[parts.length - 1].replace(/^\d+_\d+_/, '');
                                                                         return (
                                                                             <a
                                                                                 key={dIdx}
                                                                                 href={doc}
                                                                                 target="_blank"
                                                                                 rel="noopener noreferrer"
                                                                                 className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors text-xs font-semibold"
                                                                             >
                                                                                 <div className="flex items-center gap-2 min-w-0">
                                                                                     <FileText size={16} className="text-amber-500 shrink-0" />
                                                                                     <span className="text-slate-700 dark:text-slate-200 truncate">{displayName}</span>
                                                                                 </div>
                                                                                 <span className="text-[10px] text-amber-600 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded shrink-0">Download</span>
                                                                             </a>
                                                                         );
                                                                     })}
                                                                 </div>
                                                             )}
                                                        </div>
                                                    );
                                                })()}

                                                {/* Voice Notes */}
                                                {update.voice_notes && update.voice_notes.length > 0 && (
                                                    <div className="mt-4 space-y-2">
                                                        {update.voice_notes.map((voice, vIdx) => (
                                                            <audio key={vIdx} controls className="w-full h-8" src={voice} />
                                                        ))}
                                                    </div>
                                                )}

                                                {/* GPS */}
                                                {update.latitude && update.longitude && (
                                                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                                                        <MapPin size={12} className="text-slate-400" />
                                                        <a href={`https://www.google.com/maps?q=${update.latitude},${update.longitude}`} target="_blank" rel="noreferrer" className="text-[10px] text-blue-500 hover:underline">
                                                            View GPS Location ({update.latitude.substring(0, 7)}, {update.longitude.substring(0, 7)})
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800">
                                            <Activity size={32} className="mx-auto text-slate-300 mb-3" />
                                            <p className="text-slate-500 text-sm font-medium">No execution updates yet.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'finances' && (
                            <div className="space-y-6 animate-fade-in">
                                 {/* Finance Overview Stats */}
                                 {(() => {
                                     const payments = project.payments || [];
                                     const totalReceived = payments.filter(p => p.payment_type === 'client_installment').reduce((sum, p) => sum + parseFloat(p.amount), 0);
                                     const totalExpenses = payments.filter(p => p.payment_type !== 'client_installment').reduce((sum, p) => sum + parseFloat(p.amount), 0);
                                     const remainingBudget = Math.max(0, parseFloat(project.budget || 0) - totalReceived);
                                     
                                     const formatINR = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

                                     return (
                                         <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                                             {/* Card 1: Total Budget */}
                                             <div className="bg-gradient-to-br from-indigo-50/60 to-violet-50/30 dark:from-slate-900 dark:to-indigo-950/20 rounded-3xl p-4 sm:p-6 border border-indigo-100/80 dark:border-indigo-900/30 shadow-md relative overflow-hidden group">
                                                 <div className="absolute -right-6 -bottom-6 text-indigo-100/50 dark:text-indigo-900/10 pointer-events-none transform group-hover:scale-110 transition-transform duration-300">
                                                     <Building2 size={100} />
                                                 </div>
                                                 <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3.5 shadow-sm">
                                                     <Building2 size={18} />
                                                 </div>
                                                 <p className="text-[10px] font-extrabold text-indigo-500 dark:text-indigo-400 uppercase tracking-widest mb-1.5">Project Budget</p>
                                                 <p className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
                                                     {project.budget ? formatINR(project.budget) : '₹0'}
                                                 </p>
                                             </div>

                                             {/* Card 2: Total Received */}
                                             <div className="bg-gradient-to-br from-emerald-50/60 to-teal-50/30 dark:from-slate-900 dark:to-emerald-950/20 rounded-3xl p-4 sm:p-6 border border-emerald-100/80 dark:border-emerald-900/30 shadow-md relative overflow-hidden group">
                                                 <div className="absolute -right-6 -bottom-6 text-emerald-100/50 dark:text-emerald-900/10 pointer-events-none transform group-hover:scale-110 transition-transform duration-300">
                                                     <DollarSign size={100} />
                                                 </div>
                                                 <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3.5 shadow-sm">
                                                     <DollarSign size={18} />
                                                 </div>
                                                 <p className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1.5">Revenue Collected</p>
                                                 <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400 tracking-tight">{formatINR(totalReceived)}</p>
                                             </div>

                                             {/* Card 3: Remaining Receivable */}
                                             <div className="bg-gradient-to-br from-amber-50/60 to-orange-50/30 dark:from-slate-900 dark:to-amber-950/20 rounded-3xl p-4 sm:p-6 border border-amber-100/80 dark:border-amber-900/30 shadow-md relative overflow-hidden group">
                                                 <div className="absolute -right-6 -bottom-6 text-amber-100/50 dark:text-amber-900/10 pointer-events-none transform group-hover:scale-110 transition-transform duration-300">
                                                     <CalendarDays size={100} />
                                                 </div>
                                                 <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3.5 shadow-sm">
                                                     <CalendarDays size={18} />
                                                 </div>
                                                 <p className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-1.5">Remaining Value</p>
                                                 <p className="text-2xl font-black text-amber-700 dark:text-amber-400 tracking-tight">{formatINR(remainingBudget)}</p>
                                             </div>

                                             {/* Card 4: Total Expenses */}
                                             <div className="bg-gradient-to-br from-rose-50/60 to-red-50/30 dark:from-slate-900 dark:to-rose-950/20 rounded-3xl p-4 sm:p-6 border border-rose-100/80 dark:border-rose-900/30 shadow-md relative overflow-hidden group">
                                                 <div className="absolute -right-6 -bottom-6 text-rose-100/50 dark:text-rose-900/10 pointer-events-none transform group-hover:scale-110 transition-transform duration-300">
                                                     <Activity size={100} />
                                                 </div>
                                                 <div className="w-10 h-10 rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-3.5 shadow-sm">
                                                     <Activity size={18} />
                                                 </div>
                                                 <p className="text-[10px] font-extrabold text-rose-600 dark:text-rose-400 uppercase tracking-widest mb-1.5">Project Payouts / Outgo</p>
                                                 <p className="text-2xl font-black text-rose-700 dark:text-rose-400 tracking-tight">{formatINR(totalExpenses)}</p>
                                             </div>
                                         </div>
                                     );
                                 })()}

                                {/* Finance Sub-Tabs Navigation */}
                                <div className="flex bg-slate-100/80 dark:bg-slate-900/60 backdrop-blur-md p-1.5 rounded-2xl gap-2 border border-slate-200/50 dark:border-slate-800/50 shadow-inner w-full max-w-2xl mx-auto mb-6">
                                    <button
                                        type="button"
                                        onClick={() => setFinanceSubTab('schedule')}
                                        className={cn(
                                            'flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center justify-center gap-2',
                                            financeSubTab === 'schedule'
                                                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md'
                                                : 'text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/30 dark:hover:bg-slate-800/30'
                                        )}
                                    >
                                        <CalendarDays size={16} />
                                        Installment Schedule
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFinanceSubTab('ledger')}
                                        className={cn(
                                            'flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center justify-center gap-2',
                                            financeSubTab === 'ledger'
                                                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md'
                                                : 'text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/30 dark:hover:bg-slate-800/30'
                                        )}
                                    >
                                        <DollarSign size={16} />
                                        Financial Ledger
                                    </button>
                                </div>

                                {financeSubTab === 'ledger' ? (
                                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                                    <DollarSign size={20} />
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Financial Ledger</h3>
                                                    <p className="text-xs text-slate-500">Client installments, contractor payments, and material bills.</p>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => setShowPaymentForm(!showPaymentForm)}
                                                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-all shadow-sm flex items-center gap-2"
                                            >
                                                {showPaymentForm ? <X size={16} /> : <Plus size={16} />} 
                                                {showPaymentForm ? 'Close Form' : 'Add Record'}
                                            </button>
                                        </div>

                                        {showPaymentForm && (
                                            <form onSubmit={submitPayment} className={cn(
                                                "mb-8 rounded-2xl p-6 border shadow-inner animate-slide-up relative overflow-hidden",
                                                paymentForm.payment_type === 'client_installment' ? "bg-slate-50 dark:bg-slate-800/50 border-emerald-200" : "bg-slate-50 dark:bg-slate-800/50 border-rose-200"
                                            )}>
                                                <div className={cn(
                                                    "absolute top-0 left-0 w-full h-1 bg-gradient-to-r",
                                                    paymentForm.payment_type === 'client_installment' ? "from-emerald-400 to-teal-500" : "from-rose-400 to-red-500"
                                                )} />

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                    {/* Payment Type Selection */}
                                                    <div>
                                                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Entry Type</label>
                                                        <div className="flex gap-2 p-1 bg-slate-200/50 dark:bg-slate-700/50 rounded-xl">
                                                            <button
                                                                type="button"
                                                                onClick={() => setPaymentForm({ ...paymentForm, payment_type: 'client_installment', collection_reason: '', description: '' })}
                                                                className={cn(
                                                                    "flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5",
                                                                    paymentForm.payment_type === 'client_installment' 
                                                                        ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm"
                                                                        : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
                                                                )}
                                                            >
                                                                <div className={cn("w-2 h-2 rounded-full", paymentForm.payment_type === 'client_installment' ? "bg-emerald-500" : "bg-slate-300")} />
                                                                Client Collection
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => setPaymentForm({ ...paymentForm, payment_type: 'contractor_payment', collection_reason: '', description: '' })}
                                                                className={cn(
                                                                    "flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5",
                                                                    paymentForm.payment_type !== 'client_installment' 
                                                                        ? "bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 shadow-sm"
                                                                        : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
                                                                )}
                                                            >
                                                                <div className={cn("w-2 h-2 rounded-full", paymentForm.payment_type !== 'client_installment' ? "bg-rose-500" : "bg-slate-300")} />
                                                                Expense / Payout
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {paymentForm.payment_type === 'client_installment' ? (
                                                        <div>
                                                            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Select Collection Reason (Milestone) *</label>
                                                            <select
                                                                required
                                                                value={paymentForm.collection_reason || ''}
                                                                onChange={e => {
                                                                    const val = e.target.value;
                                                                    setPaymentForm(prev => ({
                                                                        ...prev,
                                                                        collection_reason: val,
                                                                        description: val === 'custom' ? '' : `Milestone Collection: ${val}`
                                                                    }));
                                                                }}
                                                                className="w-full text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none"
                                                            >
                                                                <option value="" disabled>-- Choose milestone or reason --</option>
                                                                {milestones.length > 0 ? (
                                                                    milestones.map((m, i) => (
                                                                        <option key={m.id || i} value={m.title}>
                                                                            {m.title} ({m.percentage}%)
                                                                        </option>
                                                                    ))
                                                                ) : (
                                                                    <>
                                                                        <option value="Booking & Agreement Advance">Booking & Agreement Advance (15%)</option>
                                                                        <option value="On Foundation & Plinth completion">On Foundation & Plinth completion (20%)</option>
                                                                        <option value="On First Roof Slab casting">On First Roof Slab casting (25%)</option>
                                                                        <option value="On Brickwork & Interior Plastering">On Brickwork & Interior Plastering (25%)</option>
                                                                        <option value="On Final Finishing & Handover">On Final Finishing & Handover (15%)</option>
                                                                    </>
                                                                )}
                                                                <option value="custom">Other / Custom Collection...</option>
                                                            </select>
                                                        </div>
                                                    ) : (
                                                        <div>
                                                            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Expense Type</label>
                                                            <select
                                                                value={paymentForm.payment_type}
                                                                onChange={e => setPaymentForm({ ...paymentForm, payment_type: e.target.value })}
                                                                className="w-full text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 focus:outline-none"
                                                            >
                                                                <option value="contractor_payment">Contractor Payment</option>
                                                                <option value="material_expense">Material Bill / Expense</option>
                                                                <option value="other_expense">Other Operations Payout</option>
                                                            </select>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                    <div>
                                                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Amount (₹) *</label>
                                                        <input
                                                            type="number"
                                                            required
                                                            placeholder="0"
                                                            value={paymentForm.amount}
                                                            onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                                                            className={cn(
                                                                "w-full text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 font-semibold focus:outline-none focus:ring-2 focus:ring-offset-0",
                                                                paymentForm.payment_type === 'client_installment' ? "focus:ring-emerald-500 focus:border-emerald-500" : "focus:ring-rose-500 focus:border-rose-500"
                                                            )}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Date *</label>
                                                        <input
                                                            type="date"
                                                            required
                                                            value={paymentForm.payment_date}
                                                            onChange={e => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
                                                            className={cn(
                                                                "w-full text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-offset-0",
                                                                paymentForm.payment_type === 'client_installment' ? "focus:ring-emerald-500 focus:border-emerald-500" : "focus:ring-rose-500 focus:border-rose-500"
                                                            )}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="mb-4">
                                                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Description / Notes</label>
                                                    <textarea
                                                        rows={2}
                                                        value={paymentForm.description}
                                                        onChange={e => setPaymentForm({ ...paymentForm, description: e.target.value })}
                                                        className={cn(
                                                            "w-full text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-offset-0 resize-none",
                                                            paymentForm.payment_type === 'client_installment' ? "focus:ring-emerald-500 focus:border-emerald-500" : "focus:ring-rose-500 focus:border-rose-500"
                                                        )}
                                                        placeholder={paymentForm.payment_type === 'client_installment' ? "e.g. Received Phase 1 Advance via NEFT" : "e.g. Paid vendor A for cement delivery"}
                                                    />
                                                </div>

                                                {/* Upload Proof of Payment Box */}
                                                <div className="mb-6">
                                                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Attach Proof of Payment (Receipt, Screenshot, PDF)</label>
                                                    <div className="flex flex-col gap-2">
                                                        <label className="w-full bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-750 border-dashed rounded-xl px-4 py-5 text-center flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all hover:border-slate-350">
                                                            <Upload size={18} className="text-slate-450 dark:text-slate-400 animate-pulse" />
                                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-350">Click to upload file proof</span>
                                                            <span className="text-[10px] text-slate-400">Supporting PDF, PNG, or JPG formats</span>
                                                            <input 
                                                                type="file" 
                                                                multiple 
                                                                onChange={e => setPaymentForm(prev => ({ ...prev, payment_proofs: [...prev.payment_proofs, ...Array.from(e.target.files)] }))} 
                                                                className="hidden" 
                                                            />
                                                        </label>
                                                        
                                                        {paymentForm.payment_proofs && paymentForm.payment_proofs.length > 0 && (
                                                            <div className="flex flex-wrap gap-1.5 mt-1">
                                                                {paymentForm.payment_proofs.map((file, i) => (
                                                                    <div key={i} className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-750 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300">
                                                                        <FileText size={12} className="text-slate-400 shrink-0" />
                                                                        <span className="max-w-[150px] truncate">{file.name}</span>
                                                                        <button 
                                                                            type="button" 
                                                                            onClick={() => setPaymentForm(prev => ({ ...prev, payment_proofs: prev.payment_proofs.filter((_, idx) => idx !== i) }))}
                                                                            className="text-slate-400 hover:text-rose-500 p-0.5"
                                                                        >
                                                                            <X size={12} />
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex justify-end gap-3">
                                                    <button
                                                        type="submit"
                                                        disabled={submittingPayment}
                                                        className={cn(
                                                            "px-6 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md flex items-center gap-1.5 transition-all disabled:opacity-50",
                                                            paymentForm.payment_type === 'client_installment' ? "bg-gradient-to-r from-emerald-500 to-teal-500" : "bg-gradient-to-r from-rose-500 to-red-500"
                                                        )}
                                                    >
                                                        {submittingPayment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                                        {paymentForm.payment_type === 'client_installment' ? 'Save Collection' : 'Save Payout'}
                                                    </button>
                                                </div>
                                            </form>
                                        )}

                                        {/* Dynamic Table for Finances */}
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="border-b border-slate-100 dark:border-slate-800 text-xs uppercase tracking-wider text-slate-400 font-semibold">
                                                        <th className="pb-3 px-2">Date</th>
                                                        <th className="pb-3 px-2">Type</th>
                                                        <th className="pb-3 px-2">Description</th>
                                                        <th className="pb-3 px-2">Amount</th>
                                                        <th className="pb-3 px-2">Proofs</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="text-sm">
                                                    {project.payments && project.payments.length > 0 ? (
                                                        project.payments.map((payment, idx) => {
                                                            const isIncome = payment.payment_type === 'client_installment';
                                                            const amountFormatted = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(payment.amount);
                                                            const typeLabel = payment.payment_type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                                                            
                                                            return (
                                                                <tr key={payment.id || idx} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                                    <td className="py-3 px-2 text-slate-600 dark:text-slate-300">
                                                                        {new Date(payment.payment_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                                    </td>
                                                                    <td className="py-3 px-2">
                                                                        <span className={cn(
                                                                            "px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide",
                                                                            isIncome ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                                                                        )}>
                                                                            {typeLabel}
                                                                        </span>
                                                                    </td>
                                                                    <td className="py-3 px-2 text-slate-800 dark:text-slate-200 max-w-[200px] truncate" title={payment.description}>
                                                                        {payment.description || '—'}
                                                                    </td>
                                                                    <td className={cn(
                                                                        "py-3 px-2 font-semibold",
                                                                        isIncome ? "text-emerald-600" : "text-rose-500"
                                                                    )}>
                                                                        {isIncome ? '+' : '-'} {amountFormatted}
                                                                    </td>
                                                                    <td className="py-3 px-2">
                                                                        {payment.payment_proofs && payment.payment_proofs.length > 0 ? (
                                                                            <div className="flex gap-1">
                                                                                {payment.payment_proofs.map((proof, i) => (
                                                                                    <a key={i} href={proof} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600 flex items-center gap-1 text-xs">
                                                                                        <FileText size={14} />
                                                                                    </a>
                                                                                ))}
                                                                            </div>
                                                                        ) : (
                                                                            <span className="text-slate-400 text-xs">—</span>
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })
                                                    ) : (
                                                        <tr>
                                                            <td colSpan="5" className="py-8 text-center text-slate-400 text-sm">
                                                                No financial records found.
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ) : (
                                    /* ── Installment Schedule & Calendar View ── */
                                    <div className="space-y-6">
                                        {/* Schedule Analytics & Progress Card */}
                                        {(() => {
                                            const totalScheduledPercentage = milestones.reduce((sum, m) => sum + parseFloat(m.percentage || 0), 0);
                                            const totalReceivedScheduled = milestones.filter(m => m.status === 'Received').reduce((sum, m) => sum + (parseFloat(project.budget || 0) * parseFloat(m.percentage || 0)) / 100, 0);
                                            const unscheduledPercentage = Math.max(0, 100 - totalScheduledPercentage);
                                            
                                            const formatINR = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

                                            return (
                                                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                                                                <CalendarDays size={20} />
                                                            </div>
                                                            <div>
                                                                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Milestone Installment Plan</h3>
                                                                <p className="text-xs text-slate-500">Track and schedule upcoming client payment phases based on work completion.</p>
                                                            </div>
                                                        </div>

                                                        {milestones.length > 0 && (
                                                            <button
                                                                type="button"
                                                                disabled={isSavingMilestones}
                                                                onClick={() => saveMilestonesToServer(milestones)}
                                                                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all flex items-center gap-2"
                                                            >
                                                                {isSavingMilestones ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                                                Save Installment Schedule
                                                            </button>
                                                        )}
                                                    </div>

                                                    {/* Visual Budget Progress Bars */}
                                                    <div className="pt-2">
                                                        <div className="space-y-2">
                                                            <div className="flex justify-between text-xs font-bold text-slate-500">
                                                                <span>Allocated Schedule</span>
                                                                <span className={cn(
                                                                    totalScheduledPercentage === 100 ? "text-emerald-600" : "text-amber-500"
                                                                )}>
                                                                    {totalScheduledPercentage}% / 100%
                                                                </span>
                                                            </div>
                                                            <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
                                                                <div 
                                                                    style={{ width: `${Math.min(100, totalScheduledPercentage)}%` }} 
                                                                    className={cn(
                                                                        "h-full rounded-full transition-all",
                                                                        totalScheduledPercentage === 100 ? "bg-emerald-500" : "bg-amber-500"
                                                                    )}
                                                                />
                                                            </div>
                                                            <p className="text-[10px] text-slate-400">
                                                                {unscheduledPercentage > 0 
                                                                    ? `⚠️ ${unscheduledPercentage}% of the budget (₹${formatINR(project.budget * unscheduledPercentage / 100)}) is currently unscheduled.`
                                                                    : '✓ 100% of the project budget has been allocated to installments.'}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Budget alerts */}
                                                    {totalScheduledPercentage !== 100 && milestones.length > 0 && (
                                                        <div className="p-3.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-2xl flex items-start gap-2.5">
                                                            <Info size={16} className="text-amber-500 shrink-0 mt-0.5" />
                                                            <div className="flex-1 text-xs">
                                                                <span className="font-bold text-amber-800 dark:text-amber-400">Adjustment Needed: </span>
                                                                <span className="text-amber-700 dark:text-amber-500">
                                                                    Your milestone percentages total <strong className="font-extrabold">{totalScheduledPercentage}%</strong>. Please adjust your milestone list percentages below so they sum up to exactly <strong className="font-extrabold">100%</strong> of the total project budget.
                                                                </span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })()}

                                        {/* Schedule Timeline Content */}
                                        {milestones.length === 0 ? (
                                            /* Onboarding Empty State Plan Initializer */
                                            <div className="bg-slate-50 dark:bg-slate-900/30 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-10 text-center space-y-6">
                                                <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-100/70 text-amber-500 flex items-center justify-center shadow-inner">
                                                    <CalendarDays size={32} />
                                                </div>
                                                <div className="max-w-md mx-auto space-y-2">
                                                    <h4 className="text-base font-bold text-slate-800 dark:text-slate-100">Initialize Project Installments</h4>
                                                    <p className="text-xs text-slate-400 leading-relaxed">
                                                        There is no payment calendar or installment schedule configured for this project yet. Choose an option below to get started.
                                                    </p>
                                                </div>

                                                <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
                                                    <button
                                                        type="button"
                                                        onClick={handleInitStandardPlan}
                                                        className="px-6 py-3 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-sm flex items-center justify-center gap-2"
                                                    >
                                                        ⚡ Generate Standard 5-Step Construction Plan
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowNewMilestone(true)}
                                                        className="px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                                                    >
                                                        Custom Milestone Plan
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            /* Active Milestones Calendar Timeline & Management */
                                            <div className="space-y-6">
                                                {/* Milestone Table */}
                                                <div className="overflow-x-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm">
                                                    <table className="w-full text-left border-collapse">
                                                        <thead>
                                                            <tr className="border-b border-slate-100 dark:border-slate-800 text-xs uppercase tracking-wider text-slate-400 font-semibold bg-slate-50/50 dark:bg-slate-900/50">
                                                                <th className="py-3 px-4 w-10 text-center">#</th>
                                                                <th className="py-3 px-4 min-w-[200px]">Phase / Stage Name</th>
                                                                <th className="py-3 px-4 w-28 text-center">Allocation</th>
                                                                <th className="py-3 px-4 w-36 text-right">Planned Amount</th>
                                                                <th className="py-3 px-4 w-40">Expected Date</th>
                                                                <th className="py-3 px-4 w-44">Payment Status</th>
                                                                <th className="py-3 px-4 w-16 text-center">Actions</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="text-sm divide-y divide-slate-100 dark:divide-slate-800/60">
                                                            {milestones.map((m, idx) => {
                                                                const msAmount = (parseFloat(project.budget || 0) * parseFloat(m.percentage || 0)) / 100;
                                                                const amountFormatted = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(msAmount);
                                                                const payInfo = checkPaymentStatus(m);

                                                                return (
                                                                    <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                                                        {/* Index */}
                                                                        <td className="py-3.5 px-4 text-center font-semibold text-slate-400 text-xs">
                                                                            {idx + 1}
                                                                        </td>

                                                                        {/* Phase Title Input */}
                                                                        <td className="py-3.5 px-4">
                                                                            <input 
                                                                                type="text"
                                                                                value={m.stage || m.title || ''}
                                                                                onChange={e => handleUpdateMilestone(m.id, { stage: e.target.value, title: e.target.value })}
                                                                                className="font-bold text-sm text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-850/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 w-full max-w-sm focus:ring-1 focus:ring-amber-500 focus:outline-none"
                                                                            />
                                                                        </td>

                                                                        {/* Percentage Allocation */}
                                                                        <td className="py-3.5 px-4">
                                                                            <div className="flex items-center justify-center gap-1.5">
                                                                                <input 
                                                                                    type="number"
                                                                                    value={m.percentage}
                                                                                    onChange={e => handleUpdateMilestone(m.id, { percentage: e.target.value })}
                                                                                    className="w-14 text-center text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-1.5 py-1 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                                                                                />
                                                                                <span className="text-xs text-slate-400 font-medium">%</span>
                                                                            </div>
                                                                        </td>

                                                                        {/* Planned Amount */}
                                                                        <td className="py-3.5 px-4 text-right font-black text-slate-800 dark:text-slate-200">
                                                                            {amountFormatted}
                                                                        </td>

                                                                        {/* Expected Date Picker */}
                                                                        <td className="py-3.5 px-4">
                                                                            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded-xl w-32 shrink-0">
                                                                                <Calendar size={12} className="text-slate-400 shrink-0" />
                                                                                <input 
                                                                                    type="date"
                                                                                    value={m.due_date ? m.due_date.split('T')[0] : ''}
                                                                                    onChange={e => handleUpdateMilestone(m.id, { due_date: e.target.value })}
                                                                                    className="text-xs text-slate-600 dark:text-slate-300 bg-transparent border-0 p-0 focus:ring-0 w-24 cursor-pointer focus:outline-none"
                                                                                />
                                                                            </div>
                                                                        </td>

                                                                        {/* Dynamic Payment Status Badge */}
                                                                        <td className="py-3.5 px-4">
                                                                            <div className="flex flex-col gap-1.5 items-start">
                                                                                <span className={cn(
                                                                                    "px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider inline-block text-center w-24 shrink-0 shadow-sm",
                                                                                    payInfo.color
                                                                                )}>
                                                                                    {payInfo.label}
                                                                                </span>
                                                                                {payInfo.status === 'Received' ? (
                                                                                    <span className="text-[10px] text-emerald-600 dark:text-emerald-500 font-semibold block max-w-[150px] truncate" title={`Collected ${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(payInfo.amount)}`}>
                                                                                        Received {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(payInfo.amount)}
                                                                                    </span>
                                                                                ) : (
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => handleMarkAsPaidClick(m, msAmount)}
                                                                                        className="px-2.5 py-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-extrabold text-[9px] uppercase tracking-wider rounded-lg shadow-sm hover:shadow-md transition-all shrink-0 flex items-center justify-center gap-1 w-24"
                                                                                    >
                                                                                        <Check size={9} className="shrink-0" />
                                                                                        Set as Paid
                                                                                    </button>
                                                                                )}
                                                                            </div>
                                                                        </td>

                                                                        {/* Action Delete button */}
                                                                        <td className="py-3.5 px-4 text-center">
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleDeleteMilestone(m.id)}
                                                                                className="w-8 h-8 rounded-xl flex items-center justify-center border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/15 transition-all"
                                                                                title="Delete Milestone"
                                                                            >
                                                                                <Trash2 size={13} />
                                                                            </button>
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </table>
                                                </div>

                                                {/* Add new milestone inline */}
                                                {!showNewMilestone ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowNewMilestone(true)}
                                                        className="w-full py-3 bg-slate-50 dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold text-slate-500 hover:text-amber-500 hover:bg-slate-100/50 hover:border-amber-400/50 transition-all flex items-center justify-center gap-2"
                                                    >
                                                        <Plus size={14} /> Add Custom Installment Phase
                                                    </button>
                                                ) : (
                                                    <div className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 space-y-4 animate-slide-up">
                                                        <div className="flex justify-between items-center">
                                                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">New Milestone Details</h4>
                                                            <button type="button" onClick={() => setShowNewMilestone(false)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
                                                        </div>
                                                        
                                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                            <div>
                                                                <label className="block text-[10px] font-semibold text-slate-500 mb-1">Milestone / Stage Name *</label>
                                                                <input 
                                                                    type="text"
                                                                    required
                                                                    placeholder="e.g. On Plastering completion"
                                                                    value={newMilestoneForm.title}
                                                                    onChange={e => setNewMilestoneForm({ ...newMilestoneForm, title: e.target.value })}
                                                                    className="w-full text-xs bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-[10px] font-semibold text-slate-500 mb-1">Percentage Allocation (%) *</label>
                                                                <input 
                                                                    type="number"
                                                                    required
                                                                    min="1"
                                                                    max="100"
                                                                    placeholder="e.g. 15"
                                                                    value={newMilestoneForm.percentage}
                                                                    onChange={e => setNewMilestoneForm({ ...newMilestoneForm, percentage: e.target.value })}
                                                                    className="w-full text-xs bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-[10px] font-semibold text-slate-500 mb-1">Expected Due Date</label>
                                                                <input 
                                                                    type="date"
                                                                    value={newMilestoneForm.due_date}
                                                                    onChange={e => setNewMilestoneForm({ ...newMilestoneForm, due_date: e.target.value })}
                                                                    className="w-full text-xs bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2"
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="flex justify-end gap-2.5">
                                                            <button
                                                                type="button"
                                                                onClick={() => setShowNewMilestone(false)}
                                                                className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300"
                                                            >
                                                                Cancel
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={handleAddMilestone}
                                                                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
                                                            >
                                                                Add Phase
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'contracts' && (
                            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm animate-fade-in">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                                            <FileText size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Contracts & KYC</h3>
                                            <p className="text-xs text-slate-500">Civil and interior work orders, contractor KYC, and agreements.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button className="px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2">
                                            <Upload size={14} /> Upload Contract
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-8 mt-6">
                                    {/* Agreements Section */}
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-2 mb-4">Agreements & Work Orders</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {(() => {
                                                const agreementDocs = project.documents?.filter(d => d.category === 'agreement') || [];
                                                if (agreementDocs.length === 0) {
                                                    return (
                                                        <div className="col-span-full bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 border-dashed rounded-2xl p-6 text-center">
                                                            <FileText size={24} className="text-slate-300 mx-auto mb-2" />
                                                            <p className="text-sm font-semibold text-slate-500">Agreements Not Available</p>
                                                            <p className="text-xs text-slate-400 mt-1">No agreements or work orders have been uploaded yet.</p>
                                                        </div>
                                                    );
                                                }

                                                const groupedAgreements = {};
                                                agreementDocs.forEach(d => {
                                                    const type = d.document_name || 'General Agreement';
                                                    if (!groupedAgreements[type]) {
                                                        groupedAgreements[type] = {
                                                            type,
                                                            note: d.description || '',
                                                            created_at: d.created_at,
                                                            docs: []
                                                        };
                                                    }
                                                    if (d.file_path) {
                                                        groupedAgreements[type].docs.push(d);
                                                    }
                                                });

                                                return Object.values(groupedAgreements).map((a, idx) => (
                                                    <div
                                                        key={idx}
                                                        onClick={() => setSelectedAgreement(a)}
                                                        className="border border-slate-200 dark:border-slate-800 rounded-3xl p-5 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group bg-white dark:bg-slate-900/60 flex flex-col justify-between"
                                                    >
                                                        <div>
                                                            <div className="flex items-start gap-4 mb-3">
                                                                <div className="w-12 h-12 bg-blue-50 dark:bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/20 group-hover:scale-105 transition-transform duration-300">
                                                                    <FileText size={20} />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">{a.type}</h4>
                                                                    <p className="text-[10px] text-slate-400 mt-0.5">Uploaded {new Date(a.created_at).toLocaleDateString('en-IN')}</p>
                                                                </div>
                                                            </div>

                                                            {a.note && (
                                                                <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 px-3 py-2.5 rounded-2xl border border-slate-100 dark:border-slate-800/60 italic line-clamp-3">
                                                                    "{a.note}"
                                                                </p>
                                                            )}
                                                        </div>

                                                        {a.docs.length > 0 ? (
                                                            <div className="mt-4 space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800 border-dashed">
                                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Attached Documents</p>
                                                                <div className="space-y-1.5">
                                                                    {a.docs.map((doc, docIdx) => (
                                                                        <a
                                                                            key={docIdx}
                                                                            href={doc.file_path}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            onClick={(e) => e.stopPropagation()}
                                                                            className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-850 hover:bg-blue-50 dark:hover:bg-blue-950/20 border border-slate-100 dark:border-slate-800 rounded-xl transition-all group/file"
                                                                        >
                                                                            <div className="flex items-center gap-2 min-w-0">
                                                                                <FileText size={12} className="text-slate-400 group-hover/file:text-blue-500 transition-colors shrink-0" />
                                                                                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 truncate">
                                                                                    {doc.file_path.split('/').pop()}
                                                                                </span>
                                                                            </div>
                                                                            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded shrink-0 group-hover/file:bg-blue-100 dark:group-hover/file:bg-blue-900/30">View</span>
                                                                        </a>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <p className="text-[10px] text-slate-400 mt-4 italic">No file attached</p>
                                                        )}
                                                    </div>
                                                ));
                                            })()}
                                            
                                            <div 
                                                onClick={() => setShowSetupModal(true)}
                                                className="border-2 border-slate-200 dark:border-slate-800 border-dashed rounded-3xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-850/40 hover:border-blue-400 dark:hover:border-blue-900/40 transition-all min-h-[140px] group"
                                            >
                                                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-2 text-slate-400 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/30 group-hover:text-blue-500 transition-colors">
                                                    <Upload size={18} />
                                                </div>
                                                <p className="text-sm font-semibold text-slate-700 dark:text-slate-350">Add / Modify Agreements</p>
                                                <p className="text-[11px] text-slate-400 mt-0.5">Upload work orders or service agreements.</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* KYCs Section */}
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-2 mb-4">Contractor / Labor KYCs</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {(() => {
                                                const kycDocs = project.documents?.filter(d => d.category === 'kyc') || [];
                                                
                                                if (kycDocs.length === 0) {
                                                    return (
                                                        <div className="col-span-full bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 border-dashed rounded-2xl p-6 text-center">
                                                            <Users size={24} className="text-slate-300 mx-auto mb-2" />
                                                            <p className="text-sm font-semibold text-slate-500">KYCs Not Available</p>
                                                            <p className="text-xs text-slate-400 mt-1">No contractor or labor KYC records have been uploaded yet.</p>
                                                        </div>
                                                    );
                                                }

                                                const contractors = {};

                                                kycDocs.forEach(d => {
                                                    const parsed = parseKycDescription(d.description);
                                                    const name = parsed.name || 'Unknown Contractor';
                                                    if (!contractors[name]) {
                                                        contractors[name] = {
                                                            name,
                                                            phone: '',
                                                            address: '',
                                                            note: '',
                                                            type: 'General',
                                                            photo: null,
                                                            docs: []
                                                        };
                                                    }

                                                    if (parsed.phone) contractors[name].phone = parsed.phone;
                                                    if (parsed.address) contractors[name].address = parsed.address;
                                                    if (parsed.note) contractors[name].note = parsed.note;
                                                    if (d.document_name.includes('(')) {
                                                        contractors[name].type = d.document_name.split('(')[1].split(')')[0];
                                                    }

                                                    if (d.file_path) {
                                                        if (d.document_name.toLowerCase().includes('photo')) {
                                                            contractors[name].photo = d.file_path;
                                                        } else {
                                                            contractors[name].docs.push(d);
                                                        }
                                                    }
                                                });

                                                return Object.values(contractors).map((c, idx) => (
                                                    <div 
                                                        key={idx} 
                                                        onClick={() => setSelectedKyc(c)}
                                                        className="border border-slate-200 dark:border-slate-800 rounded-3xl p-5 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group bg-white dark:bg-slate-900/60 flex flex-col justify-between"
                                                    >
                                                        <div>
                                                            <div className="flex items-start gap-4 mb-4">
                                                                <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden border border-slate-100 dark:border-slate-850 group-hover:scale-105 transition-transform duration-300">
                                                                    {c.photo ? (
                                                                        <img src={c.photo} alt={c.name} className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        <Users size={20} />
                                                                    )}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <h4 className="text-sm font-bold text-slate-850 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">{c.name}</h4>
                                                                    <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-md inline-block mt-1 uppercase tracking-wider">{c.type}</p>
                                                                </div>
                                                            </div>

                                                            <div className="space-y-2 text-xs">
                                                                {c.phone && (
                                                                    <a 
                                                                        href={`tel:${c.phone}`} 
                                                                        onClick={(e) => e.stopPropagation()}
                                                                        className="flex items-center gap-2 text-slate-650 dark:text-slate-350 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                                                                    >
                                                                        <Phone size={12} className="text-slate-400" />
                                                                        <span>{c.phone}</span>
                                                                    </a>
                                                                )}
                                                                {c.address && (
                                                                    <div className="flex items-start gap-2 text-slate-650 dark:text-slate-350">
                                                                        <MapPin size={12} className="text-slate-400 shrink-0 mt-0.5" />
                                                                        <span className="line-clamp-2">{c.address}</span>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {c.note && (
                                                                <div className="mt-3 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-800/60 italic text-slate-600 dark:text-slate-400 text-xs">
                                                                    "{c.note}"
                                                                </div>
                                                            )}
                                                        </div>

                                                        {c.docs.length > 0 && (
                                                            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 border-dashed">
                                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">KYC Documents</p>
                                                                <div className="flex flex-wrap gap-1.5">
                                                                    {c.docs.map((doc, docIdx) => (
                                                                        <a
                                                                            key={docIdx}
                                                                            href={doc.file_path}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            onClick={(e) => e.stopPropagation()}
                                                                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-semibold bg-slate-50 dark:bg-slate-850 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 border border-slate-150 dark:border-slate-800 text-slate-600 dark:text-slate-300 transition-all shrink-0"
                                                                        >
                                                                            <Paperclip size={10} className="text-slate-450" />
                                                                            <span className="max-w-[100px] truncate">{doc.document_name.split(' - ').pop()}</span>
                                                                        </a>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ));
                                            })()}
                                            
                                            <div 
                                                onClick={() => setShowSetupModal(true)}
                                                className="border-2 border-slate-200 dark:border-slate-800 border-dashed rounded-3xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-850/40 hover:border-indigo-400 dark:hover:border-indigo-900/40 transition-all min-h-[140px] group"
                                            >
                                                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-2 text-slate-400 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/30 group-hover:text-indigo-500 transition-colors">
                                                    <Plus size={18} />
                                                </div>
                                                <p className="text-sm font-semibold text-slate-700 dark:text-slate-355">Add / Modify KYCs</p>
                                                <p className="text-[11px] text-slate-400 mt-0.5">Attach identity documents for contractors.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'planning' && (
                            <div className="space-y-6">
                                {/* Sub-Tabs Navigation */}
                                <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-xl w-full sm:w-max">
                                    {['overview', 'work info', 'tasks', 'events', 'notices'].map(sub => (
                                        <button
                                            key={sub}
                                            onClick={() => setActivePlanningTab(sub)}
                                            className={cn(
                                                'px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all flex-1 sm:flex-none text-center',
                                                activePlanningTab === sub
                                                    ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm'
                                                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                            )}
                                        >
                                            {sub}
                                        </button>
                                    ))}
                                </div>

                                {/* Tab Contents */}
                                {activePlanningTab === 'overview' && (
                                    <div className="space-y-6 animate-fade-in">
                                        {/* Premium Technical Work Specifications Section */}
                                        {project.work_type && (
                                            <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl border border-white/60 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-2xl rounded-[2rem] p-7">
                                                <div className="flex justify-between items-center pb-5 mb-5 border-b border-slate-200/60 dark:border-slate-700/60">
                                                    <div>
                                                        <h4 className="text-[10px] font-black text-amber-500 tracking-widest uppercase mb-1">Specifications</h4>
                                                        <h3 className="text-lg font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
                                                            Technical Work Information
                                                        </h3>
                                                    </div>
                                                    <span className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-black uppercase tracking-wider">
                                                        {project.work_type}
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                    {/* Section 1: Type Specifics */}
                                                    <div className="bg-slate-50/50 dark:bg-slate-800/20 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 space-y-3">
                                                        <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Structure Specifications</h5>
                                                        {project.work_type === 'RCC' && (
                                                            <div className="space-y-2">
                                                                <div className="flex justify-between text-xs">
                                                                    <span className="text-slate-500">Foundation:</span>
                                                                    <span className="font-extrabold text-slate-800 dark:text-slate-200">{project.rcc_foundation || '—'}</span>
                                                                </div>
                                                                <div className="flex justify-between text-xs">
                                                                    <span className="text-slate-500">Class Type:</span>
                                                                    <span className="font-extrabold text-slate-800 dark:text-slate-200">{project.rcc_class || '—'}</span>
                                                                </div>
                                                                <div className="flex justify-between text-xs">
                                                                    <span className="text-slate-500">Finishing:</span>
                                                                    <span className="font-extrabold text-slate-800 dark:text-slate-200">
                                                                        {project.rcc_finishing === '1' || project.rcc_finishing === true || project.rcc_finishing === 'true' ? 'Full Finishing' : 'Structure Only'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        )}
                                                        {project.work_type === 'ASSAM TYPE' && (
                                                            <div className="space-y-2">
                                                                <div className="flex justify-between text-xs">
                                                                    <span className="text-slate-500">Roof Type:</span>
                                                                    <span className="font-extrabold text-slate-800 dark:text-slate-200">{project.assam_type_details?.roof_type || '—'}</span>
                                                                </div>
                                                                <div className="flex justify-between text-xs">
                                                                    <span className="text-slate-500">Wood Quality:</span>
                                                                    <span className="font-extrabold text-slate-800 dark:text-slate-200">{project.assam_type_details?.wood_quality || '—'}</span>
                                                                </div>
                                                                <div className="flex justify-between text-xs">
                                                                    <span className="text-slate-500">No. of Rooms:</span>
                                                                    <span className="font-extrabold text-slate-800 dark:text-slate-200">{project.assam_type_details?.rooms || '—'}</span>
                                                                </div>
                                                            </div>
                                                        )}
                                                        {!['RCC', 'ASSAM TYPE'].includes(project.work_type) && (
                                                            <div className="space-y-2">
                                                                <span className="text-xs text-slate-600 dark:text-slate-400 block font-medium leading-relaxed italic">
                                                                    {project.assam_type_details?.other_scope || 'No specific details provided.'}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Section 2: Area & Headroom */}
                                                    <div className="bg-slate-50/50 dark:bg-slate-800/20 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 space-y-3">
                                                        <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Area & Dimensions</h5>
                                                        <div className="space-y-2">
                                                            <div className="flex justify-between text-xs">
                                                                <span className="text-slate-500">Plinth Area:</span>
                                                                <span className="font-extrabold text-slate-800 dark:text-slate-200">{project.plinth_area || '—'}</span>
                                                            </div>
                                                            <div className="flex justify-between text-xs">
                                                                <span className="text-slate-500">Slab Area:</span>
                                                                <span className="font-extrabold text-slate-800 dark:text-slate-200">{project.slab_area || '—'}</span>
                                                            </div>
                                                            <div className="flex justify-between text-xs">
                                                                <span className="text-slate-500">Head-room:</span>
                                                                <span className={cn(
                                                                    "px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider",
                                                                    project.head_room ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                                                                )}>
                                                                    {project.head_room ? 'Available' : 'N/A'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Section 3: Logistics & Road */}
                                                    <div className="bg-slate-50/50 dark:bg-slate-800/20 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 space-y-3">
                                                        <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Site Logistics</h5>
                                                        <div className="space-y-2">
                                                            <div className="flex justify-between text-xs">
                                                                <span className="text-slate-500">Road Size:</span>
                                                                <span className="font-extrabold text-slate-800 dark:text-slate-200">{project.road_size || '—'}</span>
                                                            </div>
                                                            <div className="flex justify-between text-xs">
                                                                <span className="text-slate-500">Road Direction:</span>
                                                                <span className="font-extrabold text-slate-800 dark:text-slate-200">{project.road_direction || '—'}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {(project.remarks || project.other_info) && (
                                                    <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/60 grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        {project.remarks && (
                                                            <div>
                                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Remarks & Notations</span>
                                                                <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold">{project.remarks}</p>
                                                            </div>
                                                        )}
                                                        {project.other_info && (
                                                            <div>
                                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Other Supplementary Info</span>
                                                                <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold">{project.other_info}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Premium Metric Summaries Row */}
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            {/* Tasks Overview Stats */}
                                            <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-500/20 dark:to-transparent rounded-2xl p-4 border border-amber-500/20 dark:border-amber-500/10 flex items-center justify-between group hover:shadow-md transition-all duration-300">
                                                <div className="space-y-1">
                                                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest">Tasks Status</span>
                                                    <h4 className="text-xl font-extrabold text-slate-805 dark:text-white">
                                                        {project.tasks ? project.tasks.filter(t => t.status !== 'done').length : 0} <span className="text-xs font-semibold text-slate-500">Pending</span>
                                                    </h4>
                                                </div>
                                                <div className="p-3 bg-amber-500/20 dark:bg-amber-500/30 rounded-xl text-amber-600 dark:text-amber-400 transition-transform duration-300 group-hover:scale-110">
                                                    <CheckCircle2 size={20} />
                                                </div>
                                            </div>

                                            {/* Events Overview Stats */}
                                            <div className="bg-gradient-to-br from-indigo-500/10 via-indigo-500/5 to-transparent dark:from-indigo-500/20 dark:to-transparent rounded-2xl p-4 border border-indigo-500/20 dark:border-indigo-500/10 flex items-center justify-between group hover:shadow-md transition-all duration-300">
                                                <div className="space-y-1">
                                                    <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Events Scheduled</span>
                                                    <h4 className="text-xl font-extrabold text-slate-805 dark:text-white">
                                                        {project.events ? project.events.length : 0} <span className="text-xs font-semibold text-slate-500">Upcoming</span>
                                                    </h4>
                                                </div>
                                                <div className="p-3 bg-indigo-500/20 dark:bg-indigo-500/30 rounded-xl text-indigo-600 dark:text-indigo-400 transition-transform duration-300 group-hover:scale-110">
                                                    <CalendarDays size={20} />
                                                </div>
                                            </div>

                                            {/* Notices Overview Stats */}
                                            <div className="bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-transparent dark:from-rose-500/20 dark:to-transparent rounded-2xl p-4 border border-rose-500/20 dark:border-rose-500/10 flex items-center justify-between group hover:shadow-md transition-all duration-305">
                                                <div className="space-y-1">
                                                    <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-widest">Client Notices</span>
                                                    <h4 className="text-xl font-extrabold text-slate-805 dark:text-white">
                                                        1 <span className="text-xs font-semibold text-slate-500">Active</span>
                                                    </h4>
                                                </div>
                                                <div className="p-3 bg-rose-500/20 dark:bg-rose-500/30 rounded-xl text-rose-600 dark:text-rose-400 transition-transform duration-300 group-hover:scale-110">
                                                    <AlertTriangle size={20} />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Ultra-Premium Dashboard Cards Grid */}
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                            {/* 1. Pending Tasks (Glassmorphism & Ring Progress) */}
                                            <div className="relative bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl border border-white/60 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-2xl rounded-[2rem] p-7">
                                                <div className="absolute top-0 right-0 -mr-8 -mt-8 w-48 h-48 bg-amber-400/10 dark:bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>
                                                
                                                <div className="flex justify-between items-end pb-5 mb-5 border-b border-slate-200/60 dark:border-slate-700/60 relative z-10">
                                                    <div>
                                                        <h4 className="text-[10px] font-black text-amber-500 tracking-widest uppercase mb-1">Execution</h4>
                                                        <h3 className="text-lg font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
                                                            Pending Tasks <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
                                                        </h3>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowAddTaskModal(true)}
                                                        className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-amber-600 flex items-center justify-center hover:bg-amber-500 hover:text-white transition-all shadow-sm"
                                                    >
                                                        <Plus size={14} strokeWidth={3} />
                                                    </button>
                                                </div>

                                                <div className="relative z-10 space-y-3">
                                                    {project.tasks && project.tasks.filter(t => t.status !== 'done').length > 0 ? (
                                                        project.tasks.filter(t => t.status !== 'done').slice(0, 3).map((task) => (
                                                            <div
                                                                key={task.id}
                                                                onClick={() => setSelectedTask(task)}
                                                                className="group flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-slate-800/80 hover:bg-gradient-to-r hover:from-amber-50/50 hover:to-transparent dark:hover:from-amber-900/20 shadow-sm border border-slate-100 dark:border-slate-700/50 cursor-pointer transition-all hover:scale-[1.015]"
                                                            >
                                                                <div className="flex items-center gap-4">
                                                                    {/* Custom Circular Checkbox styling */}
                                                                    <div className="w-5 h-5 rounded-full border-2 border-slate-200 dark:border-slate-600 group-hover:border-amber-400 group-hover:bg-amber-400/10 transition-colors flex items-center justify-center">
                                                                        <CheckCircle2 size={10} className="text-transparent group-hover:text-amber-500 transition-colors" />
                                                                    </div>
                                                                    <div>
                                                                        <h5 className="text-sm font-bold text-slate-800 dark:text-slate-200 line-clamp-1 group-hover:text-amber-600 transition-colors">
                                                                            {task.title}
                                                                        </h5>
                                                                        <div className="flex items-center gap-2 mt-1">
                                                                            <span className={cn(
                                                                                "text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full",
                                                                                task.priority === 'critical' ? 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400' :
                                                                                task.priority === 'high' ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400' :
                                                                                'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                                                                            )}>
                                                                                {task.priority}
                                                                            </span>
                                                                            <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                                                                                <Clock size={10} /> {task.status}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center border-2 border-white dark:border-slate-800 group-hover:border-amber-200 transition-colors shadow-sm shrink-0">
                                                                    <Users size={12} className="text-slate-500 dark:text-slate-300" />
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="py-10 flex flex-col items-center justify-center text-slate-400">
                                                            <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-3">
                                                                <Check size={20} className="text-slate-300" />
                                                            </div>
                                                            <p className="text-xs font-semibold italic">Zero pending tasks. Great job!</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* 2. Timeline & Events (Modern Vertical Tracker) */}
                                            <div className="relative bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl border border-white/60 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-2xl rounded-[2rem] p-7">
                                                <div className="absolute top-0 right-0 -mr-8 -mt-8 w-48 h-48 bg-indigo-400/10 dark:bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>

                                                <div className="flex justify-between items-end pb-5 mb-5 border-b border-slate-200/60 dark:border-slate-700/60 relative z-10">
                                                    <div>
                                                        <h4 className="text-[10px] font-black text-indigo-500 tracking-widest uppercase mb-1">Schedule</h4>
                                                        <h3 className="text-lg font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
                                                            Timeline & Events
                                                        </h3>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setEventForm({ title: '', description: '', event_date: new Date().toISOString().split('T')[0], event_time: '10:00' });
                                                            setShowAddEventModal(true);
                                                        }}
                                                        className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-indigo-600 flex items-center justify-center hover:bg-indigo-500 hover:text-white transition-all shadow-sm"
                                                    >
                                                        <Plus size={14} strokeWidth={3} />
                                                    </button>
                                                </div>

                                                <div className="relative z-10 pl-2 mt-2">
                                                    {project.events && project.events.length > 0 ? (
                                                        <div className="space-y-6 relative border-l-2 border-indigo-100 dark:border-indigo-500/20 ml-2">
                                                            {project.events.slice(0, 3).map(ev => {
                                                                const evTime = ev.event_time || (ev.event_date ? new Date(ev.event_date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '');
                                                                const evDateObj = ev.event_date ? new Date(ev.event_date) : null;
                                                                const evDay = evDateObj ? evDateObj.getDate() : '';
                                                                const evMonth = evDateObj ? evDateObj.toLocaleDateString('en-IN', { month: 'short' }) : '';
                                                                return (
                                                                    <div key={ev.id} className="relative pl-6 group/ev">
                                                                        {/* Timeline Dot */}
                                                                        <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-white dark:bg-slate-900 border-2 border-indigo-500 group-hover/ev:scale-150 group-hover/ev:bg-indigo-500 transition-all shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
                                                                        
                                                                        <div className="bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 p-3 rounded-2xl flex items-center gap-4 hover:shadow-md transition-shadow group-hover/ev:-translate-y-0.5">
                                                                            <div className="bg-indigo-50 dark:bg-indigo-500/10 w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-500/20 group-hover/ev:bg-indigo-500 transition-colors">
                                                                                <span className="text-[9px] uppercase font-black text-indigo-500 group-hover/ev:text-indigo-100 tracking-wider leading-none">{evMonth}</span>
                                                                                <span className="text-lg font-black text-indigo-700 dark:text-indigo-300 group-hover/ev:text-white mt-0.5 leading-none">{evDay}</span>
                                                                            </div>
                                                                            <div className="flex-1 min-w-0">
                                                                                <h5 className="text-sm font-bold text-slate-800 dark:text-slate-200 line-clamp-1 group-hover/ev:text-indigo-600 dark:group-hover/ev:text-indigo-400 transition-colors">
                                                                                    {ev.title}
                                                                                </h5>
                                                                                {evTime && (
                                                                                    <p className="text-[10px] text-slate-500 font-medium flex items-center gap-1.5 mt-1">
                                                                                        <Clock size={10} className="text-indigo-400" /> {evTime}
                                                                                    </p>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    ) : (
                                                        <div className="py-10 flex flex-col items-center justify-center text-slate-400">
                                                            <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-3">
                                                                <CalendarDays size={20} className="text-slate-300" />
                                                            </div>
                                                            <p className="text-xs font-semibold italic">No events mapped yet.</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* 3. High-Visibility Client Notices Banner (Bottom) */}
                                        <div className="relative rounded-[2.5rem] p-[1.5px] overflow-hidden bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 shadow-xl shadow-rose-500/20 group">
                                            {/* Inner Card content with deep dark background contrasting the colorful border */}
                                            <div className="relative bg-slate-900 dark:bg-slate-950 rounded-[calc(2.5rem-1.5px)] p-6 md:p-8 overflow-hidden h-full flex flex-col md:flex-row gap-8 items-center">
                                                
                                                {/* Ambient Glowing Orbs inside the card */}
                                                <div className="absolute top-0 left-1/4 w-64 h-64 bg-rose-500/20 blur-[80px] rounded-full pointer-events-none"></div>
                                                <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-500/20 blur-[80px] rounded-full pointer-events-none"></div>

                                                {/* Left Section: Banner Title & Action */}
                                                <div className="w-full md:w-1/3 relative z-10 flex flex-col justify-center items-center md:items-start text-center md:text-left space-y-4">
                                                    <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-rose-400 shadow-lg mb-2">
                                                        <AlertTriangle size={24} strokeWidth={2.5} />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-2xl font-black text-white tracking-tight">Client Notices</h3>
                                                        <p className="text-xs text-rose-200/70 mt-1 font-medium">Critical project broadcasts & alerts</p>
                                                    </div>
                                                    <button 
                                                        onClick={() => setShowNoticeModal(true)}
                                                        className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/10 hover:border-white/30 shadow-lg flex items-center gap-2"
                                                    >
                                                        <Send size={12} /> Dispatch Notice
                                                    </button>
                                                </div>

                                                {/* Right Section: The Notice Items */}
                                                <div className="w-full md:w-2/3 relative z-10 max-h-[300px] overflow-y-auto pr-2">
                                                    {project.notices && project.notices.length > 0 ? (
                                                        <div className="space-y-4">
                                                            {project.notices.map(notice => (
                                                                <div key={notice.id} className="bg-white/5 backdrop-blur-xl border border-white/10 p-5 md:p-6 rounded-3xl hover:bg-white/10 transition-colors shadow-2xl relative">
                                                                    <div className="flex justify-between items-start gap-4 mb-4">
                                                                        <div>
                                                                            <h5 className="text-base font-extrabold text-white">{notice.title}</h5>
                                                                            <div className="flex gap-1 mt-1.5 flex-wrap">
                                                                                {(notice.methods || []).map(m => (
                                                                                    <span key={m} className="px-1.5 py-0.5 rounded text-[8px] uppercase font-black bg-white/10 text-slate-300 tracking-wider">
                                                                                        {m}
                                                                                    </span>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex flex-col items-end gap-2 shrink-0">
                                                                            <span className="px-3 py-1 bg-rose-500 text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-[0_0_15px_rgba(244,63,94,0.5)]">
                                                                                Sent ({notice.sent_count || 1})
                                                                            </span>
                                                                            <button 
                                                                                onClick={() => resendNotice(notice)}
                                                                                disabled={resendingNoticeId === notice.id}
                                                                                className="text-[10px] text-rose-300 hover:text-rose-100 font-bold flex items-center gap-1 transition-colors"
                                                                            >
                                                                                {resendingNoticeId === notice.id ? 'Sending...' : 'Resend'}
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                    <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', borderWidth: '0.5px' }} />
                                                                    <p className="text-sm text-slate-300 mt-4 leading-relaxed font-medium">
                                                                        {notice.content}
                                                                    </p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-5 md:p-6 rounded-3xl text-center flex flex-col items-center justify-center">
                                                            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-3">
                                                                <Check size={20} className="text-slate-300" />
                                                            </div>
                                                            <p className="text-slate-300 text-sm font-medium">No client notices dispatched yet.</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activePlanningTab === 'work info' && (
                                    <div className="space-y-6 animate-fade-in">
                                        {/* Premium Technical Work Specifications Section */}
                                        {project.work_type ? (
                                            <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl border border-white/60 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-2xl rounded-[2rem] p-7">
                                                <div className="flex justify-between items-center pb-5 mb-5 border-b border-slate-200/60 dark:border-slate-700/60">
                                                    <div>
                                                        <h4 className="text-[10px] font-black text-amber-500 tracking-widest uppercase mb-1">Specifications</h4>
                                                        <h3 className="text-lg font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
                                                            Technical Work Information
                                                        </h3>
                                                    </div>
                                                    <span className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-black uppercase tracking-wider">
                                                        {project.work_type}
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                    {/* Section 1: Type Specifics */}
                                                    <div className="bg-slate-50/50 dark:bg-slate-800/20 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 space-y-3">
                                                        <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Structure Specifications</h5>
                                                        {project.work_type === 'RCC' && (
                                                            <div className="space-y-2">
                                                                <div className="flex justify-between text-xs">
                                                                    <span className="text-slate-500">Foundation:</span>
                                                                    <span className="font-extrabold text-slate-800 dark:text-slate-200">{project.rcc_foundation || '—'}</span>
                                                                </div>
                                                                <div className="flex justify-between text-xs">
                                                                    <span className="text-slate-500">Class Type:</span>
                                                                    <span className="font-extrabold text-slate-800 dark:text-slate-200">{project.rcc_class || '—'}</span>
                                                                </div>
                                                                <div className="flex justify-between text-xs">
                                                                    <span className="text-slate-500">Finishing:</span>
                                                                    <span className="font-extrabold text-slate-800 dark:text-slate-200">
                                                                        {project.rcc_finishing === '1' || project.rcc_finishing === true || project.rcc_finishing === 'true' ? 'Full Finishing' : 'Structure Only'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        )}
                                                        {project.work_type === 'ASSAM TYPE' && (
                                                            <div className="space-y-2">
                                                                <div className="flex justify-between text-xs">
                                                                    <span className="text-slate-500">Roof Type:</span>
                                                                    <span className="font-extrabold text-slate-800 dark:text-slate-200">{project.assam_type_details?.roof_type || '—'}</span>
                                                                </div>
                                                                <div className="flex justify-between text-xs">
                                                                    <span className="text-slate-500">Wood Quality:</span>
                                                                    <span className="font-extrabold text-slate-800 dark:text-slate-200">{project.assam_type_details?.wood_quality || '—'}</span>
                                                                </div>
                                                                <div className="flex justify-between text-xs">
                                                                    <span className="text-slate-500">No. of Rooms:</span>
                                                                    <span className="font-extrabold text-slate-800 dark:text-slate-200">{project.assam_type_details?.rooms || '—'}</span>
                                                                </div>
                                                            </div>
                                                        )}
                                                        {!['RCC', 'ASSAM TYPE'].includes(project.work_type) && (
                                                            <div className="space-y-2">
                                                                <span className="text-xs text-slate-600 dark:text-slate-400 block font-medium leading-relaxed italic">
                                                                    {project.assam_type_details?.other_scope || 'No specific details provided.'}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Section 2: Area & Headroom */}
                                                    <div className="bg-slate-50/50 dark:bg-slate-800/20 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 space-y-3">
                                                        <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Area & Dimensions</h5>
                                                        <div className="space-y-2">
                                                            <div className="flex justify-between text-xs">
                                                                <span className="text-slate-500">Plinth Area:</span>
                                                                <span className="font-extrabold text-slate-800 dark:text-slate-200">{project.plinth_area || '—'}</span>
                                                            </div>
                                                            <div className="flex justify-between text-xs">
                                                                <span className="text-slate-500">Slab Area:</span>
                                                                <span className="font-extrabold text-slate-800 dark:text-slate-200">{project.slab_area || '—'}</span>
                                                            </div>
                                                            <div className="flex justify-between text-xs">
                                                                <span className="text-slate-500">Head-room:</span>
                                                                <span className={cn(
                                                                    "px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider",
                                                                    project.head_room ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                                                                )}>
                                                                    {project.head_room ? 'Available' : 'N/A'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Section 3: Logistics & Road */}
                                                    <div className="bg-slate-50/50 dark:bg-slate-800/20 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 space-y-3">
                                                        <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Site Logistics</h5>
                                                        <div className="space-y-2">
                                                            <div className="flex justify-between text-xs">
                                                                <span className="text-slate-500">Road Size:</span>
                                                                <span className="font-extrabold text-slate-800 dark:text-slate-200">{project.road_size || '—'}</span>
                                                            </div>
                                                            <div className="flex justify-between text-xs">
                                                                <span className="text-slate-500">Road Direction:</span>
                                                                <span className="font-extrabold text-slate-800 dark:text-slate-200">{project.road_direction || '—'}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {(project.remarks || project.other_info) && (
                                                    <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/60 grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        {project.remarks && (
                                                            <div>
                                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Remarks & Notations</span>
                                                                <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold">{project.remarks}</p>
                                                            </div>
                                                        )}
                                                        {project.other_info && (
                                                            <div>
                                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Other Supplementary Info</span>
                                                                <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold">{project.other_info}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl border border-white/60 dark:border-white/5 shadow-md rounded-[2rem] p-10 text-center flex flex-col items-center justify-center">
                                                <div className="w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-950/20 text-amber-500 flex items-center justify-center mb-4">
                                                    <AlertTriangle size={28} />
                                                </div>
                                                <h4 className="text-lg font-extrabold text-slate-800 dark:text-white mb-2">No Technical Specs Mapped</h4>
                                                <p className="text-xs text-slate-500 max-w-sm mb-6">Technical work specs are not set up for this project yet. Please run project setup to establish specifications.</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activePlanningTab === 'tasks' && (
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Tasks</h3>
                                            <button
                                                type="button"
                                                onClick={() => setShowAddTaskModal(true)}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-600 hover:bg-amber-50"
                                            >
                                                <Plus size={14} /> Add Task
                                            </button>
                                        </div>
                                        {project.tasks && project.tasks.length > 0 ? (
                                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                                {project.tasks.map((task, i) => (
                                                    <div
                                                        key={task.id}
                                                        onClick={() => setSelectedTask(task)}
                                                        className="py-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/30 cursor-pointer rounded-xl px-2 transition-colors"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-xs text-slate-400 w-4">{i + 1}.</span>
                                                            <div>
                                                                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 hover:text-amber-600">{task.title}</p>
                                                                {task.description && <p className="text-xs text-slate-400 truncate max-w-xs">{task.description}</p>}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider',
                                                                task.status === 'done'        ? 'bg-green-100 text-green-700' :
                                                                task.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                                                                                                'bg-slate-100 text-slate-700'
                                                            )}>
                                                                {task.status}
                                                            </span>
                                                            {task.assignee && (
                                                                <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                                                                    {task.assignee.name}
                                                                </span>
                                                            )}
                                                            <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium capitalize',
                                                                task.priority === 'critical' ? 'bg-red-100 text-red-700' :
                                                                task.priority === 'high'     ? 'bg-amber-100 text-amber-700' :
                                                                task.priority === 'medium'   ? 'bg-blue-100 text-blue-700' :
                                                                                            'bg-green-100 text-green-700'
                                                            )}>
                                                                {task.priority}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-slate-400 italic">No tasks planned for this project.</p>
                                        )}
                                    </div>
                                )}

                                {activePlanningTab === 'events' && (() => {
                                    const year = calendarMonth.getFullYear();
                                    const month = calendarMonth.getMonth();

                                    // Days in current month
                                    const daysInMonth = new Date(year, month + 1, 0).getDate();
                                    // Day of the week of first day (0-6)
                                    const firstDayIndex = new Date(year, month, 1).getDay();

                                    const calendarDays = [];
                                    for (let i = 0; i < firstDayIndex; i++) {
                                        calendarDays.push(null);
                                    }
                                    for (let d = 1; d <= daysInMonth; d++) {
                                        calendarDays.push(new Date(year, month, d));
                                    }

                                    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                                    const monthTitle = `${monthNames[month]} ${year}`;

                                    const getEventsForDate = (date) => {
                                        if (!date || !project.events) return [];
                                        const yearStr = date.getFullYear();
                                        const monthStr = (date.getMonth() + 1).toString().padStart(2, '0');
                                        const dayStr = date.getDate().toString().padStart(2, '0');
                                        const dateStr = `${yearStr}-${monthStr}-${dayStr}`;
                                        return project.events.filter(e => {
                                            if (!e.event_date) return false;
                                            return e.event_date.startsWith(dateStr);
                                        });
                                    };

                                    const activeDayEvents = selectedCalendarDate ? getEventsForDate(selectedCalendarDate) : [];

                                    return (
                                        <div className="space-y-6 animate-fade-in">
                                            {/* Calendar Header Card */}
                                            <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl border border-slate-800">
                                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                                    <div>
                                                        <h3 className="text-xl font-bold tracking-tight">{monthTitle}</h3>
                                                        <p className="text-slate-400 text-xs mt-0.5 font-medium">Manage and track critical dates for {project.title}</p>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex bg-slate-800 p-1 rounded-xl">
                                                            <button
                                                                type="button"
                                                                onClick={() => setCalendarMonth(new Date(year, month - 1, 1))}
                                                                className="p-2 hover:bg-slate-705 rounded-lg text-slate-300 transition-colors"
                                                            >
                                                                <ChevronLeft size={16} />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => setCalendarMonth(new Date())}
                                                                className="px-3 py-1 hover:bg-slate-700 rounded-lg text-xs font-semibold text-slate-300 transition-colors"
                                                            >
                                                                Today
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => setCalendarMonth(new Date(year, month + 1, 1))}
                                                                className="p-2 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors"
                                                            >
                                                                <ChevronRight size={16} />
                                                            </button>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const yr = selectedCalendarDate.getFullYear();
                                                                const mn = (selectedCalendarDate.getMonth() + 1).toString().padStart(2, '0');
                                                                const dy = selectedCalendarDate.getDate().toString().padStart(2, '0');
                                                                setEventForm({
                                                                    title: '',
                                                                    description: '',
                                                                    event_date: `${yr}-${mn}-${dy}`,
                                                                    event_time: '10:00'
                                                                });
                                                                setShowAddEventModal(true);
                                                            }}
                                                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs shadow-md transition-colors"
                                                        >
                                                            <Plus size={14} /> Add Event
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Calendar Grid Container */}
                                                <div className="mt-6 border border-slate-800 rounded-2xl overflow-hidden bg-slate-950">
                                                    {/* Days of Week Header */}
                                                    <div className="grid grid-cols-7 border-b border-slate-800 text-center py-2 bg-slate-900/50 text-[10px] uppercase font-bold tracking-wider text-slate-400">
                                                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                                                            <div key={d}>{d}</div>
                                                        ))}
                                                    </div>

                                                    {/* Day Cells Grid */}
                                                    <div className="grid grid-cols-7 bg-slate-950 divide-x divide-y divide-slate-800 border-l border-t border-slate-800">
                                                        {calendarDays.map((date, idx) => {
                                                            if (!date) {
                                                                return <div key={`empty-${idx}`} className="aspect-square bg-slate-900/10" />;
                                                            }

                                                            const dayEvents = getEventsForDate(date);
                                                            const isSelected = selectedCalendarDate && date.toDateString() === selectedCalendarDate.toDateString();
                                                            const isToday = date.toDateString() === new Date().toDateString();

                                                            return (
                                                                <button
                                                                    key={`day-${date.getTime()}`}
                                                                    type="button"
                                                                    onClick={() => setSelectedCalendarDate(date)}
                                                                    className={cn(
                                                                        "aspect-square p-2 text-left relative flex flex-col justify-between hover:bg-slate-900/50 transition-colors group outline-none",
                                                                        isSelected ? "bg-amber-500/10 ring-1 ring-amber-500" : ""
                                                                    )}
                                                                >
                                                                    <span className={cn(
                                                                        "text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center transition-colors",
                                                                        isToday ? "bg-amber-500 text-slate-950 shadow-md" : "text-slate-300 group-hover:text-white",
                                                                        isSelected && !isToday ? "text-amber-400" : ""
                                                                    )}>
                                                                        {date.getDate()}
                                                                    </span>

                                                                    {/* Event Indicator Pills */}
                                                                    <div className="space-y-1 w-full max-h-12 overflow-hidden mt-1 pointer-events-none">
                                                                        {dayEvents.slice(0, 2).map(ev => (
                                                                            <div
                                                                                key={ev.id}
                                                                                className="text-[8px] font-semibold bg-indigo-500/20 text-indigo-350 border border-indigo-500/30 px-1 py-0.5 rounded truncate max-w-full"
                                                                            >
                                                                                {ev.title}
                                                                            </div>
                                                                        ))}
                                                                        {dayEvents.length > 2 && (
                                                                            <div className="text-[7px] font-bold text-slate-400 text-right">
                                                                                +{dayEvents.length - 2} more
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Event Details Section for Selected Day */}
                                            <div className="bg-slate-50 dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                                                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-850 pb-4 mb-4">
                                                    <div>
                                                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                                            <CalendarDays size={16} className="text-amber-500" />
                                                            Events for {selectedCalendarDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                                        </h4>
                                                        <p className="text-xs text-slate-400 mt-0.5">{activeDayEvents.length} event(s) scheduled</p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const yr = selectedCalendarDate.getFullYear();
                                                            const mn = (selectedCalendarDate.getMonth() + 1).toString().padStart(2, '0');
                                                            const dy = selectedCalendarDate.getDate().toString().padStart(2, '0');
                                                            setEventForm({
                                                                title: '',
                                                                description: '',
                                                                event_date: `${yr}-${mn}-${dy}`,
                                                                event_time: '10:00'
                                                            });
                                                            setShowAddEventModal(true);
                                                        }}
                                                        className="text-amber-600 hover:text-amber-700 font-semibold text-xs flex items-center gap-1"
                                                    >
                                                        <Plus size={14} /> Add Event
                                                    </button>
                                                </div>

                                                {activeDayEvents.length > 0 ? (
                                                    <div className="space-y-4">
                                                        {activeDayEvents.map(ev => {
                                                            const timeFormatted = ev.event_date
                                                                ? new Date(ev.event_date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                                                                : '10:00 AM';
                                                            return (
                                                                <div
                                                                    key={ev.id}
                                                                    className="p-4 bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-start gap-4 hover:shadow-md transition-all"
                                                                >
                                                                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-650 flex items-center justify-center shrink-0">
                                                                        <Calendar size={18} />
                                                                    </div>
                                                                    <div className="min-w-0 flex-1">
                                                                        <div className="flex items-center justify-between gap-4">
                                                                            <h5 className="text-sm font-bold text-slate-900 dark:text-slate-100">{ev.title}</h5>
                                                                            <span className="text-[10px] font-bold text-slate-405 shrink-0 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                                                <Clock size={10} /> {timeFormatted}
                                                                            </span>
                                                                        </div>
                                                                        {ev.description ? (
                                                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{ev.description}</p>
                                                                        ) : (
                                                                            <p className="text-xs text-slate-450 italic mt-1">No additional details provided.</p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                ) : (
                                                    <div className="py-8 text-center bg-white dark:bg-slate-850 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                                                        <CalendarDays size={28} className="text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                                                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">No events scheduled for this day</p>
                                                        <p className="text-xs text-slate-400 mt-1">Stay synchronized by planning site visits or customer check-ins.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })()}

                                {activePlanningTab === 'notices' && (
                                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm animate-fade-in">
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                                <AlertTriangle size={16} className="text-rose-500" /> Client Notices
                                            </h4>
                                            <button className="text-rose-600 hover:text-rose-700 font-semibold text-xs">+ Send Notice</button>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="p-3 bg-rose-50 dark:bg-rose-500/10 rounded-xl border border-rose-100 dark:border-rose-500/20">
                                                <div className="flex justify-between items-start mb-1">
                                                    <h5 className="text-xs font-bold text-rose-700 dark:text-rose-400">Payment Delay Warning</h5>
                                                    <span className="text-[9px] uppercase font-bold text-rose-500 bg-rose-100 px-1 rounded">Sent</span>
                                                </div>
                                                <p className="text-[10px] text-rose-600">Regarding 2nd installment</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'documents' && (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Uploaded Documents</h3>
                                    <button
                                        type="button"
                                        onClick={() => setShowUploadDocModal(true)}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-600 hover:bg-amber-50"
                                    >
                                        <Plus size={14} /> Upload Doc
                                    </button>
                                </div>
                                {project.documents && project.documents.length > 0 ? (
                                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {project.documents.map((doc) => (
                                            <div key={doc.id} className="py-3 flex items-center justify-between hover:bg-slate-50/50 rounded-xl px-2">
                                                <div className="flex items-center gap-3">
                                                    <FileText size={16} className="text-slate-400" />
                                                    <div>
                                                        <a
                                                            href={doc.file_path}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-sm font-semibold text-slate-900 dark:text-slate-100 hover:underline hover:text-amber-600"
                                                        >
                                                            {doc.document_name}
                                                        </a>
                                                        {doc.description && <p className="text-xs text-slate-400 mt-0.5">{doc.description}</p>}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xs text-slate-400">{(doc.file_size / 1024).toFixed(1)} KB</span>
                                                    
                                                    {/* Audited Delete Document Button */}
                                                    <button
                                                        type="button"
                                                        onClick={() => triggerDeleteRequest('document', doc.id, doc.document_name)}
                                                        className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-slate-100"
                                                        title="Request Document Deletion"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-slate-400 italic">No documents uploaded.</p>
                                )}
                            </div>
                        )}

                        {activeTab === 'team' && (
                            <div className="space-y-4">
                                {/* Team Tab Header */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div>
                                        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Team Members</h3>
                                        <p className="text-xs text-slate-400 mt-0.5">{project.team?.length || 0} member{project.team?.length !== 1 ? 's' : ''} assigned</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                            <input
                                                type="text"
                                                placeholder="Search members..."
                                                value={projectTeamSearch}
                                                onChange={e => setProjectTeamSearch(e.target.value)}
                                                className="w-full sm:w-48 pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setShowAddMemberPopup(true)}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-amber-500 hover:bg-amber-600 transition-colors shadow-sm whitespace-nowrap"
                                        >
                                            <UserPlus size={13} /> Add Member
                                        </button>
                                    </div>
                                </div>

                                {/* Team Member Cards */}
                                {project.team && project.team.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                        {project.team.filter(m => (m.name || '').toLowerCase().includes(projectTeamSearch.toLowerCase()) || (m.role || '').toLowerCase().includes(projectTeamSearch.toLowerCase())).map((member) => (
                                            <div key={member.id} className="flex items-center gap-3.5 p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 group hover:border-amber-500/30 hover:bg-slate-100/50 dark:hover:bg-slate-800/40 transition-all shadow-sm">
                                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-black shrink-0 overflow-hidden border border-slate-100 dark:border-slate-700 shadow-sm">
                                                    {member.photo_path ? (
                                                        <img 
                                                            src={member.photo_path.startsWith('http') || member.photo_path.startsWith('/') ? member.photo_path : '/storage/' + member.photo_path} 
                                                            alt={member.name} 
                                                            className="w-full h-full object-cover" 
                                                        />
                                                    ) : (
                                                        member.name?.charAt(0).toUpperCase()
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate group-hover:text-amber-600 dark:group-hover:text-amber-500 transition-colors">{member.name}</p>
                                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium capitalize truncate mt-0.5">{member.role || member.email}</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveMember(member.id)}
                                                    disabled={removingMemberId === member.id}
                                                    className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all opacity-100 md:opacity-0 group-hover:opacity-100 shrink-0 border border-transparent hover:border-rose-100 dark:hover:border-rose-500/20"
                                                    title="Remove from project"
                                                >
                                                    {removingMemberId === member.id
                                                        ? <Loader2 size={14} className="animate-spin text-rose-500" />
                                                        : <UserMinus size={14} />}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-10 text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
                                        <Users size={32} className="mb-2 opacity-30" />
                                        <p className="text-sm">No team members assigned yet</p>
                                        <button type="button" onClick={() => setShowAddMemberPopup(true)} className="mt-3 text-xs text-amber-600 font-semibold hover:underline">
                                            + Add first member
                                        </button>
                                    </div>
                                )}

                                {/* Add Member Popup & 3-Step Wizard Drawer */}
                                {showAddMemberPopup && (
                                    <div className="fixed inset-0 z-[9999] flex items-center justify-end">
                                        {/* Backdrop */}
                                        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setShowAddMemberPopup(false)} />
                                        
                                        {/* Drawer Container */}
                                        <div className="relative w-full max-w-md h-full bg-white dark:bg-slate-900 shadow-2xl flex flex-col z-10 animate-slide-in-right">
                                            {/* Drawer Header */}
                                            <div className="p-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
                                                <div className="flex items-center justify-between mb-4">
                                                    <h4 className="font-extrabold text-slate-900 dark:text-white text-base tracking-tight">Add Team Member</h4>
                                                    <button type="button" onClick={() => setShowAddMemberPopup(false)} className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 flex items-center justify-center transition-colors">
                                                        <X size={18} />
                                                    </button>
                                                </div>

                                                {/* Tab Selector */}
                                                <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                                                    <button
                                                        type="button"
                                                        onClick={() => { setCreateMode(false); setCreateStep(1); }}
                                                        className={cn(
                                                            "flex-1 py-2 text-xs font-bold rounded-lg transition-all",
                                                            !createMode 
                                                                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                                                                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                                                        )}
                                                    >
                                                        Assign Existing
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setCreateMode(true)}
                                                        className={cn(
                                                            "flex-1 py-2 text-xs font-bold rounded-lg transition-all",
                                                            createMode 
                                                                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                                                                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                                                        )}
                                                    >
                                                        Create New Staff
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Drawer Body */}
                                            <div className="flex-1 overflow-y-auto min-h-0 p-5 space-y-4">
                                                {!createMode ? (
                                                    /* Tab 1: Assign Existing Staff */
                                                    <div className="space-y-4">
                                                        <div className="relative">
                                                            <input
                                                                type="text"
                                                                value={memberSearch}
                                                                onChange={e => setMemberSearch(e.target.value)}
                                                                placeholder="Search active staff members..."
                                                                className="w-full pl-4 pr-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/50 text-slate-800 dark:text-slate-200"
                                                                autoFocus
                                                            />
                                                        </div>
                                                        <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                                                            {loadingMembers ? (
                                                                <div className="flex justify-center py-8"><Loader2 className="animate-spin text-amber-500" size={24} /></div>
                                                            ) : (Array.isArray(allMembers) ? allMembers : [])
                                                                .filter(m =>
                                                                    !project.team?.find(t => t.id === m.id) &&
                                                                    (((m.name || '').toLowerCase().includes(memberSearch.toLowerCase())) ||
                                                                     ((m.role || '').toLowerCase().includes(memberSearch.toLowerCase())))
                                                                )
                                                                .map(m => (
                                                                    <button
                                                                        key={m.id}
                                                                        type="button"
                                                                        onClick={() => handleAddMember(m)}
                                                                        disabled={addingMember}
                                                                        className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-amber-50 dark:hover:bg-amber-500/5 border border-transparent hover:border-amber-200/50 transition-all text-left group bg-slate-50/50 dark:bg-slate-800/20"
                                                                    >
                                                                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden relative">
                                                                            <span className="absolute inset-0 flex items-center justify-center">
                                                                                {m.name?.charAt(0).toUpperCase()}
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
                                                                        <div className="flex-1 min-w-0">
                                                                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-amber-600 transition-colors">{m.name}</p>
                                                                            <p className="text-xs text-slate-400 truncate">{m.role}</p>
                                                                        </div>
                                                                        <Plus size={14} className="text-amber-500 group-hover:scale-110 transition-transform shrink-0" />
                                                                    </button>
                                                                ))
                                                            }
                                                            {!loadingMembers && (Array.isArray(allMembers) ? allMembers : []).filter(m => !project.team?.find(t => t.id === m.id)).length === 0 && (
                                                                <div className="text-center py-10 text-slate-400">
                                                                    <Users size={32} className="mx-auto mb-2 opacity-30" />
                                                                    <p className="text-xs">All active staff are already assigned to this project.</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    /* Tab 2: Create New Staff Wizard (3-Step Drawer Form) */
                                                    <form onSubmit={handleCreateMemberSubmit} className="space-y-4">
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
                                                                
                                                                {/* Photo Upload with Live Circular Preview */}
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
                                                                        onChange={e => { setCreateForm({ ...createForm, name: e.target.value }); setFormErrors(prev => ({...prev, name: null})); }}
                                                                        placeholder="e.g. Ramesh Sharma"
                                                                        className={cn("w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/50 text-slate-800 dark:text-slate-200", formErrors.name ? "border-red-500 bg-red-50 focus:ring-red-500/20" : "border-slate-200 dark:border-slate-700")}
                                                                    />
                                                                    {formErrors.name && (
                                                                        <p className="text-red-500 text-[10px] font-semibold mt-1">{Array.isArray(formErrors.name) ? formErrors.name[0] : formErrors.name}</p>
                                                                    )}
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
                                                                            onChange={e => { setCreateForm({ ...createForm, password: e.target.value }); setFormErrors(prev => ({...prev, password: null})); }}
                                                                            placeholder="Type password or tap generate"
                                                                            className={cn("flex-1 px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/50 text-slate-800 dark:text-slate-200 font-mono", formErrors.password ? "border-red-500 bg-red-50 focus:ring-red-500/20" : "border-slate-200 dark:border-slate-700")}
                                                                        />
                                                                        <button
                                                                            type="button"
                                                                            onClick={generateRandomPassword}
                                                                            className="px-3 py-2.5 text-xs font-semibold rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-100 border border-amber-200/50 flex items-center gap-1 transition-all"
                                                                        >
                                                                            ⚡ Generate
                                                                        </button>
                                                                    </div>
                                                                    {formErrors.password && (
                                                                        <p className="text-red-500 text-[10px] font-semibold mt-1">{Array.isArray(formErrors.password) ? formErrors.password[0] : formErrors.password}</p>
                                                                    )}
                                                                </div>

                                                                {/* Send Email Credentials Checkbox */}
                                                                <label className="flex items-start gap-2.5 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 cursor-pointer select-none group">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={createForm.send_email}
                                                                        onChange={e => setCreateForm({ ...createForm, send_email: e.target.checked })}
                                                                        className="mt-0.5 rounded border-slate-300 dark:border-slate-700 text-amber-500 focus:ring-amber-400/50"
                                                                    />
                                                                    <div>
                                                                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Email portal password to staff</p>
                                                                        <p className="text-[10px] text-slate-400 mt-0.5">Sends password & setup instructions automatically via smtp.</p>
                                                                    </div>
                                                                </label>
                                                            </div>
                                                        )}

                                                        {/* Drawer Footer controls */}
                                                        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between gap-3 shrink-0">
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    if (createStep > 1) setCreateStep(createStep - 1);
                                                                    else setCreateMode(false);
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
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Sidebar Stats (Right 1 col) ── */}
                <div className="space-y-6">
                    {/* Completion Chart Card */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Project Completion</h3>
                        <div className="relative pt-1">
                            <div className="flex mb-2 items-center justify-between">
                                <div>
                                    <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-amber-600 bg-amber-50">
                                        Overall progress
                                    </span>
                                </div>
                                <div className="text-right">
                                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                                        {project.completion_percentage || 0}%
                                    </span>
                                </div>
                            </div>
                            <div className="overflow-hidden h-2.5 text-xs flex rounded-full bg-slate-100 dark:bg-slate-800">
                                <div
                                    style={{ width: `${project.completion_percentage || 0}%` }}
                                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Active Planner Hub Card (Carousel/Slider of Tasks & Events) */}
                    <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 text-white rounded-3xl p-6 space-y-4 shadow-xl border border-slate-800 relative overflow-hidden group">
                        {/* Decorative Background Glows */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none transition-transform duration-500 group-hover:scale-110" />
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

                        <div className="flex items-center justify-between relative z-10">
                            <div>
                                <h3 className="text-xs font-extrabold text-indigo-400 uppercase tracking-widest">Active Planner</h3>
                                <p className="text-[10px] text-slate-400 font-medium">Real-time scheduling hub</p>
                            </div>
                            <div className="flex bg-slate-800/80 backdrop-blur-md p-1 rounded-xl text-[10px] font-bold border border-slate-700/50">
                                <button
                                    type="button"
                                    onClick={() => setActiveSidebarTab('tasks')}
                                    className={cn(
                                        "px-3.5 py-1.5 rounded-lg transition-all duration-300",
                                        activeSidebarTab === 'tasks'
                                            ? "bg-amber-500 text-slate-950 shadow-md font-extrabold scale-105"
                                            : "text-slate-400 hover:text-white"
                                    )}
                                >
                                    Tasks
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveSidebarTab('events')}
                                    className={cn(
                                        "px-3.5 py-1.5 rounded-lg transition-all duration-300",
                                        activeSidebarTab === 'events'
                                            ? "bg-indigo-500 text-white shadow-md font-extrabold scale-105"
                                            : "text-slate-400 hover:text-white"
                                    )}
                                >
                                    Events
                                </button>
                            </div>
                        </div>

                        {/* Slider Contents */}
                        {activeSidebarTab === 'tasks' ? (() => {
                            const activeTasks = project.tasks ? project.tasks.filter(t => t.status !== 'done') : [];
                            if (activeTasks.length === 0) {
                                return (
                                    <div className="text-center py-8 border border-dashed border-slate-800 rounded-2xl bg-slate-950/40 relative z-10 flex flex-col justify-center items-center">
                                        <CheckCircle2 size={32} className="text-emerald-500 mb-2 animate-bounce" />
                                        <p className="text-xs font-bold text-slate-200">All tasks completed!</p>
                                        <p className="text-[10px] text-slate-500 mt-1">Nothing pending for this project.</p>
                                    </div>
                                );
                            }

                            const currentIndex = Math.min(sidebarTaskIndex, activeTasks.length - 1);
                            const task = activeTasks[currentIndex] || activeTasks[0];

                            return (
                                <div className="space-y-4 relative z-10 animate-fade-in">
                                    {/* Task Card Slider */}
                                    <div
                                        onClick={() => setSelectedTask(task)}
                                        className="p-5 bg-slate-950/70 backdrop-blur-md rounded-2xl border border-slate-800 hover:border-amber-500/40 flex flex-col justify-between min-h-[140px] cursor-pointer transition-all duration-300 hover:shadow-lg group/card"
                                    >
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <span className={cn(
                                                    "text-[8px] px-2 py-0.5 rounded-md font-extrabold uppercase tracking-wider",
                                                    task.priority === 'critical' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                                                    task.priority === 'high'     ? 'bg-amber-500/20 text-amber-405 text-amber-400 border border-amber-500/30' :
                                                    task.priority === 'medium'   ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                                                                                'bg-green-500/20 text-green-400 border border-green-500/30'
                                                )}>
                                                    {task.priority} Priority
                                                </span>
                                                <span className="text-[9px] text-amber-500 font-bold uppercase bg-amber-500/5 px-2 py-0.5 rounded-md border border-amber-500/10">
                                                    {task.status}
                                                </span>
                                            </div>
                                            <h4 className="text-sm font-bold text-slate-100 mt-2 line-clamp-2 group-hover/card:text-amber-400 transition-colors">
                                                {task.title}
                                            </h4>
                                            {task.description && (
                                                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{task.description}</p>
                                            )}
                                        </div>

                                        <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-800/80">
                                            <div className="flex items-center gap-2">
                                                <div className="w-5 h-5 rounded-full bg-slate-800 text-[10px] font-bold flex items-center justify-center text-slate-300 border border-slate-700">
                                                    {task.assignee?.name?.charAt(0).toUpperCase() || '?'}
                                                </div>
                                                <span className="text-[10px] text-slate-400 font-medium">
                                                    Assignee: <span className="font-semibold text-slate-200">{task.assignee?.name || 'Unassigned'}</span>
                                                </span>
                                            </div>
                                            <span className="text-[9px] font-extrabold text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                                                {currentIndex + 1} / {activeTasks.length}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Slider Controls */}
                                    {activeTasks.length > 1 && (
                                        <div className="flex justify-between items-center px-1">
                                            <div className="flex gap-1.5">
                                                {activeTasks.map((_, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => setSidebarTaskIndex(idx)}
                                                        className={cn(
                                                            "w-1.5 h-1.5 rounded-full transition-all duration-300",
                                                            currentIndex === idx ? "bg-amber-500 w-3.5" : "bg-slate-700"
                                                        )}
                                                    />
                                                ))}
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setSidebarTaskIndex(prev => (prev - 1 + activeTasks.length) % activeTasks.length)}
                                                    className="w-7 h-7 flex items-center justify-center bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 rounded-xl transition-all duration-200 shadow-sm"
                                                >
                                                    <ChevronLeft size={14} />
                                                </button>
                                                <button
                                                    onClick={() => setSidebarTaskIndex(prev => (prev + 1) % activeTasks.length)}
                                                    className="w-7 h-7 flex items-center justify-center bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 rounded-xl transition-all duration-200 shadow-sm"
                                                >
                                                    <ChevronRight size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })() : (() => {
                            const upcomingEvents = project.events || [];
                            if (upcomingEvents.length === 0) {
                                return (
                                    <div className="text-center py-8 border border-dashed border-slate-800 rounded-2xl bg-slate-950/40 relative z-10 flex flex-col justify-center items-center">
                                        <Calendar size={32} className="text-slate-500 mb-2" />
                                        <p className="text-xs font-bold text-slate-300">No upcoming events</p>
                                        <p className="text-[10px] text-slate-500 mt-1">Navigate to Planning tab to schedule.</p>
                                    </div>
                                );
                            }

                            const currentIndex = Math.min(sidebarEventIndex, upcomingEvents.length - 1);
                            const ev = upcomingEvents[currentIndex] || upcomingEvents[0];
                            const eventTime = ev.event_date ? new Date(ev.event_date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '10:00 AM';
                            const eventDate = ev.event_date ? new Date(ev.event_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Today';

                            return (
                                <div className="space-y-4 relative z-10 animate-fade-in">
                                    {/* Event Card Slider */}
                                    <div className="p-5 bg-slate-950/70 backdrop-blur-md rounded-2xl border border-slate-800 hover:border-indigo-500/40 flex flex-col justify-between min-h-[140px] transition-all duration-300 hover:shadow-lg group/card">
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[8px] text-indigo-300 font-extrabold bg-indigo-500/20 border border-indigo-500/30 px-2 py-0.5 rounded-md flex items-center gap-1">
                                                    <CalendarDays size={10} /> {eventDate}
                                                </span>
                                                <span className="text-[9px] text-slate-400 font-bold flex items-center gap-1">
                                                    <Clock size={10} className="text-indigo-400" /> {eventTime}
                                                </span>
                                            </div>
                                            <h4 className="text-sm font-bold text-slate-100 mt-2.5 line-clamp-2 group-hover/card:text-indigo-400 transition-colors">
                                                {ev.title}
                                            </h4>
                                            {ev.description && (
                                                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{ev.description}</p>
                                            )}
                                        </div>

                                        <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-800/80">
                                            <span className="text-[10px] text-slate-400 font-medium">
                                                Host: <span className="font-semibold text-slate-200">Jagya Team</span>
                                            </span>
                                            <span className="text-[9px] font-extrabold text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                                                {currentIndex + 1} / {upcomingEvents.length}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Slider Controls */}
                                    {upcomingEvents.length > 1 && (
                                        <div className="flex justify-between items-center px-1">
                                            <div className="flex gap-1.5">
                                                {upcomingEvents.map((_, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => setSidebarEventIndex(idx)}
                                                        className={cn(
                                                            "w-1.5 h-1.5 rounded-full transition-all duration-300",
                                                            currentIndex === idx ? "bg-indigo-500 w-3.5" : "bg-slate-700"
                                                        )}
                                                    />
                                                ))}
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setSidebarEventIndex(prev => (prev - 1 + upcomingEvents.length) % upcomingEvents.length)}
                                                    className="w-7 h-7 flex items-center justify-center bg-slate-800 hover:bg-indigo-500 hover:text-white text-slate-300 rounded-xl transition-all duration-200 shadow-sm"
                                                >
                                                    <ChevronLeft size={14} />
                                                </button>
                                                <button
                                                    onClick={() => setSidebarEventIndex(prev => (prev + 1) % upcomingEvents.length)}
                                                    className="w-7 h-7 flex items-center justify-center bg-slate-800 hover:bg-indigo-500 hover:text-white text-slate-300 rounded-xl transition-all duration-200 shadow-sm"
                                                >
                                                    <ChevronRight size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })()}
                    </div>

                    {/* Client Information Panel */}
                    {!isInternal && project.client && (
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-6 space-y-4 shadow-sm hover:shadow-md transition-all">
                            <div className="flex justify-between items-center">
                                <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Client</h3>
                                <Link
                                    href={`/clients/${project.client.id}`}
                                    className="text-xs font-bold text-amber-600 hover:text-amber-700 dark:hover:text-amber-500 hover:underline"
                                >
                                    View Profile
                                </Link>
                            </div>
                            <div className="flex items-center gap-3.5">
                                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-black text-sm overflow-hidden shrink-0 relative shadow-sm">
                                    <span className="absolute inset-0 flex items-center justify-center">
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
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-bold text-slate-950 dark:text-slate-100 truncate">
                                        {project.client.name}
                                    </p>
                                    <p className="text-xs text-slate-450 dark:text-slate-500 font-medium truncate mt-0.5">
                                        ID: {project.client.client_id}
                                    </p>
                                </div>
                            </div>
                            <div className="text-xs text-slate-650 dark:text-slate-400 space-y-3 pt-3.5 border-t border-slate-100 dark:border-slate-800/80">
                                <div className="flex items-center gap-2.5 hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
                                    <div className="w-6.5 h-6.5 rounded-lg bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-600 shrink-0">
                                        <Phone size={12} />
                                    </div>
                                    <a href={`tel:${project.client.mobile}`} className="font-semibold truncate hover:underline text-slate-700 dark:text-slate-350">
                                        {project.client.mobile}
                                    </a>
                                </div>
                                <div className="flex items-center gap-2.5 hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
                                    <div className="w-6.5 h-6.5 rounded-lg bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-600 shrink-0">
                                        <Mail size={12} />
                                    </div>
                                    {project.client.email ? (
                                        <a href={`mailto:${project.client.email}`} className="font-semibold truncate hover:underline text-slate-700 dark:text-slate-350">
                                            {project.client.email}
                                        </a>
                                    ) : (
                                        <span className="text-slate-400 italic">No email saved</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2.5 hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
                                    <div className="w-6.5 h-6.5 rounded-lg bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-600 shrink-0">
                                        <MapPin size={12} />
                                    </div>
                                    <span className="font-semibold truncate text-slate-700 dark:text-slate-350">{project.client.city || 'Not specified'}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Track Record / Activities */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 max-h-[500px] overflow-y-auto">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Track Record</h3>
                        {project.activities && project.activities.length > 0 ? (
                            <div className="space-y-5">
                                {project.activities.map(act => (
                                    <div key={act.id} className="text-sm flex gap-3 items-start relative">
                                        {/* Timeline line */}
                                        <div className="absolute left-4 top-8 bottom-[-20px] w-0.5 bg-slate-100 dark:bg-slate-800 -z-10 last:hidden" />
                                        
                                        <div className="w-8 h-8 shrink-0 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-600 flex items-center justify-center overflow-hidden border-2 border-white dark:border-slate-900 shadow-sm z-10">
                                            {act.user?.photo_path ? (
                                                <img src={act.user.photo_path} alt={act.user.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="font-bold text-xs">{act.user?.name?.charAt(0) || '?'}</span>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50">
                                            <p className="text-slate-700 dark:text-slate-300">
                                                <span className="font-semibold text-slate-900 dark:text-slate-100">{act.user?.name || 'System'}</span> {act.description}
                                            </p>
                                            <p className="text-xs text-slate-400 mt-1">{new Date(act.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-slate-500 italic">No track record available yet.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Document Upload Modal */}
            {showUploadDocModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowUploadDocModal(false)} />
                    <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl space-y-4 animate-scale-up">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">Upload Document</h3>
                            <button type="button" onClick={() => setShowUploadDocModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleUploadDocument} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">File *</label>
                                <input
                                    type="file"
                                    onChange={e => setDocForm({ ...docForm, file: e.target.files[0] })}
                                    className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Document Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Approved Plan Blueprint"
                                    value={docForm.name}
                                    onChange={e => setDocForm({ ...docForm, name: e.target.value })}
                                    className={inputCls}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Description</label>
                                <textarea
                                    placeholder="Add any helpful description about the document..."
                                    value={docForm.description}
                                    onChange={e => setDocForm({ ...docForm, description: e.target.value })}
                                    rows={2}
                                    className={cn(inputCls, 'resize-none')}
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowUploadDocModal(false)}
                                    className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={uploadingDoc || !docForm.file}
                                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 transition-colors disabled:opacity-50"
                                >
                                    {uploadingDoc ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                                    Upload
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Task Creation Modal */}
            {showAddTaskModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAddTaskModal(false)} />
                    <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl space-y-4 animate-scale-up">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">Add New Task</h3>
                            <button type="button" onClick={() => setShowAddTaskModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateTask} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Task Title *</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Earth excavation"
                                    value={taskForm.title}
                                    onChange={e => setTaskForm({ ...taskForm, title: e.target.value })}
                                    className={inputCls}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Description</label>
                                <textarea
                                    placeholder="Task details..."
                                    value={taskForm.description}
                                    onChange={e => setTaskForm({ ...taskForm, description: e.target.value })}
                                    rows={2}
                                    className={cn(inputCls, 'resize-none')}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Priority</label>
                                    <select
                                        value={taskForm.priority}
                                        onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}
                                        className={inputCls}
                                    >
                                        {PRIORITIES.map(p => (
                                            <option key={p.value} value={p.value}>{p.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Assignee</label>
                                    <select
                                        value={taskForm.assignee_id}
                                        onChange={e => setTaskForm({ ...taskForm, assignee_id: e.target.value })}
                                        className={inputCls}
                                    >
                                        <option value="">— Select Assignee —</option>
                                        {project.team?.map(m => (
                                            <option key={m.id} value={m.id}>{m.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowAddTaskModal(false)}
                                    className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-55"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={addingTask || !taskForm.title}
                                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 transition-colors disabled:opacity-50"
                                >
                                    {addingTask ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                                    Create
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Event Creation Modal */}
            {showAddEventModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAddEventModal(false)} />
                    <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl space-y-4 animate-scale-up">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">Schedule New Event</h3>
                            <button type="button" onClick={() => setShowAddEventModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleAddEvent} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Event Title *</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Concrete Pouring Inspection"
                                    value={eventForm.title}
                                    onChange={e => setEventForm({ ...eventForm, title: e.target.value })}
                                    className={inputCls}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Description</label>
                                <textarea
                                    placeholder="Describe the scope, objectives, or required attendees..."
                                    value={eventForm.description}
                                    onChange={e => setEventForm({ ...eventForm, description: e.target.value })}
                                    rows={3}
                                    className={cn(inputCls, 'resize-none')}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Date *</label>
                                    <input
                                        type="date"
                                        value={eventForm.event_date}
                                        onChange={e => setEventForm({ ...eventForm, event_date: e.target.value })}
                                        className={inputCls}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Time *</label>
                                    <input
                                        type="time"
                                        value={eventForm.event_time}
                                        onChange={e => setEventForm({ ...eventForm, event_time: e.target.value })}
                                        className={inputCls}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowAddEventModal(false)}
                                    className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submittingEvent || !eventForm.title || !eventForm.event_date}
                                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 transition-colors disabled:opacity-50"
                                >
                                    {submittingEvent ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                                    Schedule
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── High-Fidelity Rich Task Detail Drawer/Modal ── */}
            {selectedTask && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedTask(null)} />
                    <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-scale-up max-h-[90vh] overflow-y-auto">
                        
                        {/* Header */}
                        <div className="flex justify-between items-start gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                            <div>
                                <span className={cn('text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wider mb-2 inline-block',
                                    selectedTask.priority === 'critical' ? 'bg-red-100 text-red-700' :
                                    selectedTask.priority === 'high'     ? 'bg-amber-100 text-amber-700' :
                                    selectedTask.priority === 'medium'   ? 'bg-blue-100 text-blue-700' :
                                                                          'bg-green-100 text-green-700'
                                )}>
                                    {selectedTask.priority} Priority
                                </span>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                                    {selectedTask.title}
                                </h3>
                            </div>
                            <div className="flex items-center gap-2">
                                {/* Audited Delete Task Button */}
                                <button
                                    type="button"
                                    onClick={() => triggerDeleteRequest('task', selectedTask.id, selectedTask.title)}
                                    className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Request Task Deletion"
                                >
                                    <Trash2 size={16} />
                                </button>
                                <button type="button" onClick={() => setSelectedTask(null)} className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Task Body Details */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
                            <div className="sm:col-span-2 space-y-4">
                                <div>
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Description</h4>
                                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl">
                                        {selectedTask.description || 'No description provided.'}
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-4 bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-100 dark:border-slate-855">
                                <div>
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Assignee</h4>
                                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                                        {selectedTask.assignee?.name || 'Unassigned'}
                                    </p>
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Status</h4>
                                    <select
                                        value={selectedTask.status}
                                        onChange={(e) => handleUpdateTaskStatus(selectedTask.id, e.target.value)}
                                        className={cn(inputCls, 'py-1.5 text-xs font-semibold capitalize')}
                                    >
                                        <option value="to-do">To Do</option>
                                        <option value="in-progress">In Progress</option>
                                        <option value="done">Done</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* ── TASK AUDIO & ATTACHMENTS (Fix for Issue 1) ── */}
                        {(selectedTask.attachments?.length > 0 || selectedTask.voice_notes?.length > 0) && (
                            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    Task Files & Voice Notes
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {selectedTask.attachments?.map((att, i) => (
                                        <div key={i} className="flex items-center gap-2.5 p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-205 dark:border-slate-700 text-xs">
                                            <FileText size={16} className="text-slate-400 shrink-0" />
                                            <a href={att.path} target="_blank" rel="noopener noreferrer" className="hover:underline text-amber-600 font-semibold truncate flex-1">
                                                {att.name}
                                            </a>
                                            <span className="text-[10px] text-slate-400 shrink-0">({(att.size / 1024).toFixed(1)} KB)</span>
                                        </div>
                                    ))}
                                    {selectedTask.voice_notes?.map((vn, i) => (
                                        <div key={i} className="flex flex-col gap-1.5 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-205 dark:border-slate-700 text-xs sm:col-span-2">
                                            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                                                <Mic size={12} className="text-amber-500" />
                                                <span>Task Voice Note {i + 1}</span>
                                            </div>
                                            <audio src={vn.path} controls className="h-8 w-full accent-amber-500 mt-1" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Comments & Activity Timeline */}
                        <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
                            <div className="flex items-center gap-2">
                                <MessageSquare size={16} className="text-slate-400" />
                                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                    Discussion & Attachments ({selectedTask.comments?.length || 0})
                                </h4>
                            </div>

                            {/* Existing Comments Timeline */}
                            <div className="space-y-4 max-h-60 overflow-y-auto pr-1">
                                {selectedTask.comments && selectedTask.comments.length > 0 ? (
                                    selectedTask.comments.map((comment) => (
                                        <div key={comment.id} className="flex gap-3 p-3 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                                            <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-xs font-bold shrink-0">
                                                {comment.user_name?.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1 space-y-1.5 min-w-0">
                                                <div className="flex justify-between items-center">
                                                    <span className="font-semibold text-xs text-slate-850 dark:text-slate-200">{comment.user_name}</span>
                                                    <span className="text-[10px] text-slate-400">{comment.created_at}</span>
                                                </div>
                                                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                                                    {comment.text}
                                                </p>

                                                {/* Download Attachment if exists */}
                                                {comment.attachment && (
                                                    <div className="flex items-center gap-2 p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] w-fit">
                                                        <FileText size={12} className="text-slate-400" />
                                                        <a href={comment.attachment.path} target="_blank" rel="noopener noreferrer" className="hover:underline text-amber-600 font-semibold truncate max-w-[120px]">
                                                            {comment.attachment.name}
                                                        </a>
                                                        <span className="text-slate-400">({(comment.attachment.size / 1024).toFixed(1)} KB)</span>
                                                    </div>
                                                )}

                                                {/* Play Voice Note Comment if exists */}
                                                {comment.voice && (
                                                    <div className="flex items-center gap-2 mt-1 w-full sm:w-2/3">
                                                        <audio src={comment.voice.path} controls className="h-8 w-full accent-amber-500" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-xs text-slate-400 italic">No discussion yet. Start the conversation below!</p>
                                )}
                            </div>

                            {/* Add Comment Form Container */}
                            <form onSubmit={handleAddComment} className="pt-4 border-t border-slate-100 dark:border-slate-850 space-y-3">
                                <div className="flex items-start gap-3">
                                    <div className="flex-1 relative">
                                        <textarea
                                            placeholder="Write an update, question, or comment..."
                                            value={commentText}
                                            onChange={e => setCommentText(e.target.value)}
                                            rows={2}
                                            className={cn(inputCls, 'resize-none pr-20')}
                                        />
                                        
                                        {/* Action Bar inside Textarea */}
                                        <div className="absolute right-2 bottom-2 flex items-center gap-1.5">
                                            {/* File attachment icon */}
                                            <label className="p-1.5 text-slate-400 hover:text-slate-600 cursor-pointer hover:bg-slate-100 rounded-lg">
                                                <input
                                                    type="file"
                                                    onChange={e => setCommentFile(e.target.files[0])}
                                                    className="hidden"
                                                />
                                                <Paperclip size={16} />
                                            </label>

                                            {/* Voice record icon */}
                                            <button
                                                type="button"
                                                onClick={toggleCommentVoiceRecord}
                                                className={cn(
                                                    'p-1.5 rounded-lg transition-colors relative',
                                                    isRecordingComment ? 'text-white bg-red-500 animate-pulse' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                                                )}
                                            >
                                                {isRecordingComment && (
                                                    <span className="absolute -inset-1.5 rounded-lg border border-red-500 animate-ping opacity-60" />
                                                )}
                                                <Mic size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Live Media Previews */}
                                {(commentFile || commentVoice || isRecordingComment) && (
                                    <div className="flex flex-wrap gap-2.5 p-2 bg-slate-50 dark:bg-slate-800 mx-px rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                                        {isRecordingComment && (
                                            <div className="flex items-center gap-2 text-red-500 font-semibold animate-pulse">
                                                <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                                                <span>Recording voice note... {formatTime(recordingDuration)}</span>
                                            </div>
                                        )}
                                        {commentVoice && !isRecordingComment && (
                                            <div className="flex items-center gap-2 bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-lg">
                                                <Mic size={12} />
                                                <span>Voice Note recorded ({formatTime(recordingDuration || 3)})</span>
                                                <button type="button" onClick={() => setCommentVoice(null)} className="hover:text-red-500 font-bold ml-1">×</button>
                                            </div>
                                        )}
                                        {commentFile && (
                                            <div className="flex items-center gap-2 bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-lg">
                                                <Paperclip size={12} />
                                                <span className="truncate max-w-[150px]">{commentFile.name}</span>
                                                <button type="button" onClick={() => setCommentFile(null)} className="hover:text-red-500 font-bold ml-1">×</button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Send Button */}
                                <div className="flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={submittingComment || (!commentText && !commentFile && !commentVoice)}
                                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-50 transition-colors"
                                    >
                                        {submittingComment ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                                        Post Update
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* ── KYC DETAILS MODAL ── */}
            {selectedKyc && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedKyc(null)} />
                    <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl animate-scale-up max-h-[90vh] overflow-y-auto">
                        <button 
                            onClick={() => setSelectedKyc(null)}
                            className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 p-2 rounded-xl transition-colors"
                        >
                            <X size={16} />
                        </button>
                        
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden border border-slate-100 dark:border-slate-800">
                                {selectedKyc.photo ? (
                                    <img src={selectedKyc.photo} alt={selectedKyc.name} className="w-full h-full object-cover" />
                                ) : (
                                    <Users size={24} />
                                )}
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{selectedKyc.name}</h3>
                                <p className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-1 rounded-md inline-block mt-1 uppercase tracking-wide">{selectedKyc.type}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-800">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-200 dark:border-slate-700 pb-2">Primary Details</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1">Phone Number</p>
                                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                            <Phone size={14} className="text-slate-400" />
                                            {selectedKyc.phone || 'Not Provided'}
                                        </p>
                                    </div>
                                    <div className="sm:col-span-2">
                                        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1">Address</p>
                                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 flex items-start gap-2">
                                            <MapPin size={14} className="text-slate-400 shrink-0 mt-0.5" />
                                            {selectedKyc.address || 'Not Provided'}
                                        </p>
                                    </div>
                                    {selectedKyc.note && (
                                        <div className="sm:col-span-2 mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 border-dashed">
                                            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1">Additional Notes</p>
                                            <p className="text-sm text-slate-600 dark:text-slate-300 italic">"{selectedKyc.note}"</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Uploaded Documents</h4>
                                {selectedKyc.docs && selectedKyc.docs.length > 0 ? (
                                    <div className="space-y-2">
                                        {selectedKyc.docs.map((doc, dIdx) => (
                                            <a
                                                key={dIdx}
                                                href={doc.file_path}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center justify-between p-3 bg-white hover:bg-indigo-50 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl transition-colors group"
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0 group-hover:bg-indigo-100 transition-colors">
                                                        <FileText size={14} />
                                                    </div>
                                                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate pr-4">
                                                        {doc.document_name.split(' - ').pop()}
                                                    </span>
                                                </div>
                                                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-1 rounded shrink-0">View</span>
                                            </a>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-slate-400 italic bg-slate-50 dark:bg-slate-800/30 p-4 rounded-xl text-center border border-slate-100 dark:border-slate-800 border-dashed">No documents attached.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── AGREEMENT DETAILS MODAL ── */}
            {selectedAgreement && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedAgreement(null)} />
                    <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl animate-scale-up max-h-[90vh] overflow-y-auto">
                        <button 
                            onClick={() => setSelectedAgreement(null)}
                            className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 p-2 rounded-xl transition-colors"
                        >
                            <X size={16} />
                        </button>
                        
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-16 h-16 bg-blue-50 dark:bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center shrink-0">
                                <FileText size={28} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{selectedAgreement.type}</h3>
                                <p className="text-xs font-medium text-slate-500 mt-1">Uploaded {new Date(selectedAgreement.created_at).toLocaleDateString('en-IN')}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {selectedAgreement.note && (
                                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-800">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Agreement Note</h4>
                                    <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                                        "{selectedAgreement.note}"
                                    </p>
                                </div>
                            )}

                            <div>
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Associated Files</h4>
                                {selectedAgreement.docs && selectedAgreement.docs.length > 0 ? (
                                    <div className="space-y-2">
                                        {selectedAgreement.docs.map((doc, dIdx) => (
                                            <a
                                                key={dIdx}
                                                href={doc.file_path}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center justify-between p-3 bg-white hover:bg-blue-50 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl transition-colors group"
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0 group-hover:bg-blue-100 transition-colors">
                                                        <FileText size={14} />
                                                    </div>
                                                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate pr-4">
                                                        {doc.file_path.split('/').pop()}
                                                    </span>
                                                </div>
                                                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-500/10 px-2 py-1 rounded shrink-0">View</span>
                                            </a>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-slate-400 italic bg-slate-50 dark:bg-slate-800/30 p-4 rounded-xl text-center border border-slate-100 dark:border-slate-800 border-dashed">No documents attached.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── SECURE DELETE REQUEST CONFIRMATION DIALOG (Issue 2) ── */}
            {showDeleteRequestModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDeleteRequestModal(false)} />
                    <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl space-y-4 animate-scale-up">
                        <div className="flex items-center gap-2 text-red-600">
                            <AlertTriangle size={20} className="shrink-0 animate-pulse" />
                            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                                Audited Delete Request
                            </h3>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-150 dark:border-slate-800 text-xs text-slate-650 space-y-1 leading-relaxed">
                            <p><strong>Item Type:</strong> <span className="capitalize">{deleteRequestItem.type}</span></p>
                            <p><strong>Item Name:</strong> {deleteRequestItem.name}</p>
                            <p className="text-red-500 font-semibold mt-2.5">
                                Note: Deletions require secondary Admin approval. A full deep copy snapshot of the record will be archived for audit compliance.
                            </p>
                        </div>

                        <form onSubmit={handleSubmitDeleteRequest} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                                    Reason for Deletion *
                                </label>
                                <textarea
                                    required
                                    placeholder="Provide detailed explanation for this deletion request..."
                                    value={deleteReason}
                                    onChange={e => setDeleteReason(e.target.value)}
                                    rows={3}
                                    className={cn(inputCls, 'resize-none')}
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2 border-t border-slate-105">
                                <button
                                    type="button"
                                    onClick={() => setShowDeleteRequestModal(false)}
                                    className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submittingDeleteRequest || !deleteReason}
                                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-50"
                                >
                                    {submittingDeleteRequest ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                    Submit Request
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── DISPATCH CLIENT NOTICE MODAL ── */}
            {showNoticeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowNoticeModal(false)} />
                    <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl space-y-4 animate-scale-up border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2 text-rose-500 mb-2">
                            <Send size={20} className="shrink-0" />
                            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                                Dispatch Client Notice
                            </h3>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Create and dispatch a high-priority notice to the client. This will be recorded in the project's audit logs.
                        </p>
                        
                        <form onSubmit={submitNotice} className="space-y-4 mt-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Notice Title *</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="e.g. Payment Delay Warning"
                                    value={noticeForm.title}
                                    onChange={e => setNoticeForm({...noticeForm, title: e.target.value})}
                                    className={inputCls}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Notice Content *</label>
                                <textarea
                                    required
                                    rows={4}
                                    placeholder="Type the message for the client..."
                                    value={noticeForm.content}
                                    onChange={e => setNoticeForm({...noticeForm, content: e.target.value})}
                                    className={cn(inputCls, 'resize-none')}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Dispatch Methods *</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <div className={cn(
                                            "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                                            noticeForm.methods.includes('email') ? "bg-rose-500 border-rose-500 text-white" : "border-slate-300 dark:border-slate-600 group-hover:border-rose-400"
                                        )}>
                                            {noticeForm.methods.includes('email') && <Check size={10} />}
                                        </div>
                                        <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">Email</span>
                                        <input type="checkbox" className="hidden" checked={noticeForm.methods.includes('email')} onChange={() => handleMethodToggle('email')} />
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <div className={cn(
                                            "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                                            noticeForm.methods.includes('whatsapp') ? "bg-rose-500 border-rose-500 text-white" : "border-slate-300 dark:border-slate-600 group-hover:border-rose-400"
                                        )}>
                                            {noticeForm.methods.includes('whatsapp') && <Check size={10} />}
                                        </div>
                                        <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">WhatsApp</span>
                                        <input type="checkbox" className="hidden" checked={noticeForm.methods.includes('whatsapp')} onChange={() => handleMethodToggle('whatsapp')} />
                                    </label>
                                </div>
                            </div>
                            
                            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setShowNoticeModal(false)}
                                    className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submittingNotice || noticeForm.methods.length === 0}
                                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-semibold text-white bg-rose-500 hover:bg-rose-600 transition-colors disabled:opacity-50"
                                >
                                    {submittingNotice ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                                    Dispatch Notice
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Premium success toast */}
            {successToast && (
                <div className="fixed bottom-6 right-6 z-[99999] flex items-center gap-3 bg-emerald-500 text-white px-5 py-3.5 rounded-2xl shadow-2xl animate-slide-in font-semibold text-xs max-w-sm border border-emerald-400">
                    <CheckCircle2 size={16} className="shrink-0 animate-bounce" />
                    <span>{successToast}</span>
                </div>
            )}

            {/* Post-Creation Setup Modal */}
            {showSetupModal && (
                <ProjectOnboarding 
                    project={project} 
                    onClose={() => setShowSetupModal(false)} 
                />
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
        </AppLayout>
    );
}
