"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import ProtectedPage from "@/components/ProtectedPage";
import {
    Zap, Plus, Power, PowerOff, Trash2, X, Check,
    Store, Sheet, RefreshCw, AlertTriangle, CheckCircle, Info, ExternalLink, ArrowRight,
    Database, Cloud, Eye, EyeOff, Loader2, Activity, Link,
    Copy, Calendar, ShoppingCart, Timer,
    RotateCcw, Truck, Bike, Key, Globe, FileText,
    CheckCheck, Search, Package
} from "lucide-react";

/* ================================================================
   TOAST SYSTEM
================================================================ */
let toastId = 0;
const toastListeners = new Set();
function emitToast(t) { toastId++; const toast = { id: toastId, ...t }; toastListeners.forEach(fn => fn(toast)); if (t.duration !== 0) setTimeout(() => toastListeners.forEach(fn => fn({ ...toast, remove: true })), t.duration || 4000); }
const toast = {
    success: (m) => emitToast({ type: "success", message: m }),
    error: (m) => emitToast({ type: "error", message: m, duration: 6000 }),
    info: (m) => emitToast({ type: "info", message: m }),
    warning: (m) => emitToast({ type: "warning", message: m }),
};

function ToastContainer() {
    const [toasts, setToasts] = useState([]);
    useEffect(() => { const h = (t) => setToasts(p => t.remove ? p.filter(x => x.id !== t.id) : [...p, t]); toastListeners.add(h); return () => toastListeners.delete(h); }, []);
    return (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
            {toasts.map(t => (
                <div key={t.id} className={`pointer-events-auto flex items-center gap-3 px-5 py-3.5 rounded-2xl text-sm font-semibold shadow-2xl border animate-slide-up ${t.type === "success" ? "bg-emerald-600 text-white border-emerald-400" :
                        t.type === "error" ? "bg-red-600 text-white border-red-400" :
                            t.type === "warning" ? "bg-amber-500 text-white border-amber-400" :
                                "bg-blue-600 text-white border-blue-400"
                    }`}>
                    {t.type === "success" ? <CheckCircle size={16} /> : t.type === "error" ? <AlertTriangle size={16} /> : <Info size={16} />}
                    {t.message}
                </div>
            ))}
        </div>
    );
}

/* ================================================================
   INTEGRATION SELECTION MODAL
================================================================ */
function IntegrationSelectModal({ open, onClose, onSelect, integrations }) {
    if (!open) return null;
    const iconMap = { google_sheets: Sheet, shopify: ShoppingCart, youcan: Store, ameex: Truck, olaivraison: Bike, onessta: Package, aramex: Truck, ozon: Package };
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col animate-scale-in">
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100"><div><h2 className="text-xl font-bold text-gray-900">New Integration</h2><p className="text-sm text-gray-500 mt-1">Choose a platform to connect</p></div><button onClick={onClose} className="p-2.5 rounded-xl hover:bg-gray-100 text-gray-400"><X size={20} /></button></div>
                <div className="overflow-y-auto flex-1 p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {integrations.filter(i => i.is_active !== false).map((integration) => {
                            const Icon = iconMap[integration.slug] || Zap;
                            return (
                                <button key={integration.id} onClick={() => { onClose(); onSelect(integration); }}
                                    className="relative text-left p-5 rounded-2xl border-2 border-gray-100 hover:border-emerald-300 hover:bg-emerald-50/30 cursor-pointer hover:shadow-lg transition-all duration-300 group">
                                    <div className="p-3 rounded-2xl mb-4 w-fit transition-transform group-hover:scale-110 bg-emerald-50"><Icon size={24} className="text-emerald-600" /></div>
                                    <h3 className="text-base font-bold text-gray-900 mb-1.5">{integration.name}</h3>
                                    <p className="text-xs text-gray-500 mb-3 line-clamp-2">{integration.description || "No description"}</p>
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
   SETUP GUIDE PANEL
================================================================ */
function SetupGuidePanel({ open, onClose, integration, onConnect, connecting, error, children }) {
    useEffect(() => { if (open) document.body.style.overflow = "hidden"; else document.body.style.overflow = ""; return () => { document.body.style.overflow = ""; }; }, [open]);
    if (!open || !integration) return null;

    const steps = getIntegrationSteps(integration.slug);
    const webhookBase = typeof window !== "undefined" ? window.location.origin : "";

    return (
        <div className="fixed inset-0 z-[250] flex items-end justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full bg-white rounded-t-3xl shadow-2xl flex flex-col animate-slide-up-panel" style={{ height: "90vh", maxHeight: "90vh" }}>
                <div className="flex justify-center pt-3 pb-1 flex-shrink-0"><div className="w-12 h-1.5 rounded-full bg-gray-300" /></div>
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0"><div><h2 className="text-xl font-bold text-gray-900">Setup: {integration.name}</h2><p className="text-sm text-gray-500 mt-0.5">Follow these steps to connect</p></div><button onClick={onClose} className="p-2.5 rounded-xl hover:bg-gray-100 text-gray-400"><X size={20} /></button></div>
                <div className="overflow-y-auto flex-1 px-6 py-6">
                    <div className="max-w-3xl mx-auto space-y-6">
                        {error && <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center gap-3"><AlertTriangle size={18} className="text-rose-500" /><p className="text-sm text-rose-700">{error}</p></div>}
                        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
                            <h3 className="font-bold text-blue-800 mb-3 flex items-center gap-2"><FileText size={18} /> Setup Guide</h3>
                            <div className="space-y-4">
                                {steps.map((step, i) => (
                                    <div key={i} className="flex gap-3">
                                        <div className="w-7 h-7 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}</div>
                                        <div className="flex-1"><p className="text-sm font-semibold text-blue-900">{step.title}</p><p className="text-xs text-blue-700 mt-1">{step.description}</p>{step.code && <code className="block mt-2 p-2 bg-blue-100 rounded-lg text-xs text-blue-800 font-mono break-all">{step.code.replace('YOUR_DOMAIN', webhookBase)}</code>}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        {children}
                    </div>
                </div>
                <div className="flex-shrink-0 px-6 py-4 border-t border-gray-100 bg-gray-50/50"><p className="text-xs text-gray-500 text-center">Press Esc or click outside to close</p></div>
            </div>
        </div>
    );
}

/* ================================================================
   STEP GUIDES
================================================================ */
function getIntegrationSteps(slug) {
    const guides = {
        google_sheets: [
            { title: "Open your Google Sheet", description: "Go to Google Sheets and open the spreadsheet." },
            { title: "Copy the Sheet ID", description: "From the URL, copy the string between /d/ and /edit", code: "docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit" },
            { title: "Make the sheet public", description: "Click Share → 'Anyone with the link' → Viewer. This is required for the API to read your data." },
            { title: "Enter details below", description: "Fill in the fields and paste the Sheet ID. Only NEW rows will be imported each time." },
        ],
        shopify: [{ title: "Enter your store URL", description: "Type your store subdomain (e.g., 'my-store')." }, { title: "Click Connect", description: "You'll be redirected to Shopify to authorize." }, { title: "Approve permissions", description: "Review and approve in Shopify." }],
        youcan: [{ title: "Click Connect below", description: "You'll be redirected to YouCan to authorize." }, { title: "Approve permissions", description: "Review and approve in YouCan." }],
        ameex: [{ title: "Log in to Ameex", description: "Go to your Ameex dashboard and generate an API key." }, { title: "Set Webhook URL", description: "Copy the webhook URL and paste it in Ameex settings.", code: "YOUR_DOMAIN/api/integrations/ameex/webhook" }, { title: "Enter API Key below", description: "Paste the API key you generated." }],
        olaivraison: [{ title: "Log in to Olaivraison", description: "Get your API Key and Client ID from settings." }, { title: "Set Webhook URL", description: "Copy the webhook URL and paste it in Olaivraison settings.", code: "YOUR_DOMAIN/api/integrations/olaivraison/webhook" }, { title: "Enter credentials below", description: "Fill in API Key, Client ID, and optional API URL." }],
        onessta: [{ title: "Log in to Onessta", description: "Get your API Key and Client ID from API settings." }, { title: "Set Webhook URL", description: "Copy the webhook URL and paste it in Onessta settings.", code: "YOUR_DOMAIN/api/integrations/onessta/webhook" }, { title: "Enter credentials below", description: "Fill in API Key and Client ID." }],
        aramex: [{ title: "Get Aramex credentials", description: "You need username, password, and account number from Aramex." }, { title: "Enter details below", description: "Fill in all required fields." }],
        ozon: [{ title: "Log in to Ozon Express", description: "Go to ozonexpress.ma and log in." }, { title: "Generate API Key", description: "Go to Compte → Generate your API key." }, { title: "Find your Client ID", description: "Your Client ID is shown in account settings." }, { title: "Set Webhook URL", description: "Copy the webhook URL and configure it in Ozon Express.", code: "YOUR_DOMAIN/api/integrations/ozon/webhook" }, { title: "Enter credentials below", description: "Fill in Client ID and API Key." }],
    };
    return guides[slug] || [{ title: "Prepare credentials", description: "Have your API credentials ready." }, { title: "Fill in the form", description: "Enter the required information below." }];
}

/* ================================================================
   MAIN PAGE
================================================================ */
function IntegrationsContent() {
    const [integrations, setIntegrations] = useState([]);
    const [connections, setConnections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showSelectModal, setShowSelectModal] = useState(false);
    const [showGuide, setShowGuide] = useState(false);
    const [selectedIntegration, setSelectedIntegration] = useState(null);
    const [connecting, setConnecting] = useState(false);
    const [error, setError] = useState(null);
    const [autoImportTimers, setAutoImportTimers] = useState({});
    const [importingId, setImportingId] = useState(null);

    const [connectionName, setConnectionName] = useState("");
    const [shopifyShop, setShopifyShop] = useState("");
    const [sheetForm, setSheetForm] = useState({ source_name: "", sheet_id: "", sheet_name: "Sheet1" });
    const [ameexForm, setAmeexForm] = useState({ api_key: "" });
    const [olaivraisonForm, setOlaivraisonForm] = useState({ api_key: "", client_id: "", api_url: "" });
    const [onesstaForm, setOnesstaForm] = useState({ api_key: "", client_id: "" });
    const [aramexForm, setAramexForm] = useState({ username: "", password: "", account_number: "", account_pin: "", account_entity: "" });
    const [ozonForm, setOzonForm] = useState({ client_id: "", api_key: "", api_url: "" });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const { data: iData } = await supabase.from("integrations").select("*").order("name");
            setIntegrations(iData || []);
            const { data: cData } = await supabase.from("integration_connections").select("*").order("created_at", { ascending: false });
            setConnections(cData || []);
        } catch (err) { toast.error("Failed to load integrations"); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    // Auto-import timers
    useEffect(() => {
        Object.values(autoImportTimers).forEach(t => clearInterval(t));
        const newTimers = {};
        connections.forEach(conn => {
            if (conn.config?.auto_import_enabled && conn.status === "active" && conn.config?.auto_import_interval) {
                newTimers[conn.id] = setInterval(async () => {
                    try {
                        const res = await fetch("/api/integrations/google/import", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ connection: conn }) });
                        const result = await res.json();
                        if (res.ok && result.success && result.imported > 0) {
                            toast.success(`Auto-import: ${result.imported} new leads (${result.skipped || 0} skipped)`);
                        }
                    } catch (err) { console.error("Auto-import error:", err); }
                }, conn.config.auto_import_interval * 1000);
            }
        });
        setAutoImportTimers(newTimers);
        return () => { Object.values(newTimers).forEach(t => clearInterval(t)); };
    }, [connections]);

    const resetForms = () => {
        setConnectionName(""); setShopifyShop("");
        setSheetForm({ source_name: "", sheet_id: "", sheet_name: "Sheet1" });
        setAmeexForm({ api_key: "" });
        setOlaivraisonForm({ api_key: "", client_id: "", api_url: "" });
        setOnesstaForm({ api_key: "", client_id: "" });
        setAramexForm({ username: "", password: "", account_number: "", account_pin: "", account_entity: "" });
        setOzonForm({ client_id: "", api_key: "", api_url: "" });
    };

    const handleSelectIntegration = (integration) => {
        setSelectedIntegration(integration);
        resetForms();
        setError(null);
        setShowGuide(true);
    };

    const getTenantId = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Please log in again");
        const { data: profile } = await supabase.from("user_profiles").select("tenant_id").eq("id", user.id).single();
        if (!profile?.tenant_id) throw new Error("No workspace found");
        return profile.tenant_id;
    };

    const createConnection = async (credentials = {}, config = {}) => {
        if (!connectionName.trim()) { toast.warning("Please enter a connection name"); return false; }
        setConnecting(true); setError(null);
        try {
            const tenantId = await getTenantId();
            const { error: insertError } = await supabase.from("integration_connections").insert({
                tenant_id: tenantId, integration_id: selectedIntegration.id,
                status: "active", name: connectionName,
                credentials: credentials,
                config: { ...config, type: selectedIntegration.slug },
            });
            if (insertError) throw insertError;
            toast.success(`"${connectionName}" connected!`);
            setShowGuide(false); setSelectedIntegration(null); fetchData();
            return true;
        } catch (err) { setError(err.message); toast.error(err.message); return false; }
        finally { setConnecting(false); }
    };

    const handleConnectGoogleSheets = async () => {
        if (!sheetForm.sheet_id?.trim()) { toast.warning("Sheet ID is required"); return; }
        await createConnection({}, {
            source_name: sheetForm.source_name || connectionName,
            sheet_id: sheetForm.sheet_id.trim(),
            sheet_name: sheetForm.sheet_name || "Sheet1",
            auto_import_enabled: false, auto_import_interval: 60,
            last_imported_row: 1, total_imported: 0,
        });
    };

    const handleConnectAmeex = async () => { if (!ameexForm.api_key.trim()) { toast.warning("API Key is required"); return; } await createConnection({ api_key: ameexForm.api_key }, { type: "ameex_api" }); };
    const handleConnectOlaivraison = async () => { if (!olaivraisonForm.api_key.trim() || !olaivraisonForm.client_id.trim()) { toast.warning("API Key and Client ID are required"); return; } await createConnection({ api_key: olaivraisonForm.api_key, client_id: olaivraisonForm.client_id }, { api_url: olaivraisonForm.api_url || "https://api.olaivraison.com" }); };
    const handleConnectOnessta = async () => { if (!onesstaForm.api_key.trim() || !onesstaForm.client_id.trim()) { toast.warning("API Key and Client ID are required"); return; } await createConnection({ api_key: onesstaForm.api_key, client_id: onesstaForm.client_id }, {}); };
    const handleConnectAramex = async () => { if (!aramexForm.username.trim() || !aramexForm.password.trim() || !aramexForm.account_number.trim()) { toast.warning("Username, password, and account number are required"); return; } await createConnection({ ...aramexForm }, { account_number: aramexForm.account_number }); };
    const handleConnectOzon = async () => { if (!ozonForm.client_id.trim()) { toast.warning("Client ID is required"); return; } if (!ozonForm.api_key.trim()) { toast.warning("API Key is required"); return; } await createConnection({ client_id: ozonForm.client_id, api_key: ozonForm.api_key, api_url: ozonForm.api_url || "https://api.ozonexpress.ma" }, { api_url: ozonForm.api_url || "https://api.ozonexpress.ma", client_id: ozonForm.client_id }); };
    const handleConnectShopify = async () => { if (!connectionName.trim()) { toast.warning("Please enter a connection name"); return; } if (!shopifyShop.trim()) { toast.warning("Please enter your store URL"); return; } const fullShop = `${shopifyShop.replace(/https?:\/\//, "").replace(/\.myshopify\.com.*/, "").replace(/\/.*/, "").trim()}.myshopify.com`; const tenantId = await getTenantId(); window.location.href = `/api/integrations/shopify/connect?shop=${fullShop}&state=${btoa(JSON.stringify({ tenant_id: tenantId, connection_name: connectionName }))}`; };
    const handleConnectYoucan = async () => { if (!connectionName.trim()) { toast.warning("Please enter a connection name"); return; } const tenantId = await getTenantId(); window.location.href = `/api/integrations/youcan/connect?tenant_id=${tenantId}&state=${btoa(JSON.stringify({ tenant_id: tenantId, connection_name: connectionName }))}`; };

    const toggleConnection = async (id, cur) => { const s = cur === "active" ? "inactive" : "active"; const { error } = await supabase.from("integration_connections").update({ status: s }).eq("id", id); if (error) { toast.error("Failed: " + error.message); return; } toast.success(`Integration ${s === "active" ? "activated" : "deactivated"}!`); fetchData(); };
    const deleteConnection = async (id, name) => { const { error } = await supabase.from("integration_connections").delete().eq("id", id); if (error) { toast.error("Failed: " + error.message); return; } toast.success(`"${name || 'Integration'}" removed!`); fetchData(); };

    const toggleAutoImport = async (conn) => {
        const enabled = !conn.config?.auto_import_enabled;
        const updatedConfig = { ...(conn.config || {}), auto_import_enabled: enabled, auto_import_interval: conn.config?.auto_import_interval || 60 };
        const { error } = await supabase.from("integration_connections").update({ config: updatedConfig }).eq("id", conn.id);
        if (error) { toast.error("Failed: " + error.message); return; }
        toast.success(`Auto-import ${enabled ? 'enabled' : 'disabled'}!`);
        fetchData();
    };

    const handleManualImport = async (conn) => {
        setImportingId(conn.id);
        toast.info(`Importing from "${conn.name || 'Sheets'}"...`);
        try {
            const res = await fetch("/api/integrations/google/import", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ connection: conn }) });
            const result = await res.json();
            if (res.ok && result.success) {
                if (result.imported === 0 && result.skipped === 0) {
                    toast.info("No new data to import. Everything is up to date!");
                } else {
                    toast.success(`Imported ${result.imported || 0} new leads (${result.skipped || 0} duplicates skipped)`);
                }
                fetchData();
            } else throw new Error(result.error || "Import failed");
        } catch (err) { toast.error(err.message); }
        finally { setImportingId(null); }
    };

    const getConnectHandler = (slug) => {
        const h = { google_sheets: handleConnectGoogleSheets, ameex: handleConnectAmeex, olaivraison: handleConnectOlaivraison, onessta: handleConnectOnessta, aramex: handleConnectAramex, ozon: handleConnectOzon, shopify: handleConnectShopify, youcan: handleConnectYoucan };
        return h[slug] || (() => createConnection({}, {}));
    };

    const activeCount = connections.filter(c => c.status === "active").length;
    const autoImportCount = connections.filter(c => c.config?.auto_import_enabled).length;

    if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><Loader2 size={32} className="text-emerald-500 animate-spin" /></div>;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50">
            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3"><div className="p-3 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl shadow-xl shadow-green-200"><Zap size={22} className="text-white" /></div><div><h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Integrations</h1><p className="text-sm text-gray-500 mt-1">{connections.length} connected · {autoImportCount} auto-syncing</p></div></div>
                    <div className="flex items-center gap-2">
                        {autoImportCount > 0 && <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /><span className="text-xs font-semibold text-emerald-700">{autoImportCount} auto</span></div>}
                        <button onClick={fetchData} className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 shadow-sm"><RefreshCw size={16} className="text-gray-500" /></button>
                        <button onClick={() => setShowSelectModal(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white text-sm font-semibold shadow-lg shadow-green-200"><Plus size={16} />New Integration</button>
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[{ label: "Connected", value: connections.length, icon: Database, color: "#10b981" }, { label: "Active", value: activeCount, icon: Activity, color: "#22c55e" }, { label: "Inactive", value: connections.length - activeCount, icon: PowerOff, color: "#f59e0b" }, { label: "Available", value: integrations.filter(i => i.is_active !== false).length, icon: Cloud, color: "#8b5cf6" }].map((s, i) => (<div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm"><div className="flex items-center gap-3"><div className="p-2 rounded-xl" style={{ backgroundColor: `${s.color}15` }}><s.icon size={18} style={{ color: s.color }} /></div><div><p className="text-xs text-gray-500 uppercase font-semibold">{s.label}</p><p className="text-2xl font-bold text-gray-900">{s.value}</p></div></div></div>))}
                </div>

                {connections.length > 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                        <div className="px-6 py-4 border-b border-gray-100"><h3 className="font-bold text-gray-900 flex items-center gap-2"><Activity size={18} className="text-emerald-600" /> Connected Integrations <span className="px-2.5 py-0.5 rounded-full bg-gray-100 text-xs font-semibold text-gray-600">{connections.length}</span></h3></div>
                        <div className="overflow-x-auto"><table className="w-full"><thead><tr className="bg-gray-50/50"><th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase">Name</th><th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase">Type</th><th className="px-6 py-3 text-center text-[11px] font-semibold text-gray-500 uppercase">Status</th><th className="px-6 py-3 text-center text-[11px] font-semibold text-gray-500 uppercase">Auto-Sync</th><th className="px-6 py-3 text-center text-[11px] font-semibold text-gray-500 uppercase">Imported</th><th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase">Connected</th><th className="px-6 py-3 text-center text-[11px] font-semibold text-gray-500 uppercase">Actions</th></tr></thead><tbody className="divide-y divide-gray-50">{connections.map(conn => { const integration = integrations.find(i => i.id === conn.integration_id); const type = conn.config?.type || integration?.slug || "unknown"; return (<tr key={conn.id} className="hover:bg-gray-50/50 group"><td className="px-6 py-4"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center shadow-sm"><Zap size={16} className="text-emerald-600" /></div><div><p className="text-sm font-semibold text-gray-900">{conn.name || "—"}</p><p className="text-[10px] text-gray-400">{type}</p></div></div></td><td className="px-6 py-4"><span className="text-xs text-gray-600 capitalize">{type.replace(/_/g, ' ')}</span></td><td className="px-6 py-4 text-center"><div className="flex items-center justify-center gap-2"><div className={`w-2 h-2 rounded-full ${conn.status === "active" ? "bg-emerald-500 animate-pulse" : "bg-gray-300"}`} /><span className={`text-xs font-semibold capitalize ${conn.status === "active" ? "text-emerald-600" : "text-gray-500"}`}>{conn.status}</span></div></td><td className="px-6 py-4 text-center">{conn.config?.auto_import_enabled ? <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Every {conn.config.auto_import_interval}s</span> : <span className="text-xs text-gray-400">Manual</span>}</td><td className="px-6 py-4 text-center"><span className="text-xs font-semibold text-gray-700">{conn.config?.total_imported || 0}</span></td><td className="px-6 py-4"><span className="text-xs text-gray-500">{new Date(conn.created_at).toLocaleDateString()}</span></td><td className="px-6 py-4"><div className="flex items-center justify-center gap-2"><button onClick={() => toggleConnection(conn.id, conn.status)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${conn.status === "active" ? "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100" : "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"}`}>{conn.status === "active" ? "Deactivate" : "Activate"}</button>{type === "google_sheets" && <><button onClick={() => toggleAutoImport(conn)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${conn.config?.auto_import_enabled ? "bg-blue-100 text-blue-700 border border-blue-200" : "bg-gray-50 text-gray-600 border border-gray-200 hover:bg-blue-50"}`}><Timer size={12} className="inline mr-1" />{conn.config?.auto_import_enabled ? "ON" : "OFF"}</button><button onClick={() => handleManualImport(conn)} disabled={importingId === conn.id} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 disabled:opacity-50">{importingId === conn.id ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} className="inline mr-1" />}Import</button></>}<button onClick={() => deleteConnection(conn.id, conn.name)} className="p-1.5 rounded-lg bg-rose-50 text-rose-500 border border-rose-200 hover:bg-rose-100"><Trash2 size={12} /></button></div></td></tr>) })}</tbody></table></div>
                    </div>
                ) : (<div className="bg-white rounded-2xl border border-gray-100 p-16 text-center shadow-sm"><Database size={48} className="text-gray-300 mx-auto mb-4" /><h3 className="text-lg font-bold text-gray-900 mb-2">No Integrations Connected</h3><p className="text-sm text-gray-500 mb-6">Connect your first integration to start automating your workflow.</p><button onClick={() => setShowSelectModal(true)} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white text-sm font-semibold shadow-lg shadow-green-200"><Plus size={16} /> New Integration</button></div>)}
            </div>

            <IntegrationSelectModal open={showSelectModal} onClose={() => setShowSelectModal(false)} onSelect={handleSelectIntegration} integrations={integrations} />

            <SetupGuidePanel open={showGuide} onClose={() => { setShowGuide(false); setSelectedIntegration(null); setError(null); }} integration={selectedIntegration} connecting={connecting} error={error}>
                {selectedIntegration && (
                    <div className="space-y-5">
                        <div><label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase">Connection Name *</label><input type="text" placeholder={`e.g., "${selectedIntegration.name} Main"`} value={connectionName} onChange={e => setConnectionName(e.target.value)} className="w-full px-4 py-3.5 rounded-xl bg-white border border-gray-200 text-sm focus:outline-none focus:border-emerald-400" /></div>

                        {selectedIntegration.slug === "google_sheets" && (<div className="space-y-4">{[{ label: "Source Name", key: "source_name", placeholder: "e.g., Facebook Ads" }, { label: "Sheet Name", key: "sheet_name", placeholder: "Sheet1" }, { label: "Sheet ID *", key: "sheet_id", placeholder: "Paste Sheet ID", full: true }].map(f => (<div key={f.key}><label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase">{f.label}</label><input type="text" placeholder={f.placeholder} value={sheetForm[f.key]} onChange={e => setSheetForm(p => ({ ...p, [f.key]: e.target.value }))} className="w-full px-4 py-3.5 rounded-xl bg-white border border-gray-200 text-sm focus:outline-none focus:border-emerald-400 font-mono" /></div>))}</div>)}
                        {selectedIntegration.slug === "shopify" && (<div><label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase">Store URL</label><div className="flex items-center gap-2"><input type="text" placeholder="your-store" value={shopifyShop} onChange={e => setShopifyShop(e.target.value)} className="flex-1 px-4 py-3.5 rounded-xl bg-white border border-gray-200 text-sm focus:outline-none focus:border-emerald-400" /><span className="text-sm text-gray-500">.myshopify.com</span></div></div>)}
                        {selectedIntegration.slug === "ameex" && (<div className="space-y-4"><div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3"><p className="text-xs text-emerald-800 font-semibold">Webhook URL:</p><code className="text-xs text-emerald-700 break-all">{typeof window !== "undefined" ? window.location.origin : ""}/api/integrations/ameex/webhook</code></div><div><label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase">API Key *</label><input type="text" placeholder="Enter API key" value={ameexForm.api_key} onChange={e => setAmeexForm({ api_key: e.target.value })} className="w-full px-4 py-3.5 rounded-xl bg-white border border-gray-200 text-sm focus:outline-none focus:border-emerald-400 font-mono" /></div></div>)}
                        {selectedIntegration.slug === "olaivraison" && (<div className="space-y-4"><div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3"><p className="text-xs text-emerald-800 font-semibold">Webhook URL:</p><code className="text-xs text-emerald-700 break-all">{typeof window !== "undefined" ? window.location.origin : ""}/api/integrations/olaivraison/webhook</code></div>{[{ label: "API Key *", key: "api_key" }, { label: "Client ID *", key: "client_id" }, { label: "API URL (optional)", key: "api_url", placeholder: "https://api.olaivraison.com" }].map(f => (<div key={f.key}><label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase">{f.label}</label><input type="text" placeholder={f.placeholder || "Enter " + f.label} value={olaivraisonForm[f.key]} onChange={e => setOlaivraisonForm(p => ({ ...p, [f.key]: e.target.value }))} className="w-full px-4 py-3.5 rounded-xl bg-white border border-gray-200 text-sm focus:outline-none focus:border-emerald-400 font-mono" /></div>))}</div>)}
                        {selectedIntegration.slug === "onessta" && (<div className="space-y-4"><div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3"><p className="text-xs text-emerald-800 font-semibold">Webhook URL:</p><code className="text-xs text-emerald-700 break-all">{typeof window !== "undefined" ? window.location.origin : ""}/api/integrations/onessta/webhook</code></div>{[{ label: "API Key *", key: "api_key" }, { label: "Client ID *", key: "client_id" }].map(f => (<div key={f.key}><label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase">{f.label}</label><input type="text" placeholder={"Enter " + f.label} value={onesstaForm[f.key]} onChange={e => setOnesstaForm(p => ({ ...p, [f.key]: e.target.value }))} className="w-full px-4 py-3.5 rounded-xl bg-white border border-gray-200 text-sm focus:outline-none focus:border-emerald-400 font-mono" /></div>))}</div>)}
                        {selectedIntegration.slug === "aramex" && (<div className="space-y-4">{[{ label: "Username *", key: "username" }, { label: "Password *", key: "password", type: "password" }, { label: "Account Number *", key: "account_number" }, { label: "Account PIN", key: "account_pin", placeholder: "Optional" }, { label: "Account Entity", key: "account_entity", placeholder: "Optional" }].map(f => (<div key={f.key}><label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase">{f.label}</label><input type={f.type || "text"} placeholder={f.placeholder || "Enter " + f.label} value={aramexForm[f.key]} onChange={e => setAramexForm(p => ({ ...p, [f.key]: e.target.value }))} className="w-full px-4 py-3.5 rounded-xl bg-white border border-gray-200 text-sm focus:outline-none focus:border-emerald-400 font-mono" /></div>))}</div>)}
                        {selectedIntegration.slug === "ozon" && (<div className="space-y-4"><div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3"><p className="text-xs text-emerald-800 font-semibold">Webhook URL:</p><code className="text-xs text-emerald-700 break-all">{typeof window !== "undefined" ? window.location.origin : ""}/api/integrations/ozon/webhook</code></div><div className="bg-blue-50 border border-blue-200 rounded-xl p-3"><p className="text-xs text-blue-800"><strong>Get credentials:</strong><br />Go to ozonexpress.ma → Compte → Generate API key</p></div>{[{ label: "Client ID *", key: "client_id", placeholder: "e.g., 12345" }, { label: "API Key *", key: "api_key", placeholder: "Enter API key" }, { label: "Base URL (optional)", key: "api_url", placeholder: "https://api.ozonexpress.ma" }].map(f => (<div key={f.key}><label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase">{f.label}</label><input type="text" placeholder={f.placeholder} value={ozonForm[f.key]} onChange={e => setOzonForm(p => ({ ...p, [f.key]: e.target.value }))} className="w-full px-4 py-3.5 rounded-xl bg-white border border-gray-200 text-sm focus:outline-none focus:border-emerald-400 font-mono" /></div>))}</div>)}
                        {selectedIntegration.slug === "youcan" && (<div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4"><Info size={16} className="text-emerald-600 mb-1" /><p className="text-xs text-emerald-800">You'll be redirected to YouCan to authorize.</p></div>)}

                        <button onClick={getConnectHandler(selectedIntegration.slug)} disabled={connecting} className="w-full btn-primary mt-4">{connecting ? <Loader2 size={18} className="animate-spin" /> : <Link size={18} />}Connect {selectedIntegration.name}</button>
                    </div>
                )}
            </SetupGuidePanel>

            <ToastContainer />
            <style jsx global>{`
                @keyframes slideUpPanel { from { transform: translateY(100%); } to { transform: translateY(0); } }
                .animate-slide-up-panel { animation: slideUpPanel 0.35s cubic-bezier(0.32, 0.72, 0, 1); }
                @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
                .animate-scale-in { animation: scaleIn 0.2s ease-out; }
                @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                .animate-slide-up { animation: slideUp 0.3s ease-out; }
                .btn-primary { display: flex; align-items: center; justify-content: center; gap: .5rem; padding: 1rem 1.5rem; border-radius: 1rem; background: linear-gradient(135deg,#10b981,#059669); color: #fff; font-weight: 600; box-shadow: 0 4px 14px rgba(16,185,129,.3); transition: all .2s; width: 100%; }
                .btn-primary:hover:not(:disabled) { background: linear-gradient(135deg,#059669,#047857); transform: translateY(-1px); }
                .btn-primary:disabled { opacity: .5; cursor: not-allowed; }
            `}</style>
        </div>
    );
}

export default function IntegrationsPage() {
    return (<ProtectedPage page="integrations"><IntegrationsContent /></ProtectedPage>);
}