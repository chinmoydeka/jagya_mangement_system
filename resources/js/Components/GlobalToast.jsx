import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export const showToast = (type, title, message) => {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('jcms-toast', { detail: { type, title, message } }));
    }
};

export default function GlobalToast() {
    const [toasts, setToasts] = useState([]);

    useEffect(() => {
        const handleToast = (e) => {
            const id = Date.now() + Math.random().toString(36).substr(2, 9);
            const newToast = { id, ...e.detail };
            setToasts(prev => [...prev, newToast]);
            
            // Auto remove after 5 seconds
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id));
            }, 5000);
        };

        window.addEventListener('jcms-toast', handleToast);
        return () => window.removeEventListener('jcms-toast', handleToast);
    }, []);

    const removeToast = (id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    if (toasts.length === 0) return null;

    return (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
            {toasts.map(toast => {
                const isError = toast.type === 'error';
                const isWarning = toast.type === 'warning';
                
                const Icon = isError ? AlertTriangle : isWarning ? AlertTriangle : CheckCircle2;
                const iconColor = isError ? 'text-red-500' : isWarning ? 'text-amber-500' : 'text-emerald-500';
                const borderColor = isError ? 'border-red-500/30' : isWarning ? 'border-amber-500/30' : 'border-emerald-500/30';
                const titleColor = isError ? 'text-red-400' : isWarning ? 'text-amber-400' : 'text-emerald-400';

                return (
                    <div key={toast.id} className={cn(
                        "max-w-md w-full bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border flex gap-3 animate-slide-up pointer-events-auto",
                        borderColor
                    )}>
                        <Icon className={cn("shrink-0 mt-0.5", iconColor)} size={18} />
                        <div className="flex-1 pr-2">
                            {toast.title && <p className={cn("font-semibold text-xs uppercase tracking-wider", titleColor)}>{toast.title}</p>}
                            <p className="text-xs text-slate-300 mt-1">{toast.message}</p>
                        </div>
                        <button type="button" onClick={() => removeToast(toast.id)} className="text-slate-400 hover:text-white shrink-0 self-start transition-colors">
                            <X size={14} />
                        </button>
                    </div>
                );
            })}
        </div>
    );
}
