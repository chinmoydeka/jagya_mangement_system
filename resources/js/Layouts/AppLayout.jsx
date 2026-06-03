import React, { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import {
    LayoutDashboard,
    Building2,
    Users,
    Phone,
    Settings,
    ChevronRight,
    Bell,
    Search,
    LogOut,
    Menu,
    ChevronDown,
    Shield,
    UserCircle2,
    FolderOpen,
} from 'lucide-react';
import JcmsLogo from '@/Components/JcmsLogo';
import GlobalToast from '@/Components/GlobalToast';
import { cn } from '@/lib/utils';

const navItems = [
    {
        label: 'Dashboard',
        icon: LayoutDashboard,
        href: '/dashboard',
        key: 'dashboard',
    },
    {
        label: 'Clients',
        icon: UserCircle2,
        href: '/clients',
        key: 'clients',
    },
    {
        label: 'Projects',
        icon: Building2,
        href: '/projects',
        key: 'projects',
    },
    {
        label: 'Team Members',
        icon: Users,
        href: '/team',
        key: 'team',
    },
    {
        label: 'Front Office',
        icon: Phone,
        href: '/front-office',
        key: 'front-office',
    },
    {
        label: 'File Manager',
        icon: FolderOpen,
        href: '/file-manager',
        key: 'file-manager',
    },
    {
        label: 'Settings',
        icon: Settings,
        key: 'settings',
        children: [
            { label: 'App Settings', href: '/settings/app', key: 'settings-app' },
            { label: 'Access & Permissions', href: '/settings/access', key: 'settings-access', icon: Shield },
        ],
    },
];

function NavItem({ item, isCollapsed, currentPath }) {
    const [open, setOpen] = useState(false);
    const Icon = item.icon;
    const isActive = item.href
        ? currentPath === item.href
        : item.children?.some((c) => currentPath === c.href);

    if (item.children) {
        return (
            <div>
                <button
                    onClick={() => setOpen(!open)}
                    className={cn(
                        'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group',
                        isActive
                            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                    )}
                >
                    <Icon size={18} className="shrink-0" />
                    {!isCollapsed && (
                        <>
                            <span className="flex-1 text-left">{item.label}</span>
                            <ChevronDown
                                size={14}
                                className={cn('transition-transform duration-200', open && 'rotate-180')}
                            />
                        </>
                    )}
                </button>
                {!isCollapsed && open && (
                    <div className="ml-4 mt-1 space-y-1 border-l-2 border-slate-200 dark:border-slate-700 pl-3">
                        {item.children.map((child) => {
                            const ChildIcon = child.icon;
                            const childActive = currentPath === child.href;
                            return (
                                <Link
                                    key={child.key}
                                    href={child.href}
                                    className={cn(
                                        'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                                        childActive
                                            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                                            : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200'
                                    )}
                                >
                                    {ChildIcon && <ChildIcon size={14} />}
                                    {child.label}
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    }

    return (
        <Link
            href={item.href}
            className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group',
                isActive
                    ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
            )}
        >
            <Icon size={18} className="shrink-0" />
            {!isCollapsed && <span>{item.label}</span>}
            {isActive && !isCollapsed && (
                <ChevronRight size={14} className="ml-auto opacity-60" />
            )}
        </Link>
    );
}

export default function AppLayout({ children, title }) {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileOpen, setMobileOpen] = useState(false);
    const { auth } = usePage().props;
    const currentPath = window.location.pathname;

    return (
        <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
            <GlobalToast />
            {/* Mobile Overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    'fixed lg:relative z-50 lg:z-auto flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 ease-in-out',
                    sidebarOpen ? 'w-64' : 'w-16',
                    mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                )}
            >
                {/* Sidebar Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 min-h-[64px]">
                    {sidebarOpen ? (
                        <JcmsLogo size={36} />
                    ) : (
                        <JcmsLogo size={32} iconOnly className="mx-auto" />
                    )}
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="hidden lg:flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 transition-colors"
                    >
                        <Menu size={16} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto p-3 space-y-1">
                    {navItems.map((item) => (
                        <NavItem
                            key={item.key}
                            item={item}
                            isCollapsed={!sidebarOpen}
                            currentPath={currentPath}
                        />
                    ))}
                </nav>

                {/* User Profile */}
                <div className="p-3 border-t border-slate-200 dark:border-slate-800">
                    <div className={cn('flex items-center gap-3 px-2 py-2 rounded-xl', sidebarOpen && 'bg-slate-50 dark:bg-slate-800/50')}>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-red-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {auth?.user?.name?.charAt(0) || 'A'}
                        </div>
                        {sidebarOpen && (
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                                    {auth?.user?.name || 'Admin User'}
                                </p>
                                <p className="text-xs text-slate-500 truncate">
                                    {auth?.user?.role || 'Super Admin'}
                                </p>
                            </div>
                        )}
                        {sidebarOpen && (
                            <Link
                                href="/logout"
                                method="post"
                                as="button"
                                className="text-slate-400 hover:text-red-500 transition-colors"
                                title="Logout"
                            >
                                <LogOut size={16} />
                            </Link>
                        )}
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden min-w-0">
                {/* Top Bar */}
                <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center gap-4 px-4 lg:px-6 shrink-0">
                    <button
                        className="lg:hidden text-slate-500 hover:text-slate-700"
                        onClick={() => setMobileOpen(true)}
                    >
                        <Menu size={20} />
                    </button>

                    {/* Search */}
                    <div className="flex-1 max-w-md relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search projects, clients..."
                            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-100 dark:bg-slate-800 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/50 text-slate-700 dark:text-slate-300 placeholder-slate-400"
                        />
                    </div>

                    <div className="flex items-center gap-2 ml-auto">
                        {/* Notifications */}
                        <button className="relative w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                            <Bell size={18} />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
                        </button>

                        {/* Avatar */}
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-red-500 flex items-center justify-center text-white text-sm font-bold">
                            {auth?.user?.name?.charAt(0) || 'A'}
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto">
                    <div className="p-4 lg:p-6 animate-fade-in">
                        {title && (
                            <div className="mb-6">
                                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                    {title}
                                </h1>
                            </div>
                        )}
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
