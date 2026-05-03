"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import {
    Mail, Lock, User, ArrowRight, Loader2, AlertTriangle,
    CheckCircle, Eye, EyeOff, Shield, Building2, Users
} from "lucide-react";
import Image from "next/image";

function InviteRegisterContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("invite") || searchParams.get("token");

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [invite, setInvite] = useState(null);
    const [showPassword, setShowPassword] = useState(false);

    // Form
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (token) validateInvite();
        else { setError("No invite token provided"); setLoading(false); }
    }, [token]);

    const validateInvite = async () => {
        try {
            // Fetch ALL invites and find matching token
            const { data: allInvites } = await supabase
                .from("invites")
                .select("*")
                .order("created_at", { ascending: false })
                .limit(100);

            let inviteData = null;
            if (allInvites) {
                const urlToken = String(token).trim();
                for (const inv of allInvites) {
                    if (String(inv.token).trim() === urlToken) {
                        inviteData = inv;
                        break;
                    }
                }
            }

            // Fallback direct query
            if (!inviteData) {
                const { data: d } = await supabase
                    .from("invites")
                    .select("*")
                    .eq("token", token)
                    .maybeSingle();
                if (d) inviteData = d;
            }

            if (!inviteData) throw new Error("Invalid invite link. This invite does not exist or has been removed.");
            if (inviteData.status === "accepted") throw new Error("This invite has already been accepted.");
            if (inviteData.status === "revoked") throw new Error("This invite has been revoked by the team admin.");
            if (inviteData.status === "expired") throw new Error("This invite has expired.");
            if (inviteData.expires_at && new Date(inviteData.expires_at) < new Date()) {
                await supabase.from("invites").update({ status: "expired" }).eq("id", inviteData.id);
                throw new Error("This invite has expired.");
            }
            if (inviteData.status !== "pending") throw new Error(`Invalid invite status: ${inviteData.status}`);

            // Fetch tenant info
            let tenantName = "the organization";
            if (inviteData.tenant_id) {
                const { data: t } = await supabase
                    .from("tenants")
                    .select("name")
                    .eq("id", inviteData.tenant_id)
                    .maybeSingle();
                if (t) tenantName = t.name;
            }

            setInvite({ ...inviteData, tenantName });
            if (inviteData.email) setEmail(inviteData.email);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!fullName.trim()) return setError("Full name is required");
        if (!email.trim()) return setError("Email is required");
        if (!password || password.length < 6) return setError("Password must be at least 6 characters");

        // Email check
        if (invite?.email && email.toLowerCase().trim() !== invite.email.toLowerCase().trim()) {
            return setError(`This invite is for ${invite.email}. Please use that email address.`);
        }

        setSubmitting(true);
        setError(null);

        try {
            // 1. Create auth user
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: email.toLowerCase().trim(),
                password,
                options: {
                    data: {
                        full_name: fullName.trim(),
                    }
                }
            });

            if (authError) {
                if (authError.message?.includes("already registered") ||
                    authError.message?.includes("already exists") ||
                    authError.message?.includes("duplicate")) {
                    throw new Error("An account with this email already exists. Please sign in instead.");
                }
                throw authError;
            }

            // Check if email confirmation is required
            if (!authData?.user && !authData?.session) {
                setSuccess(true);
                return; // Email confirmation required - profile will be created after confirmation
            }

            if (!authData?.user) {
                throw new Error("Registration failed. Please try again.");
            }

            // 2. Create user profile linked to EXISTING tenant
            console.log("Creating profile for user:", authData.user.id);
            console.log("Joining tenant:", invite.tenant_id);
            console.log("Role:", invite.role);

            const { error: profileError } = await supabase
                .from("user_profiles")
                .upsert({
                    id: authData.user.id,
                    tenant_id: invite.tenant_id,
                    role: invite.role || "agent",
                    full_name: fullName.trim(),
                    email: email.toLowerCase().trim(),
                    status: "active",
                }, { onConflict: "id" });

            if (profileError) {
                console.error("Profile creation error:", profileError);
                throw new Error("Failed to create profile: " + profileError.message);
            }

            // 3. Accept the invite - UPDATE STATUS
            console.log("Accepting invite:", invite.id);
            const { error: inviteError } = await supabase
                .from("invites")
                .update({
                    status: "accepted",
                    accepted_at: new Date().toISOString()
                })
                .eq("id", invite.id);

            if (inviteError) {
                console.error("Invite update error:", inviteError);
                // Don't throw - profile was created successfully
            }

            // 4. Verify everything was created
            const { data: verifyProfile } = await supabase
                .from("user_profiles")
                .select("*")
                .eq("id", authData.user.id)
                .single();

            console.log("Profile created:", verifyProfile);

            const { data: verifyInvite } = await supabase
                .from("invites")
                .select("*")
                .eq("id", invite.id)
                .single();

            console.log("Invite status:", verifyInvite?.status);

            // 5. Clean up and redirect
            localStorage.removeItem("pendingInviteToken");

            // Sign in the user immediately
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: email.toLowerCase().trim(),
                password: password,
            });

            if (signInError) {
                console.error("Auto sign-in failed:", signInError);
                // Redirect to login if auto sign-in fails
                router.push("/login?registered=true");
                return;
            }

            router.push("/dashboard");
        } catch (err) {
            console.error("Registration error:", err);
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#f8faf8] via-white to-[#f0fdf4] flex items-center justify-center">
                <div className="text-center">
                    <Image src="/assets/logo.png" alt="Logo" width={56} height={56} className="mx-auto mb-4 animate-pulse rounded-2xl" />
                    <Loader2 size={48} className="text-emerald-500 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">Validating your invite...</p>
                </div>
            </div>
        );
    }

    if (error && !invite) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#f8faf8] via-white to-[#f0fdf4] flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center border border-gray-100">
                    <Image src="/assets/logo.png" alt="Logo" width={56} height={56} className="mx-auto mb-6 opacity-50 rounded-2xl" />
                    <div className="w-16 h-16 rounded-2xl bg-rose-100 flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle size={32} className="text-rose-500" />
                    </div>
                    <h1 className="text-xl font-bold text-gray-900 mb-3">Invalid Invite</h1>
                    <p className="text-gray-600 text-sm mb-6">{error}</p>
                    <button
                        onClick={() => router.push("/")}
                        className="px-6 py-3 rounded-xl bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200 transition-all"
                    >
                        Go Home
                    </button>
                </div>
            </div>
        );
    }

    // Email confirmation required state
    if (success) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#f8faf8] via-white to-[#f0fdf4] flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center border border-gray-100">
                    <Image src="/assets/logo.png" alt="Logo" width={56} height={56} className="mx-auto mb-6 rounded-2xl" />
                    <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                        <CheckCircle size={32} className="text-emerald-600" />
                    </div>
                    <h1 className="text-xl font-bold text-gray-900 mb-3">Check Your Email</h1>
                    <p className="text-gray-600 text-sm mb-2">
                        We've sent a confirmation email to <strong>{email}</strong>
                    </p>
                    <p className="text-gray-500 text-xs mb-6">
                        Click the link in the email to verify your account and join the team.
                    </p>
                    <button
                        onClick={() => router.push("/login")}
                        className="px-6 py-3 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-all"
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#f8faf8] via-white to-[#f0fdf4] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full border border-gray-100">

                {/* Logo */}
                <div className="flex justify-center mb-6">
                    <Image
                        src="/assets/logo.png"
                        alt="Logo"
                        width={64}
                        height={64}
                        className="rounded-2xl shadow-sm"
                    />
                </div>

                {/* Header */}
                <div className="text-center mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                        <Users size={32} className="text-emerald-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Join the Team</h1>
                    <p className="text-gray-500 text-sm mt-2">
                        Create your account to get started
                    </p>
                </div>

                {/* Organization Info */}
                {invite && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6">
                        <div className="flex items-center gap-2 mb-2">
                            <Building2 size={16} className="text-emerald-600 flex-shrink-0" />
                            <span className="text-sm font-semibold text-emerald-800">
                                {invite.tenantName || "Organization"}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                            <Shield size={16} className="text-emerald-600 flex-shrink-0" />
                            <span className="text-sm text-emerald-700 capitalize">
                                Role: <strong>{invite.role}</strong>
                            </span>
                        </div>
                        {invite.email && (
                            <div className="flex items-center gap-2">
                                <Mail size={16} className="text-emerald-600 flex-shrink-0" />
                                <span className="text-sm text-emerald-700">
                                    {invite.email}
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 mb-4 flex items-start gap-2">
                        <AlertTriangle size={14} className="text-rose-500 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-rose-700">{error}</p>
                    </div>
                )}

                {/* Registration Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Full Name */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">
                            Full Name
                        </label>
                        <div className="relative">
                            <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="John Doe"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 transition-all"
                                required
                            />
                        </div>
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">
                            Email
                        </label>
                        <div className="relative">
                            <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="email"
                                placeholder="you@company.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm transition-all ${invite?.email
                                        ? "bg-gray-100 border-gray-200 text-gray-600 cursor-not-allowed"
                                        : "bg-gray-50 border-gray-200 text-gray-900 focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50"
                                    }`}
                                readOnly={!!invite?.email}
                                required
                            />
                        </div>
                        {invite?.email && (
                            <p className="text-[10px] text-gray-400 mt-1">Email is locked to the invite</p>
                        )}
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">
                            Password
                        </label>
                        <div className="relative">
                            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Minimum 6 characters"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-10 pr-12 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 transition-all"
                                minLength={6}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-semibold shadow-lg shadow-green-200 disabled:opacity-50 disabled:cursor-not-allowed text-base transition-all mt-2"
                    >
                        {submitting ? (
                            <Loader2 size={20} className="animate-spin" />
                        ) : (
                            <>
                                Create Account & Join Team
                                <ArrowRight size={20} />
                            </>
                        )}
                    </button>
                </form>

                {/* Footer */}
                <div className="text-center mt-6 pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-400">
                        Already have an account?{" "}
                        <button
                            onClick={() => router.push(`/login?invite=${token}`)}
                            className="text-emerald-600 hover:text-emerald-700 font-semibold"
                        >
                            Sign in instead
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function InviteRegisterPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gradient-to-br from-[#f8faf8] via-white to-[#f0fdf4] flex items-center justify-center">
                <Image src="/assets/logo.png" alt="Logo" width={56} height={56} className="animate-pulse rounded-2xl" />
            </div>
        }>
            <InviteRegisterContent />
        </Suspense>
    );
}