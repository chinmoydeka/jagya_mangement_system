import React, { useState, useEffect, useRef } from 'react';
import { router, useForm } from '@inertiajs/react';
import { X, User, Phone, Mail, MapPin, FileText, Save, Loader2, Search, Navigation, Compass, Globe, LocateFixed } from 'lucide-react';
import { cn } from '@/lib/utils';

const INDIAN_STATES = [
    'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh',
    'Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka',
    'Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram',
    'Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana',
    'Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
    'Andaman and Nicobar Islands','Chandigarh','Dadra and Nagar Haveli',
    'Daman and Diu','Delhi','Jammu and Kashmir','Ladakh','Lakshadweep','Puducherry',
];

const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

// Search using free OSM Nominatim — no API key needed
async function nominatimSearch(query) {
    const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(query)}`
    );
    return res.json();
}

const inputCls = `w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 
    dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/50 
    text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500`;

const labelCls = 'block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider';

function Field({ label, required, error, children }) {
    return (
        <div>
            <label className={labelCls}>{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
            {children}
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
    );
}

import axios from 'axios';
import ImageCropperModal from '@/Components/ImageCropperModal';

export default function ClientFormDrawer({ open, onClose, client = null, onSaved, useAxios = false }) {
    const isEdit = !!client;
    const [axiosProcessing, setAxiosProcessing] = useState(false);
    const [axiosErrors, setAxiosErrors] = useState({});
    
    // For Cropper
    const [cropModalOpen, setCropModalOpen] = useState(false);
    const [rawOriginalFile, setRawOriginalFile] = useState(null);

    // Map state
    const [showMap, setShowMap]           = useState(false);
    const [tempAddress, setTempAddress]   = useState('');
    const [coords, setCoords]             = useState({ lat: 26.1445, lng: 91.7362 });
    const [locating, setLocating]         = useState(false);
    const [mapQuery, setMapQuery]         = useState('');
    const [suggestions, setSuggestions]   = useState([]);
    const [searchingMap, setSearchingMap] = useState(false);
    const suggestDebounce                 = useRef(null);
    const [mapError, setMapError]         = useState(null);

    const mapDivRef   = useRef(null);
    const mapRef      = useRef(null);
    const markerRef   = useRef(null);
    const geocoderRef = useRef(null);
    const mapAddressCompsRef = useRef(null);

    const { data, setData, post, put, processing: inertiaProcessing, errors: inertiaErrors, reset, clearErrors } = useForm({
        name: '',
        mobile: '',
        alternate_mobile: '',
        email: '',
        address: '',
        city: '',
        state: 'Assam',
        pincode: '',
        pan_number: '',
        gst_number: '',
        aadhaar_number: '',
        notes: '',
        map_location: '',
        latitude: '',
        longitude: '',
        photo: null,
    });
    
    const [photoPreview, setPhotoPreview] = useState(null);

    // ── Load Google Maps JS API ─────────────────
    const loadGoogleMaps = (cb) => {
        if (window.google?.maps) { cb(); return; }
        const id = 'gmap-script';
        if (!document.getElementById(id)) {
            const s = document.createElement('script');
            s.id    = id;
            s.src   = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_API_KEY}`;
            s.async = true;
            s.defer = true;
            s.onload = cb;
            document.head.appendChild(s);
        } else {
            const iv = setInterval(() => { if (window.google?.maps) { clearInterval(iv); cb(); } }, 80);
        }
    };

    // ── Nominatim-powered address suggestions ─────────────
    useEffect(() => {
        if (mapQuery.length < 3) { setSuggestions([]); return; }
        clearTimeout(suggestDebounce.current);
        suggestDebounce.current = setTimeout(async () => {
            setSearchingMap(true);
            try {
                const results = await nominatimSearch(mapQuery);
                setSuggestions(results.slice(0, 5));
            } catch {}
            finally { setSearchingMap(false); }
        }, 400);
    }, [mapQuery]);

    const pickSuggestion = (s) => {
        const lat = parseFloat(s.lat), lng = parseFloat(s.lon);
        setSuggestions([]);
        setMapQuery(s.display_name);
        setCoords({ lat, lng });
        setTempAddress(s.display_name);
        if (mapRef.current && markerRef.current) {
            mapRef.current.panTo({ lat, lng });
            mapRef.current.setZoom(16);
            markerRef.current.setPosition({ lat, lng });
        }
    };

    useEffect(() => {
        if (!showMap) return;
        loadGoogleMaps(() => setTimeout(initMap, 150));
    }, [showMap]);

    // ── Init Map ───────────────────────────────────────────────────────────────
    const initMap = () => {
        if (!window.google?.maps || !mapDivRef.current) return;
        const G = window.google.maps;

        // Tear down old instance
        if (mapRef.current) { G.event.clearInstanceListeners(mapRef.current); }

        const map = new G.Map(mapDivRef.current, {
            center: { lat: coords.lat, lng: coords.lng },
            zoom: 15,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
            zoomControl: true,
            gestureHandling: 'greedy',
            styles: [
                { featureType:'poi.business', stylers:[{visibility:'off'}] },
                { featureType:'transit',      stylers:[{visibility:'off'}] },
            ],
        });
        mapRef.current = map;

        // Marker
        const marker = new G.Marker({
            position: { lat: coords.lat, lng: coords.lng },
            map,
            draggable: true,
            animation: G.Animation.DROP,
            title: 'Drag to set client location',
        });
        markerRef.current = marker;

        geocoderRef.current = new G.Geocoder();

        // Reverse-geocode initial position if no address yet
        if (!tempAddress) reverseGeocode(coords.lat, coords.lng);

        // Marker drag
        marker.addListener('dragend', () => {
            const p = marker.getPosition();
            const lat = p.lat(), lng = p.lng();
            setCoords({ lat, lng });
            reverseGeocode(lat, lng);
        });

        // Click map
        map.addListener('click', (e) => {
            const lat = e.latLng.lat(), lng = e.latLng.lng();
            marker.setPosition({ lat, lng });
            setCoords({ lat, lng });
            reverseGeocode(lat, lng);
        });
    };

    // ── Reverse Geocode ────────────────────────────────────────────────────────
    const reverseGeocode = (lat, lng) => {
        if (!geocoderRef.current) return;
        geocoderRef.current.geocode({ location: { lat, lng } }, (results, status) => {
            if (status === 'OK' && results[0]) {
                setTempAddress(results[0].formatted_address);

                // Parse structured components
                let street = '';
                let city = '';
                let state = '';
                let pincode = '';

                const comps = results[0].address_components || [];
                comps.forEach(c => {
                    const types = c.types;
                    // Street/Area parts
                    if (types.includes('premise') || types.includes('sublocality') || types.includes('sublocality_level_1') || types.includes('sublocality_level_2') || types.includes('route') || types.includes('neighborhood')) {
                        street = street ? street + ', ' + c.long_name : c.long_name;
                    }
                    // Locality (City)
                    if (types.includes('locality')) {
                        city = c.long_name;
                    }
                    // Administrative Area Level 1 (State)
                    if (types.includes('administrative_area_level_1')) {
                        state = c.long_name;
                    }
                    // Postal Code (Pincode)
                    if (types.includes('postal_code')) {
                        pincode = c.long_name;
                    }
                });

                mapAddressCompsRef.current = { street, city, state, pincode, formatted: results[0].formatted_address };
            } else {
                setTempAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
                mapAddressCompsRef.current = null;
            }
        });
    };

    // ── Use My Location ────────────────────────────────────────────────────────
    const useMyLocation = () => {
        setMapError(null);
        if (!navigator.geolocation) {
            setMapError('Browser Geolocation is not supported, or requires a Secure Context (HTTPS / localhost) to access.');
            return;
        }
        setLocating(true);
        navigator.geolocation.getCurrentPosition(
            ({ coords: c }) => {
                const lat = c.latitude, lng = c.longitude;
                setCoords({ lat, lng });
                reverseGeocode(lat, lng);
                if (mapRef.current && markerRef.current) {
                    mapRef.current.panTo({ lat, lng });
                    mapRef.current.setZoom(17);
                    markerRef.current.setPosition({ lat, lng });
                }
                setLocating(false);
            },
            (err) => {
                setLocating(false);
                if (err.code === err.PERMISSION_DENIED) {
                    setMapError('Location access was denied. Modern browsers require a secure connection (HTTPS or localhost) to use location features. If you are accessing this server remotely via HTTP, please manually search or drag the pin to set the location.');
                } else {
                    setMapError('Failed to fetch your location: ' + err.message);
                }
            },
            { enableHighAccuracy: true, timeout: 8000 }
        );
    };

    // ── Confirm ────────────────────────────────────────────────────────────────
    const confirmLocation = () => {
        const comps = mapAddressCompsRef.current;
        
        const matchedState = comps?.state && INDIAN_STATES.includes(comps.state) 
            ? comps.state 
            : data.state;

        setData({
            ...data,
            latitude: coords.lat.toString(),
            longitude: coords.lng.toString(),
            map_location: `https://www.google.com/maps?q=${coords.lat},${coords.lng}`,
            // Automatically fill address fields that are currently empty
            address: data.address?.trim() ? data.address : (comps?.street || tempAddress),
            city: data.city?.trim() ? data.city : (comps?.city || ''),
            state: data.state && data.state !== 'Assam' ? data.state : matchedState,
            pincode: data.pincode?.trim() ? data.pincode : (comps?.pincode || ''),
        });
        
        setShowMap(false);
    };

    useEffect(() => {
        if (open) {
            if (client) {
                const initData = { ...data };
                Object.keys(initData).forEach(k => {
                    if (k !== 'photo') initData[k] = client[k] ?? '';
                });
                setData(initData);
                setPhotoPreview(client.photo_path || null);

                // Parse coordinates for Google Maps picker if it exists
                if (client.latitude && client.longitude) {
                    setCoords({ lat: parseFloat(client.latitude), lng: parseFloat(client.longitude) });
                } else if (client.map_location) {
                    const match = client.map_location.match(/q=([\d.-]+),([\d.-]+)/);
                    if (match) {
                        setCoords({ lat: parseFloat(match[1]), lng: parseFloat(match[2]) });
                    }
                }
            } else {
                reset();
                setPhotoPreview(null);
                setCoords({ lat: 26.1445, lng: 91.7362 });
                setTempAddress('');
            }
            clearErrors();
            setAxiosErrors({});
        }
    }, [open, client]);

    async function submit(e) {
        e.preventDefault();
        setAxiosProcessing(true);
        setAxiosErrors({});

        const formData = new FormData();
        Object.keys(data).forEach(k => {
            if (k === 'photo') {
                if (data[k]) formData.append('photo', data[k]); // only append if a new file was selected
            } else if (data[k] !== null && data[k] !== undefined) {
                formData.append(k, data[k]);
            }
        });

        // Laravel needs _method=PUT for spoofed PUT via POST
        if (isEdit) formData.append('_method', 'PUT');

        try {
            const res = await axios.post(
                isEdit ? `/clients/${client.id}` : '/clients',
                formData,
                {
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest',
                        'Accept': 'application/json',
                        'Content-Type': 'multipart/form-data',
                    }
                }
            );
            setAxiosProcessing(false);
            onClose();
            if (onSaved) onSaved(res.data.client);
            // Reload the page to reflect changes (Inertia)
            router.reload();
        } catch (err) {
            setAxiosProcessing(false);
            if (err.response?.data?.errors) {
                setAxiosErrors(err.response.data.errors);
            } else {
                alert(err.response?.data?.message || 'An error occurred while saving client details.');
            }
        }
    }

    const processing = useAxios ? axiosProcessing : inertiaProcessing;
    const errors = useAxios ? axiosErrors : inertiaErrors;

    if (!open) return null;

    return (
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
                onClick={onClose}
            />

            {/* Drawer */}
            <div className="fixed inset-y-0 right-0 z-50 w-full max-w-xl bg-white dark:bg-slate-900 shadow-2xl flex flex-col animate-slide-in">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 dark:border-slate-800">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                            {isEdit ? 'Edit Client' : 'Add New Client'}
                        </h2>
                        <p className="text-xs text-slate-400 mt-0.5">
                            {isEdit ? `Editing: ${client.name}` : 'Fill in the details below'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Form */}
                <form id="client-form" onSubmit={submit} className="flex-1 overflow-y-auto">
                    <div className="p-6 space-y-6">
                        {/* Section: Basic Info */}
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-500/15 flex items-center justify-center">
                                    <User size={14} className="text-amber-600" />
                                </div>
                                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Basic Information</h3>
                            </div>
                            
                            <div className="mb-6 flex flex-col items-center sm:items-start">
                                <label className={labelCls}>Profile Photo</label>
                                <div className="flex items-center gap-4 mt-2">
                                    <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center">
                                        {photoPreview ? (
                                            <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <User size={24} className="text-slate-400" />
                                        )}
                                    </div>
                                    <div>
                                        <label className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors inline-block">
                                            Upload Image
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={e => {
                                                    const file = e.target.files[0];
                                                    if (file) {
                                                        setRawOriginalFile(file);
                                                        setCropModalOpen(true);
                                                    }
                                                    e.target.value = '';
                                                }}
                                            />
                                        </label>
                                        <p className="text-[10px] text-slate-500 mt-1">Max size: 2MB. Format: JPG, PNG.</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="sm:col-span-2">
                                    <Field label="Client Name" required error={errors.name}>
                                        <input
                                            type="text"
                                            value={data.name}
                                            onChange={e => setData('name', e.target.value)}
                                            placeholder="e.g. Ramesh Sharma"
                                            className={cn(inputCls, errors.name && 'border-red-400')}
                                        />
                                    </Field>
                                </div>
                                <Field label="Mobile Number" required error={errors.mobile}>
                                    <input
                                        type="tel"
                                        value={data.mobile}
                                        onChange={e => setData('mobile', e.target.value)}
                                        placeholder="+91 98765 43210"
                                        className={cn(inputCls, errors.mobile && 'border-red-400')}
                                    />
                                </Field>
                                <Field label="Alternate Number" error={errors.alternate_mobile}>
                                    <input
                                        type="tel"
                                        value={data.alternate_mobile}
                                        onChange={e => setData('alternate_mobile', e.target.value)}
                                        placeholder="Optional"
                                        className={inputCls}
                                    />
                                </Field>
                                <div className="sm:col-span-2">
                                    <Field label="Email Address" error={errors.email}>
                                        <input
                                            type="email"
                                            value={data.email}
                                            onChange={e => setData('email', e.target.value)}
                                            placeholder="client@email.com"
                                            className={inputCls}
                                        />
                                    </Field>
                                </div>
                            </div>
                        </div>

                        {/* Section: Address */}
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-500/15 flex items-center justify-center">
                                    <MapPin size={14} className="text-blue-600" />
                                </div>
                                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Address</h3>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="sm:col-span-2">
                                    <Field label="Street Address" error={errors.address}>
                                        <textarea
                                            value={data.address}
                                            onChange={e => setData('address', e.target.value)}
                                            rows={2}
                                            placeholder="House/Building, Street, Area"
                                            className={cn(inputCls, 'resize-none')}
                                        />
                                    </Field>
                                </div>
                                <Field label="City" error={errors.city}>
                                    <input
                                        type="text"
                                        value={data.city}
                                        onChange={e => setData('city', e.target.value)}
                                        placeholder="e.g. Guwahati"
                                        className={inputCls}
                                    />
                                </Field>
                                <Field label="State" error={errors.state}>
                                    <select
                                        value={data.state}
                                        onChange={e => setData('state', e.target.value)}
                                        className={inputCls}
                                    >
                                        {INDIAN_STATES.map(s => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </select>
                                </Field>
                                <Field label="Pincode" error={errors.pincode}>
                                    <input
                                        type="text"
                                        value={data.pincode}
                                        onChange={e => setData('pincode', e.target.value)}
                                        placeholder="781001"
                                        maxLength={6}
                                        className={inputCls}
                                    />
                                </Field>
                                <div className="sm:col-span-2">
                                    <label className={labelCls}>Google Map Location (Optional)</label>
                                    <button type="button" onClick={() => setShowMap(true)}
                                        className="w-full flex items-center gap-4 p-4 border-2 border-dashed border-amber-300 dark:border-amber-500/25 rounded-2xl bg-amber-50/30 dark:bg-amber-500/5 hover:bg-amber-50 hover:border-amber-400 transition-all group mt-1">
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-amber-200 dark:shadow-amber-900/30 group-hover:scale-105 transition-transform shrink-0">
                                            <MapPin size={22} />
                                        </div>
                                        <div className="text-left flex-1 min-w-0">
                                            <p className="font-semibold text-sm text-slate-800 dark:text-slate-100">
                                                {data.map_location ? '📍 Google Maps location set — click to change' : '🗺️ Pick location on Google Maps'}
                                            </p>
                                            <p className="text-xs text-slate-400 truncate mt-0.5">
                                                {data.map_location || 'Search address · drag pin · click on map'}
                                            </p>
                                        </div>
                                        {data.map_location && (
                                            <span className="text-[10px] font-mono bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 px-2 py-1 rounded-lg shrink-0">
                                                Set
                                            </span>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Section: Additional */}
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-500/15 flex items-center justify-center">
                                    <FileText size={14} className="text-purple-600" />
                                </div>
                                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Additional Information</h3>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Field label="PAN Number" error={errors.pan_number}>
                                    <input
                                        type="text"
                                        value={data.pan_number}
                                        onChange={e => setData('pan_number', e.target.value.toUpperCase())}
                                        placeholder="ABCDE1234F"
                                        maxLength={10}
                                        className={inputCls}
                                    />
                                </Field>
                                <Field label="GST Number" error={errors.gst_number}>
                                    <input
                                        type="text"
                                        value={data.gst_number}
                                        onChange={e => setData('gst_number', e.target.value.toUpperCase())}
                                        placeholder="18AABCU9603R1ZM"
                                        className={inputCls}
                                    />
                                </Field>
                                <div className="sm:col-span-2">
                                    <Field label="Aadhaar Number" error={errors.aadhaar_number}>
                                        <input
                                            type="text"
                                            value={data.aadhaar_number}
                                            onChange={e => setData('aadhaar_number', e.target.value)}
                                            placeholder="XXXX XXXX XXXX"
                                            maxLength={14}
                                            className={inputCls}
                                        />
                                    </Field>
                                </div>
                                <div className="sm:col-span-2">
                                    <Field label="Notes" error={errors.notes}>
                                        <textarea
                                            value={data.notes}
                                            onChange={e => setData('notes', e.target.value)}
                                            rows={3}
                                            placeholder="Any important notes about this client..."
                                            className={cn(inputCls, 'resize-none')}
                                        />
                                    </Field>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>

                {/* Footer Actions */}
                <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="client-form"
                        disabled={processing || !data.name?.trim() || !data.mobile?.trim()}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ background: 'linear-gradient(135deg, #f59e0b, #dc2626)', boxShadow: '0 4px 14px rgba(245,158,11,0.3)' }}
                    >
                        {processing ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        {isEdit ? 'Save Changes' : 'Create Client'}
                    </button>
                </div>
            </div>
            
            <ImageCropperModal
                isOpen={cropModalOpen}
                onClose={() => {
                    setCropModalOpen(false);
                    setRawOriginalFile(null);
                }}
                shape="square"
                originalFile={rawOriginalFile}
                onCropComplete={(croppedFile, previewUrl) => {
                    setData('photo', croppedFile);
                    setPhotoPreview(previewUrl);
                    setCropModalOpen(false);
                    setRawOriginalFile(null);
                }}
            />

            {showMap && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6">
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowMap(false)} />

                    <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden">

                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shadow">
                                    <Navigation size={17} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Google Maps Location Picker</h3>
                                    <p className="text-xs text-slate-400">Search · drag pin · or click on map to set location</p>
                                </div>
                            </div>
                            <button type="button" onClick={() => setShowMap(false)}
                                className="w-8 h-8 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors">
                                <X size={18} />
                            </button>
                        </div>

                        {/* Search bar with Nominatim suggestions */}
                        <div className="px-6 pt-4 pb-3 shrink-0 flex gap-2 items-start">
                            <div className="relative flex-1">
                                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                <input
                                    type="text"
                                    value={mapQuery}
                                    onChange={e => setMapQuery(e.target.value)}
                                    onBlur={() => setTimeout(() => setSuggestions([]), 200)}
                                    placeholder="Search for an address or place..."
                                    className={cn(inputCls, 'pl-9 pr-8')}
                                />
                                {searchingMap && <Loader2 size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 animate-spin" />}

                                {/* Suggestion dropdown */}
                                {suggestions.length > 0 && (
                                    <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">
                                        {suggestions.map((s, i) => (
                                            <button key={i} type="button"
                                                onMouseDown={() => pickSuggestion(s)}
                                                className="w-full flex items-start gap-2.5 px-4 py-2.5 hover:bg-amber-50 dark:hover:bg-amber-500/10 text-left transition-colors border-b border-slate-100 dark:border-slate-700 last:border-0">
                                                <MapPin size={14} className="text-amber-500 shrink-0 mt-0.5" />
                                                <span className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2">{s.display_name}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <button type="button" onClick={useMyLocation} disabled={locating}
                                className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors disabled:opacity-60">
                                {locating ? <Loader2 size={15} className="animate-spin" /> : <LocateFixed size={15} />}
                                <span className="hidden sm:inline">My Location</span>
                            </button>
                        </div>


                        {/* Scrollable body: map + telemetry */}
                        <div className="flex-1 overflow-y-auto min-h-0">
                            {mapError && (
                                <div className="mx-6 mt-3 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-2xl flex items-start gap-3">
                                    <Compass size={18} className="text-amber-500 shrink-0 mt-0.5 animate-pulse" />
                                    <div className="flex-1 space-y-1">
                                        <p className="text-xs font-bold text-amber-800 dark:text-amber-400">Permissions & Secure Context Information</p>
                                        <p className="text-xs leading-relaxed text-amber-700 dark:text-amber-500">{mapError}</p>
                                    </div>
                                    <button type="button" onClick={() => setMapError(null)} className="text-xs font-bold text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-250 shrink-0">Dismiss</button>
                                </div>
                            )}

                            {/* Map */}
                            <div className="px-6 pt-2 pb-3">
                                <div className="w-full h-[240px] sm:h-[280px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100">
                                    <div ref={mapDivRef} className="w-full h-full" />
                                </div>
                            </div>

                            {/* Telemetry HUD */}
                            <div className="px-6 pb-4">
                                <div className="bg-slate-900 rounded-2xl p-3 text-white border border-slate-800">
                                    <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-slate-800">
                                        <div className="flex items-center gap-2">
                                            <span className="relative flex h-2 w-2">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                                            </span>
                                            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">GPS Lock — WGS‑84</span>
                                        </div>
                                        <span className="text-[10px] font-mono text-slate-500">Google Maps</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 mb-2">
                                        <div className="bg-slate-950/50 rounded-xl p-2.5 border border-slate-800 flex items-center gap-2">
                                            <Compass size={15} className="text-amber-400 shrink-0" />
                                            <div>
                                                <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Latitude</p>
                                                <p className="text-xs font-mono font-extrabold text-white">{coords.lat.toFixed(6)}°</p>
                                            </div>
                                        </div>
                                        <div className="bg-slate-950/50 rounded-xl p-2.5 border border-slate-800 flex items-center gap-2">
                                            <Globe size={15} className="text-amber-400 shrink-0" />
                                            <div>
                                                <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Longitude</p>
                                                <p className="text-xs font-mono font-extrabold text-white">{coords.lng.toFixed(6)}°</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-slate-950/40 rounded-xl p-2.5 border border-slate-800 flex items-start gap-2">
                                        <MapPin size={13} className="text-amber-400 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold mb-0.5">Geocoded Address</p>
                                            <p className="text-xs text-slate-200 leading-relaxed">
                                                {tempAddress || 'Click on the map or drag the pin to set location…'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer — always visible at bottom */}
                        <div className="flex justify-end gap-2 px-6 py-4 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 shrink-0">
                            <button type="button" onClick={() => setShowMap(false)}
                                className="px-5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                Cancel
                            </button>
                            <button type="button" onClick={confirmLocation}
                                className="px-6 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-amber-200 dark:shadow-amber-900/30 transition-all">
                                ✓ Confirm Location
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
