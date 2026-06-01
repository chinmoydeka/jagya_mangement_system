import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import {
    Settings,
    Building2,
    Globe,
    Palette,
    Bell,
    Database,
    Mail,
    Save,
    ChevronRight,
} from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { cn } from '@/lib/utils';

const sections = [
    { id: 'general', label: 'General', icon: Building2 },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'email', label: 'Email & SMTP', icon: Mail },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'system', label: 'System', icon: Database },
];

function Toggle({ checked, onChange }) {
    return (
        <button
            role="switch"
            aria-checked={checked}
            onClick={() => onChange(!checked)}
            className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none',
                checked ? 'bg-amber-500' : 'bg-slate-200 dark:bg-slate-700'
            )}
        >
            <span
                className={cn(
                    'inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-200',
                    checked ? 'translate-x-6' : 'translate-x-1'
                )}
            />
        </button>
    );
}

export default function AppSettings() {
    const [activeSection, setActiveSection] = useState('general');
    const [saved, setSaved] = useState(false);

    const [settings, setSettings] = useState({
        companyName: 'Jagya Construction Pvt Ltd',
        tagline: "Assam's Largest Residential Home Builder",
        email: 'info@jagya.com',
        phone: '+91 98765 43210',
        address: 'Dispur, Guwahati, Assam - 781006',
        website: 'www.jagya.com',
        currency: 'INR',
        timezone: 'Asia/Kolkata',
        dateFormat: 'DD/MM/YYYY',
        emailNotifications: true,
        smsNotifications: false,
        projectAlerts: true,
        teamAlerts: true,
        systemUpdates: true,
        smtpHost: 'smtp.gmail.com',
        smtpPort: '587',
        smtpUser: 'noreply@jagya.com',
        smtpPass: '',
        primaryColor: '#f59e0b',
        darkMode: false,
        compactMode: false,
    });

    function update(key, value) {
        setSettings(prev => ({ ...prev, [key]: value }));
    }

    function handleSave() {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    }

    return (
        <AppLayout>
            <Head title="App Settings" />

            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">App Settings</h1>
                <p className="text-sm text-slate-500 mt-0.5">Configure JCMS system settings</p>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Sidebar */}
                <div className="lg:w-60 shrink-0">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-2 space-y-1">
                        {sections.map((s) => {
                            const Icon = s.icon;
                            return (
                                <button
                                    key={s.id}
                                    onClick={() => setActiveSection(s.id)}
                                    className={cn(
                                        'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                                        activeSection === s.id
                                            ? 'text-white shadow-md'
                                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                    )}
                                    style={activeSection === s.id ? { background: 'linear-gradient(135deg, #f59e0b, #dc2626)' } : {}}
                                >
                                    <Icon size={16} />
                                    {s.label}
                                    {activeSection !== s.id && <ChevronRight size={14} className="ml-auto opacity-40" />}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <div className="p-6 space-y-6">
                        {activeSection === 'general' && (
                            <>
                                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">General Settings</h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {[
                                        { key: 'companyName', label: 'Company Name', type: 'text' },
                                        { key: 'tagline', label: 'Tagline', type: 'text' },
                                        { key: 'email', label: 'Contact Email', type: 'email' },
                                        { key: 'phone', label: 'Phone Number', type: 'tel' },
                                        { key: 'website', label: 'Website', type: 'text' },
                                        { key: 'currency', label: 'Currency', type: 'select', options: ['INR', 'USD', 'EUR'] },
                                        { key: 'timezone', label: 'Timezone', type: 'select', options: ['Asia/Kolkata', 'UTC'] },
                                        { key: 'dateFormat', label: 'Date Format', type: 'select', options: ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'] },
                                    ].map(field => (
                                        <div key={field.key} className={field.key === 'address' ? 'sm:col-span-2' : ''}>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{field.label}</label>
                                            {field.type === 'select' ? (
                                                <select
                                                    value={settings[field.key]}
                                                    onChange={(e) => update(field.key, e.target.value)}
                                                    className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/50 text-slate-800 dark:text-slate-200"
                                                >
                                                    {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                </select>
                                            ) : (
                                                <input
                                                    type={field.type}
                                                    value={settings[field.key]}
                                                    onChange={(e) => update(field.key, e.target.value)}
                                                    className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/50 text-slate-800 dark:text-slate-200"
                                                />
                                            )}
                                        </div>
                                    ))}
                                    <div className="sm:col-span-2">
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Address</label>
                                        <textarea
                                            value={settings.address}
                                            onChange={(e) => update('address', e.target.value)}
                                            rows={2}
                                            className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/50 text-slate-800 dark:text-slate-200 resize-none"
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        {activeSection === 'notifications' && (
                            <>
                                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Notification Preferences</h2>
                                <div className="space-y-4">
                                    {[
                                        { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive notifications via email' },
                                        { key: 'smsNotifications', label: 'SMS Notifications', desc: 'Receive notifications via SMS' },
                                        { key: 'projectAlerts', label: 'Project Alerts', desc: 'Get alerts for project status changes' },
                                        { key: 'teamAlerts', label: 'Team Alerts', desc: 'Get alerts for team member activities' },
                                        { key: 'systemUpdates', label: 'System Updates', desc: 'Receive system maintenance notifications' },
                                    ].map(item => (
                                        <div key={item.key} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800">
                                            <div>
                                                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{item.label}</p>
                                                <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                                            </div>
                                            <Toggle
                                                checked={settings[item.key]}
                                                onChange={(v) => update(item.key, v)}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        {activeSection === 'email' && (
                            <>
                                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Email & SMTP</h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {[
                                        { key: 'smtpHost', label: 'SMTP Host' },
                                        { key: 'smtpPort', label: 'SMTP Port' },
                                        { key: 'smtpUser', label: 'SMTP Username' },
                                        { key: 'smtpPass', label: 'SMTP Password', type: 'password' },
                                    ].map(field => (
                                        <div key={field.key}>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{field.label}</label>
                                            <input
                                                type={field.type || 'text'}
                                                value={settings[field.key]}
                                                onChange={(e) => update(field.key, e.target.value)}
                                                className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/50 text-slate-800 dark:text-slate-200"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        {activeSection === 'appearance' && (
                            <>
                                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Appearance</h2>
                                <div className="space-y-4">
                                    {[
                                        { key: 'darkMode', label: 'Dark Mode', desc: 'Enable dark theme across the system' },
                                        { key: 'compactMode', label: 'Compact Mode', desc: 'Use a more compact layout for dense information' },
                                    ].map(item => (
                                        <div key={item.key} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800">
                                            <div>
                                                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{item.label}</p>
                                                <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                                            </div>
                                            <Toggle checked={settings[item.key]} onChange={(v) => update(item.key, v)} />
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        {activeSection === 'system' && (
                            <>
                                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">System</h2>
                                <div className="space-y-3">
                                    {[
                                        { label: 'Clear Cache', desc: 'Clear application cache', action: 'Clear', variant: 'amber' },
                                        { label: 'Database Backup', desc: 'Create a backup of your database', action: 'Backup', variant: 'blue' },
                                        { label: 'Factory Reset', desc: 'Reset all settings to default', action: 'Reset', variant: 'red' },
                                    ].map(item => (
                                        <div key={item.label} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800">
                                            <div>
                                                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{item.label}</p>
                                                <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                                            </div>
                                            <button className={cn(
                                                'px-4 py-2 rounded-xl text-xs font-semibold transition-all',
                                                item.variant === 'red' ? 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400' :
                                                item.variant === 'blue' ? 'bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400' :
                                                'bg-amber-50 text-amber-600 hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-400'
                                            )}>
                                                {item.action}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end px-6 pb-6">
                        <button
                            onClick={handleSave}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
                            style={{ background: saved ? '#10b981' : 'linear-gradient(135deg, #f59e0b, #dc2626)', boxShadow: '0 4px 14px rgba(245,158,11,0.3)' }}
                        >
                            <Save size={16} />
                            {saved ? 'Saved!' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
