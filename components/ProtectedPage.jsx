"use client";

import { usePermissions } from "@/lib/hooks/usePermissions";
import { useRouter } from "next/navigation";
import {
    Loader2, ShieldAlert, Clock, AlertTriangle, Ban,
    ArrowRight, Calendar, Lock, Crown, Zap, CheckCircle2,
    XCircle, CreditCard, Timer
} from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export default function ProtectedPage({ page, children }) {
    const { canAccess, loading, profile, tenant } = usePermissions();
    const router = useRouter();
    const [accessBlocked, setAccessBlocked] = useState(false);
    const [blockReason, setBlockReason] = useState("");
    const [blockDetails, setBlockDetails] = useState({});

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-3">
                <Loader2 size={32} className="animate-spin text-emerald-600" />
                <p className="text-sm text-gray-500 font-medium">Verifying access...</p>
            </div>
        );
    }

    // Auth check - redirect if not logged in
    if (!profile) {
        router.replace("/login");
        return null;
    }

    // ═══════════════════════════════════════════════════
    // ACCESS CHECKS
    // ═══════════════════════════════════════════════════
    const now = new Date();

    // Check 1: Is account disabled? (plan === "disabled")
    const isDisabled = tenant?.plan === "disabled";

    // Check 2: Is subscription expired?
    const subscriptionEndDate = tenant?.subscription_ends_at
        ? new Date(tenant.subscription_ends_at)
        : null;
    const subscriptionExpired = subscriptionEndDate && subscriptionEndDate < now;

    // Check 3: Is trial expired?
    const trialEndDate = tenant?.trial_ends_at
        ? new Date(tenant.trial_ends_at)
        : null;
    const trialExpired = trialEndDate && trialEndDate < now;

    // Check 4: Is account suspended?
    const isSuspended = tenant?.status === "suspended";

    // Check 5: Is account inactive? (status field)
    const isInactive = tenant?.status === "inactive";

    // Determine if access should be blocked
    const shouldBlock = isDisabled || subscriptionExpired || trialExpired || isSuspended || isInactive;

    // Determine the reason
    let reason = "";
    let details = {};

    if (isDisabled) {
        reason = "disabled";
        details = {
            title: "Account Disabled",
            icon: Ban,
            color: "red",
            description: "Your workspace has been disabled by the administrator. Please contact support if you believe this is a mistake.",
            action: "Contact Support",
            actionLink: "/contact",
        };
    } else if (isSuspended) {
        reason = "suspended";
        details = {
            title: "Account Suspended",
            icon: ShieldAlert,
            color: "red",
            description: "Your workspace has been suspended due to a violation of terms or failed payment. Please contact support to resolve this.",
            action: "Contact Support",
            actionLink: "/contact",
        };
    } else if (isInactive) {
        reason = "inactive";
        details = {
            title: "Account Inactive",
            icon: XCircle,
            color: "red",
            description: "Your workspace is currently inactive. Please contact your administrator to reactivate it.",
            action: "Contact Support",
            actionLink: "/contact",
        };
    } else if (subscriptionExpired) {
        const daysSinceExpiry = Math.floor((now - subscriptionEndDate) / (1000 * 60 * 60 * 24));
        reason = "subscription_expired";
        details = {
            title: "Subscription Expired",
            icon: CreditCard,
            color: "amber",
            description: `Your subscription expired ${daysSinceExpiry} day${daysSinceExpiry !== 1 ? "s" : ""} ago on ${subscriptionEndDate.toLocaleDateString("en-US", {
                year: "numeric", month: "long", day: "numeric"
            })}. Renew your subscription to regain access.`,
            action: "Renew Subscription",
            actionLink: "/settings?tab=billing",
        };
    } else if (trialExpired) {
        const daysSinceExpiry = Math.floor((now - trialEndDate) / (1000 * 60 * 60 * 24));
        reason = "trial_expired";
        details = {
            title: "Free Trial Expired",
            icon: Timer,
            color: "amber",
            description: `Your free trial ended ${daysSinceExpiry} day${daysSinceExpiry !== 1 ? "s" : ""} ago on ${trialEndDate.toLocaleDateString("en-US", {
                year: "numeric", month: "long", day: "numeric"
            })}. Upgrade to a paid plan to continue using all features.`,
            action: "Upgrade Plan",
            actionLink: "/upgrade",
        };
    }

    // ═══════════════════════════════════════════════════
    // RENDER BLOCKING PAGE
    // ═══════════════════════════════════════════════════
    if (shouldBlock) {
        const Icon = details.icon;
        const colorClasses = details.color === "red"
            ? { border: "border-red-200", bg: "bg-red-50/50", iconBg: "bg-red-100", iconColor: "text-red-600", badge: "bg-red-100 text-red-700", strong: "text-red-700" }
            : { border: "border-amber-200", bg: "bg-amber-50/50", iconBg: "bg-amber-100", iconColor: "text-amber-600", badge: "bg-amber-100 text-amber-700", strong: "text-amber-700" };

        return (
            <div className="min-h-screen bg-white flex items-center justify-center p-6">
                <div className="w-full max-w-lg">
                    <div className={`rounded-2xl border-2 p-8 shadow-sm ${colorClasses.border} ${colorClasses.bg}`}>

                        {/* Icon */}
                        <div className="flex justify-center mb-6">
                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${colorClasses.iconBg} ${colorClasses.iconColor}`}>
                                <Icon size={28} />
                            </div>
                        </div>

                        {/* Title */}
                        <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
                            {details.title}
                        </h1>

                        {/* Status Badge */}
                        <div className="flex justify-center mb-4">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${colorClasses.badge}`}>
                                <AlertTriangle size={12} />
                                {details.title}
                            </span>
                        </div>

                        {/* Description */}
                        <p className="text-sm text-gray-600 text-center mb-6 leading-relaxed">
                            {details.description}
                        </p>

                        {/* Workspace Info */}
                        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Workspace</p>
                                    <p className="text-sm font-medium text-gray-900 mt-0.5">{tenant?.name || "Your Workspace"}</p>
                                </div>
                                <div className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${tenant?.plan === "enterprise" ? "bg-purple-100 text-purple-700" :
                                        tenant?.plan === "pro" ? "bg-blue-100 text-blue-700" :
                                            tenant?.plan === "disabled" ? "bg-red-100 text-red-700" :
                                                "bg-gray-100 text-gray-700"
                                    }`}>
                                    {tenant?.plan ? tenant.plan.charAt(0).toUpperCase() + tenant.plan.slice(1) : "Starter"} Plan
                                </div>
                            </div>

                            {/* Subscription/Trial Info */}
                            <div className="grid grid-cols-2 gap-3 text-xs">
                                {subscriptionEndDate && (
                                    <div className="bg-gray-50 rounded-lg p-2.5">
                                        <p className="text-gray-500 mb-0.5">Subscription</p>
                                        <p className={`font-semibold ${subscriptionExpired ? "text-red-600" : "text-emerald-600"}`}>
                                            {subscriptionExpired ? "Expired" : "Active"}
                                        </p>
                                    </div>
                                )}
                                {trialEndDate && (
                                    <div className="bg-gray-50 rounded-lg p-2.5">
                                        <p className="text-gray-500 mb-0.5">Trial</p>
                                        <p className={`font-semibold ${trialExpired ? "text-red-600" : "text-emerald-600"}`}>
                                            {trialExpired ? "Expired" : "Active"}
                                        </p>
                                    </div>
                                )}
                                {(subscriptionEndDate || trialEndDate) && (
                                    <div className="bg-gray-50 rounded-lg p-2.5">
                                        <p className="text-gray-500 mb-0.5">
                                            {subscriptionEndDate ? "Expires" : "Trial Ends"}
                                        </p>
                                        <p className="font-semibold text-gray-900">
                                            {(subscriptionEndDate || trialEndDate).toLocaleDateString("en-US", {
                                                month: "short", day: "numeric", year: "numeric"
                                            })}
                                        </p>
                                    </div>
                                )}
                                <div className="bg-gray-50 rounded-lg p-2.5">
                                    <p className="text-gray-500 mb-0.5">Status</p>
                                    <p className="font-semibold text-gray-900 capitalize">
                                        {reason.replace(/_/g, " ")}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* CTA Button */}
                        <button
                            onClick={() => router.push(details.actionLink)}
                            className={`w-full text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-sm ${details.color === "red"
                                    ? "bg-red-600 hover:bg-red-700 shadow-red-200"
                                    : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200"
                                }`}
                        >
                            {details.action === "Upgrade Plan" && <Crown size={16} />}
                            {details.action === "Renew Subscription" && <CreditCard size={16} />}
                            {details.action === "Contact Support" && <ShieldAlert size={16} />}
                            {details.action}
                            <ArrowRight size={16} />
                        </button>

                        {/* Footer */}
                        <p className="text-xs text-gray-400 text-center mt-4">
                            {details.color === "red"
                                ? "Please resolve this issue to regain access to your workspace"
                                : "Upgrade or renew to unlock all features and continue your work"
                            }
                        </p>

                        {/* Sign Out */}
                        <div className="text-center mt-4 pt-4 border-t border-gray-200">
                            <button
                                onClick={async () => {
                                    await supabase.auth.signOut();
                                    router.push("/login");
                                }}
                                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                Sign out
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ═══════════════════════════════════════════════════
    // ROLE-BASED ACCESS CONTROL
    // ═══════════════════════════════════════════════════
    if (!canAccess(page)) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center p-6">
                <div className="w-full max-w-md bg-white border-2 border-gray-200 rounded-2xl p-8 shadow-sm text-center">
                    <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-4">
                        <ShieldAlert size={24} className="text-red-600" />
                    </div>

                    <h1 className="text-xl font-bold text-gray-900 mb-2">
                        Access Denied
                    </h1>

                    <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                        You don't have the required permissions to access this page.
                        Please contact your workspace administrator if you believe this is a mistake.
                    </p>

                    <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 mb-6">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                            Your Role
                        </p>
                        <p className="text-sm font-medium text-gray-900 capitalize">
                            {profile?.role?.replace(/_/g, " ") || "Member"}
                        </p>
                    </div>

                    <button
                        onClick={() => router.back()}
                        className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-2.5 px-4 rounded-xl transition-colors duration-200 flex items-center justify-center gap-2"
                    >
                        <ArrowRight size={16} className="rotate-180" />
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}