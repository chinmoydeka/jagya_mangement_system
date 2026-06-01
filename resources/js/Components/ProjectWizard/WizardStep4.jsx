import React, { useState, useRef, useEffect } from 'react';
import { Plus, X, Upload, Mic, ChevronDown, Info, ClipboardList, Trash2, StopCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const PRIORITIES = [
    { value: 'low',      label: 'Low',      color: 'text-green-600 bg-green-50 dark:bg-green-500/10',   desc: 'Normal work, no urgency' },
    { value: 'medium',   label: 'Medium',    color: 'text-blue-600 bg-blue-50 dark:bg-blue-500/10',     desc: 'Requires attention' },
    { value: 'high',     label: 'High',      color: 'text-amber-600 bg-amber-50 dark:bg-amber-500/10',  desc: 'Important task' },
    { value: 'critical', label: 'Critical',  color: 'text-red-600 bg-red-50 dark:bg-red-500/10',        desc: 'Project blocking task' },
];

const STATUSES = [
    { value: 'to-do',       label: 'To Do' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'done',        label: 'Done' },
];

const inputCls = `w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200
    dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/50
    text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500`;

const emptyTask = () => ({
    id: `task_${Date.now()}_${Math.random()}`,
    title: '', description: '',
    priority: 'medium', status: 'to-do',
    assignee_id: null, collaborator_ids: [],
    attachments: [], voice_notes: [],
});

function PriorityBadge({ value }) {
    const p = PRIORITIES.find(x => x.value === value) || PRIORITIES[1];
    return (
        <span className={cn('px-2 py-0.5 rounded-full text-xs font-semibold', p.color)}>{p.label}</span>
    );
}

function TaskCard({ task, members, onUpdate, onRemove, index }) {
    const [expanded, setExpanded] = useState(index === 0);
    const [recording, setRecording] = useState(false);
    const [recordingError, setRecordingError] = useState(null);
    const attachRef = useRef();

    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const streamRef = useRef(null);

    async function toggleRecording() {
        setRecordingError(null);
        if (recording) {
            if (mediaRecorderRef.current) {
                mediaRecorderRef.current.stop();
            }
            setRecording(false);
        } else {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                setRecordingError('Microphone access requires a Secure Context (HTTPS or localhost). If you are accessing this server remotely via HTTP, please use a secure HTTPS connection or connect via localhost.');
                return;
            }
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                streamRef.current = stream;
                audioChunksRef.current = [];
                const mediaRecorder = new MediaRecorder(stream);
                mediaRecorderRef.current = mediaRecorder;

                mediaRecorder.ondataavailable = (event) => {
                    if (event.data.size > 0) {
                        audioChunksRef.current.push(event.data);
                    }
                };

                mediaRecorder.onstop = () => {
                    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
                    const file = new File([audioBlob], `voice_note_${Date.now()}.wav`, { type: 'audio/wav' });
                    
                    onUpdate({
                        voice_notes: [
                            ...(task.voice_notes || []),
                            {
                                file,
                                name: `voice_note_${Date.now()}.wav`,
                                size: file.size
                            }
                        ]
                    });

                    // Stop tracks to release mic
                    stream.getTracks().forEach(track => track.stop());
                };

                mediaRecorder.start();
                setRecording(true);
            } catch (err) {
                console.error(err);
                if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                    setRecordingError('Microphone permission was denied. Please allow microphone access in your browser settings.');
                } else {
                    setRecordingError('Failed to access microphone: ' + err.message);
                }
            }
        }
    }

    // Auto cleanup stream on unmount
    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    function handleAttach(e) {
        if (!e.target.files) return;
        const files = Array.from(e.target.files).map(f => ({
            file: f,
            name: f.name,
            size: f.size
        }));
        onUpdate({ attachments: [...(task.attachments || []), ...files] });
        e.target.value = '';
    }

    return (
        <div className={cn('relative rounded-2xl border-2 overflow-hidden transition-all', expanded ? 'border-amber-400' : 'border-slate-200 dark:border-slate-700')}>
            
            {/* Pulsing Audio Recording Bubble Overlay */}
            {recording && (
                <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm z-30 flex flex-col items-center justify-center text-white rounded-2xl animate-fade-in">
                    <div className="relative mb-4">
                        {/* Rippling bubbles */}
                        <div className="absolute -inset-4 rounded-full bg-red-500/20 animate-ping" style={{ animationDuration: '2s' }} />
                        <div className="absolute -inset-2 rounded-full bg-red-500/40 animate-ping" style={{ animationDuration: '1.5s' }} />
                        
                        <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center shadow-lg shadow-red-500/30">
                            <Mic size={24} className="text-white animate-pulse" />
                        </div>
                    </div>
                    
                    <p className="text-xs font-bold tracking-wide animate-pulse">RECORDING VOICE NOTE...</p>
                    <p className="text-[10px] text-slate-400 mt-1">Speak into your mic. Click below to stop and save.</p>
                    
                    <button
                        type="button"
                        onClick={toggleRecording}
                        className="mt-4 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-red-500 hover:bg-red-600 text-white shadow-md transition-colors"
                    >
                        <StopCircle size={14} /> Stop & Save
                    </button>
                </div>
            )}

            {/* Card Header */}
            <div
                className={cn('flex items-center gap-3 px-4 py-3 cursor-pointer', expanded ? 'bg-amber-50 dark:bg-amber-500/5' : 'bg-slate-50 dark:bg-slate-800')}
                onClick={() => setExpanded(!expanded)}
            >
                <div className={cn('w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold', expanded ? 'bg-amber-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400')}>
                    {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                    <p className={cn('text-sm font-semibold truncate', task.title ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400')}>
                        {task.title || 'Untitled Task'}
                    </p>
                </div>
                <PriorityBadge value={task.priority} />
                <button
                    type="button"
                    onClick={e => { e.stopPropagation(); onRemove(); }}
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                >
                    <Trash2 size={13} />
                </button>
                <ChevronDown size={15} className={cn('text-slate-400 transition-transform', expanded && 'rotate-180')} />
            </div>

            {/* Card Body */}
            {expanded && (
                <div className="p-4 space-y-4 bg-white dark:bg-slate-900">
                    <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Task Title *</label>
                        <input
                            type="text"
                            value={task.title}
                            onChange={e => onUpdate({ title: e.target.value })}
                            placeholder="e.g. Foundation Work"
                            className={inputCls}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Description</label>
                        <textarea
                            value={task.description}
                            onChange={e => onUpdate({ description: e.target.value })}
                            rows={2}
                            placeholder="Describe the task in detail..."
                            className={cn(inputCls, 'resize-none')}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {/* Priority */}
                        <div>
                            <div className="flex items-center gap-1.5 mb-1.5">
                                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Priority</label>
                                <div className="relative group">
                                    <Info size={12} className="text-slate-400 cursor-help" />
                                    <div className="absolute bottom-5 left-0 w-48 p-3 bg-slate-900 text-white rounded-xl text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 space-y-1">
                                        {PRIORITIES.map(p => <p key={p.value}><strong>{p.label}:</strong> {p.desc}</p>)}
                                    </div>
                                </div>
                            </div>
                            <select
                                value={task.priority}
                                onChange={e => onUpdate({ priority: e.target.value })}
                                className={cn(inputCls, 'py-2')}
                            >
                                {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                            </select>
                        </div>

                        {/* Status */}
                        <div>
                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Status</label>
                            <select
                                value={task.status}
                                onChange={e => onUpdate({ status: e.target.value })}
                                className={cn(inputCls, 'py-2')}
                            >
                                {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Assignee & Collaborators */}
                    {members.length > 0 && (
                        <div className="space-y-3">
                            {/* Assignee */}
                            <div>
                                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Assignee</label>
                                <select
                                    value={task.assignee_id || ''}
                                    onChange={e => onUpdate({ assignee_id: e.target.value || null })}
                                    className={cn(inputCls, 'py-2')}
                                >
                                    <option value="">— Unassigned —</option>
                                    {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                </select>
                            </div>

                            {/* Collaborators Tag Picker */}
                            <div>
                                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Collaborators</label>

                                {/* Selected collaborator tags */}
                                {(task.collaborator_ids || []).length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mb-2">
                                        {(task.collaborator_ids || []).map(id => {
                                            const m = members.find(x => String(x.id) === String(id));
                                            if (!m) return null;
                                            return (
                                                <span key={id} className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full bg-amber-100 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300 text-xs font-semibold border border-amber-200 dark:border-amber-500/30">
                                                    {m.name}
                                                    <button
                                                        type="button"
                                                        onClick={() => onUpdate({
                                                            collaborator_ids: (task.collaborator_ids || []).filter(c => String(c) !== String(id))
                                                        })}
                                                        className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-amber-300 dark:hover:bg-amber-500/40 transition-colors"
                                                    >
                                                        <X size={10} />
                                                    </button>
                                                </span>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Available members to add (excludes assignee and already selected) */}
                                {members.filter(m =>
                                    String(m.id) !== String(task.assignee_id) &&
                                    !(task.collaborator_ids || []).map(String).includes(String(m.id))
                                ).length > 0 && (
                                    <div className="flex flex-wrap gap-1.5">
                                        {members
                                            .filter(m =>
                                                String(m.id) !== String(task.assignee_id) &&
                                                !(task.collaborator_ids || []).map(String).includes(String(m.id))
                                            )
                                            .map(m => (
                                                <button
                                                    key={m.id}
                                                    type="button"
                                                    onClick={() => onUpdate({
                                                        collaborator_ids: [...(task.collaborator_ids || []), String(m.id)]
                                                    })}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-dashed border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 text-xs font-medium hover:border-amber-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/5 transition-colors"
                                                >
                                                    <Plus size={10} /> {m.name}
                                                </button>
                                            ))
                                        }
                                    </div>
                                )}

                                {(task.collaborator_ids || []).length === 0 &&
                                    members.filter(m => String(m.id) !== String(task.assignee_id)).length === 0 && (
                                    <p className="text-xs text-slate-400 italic">No other team members available</p>
                                )}
                            </div>
                        </div>
                    )}


                    {/* File & Voice Attach */}
                    <div className="space-y-2">
                        {recordingError && (
                            <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-xl flex items-start gap-2.5">
                                <Info size={14} className="text-amber-500 shrink-0 mt-0.5" />
                                <div className="flex-1 space-y-0.5">
                                    <p className="text-[10px] font-bold text-amber-800 dark:text-amber-400">Microphone Information</p>
                                    <p className="text-[10px] leading-relaxed text-amber-700 dark:text-amber-500">{recordingError}</p>
                                </div>
                                <button type="button" onClick={() => setRecordingError(null)} className="text-[10px] font-bold text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-250 shrink-0">Dismiss</button>
                            </div>
                        )}

                        <div className="flex gap-3 pt-1">
                            <input ref={attachRef} type="file" multiple className="hidden" onChange={handleAttach} />

                            <button
                                type="button"
                                onClick={() => attachRef.current?.click()}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            >
                                <Upload size={13} />
                                Attach Files {task.attachments?.length > 0 && `(${task.attachments.length})`}
                            </button>
                            
                            <button
                                type="button"
                                onClick={toggleRecording}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            >
                                <Mic size={13} className="text-red-500 animate-pulse" />
                                Record Voice Note {task.voice_notes?.length > 0 && `(${task.voice_notes.length})`}
                            </button>
                        </div>

                        {/* List attachments and voice notes */}
                        {(task.attachments?.length > 0 || task.voice_notes?.length > 0) && (
                            <div className="text-[11px] text-slate-500 space-y-1 pt-1">
                                {task.attachments?.map((f, fi) => (
                                    <div key={fi} className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/40 p-1 px-2 rounded-lg">
                                        <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-xs">{f.name}</span>
                                        <span>({(f.size / 1024).toFixed(1)} KB)</span>
                                    </div>
                                ))}
                                {task.voice_notes?.map((v, vi) => (
                                    <div key={vi} className="flex items-center gap-1 bg-red-50/50 dark:bg-red-500/5 p-1 px-2 rounded-lg border border-red-100/50">
                                        <span className="font-semibold text-red-600 truncate max-w-xs">{v.name}</span>
                                        <span>({(v.size / 1024).toFixed(1)} KB)</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function WizardStep4({ data, update }) {
    const members = data.team || [];

    function addTask() {
        update({ tasks: [...data.tasks, emptyTask()] });
    }

    function removeTask(id) {
        update({ tasks: data.tasks.filter(t => t.id !== id) });
    }

    function updateTask(id, fields) {
        update({ tasks: data.tasks.map(t => t.id === id ? { ...t, ...fields } : t) });
    }

    return (
        <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Task Planning</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Create tasks now or add them after project creation.</p>
                </div>
                <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2.5 py-1 rounded-full font-medium">
                    {data.tasks.length} task{data.tasks.length !== 1 ? 's' : ''}
                </span>
            </div>

            {/* Task Cards */}
            <div className="space-y-3">
                {data.tasks.map((task, i) => (
                    <TaskCard
                        key={task.id}
                        task={task}
                        members={members}
                        index={i}
                        onUpdate={(fields) => updateTask(task.id, fields)}
                        onRemove={() => removeTask(task.id)}
                    />
                ))}
            </div>

            {/* Empty State */}
            {data.tasks.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
                    <ClipboardList size={36} className="mb-3 opacity-30" />
                    <p className="text-sm font-medium">No tasks yet</p>
                    <p className="text-xs mt-1">Click below to add project tasks</p>
                </div>
            )}

            {/* Add Task Button */}
            <button
                type="button"
                onClick={addTask}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-amber-300 dark:border-amber-500/30 text-amber-600 dark:text-amber-400 text-sm font-semibold hover:bg-amber-50 dark:hover:bg-amber-500/5 transition-colors"
            >
                <Plus size={18} /> Add Task
            </button>
        </div>
    );
}
