"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { CheckCircle, AlertTriangle, Loader2, ArrowRight, Mail, Shield, XCircle, Info, Building2, Users } from "lucide-react";
import Image from "next/image";

function AcceptInviteContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [invite, setInvite] = useState(null);
    const [accepting, setAccepting] = useState(false);
    const [user, setUser] = useState(null);

    useEffect(() => {
        if (token) { validateInvite(); checkUser(); }
        else { setError("No invite token provided."); setLoading(false); }
    }, [token]);

    const checkUser = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) setUser(session.user);
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
            if (session?.user) setUser(session.user);
        });
        return () => subscription?.unsubscribe();
    };

    const validateInvite = async () => {
        try {
            // Fetch ALL invites and find matching token
            const { data: allInvites, error: fetchError } = await supabase
                .from("invites").select("*").order("created_at", { ascending: false }).limit(100);

            if (fetchError) throw new Error("Failed to fetch invites: " + fetchError.message);

            let inviteData = null;
            if (allInvites) {
                const urlToken = String(token).trim();
                for (const inv of allInvites) {
                    if (String(inv.token).trim() === urlToken) { inviteData = inv; break; }
                    if (String(inv.token).trim().toLowerCase() === urlToken.toLowerCase()) { inviteData = inv; break; }
                }
            }

            // Fallback direct query
            if (!inviteData) {
                const { data: d } = await supabase.from("invites").select("*").eq("token", token).maybeSingle();
                if (d) inviteData = d;
            }

            if (!inviteData) throw new Error("Invalid invite link. This invite does not exist or has been removed.");

            // Fetch tenant name
            let tenantName = "the team";
            if (inviteData.tenant_id) {
                const { data: t } = await supabase.from("tenants").select("name").eq("id", inviteData.tenant_id).maybeSingle();
                if (t) tenantName = t.name;
            }

            const inviteWithTenant = { ...inviteData, tenants: { name: tenantName } };

            // Validate status
            if (inviteData.status === "accepted") throw new Error("This invite has already been accepted.");
            if (inviteData.status === "revoked") throw new Error("This invite has been revoked by the team admin.");
            if (inviteData.status === "expired") throw new Error("This invite has expired.");
            if (inviteData.expires_at && new Date(inviteData.expires_at) < new Date()) {
                await supabase.from("invites").update({ status: "expired" }).eq("id", inviteData.id);
                throw new Error("This invite has expired.");
            }
            if (inviteData.status !== "pending") throw new Error(`Invalid invite status: ${inviteData.status}`);

            setInvite(inviteWithTenant);
        } catch (err) { setError(err.message); }
        finally { setLoading(false); }
    };

    const handleAccept = async () => {
        if (!invite) return;

        // Redirect to dedicated invite registration page if not logged in
        if (!user) {
            localStorage.setItem("pendingInviteToken", token);
            router.push(`/register/invite?token=${token}`); // ✅ Updated to dedicated invite registration
            return;
        }

        setAccepting(true);
        setError(null);
        try {
            const ue = (user.email || "").toLowerCase().trim();
            const ie = (invite.email || "").toLowerCase().trim();

            // Check email match
            if (ie && ue !== ie) {
                throw new Error(`This invite is for ${invite.email}. You are logged in as ${user.email}.`);
            }

            // Check if already a member
            const { data: existingProfile } = await supabase
                .from("user_profiles")
                .select("id")
                .eq("id", user.id)
                .eq("tenant_id", invite.tenant_id)
                .maybeSingle();

            if (!existingProfile) {
                // Create user profile with tenant from invite
                const { error: profileError } = await supabase.from("user_profiles").upsert({
                    id: user.id,
                    tenant_id: invite.tenant_id,
                    role: invite.role || "agent",
                    full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Team Member",
                    email: user.email,
                    status: "active",
                }, { onConflict: "id" });

                if (profileError) throw profileError;
            }

            // Mark invite as accepted
            await supabase.from("invites").update({
                status: "accepted",
                accepted_at: new Date().toISOString()
            }).eq("id", invite.id);

            localStorage.removeItem("pendingInviteToken");
            router.push("/dashboard");
        } catch (err) {
            setError(err.message);
        } finally {
            setAccepting(false);
        }
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        setUser(null);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#f8faf8] via-white to-[#f0fdf4] flex items-center justify-center">
                <div className="text-center bg-white rounded-3xl shadow-xl p-8 max-w-sm w-full mx-4">
                    {/* Logo */}
                    <div className="flex justify-center mb-6">
                        <Image
                            src="/assets/logo.png"
                            alt="Logo"
                            width={48}
                            height={48}
                            className="animate-pulse"
                        />
                    </div>
                    <Loader2 size={48} className="text-emerald-500 animate-spin mx-auto mb-4" />
                    <p className="text-gray-700 font-semibold text-lg">Validating Invite</p>
                    <p className="text-gray-500 text-sm mt-2">Checking your invite link...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#f8faf8] via-white to-[#f0fdf4] flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center border border-gray-100">
                    {/* Logo */}
                    <div className="flex justify-center mb-6">
                        <Image
                            src="/assets/logo.png"
                            alt="Logo"
                            width={56}
                            height={56}
                            className="opacity-50"
                        />
                    </div>
                    <div className="w-16 h-16 rounded-2xl bg-rose-100 flex items-center justify-center mx-auto mb-4">
                        <XCircle size={32} className="text-rose-500" />
                    </div>
                    <h1 className="text-xl font-bold text-gray-900 mb-3">Invalid Invite</h1>
                    <p className="text-gray-600 text-sm mb-6">{error}</p>
                    <div className="space-y-3">
                        <button
                            onClick={() => router.push("/")}
                            className="w-full px-6 py-3 rounded-xl bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200 transition-all"
                        >
                            Go Home
                        </button>
                        <button
                            onClick={() => router.push("/login")}
                            className="w-full px-6 py-3 rounded-xl bg-white border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-all"
                        >
                            Sign In
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!invite) return null;

    const userEmail = (user?.email || "").toLowerCase().trim();
    const inviteEmail = (invite.email || "").toLowerCase().trim();
    const emailMismatch = user && inviteEmail && userEmail !== inviteEmail;

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

                {/* Success Icon */}
                <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                    <Mail size={32} className="text-emerald-600" />
                </div>

                <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">You're Invited!</h1>
                <p className="text-gray-500 text-sm text-center mb-6">
                    Join <strong className="text-gray-900">{invite?.tenants?.name || "the team"}</strong> as{" "}
                    <strong className="text-emerald-600 capitalize">{invite?.role || "member"}</strong>
                </p>

                {/* Invite Details */}
                <div className="bg-gray-50 rounded-2xl p-4 mb-6 space-y-3">
                    {/* Organization */}
                    <div className="flex items-center gap-3">
                        <Building2 size={16} className="text-gray-400 flex-shrink-0" />
                        <div>
                            <p className="text-xs text-gray-500">Organization</p>
                            <p className="text-sm font-semibold text-gray-900">{invite?.tenants?.name || "the team"}</p>
                        </div>
                    </div>

                    {/* Invited Email */}
                    {invite.email && (
                        <div className="flex items-center gap-3">
                            <Mail size={16} className="text-gray-400 flex-shrink-0" />
                            <div>
                                <p className="text-xs text-gray-500">Invited Email</p>
                                <p className="text-sm font-semibold text-gray-900">{invite.email}</p>
                            </div>
                        </div>
                    )}

                    {/* Role */}
                    <div className="flex items-center gap-3">
                        <Shield size={16} className="text-gray-400 flex-shrink-0" />
                        <div>
                            <p className="text-xs text-gray-500">Role</p>
                            <p className="text-sm font-semibold text-gray-900 capitalize">{invite?.role || "member"}</p>
                        </div>
                    </div>

                    {/* Current User */}
                    {user && (
                        <div className="flex items-center gap-3 pt-3 border-t border-gray-200">
                            <CheckCircle
                                size={16}
                                className={!emailMismatch ? "text-emerald-500" : "text-rose-500"}
                            />
                            <div>
                                <p className="text-xs text-gray-500">Logged in as</p>
                                <p className="text-sm font-semibold text-gray-900">{user.email}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Email Mismatch Warning */}
                {emailMismatch && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 flex items-start gap-2">
                        <AlertTriangle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-700">
                            This invite is for <strong>{invite.email}</strong>. Please log in with that email address.
                        </p>
                    </div>
                )}

                {/* No email restriction info */}
                {user && !inviteEmail && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4 flex items-start gap-2">
                        <Info size={14} className="text-blue-500 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-blue-700">
                            This invite has no email restriction. You can accept it with your current account.
                        </p>
                    </div>
                )}

                {/* Accept Button */}
                <button
                    onClick={handleAccept}
                    disabled={accepting || (emailMismatch && Boolean(inviteEmail))}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-semibold transition-all shadow-lg shadow-green-200 disabled:opacity-50 disabled:cursor-not-allowed text-base"
                >
                    {accepting ? (
                        <Loader2 size={20} className="animate-spin" />
                    ) : user ? (
                        <>
                            Accept & Join Team
                            <ArrowRight size={20} />
                        </>
                    ) : (
                        <>
                            Create Account to Accept
                            <ArrowRight size={20} />
                        </>
                    )}
                </button>

                {/* Switch Account */}
                {user && emailMismatch && (
                    <button
                        onClick={handleSignOut}
                        className="w-full mt-3 px-4 py-3 rounded-xl text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-all"
                    >
                        Switch Account
                    </button>
                )}

                {/* Sign In Link */}
                {!user && (
                    <p className="text-xs text-gray-400 text-center mt-4">
                        Already have an account?{" "}
                        <button
                            onClick={() => router.push(`/login?invite=${token}`)}
                            className="text-emerald-600 hover:text-emerald-700 font-semibold"
                        >
                            Sign in
                        </button>
                    </p>
                )}
            </div>
        </div>
    );
}

export default function AcceptInvitePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gradient-to-br from-[#f8faf8] via-white to-[#f0fdf4] flex items-center justify-center">
                <div className="text-center">
                    {/* Logo */}
                    <div className="flex justify-center mb-6">
                        <Image
                            src="/assets/logo.png"
                            alt="Logo"
                            width={56}
                            height={56}
                            className="animate-pulse"
                        />
                    </div>
                    <Loader2 size={48} className="text-emerald-500 animate-spin mx-auto mb-4" />
                    <p className="text-gray-500">Loading...</p>
                </div>
            </div>
        }>
            <AcceptInviteContent />
        </Suspense>
    );
}