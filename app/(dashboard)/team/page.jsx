"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import {
    Users, UserPlus, Shield, Trash2, Copy, Check, X,
    RefreshCw, Loader2, Settings, Link, Clock,
    AlertTriangle, CheckCircle, Info, Mail, Activity,
    Target, Award, Star, UserCheck, Eye,
    Zap, Search, Ban, UserMinus, Key, Lock, Unlock, Package
} from "lucide-react";
import ProtectedPage from "@/components/ProtectedPage";

/* ================================================================
   CONSTANTS
================================================================ */
const AVAILABLE_PAGES = [
    { id: "dashboard", label: "Dashboard", icon: Activity, description: "Main dashboard view" },
    { id: "leads", label: "Leads", icon: Target, description: "Manage and view leads" },
    { id: "finance", label: "Finance", icon: Award, description: "Financial reports and P&L" },
    { id: "team", label: "Team", icon: Users, description: "Team management" },
    { id: "integrations", label: "Integrations", icon: Zap, description: "Connect external services" },
    { id: "settings", label: "Settings", icon: Settings, description: "Platform configuration" },
];

const ROLES = [
    { value: "owner", label: "Owner", color: "#f59e0b", bgColor: "#fef3c7", icon: Star },
    { value: "admin", label: "Admin", color: "#3b82f6", bgColor: "#dbeafe", icon: Shield },
    { value: "confirmation_agent", label: "Conf. Agent", color: "#22c55e", bgColor: "#dcfce7", icon: UserCheck },
    { value: "stock_manager", label: "Stock Mgr", color: "#8b5cf6", bgColor: "#ede9fe", icon: Package },
    { value: "analyst", label: "Analyst", color: "#06b6d4", bgColor: "#cffafe", icon: Eye },
    { value: "agent", label: "Agent", color: "#10b981", bgColor: "#d1fae5", icon: UserCheck },
    { value: "viewer", label: "Viewer", color: "#6b7280", bgColor: "#f3f4f6", icon: Eye },
];

const ASSIGNMENT_MODES = [
    { value: "manual", label: "Manual", description: "Assign leads manually", icon: UserCheck },
    { value: "round_robin", label: "Round Robin", description: "Distribute leads evenly", icon: RefreshCw },
    { value: "smart", label: "Smart", description: "Based on agent performance", icon: Zap },
];

/* ================================================================
   TOAST
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

/* ================================================================
   HELPERS
================================================================ */
function calculateStats(members, leads) {
    const stats = {};
    for (const m of members) {
        const assigned = leads.filter(l => l.assigned_to === m.id);
        const delivered = assigned.filter(l => l.status === "delivered");
        stats[m.id] = {
            total: assigned.length,
            delivered: delivered.length,
            rate: assigned.length > 0 ? (delivered.length / assigned.length) * 100 : 0,
        };
    }
    return stats;
}

function getRole(r) { return ROLES.find(x => x.value === r) || ROLES[6]; }
function canManage(role) { return role === "owner" || role === "admin"; }
function validEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }
function statusBadge(s) {
    const b = {
        pending: { c: "#f59e0b", bg: "#fef3c7", icon: Clock, l: "Pending" },
        accepted: { c: "#22c55e", bg: "#dcfce7", icon: CheckCircle, l: "Accepted" },
        expired: { c: "#ef4444", bg: "#fef2f2", icon: AlertTriangle, l: "Expired" },
        revoked: { c: "#6b7280", bg: "#f3f4f6", icon: Ban, l: "Revoked" },
    };
    return b[s] || b.pending;
}

/* ================================================================
   MAIN COMPONENT (renamed from default export)
================================================================ */
function TeamPageContent() {
    const { toasts, add: toast } = useToast();
    const [mounted, setMounted] = useState(false);
    const [me, setMe] = useState(null);
    const [myProfile, setMyProfile] = useState(null);
    const [tid, setTid] = useState(null);
    const [tenant, setTenant] = useState(null);
    const [ready, setReady] = useState(false);

    const [members, setMembers] = useState([]);
    const [leads, setLeads] = useState([]);
    const [invites, setInvites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);

    // UI
    const [showInvite, setShowInvite] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showPermissions, setShowPermissions] = useState(null);
    const [delConfirm, setDelConfirm] = useState(null);
    const [revokeConfirm, setRevokeConfirm] = useState(null);
    const [search, setSearch] = useState("");
    const [inviteFilter, setInviteFilter] = useState("all");

    // Forms
    const [inviteForm, setInviteForm] = useState({ email: "", role: "confirmation_agent" });
    const [inviteLoading, setInviteLoading] = useState(false);
    const [inviteResult, setInviteResult] = useState(null);
    const [copiedToken, setCopiedToken] = useState(null);
    const [settingsForm, setSettingsForm] = useState({ assignment_mode: "manual" });
    const [settingsLoading, setSettingsLoading] = useState(false);

    // Permissions form
    const [permissionsForm, setPermissionsForm] = useState({});
    const [permissionsLoading, setPermissionsLoading] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    /* ── INIT ──────────────────────────────── */
    useEffect(() => {
        (async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user) {
                    setMe(session.user);
                    const { data: p } = await supabase.from("user_profiles").select("*").eq("id", session.user.id).single();
                    if (p) {
                        setMyProfile(p);
                        setTid(p.tenant_id);
                        const { data: t } = await supabase.from("tenants").select("*").eq("id", p.tenant_id).single();
                        if (t) { setTenant(t); setSettingsForm({ assignment_mode: t.assignment_mode || "manual" }); }
                    }
                }
                setReady(true);
            } catch { setReady(true); }
        })();
    }, []);

    /* ── FETCH ─────────────────────────────── */
    const fetchAll = useCallback(async (silent = false) => {
        if (!tid) return;
        try {
            if (!silent) setLoading(true); else setRefreshing(true);
            setError(null);
            const [mRes, lRes, iRes] = await Promise.all([
                supabase.from("user_profiles").select("*").eq("tenant_id", tid).order("created_at", { ascending: true }),
                supabase.from("leads").select("*").eq("tenant_id", tid).order("date", { ascending: false }),
                supabase.from("invites").select("*").eq("tenant_id", tid).order("created_at", { ascending: false }),
            ]);
            if (mRes.error) throw mRes.error;
            if (lRes.error) throw lRes.error;
            if (iRes.error) throw iRes.error;
            setMembers(mRes.data || []);
            setLeads(lRes.data || []);
            setInvites(iRes.data || []);
        } catch (err) {
            toast("Failed to load: " + err.message, "error");
            setError(err.message);
        } finally { setLoading(false); setRefreshing(false); }
    }, [tid, toast]);

    useEffect(() => { if (tid && ready) fetchAll(); }, [fetchAll, tid, ready]);

    /* ── COMPUTED ───────────────────────────── */
    const stats = useMemo(() => calculateStats(members, leads), [members, leads]);
    const filteredMembers = useMemo(() => {
        if (!search) return members;
        const s = search.toLowerCase();
        return members.filter(m => (m.full_name || "").toLowerCase().includes(s) || (m.email || "").toLowerCase().includes(s) || (m.role || "").toLowerCase().includes(s));
    }, [members, search]);
    const filteredInvites = useMemo(() => inviteFilter === "all" ? invites : invites.filter(i => i.status === inviteFilter), [invites, inviteFilter]);
    const myRole = myProfile?.role || "viewer";
    const isOwner = myRole === "owner";
    const isManager = canManage(myRole);

    /* ── FETCH ROLE PERMISSIONS ─────────────── */
    const fetchRolePermissions = async (role) => {
        const { data } = await supabase
            .from("role_permissions")
            .select("*")
            .eq("role_name", role);

        const perms = {};
        if (data) {
            AVAILABLE_PAGES.forEach(page => {
                const existing = data.find(p => p.page_name === page.id);
                perms[page.id] = existing ? existing.can_access : false;
            });
        }
        return perms;
    };

    /* ── OPEN PERMISSIONS MODAL ─────────────── */
    const openPermissions = async (member) => {
        const perms = await fetchRolePermissions(member.role);
        setPermissionsForm(perms);
        setShowPermissions(member);
    };

    /* ── SAVE PERMISSIONS ───────────────────── */
    const savePermissions = async () => {
        if (!showPermissions) return;
        setPermissionsLoading(true);
        try {
            const role = showPermissions.role;

            // Delete existing permissions for this role
            await supabase.from("role_permissions").delete().eq("role_name", role);

            // Insert new permissions
            const inserts = Object.entries(permissionsForm).map(([page, canAccess]) => ({
                role_name: role,
                page_name: page,
                can_access: canAccess,
            }));

            const { error } = await supabase.from("role_permissions").insert(inserts);
            if (error) throw error;

            toast(`Permissions updated for ${role} role!`);
            setShowPermissions(null);
        } catch (err) {
            toast("Failed to save permissions: " + err.message, "error");
        } finally { setPermissionsLoading(false); }
    };

    /* ── CREATE INVITE ──────────────────────── */
    const createInvite = async () => {
        if (!inviteForm.email || !validEmail(inviteForm.email)) return toast("Valid email required", "error");
        if (!tid) return toast("Session error", "error");
        setInviteLoading(true);
        try {
            const email = inviteForm.email.toLowerCase().trim();
            const token = crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16); });
            const { data, error } = await supabase.from("invites").insert({
                email, token, tenant_id: tid, role: inviteForm.role, status: "pending",
                created_by: me?.id, expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            }).select().single();
            if (error) throw error;
            setInviteResult(data);
            toast(`Invite created for ${email}!`);
            setInviteForm({ email: "", role: "confirmation_agent" });
            fetchAll(true);
        } catch (err) { toast(err.message || "Failed", "error"); }
        finally { setInviteLoading(false); }
    };

    const copyLink = (token) => {
        navigator.clipboard.writeText(`${window.location.origin}/accept-invite?token=${token}`).then(() => {
            setCopiedToken(token); toast("Link copied!"); setTimeout(() => setCopiedToken(null), 2000);
        });
    };

    const revokeInvite = async (id) => {
        const { error } = await supabase.from("invites").update({ status: "revoked", revoked_at: new Date().toISOString() }).eq("id", id);
        if (error) return toast(error.message, "error");
        toast("Invite revoked"); setRevokeConfirm(null); fetchAll(true);
    };

    const removeMember = async (id) => {
        await supabase.from("leads").update({ assigned_to: null, assignment_type: null }).eq("assigned_to", id);
        const { error } = await supabase.from("user_profiles").delete().eq("id", id);
        if (error) return toast(error.message, "error");
        toast("Member removed"); setDelConfirm(null); fetchAll(true);
    };

    const saveSettings = async () => {
        if (!tid) return;
        setSettingsLoading(true);
        const { error } = await supabase.from("tenants").update({ assignment_mode: settingsForm.assignment_mode }).eq("id", tid);
        if (error) { toast(error.message, "error"); setSettingsLoading(false); return; }
        toast("Saved!"); setShowSettings(false);
        const { data: t } = await supabase.from("tenants").select("*").eq("id", tid).single();
        if (t) setTenant(t);
        setSettingsLoading(false);
    };

    const fmt = (d) => d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";
    const ago = (d) => {
        if (!d) return "Never";
        const diff = Date.now() - new Date(d).getTime();
        const m = Math.floor(diff / 60000), h = Math.floor(diff / 3600000), days = Math.floor(diff / 86400000);
        if (m < 1) return "Now"; if (m < 60) return `${m}m ago`; if (h < 24) return `${h}h ago`; return `${days}d ago`;
    };
    const expired = (d) => d && new Date(d) < new Date();

    if (!mounted) return null;
    if (!ready) return <div className="min-h-screen bg-[#fafbfc] flex items-center justify-center"><Loader2 size={32} className="text-emerald-500 animate-spin" /></div>;

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#f8faf8] via-white to-[#f0fdf4]">
            <div className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 space-y-6">

                {/* HEADER */}
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-gradient-to-br from-emerald-400 to-green-600 rounded-2xl shadow-lg shadow-green-200"><Users size={22} className="text-white" /></div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Team Management</h1>
                            <p className="text-sm text-gray-500">{members.length} members · {tenant?.name || "Your Team"}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <button onClick={() => fetchAll(true)} disabled={refreshing} className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 shadow-sm"><RefreshCw size={15} className={refreshing ? "animate-spin" : ""} /></button>
                        {isManager && <button onClick={() => setShowSettings(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 shadow-sm"><Settings size={16} /> Settings</button>}
                        {isOwner && <button onClick={() => { setInviteResult(null); setShowInvite(true); }} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white text-sm font-semibold shadow-lg shadow-green-200"><UserPlus size={16} /> Invite</button>}
                    </div>
                </div>

                {/* ERROR */}
                {error && <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3"><AlertTriangle size={18} className="text-rose-500 mt-0.5" /><div className="flex-1"><p className="text-sm font-semibold text-rose-700">Error</p><p className="text-sm text-rose-600">{error}</p></div><button onClick={() => setError(null)} className="text-rose-400"><X size={16} /></button></div>}

                {/* STATS */}
                {!loading && <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {[
                        { l: "Members", v: members.length, c: "#6366f1", bg: "#eef2ff", icon: Users },
                        { l: "Roles", v: [...new Set(members.map(m => m.role))].length, c: "#22c55e", bg: "#f0fdf4", icon: Shield },
                        { l: "Active", v: members.filter(m => m.status === "active").length, c: "#f59e0b", bg: "#fefce8", icon: UserCheck },
                        { l: "Leads", v: leads.length, c: "#8b5cf6", bg: "#f5f3ff", icon: Target },
                        { l: "Pending Invites", v: invites.filter(i => i.status === "pending").length, c: "#ec4899", bg: "#fdf2f8", icon: Mail },
                    ].map((s, i) => (
                        <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-2.5 mb-2"><div className="p-1.5 rounded-lg" style={{ backgroundColor: s.bg }}><s.icon size={14} style={{ color: s.c }} /></div><p className="text-[10px] text-gray-500 font-semibold uppercase">{s.l}</p></div>
                            <p className="text-xl font-bold text-gray-900 ml-9">{s.v}</p>
                        </div>
                    ))}
                </div>}

                {/* SEARCH */}
                {!loading && members.length > 0 && <div className="relative max-w-md"><Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" /><input type="text" placeholder="Search members..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-11 pr-4 py-3 rounded-xl bg-white border border-gray-200 text-sm focus:outline-none focus:border-emerald-400 shadow-sm" /></div>}

                {/* MEMBERS TABLE */}
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-white to-gray-50/50 flex items-center justify-between">
                        <div className="flex items-center gap-3"><div className="p-1.5 bg-emerald-100 rounded-lg"><Users size={16} className="text-emerald-600" /></div><h3 className="font-bold text-gray-900">Team Members</h3><span className="px-2 py-0.5 rounded-full bg-gray-100 text-xs font-semibold text-gray-600">{filteredMembers.length}</span></div>
                    </div>
                    {loading ? <div className="py-20 text-center"><Loader2 size={24} className="text-emerald-500 animate-spin mx-auto mb-3" /><p className="text-sm text-gray-500">Loading...</p></div>
                        : filteredMembers.length === 0 ? <div className="py-20 text-center"><Users size={32} className="text-gray-300 mx-auto mb-3" /><p className="text-sm text-gray-500">{search ? "No matches" : "No members yet"}</p></div>
                            : <div className="overflow-x-auto"><table className="w-full"><thead><tr className="bg-gray-50/50"><th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase">Member</th><th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase">Role</th><th className="px-6 py-3 text-center text-[11px] font-semibold text-gray-500 uppercase">Assigned</th><th className="px-6 py-3 text-center text-[11px] font-semibold text-gray-500 uppercase">Delivered</th><th className="px-6 py-3 text-center text-[11px] font-semibold text-gray-500 uppercase">Rate</th><th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase">Active</th>{isOwner && <th className="px-6 py-3 text-center text-[11px] font-semibold text-gray-500 uppercase">Access</th>}<th className="px-6 py-3 text-center text-[11px] font-semibold text-gray-500 uppercase">Actions</th></tr></thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filteredMembers.map(m => {
                                        const st = stats[m.id] || { total: 0, delivered: 0, rate: 0 };
                                        const ri = getRole(m.role);
                                        const isMe = m.id === me?.id;
                                        return <tr key={m.id} className="hover:bg-gray-50/50 group">
                                            <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center text-white text-sm font-bold shadow-sm">{(m.full_name || m.email || "U")[0].toUpperCase()}</div><div><p className="text-sm font-semibold text-gray-900">{m.full_name || "Unknown"}{isMe && <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full ml-2">You</span>}</p><p className="text-xs text-gray-500">{m.email || "No email"}</p></div></div></td>
                                            <td className="px-6 py-4"><span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold" style={{ backgroundColor: ri.bgColor, color: ri.color }}><ri.icon size={10} />{ri.label}</span></td>
                                            <td className="px-6 py-4 text-center"><span className="text-sm text-gray-900 font-semibold">{st.total}</span></td>
                                            <td className="px-6 py-4 text-center"><span className="text-sm text-emerald-600 font-semibold">{st.delivered}</span></td>
                                            <td className="px-6 py-4 text-center"><div className="flex items-center justify-center gap-2"><div className="w-14 h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${Math.min(st.rate, 100)}%`, backgroundColor: st.rate >= 50 ? "#22c55e" : st.rate >= 25 ? "#f59e0b" : "#ef4444" }} /></div><span className="text-xs text-gray-500 w-8">{st.rate.toFixed(0)}%</span></div></td>
                                            <td className="px-6 py-4"><span className="text-xs text-gray-500">{ago(m.last_active)}</span></td>
                                            {isOwner && <td className="px-6 py-4"><button onClick={() => openPermissions(m)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-semibold transition-all"><Key size={12} /> Permissions</button></td>}
                                            <td className="px-6 py-4"><div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">{isOwner && !isMe && <button onClick={() => setDelConfirm({ id: m.id, name: m.full_name || m.email })} className="p-1.5 rounded-lg hover:bg-rose-50 text-gray-400 hover:text-rose-500"><UserMinus size={13} /></button>}</div></td>
                                        </tr>;
                                    })}
                                </tbody></table></div>}
                </div>

                {/* INVITES TABLE */}
                {invites.length > 0 && <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-white to-gray-50/50 flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-3"><div className="p-1.5 bg-amber-100 rounded-lg"><Mail size={16} className="text-amber-600" /></div><h3 className="font-bold text-gray-900">Invites</h3><span className="px-2 py-0.5 rounded-full bg-gray-100 text-xs font-semibold text-gray-600">{filteredInvites.length}</span></div>
                        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">{["all", "pending", "accepted", "expired", "revoked"].map(s => <button key={s} onClick={() => setInviteFilter(s)} className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-all ${inviteFilter === s ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>{s}</button>)}</div>
                    </div>
                    <div className="overflow-x-auto"><table className="w-full"><thead><tr className="bg-gray-50/50"><th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase">Email</th><th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase">Role</th><th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase">Status</th><th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase">Created</th><th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase">Expires</th><th className="px-6 py-3 text-center text-[11px] font-semibold text-gray-500 uppercase">Actions</th></tr></thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredInvites.map(inv => {
                                const sb = statusBadge(expired(inv.expires_at) && inv.status === "pending" ? "expired" : inv.status);
                                const ex = expired(inv.expires_at) && inv.status === "pending";
                                return <tr key={inv.id} className="hover:bg-gray-50/50">
                                    <td className="px-6 py-4"><div className="flex items-center gap-2.5"><Mail size={14} className="text-gray-400" /><span className="text-sm text-gray-900 font-medium">{inv.email}</span></div></td>
                                    <td className="px-6 py-4"><span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold" style={{ backgroundColor: getRole(inv.role).bgColor, color: getRole(inv.role).color }}>{getRole(inv.role).label}</span></td>
                                    <td className="px-6 py-4"><span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold" style={{ backgroundColor: sb.bg, color: sb.c }}><sb.icon size={10} />{sb.l}</span></td>
                                    <td className="px-6 py-4 text-xs text-gray-500">{fmt(inv.created_at)}</td>
                                    <td className="px-6 py-4 text-xs text-gray-500">{fmt(inv.expires_at)}{ex && <span className="ml-1 text-rose-500">(Expired)</span>}</td>
                                    <td className="px-6 py-4"><div className="flex items-center justify-center gap-2">{inv.status === "pending" && !ex ? <><button onClick={() => copyLink(inv.token)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 text-xs font-semibold">{copiedToken === inv.token ? <><Check size={12} />Copied!</> : <><Copy size={12} />Copy</>}</button>{isOwner && <button onClick={() => setRevokeConfirm(inv)} className="p-1.5 rounded-lg hover:bg-rose-50 text-gray-400 hover:text-rose-500"><Ban size={13} /></button>}</> : <span className="text-xs text-gray-400">{inv.status === "accepted" ? "Joined" : inv.status === "revoked" ? "Revoked" : "Expired"}</span>}</div></td>
                                </tr>;
                            })}
                        </tbody></table></div>
                </div>}

                {/* PERMISSIONS MODAL */}
                {showPermissions && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowPermissions(null)} />
                        <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-scale-in">
                            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-white to-blue-50/30">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 rounded-xl"><Key size={20} className="text-blue-600" /></div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900">Access Permissions</h3>
                                        <p className="text-xs text-gray-500">
                                            Role: <span className="capitalize font-semibold">{showPermissions.role}</span> · {showPermissions.full_name || showPermissions.email}
                                        </p>
                                    </div>
                                </div>
                                <button onClick={() => setShowPermissions(null)} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400"><X size={18} /></button>
                            </div>
                            <div className="px-6 py-5">
                                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4 flex items-start gap-2">
                                    <Info size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />
                                    <p className="text-xs text-blue-700">
                                        These permissions apply to <strong>ALL</strong> users with the <strong className="capitalize">{showPermissions.role}</strong> role.
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    {AVAILABLE_PAGES.map(page => (
                                        <div key={page.id} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100 hover:border-gray-200 transition-all">
                                            <div className="flex items-center gap-3">
                                                <page.icon size={18} className="text-gray-500" />
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-900">{page.label}</p>
                                                    <p className="text-xs text-gray-500">{page.description}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setPermissionsForm(p => ({ ...p, [page.id]: !p[page.id] }))}
                                                className={`relative w-12 h-7 rounded-full transition-all duration-300 ${permissionsForm[page.id] ? "bg-emerald-500" : "bg-gray-300"
                                                    }`}
                                            >
                                                <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300 ${permissionsForm[page.id] ? "left-[22px]" : "left-0.5"
                                                    }`} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex gap-3">
                                <button onClick={() => setShowPermissions(null)} className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 font-medium bg-white">Cancel</button>
                                <button onClick={savePermissions} disabled={permissionsLoading} className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-200">
                                    {permissionsLoading ? <Loader2 size={16} className="animate-spin" /> : <><Check size={16} />Save Permissions</>}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* INVITE MODAL */}
                {showInvite && <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[10vh] p-4"><div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => { setShowInvite(false); setInviteResult(null); }} />
                    <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-scale-in">
                        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-white to-emerald-50/30"><div className="flex items-center gap-3"><div className="p-2 bg-emerald-100 rounded-xl"><UserPlus size={20} className="text-emerald-600" /></div><div><h3 className="text-lg font-bold text-gray-900">{inviteResult ? "Invite Created!" : "Invite Member"}</h3><p className="text-xs text-gray-500">{inviteResult ? "Share the link" : "Generate an invite link"}</p></div></div><button onClick={() => { setShowInvite(false); setInviteResult(null); }} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400"><X size={18} /></button></div>
                        <div className="px-6 py-5">
                            {inviteResult ? <div className="space-y-4">
                                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center"><CheckCircle size={32} className="text-emerald-500 mx-auto mb-2" /><p className="text-sm font-semibold text-emerald-800">Invite for <strong>{inviteResult.email}</strong></p><p className="text-xs text-emerald-600">as <span className="capitalize font-semibold">{inviteResult.role}</span></p></div>
                                <div className="bg-gray-50 rounded-xl p-4"><p className="text-xs text-gray-500 mb-2 font-semibold uppercase">Invite Link</p><div className="flex items-center gap-2"><code className="flex-1 px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-700 font-mono break-all select-all">{`${typeof window !== "undefined" ? window.location.origin : ""}/accept-invite?token=${inviteResult.token}`}</code><button onClick={() => copyLink(inviteResult.token)} className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white text-sm font-semibold shadow-lg shadow-green-200">{copiedToken === inviteResult.token ? <><Check size={14} />Copied!</> : <><Copy size={14} />Copy</>}</button></div></div>
                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2"><Info size={14} className="text-amber-500 mt-0.5" /><p className="text-xs text-amber-700">Only <strong>{inviteResult.email}</strong> can use this link. Expires in 7 days.</p></div>
                                <button onClick={() => { setShowInvite(false); setInviteResult(null); }} className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 font-medium">Close</button>
                            </div> : <div className="space-y-5">
                                <div><label className="block text-xs font-semibold text-gray-600 mb-2 uppercase flex items-center gap-2"><Mail size={14} className="text-emerald-500" />Email *</label><input type="email" placeholder="colleague@company.com" value={inviteForm.email} onChange={e => setInviteForm(p => ({ ...p, email: e.target.value }))} className="w-full px-4 py-3.5 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50" /><p className="text-[10px] text-gray-400 mt-1.5">Only this email can accept</p></div>
                                <div><label className="block text-xs font-semibold text-gray-600 mb-2 uppercase flex items-center gap-2"><Shield size={14} className="text-emerald-500" />Role</label><div className="grid grid-cols-3 gap-2">{ROLES.filter(r => r.value !== "owner").map(r => <button key={r.value} onClick={() => setInviteForm(p => ({ ...p, role: r.value }))} className={`flex flex-col items-center gap-2 px-3 py-3.5 rounded-xl text-xs font-semibold border-2 transition-all ${inviteForm.role === r.value ? "border-emerald-400 bg-emerald-50 text-emerald-700" : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"}`}><r.icon size={20} />{r.label}</button>)}</div></div>
                                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3"><Info size={16} className="text-blue-500 mt-0.5" /><div><p className="text-sm font-semibold text-blue-800">No email sent</p><p className="text-xs text-blue-700 mt-1">Share the generated link with your team member. Only the invited email can join.</p></div></div>
                            </div>}
                        </div>
                        {!inviteResult && <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex gap-3"><button onClick={() => setShowInvite(false)} className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 font-medium bg-white">Cancel</button><button onClick={createInvite} disabled={inviteLoading || !inviteForm.email} className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-green-200">{inviteLoading ? <Loader2 size={16} className="animate-spin" /> : <><Link size={16} />Generate Link</>}</button></div>}
                    </div></div>}

                {/* SETTINGS MODAL */}
                {showSettings && <div className="fixed inset-0 z-[200] flex items-center justify-center p-4"><div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowSettings(false)} />
                    <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-scale-in">
                        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-white to-blue-50/30"><div className="flex items-center gap-3"><div className="p-2 bg-blue-100 rounded-xl"><Settings size={20} className="text-blue-600" /></div><div><h3 className="text-lg font-bold text-gray-900">Assignment Settings</h3><p className="text-xs text-gray-500">Configure lead distribution</p></div></div><button onClick={() => setShowSettings(false)} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400"><X size={18} /></button></div>
                        <div className="px-6 py-5"><label className="block text-xs font-semibold text-gray-600 mb-3 uppercase">Assignment Mode</label><div className="space-y-2">{ASSIGNMENT_MODES.map(m => <button key={m.value} onClick={() => setSettingsForm({ assignment_mode: m.value })} className={`w-full text-left p-4 rounded-xl border-2 transition-all ${settingsForm.assignment_mode === m.value ? "border-blue-400 bg-blue-50" : "border-gray-200 bg-white hover:border-gray-300"}`}><div className="flex items-center justify-between"><div className="flex items-center gap-3"><m.icon size={18} className={settingsForm.assignment_mode === m.value ? "text-blue-600" : "text-gray-400"} /><span className={`text-sm font-semibold ${settingsForm.assignment_mode === m.value ? "text-blue-700" : "text-gray-700"}`}>{m.label}</span></div>{settingsForm.assignment_mode === m.value && <CheckCircle size={16} className="text-blue-500" />}</div><p className="text-xs text-gray-500 mt-1.5 ml-9">{m.description}</p></button>)}</div></div>
                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex gap-3"><button onClick={() => setShowSettings(false)} className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 font-medium bg-white">Cancel</button><button onClick={saveSettings} disabled={settingsLoading} className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-200">{settingsLoading ? <Loader2 size={16} className="animate-spin" /> : <><Check size={16} />Save</>}</button></div>
                    </div></div>}

                {/* DELETE CONFIRM */}
                {delConfirm && <div className="fixed inset-0 z-[250] flex items-center justify-center p-4"><div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setDelConfirm(null)} /><div className="relative bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-scale-in"><div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center mb-4"><AlertTriangle size={22} className="text-rose-500" /></div><h3 className="text-lg font-bold text-gray-900 mb-2">Remove {delConfirm.name}?</h3><p className="text-sm text-gray-500 mb-6">Their leads will be unassigned.</p><div className="flex gap-3"><button onClick={() => setDelConfirm(null)} className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium">Cancel</button><button onClick={() => removeMember(delConfirm.id)} className="flex-1 px-4 py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-semibold">Remove</button></div></div></div>}

                {/* REVOKE CONFIRM */}
                {revokeConfirm && <div className="fixed inset-0 z-[250] flex items-center justify-center p-4"><div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setRevokeConfirm(null)} /><div className="relative bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-scale-in"><div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center mb-4"><Ban size={22} className="text-amber-500" /></div><h3 className="text-lg font-bold text-gray-900 mb-2">Revoke invite for {revokeConfirm.email}?</h3><p className="text-sm text-gray-500 mb-6">The link will no longer work.</p><div className="flex gap-3"><button onClick={() => setRevokeConfirm(null)} className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium">Cancel</button><button onClick={() => revokeInvite(revokeConfirm.id)} className="flex-1 px-4 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold">Revoke</button></div></div></div>}

                {/* TOASTS */}
                {toasts.map(t => <div key={t.id} className={`fixed bottom-6 right-6 z-[999] pointer-events-auto flex items-center gap-3 px-5 py-3.5 rounded-2xl text-sm font-medium shadow-2xl border animate-slide-up ${t.type === "success" ? "bg-white border-emerald-200 text-emerald-700" : "bg-white border-rose-200 text-rose-700"}`}><div className={`p-1.5 rounded-lg ${t.type === "success" ? "bg-emerald-100" : "bg-rose-100"}`}>{t.type === "success" ? <CheckCircle size={14} className="text-emerald-600" /> : <AlertTriangle size={14} className="text-rose-600" />}</div><span>{t.msg}</span></div>)}
            </div>
            <style jsx global>{`@keyframes slideUp{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}.animate-slide-up{animation:slideUp .3s ease-out}@keyframes scaleIn{from{transform:scale(.95);opacity:0}to{transform:scale(1);opacity:1}}.animate-scale-in{animation:scaleIn .2s ease-out}`}</style>
        </div>
    );
}

/* ================================================================
   PROTECTED PAGE WRAPPER
================================================================ */
export default function TeamPage() {
    return (
        <ProtectedPage page="team">
            <TeamPageContent />
        </ProtectedPage>
    );
}