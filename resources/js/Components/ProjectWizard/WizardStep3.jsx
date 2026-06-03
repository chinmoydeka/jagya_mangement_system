import React, { useState, useEffect, useRef } from 'react';
import { Upload, Mic, StopCircle, Info, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const inputCls = `w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200
    dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/50
    text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500`;

export default function WizardStep3({ data, update }) {
    const [recording, setRecording] = useState(false);
    const [recordingError, setRecordingError] = useState(null);

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
                setRecordingError('Microphone access requires a Secure Context (HTTPS or localhost). If you are accessing this server remotely via HTTP, please connect using secure HTTPS or localhost.');
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
                    const file = new File([audioBlob], `setup_voice_${Date.now()}.wav`, { type: 'audio/wav' });
                    
                    const existingVoices = data.setup_voices || [];
                    update({
                        setup_voices: [
                            ...existingVoices,
                            {
                                file,
                                name: `setup_voice_${Date.now()}.wav`,
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
                    setRecordingError('Microphone access was denied. Please allow microphone permissions in your browser settings.');
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

    const work_type = data.work_type || 'RCC';
    const plinth_area = data.plinth_area || '';
    const slab_area = data.slab_area || '';
    const head_room = data.head_room || false;
    const remarks = data.remarks || '';
    const other_info = data.other_info || '';
    const road_size = data.road_size || '';
    const road_direction = data.road_direction || 'North';

    const rcc_foundation = data.rcc_foundation || '';
    const rcc_finishing = data.rcc_finishing || '';

    // Determine class options based on agreement_date (threshold: 03-05-26 -> 2026-05-03)
    const isBeforeThreshold = data.agreement_date && data.agreement_date < "2026-05-03";
    const classOptions = isBeforeThreshold
        ? ['LUXUERY', 'PREMIUM', 'DELUX', 'A CLASS', 'B CLASS', 'C CLASS']
        : ['Infinite Series', 'Ultimate Luxury', 'Royal Classic', 'A Class', 'Royal Standard', 'Royal Basic', 'Prime Commercial'];

    const rcc_class = data.rcc_class || (isBeforeThreshold ? 'A CLASS' : 'A Class');

    // Auto-update rcc_class when options change to keep it valid
    useEffect(() => {
        if (work_type === 'RCC') {
            const isBefore = data.agreement_date && data.agreement_date < "2026-05-03";
            const options = isBefore
                ? ['LUXUERY', 'PREMIUM', 'DELUX', 'A CLASS', 'B CLASS', 'C CLASS']
                : ['Infinite Series', 'Ultimate Luxury', 'Royal Classic', 'A Class', 'Royal Standard', 'Royal Basic', 'Prime Commercial'];
            
            const current = data.rcc_class || '';
            if (!current || !options.includes(current)) {
                // Try case-insensitive matching
                const matched = options.find(opt => opt.toLowerCase() === current.toLowerCase());
                const updatedVal = matched || (isBefore ? 'A CLASS' : 'A Class');
                update({ rcc_class: updatedVal });
            }
        }
    }, [data.agreement_date, data.rcc_class, work_type]);

    const assam_roof_type = data.assam_roof_type || 'Tin';
    const assam_wood_quality = data.assam_wood_quality || 'Standard';
    const assam_rooms = data.assam_rooms || '';

    const other_scope = data.other_scope || '';

    const attachments = data.setup_files || [];
    const voiceNotes = data.setup_voices || [];

    return (
        <div className="p-6 space-y-6 animate-fade-in">
            <div className="bg-slate-50 dark:bg-slate-800/30 p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 space-y-5">
                {/* Work Type Selector */}
                <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Work Type</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {['RCC', 'ASSAM TYPE', 'RENOVATION', 'INTERIOR', 'HALF DONE', 'OTHER'].map(type => (
                            <button
                                key={type}
                                type="button"
                                onClick={() => update({ work_type: type })}
                                className={cn(
                                    "px-3 py-2.5 rounded-xl text-xs font-bold border transition-all duration-205",
                                    work_type === type
                                        ? "bg-amber-500 border-amber-500 text-white shadow-md shadow-amber-500/20 scale-[1.02]"
                                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-amber-300 dark:hover:border-amber-800"
                                    )}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Conditional Fields based on Work Type */}
                <div className="p-4 bg-white dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800/50 space-y-4 transition-all duration-300">
                    {work_type === 'RCC' && (
                        <div className="space-y-4 animate-fade-in">
                            <h4 className="text-xs font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider">RCC Structure Specifications</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Foundation (e.g., G+1, G+2)</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. G+1, G+2"
                                        value={rcc_foundation}
                                        onChange={e => update({ rcc_foundation: e.target.value })}
                                        className={inputCls}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Class</label>
                                    <select
                                        value={rcc_class}
                                        onChange={e => update({ rcc_class: e.target.value })}
                                        className={inputCls}
                                    >
                                        {classOptions.map(c => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {['ASSAM TYPE', 'RENOVATION', 'INTERIOR', 'HALF DONE', 'OTHER'].includes(work_type) && (
                        <div className="space-y-4 animate-fade-in">
                            <h4 className="text-xs font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider">{work_type} Specifications</h4>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Scope of Work & Specific Details</label>
                                <textarea
                                    rows={3}
                                    placeholder="Specify custom modifications, material choices, or specific project guidelines..."
                                    value={other_scope}
                                    onChange={e => update({ other_scope: e.target.value })}
                                    className={cn(inputCls, "resize-none")}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Area Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Plinth Area (as per agreement)</label>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="e.g., 1,200"
                                value={plinth_area}
                                onChange={e => update({ plinth_area: e.target.value })}
                                className={cn(inputCls, "pr-14")}
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 dark:text-slate-500 select-none">
                                Sq. Ft.
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Slab Area (as per agreement)</label>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="e.g., 1,450"
                                value={slab_area}
                                onChange={e => update({ slab_area: e.target.value })}
                                className={cn(inputCls, "pr-14")}
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 dark:text-slate-500 select-none">
                                Sq. Ft.
                            </div>
                        </div>
                    </div>
                </div>

                {/* Logistics and Site Information */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Road Size</label>
                        <input
                            type="text"
                            placeholder="e.g., 12 ft wide, 20 ft wide"
                            value={road_size}
                            onChange={e => update({ road_size: e.target.value })}
                            className={inputCls}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Road Direction</label>
                        <select
                            value={road_direction}
                            onChange={e => update({ road_direction: e.target.value })}
                            className={inputCls}
                        >
                            {['North', 'South', 'East', 'West', 'North-East', 'North-West', 'South-East', 'South-West'].map(d => (
                                <option key={d} value={d}>{d}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Head Room Checkbox */}
                <div className="flex items-center gap-3 pt-1">
                    <input
                        type="checkbox"
                        id="head_room"
                        checked={head_room}
                        onChange={e => update({ head_room: e.target.checked })}
                        className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900"
                    />
                    <label htmlFor="head_room" className="text-xs font-bold text-slate-600 dark:text-slate-400 cursor-pointer select-none">
                        Head-room is available on site
                    </label>
                </div>

                {/* Remarks & Other Information */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Remarks or Notation</label>
                        <input
                            type="text"
                            placeholder="General project notes, specific requests, client notifications, etc."
                            value={remarks}
                            onChange={e => update({ remarks: e.target.value })}
                            className={inputCls}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Other Information</label>
                        <textarea
                            rows={2}
                            placeholder="Any other supplementary information..."
                            value={other_info}
                            onChange={e => update({ other_info: e.target.value })}
                            className={cn(inputCls, "resize-none")}
                        />
                    </div>
                </div>

                {/* Voice Notes & File Attachments */}
                <div className="p-4 bg-white dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800/50 space-y-4">
                    <h4 className="text-xs font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Mic size={14} /> Voice Notes & Supporting Files
                    </h4>
                    
                    {recordingError && (
                        <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-xl flex items-start gap-2.5 mb-2.5">
                            <Info size={14} className="text-amber-500 shrink-0 mt-0.5" />
                            <div className="flex-1 space-y-0.5 text-left">
                                <p className="text-[10px] font-bold text-amber-800 dark:text-amber-400">Microphone Information</p>
                                <p className="text-[10px] leading-relaxed text-amber-700 dark:text-amber-500">{recordingError}</p>
                            </div>
                            <button type="button" onClick={() => setRecordingError(null)} className="text-[10px] font-bold text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-250 shrink-0">Dismiss</button>
                        </div>
                    )}

                    <div className="flex flex-wrap gap-3 pt-1">
                        <input 
                            type="file" 
                            multiple 
                            id="setup_attachments"
                            className="hidden" 
                            onChange={e => {
                                if (!e.target.files) return;
                                const files = Array.from(e.target.files).map(f => ({
                                    file: f,
                                    name: f.name,
                                    size: f.size
                                }));
                                update({ setup_files: [...attachments, ...files] });
                                e.target.value = '';
                            }} 
                        />

                        <button
                            type="button"
                            onClick={() => document.getElementById('setup_attachments')?.click()}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200/50"
                        >
                            <Upload size={13} />
                            Attach Files {attachments.length > 0 && `(${attachments.length})`}
                        </button>
                        
                        <button
                            type="button"
                            onClick={toggleRecording}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all border",
                                recording 
                                    ? "bg-red-500 hover:bg-red-650 text-white border-red-500 animate-pulse shadow-md"
                                    : "text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border-slate-200/50"
                            )}
                        >
                            <Mic size={13} className={cn(recording ? "text-white animate-pulse" : "text-red-500")} />
                            {recording ? "Recording... Click to Save" : "Record Voice Note"} {voiceNotes.length > 0 && `(${voiceNotes.length})`}
                        </button>
                    </div>

                    {/* List attachments and voice notes */}
                    {(attachments.length > 0 || voiceNotes.length > 0) && (
                        <div className="text-[11px] text-slate-500 space-y-1.5 pt-1">
                            {attachments.map((f, fi) => (
                                <div key={fi} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/40 p-1.5 px-3 rounded-lg border border-slate-200/20">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                        <span className="font-semibold text-slate-700 dark:text-slate-350 truncate max-w-xs">{f.name}</span>
                                        <span>({(f.size / 1024).toFixed(1)} KB)</span>
                                    </div>
                                    <button 
                                        type="button" 
                                        onClick={() => update({ setup_files: attachments.filter((_, idx) => idx !== fi) })}
                                        className="text-red-500 hover:text-red-650 p-0.5"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            ))}
                            {voiceNotes.map((v, vi) => (
                                <div key={vi} className="flex items-center justify-between bg-red-50/50 dark:bg-red-500/5 p-1.5 px-3 rounded-lg border border-red-150/40">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                        <span className="font-semibold text-red-600 dark:text-red-400 truncate max-w-xs">{v.name}</span>
                                        <span>({(v.size / 1024).toFixed(1)} KB)</span>
                                    </div>
                                    <button 
                                        type="button" 
                                        onClick={() => update({ setup_voices: voiceNotes.filter((_, idx) => idx !== vi) })}
                                        className="text-red-500 hover:text-red-650 p-0.5"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
