"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import Image from "next/image";
import logo from "@/assets/logo.png";

import {
  User,
  Building2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  ShieldCheck,
  TrendingUp,
  Package,
  Zap,
  AlertCircle,
  Loader2,
  ChevronRight,
  ArrowRight,
  Star,
  Users,
  Globe,
  CreditCard,
  Sparkles,
  Rocket,
  ShoppingCart,
  BarChart3,
  Truck,
  Headphones,
  BadgeCheck,
  X,
  Phone,
} from "lucide-react";

/* ───────────────── CSS ───────────────── */
const css = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=Instrument+Sans:wght@300;400;500;600;700&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg: #0a0b0f;
  --card-bg: #111318;
  --card-border: rgba(255,255,255,0.06);
  --input-bg: rgba(255,255,255,0.04);
  --input-border: rgba(255,255,255,0.08);
  --text: #ffffff;
  --text-secondary: #a1a5b0;
  --text-muted: #6b7080;
  --accent: #10b981;
  --accent-hover: #059669;
  --accent-glow: rgba(16,185,129,0.25);
  --error: #ef4444;
  --error-bg: rgba(239,68,68,0.1);
  --success: #10b981;
  --success-bg: rgba(16,185,129,0.1);
  --gradient-1: linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%);
  --gradient-2: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%);
  --gradient-3: linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%);
  --gradient-dark: linear-gradient(180deg, rgba(16,185,129,0.05) 0%, transparent 50%);
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-20px); }
}

@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 20px rgba(16,185,129,0.1); }
  50% { box-shadow: 0 0 40px rgba(16,185,129,0.2); }
}

@keyframes slide-in {
  from { opacity: 0; transform: translateX(20px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes fade-in-up {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes gradient-shift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.animate-float { animation: float 6s ease-in-out infinite; }
.animate-pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }
.animate-slide-in { animation: slide-in 0.5s ease-out; }
.animate-fade-in-up { animation: fade-in-up 0.4s ease-out; }
.animate-spin { animation: spin 1s linear infinite; }

.reg-root {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  background: var(--bg);
  font-family: 'Instrument Sans', sans-serif;
  position: relative;
  overflow: hidden;
}

.reg-root::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: 
    radial-gradient(circle at 20% 50%, rgba(16,185,129,0.03) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(99,102,241,0.03) 0%, transparent 50%),
    radial-gradient(circle at 50% 80%, rgba(245,158,11,0.02) 0%, transparent 50%);
  pointer-events: none;
}

/* LEFT PANEL */
.left-panel {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 80px 80px 80px 100px;
  background: rgba(255,255,255,0.01);
  border-right: 1px solid rgba(255,255,255,0.04);
  overflow: hidden;
}

.left-panel::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--gradient-dark);
  pointer-events: none;
}

.left-content {
  position: relative;
  z-index: 1;
  max-width: 560px;
}

.brand-section {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 48px;
}

.brand-icon {
  width: 44px;
  height: 44px;
  background: var(--gradient-1);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 32px var(--accent-glow);
}

.main-headline {
  font-family: 'Syne', sans-serif;
  font-size: 48px;
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -1.5px;
  color: var(--text);
  margin-bottom: 20px;
}

.main-headline span {
  background: var(--gradient-1);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.sub-headline {
  font-size: 17px;
  color: var(--text-secondary);
  line-height: 1.7;
  margin-bottom: 48px;
}

.features-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.feature-card {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 16px;
  padding: 20px;
  transition: all 0.3s ease;
  cursor: default;
}

.feature-card:hover {
  background: rgba(255,255,255,0.05);
  border-color: rgba(16,185,129,0.2);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.2);
}

.feature-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
}

.feature-title {
  font-family: 'Syne', sans-serif;
  font-size: 14px;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 6px;
}

.feature-desc {
  font-size: 12px;
  color: var(--text-muted);
  line-height: 1.5;
}

.stats-row {
  display: flex;
  gap: 32px;
  margin-top: 48px;
  padding-top: 32px;
  border-top: 1px solid rgba(255,255,255,0.06);
}

.stat-item {
  text-align: left;
}

.stat-value {
  font-family: 'Syne', sans-serif;
  font-size: 28px;
  font-weight: 800;
  color: var(--text);
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* RIGHT PANEL */
.right-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 80px 60px;
  position: relative;
}

.card {
  width: 100%;
  max-width: 440px;
  animation: fade-in-up 0.5s ease-out;
}

.card-header {
  text-align: center;
  margin-bottom: 36px;
}

.card-icon {
  width: 56px;
  height: 56px;
  background: var(--gradient-1);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  box-shadow: 0 8px 32px var(--accent-glow);
}

.card-title {
  font-family: 'Syne', sans-serif;
  font-size: 28px;
  font-weight: 800;
  color: var(--text);
  margin-bottom: 8px;
  letter-spacing: -0.5px;
}

.card-subtitle {
  font-size: 14px;
  color: var(--text-muted);
  line-height: 1.5;
}

.card-subtitle a {
  color: var(--accent);
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s;
}

.card-subtitle a:hover {
  color: var(--accent-hover);
}

.input-group {
  margin-bottom: 16px;
}

.input-label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.input-wrapper {
  position: relative;
}

.input-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
  pointer-events: none;
}

.input-field {
  width: 100%;
  padding: 13px 14px 13px 42px;
  background: var(--input-bg);
  border: 1px solid var(--input-border);
  border-radius: 12px;
  color: var(--text);
  font-family: 'Instrument Sans', sans-serif;
  font-size: 14px;
  transition: all 0.2s ease;
  outline: none;
}

.input-field::placeholder {
  color: var(--text-muted);
  opacity: 0.6;
}

.input-field:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(16,185,129,0.1);
  background: rgba(255,255,255,0.06);
}

.password-toggle {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
  cursor: pointer;
  transition: color 0.2s;
  background: none;
  border: none;
  padding: 4px;
}

.password-toggle:hover {
  color: var(--text-secondary);
}

.row-fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.alert {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-radius: 12px;
  margin-bottom: 16px;
  font-size: 13px;
  font-weight: 500;
  animation: fade-in-up 0.3s ease-out;
}

.alert-error {
  background: var(--error-bg);
  color: var(--error);
  border: 1px solid rgba(239,68,68,0.2);
}

.alert-success {
  background: var(--success-bg);
  color: var(--success);
  border: 1px solid rgba(16,185,129,0.2);
}

.submit-btn {
  width: 100%;
  padding: 14px;
  background: var(--gradient-1);
  background-size: 200% 200%;
  animation: gradient-shift 3s ease infinite;
  color: white;
  border: none;
  border-radius: 12px;
  font-family: 'Syne', sans-serif;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 0 4px 24px var(--accent-glow);
  position: relative;
  overflow: hidden;
}

.submit-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
  transition: left 0.5s;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 32px var(--accent-glow);
}

.submit-btn:hover:not(:disabled)::before {
  left: 100%;
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  animation: none;
}

.terms-text {
  text-align: center;
  margin-top: 24px;
  font-size: 12px;
  color: var(--text-muted);
  line-height: 1.6;
}

.terms-text a {
  color: var(--accent);
  text-decoration: none;
  font-weight: 600;
}

.terms-text a:hover {
  text-decoration: underline;
}

.password-strength {
  display: flex;
  gap: 4px;
  margin-top: 8px;
}

.strength-bar {
  flex: 1;
  height: 3px;
  border-radius: 2px;
  background: rgba(255,255,255,0.08);
  transition: background 0.3s;
}

.strength-bar.active {
  background: var(--accent);
}

.strength-bar.medium {
  background: #f59e0b;
}

.strength-bar.weak {
  background: var(--error);
}

@media (max-width: 1024px) {
  .reg-root { grid-template-columns: 1fr; }
  .left-panel { display: none; }
  .right-panel { padding: 40px 24px; }
  .card { max-width: 100%; }
  .row-fields { grid-template-columns: 1fr; }
}
`;

/* ───────────────── PAGE ───────────────── */
export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    companyName: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const handleChange = (e) => {
    setError("");
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const getPasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;
    if (password.match(/[0-9]/)) strength++;
    if (password.match(/[^a-zA-Z0-9]/)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(form.password);

  const handleRegister = async () => {
    setError("");
    setSuccess("");

    if (!form.fullName || !form.email || !form.companyName || !form.password) {
      return setError("Please fill in all required fields");
    }

    if (form.password.length < 8) {
      return setError("Password must be at least 8 characters");
    }

    if (form.password !== form.confirmPassword) {
      return setError("Passwords do not match");
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            full_name: form.fullName,
            company_name: form.companyName,
            phone: form.phone,
          },
        },
      });

      if (error) throw error;

      const user = data?.user;
      if (!user) throw new Error("User creation failed");

      const { data: tenant, error: tenantError } = await supabase
        .from("tenants")
        .insert({
          name: form.companyName,
          plan: "starter",
        })
        .select()
        .single();

      if (tenantError) throw tenantError;

      const { error: profileError } = await supabase
        .from("user_profiles")
        .insert({
          id: user.id,
          tenant_id: tenant.id,
          full_name: form.fullName,
          role: "owner",
        });

      if (profileError) throw profileError;

      setSuccess("Account created successfully! Redirecting to login...");
      setTimeout(() => router.push("/login"), 2000);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: ShoppingCart,
      title: "Order Management",
      desc: "Real-time tracking & smart automation",
      color: "#10b981",
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      desc: "Profit breakdowns & ROI tracking",
      color: "#6366f1",
    },
    {
      icon: Users,
      title: "Team Collaboration",
      desc: "Role-based access & live leaderboards",
      color: "#f59e0b",
    },
    {
      icon: Truck,
      title: "Shipping Control",
      desc: "Multi-carrier with tracking automation",
      color: "#8b5cf6",
    },
  ];

  return (
    <>
      <style>{css}</style>

      <div className="reg-root">
        {/* LEFT PANEL */}
        <div className="left-panel">
          <div className="left-content">
            {/* Brand */}
            <div className="brand-section">
              <div className="brand-icon">
                <Zap size={20} className="text-white" />
              </div>
              <div>
                <span style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 800, color: "white" }}>
                  Cod<span style={{ color: "#10b981" }}>Track</span>
                </span>
                <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>COD Ecommerce OS</p>
              </div>
            </div>

            {/* Headline */}
            <h1 className="main-headline">
              Build Your<br />
              <span>Store Empire</span>
            </h1>
            <p className="sub-headline">
              Join 2,500+ ecommerce sellers who use CodTrack to manage orders,
              track profits, and scale their COD business from one powerful dashboard.
            </p>

            {/* Features Grid */}
            <div className="features-grid">
              {features.map((feature, i) => (
                <div key={i} className="feature-card">
                  <div
                    className="feature-icon"
                    style={{ background: `${feature.color}15` }}
                  >
                    <feature.icon size={18} style={{ color: feature.color }} />
                  </div>
                  <div className="feature-title">{feature.title}</div>
                  <div className="feature-desc">{feature.desc}</div>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="stats-row">
              <div className="stat-item">
                <div className="stat-value" style={{ color: "#10b981" }}>2.5K+</div>
                <div className="stat-label">Active Sellers</div>
              </div>
              <div className="stat-item">
                <div className="stat-value" style={{ color: "#6366f1" }}>1M+</div>
                <div className="stat-label">Orders Processed</div>
              </div>
              <div className="stat-item">
                <div className="stat-value" style={{ color: "#f59e0b" }}>99.9%</div>
                <div className="stat-label">Uptime SLA</div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="right-panel">
          <div className="card">
            {/* Header */}
            <div className="card-header">
              <div className="card-icon">
                <Sparkles size={24} className="text-white" />
              </div>
              <h2 className="card-title">Create Your Account</h2>
              <p className="card-subtitle">
                Already have an account?{" "}
                <a href="/login">Sign in →</a>
              </p>
            </div>

            {/* Alerts */}
            {error && (
              <div className="alert alert-error">
                <AlertCircle size={16} />
                <span>{error}</span>
                <button
                  onClick={() => setError("")}
                  style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "var(--error)" }}
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {success && (
              <div className="alert alert-success">
                <CheckCircle2 size={16} />
                <span>{success}</span>
              </div>
            )}

            {/* Form */}
            {step === 1 ? (
              <>
                <div className="input-group">
                  <label className="input-label">Full Name *</label>
                  <div className="input-wrapper">
                    <User size={16} className="input-icon" />
                    <input
                      className="input-field"
                      name="fullName"
                      placeholder="John Doe"
                      value={form.fullName}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="row-fields">
                  <div className="input-group">
                    <label className="input-label">Email *</label>
                    <div className="input-wrapper">
                      <Mail size={16} className="input-icon" />
                      <input
                        className="input-field"
                        name="email"
                        type="email"
                        placeholder="john@company.com"
                        value={form.email}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="input-group">
                    <label className="input-label">Phone</label>
                    <div className="input-wrapper">
                      <Phone size={16} className="input-icon" />
                      <input
                        className="input-field"
                        name="phone"
                        placeholder="+212 600000000"
                        value={form.phone}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">Company Name *</label>
                  <div className="input-wrapper">
                    <Building2 size={16} className="input-icon" />
                    <input
                      className="input-field"
                      name="companyName"
                      placeholder="Your Store Name"
                      value={form.companyName}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <button
                  className="submit-btn"
                  onClick={() => setStep(2)}
                  disabled={!form.fullName || !form.email || !form.companyName}
                >
                  Continue
                  <ArrowRight size={18} />
                </button>
              </>
            ) : (
              <>
                <div className="input-group">
                  <label className="input-label">Password *</label>
                  <div className="input-wrapper">
                    <Lock size={16} className="input-icon" />
                    <input
                      className="input-field"
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="Min. 8 characters"
                      value={form.password}
                      onChange={handleChange}
                    />
                    <button
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {form.password && (
                    <div className="password-strength">
                      {[1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className={`strength-bar ${passwordStrength >= level
                              ? level <= 2
                                ? "weak"
                                : level === 3
                                  ? "medium"
                                  : "active"
                              : ""
                            }`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div className="input-group">
                  <label className="input-label">Confirm Password *</label>
                  <div className="input-wrapper">
                    <CheckCircle2 size={16} className="input-icon" />
                    <input
                      className="input-field"
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      placeholder="Re-enter password"
                      value={form.confirmPassword}
                      onChange={handleChange}
                    />
                    <button
                      className="password-toggle"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 12 }}>
                  <button
                    onClick={() => setStep(1)}
                    style={{
                      padding: "14px 24px",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 12,
                      color: "var(--text-secondary)",
                      fontFamily: "'Syne',sans-serif",
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                    }}
                  >
                    Back
                  </button>
                  <button
                    className="submit-btn"
                    onClick={handleRegister}
                    disabled={loading || !form.password || !form.confirmPassword}
                    style={{ flex: 1 }}
                  >
                    {loading ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <>
                        Create Account
                        <Rocket size={18} />
                      </>
                    )}
                  </button>
                </div>
              </>
            )}

            <p className="terms-text">
              By creating an account, you agree to our{" "}
              <a href="/terms">Terms of Service</a> and{" "}
              <a href="/privacy">Privacy Policy</a>
            </p>

            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              justifyContent: "center",
              marginTop: 20,
              padding: "12px 16px",
              background: "rgba(16,185,129,0.05)",
              border: "1px solid rgba(16,185,129,0.1)",
              borderRadius: 12,
            }}>
              <BadgeCheck size={16} style={{ color: "var(--accent)" }} />
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                <strong style={{ color: "var(--accent)" }}>14-day free trial</strong> · No credit card required
              </span>
            </div>

            {/* Step indicators */}
            <div style={{
              display: "flex",
              justifyContent: "center",
              gap: 8,
              marginTop: 24,
            }}>
              {[1, 2].map((s) => (
                <div
                  key={s}
                  style={{
                    width: s === step ? 24 : 8,
                    height: 8,
                    borderRadius: 4,
                    background: s === step ? "var(--gradient-1)" : "rgba(255,255,255,0.1)",
                    transition: "all 0.3s ease",
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}