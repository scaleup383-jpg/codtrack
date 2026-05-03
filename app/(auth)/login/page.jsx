"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import Image from "next/image";
import logo from "@/assets/logo.png";
import {
    Mail, Lock, Eye, EyeOff, CheckCircle2, ShieldCheck,
    TrendingUp, Package, Zap, AlertCircle, Loader2,
    ArrowRight, RefreshCw,
} from "lucide-react";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Instrument+Sans:wght@300;400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --cream:        #faf7f2;
    --cream2:       #f4efe6;
    --surface:      #ffffff;
    --accent:       #16a34a;
    --accent-light: #dcfce7;
    --accent-mid:   #22c55e;
    --ink:          #111810;
    --ink2:         #2d3a2e;
    --muted:        #6b7c6c;
    --border:       #e2ddd4;
    --border2:      #d4cfca;
    --error:        #dc2626;
    --error-bg:     #fef2f2;
    --success:      #15803d;
    --success-bg:   #f0fdf4;
  }

  .login-root {
    min-height: 100vh;
    display: grid;
    grid-template-columns: 1fr 1fr;
    font-family: 'Instrument Sans', sans-serif;
    -webkit-font-smoothing: antialiased;
    background: var(--cream);
  }

  /* ── LEFT PANEL ── */
  .left-panel {
    background: var(--ink);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 52px 56px;
    position: relative;
    overflow: hidden;
  }
  .left-panel::before {
    content: '';
    position: absolute;
    top: -120px; right: -120px;
    width: 420px; height: 420px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(34,197,94,0.13), transparent 70%);
    pointer-events: none;
  }
  .left-panel::after {
    content: '';
    position: absolute;
    bottom: -80px; left: -80px;
    width: 320px; height: 320px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(22,163,74,0.09), transparent 70%);
    pointer-events: none;
  }

  .left-logo {
    display: flex;
    align-items: center;
    gap: 10px;
    position: relative;
    z-index: 1;
  }

  .left-headline {
    position: relative; z-index: 1;
  }
  .left-eyebrow {
    display: inline-flex; align-items: center; gap: 6px;
    font-size: 11px; font-weight: 600; color: var(--accent-mid);
    text-transform: uppercase; letter-spacing: 1.2px;
    margin-bottom: 16px;
  }
  .left-h2 {
    font-family: 'Syne', sans-serif;
    font-size: 38px; font-weight: 800;
    letter-spacing: -1px; line-height: 1.2;
    color: #fff;
    margin-bottom: 14px;
  }
  .left-h2 span { color: var(--accent-mid); }
  .left-sub {
    font-size: 15px; color: #7a9e82; line-height: 1.7; max-width: 320px;
  }

  .left-stats {
    position: relative; z-index: 1;
    display: flex; flex-direction: column; gap: 12px;
  }
  .stat-card {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 14px;
    padding: 16px 20px;
    display: flex; align-items: center; justify-content: space-between;
    transition: background .2s;
  }
  .stat-card:hover { background: rgba(255,255,255,0.08); }
  .stat-card-left { display: flex; align-items: center; gap: 12px; }
  .stat-icon {
    width: 36px; height: 36px;
    border-radius: 9px;
    background: rgba(34,197,94,0.12);
    border: 1px solid rgba(34,197,94,0.2);
    display: flex; align-items: center; justify-content: center;
    color: var(--accent-mid);
  }
  .stat-label { font-size: 12px; color: #6b8f72; font-weight: 500; margin-bottom: 2px; }
  .stat-val {
    font-family: 'Syne', sans-serif;
    font-size: 20px; font-weight: 800; color: #fff;
  }
  .stat-badge {
    font-size: 11px; font-weight: 600; color: var(--accent-mid);
    background: rgba(34,197,94,0.1);
    border: 1px solid rgba(34,197,94,0.18);
    padding: 3px 9px; border-radius: 100px;
  }

  .left-trust {
    display: flex; align-items: center; gap: 8px;
    font-size: 12px; color: #5a7a60;
    position: relative; z-index: 1;
    margin-top: 8px;
  }
  .left-trust svg { color: var(--accent-mid); }

  /* ── RIGHT PANEL ── */
  .right-panel {
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 52px 60px;
    background: var(--cream);
    position: relative;
    overflow-y: auto;
  }

  .right-header { margin-bottom: 36px; }
  .right-eyebrow {
    display: inline-flex; align-items: center; gap: 6px;
    font-size: 11px; font-weight: 600; color: var(--accent);
    text-transform: uppercase; letter-spacing: 1px;
    background: var(--accent-light);
    border: 1px solid rgba(22,163,74,0.18);
    padding: 4px 12px; border-radius: 100px;
    margin-bottom: 16px;
  }
  .right-h2 {
    font-family: 'Syne', sans-serif;
    font-size: 32px; font-weight: 800;
    letter-spacing: -0.5px; line-height: 1.25;
    color: var(--ink); margin-bottom: 8px;
  }
  .right-sub { font-size: 14px; color: var(--muted); line-height: 1.6; }

  /* Input group */
  .field-group { display: flex; flex-direction: column; gap: 14px; margin-bottom: 8px; }

  .field-wrap { position: relative; }
  .field-icon {
    position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
    color: var(--muted); pointer-events: none;
    display: flex; align-items: center;
  }
  .field-eye {
    position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
    color: var(--muted); cursor: pointer; background: none; border: none; padding: 0;
    display: flex; align-items: center;
    transition: color .2s;
  }
  .field-eye:hover { color: var(--ink); }

  .field-input {
    width: 100%;
    padding: 13px 14px 13px 42px;
    border: 1px solid var(--border2);
    border-radius: 11px;
    background: var(--surface);
    font-family: 'Instrument Sans', sans-serif;
    font-size: 14px; font-weight: 400;
    color: var(--ink);
    outline: none;
    transition: border-color .2s, box-shadow .2s;
    -webkit-appearance: none;
  }
  .field-input::placeholder { color: #b8c2b9; }
  .field-input:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px rgba(22,163,74,0.1);
  }
  .field-input.has-eye { padding-right: 42px; }

  .field-label {
    font-size: 12px; font-weight: 600; color: var(--ink2);
    margin-bottom: 6px; display: block;
    letter-spacing: 0.2px;
  }

  /* Forgot password */
  .forgot-row {
    display: flex;
    justify-content: flex-end;
    margin-top: 8px;
    margin-bottom: 20px;
  }
  .forgot-link {
    font-size: 12px; font-weight: 600;
    color: var(--accent); text-decoration: none;
    transition: color .2s;
  }
  .forgot-link:hover { color: #15803d; }

  /* Alert */
  .alert {
    display: flex; align-items: flex-start; gap: 10px;
    padding: 12px 14px; border-radius: 11px;
    font-size: 13px; font-weight: 500; line-height: 1.5;
    margin-bottom: 16px;
  }
  .alert.error   { background: var(--error-bg); color: var(--error); border: 1px solid rgba(220,38,38,0.15); }
  .alert.success { background: var(--success-bg); color: var(--success); border: 1px solid rgba(22,163,74,0.2); }
  .alert.info    { background: #eff6ff; color: #1d4ed8; border: 1px solid rgba(59,130,246,0.2); }
  .alert.admin   { background: #1e293b; color: #e2e8f0; border: 1px solid #334155; }
  .alert svg { flex-shrink: 0; margin-top: 1px; }

  /* Buttons */
  .btn-login {
    display: flex; align-items: center; justify-content: center; gap: 8px;
    width: 100%; padding: 14px;
    border-radius: 11px; border: none;
    background: var(--accent);
    color: #fff;
    font-family: 'Syne', sans-serif;
    font-size: 15px; font-weight: 700;
    cursor: pointer;
    transition: background .2s, transform .2s, box-shadow .2s;
    box-shadow: 0 4px 16px rgba(22,163,74,0.3);
  }
  .btn-login:hover:not(:disabled) { background: #15803d; transform: translateY(-1px); box-shadow: 0 6px 22px rgba(22,163,74,0.4); }
  .btn-login:disabled { opacity: 0.65; cursor: not-allowed; transform: none; }

  .register-link {
    text-align: center; margin-top: 24px;
    font-size: 13px; color: var(--muted);
  }
  .register-link a {
    color: var(--accent); font-weight: 600; text-decoration: none;
    transition: color .2s;
  }
  .register-link a:hover { color: #15803d; }

  /* Remember me */
  .remember-row {
    display: flex; align-items: center; gap: 8px;
    margin-bottom: 20px;
  }
  .remember-checkbox {
    width: 16px; height: 16px;
    accent-color: var(--accent);
    cursor: pointer;
    border-radius: 4px;
  }
  .remember-label {
    font-size: 13px; color: var(--muted); cursor: pointer;
  }

  /* Spin loader */
  @keyframes spin { to { transform: rotate(360deg); } }
  .spin { animation: spin .7s linear infinite; }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .fade-in { animation: fadeIn .3s ease both; }

  @media (max-width: 860px) {
    .login-root { grid-template-columns: 1fr; }
    .left-panel { display: none; }
    .right-panel { padding: 40px 24px; }
  }
`;

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [showPw, setShowPw] = useState(false);
    const [remember, setRemember] = useState(false);
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);

    const [form, setForm] = useState({ email: "", password: "" });

    const handleChange = (e) => {
        setError("");
        setIsSuperAdmin(false);
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        setIsSuperAdmin(false);

        if (!form.email || !form.password)
            return setError("Please fill in both fields.");

        setLoading(true);

        try {
            // ────────────────────────────────────────────────────
            // STEP 1: Check super_admins table FIRST
            // ────────────────────────────────────────────────────
            const { data: superAdminData, error: superAdminError } = await supabase
                .from("super_admins")
                .select("id, email, full_name, role")
                .eq("email", form.email.toLowerCase().trim())
                .single();

            if (!superAdminError && superAdminData) {
                // Super admin email found - now verify password via Supabase Auth
                console.log("Super admin email found:", superAdminData.email);

                // Sign in with Supabase Auth to verify password
                const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                    email: form.email,
                    password: form.password,
                });

                if (authError) {
                    // Password is wrong
                    throw new Error("Invalid password. Please try again.");
                }

                // Password verified! Redirect to admin analytics
                setIsSuperAdmin(true);
                setSuccess("Welcome, Super Admin! Redirecting to Admin Panel…");

                setTimeout(() => {
                    router.push("/admin/analytics");
                }, 1000);

                setLoading(false);
                return;
            }

            // ────────────────────────────────────────────────────
            // STEP 2: Regular user login (not super admin)
            // ────────────────────────────────────────────────────
            const { data, error: signInError } = await supabase.auth.signInWithPassword({
                email: form.email,
                password: form.password,
            });

            if (signInError) throw signInError;

            // Ensure session is properly created
            const { data: sessionData } = await supabase.auth.getSession();

            if (!sessionData?.session) {
                throw new Error("Session not created properly. Please try again.");
            }

            const user = sessionData.session.user;

            if (!user) {
                throw new Error("User not found after authentication.");
            }

            // ────────────────────────────────────────────────────
            // STEP 3: Check if regular user is admin
            // ────────────────────────────────────────────────────
            setSuccess("Verifying account permissions…");

            try {
                const res = await fetch("/api/admin/check", {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "x-user-id": user.id,
                    },
                });

                const checkData = await res.json();

                if (res.ok && checkData.isAdmin) {
                    // User is workspace admin → redirect to admin panel
                    setSuccess("Welcome back, Admin! Redirecting…");
                    setTimeout(() => router.push("/admin"), 800);
                } else {
                    // Regular user → redirect to dashboard
                    setSuccess("Welcome back! Redirecting…");
                    setTimeout(() => router.push("/dashboard"), 800);
                }
            } catch (checkError) {
                // If admin check fails, default to dashboard
                console.warn("Admin check failed, defaulting to dashboard:", checkError);
                setSuccess("Welcome back! Redirecting…");
                setTimeout(() => router.push("/dashboard"), 800);
            }
        } catch (err) {
            setError(err.message || "Invalid email or password.");
        } finally {
            if (!isSuperAdmin) {
                setLoading(false);
            }
        }
    };

    return (
        <>
            <style>{css}</style>
            <div className="login-root">

                {/* ── LEFT ── */}
                <div className="left-panel">
                    <div className="left-logo">
                        <Image src={logo} alt="CodFlow OS" height={42} style={{ width: "auto" }} />
                    </div>

                    <div className="left-headline">
                        <div className="left-eyebrow"><Zap size={11} /> Welcome back</div>
                        <h2 className="left-h2">
                            Back to your<br />
                            command<br />
                            <span>center.</span>
                        </h2>
                        <p className="left-sub">
                            Everything you need to run your COD store — orders, team, stock, and profit — in one place.
                        </p>
                    </div>

                    <div className="left-stats">
                        {[
                            { Icon: Package, label: "Orders Tracked Today", val: "3,820", badge: "Live" },
                            { Icon: TrendingUp, label: "Avg. Confirmation Rate", val: "91.4%", badge: "This week" },
                            { Icon: ShieldCheck, label: "Platform Uptime", val: "99.9%", badge: "Guaranteed" },
                        ].map(({ Icon, label, val, badge }) => (
                            <div key={label} className="stat-card">
                                <div className="stat-card-left">
                                    <div className="stat-icon"><Icon size={16} /></div>
                                    <div>
                                        <div className="stat-label">{label}</div>
                                        <div className="stat-val">{val}</div>
                                    </div>
                                </div>
                                <div className="stat-badge">{badge}</div>
                            </div>
                        ))}

                        <div className="left-trust">
                            <ShieldCheck size={13} />
                            Bank-grade encryption &amp; GDPR compliant
                        </div>
                    </div>
                </div>

                {/* ── RIGHT ── */}
                <div className="right-panel">
                    <div className="fade-in" style={{ maxWidth: 420, width: "100%", margin: "0 auto" }}>

                        <div className="right-header">
                            <div className="right-eyebrow"><Zap size={11} /> Secure login</div>
                            <h2 className="right-h2">Sign in to<br />your workspace</h2>
                            <p className="right-sub">Enter your credentials to access your CodFlow OS dashboard.</p>
                        </div>

                        <form onSubmit={handleLogin}>
                            <div className="field-group">

                                {/* Email */}
                                <div>
                                    <label className="field-label">Email Address</label>
                                    <div className="field-wrap">
                                        <div className="field-icon"><Mail size={15} /></div>
                                        <input
                                            className="field-input"
                                            type="email"
                                            name="email"
                                            value={form.email}
                                            onChange={handleChange}
                                            placeholder="jane@yourstore.com"
                                            required
                                            autoComplete="email"
                                        />
                                    </div>
                                </div>

                                {/* Password */}
                                <div>
                                    <label className="field-label">Password</label>
                                    <div className="field-wrap">
                                        <div className="field-icon"><Lock size={15} /></div>
                                        <input
                                            className="field-input has-eye"
                                            type={showPw ? "text" : "password"}
                                            name="password"
                                            value={form.password}
                                            onChange={handleChange}
                                            placeholder="Your password"
                                            required
                                            autoComplete="current-password"
                                        />
                                        <button type="button" className="field-eye" onClick={() => setShowPw(p => !p)} tabIndex={-1}>
                                            {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                                        </button>
                                    </div>
                                </div>

                            </div>

                            {/* Remember + Forgot */}
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                                <label className="remember-row" style={{ marginBottom: 0 }}>
                                    <input
                                        type="checkbox"
                                        className="remember-checkbox"
                                        checked={remember}
                                        onChange={e => setRemember(e.target.checked)}
                                    />
                                    <span className="remember-label">Remember me</span>
                                </label>
                                <a href="/forgot-password" className="forgot-link">Forgot password?</a>
                            </div>

                            {/* Alerts */}
                            {error && (
                                <div className="alert error">
                                    <AlertCircle size={15} />
                                    {error}
                                </div>
                            )}
                            {success && (
                                <div className={`alert ${isSuperAdmin ? "admin" : "success"}`}>
                                    {isSuperAdmin ? (
                                        <ShieldCheck size={15} />
                                    ) : (
                                        <CheckCircle2 size={15} />
                                    )}
                                    {success}
                                </div>
                            )}

                            {!success && (
                                <button className="btn-login" disabled={loading}>
                                    {loading ? (
                                        <><Loader2 size={16} className="spin" /> Signing in…</>
                                    ) : (
                                        <>Sign In <ArrowRight size={16} /></>
                                    )}
                                </button>
                            )}
                        </form>

                        <p className="register-link">
                            Don&apos;t have an account?{" "}
                            <a href="/register">Create one free</a>
                        </p>

                    </div>
                </div>

            </div>
        </>
    );
}