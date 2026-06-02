import React, { useRef, useState } from 'react';
import { Button } from '@mui/material';
import { Upload, X, FileText, AlertCircle, File, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import FileSelectorModal from '@/Components/FileSelectorModal';

export default function WizardStep2({ data, update }) {
    const fileRef = useRef();
    const [showFileSelector, setShowFileSelector] = useState(false);

    // Handle Local File Uploads
    function handleLocalFiles(e) {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;
        const newDocs = files.map(file => ({
            id: `doc_${Date.now()}_${Math.random()}`,
            file,
            name: file.name.replace(/\.[^.]+$/, ''),
            description: '',
            category: 'general',
            file_type: file.type,
            file_size: file.size,
        }));
        update({ documents: [...data.documents, ...newDocs] });
        e.target.value = '';
    }

    // Handle selected manager assets
    function handleFileSelectorSelect(selectedFiles) {
        const filesArray = Array.isArray(selectedFiles) ? selectedFiles : [selectedFiles];
        const newDocs = filesArray.map(file => ({
            id: `doc_${Date.now()}_${Math.random()}`,
            media_file_id: file.id,
            file: null,
            name: file.name.replace(/\.[^.]+$/, ''),
            description: '',
            category: 'general',
            file_type: file.file_type || file.mime_type || 'document',
            file_size: file.file_size,
        }));
        update({ documents: [...data.documents, ...newDocs] });
    }

    // Deselect document
    function removeDoc(id) {
        update({ documents: data.documents.filter(d => d.id !== id) });
    }

    // Modify document name or description
    function updateDoc(id, field, value) {
        update({
            documents: data.documents.map(d => d.id === id ? { ...d, [field]: value } : d)
        });
    }

    // Helper: format bytes
    function formatSize(bytes) {
        if (!bytes) return '0 B';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }

    // Helper: dynamic category parser
    function getDocIconInfo(doc) {
        const type = doc.file_type || '';
        if (type.includes('pdf') || type === 'pdf') {
            return { ext: 'PDF', color: 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400' };
        }
        if (type.includes('image') || type === 'image') {
            return { ext: 'IMG', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' };
        }
        if (type.includes('sheet') || type.includes('excel') || type === 'spreadsheet') {
            return { ext: 'XLS', color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-400' };
        }
        if (type.includes('word') || type.includes('document') || type === 'document') {
            return { ext: 'DOC', color: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400' };
        }
        return { ext: 'FILE', color: 'bg-slate-100 text-slate-655 dark:bg-slate-800 dark:text-slate-400' };
    }

    return (
        <div className="p-6 space-y-6">
            {/* Recommendation Banner */}
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 shadow-sm shrink-0">
                <AlertCircle size={16} className="text-amber-600 mt-0.5 shrink-0" />
                <div>
                    <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">Recommended Document</p>
                    <p className="text-xs text-amber-600/80 dark:text-amber-400/70 mt-0.5 leading-relaxed">
                        Client Agreement Copy or Contract Copy is strongly recommended for all client projects.
                    </p>
                </div>
            </div>

            {/* Compact Actions Selector Row */}
            <div className="bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm shrink-0">
                <div className="text-center sm:text-left">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-250">Attach Project Documents</h3>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">Upload a new file from your device or browse the JCMS Drive</p>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto shrink-0 justify-center">
                    {/* Hidden input for local file selector */}
                    <input
                        ref={fileRef}
                        type="file"
                        multiple
                        className="hidden"
                        onChange={handleLocalFiles}
                        accept=".pdf,.docx,.xlsx,.jpg,.jpeg,.png"
                    />

                    {/* Local File upload trigger */}
                    {/* <Button
                        variant="outlined"
                        onClick={() => fileRef.current?.click()}
                        className="border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-350 hover:bg-slate-100"
                        style={{
                            textTransform: 'none',
                            borderRadius: '12px',
                            fontWeight: 'bold',
                            fontSize: '12px',
                            padding: '8px 16px',
                        }}
                        startIcon={<Upload size={14} className="text-amber-500" />}
                    >
                        Upload Local
                    </Button> */}

                    {/* File Selector modal trigger */}
                    <Button
                        variant="contained"
                        onClick={() => setShowFileSelector(true)}
                        className="text-white hover:bg-amber-600"
                        style={{
                            textTransform: 'none',
                            borderRadius: '12px',
                            fontWeight: 'bold',
                            fontSize: '12px',
                            padding: '8px 16px',
                            background: 'linear-gradient(135deg, #f59e0b, #dc2626)',
                        }}
                        startIcon={<FolderOpen size={14} />}
                    >
                        Browse Drive
                    </Button>
                </div>
            </div>

            {/* Selected Documents Section */}
            {data.documents.length > 0 && (
                <div className="space-y-3.5">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        {data.documents.length} document{data.documents.length !== 1 ? 's' : ''} added
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {data.documents.map(doc => {
                            const isLocal = !!doc.file;
                            const iconInfo = getDocIconInfo(doc);

                            return (
                                <div key={doc.id} className="bg-slate-50/30 dark:bg-slate-900/10 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 relative shadow-sm hover:shadow-md transition-all">
                                    {/* Deselect trigger */}
                                    <button
                                        onClick={() => removeDoc(doc.id)}
                                        className="absolute top-3 right-3 w-7 h-7 rounded-xl flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-55 dark:hover:bg-red-500/10 transition-colors"
                                        title="Remove document"
                                    >
                                        <X size={14} />
                                    </button>

                                    <div className="flex items-start gap-3 mb-3 pr-6">
                                        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-[10px] font-extrabold shrink-0', iconInfo.color)}>
                                            {iconInfo.ext}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                                                {doc.file?.name || doc.name}
                                            </p>
                                            <p className="text-[10px] text-slate-400 mt-0.5 font-semibold">
                                                {isLocal ? 'Local Attachment' : 'Drive Asset'} • {formatSize(doc.file_size)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Document Customizer fields */}
                                    <div className="space-y-2">
                                        <select
                                            value={doc.category || 'general'}
                                            onChange={e => updateDoc(doc.id, 'category', e.target.value)}
                                            className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-slate-800 dark:text-slate-200 font-semibold"
                                        >
                                            <option value="general">General Document</option>
                                            <option value="agreement">Project Agreement</option>
                                            <option value="kyc">KYC Document</option>
                                        </select>
                                        <input
                                            type="text"
                                            value={doc.name}
                                            onChange={e => updateDoc(doc.id, 'name', e.target.value)}
                                            placeholder="Document name *"
                                            className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 font-semibold"
                                        />
                                        <input
                                            type="text"
                                            value={doc.description}
                                            onChange={e => updateDoc(doc.id, 'description', e.target.value)}
                                            placeholder="Description (optional)"
                                            className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 font-semibold"
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {data.documents.length === 0 && (
                <div className="text-center py-8 text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl shrink-0 bg-slate-50/10 dark:bg-slate-900/10">
                    <File size={26} className="mx-auto mb-2 opacity-30" />
                    <p className="text-xs font-semibold">No documents selected yet. You can skip this step.</p>
                </div>
            )}

            {/* Upgraded High-Fidelity GDrive Style File Selector Modal */}
            <FileSelectorModal
                isOpen={showFileSelector}
                onClose={() => setShowFileSelector(false)}
                onSelect={handleFileSelectorSelect}
                multiple={true}
                title="Google Drive Document Selector"
            />
        </div>
    );
}
