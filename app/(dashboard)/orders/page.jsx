"use client";

import ProtectedPage from "@/components/ProtectedPage";
import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import * as XLSX from "xlsx";
import {
    Search, Download, Upload, Plus, Filter, X, ChevronDown, ChevronUp,
    FileSpreadsheet, Phone, Mail, MapPin, User, Package, Tag, Truck,
    CheckCircle, Clock, AlertCircle, RefreshCw, Trash2, Edit, Eye,
    MoreHorizontal, ArrowUpDown, Calendar, DollarSign, TrendingUp,
    BarChart3, Users, ShoppingCart, ArrowUp, ArrowDown, Zap,
    Copy, ExternalLink, Bell, Settings, ChevronLeft, ChevronRight,
    SlidersHorizontal, Table2, LayoutGrid, Maximize2, Star, Activity,
    AlertTriangle, CheckCheck, Timer, TrendingDown, Loader2,
    Sparkles, Layers, Target, Award, PieChart
} from "lucide-react";

/* ================================================================
   CONSTANTS
================================================================ */
const PAGE_SIZES = [25, 50, 100, 200];

const DEFAULT_STATUSES = [
    { value: "new", label: "New" },
    { value: "pending", label: "Pending" },
    { value: "confirmed", label: "Confirmed" },
    { value: "no_answer", label: "No Answer" },
    { value: "canceled", label: "Canceled" },
    { value: "shipped", label: "Shipped" },
    { value: "delivered", label: "Delivered" },
    { value: "returned", label: "Returned" },
    { value: "refused", label: "Refused" }
];

const DEFAULT_STATUS_META = {
    new: { bg: "bg-sky-50", text: "text-sky-700", border: "border-sky-200", dot: "bg-sky-500", label: "New" },
    pending: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500", label: "Pending" },
    confirmed: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500", label: "Confirmed" },
    no_answer: { bg: "bg-gray-50", text: "text-gray-600", border: "border-gray-200", dot: "bg-gray-400", label: "No Answer" },
    canceled: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200", dot: "bg-rose-500", label: "Canceled" },
    shipped: { bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200", dot: "bg-violet-500", label: "Shipped" },
    delivered: { bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-200", dot: "bg-teal-500", label: "Delivered" },
    returned: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", dot: "bg-orange-500", label: "Returned" },
    refused: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", dot: "bg-red-500", label: "Refused" },
};

function StatusBadge({ status, statusMeta }) {
    const meta = statusMeta?.[status] || DEFAULT_STATUS_META[status] || DEFAULT_STATUS_META.new;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${meta.bg} ${meta.text} ${meta.border}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${meta.dot} animate-pulse`} />
            {meta.label}
        </span>
    );
}

function KpiCard({ label, value, sub, icon: Icon, trend, trendVal, color, bgColor }) {
    const isUp = trend === "up";
    return (
        <div className="relative bg-white border border-gray-100 rounded-2xl p-5 overflow-hidden group hover:border-gray-200 hover:shadow-lg transition-all duration-300">
            <div className="flex items-start justify-between mb-3">
                <div className="p-2.5 rounded-xl" style={{ backgroundColor: bgColor }}><Icon size={18} style={{ color }} /></div>
                {trendVal != null && (
                    <div className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${isUp ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>
                        {isUp ? <ArrowUp size={10} /> : <ArrowDown size={10} />}{trendVal}%
                    </div>
                )}
            </div>
            <div><p className="text-[11px] text-gray-500 font-medium uppercase tracking-widest mb-1">{label}</p><h3 className="text-2xl font-bold text-gray-900 font-mono tracking-tight">{value}</h3>{sub && <p className="text-[11px] text-gray-400 mt-1">{sub}</p>}</div>
        </div>
    );
}

function useToast() {
    const [toasts, setToasts] = useState([]);
    const add = useCallback((msg, type = "success") => { const id = Date.now(); setToasts(p => [...p, { id, msg, type }]); setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500); }, []);
    return { toasts, add };
}

function ToastContainer({ toasts }) {
    return (
        <div className="fixed bottom-6 right-6 z-[999] flex flex-col gap-2 pointer-events-none">
            {toasts.map(t => (
                <div key={t.id} className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium shadow-xl border animate-slide-up ${t.type === "success" ? "bg-white border-emerald-200 text-emerald-700" : t.type === "error" ? "bg-white border-rose-200 text-rose-700" : "bg-white border-gray-200 text-gray-700"}`}>
                    {t.type === "success" ? <CheckCheck size={15} /> : <AlertTriangle size={15} />}{t.msg}
                </div>
            ))}
        </div>
    );
}

function ConfirmDialog({ open, title, desc, onConfirm, onCancel }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onCancel} />
            <div className="relative bg-white border border-gray-200 rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl">
                <div className="flex items-center gap-3 mb-2"><div className="p-2 bg-rose-50 rounded-xl"><AlertTriangle size={18} className="text-rose-500" /></div><h3 className="font-bold text-gray-900">{title}</h3></div>
                <p className="text-sm text-gray-500 mb-6 ml-11">{desc}</p>
                <div className="flex gap-3">
                    <button onClick={onCancel} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
                    <button onClick={onConfirm} className="flex-1 px-4 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold transition-colors">Confirm</button>
                </div>
            </div>
        </div>
    );
}

function Modal({ open, onClose, title, children, maxWidth = "max-w-lg" }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
            <div className={`relative bg-white rounded-2xl shadow-2xl w-full ${maxWidth} max-h-[90vh] flex flex-col`}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100"><h2 className="text-base font-bold text-gray-900">{title}</h2><button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"><X size={16} /></button></div>
                <div className="overflow-y-auto flex-1 px-6 py-5">{children}</div>
            </div>
        </div>
    );
}

function Field({ label, children }) {
    return <div><label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">{label}</label>{children}</div>;
}

const inputCls = "w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-all";
const selectCls = "w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-700 focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-all";

/* ================================================================
   MAIN COMPONENT
================================================================ */
function OrdersContent() {
    const { toasts, add: toast } = useToast();
    const [mounted, setMounted] = useState(false);
    const [sessionReady, setSessionReady] = useState(false);
    const [user, setUser] = useState(null);
    const [tenantId, setTenantId] = useState(null);

    const [leads, setLeads] = useState([]);
    const [agentMap, setAgentMap] = useState({});
    const [referenceData, setReferenceData] = useState({ products: [], agents: [], sources: [], statuses: DEFAULT_STATUSES, statusMeta: DEFAULT_STATUS_META });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [pageSize, setPageSize] = useState(50);
    const [page, setPage] = useState(1);
    const [confirmDialog, setConfirmDialog] = useState(null);

    const [search, setSearch] = useState("");
    const [filters, setFilters] = useState({ source: "", status: "", city: "", agent: "", date_from: "", date_to: "", min_amount: "", max_amount: "" });
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [sortConfig, setSortConfig] = useState({ key: "date", direction: "desc" });

    const [showAddModal, setShowAddModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedLead, setSelectedLead] = useState(null);
    const [importData, setImportData] = useState([]);
    const [importPreview, setImportPreview] = useState(false);
    const [importLoading, setImportLoading] = useState(false);

    const [showColPicker, setShowColPicker] = useState(false);
    const [cols, setCols] = useState({ id: true, source: true, customer: true, phone: true, city: true, product: true, quantity: true, amount: true, status: true, agent: true, tracking: true, date: true });
    const [selectedIds, setSelectedIds] = useState([]);

    const blankLead = { customer: "", phone: "", city: "", source: "", product: "", quantity: 1, amount: "", status: "new", agent: "", tracking: "" };
    const [newLead, setNewLead] = useState(blankLead);
    const [addLoading, setAddLoading] = useState(false);
    const [editForm, setEditForm] = useState({ customer: "", phone: "", city: "", source: "", product: "", quantity: 1, amount: "", status: "", agent: "", tracking: "" });
    const [editLoading, setEditLoading] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    /* ── SESSION INIT ─────────────────────────────── */
    useEffect(() => {
        let isMounted = true;
        async function init() {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user && isMounted) {
                    setUser(session.user);
                    const { data: profile } = await supabase.from("user_profiles").select("tenant_id").eq("id", session.user.id).single();
                    if (profile?.tenant_id) setTenantId(profile.tenant_id);
                }
                if (isMounted) setSessionReady(true);
            } catch { if (isMounted) setSessionReady(true); }
        }
        init();
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED") && session?.user && isMounted) {
                setUser(session.user);
                const { data: profile } = await supabase.from("user_profiles").select("tenant_id").eq("id", session.user.id).single();
                if (profile?.tenant_id) setTenantId(profile.tenant_id);
            }
            if (isMounted) setSessionReady(true);
        });
        return () => { isMounted = false; subscription?.unsubscribe(); };
    }, []);

    /* ── FETCH REFERENCE DATA ─────────────────────── */
    const fetchReferenceData = useCallback(async (leadsData = []) => {
        if (!tenantId) return;
        try {
            let products = [], agents = [];
            try { const r = await supabase.from("products").select("id,name,sku").eq("tenant_id", tenantId).order("name"); products = r.data || []; } catch { }
            try { const r = await supabase.from("user_profiles").select("id,full_name").eq("tenant_id", tenantId).order("full_name"); agents = r.data || []; } catch { }
            const sources = [...new Set(leadsData.map(o => o.source).filter(Boolean))].sort();
            setReferenceData({ products, agents, sources, statuses: DEFAULT_STATUSES, statusMeta: DEFAULT_STATUS_META });
        } catch { }
    }, [tenantId]);

    /* ── FETCH LEADS WITH AGENT NAME RESOLUTION ───── */
    const fetchAll = useCallback(async (silent = false) => {
        if (!tenantId) return;
        try {
            if (!silent) setLoading(true); else setRefreshing(true);

            // Fetch leads AND agents in parallel
            const [leadsRes, agentsRes] = await Promise.all([
                supabase.from("leads").select("*").eq("tenant_id", tenantId).order("date", { ascending: false }),
                supabase.from("user_profiles").select("id, full_name").eq("tenant_id", tenantId)
            ]);

            if (leadsRes.error) throw leadsRes.error;

            // Create agent ID → name lookup map
            const aMap = {};
            if (agentsRes.data) {
                agentsRes.data.forEach(a => { aMap[a.id] = a.full_name; });
            }
            setAgentMap(aMap);

            // Map leads and resolve agent names
            const mapped = (leadsRes.data || []).map(l => ({
                ...l,
                customer: l.customer || "—",
                phone: l.phone || "",
                city: l.city || "",
                source: l.source || "",
                product: l.product || "",
                quantity: l.quantity || 1,
                amount: parseFloat(l.amount) || 0,
                status: l.status || "new",
                // ✅ Resolve assigned_to ID to agent name
                agent: l.agent || aMap[l.assigned_to] || "—",
                tracking: l.tracking || "",
                date: l.date || l.created_at || new Date().toISOString(),
            }));

            setLeads(mapped);
            await fetchReferenceData(mapped);
        } catch (err) { toast("Failed to load: " + err.message, "error"); }
        finally { setLoading(false); setRefreshing(false); }
    }, [tenantId, toast, fetchReferenceData]);

    useEffect(() => { if (sessionReady && tenantId) fetchAll(); }, [fetchAll, sessionReady, tenantId]);

    /* ── FILTER + SORT ────────────────────────────── */
    const filtered = useMemo(() => {
        let r = [...leads];
        if (search) { const s = search.toLowerCase(); r = r.filter(o => (o.customer || "").toLowerCase().includes(s) || (o.phone || "").includes(s) || (o.id || "").toLowerCase().includes(s) || (o.city || "").toLowerCase().includes(s) || (o.tracking || "").toLowerCase().includes(s)); }
        Object.entries(filters).forEach(([k, v]) => { if (!v) return; if (k === "source") r = r.filter(o => o.source === v); if (k === "status") r = r.filter(o => o.status === v); if (k === "city") r = r.filter(o => (o.city || "").toLowerCase().includes(v.toLowerCase())); if (k === "agent") r = r.filter(o => o.agent === v); if (k === "date_from") r = r.filter(o => new Date(o.date) >= new Date(v)); if (k === "date_to") r = r.filter(o => new Date(o.date) <= new Date(v + "T23:59:59")); if (k === "min_amount") r = r.filter(o => o.amount >= parseFloat(v)); if (k === "max_amount") r = r.filter(o => o.amount <= parseFloat(v)); });
        r.sort((a, b) => { const av = a[sortConfig.key] ?? "", bv = b[sortConfig.key] ?? ""; if (["amount", "quantity"].includes(sortConfig.key)) return sortConfig.direction === "asc" ? av - bv : bv - av; if (sortConfig.key === "date") return sortConfig.direction === "asc" ? new Date(av) - new Date(bv) : new Date(bv) - new Date(av); return sortConfig.direction === "asc" ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av)); });
        return r;
    }, [leads, search, filters, sortConfig]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);
    useEffect(() => { setPage(1); }, [search, filters, sortConfig]);

    const kpis = useMemo(() => {
        const t = leads.length, rev = leads.reduce((s, o) => s + o.amount, 0), conf = leads.filter(o => o.status === "confirmed").length, del = leads.filter(o => o.status === "delivered").length;
        return { total: t, revenue: rev, confirmed: conf, delivered: del, avgOrder: t ? rev / t : 0, confirmRate: t ? ((conf / t) * 100).toFixed(1) : "0.0", totalQuantity: leads.reduce((s, o) => s + (o.quantity || 1), 0) };
    }, [leads]);

    const handleSort = (key) => setSortConfig(p => ({ key, direction: p.key === key && p.direction === "asc" ? "desc" : "asc" }));
    const SortIcon = ({ col }) => sortConfig.key !== col ? <ArrowUpDown size={12} className="text-gray-400" /> : sortConfig.direction === "asc" ? <ArrowUp size={12} className="text-green-500" /> : <ArrowDown size={12} className="text-green-500" />;

    /* ── ADD LEAD WITH AUTO-ASSIGN ────────────────── */
    async function handleAddLead() {
        if (!newLead.customer || !newLead.phone) return toast("Customer name and phone are required.", "error");
        if (!tenantId) return toast("Session error - no tenant found", "error");
        setAddLoading(true);
        try {
            const { data: lead, error } = await supabase.from("leads").insert({
                tenant_id: tenantId, customer: newLead.customer, phone: newLead.phone, city: newLead.city || null,
                source: newLead.source || null, product: newLead.product || null, quantity: parseInt(newLead.quantity) || 1,
                amount: parseFloat(newLead.amount) || 0, status: newLead.status || "new", agent: newLead.agent || null,
                tracking: newLead.tracking || null, date: new Date().toISOString()
            }).select().single();
            if (error) throw error;

            // 🔥 AUTO ASSIGN
            if (lead?.tenant_id) {
                try {
                    const res = await fetch("/api/assign-leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tenant_id: lead.tenant_id }) });
                    const result = await res.json();
                    console.log("📦 Assign result:", result);
                    setTimeout(() => fetchAll(true), 500);
                    toast(result.assigned > 0 ? `Lead assigned!` : "Lead added!");
                } catch { toast("Lead added!"); }
            }
            setShowAddModal(false); setNewLead(blankLead);
        } catch (err) { toast("Failed: " + err.message, "error"); }
        finally { setAddLoading(false); }
    }

    /* ── EDIT LEAD ─────────────────────────────────── */
    async function handleEditLead() {
        if (!selectedLead) return;
        setEditLoading(true);
        try {
            await supabase.from("leads").update({
                customer: editForm.customer, phone: editForm.phone, city: editForm.city || null, source: editForm.source || null,
                product: editForm.product || null, quantity: parseInt(editForm.quantity) || 1, amount: parseFloat(editForm.amount) || 0,
                status: editForm.status, agent: editForm.agent || null, tracking: editForm.tracking || null
            }).eq("id", selectedLead.id).eq("tenant_id", tenantId);
            toast("Updated!"); setShowEditModal(false); setSelectedLead(null); fetchAll(true);
        } catch (err) { toast("Failed: " + err.message, "error"); }
        finally { setEditLoading(false); }
    }

    function openEditModal(lead) {
        setSelectedLead(lead);
        setEditForm({ customer: lead.customer || "", phone: lead.phone || "", city: lead.city || "", source: lead.source || "", product: lead.product || "", quantity: lead.quantity || 1, amount: lead.amount || 0, status: lead.status || "new", agent: lead.agent || "", tracking: lead.tracking || "" });
        setShowEditModal(true);
    }

    function promptBulkDelete() {
        setConfirmDialog({
            title: `Delete ${selectedIds.length} lead${selectedIds.length > 1 ? "s" : ""}?`, desc: "Permanent.",
            onConfirm: async () => { await supabase.from("leads").delete().in("id", selectedIds).eq("tenant_id", tenantId); setSelectedIds([]); toast("Deleted."); fetchAll(true); setConfirmDialog(null); }
        });
    }

    async function handleDuplicate(lead) {
        try {
            const { data: nl } = await supabase.from("leads").insert({
                tenant_id: tenantId, customer: (lead.customer || "") + " (copy)", phone: lead.phone || "", city: lead.city || null,
                source: lead.source || null, product: lead.product || null, quantity: lead.quantity || 1, amount: lead.amount || 0,
                status: "new", agent: lead.agent || null, tracking: null, date: new Date().toISOString()
            }).select().single();
            if (nl?.tenant_id) { try { await fetch("/api/assign-leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tenant_id: nl.tenant_id }) }); } catch { } }
            toast("Duplicated!"); fetchAll(true);
        } catch (err) { toast("Failed: " + err.message, "error"); }
    }

    function handleFileUpload(e) {
        const file = e.target.files?.[0]; if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try { const wb = XLSX.read(ev.target.result, { type: "binary" }); const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]); setImportData(data.map(r => ({ customer: r["Customer"] || r.customer || "", phone: String(r.Phone || r.phone || ""), city: r.City || r.city || "", source: r.Source || r.source || "", product: r.Product || r.product || "", quantity: parseInt(r.Quantity || r.quantity) || 1, amount: parseFloat(r.Amount || r.amount || 0), status: r.Status || r.status || "new", tracking: r.Tracking || r.tracking || "" }))); setImportPreview(true); } catch { toast("Invalid file", "error"); }
        };
        reader.readAsBinaryString(file); e.target.value = "";
    }

    async function handleImportConfirm() {
        setImportLoading(true);
        try {
            let imported = 0;
            for (const row of importData) {
                const { error } = await supabase.from("leads").insert({
                    tenant_id: tenantId, customer: row.customer || "Unknown", phone: row.phone || "", city: row.city || null,
                    source: row.source || null, product: row.product || null, quantity: row.quantity || 1, amount: row.amount || 0,
                    status: row.status || "new", tracking: row.tracking || null, date: new Date().toISOString()
                });
                if (!error) imported++;
            }
            if (tenantId && imported > 0) { try { await fetch("/api/assign-leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tenant_id: tenantId }) }); } catch { } }
            toast(`Imported ${imported} of ${importData.length}!`); setShowImportModal(false); setImportData([]); setImportPreview(false); fetchAll(true);
        } catch (err) { toast("Import failed: " + err.message, "error"); }
        finally { setImportLoading(false); }
    }

    function handleExport() {
        const data = filtered.map(o => ({ "Lead ID": o.id, Customer: o.customer || "", Phone: o.phone || "", City: o.city || "", Source: o.source || "", Product: o.product || "", Quantity: o.quantity || 1, Amount: (o.amount || 0).toFixed(2), Status: o.status || "", Agent: o.agent || "", Tracking: o.tracking || "", Date: o.date ? new Date(o.date).toLocaleDateString() : "" }));
        const ws = XLSX.utils.json_to_sheet(data); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Leads"); XLSX.writeFile(wb, `leads_${new Date().toISOString().split("T")[0]}.xlsx`); toast("Exported!");
    }

    function resetFilters() { setSearch(""); setFilters({ source: "", status: "", city: "", agent: "", date_from: "", date_to: "", min_amount: "", max_amount: "" }); setShowAdvanced(false); }

    async function updateStatus(leadId, newStatus) {
        await supabase.from("leads").update({ status: newStatus }).eq("id", leadId).eq("tenant_id", tenantId);
        setLeads(p => p.map(o => o.id === leadId ? { ...o, status: newStatus } : o)); toast("Status updated!");
    }

    const hasFilters = search || Object.values(filters).some(v => v !== "");
    const allSelected = paginated.length > 0 && paginated.every(o => selectedIds.includes(o.id));
    function toggleSelectAll() { allSelected ? setSelectedIds(p => p.filter(id => !paginated.map(o => o.id).includes(id))) : setSelectedIds(p => [...new Set([...p, ...paginated.map(o => o.id)])]); }
    function copyId(id) { navigator.clipboard?.writeText(id).then(() => toast("ID copied!")).catch(() => toast("Failed", "error")); }

    const statusOverview = [
        { label: "New", val: leads.filter(o => o.status === "new").length, color: "#0ea5e9", bg: "#e0f2fe", icon: Sparkles, filterVal: "new" },
        { label: "Confirmed", val: leads.filter(o => o.status === "confirmed").length, color: "#10b981", bg: "#d1fae5", icon: CheckCircle, filterVal: "confirmed" },
        { label: "Pending", val: leads.filter(o => o.status === "pending").length, color: "#f59e0b", bg: "#fef3c7", icon: Timer, filterVal: "pending" },
        { label: "Delivered", val: leads.filter(o => o.status === "delivered").length, color: "#14b8a6", bg: "#ccfbf1", icon: Truck, filterVal: "delivered" },
        { label: "Shipped", val: leads.filter(o => o.status === "shipped").length, color: "#8b5cf6", bg: "#ede9fe", icon: Package, filterVal: "shipped" },
        { label: "Canceled", val: leads.filter(o => o.status === "canceled").length, color: "#ef4444", bg: "#fef2f2", icon: X, filterVal: "canceled" },
    ];

    if (!mounted) return null;
    if (!sessionReady) return <div className="min-h-screen bg-[#faf7f2] flex items-center justify-center"><Loader2 size={32} className="text-green-500 animate-spin" /></div>;

    return (
        <div className="min-h-screen bg-[#faf7f2]">
            <div className="max-w-[1600px] mx-auto p-6 space-y-6">
                {/* HEADER */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3"><div className="p-2.5 bg-green-100 rounded-xl border border-green-200"><Users size={20} className="text-green-600" /></div><div><h1 className="text-2xl font-bold text-gray-900 tracking-tight">Leads</h1><p className="text-sm text-gray-500">{leads.length.toLocaleString()} total leads</p></div></div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <button onClick={() => fetchAll(true)} disabled={refreshing} className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"><RefreshCw size={15} className={refreshing ? "animate-spin" : ""} /></button>
                        <div className="relative"><button onClick={() => setShowColPicker(p => !p)} className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-600 hover:bg-gray-50"><Table2 size={15} /><span className="hidden sm:inline">Columns</span></button>{showColPicker && <div className="absolute right-0 top-full mt-2 z-50 bg-white border border-gray-200 rounded-2xl shadow-xl p-3 min-w-[180px]"><p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-2 px-1">Visible Columns</p>{Object.keys(cols).map(col => <label key={col} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-gray-50 cursor-pointer"><input type="checkbox" checked={cols[col]} onChange={() => setCols(p => ({ ...p, [col]: !p[col] }))} className="accent-green-500" /><span className="text-xs text-gray-700 capitalize">{col.replace(/_/g, " ")}</span></label>)}</div>}</div>
                        <button onClick={() => setShowImportModal(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-600 hover:bg-gray-50"><Upload size={15} /><span className="hidden sm:inline">Import</span></button>
                        <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-600 hover:bg-gray-50"><Download size={15} /><span className="hidden sm:inline">Export</span></button>
                        <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold shadow-lg shadow-green-200"><Plus size={15} />Add Lead</button>
                    </div>
                </div>
                {/* KPI GRID */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <KpiCard label="Total Leads" value={kpis.total.toLocaleString()} icon={Users} color="#6366f1" bgColor="#eef2ff" trendVal={4.2} trend="up" />
                    <KpiCard label="Revenue" value={`$${kpis.revenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`} icon={DollarSign} color="#16a34a" bgColor="#dcfce7" trendVal={8.1} trend="up" />
                    <KpiCard label="Total Quantity" value={kpis.totalQuantity.toLocaleString()} icon={ShoppingCart} color="#f59e0b" bgColor="#fef3c7" trendVal={3.5} trend="up" sub={`Avg $${kpis.avgOrder.toFixed(0)}/lead`} />
                    <KpiCard label="Confirm Rate" value={`${kpis.confirmRate}%`} icon={Target} color="#06b6d4" bgColor="#ecfeff" trendVal={1.2} trend="up" sub={`${kpis.confirmed} confirmed`} />
                </div>
                {/* STATUS OVERVIEW */}
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                    {statusOverview.map(({ label, val, color, bg, icon: Icon, filterVal }) => (
                        <div key={label} className={`bg-white border rounded-xl p-3 flex items-center gap-3 hover:shadow-sm transition-all cursor-pointer ${filters.status === filterVal ? "border-green-300 bg-green-50/30" : "border-gray-100 hover:border-gray-200"}`} onClick={() => setFilters(p => ({ ...p, status: p.status === filterVal ? "" : filterVal }))}>
                            <div className="p-2 rounded-lg" style={{ backgroundColor: bg }}><Icon size={14} style={{ color }} /></div>
                            <div><p className="text-lg font-bold text-gray-900">{val}</p><p className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</p></div>
                        </div>
                    ))}
                </div>
                {/* FILTERS */}
                <div className="bg-white border border-gray-100 rounded-2xl p-4 space-y-3 shadow-sm">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1"><Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" /><input type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-green-400" />{search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><X size={14} /></button>}</div>
                        <select value={filters.status} onChange={e => setFilters(p => ({ ...p, status: e.target.value }))} className="px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm"><option value="">All Statuses</option>{referenceData.statuses.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}</select>
                        <select value={filters.source} onChange={e => setFilters(p => ({ ...p, source: e.target.value }))} className="px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm"><option value="">All Sources</option>{referenceData.sources.map(s => <option key={s} value={s}>{s}</option>)}</select>
                        <div className="flex items-center gap-2"><button onClick={() => setShowAdvanced(!showAdvanced)} className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-sm font-medium ${showAdvanced ? "bg-green-50 border-green-200 text-green-700" : "bg-white border-gray-200 text-gray-600"}`}><SlidersHorizontal size={14} />Filters{hasFilters && <span className="w-1.5 h-1.5 rounded-full bg-green-500" />}</button>{hasFilters && <button onClick={resetFilters} className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-rose-200 text-rose-600 text-sm"><X size={14} />Clear</button>}</div>
                    </div>
                    {showAdvanced && <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 pt-3 border-t border-gray-100">
                        <select value={filters.agent} onChange={e => setFilters(p => ({ ...p, agent: e.target.value }))} className="px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm"><option value="">All Agents</option>{referenceData.agents.map(a => <option key={a.id} value={a.full_name}>{a.full_name}</option>)}</select>
                        <input type="text" placeholder="City..." value={filters.city} onChange={e => setFilters(p => ({ ...p, city: e.target.value }))} className="px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm" />
                        <input type="date" value={filters.date_from} onChange={e => setFilters(p => ({ ...p, date_from: e.target.value }))} className="px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm" />
                        <input type="date" value={filters.date_to} onChange={e => setFilters(p => ({ ...p, date_to: e.target.value }))} className="px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm" />
                        <input type="number" placeholder="Min amount" value={filters.min_amount} onChange={e => setFilters(p => ({ ...p, min_amount: e.target.value }))} className="px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm" />
                        <input type="number" placeholder="Max amount" value={filters.max_amount} onChange={e => setFilters(p => ({ ...p, max_amount: e.target.value }))} className="px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm" />
                    </div>}
                </div>
                {/* BULK ACTIONS */}
                {selectedIds.length > 0 && <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 rounded-xl p-3"><span className="text-sm font-medium text-rose-700">{selectedIds.length} selected</span><div className="flex items-center gap-2 ml-auto"><button onClick={promptBulkDelete} className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-sm"><Trash2 size={13} />Delete</button><button onClick={() => setSelectedIds([])} className="px-3.5 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm">Clear</button></div></div>}
                {/* TABLE */}
                <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100"><span className="text-sm text-gray-500">{filtered.length.toLocaleString()} results</span><select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }} className="px-2.5 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-xs">{PAGE_SIZES.map(s => <option key={s} value={s}>{s}/page</option>)}</select></div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50/50">
                                <tr>
                                    <th className="px-4 py-3 w-10"><div className={`w-4 h-4 rounded border flex items-center justify-center cursor-pointer ${allSelected ? "bg-green-500 border-green-500" : "border-gray-300 hover:border-green-400"}`} onClick={toggleSelectAll}>{allSelected && <svg width="8" height="8" viewBox="0 0 10 10"><polyline points="1,5 4,8 9,2" stroke="white" strokeWidth="2" fill="none" /></svg>}</div></th>
                                    {cols.id && <th onClick={() => handleSort("id")} className="px-3 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase cursor-pointer"><div className="flex items-center gap-1.5">ID<SortIcon col="id" /></div></th>}
                                    {cols.customer && <th onClick={() => handleSort("customer")} className="px-3 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase cursor-pointer"><div className="flex items-center gap-1.5">Customer<SortIcon col="customer" /></div></th>}
                                    {cols.source && <th className="px-3 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase">Source</th>}
                                    {cols.phone && <th className="px-3 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase">Phone</th>}
                                    {cols.city && <th className="px-3 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase">City</th>}
                                    {cols.product && <th className="px-3 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase">Product</th>}
                                    {cols.quantity && <th onClick={() => handleSort("quantity")} className="px-3 py-3 text-center text-[11px] font-semibold text-gray-500 uppercase cursor-pointer"><div className="flex items-center justify-center gap-1.5">Qty<SortIcon col="quantity" /></div></th>}
                                    {cols.amount && <th onClick={() => handleSort("amount")} className="px-3 py-3 text-right text-[11px] font-semibold text-gray-500 uppercase cursor-pointer"><div className="flex items-center justify-end gap-1.5">Amount<SortIcon col="amount" /></div></th>}
                                    {cols.status && <th className="px-3 py-3 text-center text-[11px] font-semibold text-gray-500 uppercase">Status</th>}
                                    {cols.agent && <th className="px-3 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase">Agent</th>}
                                    {cols.tracking && <th className="px-3 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase">Tracking</th>}
                                    {cols.date && <th onClick={() => handleSort("date")} className="px-3 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase cursor-pointer"><div className="flex items-center gap-1.5">Date<SortIcon col="date" /></div></th>}
                                    <th className="px-3 py-3 text-center text-[11px] font-semibold text-gray-500 uppercase w-24">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? <tr><td colSpan={20} className="py-20 text-center"><Loader2 size={24} className="text-green-500 animate-spin mx-auto mb-2" /><p className="text-sm text-gray-500">Loading...</p></td></tr>
                                    : paginated.length === 0 ? <tr><td colSpan={20} className="py-20 text-center"><Users size={28} className="text-gray-300 mx-auto mb-2" /><p className="text-sm text-gray-500">{hasFilters ? "No matches" : "No leads yet"}</p></td></tr>
                                        : paginated.map(lead => (
                                            <tr key={lead.id} className={`border-t border-gray-50 group transition-colors hover:bg-gray-50/50 ${selectedIds.includes(lead.id) ? "bg-green-50/50" : ""}`}>
                                                <td className="px-4 py-3"><div className={`w-4 h-4 rounded border flex items-center justify-center cursor-pointer ${selectedIds.includes(lead.id) ? "bg-green-500 border-green-500" : "border-gray-300 hover:border-green-400"}`} onClick={() => setSelectedIds(p => p.includes(lead.id) ? p.filter(id => id !== lead.id) : [...p, lead.id])}>{selectedIds.includes(lead.id) && <svg width="8" height="8" viewBox="0 0 10 10"><polyline points="1,5 4,8 9,2" stroke="white" strokeWidth="2" fill="none" /></svg>}</div></td>
                                                {cols.id && <td className="px-3 py-3"><button onClick={() => copyId(lead.id)} className="text-xs text-gray-500 hover:text-green-600 font-mono">#{lead.id?.slice(0, 8)}</button></td>}
                                                {cols.customer && <td className="px-3 py-3"><div className="flex items-center gap-2"><div className="w-7 h-7 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white text-xs font-bold">{(lead.customer || "?")[0].toUpperCase()}</div><span className="font-medium text-gray-900 whitespace-nowrap">{lead.customer || "—"}</span></div></td>}
                                                {cols.source && <td className="px-3 py-3 text-xs text-gray-600">{lead.source || "—"}</td>}
                                                {cols.phone && <td className="px-3 py-3 text-xs text-gray-600 font-mono">{lead.phone || "—"}</td>}
                                                {cols.city && <td className="px-3 py-3 text-xs text-gray-600">{lead.city || "—"}</td>}
                                                {cols.product && <td className="px-3 py-3 text-xs text-gray-600 max-w-[120px] truncate">{lead.product || "—"}</td>}
                                                {cols.quantity && <td className="px-3 py-3 text-center text-xs text-gray-600">{lead.quantity || 1}</td>}
                                                {cols.amount && <td className="px-3 py-3 text-right"><span className="font-semibold text-gray-900">${(lead.amount || 0).toFixed(2)}</span></td>}
                                                {cols.status && <td className="px-3 py-3 text-center"><div className="relative group/status inline-block"><StatusBadge status={lead.status} statusMeta={referenceData.statusMeta} /><div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 z-50 hidden group-hover/status:block bg-white border border-gray-200 rounded-xl p-1.5 shadow-xl min-w-[130px]">{referenceData.statuses.map(s => <button key={s.value} onClick={() => updateStatus(lead.id, s.value)} className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-gray-600 hover:bg-gray-50 flex items-center gap-2"><span className={`w-1.5 h-1.5 rounded-full ${referenceData.statusMeta[s.value]?.dot || "bg-gray-400"}`} />{s.label}</button>)}</div></div></td>}
                                                {cols.agent && <td className="px-3 py-3 text-xs text-gray-600">{lead.agent || "—"}</td>}
                                                {cols.tracking && <td className="px-3 py-3 text-xs text-gray-500 font-mono">{lead.tracking || "—"}</td>}
                                                {cols.date && <td className="px-3 py-3 text-xs text-gray-500 whitespace-nowrap">{lead.date ? new Date(lead.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" }) : "—"}</td>}
                                                <td className="px-3 py-3"><div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => openEditModal(lead)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"><Edit size={13} /></button><button onClick={() => handleDuplicate(lead)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"><Copy size={13} /></button><button onClick={() => { setSelectedIds([lead.id]); promptBulkDelete(); }} className="p-1.5 rounded-lg hover:bg-rose-50 text-gray-400 hover:text-rose-500"><Trash2 size={13} /></button></div></td>
                                            </tr>
                                        ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                        <span className="text-xs text-gray-500">{filtered.length === 0 ? "0" : `${((page - 1) * pageSize) + 1}–${Math.min(page * pageSize, filtered.length)}`} of {filtered.length.toLocaleString()}</span>
                        <div className="flex items-center gap-1.5">
                            <button onClick={() => setPage(1)} disabled={page === 1} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 disabled:opacity-30"><ChevronLeft size={14} /></button>
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 disabled:opacity-30"><ChevronLeft size={14} /></button>
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => { let pg = totalPages <= 5 ? i + 1 : page <= 3 ? i + 1 : page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i; return <button key={pg} onClick={() => setPage(pg)} className={`w-7 h-7 rounded-lg text-xs font-medium ${page === pg ? "bg-green-100 text-green-700" : "text-gray-500 hover:bg-gray-100"}`}>{pg}</button>; })}
                            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 disabled:opacity-30"><ChevronRight size={14} /></button>
                            <button onClick={() => setPage(totalPages)} disabled={page === totalPages} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 disabled:opacity-30"><ChevronRight size={14} /></button>
                        </div>
                    </div>
                </div>
            </div>
            {/* ADD MODAL */}
            <Modal open={showAddModal} onClose={() => { setShowAddModal(false); setNewLead(blankLead); }} title="Add New Lead">
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Field label="Customer *"><input className={inputCls} placeholder="Full name" value={newLead.customer} onChange={e => setNewLead(p => ({ ...p, customer: e.target.value }))} /></Field>
                        <Field label="Phone *"><input className={inputCls} placeholder="+212 600 000 000" value={newLead.phone} onChange={e => setNewLead(p => ({ ...p, phone: e.target.value }))} /></Field>
                        <Field label="City"><input className={inputCls} placeholder="City" value={newLead.city} onChange={e => setNewLead(p => ({ ...p, city: e.target.value }))} /></Field>
                        <Field label="Source"><input className={inputCls} placeholder="Facebook, Instagram..." value={newLead.source} onChange={e => setNewLead(p => ({ ...p, source: e.target.value }))} /></Field>
                        <Field label="Product"><select className={selectCls} value={newLead.product} onChange={e => setNewLead(p => ({ ...p, product: e.target.value }))}><option value="">Select product</option>{referenceData.products.map(pr => <option key={pr.id} value={pr.name}>{pr.name}</option>)}<option value="__custom__">Other</option></select>{newLead.product === "__custom__" && <input className={`${inputCls} mt-2`} placeholder="Product name" onChange={e => setNewLead(p => ({ ...p, product: e.target.value }))} />}</Field>
                        <Field label="Quantity"><input type="number" className={inputCls} placeholder="1" min="1" value={newLead.quantity} onChange={e => setNewLead(p => ({ ...p, quantity: parseInt(e.target.value) || 1 }))} /></Field>
                        <Field label="Amount"><input type="number" className={inputCls} placeholder="0.00" value={newLead.amount} onChange={e => setNewLead(p => ({ ...p, amount: e.target.value }))} /></Field>
                        <Field label="Status"><select className={selectCls} value={newLead.status} onChange={e => setNewLead(p => ({ ...p, status: e.target.value }))}>{referenceData.statuses.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}</select></Field>
                        <Field label="Agent"><input className={inputCls} placeholder="Agent name" value={newLead.agent} onChange={e => setNewLead(p => ({ ...p, agent: e.target.value }))} /></Field>
                        <Field label="Tracking"><input className={inputCls} placeholder="Tracking number" value={newLead.tracking} onChange={e => setNewLead(p => ({ ...p, tracking: e.target.value }))} /></Field>
                    </div>
                    <div className="flex gap-3 pt-2"><button onClick={() => { setShowAddModal(false); setNewLead(blankLead); }} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">Cancel</button><button onClick={handleAddLead} disabled={addLoading || !newLead.customer || !newLead.phone} className="flex-1 px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2">{addLoading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}Add Lead</button></div>
                </div>
            </Modal>
            {/* EDIT MODAL */}
            <Modal open={showEditModal} onClose={() => { setShowEditModal(false); setSelectedLead(null); }} title="Edit Lead" maxWidth="max-w-2xl">
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Field label="Customer Name"><input className={inputCls} value={editForm.customer} onChange={e => setEditForm(p => ({ ...p, customer: e.target.value }))} /></Field>
                        <Field label="Phone"><input className={inputCls} value={editForm.phone} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))} /></Field>
                        <Field label="City"><input className={inputCls} value={editForm.city} onChange={e => setEditForm(p => ({ ...p, city: e.target.value }))} /></Field>
                        <Field label="Source"><input className={inputCls} value={editForm.source} onChange={e => setEditForm(p => ({ ...p, source: e.target.value }))} /></Field>
                        <Field label="Product"><input className={inputCls} value={editForm.product} onChange={e => setEditForm(p => ({ ...p, product: e.target.value }))} /></Field>
                        <Field label="Quantity"><input type="number" className={inputCls} min="1" value={editForm.quantity} onChange={e => setEditForm(p => ({ ...p, quantity: parseInt(e.target.value) || 1 }))} /></Field>
                        <Field label="Amount"><input type="number" className={inputCls} value={editForm.amount} onChange={e => setEditForm(p => ({ ...p, amount: e.target.value }))} /></Field>
                        <Field label="Status"><select className={selectCls} value={editForm.status} onChange={e => setEditForm(p => ({ ...p, status: e.target.value }))}>{referenceData.statuses.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}</select></Field>
                        <Field label="Agent"><input className={inputCls} placeholder="Agent name" value={editForm.agent} onChange={e => setEditForm(p => ({ ...p, agent: e.target.value }))} /></Field>
                        <Field label="Tracking"><input className={inputCls} placeholder="Tracking #" value={editForm.tracking} onChange={e => setEditForm(p => ({ ...p, tracking: e.target.value }))} /></Field>
                    </div>
                    <div className="flex gap-3 pt-2"><button onClick={() => { setShowEditModal(false); setSelectedLead(null); }} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">Cancel</button><button onClick={handleEditLead} disabled={editLoading} className="flex-1 px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2">{editLoading ? <Loader2 size={14} className="animate-spin" /> : <CheckCheck size={14} />}Save Changes</button></div>
                </div>
            </Modal>
            {/* IMPORT MODAL */}
            <Modal open={showImportModal} onClose={() => { setShowImportModal(false); setImportData([]); setImportPreview(false); }} title="Import Leads" maxWidth="max-w-2xl">
                {!importPreview ? (
                    <div className="space-y-4"><div className="border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center hover:border-green-300 transition-colors"><FileSpreadsheet size={32} className="text-gray-300 mx-auto mb-3" /><p className="text-sm font-medium text-gray-700 mb-1">Upload Excel file</p><p className="text-xs text-gray-400 mb-4">Supported: .xlsx, .xls</p><label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold cursor-pointer"><Upload size={14} />Browse File<input type="file" accept=".xlsx,.xls" onChange={handleFileUpload} className="hidden" /></label></div><div className="bg-blue-50 border border-blue-100 rounded-xl p-4"><p className="text-xs font-semibold text-blue-700 mb-2">Expected columns:</p><div className="grid grid-cols-2 gap-1">{["Customer", "Phone", "City", "Source", "Product", "Quantity", "Amount", "Status", "Tracking"].map(col => <span key={col} className="text-xs text-blue-600 font-mono bg-blue-100 px-2 py-0.5 rounded">{col}</span>)}</div></div></div>
                ) : (
                    <div className="space-y-4"><div className="flex items-center justify-between"><p className="text-sm font-medium text-gray-700">{importData.length} rows ready</p><button onClick={() => setImportPreview(false)} className="text-xs text-gray-400">← Back</button></div><div className="max-h-64 overflow-y-auto border border-gray-100 rounded-xl"><table className="w-full text-xs"><thead className="bg-gray-50 sticky top-0"><tr>{["Name", "Phone", "City", "Source", "Product", "Qty", "Amount", "Status"].map(h => <th key={h} className="px-3 py-2 text-left text-gray-500 font-semibold">{h}</th>)}</tr></thead><tbody>{importData.slice(0, 20).map((row, i) => <tr key={i} className="border-t border-gray-50"><td className="px-3 py-2 text-gray-700">{row.customer || "—"}</td><td className="px-3 py-2 text-gray-600 font-mono">{row.phone || "—"}</td><td className="px-3 py-2 text-gray-600">{row.city || "—"}</td><td className="px-3 py-2 text-gray-600">{row.source || "—"}</td><td className="px-3 py-2 text-gray-600">{row.product || "—"}</td><td className="px-3 py-2 text-gray-600 text-center">{row.quantity || 1}</td><td className="px-3 py-2 text-gray-700 font-semibold">${row.amount || 0}</td><td className="px-3 py-2"><StatusBadge status={row.status || "new"} statusMeta={referenceData.statusMeta} /></td></tr>)}</tbody></table>{importData.length > 20 && <p className="text-center text-xs text-gray-400 py-2">Showing first 20 of {importData.length} rows</p>}</div><div className="flex gap-3"><button onClick={() => { setShowImportModal(false); setImportData([]); setImportPreview(false); }} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">Cancel</button><button onClick={handleImportConfirm} disabled={importLoading} className="flex-1 px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50">{importLoading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}Import {importData.length} Leads</button></div></div>
                )}
            </Modal>
            <ConfirmDialog open={!!confirmDialog} title={confirmDialog?.title || ""} desc={confirmDialog?.desc || ""} onConfirm={confirmDialog?.onConfirm || (() => { })} onCancel={() => setConfirmDialog(null)} />
            <ToastContainer toasts={toasts} />
        </div>
    );
}

export default function OrdersPage() {
    return <ProtectedPage page="leads"><OrdersContent /></ProtectedPage>;
}