import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { Eye, EyeOff, Lock, Mail, Building2 } from 'lucide-react';
import JcmsLogo from '@/Components/JcmsLogo';

export default function Login() {
    const [showPassword, setShowPassword] = useState(false);
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    function submit(e) {
        e.preventDefault();
        post('/login');
    }

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
                        <JcmsLogo size={56} className="mb-12" />

                        <div className="max-w-sm text-center space-y-4">
                            <h2 className="text-3xl font-bold leading-tight">
                                Assam's Largest
                                <br />
                                <span style={{
                                    background: 'linear-gradient(135deg, #f59e0b, #dc2626)',
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
                                            background: 'linear-gradient(135deg, #f59e0b, #dc2626)',
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

                        {/* Demo Credentials Box */}
                        <div className="rounded-xl p-4 border border-amber-500/20"
                            style={{ background: 'rgba(245,158,11,0.06)' }}>
                            <p className="text-xs font-semibold text-amber-500 mb-2">Demo Credentials</p>
                            <div className="space-y-1">
                                <p className="text-xs text-slate-400">Email: <span className="text-slate-300 font-mono">admin@jagya.com</span></p>
                                <p className="text-xs text-slate-400">Password: <span className="text-slate-300 font-mono">password</span></p>
                            </div>
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
                                        placeholder="admin@jagya.com"
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
                                    background: 'linear-gradient(135deg, #f59e0b, #dc2626)',
                                    boxShadow: '0 4px 20px rgba(245,158,11,0.3)',
                                }}
                            >
                                <span className="relative z-10">
                                    {processing ? 'Signing in...' : 'Sign in to JCMS'}
                                </span>
                                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors" />
                            </button>
                        </form>

                        <p className="text-center text-xs text-slate-600 mt-8">
                            © 2024 Jagya Construction Management System. All rights reserved.
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
