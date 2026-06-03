import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { 
    Eye, 
    EyeOff, 
    Lock, 
    Mail, 
    Building2, 
    Plus, 
    X, 
    Upload, 
    Loader2, 
    User, 
    Phone, 
    CheckCircle2, 
    MapPin, 
    Briefcase,
    BriefcaseBusiness,
    GraduationCap,
    Clock,
    FileText,
    ShieldAlert
} from 'lucide-react';
import JcmsLogo from '@/Components/JcmsLogo';
import ImageCropperModal from '@/Components/ImageCropperModal';
import axios from 'axios';
import { cn } from '@/lib/utils';

export default function Login({ departments = [], designations = [], offices = [] }) {
    const [showPassword, setShowPassword] = useState(false);
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    // Registration Form States
    const [showRegisterDrawer, setShowRegisterDrawer] = useState(false);
    const [registerStep, setRegisterStep] = useState(1);
    const [registering, setRegistering] = useState(false);
    const [regErrors, setRegErrors] = useState({});
    const [regSuccess, setRegSuccess] = useState(false);
    const [showRegPassword, setShowRegPassword] = useState(false);
    const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);

    // Cropper states
    const [cropModalOpen, setCropModalOpen] = useState(false);
    const [rawOriginalFile, setRawOriginalFile] = useState(null);

    const [registerForm, setRegisterForm] = useState({
        name: '',
        phone: '',
        gender: 'Male',
        department: departments[0] || '',
        designation: designations[0] || '',
        joining_date: '',
        office: offices[0] || '',
        photo: null,
        photoPreview: null,
        address: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    React.useEffect(() => {
        if (departments.length && !registerForm.department) {
            setRegisterForm(prev => ({ ...prev, department: departments[0] }));
        }
    }, [departments]);

    React.useEffect(() => {
        if (designations.length && !registerForm.designation) {
            setRegisterForm(prev => ({ ...prev, designation: designations[0] }));
        }
    }, [designations]);

    React.useEffect(() => {
        if (offices.length && !registerForm.office) {
            setRegisterForm(prev => ({ ...prev, office: offices[0] }));
        }
    }, [offices]);

    function submit(e) {
        e.preventDefault();
        post('/login');
    }

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        
        if (registerStep === 1) {
            if (!registerForm.name) {
                alert('Please enter your full name');
                return;
            }
            setRegisterStep(2);
            return;
        }

        if (registerForm.password !== registerForm.password_confirmation) {
            setRegErrors({ password_confirmation: ['Passwords do not match'] });
            return;
        }

        setRegistering(true);
        setRegErrors({});

        const formData = new FormData();
        formData.append('name', registerForm.name);
        formData.append('phone', registerForm.phone || '');
        formData.append('gender', registerForm.gender || '');
        formData.append('department', registerForm.department || '');
        formData.append('designation', registerForm.designation || '');
        formData.append('joining_date', registerForm.joining_date || '');
        formData.append('office', registerForm.office || '');
        if (registerForm.photo) {
            formData.append('photo', registerForm.photo);
        }
        formData.append('address', registerForm.address || '');
        formData.append('emergency_contact_name', registerForm.emergency_contact_name || '');
        formData.append('emergency_contact_phone', registerForm.emergency_contact_phone || '');
        formData.append('email', registerForm.email);
        formData.append('password', registerForm.password);

        try {
            const res = await axios.post('/register-team', formData, {
                headers: { 
                    'Content-Type': 'multipart/form-data',
                    'Accept': 'application/json'
                }
            });
            
            if (res.data.success) {
                setRegSuccess(true);
                setRegisterForm({
                    name: '',
                    phone: '',
                    gender: 'Male',
                    department: departments[0] || '',
                    designation: designations[0] || '',
                    joining_date: '',
                    office: offices[0] || '',
                    photo: null,
                    photoPreview: null,
                    address: '',
                    emergency_contact_name: '',
                    emergency_contact_phone: '',
                    email: '',
                    password: '',
                    password_confirmation: '',
                });
                setRegisterStep(1);
            }
        } catch (err) {
            console.error(err);
            if (err.response?.data?.errors) {
                setRegErrors(err.response.data.errors);
                const firstError = Object.values(err.response.data.errors)[0][0];
                alert(`Error: ${firstError}`);
            } else {
                alert(err.response?.data?.message || 'Registration failed. Please try again.');
            }
        } finally {
            setRegistering(false);
        }
    };

    return (
        <>
            <Head title="Login" />
            <div className="min-h-screen flex bg-slate-950">
                {/* Left Panel - Branding */}
                <div className="hidden lg:flex flex-col w-1/2 relative overflow-hidden">
                    {/* Background */}
                    <div
                        className="absolute inset-0"
                        style={{
                            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 40%, #1c1917 100%)',
                        }}
                    />
                    {/* Decorative circles */}
                    <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-20"
                        style={{ background: 'radial-gradient(circle, #f59e0b, transparent 70%)' }} />
                    <div className="absolute -bottom-48 -right-24 w-[500px] h-[500px] rounded-full opacity-10"
                        style={{ background: 'radial-gradient(circle, #dc2626, transparent 70%)' }} />

                    {/* Grid Pattern */}
                    <div className="absolute inset-0 opacity-5"
                        style={{
                            backgroundImage: 'linear-gradient(#f59e0b 1px, transparent 1px), linear-gradient(to right, #f59e0b 1px, transparent 1px)',
                            backgroundSize: '50px 50px',
                        }} />

                    {/* Content */}
                    <div className="relative flex-1 flex flex-col items-center justify-center p-12 text-white">
                        <JcmsLogo size={80} layout="vertical" className="mb-12" />

                        <div className="max-w-sm text-center space-y-4">
                            <h2 className="text-3xl font-bold leading-tight">
                                Assam's Largest
                                <br />
                                <span style={{
                                    background: 'linear-gradient(135deg, #FFF2D4 0%, #F5B942 50%, #C58B24 100%)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    backgroundClip: 'text',
                                }}>
                                    Home Builder
                                </span>
                            </h2>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                Managing 2000+ residential projects across Assam with precision and excellence.
                            </p>
                        </div>

                        {/* Stats */}
                        <div className="mt-16 grid grid-cols-3 gap-6 w-full max-w-sm">
                            {[
                                { value: '2000+', label: 'Projects' },
                                { value: '15+', label: 'Years' },
                                { value: '5000+', label: 'Families' },
                            ].map((stat) => (
                                <div key={stat.label} className="text-center p-4 rounded-2xl"
                                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                    <div className="text-2xl font-bold"
                                        style={{
                                            background: 'linear-gradient(135deg, #FFF2D4 0%, #F5B942 50%, #C58B24 100%)',
                                            WebkitBackgroundClip: 'text',
                                            WebkitTextFillColor: 'transparent',
                                            backgroundClip: 'text',
                                        }}>
                                        {stat.value}
                                    </div>
                                    <div className="text-slate-500 text-xs mt-1">{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Panel - Login Form */}
                <div className="flex-1 flex items-center justify-center p-8 bg-slate-900">
                    <div className="w-full max-w-md space-y-8">
                        {/* Mobile Logo */}
                        <div className="lg:hidden flex justify-center mb-8">
                            <JcmsLogo size={44} />
                        </div>

                        <div className="space-y-2">
                            <h1 className="text-2xl font-bold text-white">Welcome back</h1>
                            <p className="text-slate-400 text-sm">Sign in to your JCMS account</p>
                        </div>

                        <form onSubmit={submit} className="space-y-4">
                            {/* Email */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-300">Email Address</label>
                                <div className="relative">
                                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                                    <input
                                        id="email"
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        placeholder="Enter your email"
                                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
                                        required
                                    />
                                </div>
                                {errors.email && (
                                    <p className="text-red-400 text-xs">{errors.email}</p>
                                )}
                            </div>

                            {/* Password */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-300">Password</label>
                                <div className="relative">
                                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full pl-10 pr-10 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="text-red-400 text-xs">{errors.password}</p>
                                )}
                            </div>

                            {/* Remember */}
                            <div className="flex items-center gap-2">
                                <input
                                    id="remember"
                                    type="checkbox"
                                    checked={data.remember}
                                    onChange={(e) => setData('remember', e.target.checked)}
                                    className="w-4 h-4 rounded accent-amber-500"
                                />
                                <label htmlFor="remember" className="text-sm text-slate-400">
                                    Keep me signed in
                                </label>
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full py-3 rounded-xl font-semibold text-sm text-white transition-all duration-200 relative overflow-hidden group disabled:opacity-60"
                                style={{
                                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                                    boxShadow: '0 4px 20px rgba(245,158,11,0.25)',
                                }}
                            >
                                <span className="relative z-10">
                                    {processing ? 'Signing in...' : 'Sign in to JCMS'}
                                </span>
                                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors" />
                            </button>
                        </form>

                        <div className="text-center mt-4">
                            <span className="text-xs text-slate-500">Prospective team member? </span>
                            <button
                                type="button"
                                onClick={() => setShowRegisterDrawer(true)}
                                className="text-xs font-bold text-amber-500 hover:text-amber-400 transition-colors cursor-pointer"
                            >
                                Register here
                            </button>
                        </div>

                        <p className="text-center text-xs text-slate-600 mt-8">
                            © 2024 Jagya Construction Management System. All rights reserved.
                        </p>
                    </div>
                </div>
            </div>

            {/* Team Member Registration Drawer */}
            {showRegisterDrawer && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-end">
                    {/* Backdrop */}
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setShowRegisterDrawer(false)} />
                    
                    {/* Drawer Container */}
                    <div className="relative w-full max-w-2xl h-full bg-white dark:bg-slate-900 shadow-2xl flex flex-col z-10 animate-slide-in-right">
                        
                        {/* Drawer Header */}
                        <div className="p-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="font-extrabold text-slate-900 dark:text-white text-base tracking-tight">Team Member Registration</h4>
                                    <p className="text-xs text-slate-500 mt-0.5">Fill out your details. Account will be activated upon admin approval.</p>
                                </div>
                                <button type="button" onClick={() => setShowRegisterDrawer(false)} className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 flex items-center justify-center transition-colors">
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Drawer Body */}
                        <form onSubmit={handleRegisterSubmit} className="flex-1 overflow-y-auto min-h-0 flex flex-col justify-between">
                            <div className="p-6 space-y-6">
                                
                                {regSuccess ? (
                                    <div className="flex flex-col items-center justify-center text-center py-12 space-y-4 animate-fade-in">
                                        <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                            <CheckCircle2 size={36} />
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Registration Request Submitted!</h3>
                                        <p className="text-sm text-slate-500 max-w-md">
                                            Thank you for registering. Your account has been created successfully but is currently **pending administrator approval**.
                                            You will be notified or you can attempt logging in once your supervisor activates your profile.
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setRegSuccess(false);
                                                setShowRegisterDrawer(false);
                                            }}
                                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 shadow-lg hover:shadow-xl transition-all"
                                        >
                                            Return to Login
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        {/* Step Indicators */}
                                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                                            <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-amber-600">
                                                Step {registerStep} of 2
                                            </span>
                                            <div className="flex gap-1">
                                                {[1, 2].map(step => (
                                                    <div key={step} className={cn("h-1.5 w-8 rounded-full transition-colors", step <= registerStep ? "bg-amber-500" : "bg-slate-200 dark:bg-slate-700")} />
                                                ))}
                                            </div>
                                        </div>

                                        {/* STEP 1: Personal & Professional Details */}
                                        {registerStep === 1 && (
                                            <div className="space-y-4 animate-fade-in">
                                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Personal & Professional Info</div>

                                                {/* Profile Photo Upload */}
                                                <div className="flex flex-col items-center gap-2 py-1">
                                                    <div className="relative group w-20 h-20 rounded-full border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center bg-slate-50 dark:bg-slate-800 overflow-hidden shrink-0">
                                                        {registerForm.photoPreview ? (
                                                            <img src={registerForm.photoPreview} alt="Avatar Preview" className="w-full h-full object-cover" />
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

                                                {/* Two Column Grid */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Name *</label>
                                                        <input
                                                            type="text"
                                                            required
                                                            value={registerForm.name}
                                                            onChange={e => setRegisterForm({ ...registerForm, name: e.target.value })}
                                                            placeholder="e.g. Ramesh Sharma"
                                                            className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/50 text-slate-800 dark:text-slate-200"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Mobile Number *</label>
                                                        <input
                                                            type="tel"
                                                            required
                                                            value={registerForm.phone}
                                                            onChange={e => setRegisterForm({ ...registerForm, phone: e.target.value })}
                                                            placeholder="e.g. +91 98765 43210"
                                                            className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/50 text-slate-800 dark:text-slate-200"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Gender *</label>
                                                        <select
                                                            value={registerForm.gender}
                                                            onChange={e => setRegisterForm({ ...registerForm, gender: e.target.value })}
                                                            className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/50 text-slate-700 dark:text-slate-300"
                                                        >
                                                            <option value="Male">Male</option>
                                                            <option value="Female">Female</option>
                                                            <option value="Other">Other</option>
                                                        </select>
                                                    </div>

                                                    <div>
                                                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Preferred Department *</label>
                                                        <select
                                                            value={registerForm.department}
                                                            onChange={e => setRegisterForm({ ...registerForm, department: e.target.value })}
                                                            className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/50 text-slate-700 dark:text-slate-300"
                                                        >
                                                            {departments.map((dept) => (
                                                                <option key={dept} value={dept}>{dept}</option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    <div>
                                                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Designation *</label>
                                                        <select
                                                            value={registerForm.designation}
                                                            onChange={e => setRegisterForm({ ...registerForm, designation: e.target.value })}
                                                            className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/50 text-slate-700 dark:text-slate-300"
                                                        >
                                                            {designations.map((desig) => (
                                                                <option key={desig} value={desig}>{desig}</option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    <div>
                                                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Office Location *</label>
                                                        <select
                                                            value={registerForm.office}
                                                            onChange={e => setRegisterForm({ ...registerForm, office: e.target.value })}
                                                            className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/50 text-slate-700 dark:text-slate-300"
                                                        >
                                                            {offices.map((off) => (
                                                                <option key={off} value={off}>{off}</option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    <div className="md:col-span-2">
                                                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Joining Date *</label>
                                                        <input
                                                            type="date"
                                                            required
                                                            value={registerForm.joining_date}
                                                            onChange={e => setRegisterForm({ ...registerForm, joining_date: e.target.value })}
                                                            className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/50 text-slate-800 dark:text-slate-200"
                                                        />
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Current Home Address *</label>
                                                    <textarea
                                                        required
                                                        rows={2}
                                                        value={registerForm.address}
                                                        onChange={e => setRegisterForm({ ...registerForm, address: e.target.value })}
                                                        placeholder="Enter your full residential address..."
                                                        className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/50 text-slate-800 dark:text-slate-200"
                                                    />
                                                </div>

                                                <div className="p-3.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800/40 space-y-3">
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Emergency Contact Person</div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        <div>
                                                            <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">Contact Name *</label>
                                                            <input
                                                                type="text"
                                                                required
                                                                value={registerForm.emergency_contact_name}
                                                                onChange={e => setRegisterForm({ ...registerForm, emergency_contact_name: e.target.value })}
                                                                placeholder="e.g. Father's or Spouse's Name"
                                                                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400/50 text-slate-800 dark:text-slate-200"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">Contact Phone *</label>
                                                            <input
                                                                type="tel"
                                                                required
                                                                value={registerForm.emergency_contact_phone}
                                                                onChange={e => setRegisterForm({ ...registerForm, emergency_contact_phone: e.target.value })}
                                                                placeholder="Emergency contact mobile"
                                                                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400/50 text-slate-800 dark:text-slate-200"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* STEP 2: Portal Credentials */}
                                        {registerStep === 2 && (
                                            <div className="space-y-4 animate-fade-in">
                                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Portal Access Credentials</div>

                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Email Address *</label>
                                                    <div className="relative">
                                                        <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                                        <input
                                                            type="email"
                                                            required
                                                            value={registerForm.email}
                                                            onChange={e => {
                                                                setRegisterForm({ ...registerForm, email: e.target.value });
                                                                setRegErrors(prev => ({ ...prev, email: null }));
                                                            }}
                                                            placeholder="you@jagyaconstruction.in"
                                                            className={cn(
                                                                "w-full pl-9 pr-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/50 text-slate-800 dark:text-slate-200",
                                                                regErrors.email ? "border-red-500 bg-red-50 focus:ring-red-500/20" : "border-slate-200 dark:border-slate-700"
                                                            )}
                                                        />
                                                    </div>
                                                    {regErrors.email && (
                                                        <p className="text-xs text-red-500 mt-1 font-semibold">
                                                            {Array.isArray(regErrors.email) ? regErrors.email[0] : regErrors.email}
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Password *</label>
                                                        <div className="relative">
                                                            <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                                            <input
                                                                type={showRegPassword ? "text" : "password"}
                                                                required
                                                                value={registerForm.password}
                                                                onChange={e => setRegisterForm({ ...registerForm, password: e.target.value })}
                                                                placeholder="Min 6 characters"
                                                                className="w-full pl-9 pr-8 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/50 text-slate-800 dark:text-slate-200 font-mono"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => setShowRegPassword(!showRegPassword)}
                                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                                            >
                                                                {showRegPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Confirm Password *</label>
                                                        <div className="relative">
                                                            <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                                            <input
                                                                type={showRegConfirmPassword ? "text" : "password"}
                                                                required
                                                                value={registerForm.password_confirmation}
                                                                onChange={e => setRegisterForm({ ...registerForm, password_confirmation: e.target.value })}
                                                                placeholder="Verify your password"
                                                                className="w-full pl-9 pr-8 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/50 text-slate-800 dark:text-slate-200 font-mono"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                                            >
                                                                {showRegConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                                            </button>
                                                        </div>
                                                        {regErrors.password_confirmation && (
                                                            <p className="text-xs text-red-500 mt-1 font-semibold">{regErrors.password_confirmation[0]}</p>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex gap-2.5 p-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200/50 text-amber-800 dark:text-amber-300">
                                                    <ShieldAlert size={18} className="shrink-0 mt-0.5" />
                                                    <div className="text-xs leading-normal">
                                                        <p className="font-bold">Approval Notice</p>
                                                        <p className="opacity-95 mt-0.5">Your account will remain locked and unusable until an Admin reviews your details, assigns your role/salary/designation, and approves your membership.</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Drawer Footer Actions */}
                            {!regSuccess && (
                                <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between gap-2.5 shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (registerStep > 1) setRegisterStep(registerStep - 1);
                                            else setShowRegisterDrawer(false);
                                        }}
                                        className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                                    >
                                        {registerStep === 1 ? 'Cancel' : 'Back'}
                                    </button>
                                    
                                    {registerStep < 2 ? (
                                        <button
                                            type="button"
                                            onClick={() => setRegisterStep(2)}
                                            className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold transition-all shadow-md"
                                        >
                                            Next Step
                                        </button>
                                    ) : (
                                        <button
                                            type="submit"
                                            disabled={registering}
                                            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 disabled:opacity-60"
                                        >
                                            {registering ? <Loader2 size={13} className="animate-spin" /> : null}
                                            ✓ Submit Registration
                                        </button>
                                    )}
                                </div>
                            )}
                        </form>
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
                    setRegisterForm(prev => ({
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
