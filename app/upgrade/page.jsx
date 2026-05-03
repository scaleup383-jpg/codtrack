"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
    Check, X, Zap, TrendingUp, Globe,
    Loader2, MessageCircle, ArrowLeft,
    Sparkles, Crown, BadgePercent
} from "lucide-react";

// ─── Config ──────────────────────────────────────────────────────────────────
const WHATSAPP_RAW = "0770491886";
// Convert local Iraqi number to international format for wa.me
const WHATSAPP_INTL = WHATSAPP_RAW.replace(/^0/, "964");

const PLANS = [
    {
        id: "starter",
        nameAr: "البداية",
        nameEn: "Starter",
        price: 19,
        period: "mo",
        periodAr: "شهر",
        billing: "Billed monthly",
        badge: null,
        badgeIcon: null,
        icon: Zap,
        popular: false,
        saving: null,
        features: [
            { text: "Up to 500 orders / month", ok: true },
            { text: "Product management", ok: true },
            { text: "Basic reports", ok: true },
            { text: "1-on-1 support", ok: true },
            { text: "1 shipping integration", ok: true },
            { text: "Google Sheets sync", ok: false },
            { text: "Break-even simulator", ok: false },
            { text: "Team management", ok: false },
            { text: "Multi-store integrations", ok: false },
        ],
    },
    {
        id: "growth",
        nameAr: "النمو",
        nameEn: "Growth",
        price: 49,
        period: "3 mo",
        periodAr: "3 أشهر",
        billing: "Billed every 3 months",
        badge: "Most popular",
        badgeIcon: Sparkles,
        icon: TrendingUp,
        popular: true,
        saving: "Save $8 · 14% off",
        features: [
            { text: "Unlimited orders", ok: true },
            { text: "Full product management", ok: true },
            { text: "Advanced reports + P&L", ok: true },
            { text: "Priority support 24/7", ok: true },
            { text: "All shipping carriers", ok: true },
            { text: "Google Sheets sync", ok: true },
            { text: "Break-even simulator", ok: true },
            { text: "Team — up to 5 members", ok: true },
            { text: "Multi-store integrations", ok: false },
        ],
    },
    {
        id: "pro",
        nameAr: "الاحتراف",
        nameEn: "Pro",
        price: 98,
        period: "6 mo",
        periodAr: "6 أشهر",
        billing: "Billed every 6 months",
        badge: "Best value",
        badgeIcon: Crown,
        icon: Globe,
        popular: false,
        saving: "Save $16 · 25% off",
        features: [
            { text: "Unlimited orders", ok: true },
            { text: "Full product management", ok: true },
            { text: "Advanced reports + P&L", ok: true },
            { text: "Dedicated account manager", ok: true },
            { text: "All shipping carriers", ok: true },
            { text: "Google Sheets sync", ok: true },
            { text: "Break-even simulator", ok: true },
            { text: "Unlimited team members", ok: true },
            { text: "Multi-store integrations", ok: true },
        ],
    },
];

// ─── WhatsApp message builder ─────────────────────────────────────────────────
function buildWAMessage({ plan, tenantId, tenantName, userEmail, userName }) {
    const lines = [
        `Hi, I'd like to upgrade my plan.`,
        ``,
        `*Plan:* ${plan.nameEn} (${plan.nameAr}) — $${plan.price} / ${plan.period}`,
        `*Billing:* ${plan.billing}`,
        tenantName ? `*Organization:* ${tenantName}` : "",
        tenantId ? `*Org ID:* ${tenantId}` : "",
        userName ? `*Name:* ${userName}` : "",
        userEmail ? `*Email:* ${userEmail}` : "",
        ``,
        `Please send payment details. Thank you 🙏`,
    ].filter(Boolean).join("\n");
    return encodeURIComponent(lines);
}

// ─── Feature row ──────────────────────────────────────────────────────────────
function FRow({ text, ok, dark }) {
    return (
        <div style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "8px 0", borderBottom: `1px solid ${dark ? "rgba(255,255,255,0.09)" : "#edf4f0"}`,
        }}>
            {ok ? (
                <span style={{
                    width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                    background: dark ? "rgba(255,255,255,0.18)" : "#d9f5e5",
                    display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                    <Check size={11} color={dark ? "#fff" : "#00a040"} strokeWidth={2.8} />
                </span>
            ) : (
                <span style={{
                    width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                    background: dark ? "rgba(255,255,255,0.06)" : "#f2f5f2",
                    display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                    <X size={10} color={dark ? "rgba(255,255,255,0.3)" : "#bfcfc3"} strokeWidth={2.5} />
                </span>
            )}
            <span style={{
                fontSize: "0.875rem", fontWeight: ok ? 500 : 400,
                color: dark
                    ? (ok ? "#fff" : "rgba(255,255,255,0.38)")
                    : (ok ? "#1a2e20" : "#b0c4b8"),
            }}>{text}</span>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function UpgradePage() {
    const router = useRouter();
    const [session, setSession] = useState(null);   // { tenantId, tenantName, userEmail, userName }
    const [loading, setLoading] = useState(true);
    const [hovered, setHovered] = useState("growth");

    // Load session data silently — no form shown to user
    const loadSession = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { setLoading(false); return; }

            const { data: profile } = await supabase
                .from("user_profiles")
                .select("tenant_id, full_name, role")
                .eq("id", user.id)
                .single();

            let tenantName = null;
            if (profile?.tenant_id) {
                const { data: tenant } = await supabase
                    .from("tenants")
                    .select("name")
                    .eq("id", profile.tenant_id)
                    .single();
                tenantName = tenant?.name || null;
            }

            setSession({
                tenantId: profile?.tenant_id || null,
                tenantName: tenantName,
                userEmail: user.email || null,
                userName: profile?.full_name || user.user_metadata?.full_name || null,
            });
        } catch {
            // silently fail — page still works without session
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadSession(); }, [loadSession]);

    const handleUpgrade = (plan) => {
        const msg = buildWAMessage({
            plan,
            tenantId: session?.tenantId,
            tenantName: session?.tenantName,
            userEmail: session?.userEmail,
            userName: session?.userName,
        });
        window.open(`https://wa.me/${WHATSAPP_INTL}?text=${msg}`, "_blank");
    };

    if (loading) {
        return (
            <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#fff" }}>
                <Loader2 size={26} style={{ animation: "spin 1s linear infinite", color: "#00a040" }} />
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: "100vh", background: "#fff",
            fontFamily: "'Tajawal','Cairo',system-ui,sans-serif",
            color: "#0f1f14",
        }}>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}

        @keyframes card-in{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:none}}
        @keyframes pulse-glow{0%,100%{box-shadow:0 0 0 0 rgba(0,180,68,0.45)}50%{box-shadow:0 0 0 10px rgba(0,180,68,0)}}
        @keyframes badge-pop{from{transform:scale(0.7);opacity:0}to{transform:scale(1);opacity:1}}

        .plan-card{
          border-radius: 24px;
          transition: transform 0.35s cubic-bezier(0.16,1,0.3,1), box-shadow 0.35s;
          animation: card-in 0.55s cubic-bezier(0.16,1,0.3,1) both;
        }
        .plan-card:hover{ transform: translateY(-8px); }
        .plan-card.popular{ transform: scale(1.03); animation: card-in 0.55s 0.1s cubic-bezier(0.16,1,0.3,1) both, pulse-glow 2.8s 1s ease-in-out infinite; }
        .plan-card.popular:hover{ transform: scale(1.03) translateY(-8px); }

        .wa-btn{
          width:100%; padding: 15px 20px; border: none; border-radius: 50px;
          font-size: 0.97rem; font-weight: 800; font-family: 'Tajawal',sans-serif;
          cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 9px;
          transition: transform 0.25s, box-shadow 0.25s;
        }
        .wa-btn:hover{ transform: translateY(-2px); }
        .wa-btn.dark{background:#fff;color:#00883a;}
        .wa-btn.dark:hover{box-shadow:0 10px 30px rgba(0,0,0,0.16);}
        .wa-btn.light{background:linear-gradient(135deg,#009e3f,#00c853);color:#fff;box-shadow:0 6px 22px rgba(0,168,68,0.32);}
        .wa-btn.light:hover{box-shadow:0 12px 36px rgba(0,168,68,0.46);}
        .wa-btn.outline{background:transparent;color:#00883a;border:2px solid #00c853;}
        .wa-btn.outline:hover{background:#f2fbf5;}

        .badge{animation:badge-pop 0.4s 0.3s cubic-bezier(0.16,1,0.3,1) both;}

        @media(max-width:860px){
          .plans-grid{grid-template-columns:1fr !important;}
          .plan-card.popular{transform:none;}
          .plan-card.popular:hover{transform:translateY(-8px);}
        }
      `}</style>

            {/* ── Back nav ──────────────────────────────────────────────────────── */}
            <div style={{ padding: "20px 6% 0" }}>
                <button
                    onClick={() => router.back()}
                    style={{
                        display: "inline-flex", alignItems: "center", gap: 6,
                        background: "none", border: "none", cursor: "pointer",
                        color: "#6b8c76", fontSize: "0.88rem", fontWeight: 600,
                        fontFamily: "inherit", padding: "6px 0",
                        transition: "color 0.2s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = "#00883a"}
                    onMouseLeave={e => e.currentTarget.style.color = "#6b8c76"}
                >
                    <ArrowLeft size={15} /> Back to settings
                </button>
            </div>

            {/* ── Session context pill (visible when logged in) ──────────────── */}
            {session?.tenantName && (
                <div style={{ padding: "12px 6% 0", display: "flex" }}>
                    <div style={{
                        display: "inline-flex", alignItems: "center", gap: 8,
                        background: "#edf8f1", border: "1px solid #b8e6c8",
                        borderRadius: "50px", padding: "6px 14px",
                        fontSize: "0.8rem", fontWeight: 700, color: "#00763a",
                    }}>
                        <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#00c853", display: "inline-block" }} />
                        {session.tenantName}
                        {session.userEmail && <span style={{ fontWeight: 500, color: "#4a8a5d" }}>· {session.userEmail}</span>}
                    </div>
                </div>
            )}

            {/* ── Plans grid ────────────────────────────────────────────────────── */}
            <div style={{ padding: "32px 5% 80px" }}>
                <div
                    className="plans-grid"
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3,1fr)",
                        gap: 22,
                        maxWidth: 1100,
                        margin: "0 auto",
                        alignItems: "stretch",
                    }}
                >
                    {PLANS.map((plan, idx) => {
                        const isDark = plan.popular;
                        const PIcon = plan.icon;
                        const BadgeIcon = plan.badgeIcon;

                        return (
                            <div
                                key={plan.id}
                                className={`plan-card${plan.popular ? " popular" : ""}`}
                                style={{
                                    animationDelay: `${idx * 0.08}s`,
                                    background: isDark
                                        ? "linear-gradient(148deg,#00943c 0%,#00c152 55%,#00de5e 100%)"
                                        : "#fff",
                                    border: isDark
                                        ? "none"
                                        : `2px solid ${hovered === plan.id ? "#00c853" : "#e2ede7"}`,
                                    boxShadow: isDark
                                        ? "0 24px 64px rgba(0,160,56,0.38)"
                                        : hovered === plan.id
                                            ? "0 16px 52px rgba(0,168,68,0.12)"
                                            : "0 3px 16px rgba(0,0,0,0.05)",
                                    display: "flex", flexDirection: "column",
                                    zIndex: plan.popular ? 2 : 1,
                                }}
                                onMouseEnter={() => setHovered(plan.id)}
                            >
                                {/* ── Card header ─────────────────────────────────────── */}
                                <div style={{ padding: "28px 28px 20px" }}>

                                    {/* Badge row */}
                                    <div style={{ height: 28, marginBottom: 14, display: "flex", alignItems: "center" }}>
                                        {plan.badge && (
                                            <div className="badge" style={{
                                                display: "inline-flex", alignItems: "center", gap: 5,
                                                background: isDark ? "rgba(255,255,255,0.2)" : "#e6f8ee",
                                                border: isDark ? "1px solid rgba(255,255,255,0.3)" : "1px solid #a8dcb8",
                                                borderRadius: "50px", padding: "4px 12px",
                                                fontSize: "0.75rem", fontWeight: 800,
                                                color: isDark ? "#fff" : "#00763a",
                                            }}>
                                                {BadgeIcon && <BadgeIcon size={11} />}
                                                {plan.badge}
                                            </div>
                                        )}
                                    </div>

                                    {/* Price */}
                                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 3 }}>
                                        <PIcon size={24} color={isDark ? "#fff" : "#00a040"} opacity={isDark ? 1 : 0.75} />
                                        <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                                            <span style={{ fontSize: "clamp(2.6rem,4vw,3.4rem)", fontWeight: 900, lineHeight: 1, color: isDark ? "#fff" : "#00833a" }}>
                                                ${plan.price}
                                            </span>
                                            <span style={{ fontSize: "0.9rem", fontWeight: 600, color: isDark ? "rgba(255,255,255,0.65)" : "#7da88a" }}>
                                                /{plan.period}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Saving pill */}
                                    {plan.saving ? (
                                        <div style={{
                                            display: "inline-flex", alignItems: "center", gap: 4,
                                            background: isDark ? "rgba(255,255,255,0.17)" : "#e6f8ee",
                                            borderRadius: "50px", padding: "3px 11px", marginBottom: 6,
                                        }}>
                                            <BadgePercent size={11} color={isDark ? "#fff" : "#00763a"} />
                                            <span style={{ fontSize: "0.75rem", fontWeight: 800, color: isDark ? "#fff" : "#00763a" }}>{plan.saving}</span>
                                        </div>
                                    ) : (
                                        <div style={{ height: 22, marginBottom: 6 }} />
                                    )}

                                    <p style={{ fontSize: "0.78rem", color: isDark ? "rgba(255,255,255,0.55)" : "#7da88a", fontWeight: 500, marginBottom: 14 }}>
                                        {plan.billing}
                                    </p>

                                    {/* Plan name */}
                                    <h2 style={{ fontSize: "1.45rem", fontWeight: 900, color: isDark ? "#fff" : "#0f1f14", marginBottom: 0, lineHeight: 1.1 }}>
                                        {plan.nameEn}
                                        <span style={{ fontSize: "1rem", fontWeight: 700, color: isDark ? "rgba(255,255,255,0.6)" : "#a0b8a8", marginRight: 8 }}>
                                            {" "}{plan.nameAr}
                                        </span>
                                    </h2>
                                </div>

                                {/* ── Divider ──────────────────────────────────────────── */}
                                <div style={{ height: 1, background: isDark ? "rgba(255,255,255,0.14)" : "#edf4f0", margin: "0 28px" }} />

                                {/* ── Features ─────────────────────────────────────────── */}
                                <div style={{ padding: "20px 28px", flex: 1 }}>
                                    {plan.features.map((f, fi) => (
                                        <FRow key={fi} text={f.text} ok={f.ok} dark={isDark} />
                                    ))}
                                </div>

                                {/* ── CTA ──────────────────────────────────────────────── */}
                                <div style={{ padding: "4px 28px 28px" }}>
                                    <button
                                        className={`wa-btn ${isDark ? "dark" : plan.id === "starter" ? "outline" : "light"}`}
                                        onClick={() => handleUpgrade(plan)}
                                    >
                                        <MessageCircle size={17} />
                                        Upgrade via WhatsApp
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}