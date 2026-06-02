import React, { useState, useEffect, useRef } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Card,
    CardContent,
    CardActionArea,
    Typography,
    CircularProgress,
    InputAdornment,
    Chip,
    IconButton,
} from '@mui/material';
import {
    Folder,
    FileText,
    File,
    Image as ImageIcon,
    FileSpreadsheet,
    FileArchive,
    Music,
    Search,
    ChevronRight,
    UploadCloud,
    X,
    Check,
    HardDrive,
    Cloud,
    CornerUpLeft,
} from 'lucide-react';
import axios from 'axios';
import { cn } from '@/lib/utils';
import JcmsLogo from '@/Components/JcmsLogo';

export default function FileSelectorModal({
    isOpen,
    onClose,
    onSelect,
    multiple = false,
    allowedTypes = [], // e.g. ['image', 'pdf', 'spreadsheet']
}) {
    // Navigational & Listing State
    const [currentFolderId, setCurrentFolderId] = useState(null);
    const [folders, setFolders] = useState([]);
    const [files, setFiles] = useState([]);
    const [breadcrumbs, setBreadcrumbs] = useState([]);
    const [loading, setLoading] = useState(false);

    // Filter & Search State
    const [searchTerm, setSearchTerm] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTypeFilter, setActiveTypeFilter] = useState('');

    // Selection State
    const [selectedItems, setSelectedItems] = useState([]); // Array of file objects

    // Upload State
    const [showUploadInline, setShowUploadInline] = useState(false);
    const [uploadFiles, setUploadFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef();

    // Typing placeholder animation for "Search for files..."
    const targetText = "Search for files...";
    const [placeholderText, setPlaceholderText] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        let timer;
        
        if (isDeleting) {
            timer = setTimeout(() => {
                setPlaceholderText(prev => prev.substring(0, prev.length - 1));
            }, 40); // Faster deletion
        } else {
            timer = setTimeout(() => {
                setPlaceholderText(prev => targetText.substring(0, prev.length + 1));
            }, 80); // Typing speed
        }

        if (!isDeleting && placeholderText === targetText) {
            timer = setTimeout(() => setIsDeleting(true), 3000); // Wait at full text
        } else if (isDeleting && placeholderText === "") {
            timer = setTimeout(() => setIsDeleting(false), 500); // Pause before restarting
        }

        return () => clearTimeout(timer);
    }, [placeholderText, isDeleting]);

    // Debounce recursive search typing
    useEffect(() => {
        const handler = setTimeout(() => {
            setSearchQuery(searchTerm);
        }, 300);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    // Fetch directory assets from media controller
    const fetchAssets = async (folderId, search, type) => {
        setLoading(true);
        try {
            const params = {
                folder_id: folderId || '',
                search: search || '',
                type: type || ''
            };
            const response = await axios.get('/file-manager', {
                params,
                headers: { 'Accept': 'application/json' }
            });
            
            setFolders(response.data.folders || []);
            
            let fetchedFiles = response.data.files || [];
            
            // Local filter by type to guarantee tabs work
            if (type) {
                fetchedFiles = fetchedFiles.filter(f => f.file_type === type);
            }

            // Filter files by allowedTypes if specified
            if (allowedTypes && allowedTypes.length > 0) {
                fetchedFiles = fetchedFiles.filter(f => allowedTypes.includes(f.file_type));
            }
            setFiles(fetchedFiles);
            setBreadcrumbs(response.data.breadcrumbs || []);
            setCurrentFolderId(response.data.current_folder_id);
        } catch (err) {
            console.error("Failed to load file manager assets", err);
        } finally {
            setLoading(false);
        }
    };

    // Load assets on opening, folder, search, or category changes
    useEffect(() => {
        if (isOpen) {
            fetchAssets(currentFolderId, searchQuery, activeTypeFilter);
        }
    }, [isOpen, currentFolderId, searchQuery, activeTypeFilter]);

    // Handle single or multiple file selection
    const toggleSelectFile = (file) => {
        if (multiple) {
            const exists = selectedItems.find(f => f.id === file.id);
            if (exists) {
                setSelectedItems(prev => prev.filter(f => f.id !== file.id));
            } else {
                setSelectedItems(prev => [...prev, file]);
            }
        } else {
            setSelectedItems([file]);
        }
    };

    // Confirm selection and trigger callback
    const handleConfirm = () => {
        if (selectedItems.length === 0) return;
        if (multiple) {
            onSelect(selectedItems);
        } else {
            onSelect(selectedItems[0]);
        }
        setSelectedItems([]);
        onClose();
    };

    // Helper: format file bytes
    const formatBytes = (bytes, decimals = 1) => {
        if (!bytes || bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    };

    // Helper: Get lucide icons
    const getFileIcon = (type) => {
        switch (type) {
            case 'image': return ImageIcon;
            case 'pdf': return FileText;
            case 'spreadsheet': return FileSpreadsheet;
            case 'document': return File;
            case 'audio': return Music;
            case 'archive': return FileArchive;
            default: return File;
        }
    };

    // Helper: Get badge colors for cards
    const getFileTypeColors = (type) => {
        switch (type) {
            case 'image': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
            case 'pdf': return 'bg-rose-500/10 text-rose-600 dark:text-rose-400';
            case 'spreadsheet': return 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400';
            case 'document': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
            case 'audio': return 'bg-purple-500/10 text-purple-600 dark:text-purple-400';
            case 'archive': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400';
            default: return 'bg-slate-500/10 text-slate-600 dark:text-slate-400';
        }
    };

    // Inline upload support
    const handleInlineUpload = async (e) => {
        e.preventDefault();
        if (uploadFiles.length === 0) return;
        setUploading(true);

        const formData = new FormData();
        Array.from(uploadFiles).forEach(file => {
            formData.append('files[]', file);
        });
        if (currentFolderId) {
            formData.append('folder_id', currentFolderId);
        }

        try {
            const res = await axios.post('/file-manager/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data', 'Accept': 'application/json' }
            });
            if (res.data.success) {
                setUploadFiles([]);
                setShowUploadInline(false);
                if (res.data.files && res.data.files.length > 0) {
                    if (multiple) {
                        setSelectedItems(prev => [...prev, ...res.data.files]);
                    } else {
                        setSelectedItems([res.data.files[0]]);
                    }
                }
                fetchAssets(currentFolderId, searchQuery, activeTypeFilter);
                
                window.dispatchEvent(new CustomEvent('jcms-toast', { 
                    detail: { type: 'success', title: 'Upload Complete', message: 'Files uploaded successfully.' } 
                }));
            }
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.message || 'Failed to upload files. Please try again.';
            window.dispatchEvent(new CustomEvent('jcms-toast', { 
                detail: { type: 'error', title: 'Upload Failed', message: errorMsg } 
            }));
        } finally {
            setUploading(false);
        }
    };

    return (
        <Dialog 
            open={isOpen} 
            onClose={onClose}
            maxWidth="lg"
            fullWidth
            PaperProps={{
                className: "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800",
                sx: {
                    borderRadius: '24px', 
                    overflow: 'hidden',
                    bgcolor: 'transparent',
                    backgroundImage: 'none',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                }
            }}
            slotProps={{
                backdrop: {
                    sx: {
                        backgroundColor: 'rgba(15, 23, 42, 0.6)',
                        backdropFilter: 'blur(4px)',
                    }
                }
            }}
        >
            {/* Modal Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 gap-3 sm:gap-4 bg-white dark:bg-slate-900 relative">
                {/* Logo and Mobile Close */}
                <div className="flex items-center justify-between w-full sm:w-auto shrink-0">
                    <JcmsLogo size={32} />
                    <div className="sm:hidden">
                        <IconButton onClick={onClose} size="small" className="text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
                            <X size={20} />
                        </IconButton>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="w-full sm:flex-1 sm:max-w-2xl sm:mx-4 mt-1 sm:mt-0 relative flex items-center">
                    <Search size={18} className="absolute left-4 text-slate-400 pointer-events-none" />
                    <input
                        type="text"
                        placeholder={placeholderText || "Search files, folders..."}
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-11 pr-11 py-2.5 text-sm bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-amber-400/50 focus:bg-white dark:focus:bg-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/20 text-slate-700 dark:text-slate-300 placeholder-slate-400 transition-all"
                    />
                    <button className="absolute right-3 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg transition-colors">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line></svg>
                    </button>
                </div>

                {/* Close Button (Desktop) */}
                <div className="hidden sm:flex items-center shrink-0 justify-end">
                    <IconButton 
                        onClick={onClose} 
                        className="text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                    >
                        <X size={24} />
                    </IconButton>
                </div>
            </div>

            {/* Tabs Row */}
            <div className="px-6 border-b border-slate-200 dark:border-slate-800 flex gap-4 overflow-x-auto no-scrollbar bg-white dark:bg-slate-900 pt-1 sm:pt-0">
                {[
                    { label: 'My Drive', value: 'my_drive' },
                    { label: 'Images', value: 'image' },
                    { label: 'PDFs', value: 'pdf' },
                    { label: 'Documents', value: 'document' },
                    { label: 'Sheets', value: 'spreadsheet' },
                    { label: 'Archives', value: 'archive' },
                    { label: 'Upload', value: 'upload' }
                ].filter(t => 
                    t.value === 'my_drive' || 
                    t.value === 'upload' || 
                    (allowedTypes.length === 0 || allowedTypes.includes(t.value))
                ).map(tab => {
                    const activeTab = showUploadInline ? 'upload' : (activeTypeFilter === '' ? 'my_drive' : activeTypeFilter);
                    const isActive = activeTab === tab.value;

                    return (
                        <button
                            key={tab.value}
                            onClick={() => {
                                if (tab.value === 'upload') {
                                    setShowUploadInline(true);
                                } else {
                                    setShowUploadInline(false);
                                    setActiveTypeFilter(tab.value === 'my_drive' ? '' : tab.value);
                                }
                            }}
                            className={cn(
                                "py-3 font-sans text-[13px] font-semibold transition-colors relative whitespace-nowrap",
                                isActive ? "text-amber-600 dark:text-amber-500" : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 px-3 rounded-t-xl"
                            )}
                            style={isActive ? { paddingLeft: '12px', paddingRight: '12px' } : {}}
                        >
                            {tab.label}
                            {isActive && (
                                <span className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500 rounded-t-full" />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Main Content Area */}
            <DialogContent className="p-0 h-[500px] bg-white dark:bg-slate-900 overflow-y-auto min-h-0 relative">
                {loading && (
                    <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/60 z-10 flex items-center justify-center">
                        <CircularProgress size={36} sx={{ color: '#f59e0b' }} />
                    </div>
                )}

                {showUploadInline ? (
                    // Upload Panel
                    <div className="flex flex-col items-center justify-center min-h-[400px] p-6 sm:p-8">
                        <form onSubmit={handleInlineUpload} className="w-full max-w-2xl text-center">
                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-amber-500 bg-slate-50 dark:bg-slate-800/50 rounded-3xl p-10 sm:p-16 flex flex-col items-center justify-center cursor-pointer transition-all"
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    multiple
                                    onChange={e => setUploadFiles(prev => [...prev, ...Array.from(e.target.files)])}
                                    className="hidden"
                                />
                                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-amber-50 dark:bg-amber-500/10 rounded-full flex items-center justify-center mb-6">
                                    <UploadCloud className="text-amber-600 dark:text-amber-500" size={32} />
                                </div>
                                <span className="font-sans text-lg sm:text-xl font-semibold text-slate-800 dark:text-slate-200">Drag files here or click to upload</span>
                            </div>

                            {uploadFiles.length > 0 && (
                                <div className="mt-6 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 bg-white dark:bg-slate-800 shadow-sm max-h-40 overflow-y-auto text-left">
                                    {uploadFiles.map((f, i) => (
                                        <div key={i} className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-700 last:border-0 font-sans group">
                                            <span className="truncate max-w-[350px] text-sm text-slate-700 dark:text-slate-300">{f.name}</span>
                                            <div className="flex items-center gap-3 shrink-0">
                                                <span className="text-xs text-slate-500">{formatBytes(f.size)}</span>
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); setUploadFiles(prev => prev.filter((_, idx) => idx !== i)); }}
                                                    className="p-1 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                                                    title="Remove File"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="flex justify-center mt-6">
                                <Button
                                    type="submit"
                                    disabled={uploadFiles.length === 0 || uploading}
                                    style={{ background: uploadFiles.length === 0 || uploading ? '' : 'linear-gradient(135deg, #f59e0b, #dc2626)' }}
                                    sx={{ 
                                        borderRadius: '12px', 
                                        textTransform: 'none', 
                                        px: 6,
                                        py: 1.5,
                                        color: '#ffffff',
                                        boxShadow: uploadFiles.length === 0 || uploading ? 'none' : '0 4px 14px rgba(245,158,11,0.3)',
                                    }}
                                    className={cn("font-sans font-semibold !text-white transition-all", uploadFiles.length > 0 && !uploading && "hover:shadow-lg hover:-translate-y-0.5")}
                                    startIcon={uploading ? <CircularProgress size={16} color="inherit" /> : <UploadCloud size={18} />}
                                >
                                    Upload {uploadFiles.length > 0 && `(${uploadFiles.length})`}
                                </Button>
                            </div>
                        </form>
                    </div>
                ) : (
                    <>
                        {/* Path and Actions Row */}
                        <div className="px-6 py-2 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur z-10 gap-2">
                            <div className="flex items-center gap-1 text-sm font-medium overflow-x-auto no-scrollbar">
                                <button
                                    onClick={() => setCurrentFolderId(null)}
                                    className="text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 px-3 py-1.5 rounded-lg transition-colors font-sans whitespace-nowrap"
                                >
                                    My Drive
                                </button>
                                {breadcrumbs.map((crumb, idx) => (
                                    <React.Fragment key={crumb.id}>
                                        <ChevronRight size={14} className="text-slate-400 shrink-0" />
                                        <button
                                            onClick={() => setCurrentFolderId(crumb.id)}
                                            className={cn(
                                                "px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap font-sans",
                                                idx === breadcrumbs.length - 1
                                                    ? "text-amber-600 dark:text-amber-500 font-bold bg-amber-50 dark:bg-amber-500/10"
                                                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                                            )}
                                        >
                                            {crumb.name}
                                        </button>
                                    </React.Fragment>
                                ))}
                            </div>

                            <div className="flex items-center gap-2 text-slate-500 self-end sm:self-auto">
                                <IconButton size="small" className="hover:bg-slate-100 dark:hover:bg-slate-800">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
                                </IconButton>
                            </div>
                        </div>

                        {/* Lists */}
                        {folders.length === 0 && files.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-24 text-center">
                                <div className="w-32 h-32 mb-4 opacity-50">
                                    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <circle cx="100" cy="100" r="100" className="fill-slate-100 dark:fill-slate-800"/>
                                        <path d="M120 75H80C74.5 75 70 79.5 70 85V115C70 120.5 74.5 125 80 125H120C125.5 125 130 120.5 130 115V85C130 79.5 125.5 75 120 75Z" className="fill-amber-100 dark:fill-amber-500/20"/>
                                        <path d="M100 90L115 105H85L100 90Z" className="fill-amber-500"/>
                                    </svg>
                                </div>
                                <span className="font-sans font-medium text-lg text-slate-800 dark:text-slate-200">
                                    No items here
                                </span>
                            </div>
                        ) : (
                            <div className="px-6 py-4 space-y-8 select-none">
                                {/* Folders */}
                                {folders.length > 0 && (
                                    <div>
                                        <div className="flex items-center justify-between mb-3 px-1">
                                            <span className="font-sans font-medium text-sm text-slate-700 dark:text-slate-300">
                                                Folders
                                            </span>
                                            <span className="font-sans font-medium text-sm text-slate-500 flex items-center gap-1 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 px-2 py-1 rounded-md">
                                                Name <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V6M5 12l7-7 7 7"/></svg>
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                            {folders.map(folder => (
                                                <div 
                                                    key={folder.id}
                                                    onClick={() => setCurrentFolderId(folder.id)}
                                                    className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-amber-400 dark:hover:border-amber-500/50 hover:bg-amber-50/50 dark:hover:bg-amber-500/10 cursor-pointer transition-colors bg-white dark:bg-slate-800/50"
                                                >
                                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-slate-600 dark:text-slate-400 fill-current">
                                                        <path d="M10 4H4C2.9 4 2.01 4.9 2.01 6L2 18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V8C22 6.9 21.1 6 20 6H12L10 4Z"/>
                                                    </svg>
                                                    <span className="font-sans font-medium text-sm text-slate-800 dark:text-slate-200 truncate">
                                                        {folder.name}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Files */}
                                {files.length > 0 && (
                                    <div>
                                        <span className="font-sans font-medium text-sm text-slate-700 dark:text-slate-300 block mb-3 px-1">
                                            Files
                                        </span>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                            {files.map(file => {
                                                const FileIcon = getFileIcon(file.file_type);
                                                const isSelected = selectedItems.some(f => f.id === file.id);

                                                return (
                                                    <div
                                                        key={file.id}
                                                        onClick={() => toggleSelectFile(file)}
                                                        className={cn(
                                                            "flex flex-col h-40 sm:h-48 rounded-xl border overflow-hidden cursor-pointer transition-all relative group",
                                                            isSelected 
                                                                ? "border-amber-500 bg-amber-50 dark:bg-amber-500/10 shadow-md ring-1 ring-amber-500/50" 
                                                                : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:border-amber-300 dark:hover:border-amber-500/30"
                                                        )}
                                                    >
                                                        {isSelected && (
                                                            <div className="absolute top-2 left-2 z-10 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center shadow-md">
                                                                <Check size={14} className="text-white" strokeWidth={3} />
                                                            </div>
                                                        )}

                                                        <div className="flex-1 flex items-center justify-center relative overflow-hidden bg-slate-100 dark:bg-slate-900/50">
                                                            {file.file_type === 'image' ? (
                                                                <img
                                                                    src={file.file_path}
                                                                    alt={file.name}
                                                                    className="w-full h-full object-cover rounded-t-xl group-hover:scale-105 transition-transform duration-500"
                                                                />
                                                            ) : (
                                                                <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center shadow-sm bg-white dark:bg-slate-800 group-hover:scale-110 transition-transform duration-300", getFileTypeColors(file.file_type))}>
                                                                    <FileIcon size={28} strokeWidth={1.5} />
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className={cn(
                                                            "h-12 px-3 py-2 flex flex-col justify-center bg-white dark:bg-slate-800 border-t transition-colors",
                                                            isSelected ? "border-amber-500/30" : "border-slate-200 dark:border-slate-700"
                                                        )}>
                                                            <div className="flex items-center gap-2">
                                                                <div className={cn("shrink-0 w-5 h-5 flex items-center justify-center rounded", getFileTypeColors(file.file_type))}>
                                                                    <FileIcon size={12} strokeWidth={2.5} />
                                                                </div>
                                                                <span className="font-sans text-xs font-semibold text-slate-700 dark:text-slate-200 truncate flex-1" title={file.name}>
                                                                    {file.name}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </DialogContent>

            {/* Footer Actions */}
            <DialogActions className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-end gap-3 bg-white dark:bg-slate-900">
                <div className="w-full sm:w-auto flex justify-end gap-3">
                    <Button
                        variant="text"
                        onClick={onClose}
                        sx={{ 
                            borderRadius: '12px', 
                            textTransform: 'none', 
                            px: 3,
                            color: '#64748b',
                            fontWeight: 600,
                            '&:hover': { backgroundColor: 'rgba(100,116,139,0.1)' }
                        }}
                        className="font-sans dark:text-slate-400"
                    >
                        Cancel
                    </Button>
                    
                    <Button
                        onClick={handleConfirm}
                        disabled={selectedItems.length === 0}
                        style={{ background: selectedItems.length === 0 ? '' : 'linear-gradient(135deg, #f59e0b, #dc2626)' }}
                        sx={{ 
                            borderRadius: '12px', 
                            textTransform: 'none', 
                            px: 4,
                            fontWeight: 600,
                            color: '#ffffff',
                            boxShadow: selectedItems.length === 0 ? 'none' : '0 4px 14px rgba(245,158,11,0.3)',
                            '&:disabled': {
                                backgroundColor: 'rgba(31,31,31,0.12)',
                                color: 'rgba(31,31,31,0.38)'
                            }
                        }}
                        className={cn("font-sans !text-white transition-all", selectedItems.length > 0 && "hover:shadow-lg hover:-translate-y-0.5")}
                    >
                        {selectedItems.length > 0 ? `Select (${selectedItems.length})` : 'Select'}
                    </Button>
                </div>
            </DialogActions>
        </Dialog>
    );
}
