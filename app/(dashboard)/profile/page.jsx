"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
    User, Loader2, Mail, Shield, Calendar,
    Save, Eye, EyeOff, Lock, Key, CheckCircle,
    AlertTriangle, Check, X, Copy, Hash,
    Building2, Crown, Clock, Globe, Smartphone,
    MapPin, Edit3, Camera, Upload, Trash2,
    BadgeCheck, Star, Zap, Award, Gift,
    ChevronRight, ArrowLeft, LogOut, Settings,
    Bell, Moon, Sun, Monitor, Activity,
    CreditCard, Receipt, Download, ExternalLink,
    MessageSquare, HelpCircle, FileText, RefreshCw,
    UserPlus, Users, UserCheck, Sparkles,
    Fingerprint, SmartphoneIcon, ShieldCheck,
    LayoutGrid, LayoutList, MoreHorizontal, Boxes, Archive, Package,
    Timer, Ban, Rocket
} from "lucide-react";

/* =========================================================
   TOAST SYSTEM
========================================================= */
let toastId = 0;
const toastListeners = new Set();
function emitToast(t) { toastId++; const toast = { id: toastId, ...t }; toastListeners.forEach(fn => fn(toast)); if (t.duration !== 0) setTimeout(() => toastListeners.forEach(fn => fn({ ...toast, remove: true })), t.duration || 4000); }
const toast = { success: (m) => emitToast({ type: "success", message: m }), error: (m) => emitToast({ type: "error", message: m, duration: 6000 }), info: (m) => emitToast({ type: "info", message: m }), warning: (m) => emitToast({ type: "warning", message: m, duration: 5000 }) };

function ToastContainer() {
    const [toasts, setToasts] = useState([]);
    useEffect(() => { const h = (t) => setToasts(p => t.remove ? p.filter(x => x.id !== t.id) : [...p, t]); toastListeners.add(h); return () => toastListeners.delete(h); }, []);
    return (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 max-w-sm">
            {toasts.map((t) => (
                <div key={t.id} className={`px-5 py-3.5 rounded-2xl shadow-xl text-sm font-medium flex items-center gap-3 animate-slide-up backdrop-blur-md border ${t.type === "success" ? "bg-green-600/95 text-white border-green-500" : t.type === "error" ? "bg-red-600/95 text-white border-red-500" : t.type === "info" ? "bg-blue-600/95 text-white border-blue-500" : "bg-amber-500/95 text-white border-amber-400"}`}>
                    {t.type === "success" && <CheckCircle size={16} />}{t.type === "error" && <AlertTriangle size={16} />}{t.type === "info" && <Activity size={16} />}{t.type === "warning" && <AlertTriangle size={16} />}
                    <span className="flex-1">{t.message}</span>
                    <button onClick={() => setToasts(p => p.filter(x => x.id !== t.id))} className="p-1 hover:bg-white/20 rounded-lg"><X size={14} /></button>
                </div>
            ))}
        </div>
    );
}

/* =========================================================
   CONSTANTS
========================================================= */
const ROLES = {
    owner: { label: "Owner", icon: Crown, color: "bg-amber-50 text-amber-700 border-amber-200", description: "Full access", permissions: ["Manage workspace", "Invite members", "Billing access", "Full API access"] },
    admin: { label: "Admin", icon: Shield, color: "bg-blue-50 text-blue-700 border-blue-200", description: "Manage team", permissions: ["Manage members", "Configure settings", "View analytics", "Manage orders"] },
    confirmation_agent: { label: "Confirmation Agent", icon: UserCheck, color: "bg-emerald-50 text-emerald-700 border-emerald-200", description: "Handle confirmations", permissions: ["View assigned leads", "Confirm orders", "Update status", "Contact customers"] },
    stock_manager: { label: "Stock Manager", icon: Package, color: "bg-purple-50 text-purple-700 border-purple-200", description: "Manage inventory", permissions: ["Manage inventory", "Update stock", "View analytics", "Handle returns"] },
    analyst: { label: "Analyst", icon: Activity, color: "bg-orange-50 text-orange-700 border-orange-200", description: "View analytics", permissions: ["View analytics", "Export reports", "Monitor KPIs", "Track performance"] },
    agent: { label: "Agent", icon: User, color: "bg-green-50 text-green-700 border-green-200", description: "Handle leads", permissions: ["View assigned leads", "Update lead status", "Contact customers"] },
    viewer: { label: "Viewer", icon: Eye, color: "bg-gray-50 text-gray-700 border-gray-200", description: "Read-only access", permissions: ["View dashboard", "View analytics", "View reports"] },
};

const PLAN_BADGES = {
    starter: { label: "Starter", icon: Zap, color: "bg-gray-50 text-gray-700 border-gray-200", progress: 33, features: ["Basic features", "Up to 5 team members", "100 orders/month"] },
    pro: { label: "Pro", icon: Star, color: "bg-green-50 text-green-700 border-green-200", progress: 66, features: ["All features", "Up to 20 team members", "Unlimited orders"] },
    enterprise: { label: "Enterprise", icon: Crown, color: "bg-purple-50 text-purple-700 border-purple-200", progress: 100, features: ["Everything in Pro", "Unlimited team", "Dedicated support"] },
    disabled: { label: "Disabled", icon: Ban, color: "bg-red-50 text-red-700 border-red-200", progress: 0, features: ["Access restricted", "Contact support", "Data preserved"] },
};

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
    else if (isInactive) config = { type: "critical", gradient: "from-red-500 to-rose-600", bg: "bg-gradient-to-r from-red-50 via-rose-50 to-red-50", border: "border-red-300", text: "text-red-800", icon: XCircle, iconBg: "bg-red-100", iconColor: "text-red-600", title: "Account Inactive", subtitle: "Workspace dormant", message: "Your workspace is inactive.", action: "Reactivate", link: "/settings?tab=billing" };
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
        const now = new Date();
        const date = new Date(d);
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
        if (diffDays === 1) return "Yesterday";
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) !== 1 ? 's' : ''} ago`;
        if (diffDays < 365) return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) !== 1 ? 's' : ''} ago`;
        return `${Math.floor(diffDays / 365)} year${Math.floor(diffDays / 365) !== 1 ? 's' : ''} ago`;
    },
    initials: (n) => n ? n.split(" ").map(x => x[0]).join("").slice(0, 2).toUpperCase() : "?",
};

/* =========================================================
   REUSABLE COMPONENTS
========================================================= */
function GridContainer({ children, columns = 2, gap = "md", className = "" }) {
    const gaps = { sm: "gap-4", md: "gap-5", lg: "gap-6" }, cols = { 1: "grid-cols-1", 2: "grid-cols-1 lg:grid-cols-2", 3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3", 4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" };
    return <div className={`grid ${cols[columns]} ${gaps[gap]} ${className}`}>{children}</div>;
}
function Card({ children, className = "", padding = "md", hover = false }) {
    const pads = { sm: "p-4", md: "p-5 lg:p-6", lg: "p-6 lg:p-8" };
    return <div className={`bg-white border border-gray-100 rounded-2xl shadow-sm ${hover ? 'hover:shadow-md hover:border-gray-200 transition-all duration-300' : ''} ${pads[padding]} ${className}`}>{children}</div>;
}
function SectionTitle({ icon: Icon, title, subtitle, action }) {
    return <div className="flex items-start justify-between mb-5"><div className="flex items-start gap-3">{Icon && <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0 ring-1 ring-green-100"><Icon size={17} className="text-green-600" /></div>}<div><h3 className="text-sm font-bold text-gray-900">{title}</h3>{subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}</div></div>{action && <div>{action}</div>}</div>;
}
function Badge({ children, variant = "default", icon: Icon, size = "sm" }) {
    const vars = { default: "bg-gray-50 text-gray-700 border-gray-200", success: "bg-green-50 text-green-700 border-green-200", warning: "bg-amber-50 text-amber-700 border-amber-200", error: "bg-red-50 text-red-700 border-red-200", info: "bg-blue-50 text-blue-700 border-blue-200", purple: "bg-purple-50 text-purple-700 border-purple-200", emerald: "bg-emerald-50 text-emerald-700 border-emerald-200", orange: "bg-orange-50 text-orange-700 border-orange-200" };
    const sizes = { xs: "px-2 py-0.5 text-[10px] gap-1", sm: "px-2.5 py-1 text-xs gap-1.5", md: "px-3 py-1.5 text-sm gap-1.5" };
    return <span className={`inline-flex items-center ${sizes[size]} rounded-full font-semibold border ${vars[variant]}`}>{Icon && <Icon size={size === 'xs' ? 10 : 12} />}{children}</span>;
}
function InfoGridItem({ icon: Icon, label, value, subtitle, children, span = 1 }) {
    return <div className={`bg-gray-50/50 rounded-xl p-4 border border-gray-100 hover:border-gray-200 transition-colors ${span > 1 ? `col-span-${span}` : ''}`}><div className="flex items-center gap-2.5 mb-2"><Icon size={14} className="text-gray-400 flex-shrink-0" /><span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</span></div><div className="flex items-center justify-between">{children ? children : <div><span className="text-sm font-semibold text-gray-800">{value || "—"}</span>{subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}</div>}</div></div>;
}
function Avatar({ name, size = "md" }) {
    const sizes = { xs: "w-8 h-8 text-xs rounded-lg", sm: "w-10 h-10 text-sm rounded-xl", md: "w-14 h-14 text-lg rounded-2xl", lg: "w-20 h-20 text-2xl rounded-2xl", xl: "w-28 h-28 text-4xl rounded-3xl" };
    return <div className={`${sizes[size]} flex items-center justify-center font-bold text-white bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/20 flex-shrink-0`}><span>{formatters.initials(name)}</span></div>;
}
function InputField({ label, type = "text", value, onChange, placeholder, error, disabled, icon: Icon, required }) {
    const [sp, setSp] = useState(false); const it = type === "password" ? (sp ? "text" : "password") : type; const ip = type === "password";
    return <div>{label && <label className="block text-xs font-semibold text-gray-700 mb-1.5">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>}<div className="relative">{Icon && <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"><Icon size={15} /></div>}<input type={it} value={value} onChange={onChange} placeholder={placeholder} disabled={disabled} className={`w-full border rounded-xl py-2.5 text-sm transition-all outline-none ${Icon ? 'pl-10' : 'pl-4'} ${ip ? 'pr-10' : 'pr-4'} ${error ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100 bg-red-50/30' : 'border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 bg-white'} ${disabled ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : 'text-gray-900'} placeholder:text-gray-400`} />{ip && <button type="button" onClick={() => setSp(!sp)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5">{sp ? <EyeOff size={15} /> : <Eye size={15} />}</button>}</div>{error && <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1"><AlertTriangle size={11} />{error}</p>}</div>;
}
function Button({ children, variant = "primary", size = "md", icon: Icon, loading, disabled, onClick, className = "", type = "button" }) {
    const vars = { primary: "bg-green-600 text-white hover:bg-green-700 shadow-sm", secondary: "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50", danger: "bg-red-600 text-white hover:bg-red-700", dangerOutline: "bg-white text-red-600 border border-red-200 hover:bg-red-50", ghost: "text-gray-600 hover:bg-gray-100", outline: "border border-gray-200 text-gray-700 hover:border-green-300", greenOutline: "border border-green-200 text-green-700 hover:bg-green-50" };
    const sizes = { xs: "px-2.5 py-1.5 text-xs rounded-lg gap-1.5", sm: "px-3.5 py-2 text-xs rounded-xl gap-1.5", md: "px-4 py-2.5 text-sm rounded-xl gap-2", lg: "px-6 py-3 text-sm rounded-xl gap-2.5", xl: "px-8 py-3.5 text-base rounded-2xl gap-3" };
    return <button type={type} onClick={onClick} disabled={disabled || loading} className={`inline-flex items-center justify-center font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] ${vars[variant]} ${sizes[size]} ${className}`}>{loading ? <Loader2 size={size === "xs" || size === "sm" ? 12 : 14} className="animate-spin" /> : Icon ? <Icon size={size === "xs" || size === "sm" ? 12 : 14} /> : null}{children}</button>;
}
function PasswordStrength({ password }) {
    const getStr = (p) => { let s = 0; if (!p) return { score: 0, label: "Enter password", color: "bg-gray-200", tc: "text-gray-400" }; if (p.length >= 6) s++; if (p.length >= 10) s++; if (p.match(/[A-Z]/)) s++; if (p.match(/[0-9]/)) s++; if (p.match(/[^A-Za-z0-9]/)) s++; const l = ["Very Weak", "Weak", "Fair", "Good", "Strong", "Very Strong"], c = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-green-400", "bg-green-500", "bg-emerald-500"], tc = ["text-red-600", "text-orange-600", "text-yellow-600", "text-green-600", "text-green-600", "text-emerald-600"]; return { score: Math.min(s, 5), label: l[Math.min(s, 5)], color: c[Math.min(s, 5)], tc: tc[Math.min(s, 5)] }; };
    const st = getStr(password);
    return <div className="space-y-2"><div className="flex gap-1">{[...Array(5)].map((_, i) => <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i < st.score ? st.color : 'bg-gray-200'}`} />)}</div>{password && <p className={`text-xs font-semibold ${st.tc}`}>{st.label}</p>}</div>;
}

/* =========================================================
   MAIN PROFILE PAGE
========================================================= */
export default function ProfilePage() {
    const router = useRouter();
    const [userId, setUserId] = useState(null);
    const [tenantId, setTenantId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState(null);
    const [tenant, setTenant] = useState(null);
    const [authEmail, setAuthEmail] = useState("");
    const [authCreatedAt, setAuthCreatedAt] = useState(null);
    const [authLastSignIn, setAuthLastSignIn] = useState(null);
    const [editingName, setEditingName] = useState(false);
    const [fullName, setFullName] = useState("");
    const [savingName, setSavingName] = useState(false);
    const [showPasswordSection, setShowPasswordSection] = useState(false);
    const [passwordForm, setPasswordForm] = useState({ current: "", new: "", confirm: "" });
    const [passwordErrors, setPasswordErrors] = useState({});
    const [changingPassword, setChangingPassword] = useState(false);
    const [passwordFeedback, setPasswordFeedback] = useState(null);

    const fetchData = useCallback(async () => {
        if (!userId || !tenantId) return; setLoading(true);
        try {
            const [{ data: p }, { data: t }, { data: { user } }] = await Promise.all([
                supabase.from("user_profiles").select("*").eq("id", userId).single(),
                supabase.from("tenants").select("*").eq("id", tenantId).single(),
                supabase.auth.getUser()
            ]);
            setProfile(p);
            setFullName(p?.full_name || "");
            setTenant(t);
            setAuthEmail(user?.email || "");

            // Get real auth metadata
            setAuthCreatedAt(user?.created_at || null);
            setAuthLastSignIn(user?.last_sign_in_at || null);

            console.log("Profile data:", { profile: p, tenant: t, user });
        } catch (err) {
            console.error("Failed to load:", err);
            toast.error("Failed to load profile data");
        } finally { setLoading(false) }
    }, [userId, tenantId]);

    useEffect(() => {
        (async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { router.push("/login"); return }
            setUserId(user.id);

            // Get auth metadata
            setAuthCreatedAt(user.created_at);
            setAuthLastSignIn(user.last_sign_in_at);

            const { data: p } = await supabase.from("user_profiles").select("tenant_id").eq("id", user.id).single();
            if (p?.tenant_id) setTenantId(p.tenant_id);
        })()
    }, [router]);

    useEffect(() => { if (userId && tenantId) fetchData() }, [userId, tenantId, fetchData]);

    const handleSaveName = async () => { if (!fullName.trim()) { toast.error("Name cannot be empty"); return } setSavingName(true); try { await supabase.from("user_profiles").update({ full_name: fullName.trim() }).eq("id", userId); toast.success("Profile updated!"); setEditingName(false); fetchData() } catch (err) { toast.error(err.message) } finally { setSavingName(false) } };

    const validatePw = () => { const e = {}; if (!passwordForm.current) e.current = "Required"; if (!passwordForm.new) e.new = "Required"; else if (passwordForm.new.length < 6) e.new = "Min 6 characters"; if (!passwordForm.confirm) e.confirm = "Required"; else if (passwordForm.new !== passwordForm.confirm) e.confirm = "Passwords don't match"; setPasswordErrors(e); return Object.keys(e).length === 0 };

    const handleChangePassword = async (e) => { e.preventDefault(); setPasswordFeedback(null); if (!validatePw()) return; setChangingPassword(true); try { const { error: sErr } = await supabase.auth.signInWithPassword({ email: authEmail, password: passwordForm.current }); if (sErr) { setPasswordFeedback({ type: "error", message: "Current password is incorrect" }); return } const { error: uErr } = await supabase.auth.updateUser({ password: passwordForm.new }); if (uErr) throw uErr; setPasswordFeedback({ type: "success", message: "Password changed!" }); setPasswordForm({ current: "", new: "", confirm: "" }); setShowPasswordSection(false); toast.success("Password updated!") } catch (err) { setPasswordFeedback({ type: "error", message: err.message }) } finally { setChangingPassword(false) } };

    const handleLogout = async () => { await supabase.auth.signOut(); router.push("/login") };

    const roleData = ROLES[profile?.role] || ROLES.viewer, RoleIcon = roleData.icon;
    const planData = PLAN_BADGES[tenant?.plan] || PLAN_BADGES.starter, PlanIcon = planData.icon;

    // REAL dynamic dates
    const memberSince = formatters.date(profile?.created_at || authCreatedAt);
    const memberSinceRelative = formatters.relativeTime(profile?.created_at || authCreatedAt);
    const lastSignIn = formatters.relativeTime(authLastSignIn);
    const lastSignInFull = formatters.date(authLastSignIn);

    // Get current browser info dynamically
    const getBrowserInfo = () => {
        if (typeof window === "undefined") return "Unknown Browser";
        const ua = navigator.userAgent;
        if (ua.includes("Firefox")) return "Firefox";
        if (ua.includes("Edg")) return "Microsoft Edge";
        if (ua.includes("Chrome")) return "Google Chrome";
        if (ua.includes("Safari")) return "Apple Safari";
        return "Web Browser";
    };

    const getOSInfo = () => {
        if (typeof window === "undefined") return "Unknown OS";
        const ua = navigator.userAgent;
        if (ua.includes("Windows")) return "Windows";
        if (ua.includes("Mac")) return "macOS";
        if (ua.includes("Linux")) return "Linux";
        if (ua.includes("iPhone") || ua.includes("iPad")) return "iOS";
        if (ua.includes("Android")) return "Android";
        return "Unknown OS";
    };

    if (loading) return <div className="min-h-screen bg-[#fefdfb] flex items-center justify-center"><div className="text-center space-y-5"><div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center animate-pulse shadow-lg mx-auto"><Loader2 size={32} className="text-white animate-spin" /></div><p className="text-sm font-semibold text-gray-700">Loading your profile</p></div></div>;

    return (
        <>
            <ToastContainer />
            <div className="min-h-screen bg-gradient-to-br from-[#fefdfb] via-[#fefcf8] to-[#fdfbf7]">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 lg:py-12 space-y-6">

                    <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors group"><ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /><span>Back</span></button>

                    <AccountStatusBanner tenant={tenant} />

                    {/* Profile Hero */}
                    <Card padding="lg" className="relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-green-50/40 via-emerald-50/20 to-transparent rounded-bl-full pointer-events-none" />
                        <div className="relative">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 lg:gap-6">
                                <Avatar name={profile?.full_name} size="lg" />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-1.5">
                                        {editingName ? <div className="flex items-center gap-2 flex-1 max-w-md"><input type="text" value={fullName} onChange={e => setFullName(e.target.value)} className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-lg font-bold text-gray-900 focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none shadow-sm" autoFocus onKeyDown={e => { if (e.key === "Enter") handleSaveName(); if (e.key === "Escape") setEditingName(false) }} /><Button size="md" onClick={handleSaveName} loading={savingName}>Save</Button><Button size="md" variant="ghost" onClick={() => setEditingName(false)}><X size={16} /></Button></div> : <><h1 className="text-xl lg:text-2xl font-bold text-gray-900 truncate">{profile?.full_name || "Unnamed User"}</h1><button onClick={() => setEditingName(true)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600"><Edit3 size={14} /></button></>}
                                    </div>
                                    <p className="text-sm text-gray-500 mb-3">{authEmail}</p>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Badge variant={roleData.color.includes('amber') ? 'warning' : roleData.color.includes('blue') ? 'info' : roleData.color.includes('emerald') ? 'emerald' : roleData.color.includes('purple') ? 'purple' : 'orange'} icon={RoleIcon}>{roleData.label}</Badge>
                                        <Badge variant={planData.color.includes('green') ? 'success' : planData.color.includes('purple') ? 'purple' : planData.color.includes('red') ? 'error' : 'default'} icon={PlanIcon}>{planData.label} Plan</Badge>
                                        <Badge variant="default" icon={Calendar}>Joined {memberSinceRelative}</Badge>
                                    </div>
                                </div>
                                <div className="flex sm:flex-col gap-2 w-full sm:w-auto">
                                    <Button size="sm" variant="outline" icon={Settings} onClick={() => router.push("/settings")} className="flex-1 sm:flex-none justify-center">Settings</Button>
                                    <Button size="sm" variant="dangerOutline" icon={LogOut} onClick={handleLogout} className="flex-1 sm:flex-none justify-center">Logout</Button>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <GridContainer columns={2} gap="lg">
                        <div className="space-y-5">
                            <Card>
                                <SectionTitle icon={User} title="Personal Information" subtitle="Your account details" />
                                <GridContainer columns={2} gap="sm">
                                    <InfoGridItem icon={User} label="Full Name" value={profile?.full_name || "Not set"} />
                                    <InfoGridItem icon={Mail} label="Email" value={authEmail} />
                                    <InfoGridItem icon={Shield} label="Role" span={2}>
                                        <span className="text-sm font-semibold text-gray-800">{roleData.label}</span>
                                        <Badge variant={roleData.color.includes('amber') ? 'warning' : roleData.color.includes('blue') ? 'info' : roleData.color.includes('emerald') ? 'emerald' : roleData.color.includes('purple') ? 'purple' : 'orange'} icon={RoleIcon} size="xs">{roleData.label}</Badge>
                                    </InfoGridItem>
                                    <InfoGridItem icon={Calendar} label="Member Since" value={memberSince} subtitle={memberSinceRelative} />
                                    <InfoGridItem icon={Clock} label="Last Sign In" value={lastSignInFull} subtitle={lastSignIn} />
                                </GridContainer>
                            </Card>
                            <Card>
                                <SectionTitle icon={ShieldCheck} title="Role Permissions" subtitle={`What you can do as ${roleData.label}`} />
                                <div className="space-y-2">{roleData.permissions.map((p, i) => <div key={i} className="flex items-center gap-3 p-2.5 hover:bg-gray-50 rounded-lg"><CheckCircle size={14} className="text-green-500 flex-shrink-0" /><span className="text-sm text-gray-700">{p}</span></div>)}</div>
                            </Card>
                        </div>
                        <div className="space-y-5">
                            <Card>
                                <SectionTitle icon={Fingerprint} title="Password & Security" subtitle="Protect your account" action={!showPasswordSection ? <Button size="sm" variant="greenOutline" icon={Key} onClick={() => { setShowPasswordSection(true); setPasswordFeedback(null); setPasswordErrors({}) }}>Change</Button> : null} />
                                {!showPasswordSection ? <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100"><div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center shadow-sm"><Lock size={16} className="text-gray-500" /></div><div className="flex-1"><p className="text-sm font-semibold text-gray-800">Password Protected</p><p className="text-xs text-gray-500">Changed {formatters.relativeTime(profile?.updated_at) || "recently"}</p></div><Badge variant="success" icon={CheckCircle} size="xs">Active</Badge></div> : <form onSubmit={handleChangePassword} className="space-y-4">
                                    <InputField label="Current Password" type="password" value={passwordForm.current} onChange={e => setPasswordForm(p => ({ ...p, current: e.target.value }))} placeholder="••••••••" error={passwordErrors.current} icon={Lock} required />
                                    <InputField label="New Password" type="password" value={passwordForm.new} onChange={e => setPasswordForm(p => ({ ...p, new: e.target.value }))} placeholder="Min. 6 characters" error={passwordErrors.new} icon={Key} required />
                                    {passwordForm.new && <PasswordStrength password={passwordForm.new} />}
                                    <InputField label="Confirm New Password" type="password" value={passwordForm.confirm} onChange={e => setPasswordForm(p => ({ ...p, confirm: e.target.value }))} placeholder="Re-enter password" error={passwordErrors.confirm} icon={Check} required />
                                    {passwordFeedback && <div className={`flex items-center gap-2.5 p-3.5 rounded-xl text-sm font-medium ${passwordFeedback.type === "error" ? "bg-red-50 text-red-700 border-red-200" : "bg-green-50 text-green-700 border-green-200"}`}>{passwordFeedback.type === "error" ? <AlertTriangle size={15} /> : <CheckCircle size={15} />}{passwordFeedback.message}</div>}
                                    <div className="flex gap-3 pt-2"><Button type="button" variant="secondary" className="flex-1" onClick={() => { setShowPasswordSection(false); setPasswordFeedback(null); setPasswordErrors({}); setPasswordForm({ current: "", new: "", confirm: "" }) }}>Cancel</Button><Button type="submit" className="flex-1" loading={changingPassword} icon={Key}>Update Password</Button></div>
                                </form>}
                            </Card>
                            <Card>
                                <SectionTitle icon={Building2} title="Workspace" subtitle="Your current workspace" />
                                <GridContainer columns={2} gap="sm" className="mb-4">
                                    <InfoGridItem icon={Building2} label="Name" value={tenant?.name || "Unknown"} />
                                    <InfoGridItem icon={Crown} label="Plan"><span className="text-sm font-semibold text-gray-800">{planData.label}</span><Badge variant={planData.color.includes('green') ? 'success' : planData.color.includes('purple') ? 'purple' : planData.color.includes('red') ? 'error' : 'default'} icon={PlanIcon} size="xs">{planData.label}</Badge></InfoGridItem>
                                    {tenant?.subscription_ends_at && (
                                        <InfoGridItem icon={Calendar} label="Subscription Expires" value={formatters.date(tenant.subscription_ends_at)} subtitle={`${Math.ceil((new Date(tenant.subscription_ends_at) - new Date()) / (1000 * 60 * 60 * 24))} days remaining`} />
                                    )}
                                    <InfoGridItem icon={Calendar} label="Created" value={formatters.date(tenant?.created_at)} subtitle={formatters.relativeTime(tenant?.created_at)} />
                                </GridContainer>
                                <div className="space-y-2"><div className="flex justify-between items-center"><span className="text-xs font-medium text-gray-500">Plan Usage</span><span className="text-xs font-semibold text-gray-700">{planData.progress}%</span></div><div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className={`h-full rounded-full transition-all duration-500 ${planData.progress === 100 ? 'bg-gradient-to-r from-green-500 to-emerald-500' : planData.progress >= 66 ? 'bg-gradient-to-r from-green-400 to-green-500' : 'bg-gradient-to-r from-gray-300 to-gray-400'}`} style={{ width: `${planData.progress}%` }} /></div></div>
                                <div className="mt-4 space-y-1.5">{planData.features.map((f, i) => <div key={i} className="flex items-center gap-2.5 text-sm text-gray-600"><div className="w-1 h-1 rounded-full bg-green-400 flex-shrink-0" />{f}</div>)}</div>
                                {tenant?.plan === "starter" && <div className="mt-4 p-3.5 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200"><div className="flex items-center gap-2.5 mb-2"><Star size={15} className="text-green-600" /><p className="text-sm font-semibold text-green-800">Upgrade to Pro</p></div><p className="text-xs text-green-700 mb-3">Unlock all features and scale your business.</p><Button size="sm" variant="primary" icon={Crown} onClick={() => router.push("/upgrade")} className="w-full">View Plans</Button></div>}
                            </Card>
                        </div>
                    </GridContainer>

                    {/* Dynamic Sessions Section */}
                    <Card>
                        <SectionTitle icon={Monitor} title="Current Session" subtitle="Your active login session" />
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shadow-sm">
                                        <Monitor size={18} className="text-emerald-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-800">{getBrowserInfo()} on {getOSInfo()}</p>
                                        <p className="text-xs text-gray-500">
                                            Current session • Signed in {formatters.relativeTime(authLastSignIn)}
                                        </p>
                                    </div>
                                </div>
                                <Badge variant="success" icon={CheckCircle} size="sm">Active Now</Badge>
                            </div>

                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shadow-sm">
                                        <ShieldCheck size={18} className="text-gray-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-800">Session Security</p>
                                        <p className="text-xs text-gray-500">
                                            Account created {formatters.relativeTime(authCreatedAt)} •
                                            Protected by Supabase Auth
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
            <style jsx>{`@keyframes slideUp{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}.animate-slide-up{animation:slideUp .3s ease-out}`}</style>
        </>
    );
}