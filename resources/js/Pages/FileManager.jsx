import React, { useState, useEffect, useRef } from 'react';
import { Head, router } from '@inertiajs/react';
import {
    Folder,
    FolderPlus,
    FileText,
    File,
    Image as ImageIcon,
    FileSpreadsheet,
    FileArchive,
    Music,
    Download,
    Copy,
    Trash2,
    Edit3,
    Search,
    ChevronRight,
    Plus,
    UploadCloud,
    X,
    ExternalLink,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Info,
    Calendar,
    ArrowUpRight,
    FolderOpen,
    MoreVertical,
    HardDrive,
    Database,
    Tag,
    ChevronDown,
    ChevronUp,
    RefreshCw,
} from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { cn } from '@/lib/utils';
import axios from 'axios';

// MUI Core components
import {
    Card,
    CardContent,
    CardActionArea,
    Typography,
    Divider,
    Button,
    Paper,
    MenuItem,
    ListItemIcon,
    ListItemText,
    MenuList,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    List,
    ListItem,
    IconButton,
} from '@mui/material';

export default function FileManager({ folders, files, breadcrumbs, current_folder_id, current_folder_name, filters }) {
    // UI State
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [selectedType, setSelectedType] = useState(filters.type || '');

    // File / Selection States
    const [selectedFile, setSelectedFile] = useState(null);
    const [showDetailsPanel, setShowDetailsPanel] = useState(false);

    // Custom Context Menu State
    const [contextMenu, setContextMenu] = useState(null); // { x, y, type: 'file'|'folder', item }

    // Dropdown/Popups State
    const [showNewDropdown, setShowNewDropdown] = useState(false);
    const [showUploadWidget, setShowUploadWidget] = useState(false);
    const [isWidgetMinimized, setIsWidgetMinimized] = useState(false);
    const [showNewFolderModal, setShowNewFolderModal] = useState(false);
    const [showRenameModal, setShowRenameModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Form values
    const [newFolderName, setNewFolderName] = useState('');
    const [renameTarget, setRenameTarget] = useState(null); // { type, item }
    const [renameValue, setRenameValue] = useState('');
    const [deleteTarget, setDeleteTarget] = useState(null); // { type, item }
    const [uploadFiles, setUploadFiles] = useState([]); // Normal JS array of files
    const [isActionLoading, setIsActionLoading] = useState(false);

    // Toast Notifications
    const [toastMessage, setToastMessage] = useState(null);
    const [toastType, setToastType] = useState('success');

    const newBtnRef = useRef(null);
    const fileInputRef = useRef(null);

    const triggerToast = (msg, type = 'success') => {
        setToastMessage(msg);
        setToastType(type);
        setTimeout(() => setToastMessage(null), 3000);
    };

    // Close dropdowns & context menus on window clicks
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (newBtnRef.current && !newBtnRef.current.contains(e.target)) {
                setShowNewDropdown(false);
            }
            setContextMenu(null);
        };
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

    // Sync filters on reload
    useEffect(() => {
        if (filters.search !== undefined) setSearchTerm(filters.search || '');
        if (filters.type !== undefined) setSelectedType(filters.type || '');
    }, [filters]);

    // Handle breadcrumb / folder double-click navigation
    const navigateToFolder = (folderId) => {
        setSelectedFile(null);
        setContextMenu(null);
        router.visit(route('media.index', {
            folder_id: folderId || '',
            type: selectedType || '',
            search: searchTerm || ''
        }), {
            preserveState: true,
            replace: true
        });
    };

    // Handle Category Filter sidebar change
    const filterByType = (type) => {
        setSelectedFile(null);
        setSelectedType(type);
        router.visit(route('media.index', {
            folder_id: current_folder_id || '',
            type: type || '',
            search: searchTerm || ''
        }), {
            preserveState: true,
            replace: true
        });
    };

    // Search query submit
    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setSelectedFile(null);
        router.visit(route('media.index', {
            folder_id: current_folder_id || '',
            type: selectedType || '',
            search: searchTerm || ''
        }), {
            preserveState: true,
            replace: true
        });
    };

    // Right Click handler to summon the context menu
    const handleItemContextMenu = (e, type, item) => {
        e.preventDefault();
        e.stopPropagation();

        // Prevent rendering menu outside viewport bounds
        const menuWidth = 190;
        const menuHeight = 240;
        let x = e.clientX;
        let y = e.clientY;

        if (x + menuWidth > window.innerWidth) {
            x = window.innerWidth - menuWidth - 10;
        }
        if (y + menuHeight > window.innerHeight) {
            y = window.innerHeight - menuHeight - 10;
        }

        // Highlight this item on right click
        if (type === 'file') {
            setSelectedFile(item);
        }

        setContextMenu({ x, y, type, item });
    };

    // Helper: format bytes
    const formatBytes = (bytes, decimals = 1) => {
        if (!bytes || bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    };

    // Get Lucide icons
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

    // Get CSS style tags for file type highlights
    const getFileTypeColors = (type) => {
        switch (type) {
            case 'image': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
            case 'pdf': return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
            case 'spreadsheet': return 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20';
            case 'document': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
            case 'audio': return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
            case 'archive': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
            default: return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
        }
    };

    // Create Folder
    const handleCreateFolder = async (e) => {
        e.preventDefault();
        if (!newFolderName.trim()) return;
        setIsActionLoading(true);

        try {
            await axios.post(route('media.folder.create'), {
                name: newFolderName,
                parent_id: current_folder_id
            });
            setShowNewFolderModal(false);
            setNewFolderName('');
            triggerToast('Folder created successfully');
            router.reload();
        } catch (err) {
            triggerToast('Failed to create folder', 'error');
        } finally {
            setIsActionLoading(false);
        }
    };

    // File selection queue additions
    const handleFileSelectionChange = (e) => {
        if (!e.target.files) return;

        const selectedFiles = Array.from(e.target.files);
        const newUploads = [];
        let hasLargeFiles = false;

        selectedFiles.forEach(f => {
            // Check if file is over 50MB (Laravel max validation limit is 51200KB)
            if (f.size > 50 * 1024 * 1024) {
                hasLargeFiles = true;
                return; // Skip this file
            }

            newUploads.push({
                id: Math.random().toString(36).substring(7) + Date.now(),
                file: f,
                status: 'pending', // pending, uploading, success, error
                progress: 0
            });
        });

        if (hasLargeFiles) {
            triggerToast('Some files exceed the 50MB limit and were skipped.', 'error');
        }

        if (newUploads.length > 0) {
            setUploadFiles((prev) => [...prev, ...newUploads]);
            setShowUploadWidget(true);
            setIsWidgetMinimized(false);
        }

        // Reset file input value to allow selecting same files again
        if (e.target) {
            e.target.value = null;
        }
    };

    // Remove single file from queue before uploading
    const removeFileFromQueue = (idToRemove) => {
        setUploadFiles((prev) => prev.filter(item => item.id !== idToRemove));
    };

    // Retry single file upload
    const retrySingleUpload = async (idToRetry) => {
        const item = uploadFiles.find(f => f.id === idToRetry);
        if (!item) return;

        setIsActionLoading(true);

        // Update status to uploading
        setUploadFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: 'uploading', progress: 0 } : f));

        const formData = new FormData();
        formData.append('files[]', item.file);
        if (current_folder_id) {
            formData.append('folder_id', current_folder_id);
        }

        try {
            await axios.post(route('media.upload'), formData, {
                headers: { 
                    'Content-Type': 'multipart/form-data',
                    'Accept': 'application/json'
                },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadFiles(prev => prev.map(f => f.id === item.id ? { ...f, progress: percentCompleted } : f));
                }
            });

            // Update status to success
            setUploadFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: 'success', progress: 100 } : f));
            triggerToast('File uploaded successfully');
        } catch (err) {
            // Update status to error
            let errorMessage = 'Upload failed';
            if (err.response?.data) {
                if (err.response.data.errors) {
                    const firstErrorKey = Object.keys(err.response.data.errors)[0];
                    errorMessage = err.response.data.errors[firstErrorKey][0];
                } else if (err.response.data.message) {
                    errorMessage = err.response.data.message;
                }
            } else {
                errorMessage = err.message || 'Upload failed';
            }
            setUploadFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: 'error', errorMsg: errorMessage } : f));
            triggerToast('Failed to retry upload', 'error');
        }

        setIsActionLoading(false);
        router.reload();
    };

    // Upload Files submit (Queueing one by one)
    const handleFileUploadSubmit = async (e) => {
        e?.preventDefault();

        const pendingFiles = uploadFiles.filter(f => f.status === 'pending' || f.status === 'error');
        if (pendingFiles.length === 0) return;

        setIsActionLoading(true);
        let hasError = false;

        for (const item of pendingFiles) {
            // Update status to uploading
            setUploadFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: 'uploading', progress: 0 } : f));

            const formData = new FormData();
            formData.append('files[]', item.file);
            if (current_folder_id) {
                formData.append('folder_id', current_folder_id);
            }

            try {
                await axios.post(route('media.upload'), formData, {
                    headers: { 
                        'Content-Type': 'multipart/form-data',
                        'Accept': 'application/json'
                    },
                    onUploadProgress: (progressEvent) => {
                        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        setUploadFiles(prev => prev.map(f => f.id === item.id ? { ...f, progress: percentCompleted } : f));
                    }
                });

                // Update status to success
                setUploadFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: 'success', progress: 100 } : f));
            } catch (err) {
                hasError = true;
                // Update status to error
                let errorMessage = 'Upload failed';
                if (err.response?.data) {
                    if (err.response.data.errors) {
                        const firstErrorKey = Object.keys(err.response.data.errors)[0];
                        errorMessage = err.response.data.errors[firstErrorKey][0];
                    } else if (err.response.data.message) {
                        errorMessage = err.response.data.message;
                    }
                } else {
                    errorMessage = err.message || 'Upload failed';
                }
                setUploadFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: 'error', errorMsg: errorMessage } : f));
            }
        }

        if (hasError) {
            triggerToast('Some files failed to upload', 'error');
        } else {
            triggerToast('All files uploaded successfully');
        }

        setIsActionLoading(false);
        router.reload();
    };

    // Open Rename Modal
    const startRename = (type, item) => {
        setRenameTarget({ type, item });
        setRenameValue(item.name);
        setShowRenameModal(true);
    };

    // API: Rename File or Folder
    const handleRename = async (e) => {
        e.preventDefault();
        if (!renameValue.trim() || !renameTarget) return;
        setIsActionLoading(true);

        const isFile = renameTarget.type === 'file';
        const url = isFile
            ? route('media.file.rename', { file: renameTarget.item.id })
            : route('media.folder.rename', { folder: renameTarget.item.id });

        try {
            await axios.post(url, { name: renameValue });
            setShowRenameModal(false);
            setRenameTarget(null);
            triggerToast(`${isFile ? 'File' : 'Folder'} renamed successfully`);
            router.reload();
        } catch (err) {
            triggerToast('Failed to rename item', 'error');
        } finally {
            setIsActionLoading(false);
        }
    };

    // Open Delete Confirmation
    const startDelete = (type, item) => {
        setDeleteTarget({ type, item });
        setShowDeleteConfirm(true);
    };

    // API: Delete File or Folder
    const handleDelete = async () => {
        if (!deleteTarget) return;
        setIsActionLoading(true);

        const isFile = deleteTarget.type === 'file';
        const url = isFile
            ? route('media.file.delete', { file: deleteTarget.item.id })
            : route('media.folder.delete', { folder: deleteTarget.item.id });

        try {
            await axios.delete(url);
            setShowDeleteConfirm(false);
            setDeleteTarget(null);
            setSelectedFile(null);
            setShowDetailsPanel(false);
            triggerToast(`${isFile ? 'File' : 'Folder'} deleted successfully`);
            router.reload();
        } catch (err) {
            triggerToast('Failed to delete item', 'error');
        } finally {
            setIsActionLoading(false);
        }
    };

    // Copy public asset URL
    const copyLinkToClipboard = (path) => {
        const fullUrl = window.location.origin + path;
        navigator.clipboard.writeText(fullUrl);
        triggerToast('Asset link copied!');
    };

    // Standard high-end blurry backdrop configurations
    const blurBackdropSlotProps = {
        backdrop: {
            style: {
                backgroundColor: 'rgba(15, 23, 42, 0.45)',
                backdropFilter: 'blur(6px)',
                WebkitBackdropFilter: 'blur(6px)',
            }
        }
    };

    return (
        <AppLayout title="JCMS Drive">
            <Head title="JCMS Drive - File Manager" />

            {/* Hidden Native File Selector utilized by "+ New" click action */}
            <input
                type="file"
                ref={fileInputRef}
                multiple
                onChange={handleFileSelectionChange}
                className="hidden"
            />

            {/* Success/Error Toast notification */}
            {toastMessage && (
                <Paper
                    elevation={3}
                    className={cn(
                        "fixed bottom-6 right-6 z-50 max-w-sm rounded-2xl p-4 border flex gap-3 animate-slide-up",
                        toastType === 'success' ? "bg-slate-900 text-white border-amber-500/20" : "bg-red-950 text-red-200 border-red-500/20"
                    )}
                >
                    {toastType === 'success' ? (
                        <CheckCircle2 className="text-amber-500 shrink-0 mt-0.5" size={18} />
                    ) : (
                        <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
                    )}
                    <div>
                        <Typography className={cn("font-bold text-[10px] uppercase tracking-wider", toastType === 'success' ? "text-amber-400" : "text-red-400")}>
                            {toastType === 'success' ? 'Drive Action' : 'Action Failed'}
                        </Typography>
                        <Typography variant="body2" className="text-xs mt-0.5 font-medium">{toastMessage}</Typography>
                    </div>
                </Paper>
            )}

            {/* JCMS Drive Workspace Grid */}
            <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-170px)] overflow-hidden">

                {/* 1. Left Drive Navigation Panel */}
                <div className="w-full lg:w-60 shrink-0 flex flex-col justify-between lg:h-full pb-2">
                    <div className="space-y-6">
                        {/* Unified JCMS Drive "+ New" Dropdown Button styled like Create Project Button */}
                        <div className="relative" ref={newBtnRef}>
                            <Button
                                id="btn-create-item"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowNewDropdown(!showNewDropdown);
                                }}
                                variant="contained"
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:shadow-lg hover:-translate-y-0.5 border-0 shadow-md"
                                startIcon={<Plus size={16} className="text-white font-bold" />}
                                style={{
                                    background: 'linear-gradient(135deg, #f59e0b, #dc2626)',
                                    boxShadow: '0 4px 14px rgba(245,158,11,0.3)',
                                    borderRadius: '12px',
                                    textTransform: 'none',
                                    color: 'white',
                                    fontWeight: 'bold',
                                    padding: '10px 20px',
                                    border: 0
                                }}
                            >
                                New
                            </Button>

                            {/* "+ New" Dropdown menu utilizing standard HTML elements with high-end glass styling */}
                            {showNewDropdown && (
                                <div
                                    className="absolute left-0 mt-2 z-30 w-48 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl py-1.5 animate-scale-up shadow-xl flex flex-col"
                                >
                                    <button
                                        onClick={() => {
                                            setShowNewFolderModal(true);
                                            setShowNewDropdown(false);
                                        }}
                                        className="py-2.5 px-4 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors flex items-center gap-3 w-full text-left border-0 bg-transparent cursor-pointer"
                                    >
                                        <FolderPlus size={15} className="text-amber-500 shrink-0" />
                                        <span className="text-xs font-semibold">New folder</span>
                                    </button>
                                    <div className="border-t border-slate-100 dark:border-slate-800/80 my-1" />
                                    <button
                                        onClick={() => {
                                            fileInputRef.current.click();
                                            setShowNewDropdown(false);
                                        }}
                                        className="py-2.5 px-4 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors flex items-center gap-3 w-full text-left border-0 bg-transparent cursor-pointer"
                                    >
                                        <UploadCloud size={15} className="text-amber-500 shrink-0" />
                                        <span className="text-xs font-semibold">File upload</span>
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Navigation Side links */}
                        <div className="space-y-1">
                            <button
                                onClick={() => filterByType('')}
                                className={cn(
                                    "w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all",
                                    selectedType === ''
                                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                                )}
                            >
                                <FolderOpen size={16} className="shrink-0" />
                                <span>JCMS Drive</span>
                            </button>

                            <div className="pt-4">
                                <Typography className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 mb-2">Categories</Typography>
                                <div className="space-y-0.5">
                                    {[
                                        { label: 'Images', type: 'image', icon: ImageIcon, color: 'text-emerald-500' },
                                        { label: 'PDF Documents', type: 'pdf', icon: FileText, color: 'text-rose-500' },
                                        { label: 'Word Documents', type: 'document', icon: File, color: 'text-blue-500' },
                                        { label: 'Spreadsheets', type: 'spreadsheet', icon: FileSpreadsheet, color: 'text-cyan-500' },
                                        { label: 'Archives (Zip)', type: 'archive', icon: FileArchive, color: 'text-amber-500' },
                                        { label: 'Audios', type: 'audio', icon: Music, color: 'text-purple-500' },
                                    ].map((cat) => {
                                        const Icon = cat.icon;
                                        const isActive = selectedType === cat.type;
                                        return (
                                            <button
                                                key={cat.type}
                                                onClick={() => filterByType(cat.type)}
                                                className={cn(
                                                    "w-full flex items-center gap-3 px-4 py-2 rounded-2xl text-xs font-semibold transition-all",
                                                    isActive
                                                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                                        : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                                                )}
                                            >
                                                <Icon size={15} className={cn("shrink-0", cat.color)} />
                                                <span>{cat.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Storage info card with soft borders */}
                    <div className="hidden lg:block">
                        <div
                            className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800/80 rounded-2xl p-4"
                        >
                            <div className="flex items-center gap-2 mb-1.5">
                                <Info size={14} className="text-amber-500" />
                                <span className="text-xs font-bold text-slate-750 dark:text-slate-200">JCMS Drive Storage</span>
                            </div>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed m-0 font-medium">
                                Virtual folders let you organize site blue-prints and invoices securely. Right-click folders or files for context control menus.
                            </p>
                        </div>
                    </div>
                </div>

                {/* 2. Middle Drive Contents Explorer Panel */}
                <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/60 rounded-3xl flex flex-col overflow-hidden shadow-sm h-full transition-all duration-300 ease-in-out">
                    {/* JCMS Drive Centered Search Bar Header */}
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-5 py-3 gap-4 shrink-0">

                        {/* Title and breadcrumbs */}
                        <div className="flex items-center gap-2 shrink-0">
                            <Typography className="text-xs font-bold text-slate-400 tracking-wider">JCMS Drive</Typography>
                            <ChevronRight size={14} className="text-slate-350" />
                            <Typography className="text-sm font-extrabold text-slate-800 dark:text-slate-100 leading-none">
                                {current_folder_name === 'Root' ? 'My Drive' : current_folder_name}
                            </Typography>
                        </div>

                        {/* Wide search bar */}
                        <form onSubmit={handleSearchSubmit} className="relative max-w-md w-full flex-1 hidden md:block">
                            <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search in JCMS Drive..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 text-xs bg-slate-100 dark:bg-slate-800/70 border-0 rounded-full focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-slate-700 dark:text-slate-300 placeholder-slate-400 font-medium"
                            />
                        </form>

                        {/* Toggle details option icon - styled with subtle grayish tone */}
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setShowDetailsPanel(!showDetailsPanel)}
                                className={cn(
                                    "p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors",
                                    showDetailsPanel ? "bg-slate-100 dark:bg-slate-800" : ""
                                )}
                                title="Toggle details inspector"
                            >
                                <Info size={16} className={showDetailsPanel ? "text-amber-500" : "text-slate-400 dark:text-slate-505"} />
                            </button>
                        </div>
                    </div>

                    {/* JCMS Drive Breadcrumb Path Link bar */}
                    <div className="px-5 py-2.5 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1.5 text-[11px] font-semibold overflow-x-auto no-scrollbar shrink-0">
                        <button
                            onClick={() => navigateToFolder(null)}
                            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                        >
                            My Drive
                        </button>
                        {breadcrumbs.map((crumb, idx) => (
                            <React.Fragment key={crumb.id}>
                                <ChevronRight size={11} className="text-slate-350" />
                                <button
                                    onClick={() => navigateToFolder(crumb.id)}
                                    className={cn(
                                        "transition-colors whitespace-nowrap",
                                        idx === breadcrumbs.length - 1
                                            ? "text-amber-500 font-bold"
                                            : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                                    )}
                                >
                                    {crumb.name}
                                </button>
                            </React.Fragment>
                        ))}
                    </div>

                    {/* Scrollable Workspace panel */}
                    <div className="flex-1 overflow-y-auto p-6 min-h-0">
                        {folders.length === 0 && files.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full py-16 text-center">
                                <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800/80 flex items-center justify-center text-slate-400 mb-4 animate-pulse">
                                    <Folder size={28} />
                                </div>
                                <Typography className="font-bold text-slate-800 dark:text-slate-200 text-sm">Welcome to JCMS Drive</Typography>
                                <Typography variant="caption" className="text-xs text-slate-400 max-w-sm mt-1 leading-relaxed block">
                                    This folder is empty. Click "+ New" in the sidebar to upload project documents or build nested subfolders!
                                </Typography>
                            </div>
                        ) : (
                            <div className="space-y-8 select-none">
                                {/* A. Folders Grid list using MUI Cards with dynamic row-reduction transitions */}
                                {folders.length > 0 && (
                                    <div>
                                        <Typography className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Folders</Typography>
                                        <div className={cn(
                                            "grid gap-3.5 transition-all duration-300 ease-in-out",
                                            showDetailsPanel
                                                ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-3"
                                                : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4"
                                        )}>
                                            {folders.map(folder => (
                                                <div
                                                    key={folder.id}
                                                    style={{
                                                        borderRadius: '12px',
                                                        borderWidth: '1px'
                                                    }}
                                                    className="group bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800/80 hover:shadow-sm hover:border-slate-350 dark:hover:border-slate-700 transition-all duration-300 transform hover:scale-[1.01] ease-in-out cursor-pointer overflow-hidden"
                                                    onClick={() => navigateToFolder(folder.id)}
                                                    onDoubleClick={() => navigateToFolder(folder.id)}
                                                    onContextMenu={(e) => handleItemContextMenu(e, 'folder', folder)}
                                                >
                                                    <div className="p-3.5 flex items-center justify-between gap-3 select-none">
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                                                                <Folder size={18} />
                                                            </div>
                                                            <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate pr-2">
                                                                {folder.name}
                                                            </p>
                                                        </div>

                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleItemContextMenu(e, 'folder', folder);
                                                            }}
                                                            className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 transition-colors shrink-0 border-0 bg-transparent"
                                                        >
                                                            <MoreVertical size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* B. Files Grid list using MUI Cards with dynamic row-reduction transitions */}
                                {files.length > 0 && (
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Files</p>
                                        <div className={cn(
                                            "grid gap-4 transition-all duration-300 ease-in-out",
                                            showDetailsPanel
                                                ? "grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4"
                                                : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5"
                                        )}>
                                            {files.map(file => {
                                                const FileIcon = getFileIcon(file.file_type);
                                                const typeColors = getFileTypeColors(file.file_type);
                                                const isSelected = selectedFile?.id === file.id;

                                                return (
                                                    <div
                                                        key={file.id}
                                                        style={{
                                                            borderRadius: '16px',
                                                            borderWidth: '1px',
                                                            borderColor: isSelected ? '#d97706' : undefined
                                                        }}
                                                        className={cn(
                                                            "group bg-white dark:bg-slate-900 flex flex-col justify-between h-44 cursor-pointer relative overflow-hidden transition-all duration-300 transform hover:scale-[1.01] ease-in-out",
                                                            isSelected 
                                                                ? "ring-2 ring-amber-500/10 border-amber-500" 
                                                                : "border-slate-200 dark:border-slate-800/80 hover:border-slate-350 dark:hover:border-slate-700"
                                                        )}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedFile(file);
                                                            // Auto open details drawer on click
                                                            setShowDetailsPanel(true);
                                                        }}
                                                        onDoubleClick={() => window.open(file.file_path, '_blank')}
                                                        onContextMenu={(e) => handleItemContextMenu(e, 'file', file)}
                                                    >
                                                        {/* Thumbnail Box */}
                                                        <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-slate-900/40 p-2 relative overflow-hidden select-none border-b border-slate-100 dark:border-slate-800">
                                                            {file.file_type === 'image' ? (
                                                                <img
                                                                    src={file.file_path}
                                                                    alt={file.name}
                                                                    className="max-h-24 max-w-full object-contain rounded-lg pointer-events-none"
                                                                />
                                                            ) : (
                                                                <div className={cn("w-9 h-9 rounded-xl border flex items-center justify-center shrink-0", typeColors)}>
                                                                    <FileIcon size={18} />
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Details block with REDUCED text size [9px] */}
                                                        <div className="p-3 pt-2 pb-2 flex flex-col justify-between select-none">
                                                            <div className="min-w-0 flex items-start justify-between gap-1 w-full">
                                                                <p
                                                                    className="text-[9px] font-semibold text-slate-800 dark:text-slate-200 line-clamp-2 h-[22px] leading-[11px] flex-1 pr-1 break-all"
                                                                    title={file.name}
                                                                >
                                                                    {file.name}
                                                                </p>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleItemContextMenu(e, 'file', file);
                                                                    }}
                                                                    className="p-0.5 rounded text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 transition-colors shrink-0 border-0 bg-transparent"
                                                                >
                                                                    <MoreVertical size={13} />
                                                                </button>
                                                            </div>
                                                            <span className="text-[9px] text-slate-400 font-semibold font-mono block mt-0.5">
                                                                {formatBytes(file.file_size)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* 3. Right Details View Panel (Resized with standard width contraction layout transitions) */}
                <div
                    className={cn(
                        "transition-all duration-300 ease-in-out overflow-hidden shrink-0 flex",
                        showDetailsPanel
                            ? "w-full lg:w-72 opacity-100 transform translate-x-0"
                            : "w-0 opacity-0 transform translate-x-8 pointer-events-none"
                    )}
                >
                    <div
                        style={{
                            borderRadius: '24px',
                            borderWidth: '1px'
                        }}
                        className="p-5 flex flex-col justify-between shadow-sm lg:h-full w-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800/80"
                    >
                        {selectedFile ? (
                            <div className="flex flex-col h-full justify-between overflow-hidden">
                                <div className="space-y-4 flex-1 overflow-y-auto no-scrollbar pb-3 select-none">

                                    {/* Header */}
                                    <div className="flex items-center justify-between pb-1">
                                        <div className="flex items-center gap-1.5">
                                            <Info size={14} className="text-amber-500" />
                                            <p className="font-bold text-xs text-slate-800 dark:text-slate-200 m-0">File Information</p>
                                        </div>
                                        <IconButton
                                            size="small"
                                            onClick={() => setShowDetailsPanel(false)}
                                            className="text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                                        >
                                            <X size={15} />
                                        </IconButton>
                                    </div>
                                    <div className="border-t border-slate-100 dark:border-slate-800/80 my-3" />

                                    {/* Visual File Preview Box */}
                                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 p-4 flex items-center justify-center relative overflow-hidden aspect-video shadow-inner">
                                        {selectedFile.file_type === 'image' ? (
                                            <img
                                                src={selectedFile.file_path}
                                                alt={selectedFile.name}
                                                className="max-h-full max-w-full object-contain rounded-lg"
                                            />
                                        ) : (
                                            <div className={cn("w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 shadow-sm", getFileTypeColors(selectedFile.file_type))}>
                                                {React.createElement(getFileIcon(selectedFile.file_type), { size: 24 })}
                                            </div>
                                        )}
                                    </div>

                                    {/* Core Filename Wrap - REDUCED text size to [10px] */}
                                    <div className="px-1">
                                        <p className="font-bold text-[10px] text-slate-800 dark:text-slate-200 break-all leading-normal m-0">
                                            {selectedFile.name}
                                        </p>
                                    </div>

                                    <div className="border-t border-slate-100 dark:border-slate-800/80 my-3" />

                                    {/* Detailed Metadata fields using standard HTML divs */}
                                    <div className="space-y-3.5">
                                        <div className="flex items-center justify-between text-[11px]">
                                            <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
                                                <HardDrive size={13} />
                                                <span>File Size</span>
                                            </div>
                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                                {formatBytes(selectedFile.file_size)}
                                            </span>
                                        </div>
                                        <div className="border-t border-slate-100/60 dark:border-slate-800/50" />

                                        <div className="flex items-center justify-between text-[11px]">
                                            <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
                                                <Tag size={13} />
                                                <span>Drive Category</span>
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase font-mono bg-slate-100 dark:bg-slate-800/50 px-1.5 py-0.5 rounded">
                                                {selectedFile.file_type}
                                            </span>
                                        </div>
                                        <div className="border-t border-slate-100/60 dark:border-slate-800/50" />

                                        <div className="flex items-center justify-between text-[11px]">
                                            <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
                                                <Calendar size={13} />
                                                <span>Uploaded At</span>
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">
                                                {selectedFile.created_at}
                                            </span>
                                        </div>
                                        <div className="border-t border-slate-100/60 dark:border-slate-800/50" />

                                        <div className="flex items-center justify-between text-[11px]">
                                            <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
                                                <Database size={13} />
                                                <span>Mime Type</span>
                                            </div>
                                            <span className="text-[9px] font-semibold text-slate-500 dark:text-slate-400 max-w-[140px] truncate" title={selectedFile.mime_type}>
                                                {selectedFile.mime_type}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="border-t border-slate-100 dark:border-slate-800/80 my-3" />
                                </div>

                                {/* Details quick actions */}
                                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 shrink-0">
                                    <Button
                                        component="a"
                                        href={selectedFile.file_path}
                                        download={selectedFile.name}
                                        variant="contained"
                                        fullWidth
                                        className="flex items-center justify-center gap-2 text-white bg-slate-900 hover:bg-slate-800 dark:bg-amber-600 dark:hover:bg-amber-700 rounded-xl text-xs font-bold transition-all py-2.5 normal-case border-0"
                                        style={{
                                            textTransform: 'none',
                                            borderRadius: '12px',
                                            color: 'white',
                                            display: 'inline-flex',
                                            fontSize: '12px',
                                            fontWeight: 'bold'
                                        }}
                                        startIcon={<Download size={13} className="text-white" />}
                                    >
                                        Download File
                                    </Button>
                                    <Button
                                        onClick={() => copyLinkToClipboard(selectedFile.file_path)}
                                        variant="outlined"
                                        color="warning"
                                        fullWidth
                                        className="flex items-center justify-center gap-2 rounded-xl text-xs font-bold transition-all py-2 normal-case"
                                        style={{ textTransform: 'none', borderRadius: '12px', borderColor: '#d97706', color: '#d97706' }}
                                        startIcon={<Copy size={13} />}
                                    >
                                        Copy Link
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center py-8">
                                <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-150 dark:border-slate-800/80 flex items-center justify-center text-slate-400 mb-3">
                                    <Info size={18} />
                                </div>
                                <Typography className="font-bold text-xs text-slate-700 dark:text-slate-300">Inspector Empty</Typography>
                                <Typography variant="caption" className="text-[10px] text-slate-405 max-w-[180px] mt-1 leading-relaxed block">
                                    Right-click a file and select "View details" to inspect metadata properties or access download links here.
                                </Typography>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── 4. JCMS Drive Custom Floating Context Menu utilizing MUI Paper & MenuList ── */}
            {contextMenu && (
                <div
                    style={{
                        top: contextMenu.y,
                        left: contextMenu.x,
                        borderRadius: '16px',
                        borderWidth: '1px'
                    }}
                    className="fixed z-50 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800/80 py-1.5 min-w-[190px] animate-scale-up overflow-hidden shadow-xl flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                >
                    {contextMenu.type === 'folder' ? (
                        <div className="flex flex-col">
                            <button
                                onClick={() => {
                                    navigateToFolder(contextMenu.item.id);
                                    setContextMenu(null);
                                }}
                                className="py-2.5 px-4 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors flex items-center gap-3 w-full text-left border-0 bg-transparent cursor-pointer"
                            >
                                <FolderOpen size={14} className="text-amber-500 shrink-0" />
                                <span className="text-xs font-semibold">Open folder</span>
                            </button>
                            <button
                                onClick={() => {
                                    startRename('folder', contextMenu.item);
                                    setContextMenu(null);
                                }}
                                className="py-2.5 px-4 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors flex items-center gap-3 w-full text-left border-0 bg-transparent cursor-pointer"
                            >
                                <Edit3 size={14} className="text-blue-500 shrink-0" />
                                <span className="text-xs font-semibold">Rename folder</span>
                            </button>
                            <div className="border-t border-slate-100 dark:border-slate-800 my-1" />
                            <button
                                onClick={() => {
                                    startDelete('folder', contextMenu.item);
                                    setContextMenu(null);
                                }}
                                className="py-2.5 px-4 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-3 w-full text-left border-0 bg-transparent cursor-pointer"
                            >
                                <Trash2 size={14} className="text-red-550 shrink-0" />
                                <span className="text-xs font-bold">Delete folder</span>
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            <button
                                onClick={() => {
                                    setSelectedFile(contextMenu.item);
                                    setShowDetailsPanel(true);
                                    setContextMenu(null);
                                }}
                                className="py-2.5 px-4 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors flex items-center gap-3 w-full text-left border-0 bg-transparent cursor-pointer"
                            >
                                <Info size={14} className="text-amber-500 shrink-0" />
                                <span className="text-xs font-semibold">View details</span>
                            </button>
                            <button
                                onClick={() => {
                                    window.open(contextMenu.item.file_path, '_blank');
                                    setContextMenu(null);
                                }}
                                className="py-2.5 px-4 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors flex items-center gap-3 w-full text-left border-0 bg-transparent cursor-pointer"
                            >
                                <ExternalLink size={14} className="text-emerald-500 shrink-0" />
                                <span className="text-xs font-semibold">Open in tab</span>
                            </button>
                            <button
                                onClick={() => {
                                    copyLinkToClipboard(contextMenu.item.file_path);
                                    setContextMenu(null);
                                }}
                                className="py-2.5 px-4 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors flex items-center gap-3 w-full text-left border-0 bg-transparent cursor-pointer"
                            >
                                <Copy size={14} className="text-cyan-500 shrink-0" />
                                <span className="text-xs font-semibold">Copy link</span>
                            </button>
                            <button
                                onClick={() => {
                                    startRename('file', contextMenu.item);
                                    setContextMenu(null);
                                }}
                                className="py-2.5 px-4 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors flex items-center gap-3 w-full text-left border-0 bg-transparent cursor-pointer"
                            >
                                <Edit3 size={14} className="text-blue-500 shrink-0" />
                                <span className="text-xs font-semibold">Rename file</span>
                            </button>
                            <div className="border-t border-slate-100 dark:border-slate-800 my-1" />
                            <button
                                onClick={() => {
                                    startDelete('file', contextMenu.item);
                                    setContextMenu(null);
                                }}
                                className="py-2.5 px-4 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-3 w-full text-left border-0 bg-transparent cursor-pointer"
                            >
                                <Trash2 size={14} className="text-red-550 shrink-0" />
                                <span className="text-xs font-bold">Delete file</span>
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* ── 5. ADVANCED UPLOAD MANAGER WIDGET ── */}
            {showUploadWidget && (
                <div
                    style={{ maxHeight: isWidgetMinimized ? 'auto' : '550px' }}
                    className="fixed bottom-6 right-6 z-50 w-[420px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden animate-slide-up flex flex-col transition-all duration-300 shadow-2xl"
                >
                    {/* Widget Header - Minimalist */}
                    <div className="px-5 py-4 flex items-center justify-between select-none bg-slate-900 text-white">
                        <div className="flex items-center gap-3">
                            {isActionLoading ? (
                                <Loader2 size={18} className="animate-spin text-amber-500" />
                            ) : (
                                <UploadCloud size={18} className="text-amber-500" />
                            )}
                            <div className="flex flex-col">
                                <Typography variant="subtitle2" className="font-semibold tracking-wide leading-tight">
                                    {isActionLoading ? 'Uploading files...' : 'Upload Manager'}
                                </Typography>
                                <Typography variant="caption" className="text-slate-400 mt-0.5">
                                    {uploadFiles.filter(f => f.status === 'success').length} of {uploadFiles.length} items complete
                                </Typography>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <IconButton
                                size="small"
                                onClick={() => setIsWidgetMinimized(!isWidgetMinimized)}
                                className="text-slate-400 hover:text-white transition-colors"
                            >
                                {isWidgetMinimized ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            </IconButton>
                            <IconButton
                                size="small"
                                onClick={() => {
                                    if (!isActionLoading) {
                                        setShowUploadWidget(false);
                                        setUploadFiles([]);
                                    }
                                }}
                                disabled={isActionLoading}
                                className="text-slate-400 hover:text-white transition-colors disabled:opacity-30"
                            >
                                <X size={18} />
                            </IconButton>
                        </div>
                    </div>

                    {/* Widget Queue Body Content - Collapses smoothly when minimized */}
                    {!isWidgetMinimized && (
                        <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-900">
                            {/* File Upload Queue List */}
                            <div className="flex-1 overflow-y-auto">
                                <List className="p-0">
                                    {uploadFiles.map((item, index) => {
                                        const file = item.file;
                                        const isImage = file.type.startsWith('image/');
                                        return (
                                            <React.Fragment key={item.id}>
                                                <ListItem className="px-5 py-3 group hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                                    <div className="flex flex-col w-full gap-2">
                                                        <div className="flex items-center justify-between gap-4">
                                                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                                                {isImage ? (
                                                                    <div className="w-10 h-10 rounded overflow-hidden shrink-0 shadow-sm border border-slate-100 dark:border-slate-800">
                                                                        <img
                                                                            src={URL.createObjectURL(file)}
                                                                            alt={file.name}
                                                                            className="w-full h-full object-cover"
                                                                            onLoad={(e) => URL.revokeObjectURL(e.target.src)}
                                                                        />
                                                                    </div>
                                                                ) : (
                                                                    <div className="w-10 h-10 rounded bg-slate-50 dark:bg-slate-800 text-slate-400 border border-slate-100 dark:border-slate-800 shrink-0 flex items-center justify-center shadow-sm">
                                                                        <FileText size={20} />
                                                                    </div>
                                                                )}
                                                                <div className="min-w-0 flex-1 flex flex-col">
                                                                    <Typography variant="body2" className="text-slate-800 dark:text-slate-200 truncate font-medium">
                                                                        {file.name}
                                                                    </Typography>
                                                                    {item.status === 'error' && item.errorMsg && (
                                                                        <Typography variant="caption" className="text-red-500 mt-0.5 leading-tight line-clamp-2" title={item.errorMsg}>
                                                                            {item.errorMsg}
                                                                        </Typography>
                                                                    )}
                                                                    <Typography variant="caption" className="text-slate-500 mt-0.5 flex items-center gap-2">
                                                                        <span>{formatBytes(file.size)}</span>
                                                                        <span>•</span>
                                                                        {item.status === 'success' && <span className="text-emerald-500 flex items-center gap-1"><CheckCircle2 size={12} /> Uploaded</span>}
                                                                        {item.status === 'error' && <span className="text-red-500 flex items-center gap-1"><AlertCircle size={12} /> Failed</span>}
                                                                        {item.status === 'pending' && <span>Pending</span>}
                                                                        {item.status === 'uploading' && <span className="text-amber-600">Uploading {item.progress}%</span>}
                                                                    </Typography>
                                                                </div>
                                                            </div>

                                                            {/* Action / Loader */}
                                                            <div className="shrink-0 flex items-center gap-1">
                                                                {item.status === 'uploading' ? (
                                                                    <Loader2 size={18} className="animate-spin text-amber-500" />
                                                                ) : item.status === 'success' ? (
                                                                    <CheckCircle2 size={18} className="text-emerald-500" />
                                                                ) : (
                                                                    <>
                                                                        {item.status === 'error' && (
                                                                            <IconButton
                                                                                size="small"
                                                                                onClick={() => retrySingleUpload(item.id)}
                                                                                disabled={isActionLoading}
                                                                                title="Retry Upload"
                                                                                className="text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                                                                            >
                                                                                <RefreshCw size={16} />
                                                                            </IconButton>
                                                                        )}
                                                                        <IconButton
                                                                            size="small"
                                                                            onClick={() => removeFileFromQueue(item.id)}
                                                                            disabled={isActionLoading}
                                                                            title="Remove File"
                                                                            className="text-slate-400 hover:text-red-500 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                                                                        >
                                                                            <X size={16} />
                                                                        </IconButton>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Progress Bar Container */}
                                                        {item.status === 'uploading' && (
                                                            <div className="h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full bg-amber-500 transition-all duration-300 ease-out"
                                                                    style={{ width: `${item.progress}%` }}
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                </ListItem>
                                                {index < uploadFiles.length - 1 && <Divider component="li" />}
                                            </React.Fragment>
                                        );
                                    })}
                                </List>
                            </div>

                            {/* Dropzone selector box inside widget */}
                            <div className="px-5 pb-5 pt-2">
                                <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-amber-500 dark:hover:border-amber-500 rounded-xl p-6 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800/30 cursor-pointer transition-colors relative group">
                                    <input
                                        type="file"
                                        multiple
                                        onChange={handleFileSelectionChange}
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                    />
                                    <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                        <Plus size={20} className="text-amber-500" />
                                    </div>
                                    <Typography variant="body2" className="font-semibold text-slate-700 dark:text-slate-300">
                                        Drop files here or click to browse
                                    </Typography>
                                </div>
                            </div>

                            {/* Action Row */}
                            <div className="px-5 py-4 bg-slate-50 dark:bg-slate-800 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                                <Button
                                    onClick={() => {
                                        setUploadFiles([]);
                                        setShowUploadWidget(false);
                                    }}
                                    disabled={isActionLoading}
                                    style={{ textTransform: 'none', color: '#64748b' }}
                                    className="hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors px-4"
                                >
                                    Clear Queue
                                </Button>
                                <Button
                                    onClick={handleFileUploadSubmit}
                                    variant="contained"
                                    disabled={uploadFiles.filter(f => f.status === 'pending' || f.status === 'error').length === 0 || isActionLoading}
                                    style={{
                                        textTransform: 'none',
                                        borderRadius: '8px',
                                        background: '#f59e0b', // Amber 500
                                        color: 'white',
                                        boxShadow: 'none',
                                    }}
                                    className="hover:bg-amber-600 transition-colors px-6"
                                    startIcon={isActionLoading ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
                                >
                                    Start Upload
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ── Standard MUI Modals & Dialogs with High-End Blurry Backdrops & Standard Wizard Design ── */}

            {/* 1. New Folder Dialog */}
            <Dialog
                open={showNewFolderModal}
                onClose={() => setShowNewFolderModal(false)}
                slotProps={blurBackdropSlotProps}
                PaperProps={{
                    style: { borderRadius: '24px', padding: '0px', overflow: 'hidden', border: '1px solid rgba(226, 232, 240, 0.8)' }
                }}
            >
                {/* Standard Wizard-like Header */}
                <DialogTitle className="p-0 shrink-0">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                                style={{ background: 'linear-gradient(135deg, #f59e0b, #dc2626)' }}>
                                <FolderPlus className="text-white" size={18} />
                            </div>
                            <div>
                                <h2 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">Create New Folder</h2>
                                <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Add a virtual subfolder to organize your assets</p>
                            </div>
                        </div>
                        <IconButton onClick={() => setShowNewFolderModal(false)} size="small" className="text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                            <X size={16} />
                        </IconButton>
                    </div>
                </DialogTitle>

                <form onSubmit={handleCreateFolder}>
                    <DialogContent className="p-6 min-w-[320px]">
                        <Card variant="outlined" style={{ borderRadius: '16px', borderColor: 'rgba(226, 232, 240, 0.8)', padding: '16px' }}>
                            <TextField
                                autoFocus
                                required
                                label="Folder Name"
                                placeholder="e.g. Architect Drawings"
                                type="text"
                                fullWidth
                                variant="outlined"
                                value={newFolderName}
                                onChange={(e) => setNewFolderName(e.target.value)}
                                InputProps={{
                                    style: { borderRadius: '12px', fontSize: '12px' }
                                }}
                                InputLabelProps={{
                                    style: { fontSize: '12px' }
                                }}
                            />
                        </Card>
                    </DialogContent>

                    <Divider style={{ borderColor: 'rgba(226, 232, 240, 0.8)' }} />

                    <DialogActions className="px-6 py-3.5 bg-slate-50 dark:bg-slate-800/50 shrink-0 gap-1">
                        <Button
                            onClick={() => setShowNewFolderModal(false)}
                            style={{ textTransform: 'none', borderRadius: '10px', color: '#64748b', fontSize: '12px', fontWeight: 'semibold' }}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={isActionLoading}
                            style={{
                                textTransform: 'none',
                                borderRadius: '10px',
                                background: 'linear-gradient(135deg, #f59e0b, #dc2626)',
                                fontSize: '12px',
                                color: 'white',
                                fontWeight: 'bold',
                                boxShadow: '0 4px 10px rgba(245,158,11,0.2)'
                            }}
                            className="hover:-translate-y-0.5 transition-all"
                            startIcon={isActionLoading && <Loader2 size={12} className="animate-spin" />}
                        >
                            Create Folder
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* 2. Rename Dialog */}
            <Dialog
                open={showRenameModal}
                onClose={() => setShowRenameModal(false)}
                slotProps={blurBackdropSlotProps}
                PaperProps={{
                    style: { borderRadius: '24px', padding: '0px', overflow: 'hidden', border: '1px solid rgba(226, 232, 240, 0.8)' }
                }}
            >
                {/* Standard Wizard-like Header */}
                <DialogTitle className="p-0 shrink-0">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                                style={{ background: 'linear-gradient(135deg, #f59e0b, #dc2626)' }}>
                                <Edit3 className="text-white" size={18} />
                            </div>
                            <div>
                                <h2 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">Rename Asset</h2>
                                <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Update the name of your virtual folder or file</p>
                            </div>
                        </div>
                        <IconButton onClick={() => setShowRenameModal(false)} size="small" className="text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                            <X size={16} />
                        </IconButton>
                    </div>
                </DialogTitle>

                <form onSubmit={handleRename}>
                    <DialogContent className="p-6 min-w-[320px]">
                        <Card variant="outlined" style={{ borderRadius: '16px', borderColor: 'rgba(226, 232, 240, 0.8)', padding: '16px' }}>
                            <TextField
                                autoFocus
                                required
                                label="New Name"
                                type="text"
                                fullWidth
                                variant="outlined"
                                value={renameValue}
                                onChange={(e) => setRenameValue(e.target.value)}
                                InputProps={{
                                    style: { borderRadius: '12px', fontSize: '12px' }
                                }}
                                InputLabelProps={{
                                    style: { fontSize: '12px' }
                                }}
                            />
                        </Card>
                    </DialogContent>

                    <Divider style={{ borderColor: 'rgba(226, 232, 240, 0.8)' }} />

                    <DialogActions className="px-6 py-3.5 bg-slate-50 dark:bg-slate-800/50 shrink-0 gap-1">
                        <Button
                            onClick={() => setShowRenameModal(false)}
                            style={{ textTransform: 'none', borderRadius: '10px', color: '#64748b', fontSize: '12px', fontWeight: 'semibold' }}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={isActionLoading}
                            style={{
                                textTransform: 'none',
                                borderRadius: '10px',
                                background: 'linear-gradient(135deg, #f59e0b, #dc2626)',
                                fontSize: '12px',
                                color: 'white',
                                fontWeight: 'bold',
                                boxShadow: '0 4px 10px rgba(245,158,11,0.2)'
                            }}
                            className="hover:-translate-y-0.5 transition-all"
                            startIcon={isActionLoading && <Loader2 size={12} className="animate-spin" />}
                        >
                            Rename Asset
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* 3. Delete Confirm Dialog */}
            <Dialog
                open={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                slotProps={blurBackdropSlotProps}
                PaperProps={{
                    style: { borderRadius: '24px', padding: '0px', overflow: 'hidden', maxWidth: '400px', border: '1px solid rgba(226, 232, 240, 0.8)' }
                }}
            >
                {/* Standard Wizard-like Header */}
                <DialogTitle className="p-0 shrink-0">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                                style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
                                <Trash2 className="text-white" size={18} />
                            </div>
                            <div>
                                <h2 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">Delete Asset</h2>
                                <p className="text-[10px] text-slate-455 mt-0.5 font-medium">Remove folder or file permanently</p>
                            </div>
                        </div>
                        <IconButton onClick={() => setShowDeleteConfirm(false)} size="small" className="text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                            <X size={16} />
                        </IconButton>
                    </div>
                </DialogTitle>

                <DialogContent className="p-6 text-center flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mb-4">
                        <Trash2 size={24} />
                    </div>
                    <Typography variant="h6" className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">
                        Are you absolutely sure?
                    </Typography>
                    <Typography variant="body2" className="text-xs text-slate-400 mt-2 leading-relaxed">
                        You are deleting <span className="font-bold text-slate-700 dark:text-slate-300 break-all">'{deleteTarget?.item.name}'</span>.
                        {deleteTarget?.type === 'folder'
                            ? ' This will recursively delete all nested virtual folders and actual uploaded files inside it.'
                            : ' This operation is irreversible and files cannot be restored.'}
                    </Typography>
                </DialogContent>

                <Divider style={{ borderColor: 'rgba(226, 232, 240, 0.8)' }} />

                <DialogActions className="px-6 py-3.5 bg-slate-50 dark:bg-slate-800/50 shrink-0 gap-2 justify-center">
                    <Button
                        onClick={() => setShowDeleteConfirm(false)}
                        variant="outlined"
                        style={{ textTransform: 'none', borderRadius: '10px', color: '#64748b', borderColor: '#cbd5e1', fontSize: '12px', fontWeight: 'semibold', flex: 1 }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleDelete}
                        variant="contained"
                        color="error"
                        disabled={isActionLoading}
                        style={{ textTransform: 'none', borderRadius: '10px', backgroundColor: '#dc2626', fontSize: '12px', color: 'white', fontWeight: 'bold', flex: 1 }}
                        startIcon={isActionLoading && <Loader2 size={12} className="animate-spin" />}
                    >
                        Delete Permanently
                    </Button>
                </DialogActions>
            </Dialog>
        </AppLayout>
    );
}
