"use client";

import Link from "next/link";
import Image from "next/image";
import logo from "@/assets/logo.png";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
import { usePermissions } from "@/lib/hooks/usePermissions";
import {
    LayoutDashboard,
    Package,
    Users,
    ShoppingCart,
    TrendingUp,
    Truck,
    Users2,
    Puzzle,
    Settings,
    Bell,
    Search,
    ChevronDown,
    Menu,
    X,
    Zap,
    LogOut,
    HelpCircle,
    Crown,
    Clock,
    User,
    Mail,
    Building2,
    Shield,
    Calendar,
    ArrowUpRight,
    BarChart3,
    CheckCircle2,
    AlertTriangle,
    Lock,
    Sparkles,
} from "lucide-react";

// ─── Color System ──────────────────────────────────────────────────
const COLORS = {
    // Primary greens
    green50: '#f0fdf4',
    green100: '#dcfce7',
    green200: '#bbf7d0',
    green300: '#86efac',
    green400: '#4ade80',
    green500: '#22c55e',
    green600: '#16a34a',
    green700: '#15803d',
    green800: '#166534',
    green900: '#14532d',

    // Cream / warm neutrals
    cream50: '#fdfbf7',
    cream100: '#faf7f2',
    cream200: '#f5f0e8',
    cream300: '#ebe3d5',
    cream400: '#d4c9b5',
    cream500: '#b8a88e',
    cream600: '#9a8970',
    cream700: '#7a6b55',
    cream800: '#5c5040',
    cream900: '#3d3429',

    // Accent colors
    gold: '#d4a853',
    goldLight: '#f5e6c8',
    goldDark: '#b8922f',
    amber: '#f59e0b',
    amberLight: '#fef3c7',
    sky: '#0ea5e9',
    skyLight: '#e0f2fe',
    violet: '#8b5cf6',
    violetLight: '#ede9fe',
    rose: '#f43f5e',
    roseLight: '#ffe4e6',

    // Neutrals
    white: '#ffffff',
    black: '#0a0a0a',
    gray50: '#f9fafb',
    gray100: '#f3f4f6',
    gray200: '#e5e7eb',
    gray300: '#d1d5db',
    gray400: '#9ca3af',
    gray500: '#6b7280',
    gray600: '#4b5563',
    gray700: '#374151',
    gray800: '#1f2937',
    gray900: '#111827',
};

export default function DashboardLayout({ children }) {
    const pathname = usePathname();
    const router = useRouter();
    const { canAccess, profile: permProfile, loading: permLoading } = usePermissions();

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [tenant, setTenant] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [trialExpired, setTrialExpired] = useState(false);
    const [accessBlocked, setAccessBlocked] = useState(false);

    const profileRef = useRef(null);
    const notifRef = useRef(null);

    useEffect(() => {
        async function fetchData() {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) { router.push("/login"); return; }
                setUser(user);

                const { data: profileData } = await supabase
                    .from("user_profiles").select("*").eq("id", user.id).single();
                setProfile(profileData);

                if (profileData?.tenant_id) {
                    const { data: tenantData } = await supabase
                        .from("tenants").select("*").eq("id", profileData.tenant_id).single();
                    setTenant(tenantData);

                    if (tenantData?.plan === "starter") {
                        const trialEndDate = new Date(tenantData.created_at);
                        trialEndDate.setDate(trialEndDate.getDate() + 7);
                        if (new Date() > trialEndDate) {
                            setTrialExpired(true);
                            setAccessBlocked(true);
                        }
                    }

                    const { data: recentLeads } = await supabase
                        .from("leads").select("id, customer_name, status, created_at")
                        .eq("tenant_id", profileData.tenant_id).order("created_at", { ascending: false }).limit(5);

                    const { data: recentOrders } = await supabase
                        .from("orders").select("id, amount, status, created_at")
                        .eq("tenant_id", profileData.tenant_id).order("created_at", { ascending: false }).limit(5);

                    const allNotifs = [
                        ...(recentLeads || []).map((l) => ({
                            id: `lead-${l.id}`, type: "lead",
                            text: `New lead: ${l.customer_name}`, subtext: `Status: ${l.status}`,
                            time: new Date(l.created_at).toLocaleString(), unread: true,
                        })),
                        ...(recentOrders || []).map((o) => ({
                            id: `order-${o.id}`, type: "order",
                            text: `New order: $${o.amount}`, subtext: `Status: ${o.status}`,
                            time: new Date(o.created_at).toLocaleString(), unread: true,
                        })),
                    ].sort((a, b) => new Date(b.time) - new Date(a.time));

                    setNotifications(allNotifs);
                    setUnreadCount(allNotifs.filter((n) => n.unread).length);
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [router]);

    useEffect(() => {
        function handleClickOutside(e) {
            if (notifRef.current && !notifRef.current.contains(e.target)) setNotificationsOpen(false);
            if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const getInitials = (name) => {
        if (!name) return "U";
        return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
    };

    const getRoleBadgeStyles = (role) => {
        const styles = {
            owner: { bg: COLORS.violetLight, text: '#6d28d9', border: '#c4b5fd' },
            admin: { bg: COLORS.skyLight, text: '#0369a1', border: '#7dd3fc' },
            confirmation_agent: { bg: COLORS.green100, text: COLORS.green700, border: COLORS.green300 },
            stock_manager: { bg: '#fff7ed', text: '#c2410c', border: '#fdba74' },
            analyst: { bg: '#ecfdf5', text: '#047857', border: '#6ee7b7' },
        };
        return styles[role] || { bg: COLORS.gray100, text: COLORS.gray700, border: COLORS.gray300 };
    };

    const getDaysLeftInTrial = () => {
        if (!tenant?.created_at) return 0;
        const trialEndDate = new Date(tenant.created_at);
        trialEndDate.setDate(trialEndDate.getDate() + 7);
        return Math.max(0, Math.ceil((new Date(trialEndDate) - new Date()) / (1000 * 60 * 60 * 24)));
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push("/login");
    };

    const allNavItems = [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, permission: "dashboard", group: "main" },
        { name: "Orders", href: "/orders", icon: ShoppingCart, permission: "leads", group: "main" },
        { name: "Products", href: "/products", icon: Package, permission: "leads", group: "main" },
        { name: "Confirmation", href: "/confirmation", icon: CheckCircle2, permission: "leads", group: "main" },
        { name: "Tracking", href: "/tracking", icon: Truck, permission: "leads", group: "main" },
        { name: "Finance", href: "/finance", icon: TrendingUp, permission: "finance", group: "analytics" },
        { name: "Simulations", href: "/simulations", icon: BarChart3, permission: "dashboard", group: "analytics" },
        { name: "Team", href: "/team", icon: Users2, permission: "team", group: "manage" },
        { name: "Integrations", href: "/integrations", icon: Puzzle, permission: "integrations", group: "manage" },
    ];

    const navItems = allNavItems.filter((item) => canAccess(item.permission));

    const groups = [
        { key: "main", label: "Operations" },
        { key: "analytics", label: "Analytics" },
        { key: "manage", label: "Manage" },
    ];

    if (accessBlocked && !loading) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4" style={{ background: COLORS.cream100 }}>
                <style>{`
                    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Inter:wght@400;500;600&display=swap');
                    .blocked-wrap { font-family: 'Inter', sans-serif; }
                    .blocked-title { font-family: 'Syne', sans-serif; }
                `}</style>
                <div className="blocked-wrap max-w-2xl w-full rounded-3xl p-px" style={{
                    background: `linear-gradient(135deg, ${COLORS.green400}20, ${COLORS.green600}40, ${COLORS.gold}20)`
                }}>
                    <div className="rounded-3xl p-10 text-center" style={{ background: COLORS.white }}>
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
                            style={{ background: `${COLORS.rose}10`, border: `1px solid ${COLORS.rose}20` }}>
                            <Lock size={28} style={{ color: COLORS.rose }} />
                        </div>
                        <h1 className="blocked-title text-3xl font-bold mb-3" style={{ color: COLORS.cream900 }}>Trial Period Expired</h1>
                        <p className="mb-10 max-w-md mx-auto leading-relaxed" style={{ color: COLORS.cream600 }}>
                            Your 7-day free trial has ended. Upgrade to a paid plan to continue using CodFlow OS.
                        </p>
                        <div className="grid md:grid-cols-2 gap-4 mb-8">
                            <div className="p-6 rounded-2xl" style={{ background: `${COLORS.green50}`, border: `1px solid ${COLORS.green200}` }}>
                                <Crown size={24} style={{ color: COLORS.green600 }} className="mx-auto mb-3" />
                                <h3 className="font-semibold mb-1" style={{ color: COLORS.cream900 }}>Pro Plan</h3>
                                <p className="text-xs mb-4" style={{ color: COLORS.cream500 }}>All features unlocked</p>
                                <Link href="/upgrade?plan=pro"
                                    className="inline-flex items-center gap-2 px-5 py-2.5 text-white rounded-xl text-sm font-semibold transition-all hover:opacity-90"
                                    style={{ background: `linear-gradient(135deg, ${COLORS.green500}, ${COLORS.green600})` }}>
                                    Upgrade to Pro <ArrowUpRight size={14} />
                                </Link>
                            </div>
                            <div className="p-6 rounded-2xl" style={{ background: `${COLORS.violetLight}50`, border: `1px solid ${COLORS.violetLight}` }}>
                                <Shield size={24} style={{ color: COLORS.violet }} className="mx-auto mb-3" />
                                <h3 className="font-semibold mb-1" style={{ color: COLORS.cream900 }}>Enterprise</h3>
                                <p className="text-xs mb-4" style={{ color: COLORS.cream500 }}>Custom & dedicated support</p>
                                <Link href="/upgrade?plan=enterprise"
                                    className="inline-flex items-center gap-2 px-5 py-2.5 text-white rounded-xl text-sm font-semibold transition-all hover:opacity-90"
                                    style={{ background: `linear-gradient(135deg, ${COLORS.violet}, #7c3aed)` }}>
                                    Contact Sales <ArrowUpRight size={14} />
                                </Link>
                            </div>
                        </div>
                        <div className="flex items-center justify-center gap-6 text-sm">
                            <button onClick={handleSignOut} className="transition-colors hover:opacity-80" style={{ color: COLORS.cream500 }}>Sign Out</button>
                            <Link href="/contact" className="transition-colors hover:opacity-80" style={{ color: COLORS.green600 }}>Contact Support</Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen" style={{ fontFamily: "'Inter', sans-serif", background: COLORS.cream100 }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=Inter:wght@400;500;600&display=swap');

                .sidebar-wrapper {
                    background: linear-gradient(180deg, ${COLORS.cream100} 0%, ${COLORS.cream50} 100%);
                    border-right: 1px solid ${COLORS.cream300};
                }

                .nav-item-custom {
                    position: relative;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 9px 12px;
                    border-radius: 10px;
                    font-size: 13.5px;
                    font-weight: 500;
                    color: ${COLORS.cream600};
                    transition: all 0.18s ease;
                    cursor: pointer;
                    border: 1px solid transparent;
                    text-decoration: none;
                }

                .nav-item-custom:hover {
                    background: ${COLORS.cream200};
                    color: ${COLORS.cream800};
                }

                .nav-item-custom.active {
                    background: linear-gradient(135deg, ${COLORS.green50}, ${COLORS.green100}80);
                    border-color: ${COLORS.green200};
                    color: ${COLORS.green700};
                    box-shadow: 0 2px 8px ${COLORS.green200}50;
                }

                .nav-item-custom.active .nav-dot-custom {
                    opacity: 1;
                }

                .nav-item-custom.blocked {
                    color: ${COLORS.cream400};
                    cursor: not-allowed;
                }

                .nav-dot-custom {
                    width: 5px;
                    height: 5px;
                    border-radius: 50%;
                    background: ${COLORS.green500};
                    margin-left: auto;
                    opacity: 0;
                    flex-shrink: 0;
                    box-shadow: 0 0 8px ${COLORS.green400};
                }

                .group-label-custom {
                    font-size: 10px;
                    font-weight: 700;
                    letter-spacing: 0.09em;
                    color: ${COLORS.goldDark};
                    text-transform: uppercase;
                    padding: 0 12px;
                    margin-top: 20px;
                    margin-bottom: 4px;
                }

                .plan-badge {
                    border-radius: 10px;
                    padding: 10px 12px;
                }

                .plan-badge-pro {
                    background: linear-gradient(135deg, ${COLORS.green50}, ${COLORS.skyLight}40);
                    border: 1px solid ${COLORS.green200};
                }

                .plan-badge-enterprise {
                    background: linear-gradient(135deg, ${COLORS.violetLight}50, ${COLORS.violetLight});
                    border: 1px solid ${COLORS.violetLight};
                }

                .trial-bar-custom {
                    background: linear-gradient(135deg, ${COLORS.amberLight}, ${COLORS.goldLight});
                    border: 1px solid ${COLORS.gold}30;
                    border-radius: 12px;
                    padding: 12px;
                }

                .header-custom {
                    background: rgba(255,255,255,0.98);
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    border-bottom: 1px solid ${COLORS.cream300};
                }

                .dropdown-custom {
                    position: absolute;
                    right: 0;
                    top: calc(100% + 8px);
                    background: ${COLORS.white};
                    border: 1px solid ${COLORS.cream300};
                    border-radius: 16px;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04);
                    overflow: hidden;
                    z-index: 100;
                    animation: dropDown 0.18s ease;
                }

                @keyframes dropDown {
                    from { opacity: 0; transform: translateY(-6px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .icon-btn-custom {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 36px;
                    height: 36px;
                    border-radius: 10px;
                    border: 1px solid transparent;
                    background: transparent;
                    color: ${COLORS.cream500};
                    cursor: pointer;
                    transition: all 0.15s;
                    position: relative;
                }

                .icon-btn-custom:hover {
                    background: ${COLORS.cream200};
                    color: ${COLORS.cream800};
                    border-color: ${COLORS.cream300};
                }

                .avatar-btn-custom {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 4px 8px 4px 4px;
                    border-radius: 10px;
                    border: 1px solid transparent;
                    background: transparent;
                    cursor: pointer;
                    transition: all 0.15s;
                }

                .avatar-btn-custom:hover { 
                    background: ${COLORS.cream200};
                    border-color: ${COLORS.cream300};
                }

                .avatar-custom {
                    width: 32px;
                    height: 32px;
                    border-radius: 8px;
                    background: linear-gradient(135deg, ${COLORS.green500}, ${COLORS.green700});
                    color: ${COLORS.white};
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 12px;
                    font-weight: 700;
                    flex-shrink: 0;
                }

                .logo-area-custom {
                    padding: 18px 16px 14px;
                    border-bottom: 1px solid ${COLORS.cream300};
                }

                .main-content-bg {
                    background: linear-gradient(135deg, ${COLORS.cream100}, ${COLORS.cream50});
                    min-height: 100vh;
                }

                .upgrade-btn-custom {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    width: 100%;
                    padding: 8px;
                    border-radius: 8px;
                    color: ${COLORS.white};
                    font-size: 12px;
                    font-weight: 600;
                    text-decoration: none;
                    transition: all 0.15s;
                    margin-top: 8px;
                    border: none;
                    cursor: pointer;
                }

                .signout-btn {
                    background: transparent;
                    border: none;
                    cursor: pointer;
                    padding: 4px;
                    border-radius: 6px;
                    color: ${COLORS.cream400};
                    transition: all 0.15s;
                }

                .signout-btn:hover {
                    color: ${COLORS.rose};
                    background: ${COLORS.roseLight};
                }
            `}</style>

            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 md:hidden"
                    style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* ── SIDEBAR ── */}
            <aside
                className={`sidebar-wrapper fixed md:sticky top-0 left-0 z-50 w-60 h-screen flex flex-col transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
            >
                {/* Logo */}
                <div className="logo-area-custom flex items-center justify-between">
                    <Image
                        src={logo}
                        alt="CodFlow OS"
                        width={140}
                        height={32}
                        className="sidebar-logo-img"
                        style={{ height: 32, width: "auto", objectFit: "contain" }}
                        priority
                    />
                    <button
                        className="md:hidden flex items-center justify-center w-7 h-7 rounded-lg transition-colors"
                        style={{ background: COLORS.cream300, color: COLORS.cream600 }}
                        onClick={() => setSidebarOpen(false)}
                    >
                        <X size={14} />
                    </button>
                </div>

                {/* Nav */}
                <nav className="flex-1 overflow-y-auto px-3 pb-4" style={{ scrollbarWidth: "none" }}>
                    {groups.map((group) => {
                        const items = navItems.filter((i) => i.group === group.key);
                        if (!items.length) return null;
                        return (
                            <div key={group.key}>
                                <p className="group-label-custom">{group.label}</p>
                                <div className="space-y-0.5">
                                    {items.map((item) => {
                                        const Icon = item.icon;
                                        const active = pathname.startsWith(item.href);
                                        return (
                                            <Link
                                                key={item.name}
                                                href={accessBlocked ? "#" : item.href}
                                                onClick={(e) => {
                                                    if (accessBlocked) { e.preventDefault(); return; }
                                                    setSidebarOpen(false);
                                                }}
                                                className={`nav-item-custom ${active ? "active" : ""} ${accessBlocked ? "blocked" : ""}`}
                                            >
                                                <Icon size={16} style={{ flexShrink: 0 }} />
                                                <span>{item.name}</span>
                                                {accessBlocked && <Lock size={11} style={{ marginLeft: "auto", opacity: 0.3 }} />}
                                                {!accessBlocked && <span className="nav-dot-custom" />}
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}

                    {/* Settings always visible */}
                    <div style={{ marginTop: 20 }}>
                        <p className="group-label-custom">Account</p>
                        <div className="space-y-0.5">
                            <Link href="/settings" className={`nav-item-custom ${pathname.startsWith("/settings") ? "active" : ""}`} onClick={() => setSidebarOpen(false)}>
                                <Settings size={16} style={{ flexShrink: 0 }} />
                                <span>Settings</span>
                                <span className="nav-dot-custom" />
                            </Link>
                        </div>
                    </div>
                </nav>

                {/* Sidebar Footer */}
                <div className="px-3 pb-4 space-y-2" style={{ borderTop: `1px solid ${COLORS.cream300}`, paddingTop: 12 }}>
                    {tenant?.plan === "starter" && !trialExpired && (
                        <div className="trial-bar-custom">
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                    <Clock size={12} style={{ color: COLORS.gold }} />
                                    <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.goldDark }}>Free Trial</span>
                                </div>
                                <span style={{ fontSize: 11, color: COLORS.gold }}>{getDaysLeftInTrial()}d left</span>
                            </div>
                            <div style={{ height: 3, background: COLORS.goldLight, borderRadius: 99, overflow: "hidden" }}>
                                <div
                                    style={{
                                        height: "100%",
                                        borderRadius: 99,
                                        background: `linear-gradient(90deg, ${COLORS.gold}, ${COLORS.goldDark})`,
                                        width: `${((7 - getDaysLeftInTrial()) / 7) * 100}%`,
                                        transition: "width 0.5s ease",
                                    }}
                                />
                            </div>
                            <Link href="/upgrade" className="upgrade-btn-custom"
                                style={{ background: `linear-gradient(135deg, ${COLORS.green500}, ${COLORS.green600})` }}>
                                <Sparkles size={11} />
                                Upgrade Now
                            </Link>
                        </div>
                    )}

                    {trialExpired && tenant?.plan === "starter" && (
                        <div style={{ background: `${COLORS.rose}10`, border: `1px solid ${COLORS.rose}20`, borderRadius: 12, padding: "10px 12px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                                <AlertTriangle size={12} style={{ color: COLORS.rose }} />
                                <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.rose }}>Trial Expired</span>
                            </div>
                            <Link href="/upgrade" className="upgrade-btn-custom"
                                style={{ background: `linear-gradient(135deg, ${COLORS.rose}, #dc2626)` }}>
                                <Crown size={11} />
                                Upgrade Now
                            </Link>
                        </div>
                    )}

                    {tenant?.plan === "pro" && (
                        <div className="plan-badge plan-badge-pro">
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <div style={{ width: 28, height: 28, borderRadius: 8, background: COLORS.green100, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <Crown size={14} style={{ color: COLORS.green600 }} />
                                </div>
                                <div>
                                    <p style={{ fontSize: 12, fontWeight: 600, color: COLORS.green700, margin: 0 }}>Pro Plan</p>
                                    <p style={{ fontSize: 11, color: COLORS.green500, margin: 0 }}>All features active</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {tenant?.plan === "enterprise" && (
                        <div className="plan-badge plan-badge-enterprise">
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <div style={{ width: 28, height: 28, borderRadius: 8, background: COLORS.violetLight, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <Shield size={14} style={{ color: COLORS.violet }} />
                                </div>
                                <div>
                                    <p style={{ fontSize: 12, fontWeight: 600, color: '#7c3aed', margin: 0 }}>Enterprise</p>
                                    <p style={{ fontSize: 11, color: COLORS.violet, margin: 0 }}>Dedicated support</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Profile mini-row */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 9,
                            padding: "10px 10px",
                            borderRadius: 10,
                            marginTop: 2,
                            background: COLORS.cream200,
                            border: `1px solid ${COLORS.cream300}`,
                        }}
                    >
                        <div className="avatar-custom" style={{ width: 28, height: 28, borderRadius: 7, fontSize: 11 }}>
                            {profile?.full_name ? getInitials(profile.full_name) : user?.email?.[0]?.toUpperCase() || "U"}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 12, fontWeight: 600, color: COLORS.cream800, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {profile?.full_name || "User"}
                            </p>
                            <p style={{ fontSize: 11, color: COLORS.cream500, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {user?.email}
                            </p>
                        </div>
                        <button className="signout-btn" onClick={handleSignOut} title="Sign out">
                            <LogOut size={13} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* ── MAIN AREA ── */}
            <div className="flex-1 flex flex-col min-w-0 main-content-bg">
                {/* HEADER - Clean without search and menu icons */}
                <header className="header-custom h-14 flex items-center px-4 md:px-6 sticky top-0 z-30">
                    {/* Mobile hamburger */}
                    <button className="icon-btn-custom md:hidden" onClick={() => setSidebarOpen(true)}>
                        <Menu size={18} />
                    </button>

                    {/* Spacer */}
                    <div className="flex-1" />

                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        {/* Notifications */}
                        <div style={{ position: "relative" }} ref={notifRef}>
                            <button
                                className="icon-btn-custom"
                                onClick={() => { setNotificationsOpen(!notificationsOpen); setProfileOpen(false); }}
                            >
                                <Bell size={17} />
                                {unreadCount > 0 && (
                                    <span style={{
                                        position: "absolute", top: 5, right: 5,
                                        minWidth: 16, height: 16, borderRadius: 99,
                                        background: COLORS.rose, color: COLORS.white,
                                        fontSize: 10, fontWeight: 700,
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        border: `2px solid ${COLORS.white}`,
                                        lineHeight: 1,
                                    }}>
                                        {unreadCount}
                                    </span>
                                )}
                            </button>

                            {notificationsOpen && (
                                <div className="dropdown-custom" style={{ width: 320 }}>
                                    <div style={{ padding: "14px 16px 10px", borderBottom: `1px solid ${COLORS.cream200}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                        <span style={{ fontSize: 14, fontWeight: 600, color: COLORS.cream900 }}>Notifications</span>
                                        {unreadCount > 0 && (
                                            <span style={{ fontSize: 11, fontWeight: 600, color: COLORS.green600, background: COLORS.green50, padding: "2px 8px", borderRadius: 99 }}>
                                                {unreadCount} new
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ maxHeight: 300, overflowY: "auto" }}>
                                        {notifications.length > 0 ? notifications.map((notif) => (
                                            <div
                                                key={notif.id}
                                                style={{
                                                    padding: "12px 16px",
                                                    borderBottom: `1px solid ${COLORS.cream100}`,
                                                    background: notif.unread ? COLORS.green50 : "transparent",
                                                    cursor: "pointer",
                                                    transition: "background 0.12s",
                                                    display: "flex",
                                                    gap: 10,
                                                }}
                                                onMouseEnter={(e) => (e.currentTarget.style.background = COLORS.cream100)}
                                                onMouseLeave={(e) => (e.currentTarget.style.background = notif.unread ? COLORS.green50 : "transparent")}
                                            >
                                                <div style={{ width: 6, height: 6, borderRadius: "50%", background: notif.unread ? COLORS.green500 : COLORS.cream400, marginTop: 5, flexShrink: 0 }} />
                                                <div>
                                                    <p style={{ fontSize: 13, fontWeight: 500, color: COLORS.cream900, margin: 0 }}>{notif.text}</p>
                                                    <p style={{ fontSize: 12, color: COLORS.cream500, margin: "2px 0 0" }}>{notif.subtext}</p>
                                                    <p style={{ fontSize: 11, color: COLORS.cream400, margin: "3px 0 0" }}>{notif.time}</p>
                                                </div>
                                            </div>
                                        )) : (
                                            <div style={{ padding: "32px 0", textAlign: "center" }}>
                                                <Bell size={28} style={{ color: COLORS.cream300, margin: "0 auto 8px" }} />
                                                <p style={{ fontSize: 13, color: COLORS.cream400 }}>No notifications yet</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Profile */}
                        <div style={{ position: "relative" }} ref={profileRef}>
                            <button
                                className="avatar-btn-custom"
                                onClick={() => { setProfileOpen(!profileOpen); setNotificationsOpen(false); }}
                            >
                                <div className="avatar-custom">
                                    {profile?.full_name ? getInitials(profile.full_name) : user?.email?.[0]?.toUpperCase() || "U"}
                                </div>
                            </button>

                            {profileOpen && (
                                <div className="dropdown-custom" style={{ width: 240 }}>
                                    <div style={{ padding: "14px 16px 12px", borderBottom: `1px solid ${COLORS.cream200}` }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                            <div className="avatar-custom" style={{ width: 38, height: 38, borderRadius: 10, fontSize: 13 }}>
                                                {profile?.full_name ? getInitials(profile.full_name) : "U"}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <p style={{ fontSize: 13, fontWeight: 600, color: COLORS.cream900, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                    {profile?.full_name || "User"}
                                                </p>
                                                <p style={{ fontSize: 11, color: COLORS.cream500, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                    {user?.email}
                                                </p>
                                            </div>
                                        </div>
                                        {profile?.role && (
                                            <span className="inline-block mt-2 text-xs font-medium px-2 py-0.5 rounded-full border"
                                                style={{
                                                    background: getRoleBadgeStyles(profile.role).bg,
                                                    color: getRoleBadgeStyles(profile.role).text,
                                                    borderColor: getRoleBadgeStyles(profile.role).border,
                                                }}>
                                                {profile.role.replace("_", " ")}
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ padding: "6px" }}>
                                        {[
                                            { href: "/settings", icon: Settings, label: "Settings" },
                                            { href: "/profile", icon: User, label: "Profile" },
                                        ].map(({ href, icon: Icon, label }) => (
                                            <Link
                                                key={href}
                                                href={href}
                                                onClick={() => setProfileOpen(false)}
                                                style={{
                                                    display: "flex", alignItems: "center", gap: 10,
                                                    padding: "9px 10px", borderRadius: 8, fontSize: 13,
                                                    color: COLORS.cream700, textDecoration: "none", transition: "background 0.12s",
                                                }}
                                                onMouseEnter={(e) => (e.currentTarget.style.background = COLORS.cream100)}
                                                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                                            >
                                                <Icon size={15} />
                                                {label}
                                            </Link>
                                        ))}
                                        {tenant?.plan === "starter" && (
                                            <Link
                                                href="/upgrade"
                                                onClick={() => setProfileOpen(false)}
                                                style={{
                                                    display: "flex", alignItems: "center", gap: 10,
                                                    padding: "9px 10px", borderRadius: 8, fontSize: 13,
                                                    color: COLORS.green600, textDecoration: "none", transition: "background 0.12s",
                                                }}
                                                onMouseEnter={(e) => (e.currentTarget.style.background = COLORS.green50)}
                                                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                                            >
                                                <Crown size={15} />
                                                Upgrade Plan
                                                <ArrowUpRight size={12} style={{ marginLeft: "auto" }} />
                                            </Link>
                                        )}
                                    </div>
                                    <div style={{ borderTop: `1px solid ${COLORS.cream200}`, padding: "6px" }}>
                                        <button
                                            onClick={handleSignOut}
                                            style={{
                                                display: "flex", alignItems: "center", gap: 10,
                                                padding: "9px 10px", borderRadius: 8, fontSize: 13,
                                                color: COLORS.rose, background: "transparent", border: "none",
                                                cursor: "pointer", width: "100%", transition: "background 0.12s",
                                            }}
                                            onMouseEnter={(e) => (e.currentTarget.style.background = COLORS.roseLight)}
                                            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                                        >
                                            <LogOut size={15} />
                                            Sign Out
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* MAIN CONTENT */}
                <main className="flex-1 p-6">
                    {accessBlocked ? (
                        <div style={{ maxWidth: 560, margin: "60px auto" }}>
                            <div style={{
                                background: COLORS.white,
                                borderRadius: 20,
                                border: `1px solid ${COLORS.cream300}`,
                                padding: "40px 32px",
                                textAlign: "center",
                                boxShadow: `0 4px 24px ${COLORS.cream300}80`
                            }}>
                                <AlertTriangle size={40} style={{ color: COLORS.amber, margin: "0 auto 16px" }} />
                                <h2 style={{ fontSize: 22, fontWeight: 700, color: COLORS.cream900, margin: "0 0 8px" }}>Access Restricted</h2>
                                <p style={{ color: COLORS.cream500, marginBottom: 24, lineHeight: 1.6 }}>
                                    Your trial has expired. Please upgrade to continue using all features.
                                </p>
                                <Link
                                    href="/upgrade"
                                    style={{
                                        display: "inline-flex", alignItems: "center", gap: 8,
                                        padding: "12px 28px",
                                        background: `linear-gradient(135deg, ${COLORS.green500}, ${COLORS.green600})`,
                                        color: COLORS.white, borderRadius: 12, fontSize: 14, fontWeight: 600,
                                        textDecoration: "none",
                                        boxShadow: `0 4px 14px ${COLORS.green400}60`,
                                    }}
                                >
                                    <Crown size={16} />
                                    Upgrade Now
                                    <ArrowUpRight size={14} />
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div style={{ maxWidth: 1280, margin: "0 auto" }}>{children}</div>
                    )}
                </main>
            </div>
        </div>
    );
}