import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, X, Loader2, MapPin, Navigation, Compass, Globe, LocateFixed } from 'lucide-react';
import axios from 'axios';
import ClientFormDrawer from '@/Components/Clients/ClientFormDrawer';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@mui/material';

const inputCls = `w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200
    dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/50
    text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500`;

const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

// Search using free OSM Nominatim — no API key needed, no legacy API issues
async function nominatimSearch(query) {
    const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(query)}`
    );
    return res.json();
}

export default function WizardStep1({ data, update }) {
    const [clientSearch, setClientSearch] = useState(data.client ? data.client.name : '');
    const [clientResults, setClientResults] = useState([]);
    const [searching, setSearching]         = useState(false);
    const [showResults, setShowResults]     = useState(false);
    const [showNewClientDrawer, setShowNewClientDrawer] = useState(false);
    const debounceRef = useRef(null);

    // Map state
    const [showMap, setShowMap]           = useState(false);
    const [tempAddress, setTempAddress]   = useState(data.map_location || data.location || '');
    const [coords, setCoords]             = useState(
        data.latitude && data.longitude 
            ? { lat: parseFloat(data.latitude), lng: parseFloat(data.longitude) } 
            : (data.map_coords || { lat: 26.1445, lng: 91.7362 })
    );
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

    // Duration calculation state
    const [durationValue, setDurationValue] = useState('');
    const [durationUnit, setDurationUnit]   = useState('months');

    // Same location checkbox state
    const [isSameLocation, setIsSameLocation] = useState(false);

    // Team member referral state
    const [teamMembers, setTeamMembers] = useState([]);
    const [teamSearchQuery, setTeamSearchQuery] = useState(data.client_source_member_name || '');
    const [showTeamSuggestions, setShowTeamSuggestions] = useState(false);

    useEffect(() => {
        axios.get('/projects/team-members')
            .then(res => {
                if (Array.isArray(res.data)) {
                    setTeamMembers(res.data);
                }
            })
            .catch(err => {
                console.error("Error loading team members:", err);
            });
    }, []);

    const filteredTeamMembers = teamSearchQuery.trim() === ''
        ? teamMembers
        : teamMembers.filter(m => m.name.toLowerCase().includes(teamSearchQuery.toLowerCase()));

    // Auto-detect same location on mount/client load
    useEffect(() => {
        if (!data.client) {
            setIsSameLocation(false);
            return;
        }

        const client = data.client;
        const fullClientAddress = [
            client.address,
            client.city,
            client.state,
            client.pincode
        ].filter(Boolean).join(', ');

        if (data.location && data.location === fullClientAddress) {
            setIsSameLocation(true);
        } else {
            setIsSameLocation(false);
        }
    }, [data.client]);

    // Initialize duration helpers from existing values on mount
    useEffect(() => {
        if (data.start_date && data.deadline) {
            const start = new Date(data.start_date);
            const end = new Date(data.deadline);
            if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                const totalMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
                if (totalMonths > 0) {
                    if (totalMonths % 12 === 0) {
                        setDurationValue((totalMonths / 12).toString());
                        setDurationUnit('years');
                    } else {
                        setDurationValue(totalMonths.toString());
                        setDurationUnit('months');
                    }
                }
            }
        }
    }, []);

    // ── Duration & Deadline calculations ─────────────────────────────────────────
    const updateDeadline = (start, val, unit) => {
        if (!start || !val) return;
        const value = parseInt(val, 10);
        if (isNaN(value) || value <= 0) return;

        const date = new Date(start);
        if (isNaN(date.getTime())) return;

        if (unit === 'years') {
            date.setFullYear(date.getFullYear() + value);
        } else {
            date.setMonth(date.getMonth() + value);
        }

        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        update({ deadline: `${yyyy}-${mm}-${dd}` });
    };

    const handleStartDateChange = (val) => {
        update({ start_date: val });
        if (durationValue) {
            updateDeadline(val, durationValue, durationUnit);
        }
    };

    const handleDurationValueChange = (val) => {
        setDurationValue(val);
        if (data.start_date) {
            updateDeadline(data.start_date, val, durationUnit);
        }
    };

    const handleDurationUnitChange = (val) => {
        setDurationUnit(val);
        if (data.start_date && durationValue) {
            updateDeadline(data.start_date, durationValue, val);
        }
    };

    const handleDeadlineChange = (val) => {
        update({ deadline: val });
        if (data.start_date && val) {
            const start = new Date(data.start_date);
            const end = new Date(val);
            if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                const totalMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
                if (totalMonths > 0) {
                    if (totalMonths % 12 === 0) {
                        setDurationValue((totalMonths / 12).toString());
                        setDurationUnit('years');
                    } else {
                        setDurationValue(totalMonths.toString());
                        setDurationUnit('months');
                    }
                }
            }
        }
    };

    // ── Location Syncing ─────────────────────────────────────────────────────────
    const handleLocationChange = (val) => {
        update({ location: val });
        setIsSameLocation(false);
    };

    const handleSameLocationChange = (e) => {
        const checked = e.target.checked;
        setIsSameLocation(checked);
        if (checked && data.client) {
            const client = data.client;
            const fullClientAddress = [
                client.address,
                client.city,
                client.state,
                client.pincode
            ].filter(Boolean).join(', ');

            const clientLat = client.latitude ? parseFloat(client.latitude) : null;
            const clientLng = client.longitude ? parseFloat(client.longitude) : null;
            const clientMapLoc = client.map_location && !client.map_location.startsWith('http') 
                ? client.map_location 
                : fullClientAddress;

            update({
                location: fullClientAddress,
                map_location: clientMapLoc,
                latitude: clientLat,
                longitude: clientLng,
                map_coords: clientLat && clientLng ? { lat: clientLat, lng: clientLng } : null
            });

            if (clientLat && clientLng) {
                setCoords({ lat: clientLat, lng: clientLng });
                if (mapRef.current && markerRef.current) {
                    mapRef.current.panTo({ lat: clientLat, lng: clientLng });
                    markerRef.current.setPosition({ lat: clientLat, lng: clientLng });
                }
            }
            if (clientMapLoc || fullClientAddress) {
                setTempAddress(clientMapLoc || fullClientAddress);
            }
        }
    };

    // ── Client search ──────────────────────────────────────────────────────────
    useEffect(() => {
        if (clientSearch.length < 2) { setClientResults([]); return; }
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(async () => {
            setSearching(true);
            try {
                const res = await axios.get('/clients/search', { params: { q: clientSearch } });
                setClientResults(res.data); setShowResults(true);
            } finally { setSearching(false); }
        }, 300);
    }, [clientSearch]);

    const selectClient = (client) => { update({ client_id: client.id, client }); setClientSearch(client.name); setShowResults(false); };
    const clearClient  = ()       => { update({ client_id: null, client: null }); setClientSearch(''); };

    // ── Load Google Maps JS API (NO legacy libraries=places) ─────────────────
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

    // ── Nominatim-powered address suggestions (free, no API key) ─────────────
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
            title: 'Drag to set site location',
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
            } else {
                setTempAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
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
                    setMapError('Location access was denied. Modern browsers require a secure connection (HTTPS or localhost) to use location features. If you are accessing this server remotely via HTTP, please manually search or drag the pin to set the site location.');
                } else {
                    setMapError('Failed to fetch your location: ' + err.message);
                }
            },
            { enableHighAccuracy: true, timeout: 8000 }
        );
    };

    const confirmLocation = () => {
        update({ 
            map_location: tempAddress, 
            latitude: coords.lat, 
            longitude: coords.lng,
            map_coords: coords 
        });
        setIsSameLocation(false);
        setShowMap(false);
    };

    return (
        <div className="p-6 space-y-8">

            {/* Project Type */}
            <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Project Type *</label>
                <div className="grid grid-cols-2 gap-3">
                    {[
                        { value: 'client',   label: 'Client Project',  desc: 'Linked to a client' },
                        { value: 'internal', label: 'Internal Project', desc: 'No client required' },
                    ].map(opt => (
                        <button key={opt.value} type="button"
                            onClick={() => update({ type: opt.value, client_id: null, client: null })}
                            className={cn('p-4 rounded-2xl border-2 text-left transition-all',
                                data.type === opt.value
                                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-500/5'
                                    : 'border-slate-200 dark:border-slate-700 hover:border-amber-300')}>
                            <p className={cn('font-semibold text-sm', data.type === opt.value ? 'text-amber-700 dark:text-amber-400' : 'text-slate-800 dark:text-slate-200')}>{opt.label}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{opt.desc}</p>
                        </button>
                    ))}
                </div>
            </div>

            {/* Client */}
            {data.type === 'client' && (
                <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Client *</label>
                    {data.client ? (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 p-4 rounded-2xl border-2 border-green-400 bg-green-50 dark:bg-green-500/5">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm overflow-hidden shrink-0 relative">
                                    <span className="absolute inset-0 flex items-center justify-center">
                                        {data.client.name?.charAt(0).toUpperCase()}
                                    </span>
                                    {data.client.photo_path && (
                                        <img
                                            src={data.client.photo_path}
                                            alt={data.client.name}
                                            className="absolute inset-0 w-full h-full object-cover"
                                            onError={e => { e.target.style.display = 'none'; }}
                                        />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-slate-900 dark:text-slate-100">{data.client.name}</p>
                                    <p className="text-xs text-slate-500">{data.client.client_id} · {data.client.mobile}</p>
                                </div>
                                <button onClick={clearClient} className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"><X size={14} /></button>
                            </div>

                            {/* Dropdown for client source */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Who brought the client? *</label>
                                    <select
                                        value={data.client_source || 'Office'}
                                        onChange={e => {
                                            const val = e.target.value;
                                            update({ 
                                                client_source: val,
                                                client_source_member_name: '',
                                                client_source_member_id: null
                                            });
                                            setTeamSearchQuery('');
                                        }}
                                        className={inputCls}
                                    >
                                        <option value="Office">Office</option>
                                        <option value="Boss">Boss</option>
                                        <option value="Team Member">Team Member</option>
                                    </select>
                                </div>

                                {data.client_source === 'Team Member' && (
                                    <div className="relative">
                                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Team Member Name *</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                placeholder="Type team member's name..."
                                                value={data.client_source_member_name || ''}
                                                onChange={e => {
                                                    const query = e.target.value;
                                                    update({ 
                                                        client_source_member_name: query,
                                                        client_source_member_id: null
                                                    });
                                                    setTeamSearchQuery(query);
                                                    setShowTeamSuggestions(true);
                                                }}
                                                onFocus={() => {
                                                    setTeamSearchQuery(data.client_source_member_name || '');
                                                    setShowTeamSuggestions(true);
                                                }}
                                                onBlur={() => setTimeout(() => setShowTeamSuggestions(false), 200)}
                                                className={inputCls}
                                            />
                                            {showTeamSuggestions && filteredTeamMembers.length > 0 && (
                                                <div className="absolute z-20 w-full mt-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl max-h-48 overflow-y-auto">
                                                    {filteredTeamMembers.map(m => (
                                                        <button
                                                            key={m.id}
                                                            type="button"
                                                            onMouseDown={(e) => {
                                                                e.preventDefault();
                                                                update({
                                                                    client_source_member_name: m.name,
                                                                    client_source_member_id: m.id
                                                                });
                                                                setTeamSearchQuery(m.name);
                                                                setShowTeamSuggestions(false);
                                                            }}
                                                            className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-amber-50 dark:hover:bg-amber-500/5 text-left text-xs transition-colors"
                                                        >
                                                            {m.photo_path ? (
                                                                <img src={m.photo_path} alt={m.name} className="w-5 h-5 rounded-full object-cover" />
                                                            ) : (
                                                                <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-[9px] text-slate-500">
                                                                    {m.avatar}
                                                                </div>
                                                            )}
                                                            <div>
                                                                <p className="font-semibold text-slate-850 dark:text-slate-100">{m.name}</p>
                                                                <p className="text-[10px] text-slate-400">{m.designation}</p>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <div className="relative">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input type="text" value={clientSearch}
                                    onChange={e => setClientSearch(e.target.value)}
                                    onFocus={() => clientResults.length && setShowResults(true)}
                                    onBlur={() => setTimeout(() => setShowResults(false), 200)}
                                    placeholder="Search client by name, mobile..."
                                    className={cn(inputCls, 'pl-9 pr-10')} />
                                {searching && <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 animate-spin" />}
                                {showResults && clientResults.length > 0 && (
                                    <div className="absolute z-20 w-full mt-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">
                                        {clientResults.map(c => (
                                            <button key={c.id} type="button" onMouseDown={(e) => { e.preventDefault(); selectClient(c); }}
                                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-amber-50 dark:hover:bg-amber-500/5 text-left transition-colors">
                                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden relative">
                                                    <span className="absolute inset-0 flex items-center justify-center">
                                                        {c.name?.charAt(0).toUpperCase()}
                                                    </span>
                                                    {c.photo_path && (
                                                        <img
                                                            src={c.photo_path}
                                                            alt={c.name}
                                                            className="absolute inset-0 w-full h-full object-cover"
                                                            onError={e => { e.target.style.display = 'none'; }}
                                                        />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{c.name}</p>
                                                    <p className="text-xs text-slate-400">{c.client_id} · {c.mobile}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-2"><div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" /><span className="text-xs text-slate-400">or</span><div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" /></div>
                            <button type="button" onClick={() => setShowNewClientDrawer(true)}
                                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-amber-300 dark:border-amber-500/30 text-amber-600 dark:text-amber-400 text-sm font-medium hover:bg-amber-50 dark:hover:bg-amber-500/5 transition-colors">
                                <Plus size={16} /> Create New Client
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Project Details */}
            <div className="space-y-4">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Project Details</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Agreement Date</label>
                        <input type="date" value={data.agreement_date} onChange={e => update({ agreement_date: e.target.value })} className={inputCls} />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Start Date</label>
                        <input type="date" value={data.start_date} onChange={e => handleStartDateChange(e.target.value)} className={inputCls} />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Deadline</label>
                        <input type="date" value={data.deadline} min={data.start_date} onChange={e => handleDeadlineChange(e.target.value)} className={inputCls} />
                    </div>
                </div>

                <Card 
                    className="border border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/10 rounded-2xl shadow-none"
                    sx={{
                        borderRadius: '16px',
                        border: '1px solid',
                        borderColor: 'divider',
                        background: 'transparent',
                        boxShadow: 'none',
                        color: 'inherit'
                    }}
                >
                    <CardContent className="p-4 space-y-3" sx={{ '&:last-child': { pb: 2 } }}>
                        <div className="flex items-center justify-between">
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                                Project Duration Helper
                            </label>
                            <span className="text-[10px] text-slate-400">
                                Auto-calculates deadline from start date
                            </span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                                    Duration Value
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    placeholder="e.g. 1, 18"
                                    value={durationValue}
                                    onChange={e => handleDurationValueChange(e.target.value)}
                                    className={inputCls}
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                                    Duration Unit
                                </label>
                                <select
                                    value={durationUnit}
                                    onChange={e => handleDurationUnitChange(e.target.value)}
                                    className={inputCls}
                                >
                                    <option value="months">Month(s)</option>
                                    <option value="years">Year(s)</option>
                                </select>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Status & Location */}
            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Status & Site Location</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Initial Status</label>
                        <select value={data.status || 'draft'} onChange={e => update({ status: e.target.value })} className={inputCls}>
                            <option value="draft">Draft</option>
                            <option value="running">Runing Project</option>
                            <option value="handover">Handover</option>
                            <option value="on-hold">ON Hold</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Site Address</label>
                        <input type="text" value={data.location || ''} onChange={e => handleLocationChange(e.target.value)}
                            placeholder="e.g. Beltola, Guwahati" className={inputCls} />
                    </div>
                </div>

                {data.type === 'client' && data.client && (
                    <div className="flex items-center gap-2 px-1">
                        <input
                            type="checkbox"
                            id="same_location_chk"
                            checked={isSameLocation}
                            onChange={handleSameLocationChange}
                            className="rounded border-slate-300 dark:border-slate-700 text-amber-500 focus:ring-amber-500/50 bg-slate-50 dark:bg-slate-800 h-4 w-4 cursor-pointer"
                        />
                        <label htmlFor="same_location_chk" className="text-xs font-medium text-slate-600 dark:text-slate-400 cursor-pointer select-none">
                            Same project location as client's address ({[data.client.city, data.client.state].filter(Boolean).join(', ') || 'Client Address'})
                        </label>
                    </div>
                )}

                {/* Map Launcher Card */}
                <button type="button" onClick={() => setShowMap(true)}
                    className="w-full flex items-center gap-4 p-4 border-2 border-dashed border-amber-300 dark:border-amber-500/25 rounded-2xl bg-amber-50/30 dark:bg-amber-500/5 hover:bg-amber-50 hover:border-amber-400 transition-all group">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-amber-200 dark:shadow-amber-900/30 group-hover:scale-105 transition-transform shrink-0">
                        <MapPin size={22} />
                    </div>
                    <div className="text-left flex-1 min-w-0">
                        <p className="font-semibold text-sm text-slate-800 dark:text-slate-100">
                            {data.map_location ? '📍 Google Maps location set — click to change' : '🗺️ Pick site location on Google Maps'}
                        </p>
                        <p className="text-xs text-slate-400 truncate mt-0.5">
                            {data.map_location || 'Search address · drag pin · click on map'}
                        </p>
                    </div>
                    {data.latitude && data.longitude && (
                        <span className="text-[10px] font-mono bg-green-100 text-green-700 px-2 py-1 rounded-lg shrink-0">
                            {parseFloat(data.latitude).toFixed(4)}, {parseFloat(data.longitude).toFixed(4)}
                        </span>
                    )}
                </button>
            </div>

            {/* ── GOOGLE MAPS POPUP ────────────────────────────────────────── */}
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
                                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Google Maps Site Locator</h3>
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


            {/* Client Drawer */}
            <ClientFormDrawer
                open={showNewClientDrawer}
                onClose={() => setShowNewClientDrawer(false)}
                useAxios={true}
                onSaved={(c) => { setShowNewClientDrawer(false); selectClient(c); }}
            />
        </div>
    );
}
