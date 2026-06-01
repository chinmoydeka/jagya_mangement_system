import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Check, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

/**
 * Convert any image file (including HEIC/HEIF from iPhones) to a
 * correctly-oriented JPEG data URL, ready for canvas rendering.
 *
 * Pipeline:
 *  1. HEIC/HEIF  → heic2any  → JPEG blob
 *  2. Any format → exifr     → read EXIF orientation
 *  3. Draw on offscreen canvas with correct transform
 *  4. Return corrected data URL
 */
async function prepareImageSrc(file) {
    let workingFile = file;

    // ── Step 1: Convert HEIC/HEIF to JPEG ──────────────────────────────────
    const isHeic =
        file.type === 'image/heic' ||
        file.type === 'image/heif' ||
        /\.(heic|heif)$/i.test(file.name);

    if (isHeic) {
        try {
            const heic2any = (await import('heic2any')).default;
            const converted = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.92 });
            // heic2any may return a single Blob or an array
            const blob = Array.isArray(converted) ? converted[0] : converted;
            workingFile = new File([blob], file.name.replace(/\.(heic|heif)$/i, '.jpg'), {
                type: 'image/jpeg',
            });
        } catch (err) {
            console.error('HEIC conversion failed:', err);
            // Signal to the caller that manual conversion is needed
            const e = new Error('HEIC_NOT_SUPPORTED');
            e.isHeicError = true;
            throw e;
        }
    }

    // ── Step 2: Read raw data URL ───────────────────────────────────────────
    const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload  = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(workingFile);
    });

    // ── Step 3: Read EXIF orientation ──────────────────────────────────────
    let orientation = 1;
    try {
        const exifr = (await import('exifr')).default;
        const exif  = await exifr.parse(workingFile, ['Orientation']);
        if (exif?.Orientation) orientation = exif.Orientation;
    } catch (_) { /* no EXIF → keep orientation 1 */ }

    // ── Step 4: If orientation is normal, return as-is ────────────────────
    if (orientation === 1) return dataUrl;

    // ── Step 5: Draw corrected version on offscreen canvas ─────────────────
    const img = await new Promise((resolve, reject) => {
        const i  = new Image();
        i.onload  = () => resolve(i);
        i.onerror = reject;
        i.src     = dataUrl;
    });

    const swap = orientation >= 5;
    const canvas   = document.createElement('canvas');
    canvas.width   = swap ? img.naturalHeight : img.naturalWidth;
    canvas.height  = swap ? img.naturalWidth  : img.naturalHeight;
    const ctx = canvas.getContext('2d');

    switch (orientation) {
        case 2: ctx.transform(-1, 0,  0,  1, canvas.width,  0);              break;
        case 3: ctx.transform(-1, 0,  0, -1, canvas.width,  canvas.height);  break;
        case 4: ctx.transform( 1, 0,  0, -1, 0,             canvas.height);  break;
        case 5: ctx.transform( 0, 1,  1,  0, 0,             0);              break;
        case 6: ctx.transform( 0, 1, -1,  0, canvas.height, 0);              break;
        case 7: ctx.transform( 0,-1, -1,  0, canvas.height, canvas.width);   break;
        case 8: ctx.transform( 0,-1,  1,  0, 0,             canvas.width);   break;
        default: break;
    }

    ctx.drawImage(img, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.92);
}

// ────────────────────────────────────────────────────────────────────────────
export default function ImageCropperModal({ isOpen, onClose, originalFile, onCropComplete, shape = 'circle' }) {
    const canvasRef = useRef(null);
    const imgRef    = useRef(null);

    const [isDragging, setIsDragging]               = useState(false);
    const [dragStart, setDragStart]                 = useState({ x: 0, y: 0 });
    const [offset, setOffset]                       = useState({ x: 0, y: 0 });
    const [scale, setScale]                         = useState(1);
    const [imageLoaded, setImageLoaded]             = useState(false);
    const [processing, setProcessing]               = useState(false);
    const [preparing, setPreparing]                 = useState(false);
    const [prepareStatus, setPrepareStatus]         = useState('');
    const [prepareError, setPrepareError]           = useState(null); // null | 'heic' | 'generic'

    const CANVAS_SIZE = 320;
    const CROP_SIZE   = 260;

    // ── Prepare image whenever a new file arrives ────────────────────────
    useEffect(() => {
        if (!isOpen || !originalFile) return;

        setImageLoaded(false);
        setOffset({ x: 0, y: 0 });
        setScale(1);
        setPreparing(true);
        setPrepareError(null);

        const isHeic =
            originalFile.type === 'image/heic' ||
            originalFile.type === 'image/heif' ||
            /\.(heic|heif)$/i.test(originalFile.name);

        setPrepareStatus(isHeic ? 'Converting iPhone photo…' : 'Loading image…');

        prepareImageSrc(originalFile)
            .then(correctedSrc => {
                const img    = new Image();
                img.onload   = () => {
                    imgRef.current = img;
                    const fit = Math.max(CROP_SIZE / img.naturalWidth, CROP_SIZE / img.naturalHeight);
                    setScale(fit);
                    setImageLoaded(true);
                    setPreparing(false);
                };
                img.onerror  = () => {
                    setPreparing(false);
                    setPrepareError('generic');
                };
                img.src = correctedSrc;
            })
            .catch(err => {
                setPreparing(false);
                if (err.isHeicError) {
                    setPrepareError('heic');
                } else {
                    setPrepareError('generic');
                }
            });
    }, [isOpen, originalFile]);

    // ── Canvas draw ─────────────────────────────────────────────────────
    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        const img    = imgRef.current;
        if (!canvas || !img || !imageLoaded) return;

        const ctx  = canvas.getContext('2d');
        ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

        const imgW = img.naturalWidth  * scale;
        const imgH = img.naturalHeight * scale;
        const cx   = CANVAS_SIZE / 2 + offset.x;
        const cy   = CANVAS_SIZE / 2 + offset.y;

        // 1. Background image
        ctx.drawImage(img, cx - imgW / 2, cy - imgH / 2, imgW, imgH);

        // 2. Dark overlay
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

        // 3. Cut-out shape
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        if (shape === 'square') {
            ctx.rect((CANVAS_SIZE - CROP_SIZE) / 2, (CANVAS_SIZE - CROP_SIZE) / 2, CROP_SIZE, CROP_SIZE);
        } else {
            ctx.arc(CANVAS_SIZE / 2, CANVAS_SIZE / 2, CROP_SIZE / 2, 0, Math.PI * 2);
        }
        ctx.fill();
        ctx.restore();

        // 4. Re-draw image inside shape only
        ctx.save();
        ctx.beginPath();
        if (shape === 'square') {
            ctx.rect((CANVAS_SIZE - CROP_SIZE) / 2, (CANVAS_SIZE - CROP_SIZE) / 2, CROP_SIZE, CROP_SIZE);
        } else {
            ctx.arc(CANVAS_SIZE / 2, CANVAS_SIZE / 2, CROP_SIZE / 2, 0, Math.PI * 2);
        }
        ctx.clip();
        ctx.drawImage(img, cx - imgW / 2, cy - imgH / 2, imgW, imgH);
        ctx.restore();

        // 5. Amber ring/border
        ctx.save();
        ctx.strokeStyle = 'rgba(245,158,11,0.9)';
        ctx.lineWidth   = 2;
        ctx.beginPath();
        if (shape === 'square') {
            ctx.rect((CANVAS_SIZE - CROP_SIZE) / 2, (CANVAS_SIZE - CROP_SIZE) / 2, CROP_SIZE, CROP_SIZE);
        } else {
            ctx.arc(CANVAS_SIZE / 2, CANVAS_SIZE / 2, CROP_SIZE / 2, 0, Math.PI * 2);
        }
        ctx.stroke();
        ctx.restore();
    }, [imageLoaded, scale, offset, shape]);

    useEffect(() => { draw(); }, [draw]);

    // ── Pointer / touch handlers ─────────────────────────────────────────
    const getXY = (e) => ({
        x: e.clientX ?? e.touches?.[0]?.clientX ?? 0,
        y: e.clientY ?? e.touches?.[0]?.clientY ?? 0,
    });

    const handlePointerDown = (e) => {
        e.preventDefault();
        const rect = canvasRef.current.getBoundingClientRect();
        const { x, y } = getXY(e);
        setIsDragging(true);
        setDragStart({ x: x - rect.left - offset.x, y: y - rect.top - offset.y });
    };

    const handlePointerMove = (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const rect = canvasRef.current.getBoundingClientRect();
        const { x, y } = getXY(e);
        setOffset({ x: x - rect.left - dragStart.x, y: y - rect.top - dragStart.y });
    };

    const handlePointerUp   = () => setIsDragging(false);

    const handleWheel = (e) => {
        e.preventDefault();
        setScale(prev => Math.min(5, Math.max(0.1, prev + (e.deltaY > 0 ? -0.07 : 0.07))));
    };

    // ── Apply crop ───────────────────────────────────────────────────────
    const handleApplyCrop = () => {
        const img = imgRef.current;
        if (!img || !imageLoaded) { alert('Image not loaded yet.'); return; }
        setProcessing(true);

        try {
            const OUT = 400;
            const out = document.createElement('canvas');
            out.width = out.height = OUT;
            const ctx   = out.getContext('2d');
            const ratio = OUT / CANVAS_SIZE;
            const imgW  = img.naturalWidth  * scale * ratio;
            const imgH  = img.naturalHeight * scale * ratio;
            const cx    = OUT / 2 + offset.x * ratio;
            const cy    = OUT / 2 + offset.y * ratio;

            if (shape !== 'square') {
                ctx.beginPath();
                ctx.arc(OUT / 2, OUT / 2, OUT / 2, 0, Math.PI * 2);
                ctx.clip();
            }
            ctx.drawImage(img, cx - imgW / 2, cy - imgH / 2, imgW, imgH);

            out.toBlob(blob => {
                if (blob) {
                    const file = new File([blob], 'profile.jpg', { type: 'image/jpeg' });
                    onCropComplete(file, URL.createObjectURL(file));
                } else {
                    alert('Failed to export image. Please try again.');
                }
                setProcessing(false);
            }, 'image/jpeg', 0.92);
        } catch (err) {
            console.error('Crop error:', err);
            alert('Failed to crop image. Please try again.');
            setProcessing(false);
        }
    };

    if (!isOpen || !originalFile) return null;

    const busy = preparing || (!imageLoaded && !prepareError);

    return (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-slate-900 rounded-3xl w-full max-w-sm shadow-2xl border border-slate-700 flex flex-col overflow-hidden">

                {/* Header */}
                <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
                    <h3 className="font-bold text-slate-200 text-sm">
                        {prepareError ? '⚠️ Cannot Load Image' : 'Crop Profile Picture'}
                    </h3>
                    <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-200 rounded-full hover:bg-slate-800 transition-colors">
                        <X size={16} />
                    </button>
                </div>

                {/* Canvas / Loader / Error */}
                <div className="flex items-center justify-center bg-slate-950 py-4 min-h-[300px] px-5">

                    {/* Loading spinner */}
                    {busy && (
                        <div className="flex flex-col items-center gap-3 text-slate-400">
                            <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                            <span className="text-xs font-medium">{prepareStatus}</span>
                            {preparing && originalFile && /\.(heic|heif)$/i.test(originalFile.name) && (
                                <span className="text-[10px] text-slate-500 text-center max-w-[200px]">
                                    Converting Apple HEIC format — this may take a moment
                                </span>
                            )}
                        </div>
                    )}

                    {/* HEIC error guide */}
                    {!busy && prepareError === 'heic' && (
                        <div className="w-full space-y-4 py-2">
                            <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl">
                                <span className="text-2xl mt-0.5">📸</span>
                                <div>
                                    <p className="text-amber-400 font-bold text-sm mb-1">HEIC format not supported</p>
                                    <p className="text-slate-400 text-xs leading-relaxed">
                                        Your iPhone photo is in HEIC format which cannot be processed in this browser.
                                        Please convert it first using one of the methods below.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-2.5">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">How to convert on iPhone</p>

                                <div className="flex items-start gap-3 p-3 bg-slate-800 rounded-xl">
                                    <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                                    <p className="text-xs text-slate-300 leading-relaxed">
                                        Open <strong className="text-white">Settings → Camera → Formats</strong> and choose <strong className="text-amber-400">Most Compatible</strong>. Future photos will be saved as JPEG.
                                    </p>
                                </div>

                                <div className="flex items-start gap-3 p-3 bg-slate-800 rounded-xl">
                                    <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                                    <p className="text-xs text-slate-300 leading-relaxed">
                                        Or open the photo in <strong className="text-white">Files app</strong>, tap Share → <strong className="text-amber-400">Save Image</strong> — iPhone will auto-convert to JPEG on share.
                                    </p>
                                </div>

                                <div className="flex items-start gap-3 p-3 bg-slate-800 rounded-xl">
                                    <span className="w-5 h-5 rounded-full bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                                    <p className="text-xs text-slate-300 leading-relaxed">
                                        Or use a free online converter: visit{' '}
                                        <a href="https://heictojpg.com" target="_blank" rel="noreferrer"
                                            className="text-amber-400 underline font-semibold">heictojpg.com</a>
                                        , convert the file, then re-upload the JPG here.
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={onClose}
                                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-colors"
                            >
                                OK, I'll Re-upload as JPEG
                            </button>
                        </div>
                    )}

                    {/* Generic error */}
                    {!busy && prepareError === 'generic' && (
                        <div className="w-full space-y-4 py-2">
                            <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl">
                                <span className="text-2xl mt-0.5">❌</span>
                                <div>
                                    <p className="text-red-400 font-bold text-sm mb-1">Could not load image</p>
                                    <p className="text-slate-400 text-xs leading-relaxed">
                                        This file could not be loaded for cropping. Please try a different image in JPG or PNG format.
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                className="w-full py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold transition-colors"
                            >
                                Try Another File
                            </button>
                        </div>
                    )}

                    {/* Canvas cropper */}
                    {!busy && !prepareError && (
                        <canvas
                            ref={canvasRef}
                            width={CANVAS_SIZE}
                            height={CANVAS_SIZE}
                            className="rounded-xl cursor-grab active:cursor-grabbing"
                            style={{ touchAction: 'none', userSelect: 'none' }}
                            onMouseDown={handlePointerDown}
                            onMouseMove={handlePointerMove}
                            onMouseUp={handlePointerUp}
                            onMouseLeave={handlePointerUp}
                            onTouchStart={handlePointerDown}
                            onTouchMove={handlePointerMove}
                            onTouchEnd={handlePointerUp}
                            onWheel={handleWheel}
                        />
                    )}
                </div>

                {/* Controls — only shown when cropper is active */}
                {!prepareError && (
                    <div className="px-5 pb-5 pt-3 bg-slate-900 space-y-4">
                        <p className="text-center text-[11px] text-slate-500">
                            Drag to reposition · Scroll or slider to zoom
                        </p>

                        <div className="flex items-center gap-3">
                            <button type="button" onClick={() => setScale(s => Math.max(0.1, +(s - 0.1).toFixed(2)))}
                                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors">
                                <ZoomOut size={14} />
                            </button>
                            <input type="range" min={0.3} max={5} step={0.05} value={scale}
                                onChange={e => setScale(parseFloat(e.target.value))}
                                className="flex-1 accent-amber-500" />
                            <button type="button" onClick={() => setScale(s => Math.min(5, +(s + 0.1).toFixed(2)))}
                                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors">
                                <ZoomIn size={14} />
                            </button>
                            <button type="button" onClick={() => { setScale(1); setOffset({ x: 0, y: 0 }); }}
                                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                                title="Reset">
                                <RotateCcw size={14} />
                            </button>
                        </div>

                        <div className="flex justify-end gap-2">
                            <button type="button" onClick={onClose}
                                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors">
                                Cancel
                            </button>
                            <button type="button" onClick={handleApplyCrop} disabled={busy || processing}
                                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold transition-colors flex items-center gap-1.5">
                                {processing
                                    ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    : <Check size={14} />}
                                {processing ? 'Processing…' : 'Apply Crop'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
