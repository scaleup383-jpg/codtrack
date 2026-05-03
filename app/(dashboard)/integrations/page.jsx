"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import ProtectedPage from "@/components/ProtectedPage";
import { usePermissions } from "@/lib/hooks/usePermissions";
import {
    Zap, Plus, Power, PowerOff, Trash2, X, ChevronRight, Check,
    Link, Store, Sheet, RefreshCw, Shield, Key, Globe, FileText,
    AlertTriangle, CheckCircle, Info, ExternalLink, ArrowRight,
    Settings, Database, Cloud, Lock, Eye, EyeOff, Loader2,
    Clipboard, ClipboardCheck, Server, Wifi, WifiOff, Activity,
    BarChart3, Filter, SlidersHorizontal, LayoutGrid, Table2,
    MoreVertical, Edit, Copy, Calendar, Clock, User, Mail, Phone,
    MapPin, Package, Tag, DollarSign, TrendingUp, ChevronDown,
    ChevronUp, Search, Download, Upload, ShoppingCart, Timer,
    Play, Pause, RotateCcw, AlertCircle, Radio, ZapOff
} from "lucide-react";

/* ================================================================
   CONSTANTS
================================================================ */
const AVAILABLE_INTEGRATIONS = [
    {
        slug: "youcan",
        name: "YouCan Store",
        description: "Connect your YouCan e-commerce store to sync orders automatically",
        icon: Store,
        color: "#22c55e",
        bgColor: "#f0fdf4",
        active: true,
        features: ["Automatic order sync", "Real-time inventory updates", "Customer data import"],
        type: "credentials",
    },
    {
        slug: "shopify",
        name: "Shopify",
        description: "Connect your Shopify store to import products, orders, and customer data",
        icon: ShoppingCart,
        color: "#10b981",
        bgColor: "#ecfdf5",
        active: true,
        features: ["Product synchronization", "Order management", "Customer import", "Inventory tracking"],
        type: "oauth",
    },
    {
        slug: "google_sheets",
        name: "Google Sheets",
        description: "Import leads directly from Google Sheets with automatic syncing",
        icon: Sheet,
        color: "#059669",
        bgColor: "#d1fae5",
        active: true,
        features: ["Bulk import from sheets", "Auto-sync every 30-60s", "Column mapping", "Real-time updates"],
        type: "config",
    },
];

/* ================================================================
   TOAST SYSTEM
================================================================ */
function useToast() {
    const [toasts, setToasts] = useState([]);
    const add = useCallback((msg, type = "success") => {
        const id = Date.now() + Math.random();
        setToasts(p => [...p, { id, msg, type }]);
        setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
    }, []);
    return { toasts, add };
}

function ToastContainer({ toasts }) {
    return (
        <div className="fixed bottom-6 right-6 z-[999] flex flex-col gap-2 pointer-events-none">
            {toasts.map(t => (
                <div
                    key={t.id}
                    className={`pointer-events-auto flex items-center gap-3 px-5 py-3.5 rounded-2xl text-sm font-medium shadow-2xl border animate-slide-up backdrop-blur-sm ${t.type === "success"
                        ? "bg-white/95 border-emerald-200 text-emerald-700"
                        : t.type === "error"
                            ? "bg-white/95 border-rose-200 text-rose-700"
                            : "bg-white/95 border-gray-200 text-gray-700"
                        }`}
                >
                    <div className={`p-1.5 rounded-lg ${t.type === "success" ? "bg-emerald-100" : "bg-rose-100"
                        }`}>
                        {t.type === "success" ? (
                            <CheckCircle size={14} className="text-emerald-600" />
                        ) : (
                            <AlertTriangle size={14} className="text-rose-600" />
                        )}
                    </div>
                    <span className="flex-1">{t.msg}</span>
                    <button
                        onClick={() => setToasts(p => p.filter(to => to.id !== t.id))}
                        className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <X size={14} className="text-gray-400" />
                    </button>
                </div>
            ))}
        </div>
    );
}

/* ================================================================
   INTEGRATION SELECTION MODAL
================================================================ */
function IntegrationSelectModal({ open, onClose, onSelect }) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col animate-scale-in">
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">New Integration</h2>
                        <p className="text-sm text-gray-500 mt-1">Choose a platform to connect</p>
                    </div>
                    <button onClick={onClose} className="p-2.5 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all"><X size={20} /></button>
                </div>
                <div className="overflow-y-auto flex-1 p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {AVAILABLE_INTEGRATIONS.map((integration) => {
                            const Icon = integration.icon;
                            return (
                                <button key={integration.slug} onClick={() => { onClose(); onSelect(integration); }} disabled={!integration.active}
                                    className={`relative text-left p-5 rounded-2xl border-2 transition-all duration-300 group hover:shadow-lg ${integration.active ? "border-gray-100 hover:border-emerald-300 hover:bg-emerald-50/30 cursor-pointer" : "border-gray-100 bg-gray-50 cursor-not-allowed opacity-60"}`}>
                                    <div className="p-3 rounded-2xl mb-4 w-fit transition-transform group-hover:scale-110" style={{ backgroundColor: integration.bgColor }}><Icon size={24} style={{ color: integration.color }} /></div>
                                    <h3 className="text-base font-bold text-gray-900 mb-1.5">{integration.name}</h3>
                                    <p className="text-xs text-gray-500 mb-4 line-clamp-2">{integration.description}</p>
                                    <div className="space-y-1.5">
                                        {integration.features.slice(0, 2).map((feature, idx) => (
                                            <div key={idx} className="flex items-center gap-2 text-[11px] text-gray-600"><div className="w-1 h-1 rounded-full bg-emerald-400 flex-shrink-0" />{feature}</div>
                                        ))}
                                    </div>
                                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"><div className="p-1.5 rounded-full bg-emerald-100"><ArrowRight size={14} className="text-emerald-600" /></div></div>
                                </button>
                            );
                        })}
                    </div>
                </div>
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-3xl"><p className="text-xs text-gray-500 text-center">Select a platform to start the connection process</p></div>
            </div>
        </div>
    );
}

/* ================================================================
   85% HEIGHT SLIDE-UP PANEL
================================================================ */
function SlideUpPanel({ open, onClose, title, children, subtitle }) {
    const panelRef = useRef(null);
    useEffect(() => {
        if (open) { document.body.style.overflow = "hidden"; } else { document.body.style.overflow = ""; }
        return () => { document.body.style.overflow = ""; };
    }, [open]);
    useEffect(() => {
        const handleEsc = (e) => { if (e.key === "Escape" && open) onClose(); };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [open, onClose]);
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-[250] flex items-end justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div ref={panelRef} className="relative w-full bg-white rounded-t-3xl shadow-2xl flex flex-col animate-slide-up-panel" style={{ height: "85vh", maxHeight: "85vh" }}>
                <div className="flex justify-center pt-3 pb-1 flex-shrink-0"><div className="w-12 h-1.5 rounded-full bg-gray-300" /></div>
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
                    <div><h2 className="text-xl font-bold text-gray-900">{title}</h2>{subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}</div>
                    <button onClick={onClose} className="p-2.5 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all"><X size={20} /></button>
                </div>
                <div className="overflow-y-auto flex-1 px-6 py-6">{children}</div>
                <div className="flex-shrink-0 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
                    <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-500">Press Esc or click outside to close</p>
                        <button onClick={onClose} className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 font-medium transition-all">Cancel</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ================================================================
   AUTO-IMPORT SETTINGS MODAL
================================================================ */
function AutoImportSettings({ open, onClose, connection, onSave }) {
    const [interval, setIntervalState] = useState(30);
    const [enabled, setEnabled] = useState(false);
    const [saving, setSaving] = useState(false);
    useEffect(() => {
        if (connection) {
            setIntervalState(connection.config?.auto_import_interval || 30);
            setEnabled(connection.config?.auto_import_enabled || false);
        }
    }, [connection]);
    const handleSave = async () => { setSaving(true); try { await onSave(connection.id, { auto_import_enabled: enabled, auto_import_interval: interval }); onClose(); } catch (err) { console.error("Failed to save:", err); } finally { setSaving(false); } };
    if (!open) return null;
    const intervals = [
        { value: 30, label: "30 seconds" }, { value: 60, label: "1 minute" }, { value: 120, label: "2 minutes" },
        { value: 300, label: "5 minutes" }, { value: 600, label: "10 minutes" }, { value: 1800, label: "30 minutes" }, { value: 3600, label: "1 hour" },
    ];
    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-100 animate-scale-in">
                <div className="flex items-center gap-3 mb-6"><div className="p-2.5 bg-emerald-100 rounded-xl"><Timer size={20} className="text-emerald-600" /></div><div><h3 className="text-lg font-bold text-gray-900">Auto-Import Settings</h3><p className="text-xs text-gray-500">Configure automatic data synchronization</p></div></div>
                <div className="space-y-5">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div><p className="text-sm font-semibold text-gray-900">Auto Import</p><p className="text-xs text-gray-500">Automatically sync data from Google Sheets</p></div>
                        <button onClick={() => setEnabled(!enabled)} className={`relative w-12 h-7 rounded-full transition-all duration-300 ${enabled ? "bg-emerald-500" : "bg-gray-300"}`}><div className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300" style={{ left: enabled ? "22px" : "2px" }} /></button>
                    </div>
                    {enabled && <div><label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wider">Sync Interval</label><div className="grid grid-cols-2 gap-2">{intervals.map((opt) => (<button key={opt.value} onClick={() => setIntervalState(opt.value)} className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${interval === opt.value ? "bg-emerald-50 text-emerald-700 border-2 border-emerald-300" : "bg-white border border-gray-200 text-gray-600 hover:border-emerald-200"}`}>{opt.label}</button>))}</div></div>}
                </div>
                <div className="flex gap-3 mt-6">
                    <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 font-medium">Cancel</button>
                    <button onClick={handleSave} disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-green-200">{saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}Save Settings</button>
                </div>
            </div>
        </div>
    );
}

/* ================================================================
   CONFIRMATION DIALOG
================================================================ */
function ConfirmDialog({ open, title, desc, onConfirm, onCancel }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
            <div className="relative bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-gray-100 animate-scale-in">
                <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center mb-4"><AlertTriangle size={22} className="text-rose-500" /></div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 mb-6">{desc}</p>
                <div className="flex gap-3">
                    <button onClick={onCancel} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 font-medium">Cancel</button>
                    <button onClick={onConfirm} className="flex-1 px-4 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold shadow-lg shadow-rose-200">Delete</button>
                </div>
            </div>
        </div>
    );
}

/* ================================================================
   MAIN COMPONENT
================================================================ */
function IntegrationsContent() {
    const { toasts, add: toast } = useToast();
    const { canAccess, profile, loading: permissionsLoading } = usePermissions();
    const [mounted, setMounted] = useState(false);
    const [connections, setConnections] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [viewMode, setViewMode] = useState("grid");
    const [showSelectModal, setShowSelectModal] = useState(false);
    const [showPanel, setShowPanel] = useState(false);
    const [selectedIntegration, setSelectedIntegration] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [autoImportSettings, setAutoImportSettings] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [shopifyShop, setShopifyShop] = useState("");
    const [sheetForm, setSheetForm] = useState({ source_name: "", sheet_id: "", sheet_name: "Sheet1", start_line: 2 });
    const [youcanForm, setYoucanForm] = useState({ client_id: "", client_secret: "", store_url: "" });
    const [showYoucanSecret, setShowYoucanSecret] = useState(false);
    const [autoImportTimers, setAutoImportTimers] = useState({});

    useEffect(() => { setMounted(true); }, []);

    const fetchConnections = useCallback(async (silent = false) => {
        try {
            if (!silent) setLoading(true); else setRefreshing(true);
            const { data, error } = await supabase.from("integration_connections").select("*, integrations(name, slug)").order("created_at", { ascending: false });
            if (error) throw error;
            setConnections(data || []);
        } catch (err) { toast("Failed to load integrations", "error"); }
        finally { setLoading(false); setRefreshing(false); }
    }, [toast]);

    useEffect(() => { fetchConnections(); }, [fetchConnections]);

    useEffect(() => {
        Object.values(autoImportTimers).forEach(timer => clearInterval(timer));
        const newTimers = {};
        connections.forEach(conn => {
            if (conn.integrations?.slug === "google_sheets" && conn.config?.auto_import_enabled && conn.status === "active" && conn.config?.auto_import_interval) {
                newTimers[conn.id] = setInterval(async () => {
                    try {
                        const response = await fetch("/api/integrations/google/import", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ connection: conn }) });
                        const result = await response.json();
                        if (response.ok && result.success) toast(`Auto-imported ${result.imported || 0} leads`, "success");
                    } catch (err) { console.error("Auto-import error:", err); }
                }, conn.config.auto_import_interval * 1000);
            }
        });
        setAutoImportTimers(newTimers);
        return () => { Object.values(newTimers).forEach(timer => clearInterval(timer)); };
    }, [connections, toast]);

    const toggleConnection = async (id, status) => {
        const newStatus = status === "active" ? "inactive" : "active";
        await supabase.from("integration_connections").update({ status: newStatus }).eq("id", id);
        toast(`Integration ${newStatus === "active" ? "activated" : "deactivated"}`);
        fetchConnections(true);
    };

    const deleteConnection = async (id) => {
        await supabase.from("integration_connections").delete().eq("id", id);
        toast("Integration deleted");
        setDeleteConfirm(null);
        fetchConnections(true);
    };

    const handleSelectIntegration = (integration) => {
        setSelectedIntegration(integration);
        setSheetForm({ source_name: "", sheet_id: "", sheet_name: "Sheet1", start_line: 2 });
        setYoucanForm({ client_id: "", client_secret: "", store_url: "" });
        setShopifyShop("");
        setShowYoucanSecret(false);
        setError(null);
        setShowPanel(true);
    };

    const connectShopify = (shop) => {
        if (!shop) return toast("Please enter your Shopify store URL", "error");
        const cleanShop = shop.replace(/https?:\/\//, "").replace(/\.myshopify\.com.*/, "").replace(/\/.*/, "").trim();
        window.location.href = `/api/integrations/shopify/connect?shop=${cleanShop}.myshopify.com`;
    };

    const handleCreateIntegration = async () => {
        if (!selectedIntegration) return;
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const { data: profile } = await supabase.from("user_profiles").select("tenant_id").eq("id", user.id).single();
            const { data: integration } = await supabase.from("integrations").select("id").eq("slug", selectedIntegration.slug).single();
            let insertData = { tenant_id: profile?.tenant_id, integration_id: integration.id, status: "active", credentials: {}, config: {} };
            if (selectedIntegration.slug === "google_sheets") {
                if (!sheetForm.sheet_id) throw new Error("Sheet ID is required");
                insertData.config = { ...sheetForm, auto_import_enabled: false, auto_import_interval: 30 };
            } else if (selectedIntegration.slug === "youcan") {
                insertData.credentials = { client_id: youcanForm.client_id, client_secret: youcanForm.client_secret, store_url: youcanForm.store_url };
                insertData.config = { type: "manual_youcan", store_url: youcanForm.store_url };
            }
            await supabase.from("integration_connections").insert(insertData);
            toast(`${selectedIntegration.name} connected!`);
            setShowPanel(false); setSelectedIntegration(null); fetchConnections(true);
        } catch (err) { toast(err.message, "error"); setError(err.message); }
        finally { setLoading(false); }
    };

    const saveAutoImportSettings = async (connectionId, settings) => {
        const connection = connections.find(c => c.id === connectionId);
        const updatedConfig = { ...(connection?.config || {}), auto_import_enabled: settings.auto_import_enabled, auto_import_interval: settings.auto_import_interval };
        await supabase.from("integration_connections").update({ config: updatedConfig }).eq("id", connectionId);
        toast("Settings saved!"); fetchConnections(true);
    };

    const handleManualImport = async (connectionId, sourceName) => {
        const connection = connections.find(c => c.id === connectionId);
        const response = await fetch("/api/integrations/google/import", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ connection }) });
        const result = await response.json();
        if (response.ok && result.success) { toast(`Imported ${result.imported || 0} leads!`); fetchConnections(true); }
        else throw new Error(result.error || "Import failed");
    };

    const filteredConnections = connections.filter(c => {
        const matchSearch = !searchTerm || c.config?.source_name?.toLowerCase().includes(searchTerm.toLowerCase()) || c.integrations?.name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchStatus = statusFilter === "all" || c.status === statusFilter;
        return matchSearch && matchStatus;
    });

    const activeCount = connections.filter(c => c.status === "active").length;
    const autoImportCount = connections.filter(c => c.config?.auto_import_enabled).length;

    if (!mounted) return null;

    return (
        <div className="min-h-screen bg-[#fafbfc]">
            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
                {/* HEADER */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-3 bg-gradient-to-br from-emerald-400 to-green-600 rounded-2xl shadow-lg shadow-green-200"><Zap size={24} className="text-white" /></div>
                            <div><h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Integrations</h1><p className="text-sm text-gray-500 mt-1">Connect your tools and automate your workflow</p></div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {autoImportCount > 0 && <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /><span className="text-xs font-semibold text-emerald-700">{autoImportCount} auto-importing</span></div>}
                        <button onClick={() => fetchConnections(true)} disabled={refreshing} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 shadow-sm"><RefreshCw size={16} className={refreshing ? "animate-spin" : ""} /> Refresh</button>
                        <button onClick={() => setShowSelectModal(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white text-sm font-semibold transition-all shadow-lg shadow-green-200 hover:shadow-xl"><Plus size={16} />New Integration</button>
                    </div>
                </div>

                {/* STATS BAR */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[{ l: "Total", v: connections.length, c: "#059669", bg: "#ecfdf5", icon: Database },
                    { l: "Active", v: activeCount, c: "#22c55e", bg: "#f0fdf4", icon: Activity },
                    { l: "Auto-Import", v: autoImportCount, c: "#3b82f6", bg: "#eff6ff", icon: Timer },
                    { l: "Available", v: AVAILABLE_INTEGRATIONS.length, c: "#8b5cf6", bg: "#f5f3ff", icon: Cloud },
                    ].map((s, i) => (
                        <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-3"><div className="p-2 rounded-xl" style={{ backgroundColor: s.bg }}><s.icon size={18} style={{ color: s.c }} /></div><div><p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{s.l}</p><p className="text-2xl font-bold text-gray-900">{s.v}</p></div></div>
                        </div>
                    ))}
                </div>

                {/* AVAILABLE INTEGRATIONS */}
                <div>
                    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><Shield size={18} className="text-emerald-600" />Available Integrations</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {AVAILABLE_INTEGRATIONS.map((integration) => {
                            const connection = connections.find(c => c.integrations?.slug === integration.slug);
                            const isConnected = !!connection;
                            const Icon = integration.icon;
                            return (
                                <div key={integration.slug} className={`relative bg-white rounded-2xl border-2 transition-all duration-300 overflow-hidden group hover:shadow-lg ${isConnected ? "border-emerald-200 shadow-md shadow-emerald-50" : "border-gray-100 hover:border-emerald-200"}`}>
                                    <div className={`h-1.5 ${isConnected && connection?.status === "active" ? "bg-gradient-to-r from-emerald-400 to-green-500" : isConnected ? "bg-gradient-to-r from-amber-400 to-orange-500" : "bg-gray-200"}`} />
                                    <div className="p-6">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-3 rounded-2xl transition-transform group-hover:scale-110" style={{ backgroundColor: integration.bgColor }}><Icon size={22} style={{ color: integration.color }} /></div>
                                                <div className="flex-1"><h3 className="text-base font-bold text-gray-900">{integration.name}</h3><p className="text-xs text-gray-500 mt-1 line-clamp-2">{integration.description}</p></div>
                                            </div>
                                        </div>
                                        <div className="mb-4"><div className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-semibold ${isConnected ? (connection?.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700") : "bg-gray-100 text-gray-600"}`}>{isConnected ? (connection?.status === "active" ? "Active" : "Inactive") : "Available"}</div></div>
                                        <div className="space-y-1.5 mb-4">{integration.features.slice(0, 3).map((f, i) => <div key={i} className="flex items-center gap-2 text-[11px] text-gray-600"><div className="w-1 h-1 rounded-full bg-emerald-400" />{f}</div>)}</div>
                                        {isConnected && connection && (
                                            <div className="bg-gray-50 rounded-xl p-3 mb-4 space-y-1.5 border border-gray-100">
                                                {connection.config?.source_name && <div className="flex items-center justify-between text-[11px]"><span className="text-gray-500">Source</span><span className="font-semibold text-gray-700">{connection.config.source_name}</span></div>}
                                                {connection.config?.auto_import_enabled && <div className="flex items-center justify-between text-[11px]"><span className="text-gray-500">Auto-Import</span><span className="font-semibold text-emerald-600 flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />Every {connection.config.auto_import_interval}s</span></div>}
                                            </div>
                                        )}
                                        <div className="space-y-2">
                                            {!isConnected ? (
                                                <button onClick={() => handleSelectIntegration(integration)} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white text-sm font-semibold shadow-lg shadow-green-200"><Plus size={16} />Connect</button>
                                            ) : (
                                                <>
                                                    <div className="flex items-center gap-2">
                                                        <button onClick={() => toggleConnection(connection.id, connection.status)} className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold ${connection.status === "active" ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}>{connection.status === "active" ? "Deactivate" : "Activate"}</button>
                                                        <button onClick={() => setDeleteConfirm({ id: connection.id, name: integration.name })} className="p-2 rounded-lg bg-rose-50 text-rose-500 border border-rose-200"><Trash2 size={13} /></button>
                                                    </div>
                                                    {integration.slug === "google_sheets" && connection.status === "active" && (
                                                        <div className="flex items-center gap-2">
                                                            <button onClick={() => setAutoImportSettings(connection)} className="flex-1 flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200"><Timer size={12} />Auto-Import</button>
                                                            <button onClick={() => handleManualImport(connection.id, connection.config?.source_name || "Google Sheets")} className="flex-1 flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200"><RefreshCw size={12} />Import Now</button>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* CONNECTIONS TABLE */}
                {connections.length > 0 && (
                    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
                            <div className="flex items-center gap-3"><Activity size={18} className="text-emerald-600" /><h3 className="font-bold text-gray-900">Connected Integrations</h3><span className="px-2.5 py-0.5 rounded-full bg-gray-100 text-xs font-semibold text-gray-600">{filteredConnections.length}</span></div>
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">{["all", "active", "inactive"].map(s => <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize ${statusFilter === s ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}>{s}</button>)}</div>
                                <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
                                    <button onClick={() => setViewMode("grid")} className={`p-2 rounded-lg ${viewMode === "grid" ? "bg-white text-emerald-600 shadow-sm" : "text-gray-400"}`}><LayoutGrid size={16} /></button>
                                    <button onClick={() => setViewMode("table")} className={`p-2 rounded-lg ${viewMode === "table" ? "bg-white text-emerald-600 shadow-sm" : "text-gray-400"}`}><Table2 size={16} /></button>
                                </div>
                                <div className="relative"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="text" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9 pr-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs w-40 focus:outline-none focus:border-emerald-400" /></div>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead><tr className="bg-gray-50/50"><th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase">Integration</th><th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase">Type</th><th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase">Status</th><th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase">Source</th><th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase">Auto-Import</th><th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase">Created</th><th className="px-6 py-3 text-center text-[11px] font-semibold text-gray-500 uppercase">Actions</th></tr></thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filteredConnections.map(conn => {
                                        const integration = AVAILABLE_INTEGRATIONS.find(i => i.slug === conn.integrations?.slug);
                                        const Icon = integration?.icon || Database;
                                        return (
                                            <tr key={conn.id} className="hover:bg-gray-50/50 group">
                                                <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg" style={{ backgroundColor: integration?.bgColor }}><Icon size={16} style={{ color: integration?.color }} /></div><div><p className="text-sm font-semibold text-gray-900">{conn.integrations?.name}</p><p className="text-xs text-gray-500">{conn.integrations?.slug}</p></div></div></td>
                                                <td className="px-6 py-4"><span className="text-xs text-gray-600 capitalize">{conn.config?.type || conn.integrations?.slug}</span></td>
                                                <td className="px-6 py-4"><div className="flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${conn.status === "active" ? "bg-emerald-500 animate-pulse" : "bg-gray-300"}`} /><span className={`text-xs font-semibold ${conn.status === "active" ? "text-emerald-600" : "text-gray-500"}`}>{conn.status}</span></div></td>
                                                <td className="px-6 py-4"><span className="text-xs text-gray-600">{conn.config?.source_name || conn.config?.store_url || "—"}</span></td>
                                                <td className="px-6 py-4">{conn.config?.auto_import_enabled ? <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-[10px] font-semibold"><div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />Every {conn.config.auto_import_interval}s</span> : <span className="text-xs text-gray-400">Manual</span>}</td>
                                                <td className="px-6 py-4"><span className="text-xs text-gray-500">{new Date(conn.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span></td>
                                                <td className="px-6 py-4"><div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => toggleConnection(conn.id, conn.status)} className={`p-1.5 rounded-lg ${conn.status === "active" ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"}`}>{conn.status === "active" ? <PowerOff size={12} /> : <Power size={12} />}</button>
                                                    {conn.integrations?.slug === "google_sheets" && conn.status === "active" && <button onClick={() => setAutoImportSettings(conn)} className="p-1.5 rounded-lg bg-blue-50 text-blue-600"><Timer size={12} /></button>}
                                                    <button onClick={() => setDeleteConfirm({ id: conn.id, name: conn.integrations?.name })} className="p-1.5 rounded-lg bg-rose-50 text-rose-500"><Trash2 size={12} /></button>
                                                </div></td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* MODALS */}
            <IntegrationSelectModal open={showSelectModal} onClose={() => setShowSelectModal(false)} onSelect={handleSelectIntegration} />
            <SlideUpPanel open={showPanel} onClose={() => { setShowPanel(false); setSelectedIntegration(null); setError(null); }} title={selectedIntegration ? `Connect ${selectedIntegration.name}` : "Connect Integration"} subtitle={selectedIntegration?.description}>
                {selectedIntegration && (
                    <div className="max-w-3xl mx-auto space-y-6">
                        <div className="flex items-center gap-4 p-5 bg-gradient-to-r from-gray-50 to-white rounded-2xl border border-gray-100">
                            <div className="p-3 rounded-2xl" style={{ backgroundColor: selectedIntegration.bgColor }}>{selectedIntegration.icon && <selectedIntegration.icon size={28} style={{ color: selectedIntegration.color }} />}</div>
                            <div><p className="font-bold text-gray-900 text-lg">{selectedIntegration.name}</p><p className="text-sm text-gray-500">{selectedIntegration.description}</p></div>
                        </div>
                        {error && <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center gap-3"><AlertTriangle size={18} className="text-rose-500" /><p className="text-sm text-rose-700">{error}</p></div>}

                        {selectedIntegration.slug === "shopify" && (
                            <div className="space-y-5">
                                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5"><Info size={18} className="text-blue-500" /><p className="text-sm text-blue-800 mt-2">You'll be redirected to Shopify to authorize.</p></div>
                                <div><label className="block text-xs font-semibold text-gray-700 mb-2 uppercase">Store URL</label><div className="flex items-center gap-2"><input type="text" placeholder="your-store" value={shopifyShop} onChange={e => setShopifyShop(e.target.value)} className="flex-1 px-4 py-3.5 rounded-xl bg-white border border-gray-200 text-sm focus:outline-none focus:border-emerald-400" /><span className="text-sm text-gray-500">.myshopify.com</span></div></div>
                                <button onClick={() => connectShopify(shopifyShop)} className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold shadow-lg shadow-green-200"><ExternalLink size={18} />Connect to Shopify</button>
                            </div>
                        )}

                        {selectedIntegration.slug === "youcan" && (
                            <div className="space-y-5">
                                <div className="space-y-4">
                                    {[{ l: "Store URL", v: youcanForm.store_url, k: "store_url", t: "url", p: "https://your-store.youcan.shop" },
                                    { l: "Client ID", v: youcanForm.client_id, k: "client_id", t: "text", p: "Enter your Client ID" },
                                    { l: "Client Secret", v: youcanForm.client_secret, k: "client_secret", t: showYoucanSecret ? "text" : "password", p: "Enter your Client Secret", secret: true }
                                    ].map(f => (
                                        <div key={f.k}><label className="block text-xs font-semibold text-gray-700 mb-2 uppercase">{f.l}</label>
                                            <div className="relative">
                                                <input type={f.t} placeholder={f.p} value={f.v} onChange={e => setYoucanForm(p => ({ ...p, [f.k]: e.target.value }))} className="w-full px-4 py-3.5 rounded-xl bg-white border border-gray-200 text-sm focus:outline-none focus:border-emerald-400" />
                                                {f.secret && <button type="button" onClick={() => setShowYoucanSecret(!showYoucanSecret)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">{showYoucanSecret ? <EyeOff size={18} /> : <Eye size={18} />}</button>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <button onClick={handleCreateIntegration} disabled={loading} className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold disabled:opacity-50 shadow-lg shadow-green-200">{loading ? <Loader2 size={18} className="animate-spin" /> : <><Link size={18} />Connect YouCan Store</>}</button>
                            </div>
                        )}

                        {selectedIntegration.slug === "google_sheets" && (
                            <div className="space-y-5">
                                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5"><Info size={18} className="text-blue-500 mb-2" /><p className="text-sm text-blue-800">Copy the Sheet ID from your Google Sheet URL.</p><code className="block p-3 bg-blue-100 rounded-xl text-xs text-blue-800 font-mono break-all mt-2">docs.google.com/spreadsheets/d/<strong>YOUR_SHEET_ID</strong>/edit</code></div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {[{ l: "Source Name", v: sheetForm.source_name, k: "source_name", p: "e.g., Facebook Ads Leads" },
                                    { l: "Sheet Name", v: sheetForm.sheet_name, k: "sheet_name", p: "Sheet1" },
                                    { l: "Sheet ID *", v: sheetForm.sheet_id, k: "sheet_id", p: "1BxiMVs...", full: true },
                                    { l: "Start Line", v: sheetForm.start_line, k: "start_line", p: "2", num: true }
                                    ].map(f => (
                                        <div key={f.k} className={f.full ? "md:col-span-2" : ""}><label className="block text-xs font-semibold text-gray-700 mb-2 uppercase">{f.l}</label><input type={f.num ? "number" : "text"} placeholder={f.p} value={f.v} onChange={e => setSheetForm(p => ({ ...p, [f.k]: f.num ? parseInt(e.target.value) || 1 : e.target.value }))} className={`w-full px-4 py-3.5 rounded-xl bg-white border border-gray-200 text-sm focus:outline-none focus:border-emerald-400 ${f.full ? "font-mono" : ""}`} /></div>
                                    ))}
                                </div>
                                <button onClick={handleCreateIntegration} disabled={loading} className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold disabled:opacity-50 shadow-lg shadow-green-200">{loading ? <Loader2 size={18} className="animate-spin" /> : <><Link size={18} />Connect Google Sheets</>}</button>
                            </div>
                        )}
                    </div>
                )}
            </SlideUpPanel>

            <AutoImportSettings open={!!autoImportSettings} onClose={() => setAutoImportSettings(null)} connection={autoImportSettings} onSave={saveAutoImportSettings} />
            <ConfirmDialog open={!!deleteConfirm} title={`Delete ${deleteConfirm?.name || ""} Integration?`} desc="This action cannot be undone." onConfirm={() => deleteConfirm && deleteConnection(deleteConfirm.id)} onCancel={() => setDeleteConfirm(null)} />
            <ToastContainer toasts={toasts} />

            <style jsx global>{`
                @keyframes slideUpPanel { from { transform: translateY(100%); } to { transform: translateY(0); } }
                .animate-slide-up-panel { animation: slideUpPanel 0.35s cubic-bezier(0.32, 0.72, 0, 1); }
                @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
                .animate-scale-in { animation: scaleIn 0.2s ease-out; }
                @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                .animate-slide-up { animation: slideUp 0.3s ease-out; }
            `}</style>
        </div>
    );
}

// ─── EXPORT WITH PROTECTION ───────────────────────────────
export default function IntegrationsPage() {
    return (
        <ProtectedPage page="integrations">
            <IntegrationsContent />
        </ProtectedPage>
    );
}