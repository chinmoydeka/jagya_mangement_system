import React, { useRef } from 'react';
import { Upload, X, FileText, AlertCircle, File } from 'lucide-react';
import { cn } from '@/lib/utils';

const ALLOWED = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'image/jpeg', 'image/png'];

const EXT_ICONS = {
    'application/pdf': { ext: 'PDF', color: 'bg-red-100 text-red-700' },
    'image/jpeg': { ext: 'IMG', color: 'bg-blue-100 text-blue-700' },
    'image/png': { ext: 'IMG', color: 'bg-blue-100 text-blue-700' },
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { ext: 'DOC', color: 'bg-indigo-100 text-indigo-700' },
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { ext: 'XLS', color: 'bg-green-100 text-green-700' },
};

const inputCls = `w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200
    dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/50
    text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500`;

export default function WizardStep2({ data, update }) {
    const fileRef = useRef();

    function handleFiles(e) {
        const files = Array.from(e.target.files);
        const newDocs = files.map(file => ({
            id: `doc_${Date.now()}_${Math.random()}`,
            file,
            name: file.name.replace(/\.[^.]+$/, ''),
            description: '',
            file_type: file.type,
            file_size: file.size,
        }));
        update({ documents: [...data.documents, ...newDocs] });
        e.target.value = '';
    }

    function removeDoc(id) {
        update({ documents: data.documents.filter(d => d.id !== id) });
    }

    function updateDoc(id, field, value) {
        update({
            documents: data.documents.map(d => d.id === id ? { ...d, [field]: value } : d)
        });
    }

    function formatSize(bytes) {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }

    return (
        <div className="p-6 space-y-6">
            {/* Recommendation Banner */}
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20">
                <AlertCircle size={16} className="text-amber-600 mt-0.5 shrink-0" />
                <div>
                    <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">Recommended Document</p>
                    <p className="text-xs text-amber-600/80 dark:text-amber-400/70 mt-0.5">
                        Client Agreement Copy or Contract Copy is strongly recommended for all client projects.
                    </p>
                </div>
            </div>

            {/* Upload Zone */}
            <div
                className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-8 text-center cursor-pointer hover:border-amber-400 hover:bg-amber-50/30 dark:hover:bg-amber-500/5 transition-all group"
                onClick={() => fileRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => {
                    e.preventDefault();
                    const fake = { target: { files: e.dataTransfer.files, value: '' } };
                    handleFiles(fake);
                }}
            >
                <input ref={fileRef} type="file" multiple className="hidden" onChange={handleFiles}
                    accept=".pdf,.docx,.xlsx,.jpg,.jpeg,.png" />
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 group-hover:bg-amber-100 dark:group-hover:bg-amber-500/15 flex items-center justify-center mx-auto mb-3 transition-colors">
                    <Upload size={22} className="text-slate-400 group-hover:text-amber-600" />
                </div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Click or drag files here to upload
                </p>
                <p className="text-xs text-slate-400 mt-1">PDF, DOCX, XLSX, JPG, PNG supported</p>
            </div>

            {/* Uploaded Files */}
            {data.documents.length > 0 && (
                <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        {data.documents.length} document{data.documents.length !== 1 ? 's' : ''} added
                    </h4>
                    {data.documents.map(doc => {
                        const iconInfo = EXT_ICONS[doc.file_type] || { ext: 'FILE', color: 'bg-slate-100 text-slate-600' };
                        return (
                            <div key={doc.id} className="bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
                                <div className="flex items-start gap-3 mb-3">
                                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold shrink-0', iconInfo.color)}>
                                        {iconInfo.ext}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-slate-400 truncate">{doc.file?.name}</p>
                                        <p className="text-xs text-slate-400">{formatSize(doc.file_size)}</p>
                                    </div>
                                    <button onClick={() => removeDoc(doc.id)} className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                                        <X size={14} />
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    <input
                                        type="text"
                                        value={doc.name}
                                        onChange={e => updateDoc(doc.id, 'name', e.target.value)}
                                        placeholder="Document name *"
                                        className={`w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/50 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500`}
                                    />
                                    <input
                                        type="text"
                                        value={doc.description}
                                        onChange={e => updateDoc(doc.id, 'description', e.target.value)}
                                        placeholder="Description (optional)"
                                        className={`w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/50 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500`}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {data.documents.length === 0 && (
                <div className="text-center py-4 text-slate-400">
                    <File size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No documents added yet. You can skip this step.</p>
                </div>
            )}
        </div>
    );
}
