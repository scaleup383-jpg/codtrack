"use client";

import Link from "next/link";
import Image from "next/image";
import logo from "@/assets/logo.png";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
import { usePermissions } from "@/lib/hooks/usePermissions";
import {
    LayoutDashboard, Package, Users, ShoppingCart, TrendingUp,
    Truck, Users2, Puzzle, Settings, Bell, Menu, X, Zap, LogOut,
    Crown, Clock, User, Shield, ArrowUpRight, BarChart3,
    CheckCircle2, AlertTriangle, Lock, Sparkles, CreditCard,
    Loader2
} from "lucide-react";

const COLORS = {
    green50: '#f0fdf4', green100: '#dcfce7', green200: '#bbf7d0',
    green500: '#22c55e', green600: '#16a34a', green700: '#15803d',
    white: '#ffffff', gray50: '#f9fafb', gray100: '#f3f4f6',
    gray400: '#9ca3af', gray500: '#6b7280', gray600: '#4b5563',
    gray900: '#111827',
    rose: '#f43f5e', roseLight: '#ffe4e6',
    slate: '#64748b', slateLight: '#f1f5f9',
    sky: '#0ea5e9', skyLight: '#e0f2fe',
    violet: '#8b5cf6', violetLight: '#ede9fe',
    amber: '#f59e0b',
};

export default function AdminDashboardLayout({ children }) {
    const pathname = usePathname();
    const router = useRouter();
    const { canAccess } = usePermissions();

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);
    const [accessDenied, setAccessDenied] = useState(false);

    useEffect(() => {
        async function checkSuperAdmin() {
            try {
                // Get current user
                const { data: { user: authUser } } = await supabase.auth.getUser();

                if (!authUser) {
                    router.push("/login");
                    return;
                }

                setUser(authUser);

                // ✅ ONLY check super_admins table - NO FALLBACK
                const { data: superAdmin, error: superAdminError } = await supabase
                    .from("super_admins")
                    .select("id, email")
                    .eq("email", authUser.email)
                    .single();

                if (superAdminError || !superAdmin) {
                    // ❌ NOT a super admin - DENY ACCESS
                    console.warn("⛔ Non-super-admin tried to access admin panel:", authUser.email);
                    setAccessDenied(true);
                    setLoading(false);
                    return;
                }

                // ✅ Super admin verified
                console.log("✅ Super admin access granted:", authUser.email);
                setIsSuperAdmin(true);

            } catch (err) {
                console.error("Admin check error:", err);
                setAccessDenied(true);
            } finally {
                setLoading(false);
            }
        }

        checkSuperAdmin();
    }, [router]);

    const getInitials = (name) => {
        if (!name) return "A";
        return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push("/login");
    };

    const adminNavItems = [
        { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
        { name: "Subscriptions", href: "/admin/subscriptions", icon: CreditCard },
    ];

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="text-center">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-4 animate-pulse">
                        <Loader2 size={24} className="text-emerald-600 animate-spin" />
                    </div>
                    <p className="text-sm text-gray-500">Verifying credentials...</p>
                </div>
            </div>
        );
    }

    // ⛔ ACCESS DENIED - Not a super admin
    if (accessDenied || !isSuperAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-white">
                <div className="max-w-md w-full bg-white border-2 border-red-200 rounded-3xl p-10 text-center shadow-2xl">
                    <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Lock size={28} className="text-red-500" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
                    <p className="text-sm text-gray-500 mb-6">
                        You don't have permission to access the admin panel.
                        Only platform super administrators can access this area.
                    </p>
                    <div className="space-y-3">
                        <button
                            onClick={() => router.push("/dashboard")}
                            className="w-full bg-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
                        >
                            Go to Dashboard
                        </button>
                        <button
                            onClick={handleSignOut}
                            className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-all"
                        >
                            Sign Out
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ✅ Super admin - render admin layout
    return (
        <div className="flex min-h-screen bg-gray-50">
            <style>{`
                * { font-family: 'Inter', sans-serif; }
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
                
                .sidebar-wrapper {
                    background: #ffffff;
                    border-right: 1px solid #e5e7eb;
                }
                .nav-item-custom {
                    display: flex; align-items: center; gap: 10px;
                    padding: 9px 12px; border-radius: 10px;
                    font-size: 13.5px; font-weight: 500;
                    color: #6b7280; transition: all 0.15s ease;
                    text-decoration: none;
                }
                .nav-item-custom:hover { background: #f3f4f6; color: #111827; }
                .nav-item-custom.active {
                    background: #1e293b; color: #e2e8f0;
                }
                .nav-dot-custom {
                    width: 5px; height: 5px; border-radius: 50%;
                    background: #22c55e; margin-left: auto; opacity: 0;
                }
                .nav-item-custom.active .nav-dot-custom { opacity: 1; }
                .group-label-custom {
                    font-size: 10px; font-weight: 700; letter-spacing: 0.12em;
                    color: #64748b; text-transform: uppercase;
                    padding: 0 12px; margin-top: 20px; margin-bottom: 4px;
                }
                .header-custom {
                    background: #ffffff; border-bottom: 1px solid #e5e7eb;
                }
                .logo-area-custom {
                    padding: 18px 16px 14px; border-bottom: 1px solid #e5e7eb;
                }
            `}</style>

            {/* Mobile overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
            )}

            {/* ── ADMIN SIDEBAR ── */}
            <aside className={`sidebar-wrapper fixed lg:sticky top-0 left-0 z-50 w-60 h-screen flex flex-col transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
                <div className="logo-area-custom flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
                            <Shield size={16} className="text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-900">Admin Panel</p>
                            <p className="text-[10px] text-gray-500">Super Admin</p>
                        </div>
                    </div>
                    <button className="lg:hidden p-1 rounded-lg hover:bg-gray-100" onClick={() => setSidebarOpen(false)}>
                        <X size={14} className="text-gray-500" />
                    </button>
                </div>

                <nav className="flex-1 overflow-y-auto px-3 pb-4">
                    <p className="group-label-custom">Admin Panel</p>
                    <div className="space-y-0.5">
                        {adminNavItems.map((item) => {
                            const Icon = item.icon;
                            const active = pathname === item.href || pathname?.startsWith(item.href + '/');
                            return (
                                <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
                                    className={`nav-item-custom ${active ? "active" : ""}`}>
                                    <Icon size={16} />
                                    <span>{item.name}</span>
                                    <span className="nav-dot-custom" />
                                </Link>
                            );
                        })}
                    </div>
                </nav>

                <div className="px-3 pb-4 border-t border-gray-200 pt-3">
                    <div className="flex items-center gap-2 p-2 rounded-xl bg-gray-50">
                        <div className="w-7 h-7 rounded-lg bg-gray-900 flex items-center justify-center text-white text-[10px] font-bold">
                            {user?.email?.[0]?.toUpperCase() || "A"}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-900 truncate">{user?.email}</p>
                            <p className="text-[10px] text-gray-500">Super Admin</p>
                        </div>
                        <button onClick={handleSignOut} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500">
                            <LogOut size={13} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* ── MAIN AREA ── */}
            <div className="flex-1 flex flex-col min-w-0 bg-gray-50">
                <header className="header-custom h-14 flex items-center px-6 sticky top-0 z-30">
                    <button className="lg:hidden p-2 rounded-lg hover:bg-gray-100 mr-3" onClick={() => setSidebarOpen(true)}>
                        <Menu size={18} className="text-gray-600" />
                    </button>
                    <div className="flex-1" />
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-900 text-gray-100 text-xs font-semibold">
                        <Shield size={12} className="text-emerald-400" />
                        ADMIN MODE
                    </div>
                </header>
                <main className="flex-1 p-6">
                    <div className="max-w-[1600px] mx-auto">{children}</div>
                </main>
            </div>
        </div>
    );
}