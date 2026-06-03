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
    Briefcase,
    Plus,
    Trash2,
    Loader2,
} from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { cn } from '@/lib/utils';
import axios from 'axios';

const sections = [
    { id: 'general', label: 'General', icon: Building2 },
    { id: 'organization', label: 'Organization Settings', icon: Briefcase },
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

export default function AppSettings({ departments = [], designations = [], offices = [] }) {
    const [activeSection, setActiveSection] = useState('general');
    const [saved, setSaved] = useState(false);

    // Organization details state
    const [localDepts, setLocalDepts] = useState(departments);
    const [localDesigs, setLocalDesigs] = useState(designations);
    const [localOffices, setLocalOffices] = useState(offices);

    const [newDeptName, setNewDeptName] = useState('');
    const [newDesigName, setNewDesigName] = useState('');
    const [newOfficeName, setNewOfficeName] = useState('');

    const [processingDept, setProcessingDept] = useState(false);
    const [processingDesig, setProcessingDesig] = useState(false);
    const [processingOffice, setProcessingOffice] = useState(false);

    const handleAddDept = async (e) => {
        e.preventDefault();
        if (!newDeptName.trim()) return;
        setProcessingDept(true);
        try {
            const res = await axios.post('/departments', { name: newDeptName.trim() });
            if (res.data.success) {
                setLocalDepts([...localDepts, res.data.department]);
                setNewDeptName('');
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to add department');
        } finally {
            setProcessingDept(false);
        }
    };

    const handleDeleteDept = async (id) => {
        if (!confirm('Are you sure you want to delete this department?')) return;
        try {
            const res = await axios.delete(`/departments/${id}`);
            if (res.data.success) {
                setLocalDepts(localDepts.filter(d => d.id !== id));
            }
        } catch (err) {
            alert('Failed to delete department');
        }
    };

    const handleAddDesig = async (e) => {
        e.preventDefault();
        if (!newDesigName.trim()) return;
        setProcessingDesig(true);
        try {
            const res = await axios.post('/designations', { name: newDesigName.trim() });
            if (res.data.success) {
                setLocalDesigs([...localDesigs, res.data.designation]);
                setNewDesigName('');
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to add designation');
        } finally {
            setProcessingDesig(false);
        }
    };

    const handleDeleteDesig = async (id) => {
        if (!confirm('Are you sure you want to delete this designation?')) return;
        try {
            const res = await axios.delete(`/designations/${id}`);
            if (res.data.success) {
                setLocalDesigs(localDesigs.filter(d => d.id !== id));
            }
        } catch (err) {
            alert('Failed to delete designation');
        }
    };

    const handleAddOffice = async (e) => {
        e.preventDefault();
        if (!newOfficeName.trim()) return;
        setProcessingOffice(true);
        try {
            const res = await axios.post('/offices', { name: newOfficeName.trim() });
            if (res.data.success) {
                setLocalOffices([...localOffices, res.data.office]);
                setNewOfficeName('');
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to add office');
        } finally {
            setProcessingOffice(false);
        }
    };

    const handleDeleteOffice = async (id) => {
        if (!confirm('Are you sure you want to delete this office?')) return;
        try {
            const res = await axios.delete(`/offices/${id}`);
            if (res.data.success) {
                setLocalOffices(localOffices.filter(o => o.id !== id));
            }
        } catch (err) {
            alert('Failed to delete office');
        }
    };

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

                        {activeSection === 'organization' && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Organization Settings</h2>
                                    <p className="text-sm text-slate-500 mt-0.5">Manage departments, job designations, and office locations dynamically.</p>
                                </div>

                                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                                    {/* Departments Card */}
                                    <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-4 flex flex-col h-[400px]">
                                        <div className="font-bold text-xs text-slate-400 uppercase tracking-wider mb-3">Departments ({localDepts.length})</div>
                                        <form onSubmit={handleAddDept} className="flex gap-2 mb-3">
                                            <input
                                                type="text"
                                                required
                                                placeholder="New Department..."
                                                value={newDeptName}
                                                onChange={e => setNewDeptName(e.target.value)}
                                                className="flex-1 px-3 py-2 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-slate-800 dark:text-slate-200"
                                            />
                                            <button
                                                type="submit"
                                                disabled={processingDept}
                                                className="p-2 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-500/50 text-white rounded-xl transition-all"
                                            >
                                                {processingDept ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                                            </button>
                                        </form>
                                        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                                            {localDepts.map(dept => (
                                                <div key={dept.id} className="flex items-center justify-between px-3 py-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/50 rounded-xl">
                                                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{dept.name}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteDept(dept.id)}
                                                        className="text-slate-400 hover:text-red-500 transition-colors p-1"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            ))}
                                            {localDepts.length === 0 && (
                                                <div className="text-center text-slate-400 text-xs py-8">No departments added</div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Designations Card */}
                                    <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-4 flex flex-col h-[400px]">
                                        <div className="font-bold text-xs text-slate-400 uppercase tracking-wider mb-3">Designations ({localDesigs.length})</div>
                                        <form onSubmit={handleAddDesig} className="flex gap-2 mb-3">
                                            <input
                                                type="text"
                                                required
                                                placeholder="New Designation..."
                                                value={newDesigName}
                                                onChange={e => setNewDesigName(e.target.value)}
                                                className="flex-1 px-3 py-2 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-slate-800 dark:text-slate-200"
                                            />
                                            <button
                                                type="submit"
                                                disabled={processingDesig}
                                                className="p-2 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-500/50 text-white rounded-xl transition-all"
                                            >
                                                {processingDesig ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                                            </button>
                                        </form>
                                        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                                            {localDesigs.map(desig => (
                                                <div key={desig.id} className="flex items-center justify-between px-3 py-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/50 rounded-xl">
                                                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{desig.name}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteDesig(desig.id)}
                                                        className="text-slate-400 hover:text-red-500 transition-colors p-1"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            ))}
                                            {localDesigs.length === 0 && (
                                                <div className="text-center text-slate-400 text-xs py-8">No designations added</div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Offices Card */}
                                    <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-4 flex flex-col h-[400px]">
                                        <div className="font-bold text-xs text-slate-400 uppercase tracking-wider mb-3">Office Locations ({localOffices.length})</div>
                                        <form onSubmit={handleAddOffice} className="flex gap-2 mb-3">
                                            <input
                                                type="text"
                                                required
                                                placeholder="New Office..."
                                                value={newOfficeName}
                                                onChange={e => setNewOfficeName(e.target.value)}
                                                className="flex-1 px-3 py-2 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-slate-800 dark:text-slate-200"
                                            />
                                            <button
                                                type="submit"
                                                disabled={processingOffice}
                                                className="p-2 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-500/50 text-white rounded-xl transition-all"
                                            >
                                                {processingOffice ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                                            </button>
                                        </form>
                                        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                                            {localOffices.map(off => (
                                                <div key={off.id} className="flex items-center justify-between px-3 py-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/50 rounded-xl">
                                                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{off.name}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteOffice(off.id)}
                                                        className="text-slate-400 hover:text-red-500 transition-colors p-1"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            ))}
                                            {localOffices.length === 0 && (
                                                <div className="text-center text-slate-400 text-xs py-8">No offices added</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
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
