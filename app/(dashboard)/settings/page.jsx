"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
import {
    Settings, Loader2, RefreshCw, X, Check,
    Save, Globe, Bell, Zap,
    Clock, Copy, CheckCircle, AlertTriangle, Info,
    Calendar, CreditCard, ArrowRight,
    Building2, Eye, AlertCircle, Shield, EyeOff,
    Timer, Ban, Crown, Star, Sparkles, Rocket,
    ChevronRight, ArrowLeft, Activity, User
} from "lucide-react";
import { useRouter } from "next/navigation";

/* =========================================================
   TOAST SYSTEM
========================================================= */
let toastId = 0;
const toastListeners = new Set();

function emitToast(toast) {
    toastId++;
    const t = { id: toastId, ts: Date.now(), ...toast };
    toastListeners.forEach(fn => fn(t));
    if (t.duration !== 0) setTimeout(() => toastListeners.forEach(fn => fn({ ...t, remove: true })), t.duration || 4000);
}

const toast = {
    success: (msg) => emitToast({ type: "success", message: msg }),
    error: (msg) => emitToast({ type: "error", message: msg, duration: 6000 }),
    warning: (msg) => emitToast({ type: "warning", message: msg }),
    info: (msg) => emitToast({ type: "info", message: msg }),
};

function useToasts() {
    const [toasts, setToasts] = useState([]);
    useEffect(() => {
        const h = (t) => setToasts(p => t.remove ? p.filter(x => x.id !== t.id) : [...p.slice(-9), t]);
        toastListeners.add(h);
        return () => toastListeners.delete(h);
    }, []);
    return toasts;
}

/* =========================================================
   ACCOUNT STATUS BANNER
========================================================= */
function AccountStatusBanner({ tenant }) {
    const [dismissed, setDismissed] = useState(false);
    if (!tenant || dismissed) return null;

    const now = new Date();
    const isDisabled = tenant.plan === "disabled";
    const subEnd = tenant.subscription_ends_at ? new Date(tenant.subscription_ends_at) : null;
    const subExpired = subEnd && subEnd < now;
    const trialEnd = tenant.trial_ends_at ? new Date(tenant.trial_ends_at) : tenant.created_at ? new Date(new Date(tenant.created_at).getTime() + 7 * 24 * 60 * 60 * 1000) : null;
    const trialExpired = trialEnd && trialEnd < now && tenant.plan === "starter";
    const isSuspended = tenant.status === "suspended";
    const isInactive = tenant.status === "inactive";
    const subExpSoon = subEnd && !subExpired && (subEnd - now) < 7 * 24 * 60 * 60 * 1000;
    const trialExpSoon = trialEnd && !trialExpired && tenant.plan === "starter" && (trialEnd - now) < 7 * 24 * 60 * 60 * 1000;
    const days = (end) => Math.ceil((end - now) / (1000 * 60 * 60 * 24));

    let config = null;
    if (isDisabled) config = { type: "critical", gradient: "from-red-500 to-rose-600", bg: "bg-gradient-to-r from-red-50 via-rose-50 to-red-50", border: "border-red-300", text: "text-red-800", icon: Ban, iconBg: "bg-red-100", iconColor: "text-red-600", title: "Account Disabled", subtitle: "Contact support", message: "Your workspace has been disabled.", action: "Contact Support", link: "/contact" };
    else if (isSuspended) config = { type: "critical", gradient: "from-red-500 to-rose-600", bg: "bg-gradient-to-r from-red-50 via-rose-50 to-red-50", border: "border-red-300", text: "text-red-800", icon: AlertTriangle, iconBg: "bg-red-100", iconColor: "text-red-600", title: "Account Suspended", subtitle: "Access revoked", message: "Your workspace has been suspended.", action: "Contact Support", link: "/contact" };
    else if (isInactive) config = { type: "critical", gradient: "from-red-500 to-rose-600", bg: "bg-gradient-to-r from-red-50 via-rose-50 to-red-50", border: "border-red-300", text: "text-red-800", icon: X, iconBg: "bg-red-100", iconColor: "text-red-600", title: "Account Inactive", subtitle: "Workspace dormant", message: "Your workspace is inactive.", action: "Reactivate", link: "/settings?tab=billing" };
    else if (subExpired) config = { type: "critical", gradient: "from-amber-500 to-orange-600", bg: "bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50", border: "border-amber-300", text: "text-amber-900", icon: CreditCard, iconBg: "bg-amber-100", iconColor: "text-amber-600", title: "Subscription Expired", subtitle: `Expired ${days(subEnd)}d ago`, message: `Expired on ${subEnd.toLocaleDateString()}. Renew now.`, action: "Renew", link: "/settings?tab=billing" };
    else if (trialExpired) config = { type: "critical", gradient: "from-amber-500 to-orange-600", bg: "bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50", border: "border-amber-300", text: "text-amber-900", icon: Timer, iconBg: "bg-amber-100", iconColor: "text-amber-600", title: "Trial Expired", subtitle: `Ended ${days(trialEnd)}d ago`, message: `Ended on ${trialEnd.toLocaleDateString()}. Upgrade now.`, action: "Upgrade", link: "/upgrade" };
    else if (subExpSoon) config = { type: "warning", gradient: "from-amber-400 to-yellow-500", bg: "bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50", border: "border-amber-200", text: "text-amber-800", icon: Clock, iconBg: "bg-amber-100", iconColor: "text-amber-600", title: "Expiring Soon", subtitle: `${days(subEnd)}d left`, message: `Expires on ${subEnd.toLocaleDateString()}.`, action: "Renew", link: "/settings?tab=billing" };
    else if (trialExpSoon) config = { type: "warning", gradient: "from-amber-400 to-yellow-500", bg: "bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50", border: "border-amber-200", text: "text-amber-800", icon: Clock, iconBg: "bg-amber-100", iconColor: "text-amber-600", title: "Trial Ending", subtitle: `${days(trialEnd)}d left`, message: `Ends on ${trialEnd.toLocaleDateString()}.`, action: "Upgrade", link: "/upgrade" };
    else if (tenant.plan === "starter") config = { type: "info", gradient: "from-emerald-400 to-green-500", bg: "bg-gradient-to-r from-emerald-50 via-green-50 to-emerald-50", border: "border-emerald-200", text: "text-emerald-800", icon: Sparkles, iconBg: "bg-emerald-100", iconColor: "text-emerald-600", title: "Free Trial Active", subtitle: trialEnd ? `${days(trialEnd)}d remaining` : "Active", message: "You're on the Starter plan.", action: "Upgrade", link: "/upgrade" };
    else config = { type: "info", gradient: "from-blue-400 to-indigo-500", bg: "bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50", border: "border-blue-200", text: "text-blue-800", icon: Crown, iconBg: "bg-blue-100", iconColor: "text-blue-600", title: `${tenant.plan?.charAt(0).toUpperCase() + tenant.plan?.slice(1)} Plan Active`, subtitle: subEnd ? `${days(subEnd)}d until renewal` : "Active", message: "Your subscription is active.", action: "Manage", link: "/settings?tab=billing" };

    if (!config) return null;
    const Icn = config.icon;
    return (
        <div className={`${config.bg} ${config.border} border-2 rounded-3xl p-5 shadow-lg relative overflow-hidden`}>
            <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl ${config.gradient} opacity-5 rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none`} />
            <div className="relative flex items-start gap-4">
                <div className={`${config.iconBg} p-3 rounded-2xl flex-shrink-0`}><Icn size={22} className={config.iconColor} /></div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1"><h3 className={`text-base font-bold ${config.text}`}>{config.title}</h3><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${config.type === "critical" ? "bg-red-100 text-red-700" : config.type === "warning" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>{config.subtitle}</span></div>
                    <p className={`text-sm ${config.text} opacity-80 mb-2`}>{config.message}</p>
                    <a href={config.link} className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-bold shadow-lg transition-all hover:scale-105 bg-gradient-to-r ${config.gradient}`}>{config.action} <ChevronRight size={12} /></a>
                </div>
                <button onClick={() => setDismissed(true)} className="p-2 rounded-xl hover:bg-black/5 flex-shrink-0"><X size={15} className={config.text} /></button>
            </div>
        </div>
    );
}

/* =========================================================
   HELPERS
========================================================= */
const formatters = {
    date: (d) => d ? new Intl.DateTimeFormat("en-US", { year: "numeric", month: "long", day: "numeric" }).format(new Date(d)) : "—",
    relativeTime: (d) => {
        if (!d) return "—";
        const diffMs = new Date() - new Date(d);
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        if (diffDays === 0) return "Today"; if (diffDays === 1) return "Yesterday"; if (diffDays < 7) return `${diffDays} days ago`; if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`; if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`; return `${Math.floor(diffDays / 365)} years ago`;
    },
};

/* =========================================================
   MAIN SETTINGS PAGE
========================================================= */
export default function SettingsPage() {
    const router = useRouter();
    const [tenantId, setTenantId] = useState(null);
    const [currentUserRole, setCurrentUserRole] = useState(null);
    const [loading, setLoading] = useState(true);
    const [tenant, setTenant] = useState(null);
    const [activeSection, setActiveSection] = useState("workspace");
    const toasts = useToasts();
    const saveTimer = useRef(null);
    const [autoSaveStatus, setAutoSaveStatus] = useState(null);

    const [deleteStep, setDeleteStep] = useState(0);
    const [deleteConfirmation, setDeleteConfirmation] = useState({
        typedName: "", checkedUnderstand: false, checkedData: false,
        checkedIrreversible: false, password: "", showPassword: false
    });

    const PLAN_CONFIG = {
        starter: { label: "Starter", color: "bg-gray-100 text-gray-700", borderColor: "border-gray-300", icon: Zap, features: ["Basic Analytics", "Up to 5 Team Members", "1000 Leads/mo", "Email Support"] },
        pro: { label: "Pro", color: "bg-blue-100 text-blue-700", borderColor: "border-blue-300", icon: Star, features: ["Advanced Analytics", "Unlimited Team Members", "10000 Leads/mo", "API Access", "Priority Support"] },
        enterprise: { label: "Enterprise", color: "bg-purple-100 text-purple-700", borderColor: "border-purple-300", icon: Crown, features: ["Everything in Pro", "Custom Integrations", "Dedicated Support", "SLA Guarantee", "Custom Features"] },
        disabled: { label: "Disabled", color: "bg-red-100 text-red-700", borderColor: "border-red-300", icon: Ban, features: ["Access Restricted", "Contact Support", "Data Preserved"] },
    };

    const fetchData = useCallback(async () => {
        if (!tenantId) return;
        setLoading(true);
        try {
            const { data: tenantData } = await supabase.from("tenants").select("*").eq("id", tenantId).single();
            setTenant(tenantData);
        } catch (err) {
            toast.error("Failed to load settings data");
        } finally { setLoading(false); }
    }, [tenantId]);

    useEffect(() => {
        (async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data: profile } = await supabase.from("user_profiles").select("tenant_id, role").eq("id", user.id).single();
            if (profile?.tenant_id) { setTenantId(profile.tenant_id); setCurrentUserRole(profile.role); }
        })();
    }, []);

    useEffect(() => { if (tenantId) fetchData(); }, [tenantId, fetchData]);

    useEffect(() => {
        if (!tenantId) return;
        const channel = supabase.channel(`settings-${tenantId}`)
            .on("postgres_changes", { event: "*", schema: "public", table: "tenants", filter: `id=eq.${tenantId}` }, () => fetchData())
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [tenantId, fetchData]);

    const updateTenant = async (updates) => {
        try {
            const { error } = await supabase.from("tenants").update(updates).eq("id", tenantId);
            if (error) throw error;
            toast.success("Settings saved");
            fetchData();
            setAutoSaveStatus("saved");
            setTimeout(() => setAutoSaveStatus(null), 2000);
        } catch (err) { toast.error(err.message); }
    };

    const deleteWorkspace = async () => {
        if (deleteStep < 3) return;
        try {
            const { error } = await supabase.from("tenants").delete().eq("id", tenantId);
            if (error) throw error;
            toast.success("Workspace deleted");
            router.push("/");
        } catch (err) { toast.error(err.message); resetDeleteProcess(); }
    };

    const resetDeleteProcess = () => {
        setDeleteStep(0);
        setDeleteConfirmation({ typedName: "", checkedUnderstand: false, checkedData: false, checkedIrreversible: false, password: "", showPassword: false });
    };

    const canManage = currentUserRole === "owner" || currentUserRole === "admin";
    const isOwner = currentUserRole === "owner";
    const plan = PLAN_CONFIG[tenant?.plan] || PLAN_CONFIG.starter;
    const PlanIcon = plan.icon;
    const nextPlan = tenant?.plan === "starter" ? "pro" : tenant?.plan === "pro" ? "enterprise" : null;
    const canProceedStep1 = deleteConfirmation.checkedUnderstand && deleteConfirmation.checkedData && deleteConfirmation.checkedIrreversible;
    const canProceedStep2 = deleteConfirmation.typedName === tenant?.name;
    const canProceedStep3 = deleteConfirmation.password.length >= 6;

    if (loading) return <div className="min-h-screen bg-white flex items-center justify-center"><Loader2 size={28} className="animate-spin text-green-600" /></div>;

    return (
        <>
            <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
                {toasts.map(t => (
                    <div key={t.id} className={`pointer-events-auto px-4 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 ${t.type === "success" ? "bg-green-700 text-white" : t.type === "error" ? "bg-red-600 text-white" : t.type === "warning" ? "bg-amber-500 text-white" : "bg-blue-600 text-white"}`}>
                        {t.type === "success" ? <CheckCircle size={14} /> : t.type === "error" ? <AlertTriangle size={14} /> : <Info size={14} />}{t.message}
                    </div>
                ))}
            </div>

            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50">
                <div className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 space-y-6">

                    {/* Back */}
                    <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors group"><ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /><span>Back</span></button>

                    {/* ACCOUNT STATUS BANNER */}
                    <AccountStatusBanner tenant={tenant} />

                    {/* Header */}
                    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-green-600 flex items-center justify-center shadow-md shadow-green-200"><Settings size={18} className="text-white" /></div>
                                <div>
                                    <h1 className="text-xl font-bold text-gray-900">Settings</h1>
                                    <p className="text-sm text-gray-500">{tenant?.name} · Manage your workspace</p>
                                </div>
                            </div>
                            <button onClick={fetchData} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"><RefreshCw size={14} /></button>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex gap-1.5 overflow-x-auto pb-1">
                        {[{ id: "workspace", label: "Workspace", icon: Globe }, { id: "plan", label: "Plan & Billing", icon: CreditCard }].map(tab => {
                            const Icon = tab.icon;
                            return <button key={tab.id} onClick={() => setActiveSection(tab.id)} className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${activeSection === tab.id ? "bg-green-600 text-white shadow-md shadow-green-200" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"}`}><Icon size={14} /> {tab.label}</button>;
                        })}
                    </div>

                    {/* SECTION: WORKSPACE */}
                    {activeSection === "workspace" && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                            <Card>
                                <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2"><Building2 size={14} className="text-green-600" /> Workspace Details</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-2">Workspace Name</label>
                                        {canManage ? <input type="text" className="w-full border border-gray-200 rounded-xl px-3.5 py-3 text-sm focus:border-green-400 outline-none" value={tenant?.name || ""} onChange={e => { setTenant(p => ({ ...p, name: e.target.value })); clearTimeout(saveTimer.current); setAutoSaveStatus("saving"); saveTimer.current = setTimeout(() => updateTenant({ name: e.target.value }), 1500) }} /> : <div className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-3 text-sm text-gray-700">{tenant?.name}</div>}
                                        {autoSaveStatus && <p className={`text-[10px] mt-1 ${autoSaveStatus === "saving" ? "text-amber-500" : "text-green-600"}`}>{autoSaveStatus === "saving" ? "Auto-saving..." : "✓ Saved"}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-2">Workspace ID</label>
                                        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-3"><span className="text-sm text-gray-500 font-mono flex-1 truncate">{tenant?.id}</span><button onClick={() => { navigator.clipboard.writeText(tenant?.id); toast.success("Copied!") }} className="hover:bg-gray-200 rounded-lg p-1"><Copy size={12} className="text-gray-400" /></button></div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div><label className="block text-xs font-semibold text-gray-700 mb-2">Created</label><div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-xl px-3.5 py-3"><Calendar size={12} className="text-gray-400" />{formatters.date(tenant?.created_at)}</div></div>
                                        <div><label className="block text-xs font-semibold text-gray-700 mb-2">Time Zone</label>{canManage ? <select className="w-full border border-gray-200 rounded-xl px-3.5 py-3 text-sm focus:border-green-400 outline-none bg-white" value={tenant?.timezone || "UTC"} onChange={e => updateTenant({ timezone: e.target.value })}><option value="UTC">UTC</option><option value="America/New_York">Eastern</option><option value="America/Chicago">Central</option><option value="America/Denver">Mountain</option><option value="America/Los_Angeles">Pacific</option></select> : <div className="bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-3 text-sm text-gray-700">{tenant?.timezone || "UTC"}</div>}</div>
                                    </div>
                                </div>
                            </Card>

                            <Card className={`border-2 ${plan.borderColor}`}>
                                <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2"><PlanIcon size={14} className="text-amber-500" /> Current Plan</h3>
                                <div className="flex items-center justify-between mb-4"><span className={`px-3 py-1 rounded-full text-xs font-bold ${plan.color}`}>{plan.label}</span></div>
                                <div className="space-y-1.5 mb-4">{plan.features.map(f => <div key={f} className="flex items-center gap-2 text-xs text-gray-600"><Check size={10} className="text-green-600" /> {f}</div>)}</div>
                                {tenant?.subscription_ends_at && (
                                    <div className="mb-4 p-3 bg-gray-50 rounded-xl">
                                        <p className="text-xs text-gray-500">Subscription expires</p>
                                        <p className="text-sm font-semibold text-gray-800">{formatters.date(tenant.subscription_ends_at)}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">{Math.ceil((new Date(tenant.subscription_ends_at) - new Date()) / (1000 * 60 * 60 * 24))} days remaining</p>
                                    </div>
                                )}
                                {tenant?.trial_ends_at && (
                                    <div className="mb-4 p-3 bg-amber-50 rounded-xl border border-amber-200">
                                        <p className="text-xs text-amber-600">Trial ends</p>
                                        <p className="text-sm font-semibold text-amber-800">{formatters.date(tenant.trial_ends_at)}</p>
                                        <p className="text-xs text-amber-500 mt-0.5">{Math.ceil((new Date(tenant.trial_ends_at) - new Date()) / (1000 * 60 * 60 * 24))} days left</p>
                                    </div>
                                )}
                                {nextPlan && <button onClick={() => router.push("/upgrade")} className="w-full bg-green-600 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2">Upgrade to {PLAN_CONFIG[nextPlan].label} <ArrowRight size={14} /></button>}
                                {tenant?.plan === "disabled" && <button onClick={() => router.push("/contact")} className="w-full bg-red-600 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2 mt-2">Contact Support <ArrowRight size={14} /></button>}
                            </Card>

                            {/* Danger Zone */}
                            {isOwner && (
                                <div className="lg:col-span-2 bg-white border-2 border-red-200 rounded-2xl shadow-sm p-6">
                                    <h3 className="text-sm font-bold text-red-600 mb-4 flex items-center gap-2"><AlertTriangle size={14} /> Danger Zone</h3>
                                    {deleteStep === 0 && <div className="space-y-4">
                                        <div className="bg-red-50 border border-red-200 rounded-xl p-4"><div className="flex items-start gap-3"><AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" /><div><p className="text-sm font-semibold text-red-800 mb-1">Warning: Destructive Action</p><p className="text-xs text-red-700">Deleting your workspace will permanently remove all data. This action cannot be recovered.</p></div></div></div>
                                        <div className="space-y-3">
                                            {[{ key: "checkedUnderstand", label: "I understand that this action will delete my workspace" }, { key: "checkedData", label: "I acknowledge that all workspace data will be permanently lost" }, { key: "checkedIrreversible", label: "I understand this process is irreversible" }].map(({ key, label }) => <label key={key} className="flex items-start gap-3 cursor-pointer"><input type="checkbox" checked={deleteConfirmation[key]} onChange={e => setDeleteConfirmation(p => ({ ...p, [key]: e.target.checked }))} className="mt-0.5 rounded border-red-300 text-red-600" /><span className="text-sm text-gray-700">{label}</span></label>)}
                                        </div>
                                        <button onClick={() => setDeleteStep(1)} disabled={!canProceedStep1} className="w-full bg-red-600 text-white rounded-xl py-3 text-sm font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed">Continue to Confirmation</button>
                                    </div>}
                                    {deleteStep === 1 && <div className="space-y-4">
                                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4"><div className="flex items-start gap-3"><AlertTriangle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" /><div><p className="text-sm font-semibold text-amber-800 mb-1">Type Confirmation</p><p className="text-xs text-amber-700">Type <strong className="font-mono bg-amber-200 px-2 py-0.5 rounded">{tenant?.name}</strong> below.</p></div></div></div>
                                        <input type="text" placeholder={`Type "${tenant?.name}"`} value={deleteConfirmation.typedName} onChange={e => setDeleteConfirmation(p => ({ ...p, typedName: e.target.value }))} className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 text-sm focus:border-red-400 outline-none font-mono" />
                                        <div className="flex gap-3"><button onClick={() => setDeleteStep(0)} className="flex-1 bg-gray-100 text-gray-700 rounded-xl py-3 text-sm font-semibold hover:bg-gray-200">Go Back</button><button onClick={() => setDeleteStep(2)} disabled={!canProceedStep2} className="flex-1 bg-red-600 text-white rounded-xl py-3 text-sm font-semibold hover:bg-red-700 disabled:opacity-50">Continue to Final Step</button></div>
                                    </div>}
                                    {deleteStep === 2 && <div className="space-y-4">
                                        <div className="bg-red-50 border border-red-200 rounded-xl p-4"><div className="flex items-start gap-3"><Shield size={20} className="text-red-600 flex-shrink-0 mt-0.5" /><div><p className="text-sm font-semibold text-red-800 mb-1">Final Authentication</p><p className="text-xs text-red-700">Enter your password to verify.</p></div></div></div>
                                        <div className="relative"><input type={deleteConfirmation.showPassword ? "text" : "password"} placeholder="Enter your password" value={deleteConfirmation.password} onChange={e => setDeleteConfirmation(p => ({ ...p, password: e.target.value }))} className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 text-sm focus:border-red-400 outline-none pr-12" /><button onClick={() => setDeleteConfirmation(p => ({ ...p, showPassword: !p.showPassword }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{deleteConfirmation.showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div>
                                        <div className="flex gap-3"><button onClick={() => setDeleteStep(1)} className="flex-1 bg-gray-100 text-gray-700 rounded-xl py-3 text-sm font-semibold hover:bg-gray-200">Go Back</button><button onClick={() => setDeleteStep(3)} disabled={!canProceedStep3} className="flex-1 bg-red-600 text-white rounded-xl py-3 text-sm font-semibold hover:bg-red-700 disabled:opacity-50">I'm Ready to Delete</button></div>
                                    </div>}
                                    {deleteStep === 3 && <div className="space-y-4">
                                        <div className="bg-red-100 border-2 border-red-400 rounded-xl p-4"><div className="flex items-start gap-3"><AlertCircle size={24} className="text-red-700 flex-shrink-0 mt-0.5" /><div><p className="text-lg font-bold text-red-800 mb-2">⚠️ Final Warning</p><p className="text-sm text-red-700 mb-2">You are about to <strong>permanently delete</strong>:</p><p className="text-lg font-mono font-bold text-red-800 bg-red-200 px-4 py-2 rounded-lg inline-block mb-2">{tenant?.name}</p><p className="text-xs text-red-600">This will erase all data and cannot be reversed.</p></div></div></div>
                                        <div className="flex gap-3"><button onClick={resetDeleteProcess} className="flex-1 bg-gray-100 text-gray-700 rounded-xl py-3 text-sm font-semibold hover:bg-gray-200">Cancel & Keep Workspace</button><button onClick={deleteWorkspace} className="flex-1 bg-red-700 text-white rounded-xl py-3 text-sm font-bold hover:bg-red-800 shadow-lg shadow-red-200">Yes, Delete Permanently</button></div>
                                    </div>}
                                </div>
                            )}
                        </div>
                    )}

                    {/* SECTION: PLAN & BILLING */}
                    {activeSection === "plan" && (
                        <div className="space-y-5">
                            <Card>
                                <h3 className="text-sm font-bold text-gray-900 mb-6 flex items-center gap-2"><CreditCard size={14} className="text-blue-600" /> Plan & Billing</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                    {Object.entries(PLAN_CONFIG).filter(([k]) => k !== "disabled").map(([key, p]) => {
                                        const isCurrent = tenant?.plan === key;
                                        const PIcon = p.icon;
                                        return <div key={key} className={`border-2 rounded-xl p-5 ${isCurrent ? 'border-green-400 bg-green-50' : 'border-gray-200 bg-white'}`}>
                                            <div className="flex items-center justify-between mb-3"><h4 className="text-sm font-bold text-gray-900">{p.label}</h4>{isCurrent && <span className="text-[10px] font-semibold text-green-700 bg-green-200 px-2 py-0.5 rounded-full">Current</span>}</div>
                                            <div className="space-y-1.5">{p.features.map(f => <div key={f} className="flex items-center gap-2 text-xs text-gray-600"><Check size={10} className="text-green-600" /> {f}</div>)}</div>
                                        </div>;
                                    })}
                                </div>
                                <button onClick={() => router.push("/upgrade")} className="w-full bg-green-600 text-white rounded-xl py-3 text-sm font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2">Upgrade Plan <ArrowRight size={14} /></button>
                            </Card>
                            <Card>
                                <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2"><Clock size={14} className="text-gray-600" /> Billing History</h3>
                                <div className="text-center py-8 text-sm text-gray-500"><CreditCard size={24} className="mx-auto mb-2 text-gray-300" />No billing history available</div>
                            </Card>
                        </div>
                    )}

                </div>
            </div>
        </>
    );
}

function Card({ children, className = "" }) {
    return <div className={`bg-white border border-gray-200 rounded-2xl shadow-sm p-6 ${className}`}>{children}</div>;
}