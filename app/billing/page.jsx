"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import logo from "@/assets/logo.png";
import {
    Check,
    X,
    Clock,
    Shield,
    RefreshCw,
    Phone,
    Zap,
    Star,
    ChevronLeft,
    Menu,
    Sparkles,
    TrendingUp,
    Users,
    Globe,
    BarChart3,
    Truck,
    FileSpreadsheet,
    Calculator,
    UserCheck,
    Store,
    ArrowRight,
    BadgePercent,
    Crown,
    Rocket,
    ShieldCheck,
    Headphones,
    CreditCard
} from "lucide-react";

const useInView = (threshold = 0.1) => {
    const ref = useRef(null);
    const [inView, setInView] = useState(false);
    useEffect(() => {
        const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
        if (ref.current) obs.observe(ref.current);
        return () => obs.disconnect();
    }, []);
    return [ref, inView];
};

const CheckIcon = () => (
    <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#00c8531f", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Check size={14} color="#00a844" strokeWidth={2.5} />
    </div>
);

const CrossIcon = () => (
    <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#f1f5f1", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <X size={13} color="#b0c4b8" strokeWidth={2.5} />
    </div>
);

export default function BillingPage() {
    const [scrollY, setScrollY] = useState(0);
    const [hoveredPlan, setHoveredPlan] = useState(1);
    const [timerSecs, setTimerSecs] = useState(23 * 60 + 47);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrollY(window.scrollY);
        window.addEventListener("scroll", onScroll);
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    useEffect(() => {
        const t = setInterval(() => setTimerSecs(s => s > 0 ? s - 1 : 0), 1000);
        return () => clearInterval(t);
    }, []);

    const mins = String(Math.floor(timerSecs / 60)).padStart(2, "0");
    const secs = String(timerSecs % 60).padStart(2, "0");

    const [heroRef, heroInView] = useInView(0.1);
    const [plansRef, plansInView] = useInView(0.05);
    const [faqRef, faqInView] = useInView(0.1);
    const [ctaRef, ctaInView] = useInView(0.1);

    const [openFaq, setOpenFaq] = useState(null);

    const plans = [
        {
            id: 0,
            name: "البداية",
            nameEn: "Starter",
            price: 19,
            period: "شهر",
            periodSub: "شهرياً",
            saving: null,
            savingPct: null,
            badge: null,
            icon: Rocket,
            desc: "مثالي لمن يريد يبدأ وينظم متجره من أول يوم.",
            color: "#00a844",
            gradient: "linear-gradient(135deg,#e8f8ef 0%,#f8fdf9 100%)",
            borderColor: "#c8ecd5",
            accentBg: "#f0faf4",
            features: [
                { text: "إدارة حتى 500 طلب شهرياً", ok: true },
                { text: "إدارة المنتجات", ok: true },
                { text: "تقارير أساسية", ok: true },
                { text: "دعم واحد على واحد", ok: true },
                { text: "تكامل مع شركة شحن واحدة", ok: true },
                { text: "تكامل Google Sheets", ok: false },
                { text: "محاكي نقطة التعادل", ok: false },
                { text: "إدارة الفريق", ok: false },
                { text: "تكاملات متعددة للمتاجر", ok: false },
            ],
            cta: "ابدأ مجاناً",
            ctaStyle: "outline",
        },
        {
            id: 1,
            name: "النمو",
            nameEn: "Growth",
            price: 49,
            period: "3 أشهر",
            periodSub: "كل 3 أشهر",
            saving: "وفّر 8$",
            savingPct: "14%",
            badge: "الأكثر شعبية",
            badgeIcon: Sparkles,
            icon: TrendingUp,
            desc: "للبائع الجاد اللي يريد يوسع ويشوف أرباحه ترتفع.",
            color: "#00843d",
            gradient: "linear-gradient(135deg,#00a844 0%,#00c853 60%,#00e676 100%)",
            borderColor: "#00c853",
            accentBg: "rgba(255,255,255,0.15)",
            textColor: "#fff",
            features: [
                { text: "طلبات غير محدودة", ok: true },
                { text: "إدارة المنتجات الكاملة", ok: true },
                { text: "تقارير متقدمة + P&L", ok: true },
                { text: "دعم أولوية 24/7", ok: true },
                { text: "كل شركات الشحن", ok: true },
                { text: "تكامل Google Sheets", ok: true },
                { text: "محاكي نقطة التعادل", ok: true },
                { text: "إدارة الفريق حتى 5 أعضاء", ok: true },
                { text: "تكاملات متعددة للمتاجر", ok: false },
            ],
            cta: "اشترك الآن",
            ctaStyle: "white",
        },
        {
            id: 2,
            name: "الاحتراف",
            nameEn: "Pro",
            price: 98,
            period: "6 أشهر",
            periodSub: "كل 6 أشهر",
            saving: "وفّر 16$",
            savingPct: "25%",
            badge: "الأفضل قيمة",
            badgeIcon: Crown,
            icon: Globe,
            desc: "للمحترفين اللي يديرون أعمالاً كبيرة ويريدون كل شيء.",
            color: "#00a844",
            gradient: "linear-gradient(135deg,#e8f8ef 0%,#f0faf4 100%)",
            borderColor: "#00c853",
            accentBg: "#f0faf4",
            features: [
                { text: "طلبات غير محدودة", ok: true },
                { text: "إدارة المنتجات الكاملة", ok: true },
                { text: "تقارير متقدمة + P&L كاملة", ok: true },
                { text: "مدير حساب خاص", ok: true },
                { text: "كل شركات الشحن", ok: true },
                { text: "تكامل Google Sheets", ok: true },
                { text: "محاكي نقطة التعادل", ok: true },
                { text: "فريق غير محدود", ok: true },
                { text: "تكاملات متعددة للمتاجر", ok: true },
            ],
            cta: "احصل على أفضل صفقة",
            ctaStyle: "outline",
        },
    ];

    const faqs = [
        { q: "هل يمكنني إلغاء الاشتراك في أي وقت؟", a: "نعم بالكامل. لا توجد عقود أو رسوم إلغاء مخفية. يمكنك إلغاء اشتراكك بضغطة زر واحدة من لوحة التحكم." },
        { q: "هل هناك فترة تجريبية مجانية؟", a: "نعم! جميع الخطط تأتي مع 14 يوم مجاناً بدون بطاقة بنكية. جرّب المنصة كاملاً ثم قرر." },
        { q: "ماذا يحدث لبياناتي إذا غيّرت الخطة؟", a: "بياناتك محفوظة دائماً. عند الترقية أو التخفيض لا تفقد أي بيانات أو طلبات سابقة." },
        { q: "هل الدفع آمن؟", a: "نعم. نستخدم تشفير SSL 256-bit وبوابات دفع معتمدة دولياً. بياناتك المالية لا تُخزَّن على خوادمنا أبداً." },
        { q: "هل يمكنني الترقية بين الخطط؟", a: "بالطبع! يمكنك الترقية في أي وقت وسيُحتسب الفرق تلقائياً. ترقية فورية بدون انتظار." },
    ];

    const testimonials = [
        { name: "محمد الحسيني", plan: "خطة النمو", text: "وفّرت خطة الـ 3 أشهر فلوساً كثيرة. الـ CRM حوّل متجري من الفوضى إلى نظام محكم.", stars: 5 },
        { name: "فاطمة الزهراء", plan: "خطة الاحتراف", text: "الخطة الـ 6 أشهر أحسن قرار اتخذته. الاستثمار رجع خلال أسبوعين فقط.", stars: 5 },
        { name: "يوسف بنعلي", plan: "خطة البداية", text: "بدأت بخطة البداية وبعد شهر رقيت. المنصة تستاهل كل سنت.", stars: 5 },
    ];

    const trustIndicators = [
        { icon: CreditCard, label: "دفع آمن 100%" },
        { icon: RefreshCw, label: "استرداد خلال 14 يوم" },
        { icon: Headphones, label: "دعم عربي 24/7" },
        { icon: Zap, label: "تفعيل فوري" },
    ];

    return (
        <div dir="rtl" style={{ fontFamily: "'Tajawal','Cairo',sans-serif", background: "#fff", color: "#0f1f14", overflowX: "hidden", minHeight: "100vh" }}>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800;900&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        html{scroll-behavior:smooth;}
        ::-webkit-scrollbar{width:5px;}
        ::-webkit-scrollbar-track{background:#f0faf4;}
        ::-webkit-scrollbar-thumb{background:#00c853;border-radius:3px;}

        .slide-up{opacity:0;transform:translateY(40px);transition:all 0.75s cubic-bezier(0.16,1,0.3,1);}
        .slide-up.visible{opacity:1;transform:translateY(0);}
        .stagger-1{transition-delay:0.08s;}
        .stagger-2{transition-delay:0.18s;}
        .stagger-3{transition-delay:0.28s;}

        @keyframes float{0%,100%{transform:translateY(0);}50%{transform:translateY(-8px);}}
        @keyframes ping{0%{transform:scale(1);opacity:1;}75%,100%{transform:scale(2);opacity:0;}}
        @keyframes scroll-x{0%{transform:translateX(0);}100%{transform:translateX(-50%);}}
        @keyframes pulse-border{0%,100%{box-shadow:0 0 0 0 rgba(0,200,83,0.4);}50%{box-shadow:0 0 0 8px rgba(0,200,83,0);}}
        @keyframes shimmer{0%{background-position:-200% center;}100%{background-position:200% center;}}
        @keyframes count-up{from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:translateY(0);}}
        @keyframes icon-pop{0%{transform:scale(0);opacity:0;}60%{transform:scale(1.2);opacity:1;}100%{transform:scale(1);opacity:1;}}

        .float{animation:float 5s ease-in-out infinite;}
        .ping{animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;}
        .pulse-border{animation:pulse-border 2.5s ease-in-out infinite;}
        .icon-pop{animation:icon-pop 0.5s cubic-bezier(0.16,1,0.3,1) forwards;}

        .plan-card{
          border-radius:28px; transition:all 0.45s cubic-bezier(0.16,1,0.3,1);
          cursor:default; position:relative; overflow:hidden;
        }
        .plan-card:hover{transform:translateY(-8px);}
        .plan-card.popular{transform:scale(1.04);}
        .plan-card.popular:hover{transform:scale(1.04) translateY(-8px);}

        .badge-pill{
          display:inline-flex;align-items:center;gap:6px;
          padding:6px 16px;border-radius:50px;font-size:0.8rem;font-weight:800;
          font-family:'Tajawal',sans-serif;letter-spacing:0.3px;
        }
        .btn-white{
          background:#fff;color:#00843d;border:none;border-radius:50px;
          padding:16px 32px;font-size:1.05rem;font-weight:800;
          font-family:'Tajawal',sans-serif;cursor:pointer;width:100%;
          transition:all 0.3s;box-shadow:0 6px 24px rgba(0,0,0,0.12);
          display:flex;align-items:center;justify-content:center;gap:8px;
        }
        .btn-white:hover{transform:translateY(-2px);box-shadow:0 12px 32px rgba(0,0,0,0.18);}
        .btn-green{
          background:linear-gradient(135deg,#00a844,#00c853);color:#fff;
          border:none;border-radius:50px;padding:16px 32px;font-size:1.05rem;
          font-weight:800;font-family:'Tajawal',sans-serif;cursor:pointer;width:100%;
          transition:all 0.3s;box-shadow:0 8px 24px rgba(0,168,68,0.35);
          display:flex;align-items:center;justify-content:center;gap:8px;
        }
        .btn-green:hover{transform:translateY(-2px);box-shadow:0 16px 40px rgba(0,168,68,0.5);}
        .btn-outline-green{
          background:transparent;color:#00843d;
          border:2px solid #00c853;border-radius:50px;padding:15px 32px;
          font-size:1.05rem;font-weight:800;font-family:'Tajawal',sans-serif;
          cursor:pointer;width:100%;transition:all 0.3s;
          display:flex;align-items:center;justify-content:center;gap:8px;
        }
        .btn-outline-green:hover{background:#f0faf4;transform:translateY(-2px);}

        .feature-row{display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid;}
        .feature-row:last-child{border-bottom:none;}

        .urgency-bar{
          background:linear-gradient(135deg,#00843d,#00c853);
          color:#fff;text-align:center;padding:12px 20px;
          font-weight:700;font-size:0.92rem;font-family:'Tajawal',sans-serif;
          letter-spacing:0.2px;
        }
        .timer-box{
          display:inline-flex;align-items:center;gap:6px;
          background:rgba(255,255,255,0.2);border-radius:8px;
          padding:4px 12px;font-weight:900;font-size:1rem;
          border:1px solid rgba(255,255,255,0.3);margin:0 8px;
        }

        .social-proof-bar{
          overflow:hidden;background:#f8fdf9;
          border-top:1px solid #e6f4ec;border-bottom:1px solid #e6f4ec;
          padding:12px 0;
        }
        .social-proof-track{
          display:flex;animation:scroll-x 25s linear infinite;width:max-content;
        }

        .guarantee-box{
          background:linear-gradient(135deg,#f0faf4,#e8f8ef);
          border:2px solid #c8ecd5;border-radius:20px;
          padding:32px 36px;text-align:center;
        }

        .faq-item{
          border:1.5px solid #e6f4ec;border-radius:16px;
          overflow:hidden;transition:all 0.3s;margin-bottom:12px;
        }
        .faq-item:hover{border-color:#00c853;}
        .faq-q{
          padding:20px 24px;cursor:pointer;display:flex;
          justify-content:space-between;align-items:center;
          font-weight:700;font-size:1rem;color:#0f1f14;
          background:#fff;gap:12px;
        }
        .faq-a{
          padding:0 24px 20px;color:#4a6e55;line-height:1.85;
          font-size:0.97rem;background:#f8fdf9;
        }

        .comparison-row{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:0;border-bottom:1px solid #e6f4ec;}
        .comparison-row:last-child{border-bottom:none;}
        .comparison-cell{padding:16px 20px;display:flex;align-items:center;justify-content:center;font-size:0.97rem;}
        .comparison-cell.label{justify-content:flex-start;font-weight:600;color:#2d4a36;}
        .comparison-header-cell{padding:20px;text-align:center;font-weight:800;font-size:1rem;}

        .nav-link{color:#2d4a36;text-decoration:none;font-weight:600;font-size:1rem;transition:color 0.2s;}
        .nav-link:hover{color:#00a844;}

        .shimmer-text{
          background:linear-gradient(90deg,#00843d 0%,#00c853 40%,#00e676 60%,#00843d 100%);
          background-size:200% auto;animation:shimmer 3s linear infinite;
          -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
        }

        @media(max-width:900px){
          .plans-grid{grid-template-columns:1fr !important;}
          .plan-card.popular{transform:none;}
          .comparison-table{display:none !important;}
          .testi-grid{grid-template-columns:1fr !important;}
        }
        @media(max-width:768px){
          .nav-links-desktop{display:none !important;}
          .urgency-bar{font-size:0.82rem;}
          .mobile-menu-btn{display:block !important;}
        }
      `}</style>

            {/* ── URGENCY BAR ── */}
            <div className="urgency-bar">
                <Zap size={16} style={{ display: "inline-block", verticalAlign: "middle", marginLeft: "4px" }} />
                عرض محدود — وفّر حتى 25% على الخطط السنوية!
                <span className="timer-box">
                    <Clock size={16} style={{ display: "inline-block", verticalAlign: "middle" }} />
                    {mins}:{secs}
                </span>
                ينتهي العرض قريباً
            </div>

            {/* ── NAVBAR ── */}
            <nav style={{
                position: "sticky", top: 0, zIndex: 100, padding: "0 5%", height: "70px",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                background: scrollY > 10 ? "rgba(255,255,255,0.97)" : "#fff",
                backdropFilter: "blur(16px)", borderBottom: "1px solid #e6f4ec",
                boxShadow: scrollY > 10 ? "0 2px 20px rgba(0,168,68,0.08)" : "none",
                transition: "all 0.3s",
            }}>
                <Link href="/" style={{ textDecoration: "none" }}>
                    <img src={logo.src} alt="شعار" style={{ height: 38, width: "auto", objectFit: "contain" }} />
                </Link>
                <div className="nav-links-desktop" style={{ display: "flex", gap: "32px" }}>
                    <Link href="/" className="nav-link">الرئيسية</Link>
                    <Link href="/#features" className="nav-link">المميزات</Link>
                    <Link href="/billing" className="nav-link" style={{ color: "#00843d" }}>الأسعار</Link>
                </div>
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <Link href="/login" style={{ textDecoration: "none" }}>
                        <button style={{ background: "transparent", color: "#00843d", border: "2px solid #c8ecd5", borderRadius: "50px", padding: "9px 22px", fontSize: "0.92rem", fontWeight: 700, fontFamily: "'Tajawal',sans-serif", cursor: "pointer", transition: "all 0.3s" }}>دخول</button>
                    </Link>
                    <Link href="/register" style={{ textDecoration: "none" }}>
                        <button style={{ background: "linear-gradient(135deg,#00a844,#00c853)", color: "#fff", border: "none", borderRadius: "50px", padding: "9px 22px", fontSize: "0.92rem", fontWeight: 800, fontFamily: "'Tajawal',sans-serif", cursor: "pointer", boxShadow: "0 4px 16px rgba(0,168,68,0.3)", transition: "all 0.3s" }}>ابدأ مجاناً</button>
                    </Link>
                    <button
                        className="mobile-menu-btn"
                        style={{ display: "none", background: "none", border: "none", cursor: "pointer", padding: "4px" }}
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        <Menu size={24} color="#00843d" />
                    </button>
                </div>
            </nav>

            {/* ── SOCIAL PROOF TICKER ── */}
            <div className="social-proof-bar">
                <div className="social-proof-track">
                    {[
                        "🟢 أحمد من الدار البيضاء اشترك للتو في خطة النمو",
                        "🟢 سارة من دبي وفّرت 8$ باختيار الخطة الفصلية",
                        "🟢 كريم من الجزائر حقق 94% نسبة توصيل بعد أسبوع",
                        "🟢 محمد من الرياض رقّى خطته من البداية للاحتراف",
                        "🟢 فاطمة من تونس ادارت 1200 طلب في الشهر الأول",
                        "🟢 أحمد من الدار البيضاء اشترك للتو في خطة النمو",
                        "🟢 سارة من دبي وفّرت 8$ باختيار الخطة الفصلية",
                        "🟢 كريم من الجزائر حقق 94% نسبة توصيل بعد أسبوع",
                        "🟢 محمد من الرياض رقّى خطته من البداية للاحتراف",
                        "🟢 فاطمة من تونس ادارت 1200 طلب في الشهر الأول",
                    ].map((t, i) => (
                        <span key={i} style={{ padding: "0 48px", color: "#2d4a36", fontWeight: 600, fontSize: "0.88rem", whiteSpace: "nowrap" }}>{t}</span>
                    ))}
                </div>
            </div>

            {/* ── HERO ── */}
            <section ref={heroRef} style={{ padding: "80px 5% 60px", textAlign: "center", background: "linear-gradient(180deg,#f0faf4 0%,#fff 100%)", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle,rgba(0,200,83,0.08) 0%,transparent 70%)", top: "-20%", left: "50%", transform: "translateX(-50%)", pointerEvents: "none" }} />

                <div className={`slide-up ${heroInView ? "visible" : ""}`} style={{ position: "relative", zIndex: 1, maxWidth: "800px", margin: "0 auto" }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "#e8f8ef", border: "1.5px solid #a8ddb8", borderRadius: "50px", padding: "8px 20px", marginBottom: "24px" }}>
                        <span style={{ position: "relative", display: "inline-block" }}>
                            <Zap size={14} color="#00c853" style={{ display: "block" }} />
                            <span style={{ position: "absolute", inset: "-2px", borderRadius: "50%", background: "#00c853" }} className="ping" />
                        </span>
                        <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#00843d" }}>5,000+ بائع نشط يثق بنا</span>
                    </div>

                    <h1 style={{ fontSize: "clamp(2.4rem,5.5vw,4.2rem)", fontWeight: 900, lineHeight: 1.1, marginBottom: "20px", color: "#0f1f14", letterSpacing: "-1px" }}>
                        استثمار واحد يغيّر<br />
                        <span className="shimmer-text">مجرى تجارتك كلياً</span>
                    </h1>
                    <p style={{ fontSize: "clamp(1rem,2vw,1.2rem)", color: "#4a6e55", maxWidth: "580px", margin: "0 auto 16px", lineHeight: 1.8 }}>
                        اختر الخطة المناسبة وابدأ تحكم في طلباتك، أرباحك، وفريقك من لوحة واحدة. كل خطة تأتي مع <strong style={{ color: "#00843d" }}>7 ايام مجاناً.</strong>
                    </p>
                    <p style={{ color: "#7da88a", fontSize: "0.9rem", marginBottom: "0", display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", flexWrap: "wrap" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><Check size={14} color="#00a844" /> بدون بطاقة بنكية</span>
                        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><Check size={14} color="#00a844" /> إلغاء وقتما شئت</span>
                    </p>
                </div>
            </section>

            {/* ── PLANS ── */}
            <section ref={plansRef} style={{ padding: "20px 5% 100px", background: "#fff" }}>
                <div className="plans-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "24px", maxWidth: "1140px", margin: "0 auto", alignItems: "stretch" }}>

                    {plans.map((plan, idx) => {
                        const isPopular = plan.id === 1;
                        const isDark = isPopular;
                        const PlanIcon = plan.icon;

                        return (
                            <div
                                key={plan.id}
                                className={`plan-card slide-up stagger-${idx + 1} ${isPopular ? "popular pulse-border" : ""} ${plansInView ? "visible" : ""}`}
                                onMouseEnter={() => setHoveredPlan(plan.id)}
                                style={{
                                    background: isDark ? plan.gradient : "#fff",
                                    border: isDark ? "none" : `2px solid ${hoveredPlan === plan.id ? "#00c853" : plan.borderColor}`,
                                    boxShadow: isDark
                                        ? "0 32px 80px rgba(0,168,68,0.4), 0 0 0 1px rgba(0,200,83,0.3)"
                                        : hoveredPlan === plan.id
                                            ? "0 20px 60px rgba(0,168,68,0.14)"
                                            : "0 4px 20px rgba(0,0,0,0.06)",
                                    padding: "0",
                                    display: "flex", flexDirection: "column",
                                    zIndex: isPopular ? 2 : 1,
                                }}
                            >
                                {/* Plan header */}
                                <div style={{ padding: "32px 32px 24px" }}>
                                    {plan.badge && (
                                        <div className="badge-pill" style={{
                                            background: isDark ? "rgba(255,255,255,0.2)" : "#e8f8ef",
                                            color: isDark ? "#fff" : "#00843d",
                                            border: isDark ? "1px solid rgba(255,255,255,0.35)" : "1px solid #a8ddb8",
                                            marginBottom: "18px",
                                        }}>
                                            {plan.badgeIcon && <plan.badgeIcon size={14} />}
                                            {plan.badge}
                                        </div>
                                    )}
                                    {!plan.badge && <div style={{ height: "0px", marginBottom: "18px" }} />}

                                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
                                        <PlanIcon size={28} color={isDark ? "#fff" : "#00a844"} style={{ opacity: isDark ? 1 : 0.7 }} />
                                        <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                                            <span style={{ fontSize: "clamp(3rem,5vw,3.8rem)", fontWeight: 900, color: isDark ? "#fff" : "#00843d", lineHeight: 1 }}>${plan.price}</span>
                                            <span style={{ fontSize: "1rem", fontWeight: 600, color: isDark ? "rgba(255,255,255,0.75)" : "#7da88a" }}>/ {plan.period}</span>
                                        </div>
                                    </div>

                                    {plan.saving && (
                                        <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: isDark ? "rgba(255,255,255,0.18)" : "#e8f8ef", borderRadius: "50px", padding: "4px 12px", marginBottom: "8px" }}>
                                            <BadgePercent size={14} color={isDark ? "#fff" : "#00843d"} />
                                            <span style={{ fontSize: "0.82rem", fontWeight: 800, color: isDark ? "#fff" : "#00843d" }}>{plan.saving} ({plan.savingPct} خصم)</span>
                                        </div>
                                    )}

                                    <p style={{ fontSize: "0.85rem", color: isDark ? "rgba(255,255,255,0.65)" : "#7da88a", marginBottom: "16px", fontWeight: 500 }}>يُدفع {plan.periodSub}</p>

                                    <h2 style={{ fontSize: "1.6rem", fontWeight: 900, color: isDark ? "#fff" : "#0f1f14", marginBottom: "10px" }}>{plan.name}</h2>
                                    <p style={{ fontSize: "0.95rem", color: isDark ? "rgba(255,255,255,0.8)" : "#4a6e55", lineHeight: 1.7, marginBottom: "0" }}>{plan.desc}</p>
                                </div>

                                {/* Divider */}
                                <div style={{ height: "1px", background: isDark ? "rgba(255,255,255,0.15)" : "#e6f4ec", margin: "0 32px" }} />

                                {/* Features */}
                                <div style={{ padding: "24px 32px", flex: 1 }}>
                                    {plan.features.map((f, fi) => (
                                        <div key={fi} className="feature-row" style={{ borderBottomColor: isDark ? "rgba(255,255,255,0.1)" : "#f0faf4" }}>
                                            {f.ok
                                                ? isDark
                                                    ? <div style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                        <Check size={14} color="#fff" strokeWidth={2.5} />
                                                    </div>
                                                    : <CheckIcon />
                                                : <CrossIcon />
                                            }
                                            <span style={{ fontSize: "0.93rem", fontWeight: f.ok ? 600 : 400, color: isDark ? (f.ok ? "#fff" : "rgba(255,255,255,0.45)") : (f.ok ? "#1a3322" : "#b0c4b8") }}>
                                                {f.text}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                {/* CTA */}
                                <div style={{ padding: "8px 32px 32px" }}>
                                    <Link href="/register" style={{ textDecoration: "none" }}>
                                        {plan.ctaStyle === "white" && <button className="btn-white">{plan.cta} <ArrowRight size={18} /></button>}
                                        {plan.ctaStyle === "outline" && <button className="btn-outline-green">{plan.cta} <ArrowRight size={18} /></button>}
                                    </Link>
                                    <p style={{ textAlign: "center", marginTop: "12px", fontSize: "0.82rem", color: isDark ? "rgba(255,255,255,0.6)" : "#a0b8a8", fontWeight: 500 }}>
                                        14 يوم مجاناً · بدون بطاقة
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Trust indicators below plans */}
                <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "32px", marginTop: "48px", maxWidth: "700px", margin: "48px auto 0" }}>
                    {trustIndicators.map(({ icon: Icon, label }) => (
                        <div key={label} style={{ display: "flex", alignItems: "center", gap: "8px", color: "#5a7d65", fontWeight: 600, fontSize: "0.92rem" }}>
                            <Icon size={18} color="#00a844" /> {label}
                        </div>
                    ))}
                </div>
            </section>

            {/* ── COMPARISON TABLE ── */}
            <section className="comparison-table" style={{ padding: "0 5% 100px", background: "#fff" }}>
                <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
                    <div style={{ textAlign: "center", marginBottom: "48px" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#e8f8ef", border: "1.5px solid #a8ddb8", borderRadius: "50px", padding: "7px 18px", fontSize: "0.82rem", fontWeight: 700, color: "#00843d", marginBottom: "16px" }}>
                            <BarChart3 size={14} /> مقارنة الخطط
                        </div>
                        <h2 style={{ fontSize: "clamp(1.8rem,3.5vw,2.8rem)", fontWeight: 900, color: "#0f1f14" }}>
                            كل شيء واضح — <span style={{ color: "#00a844" }}>لا مفاجآت</span>
                        </h2>
                    </div>

                    <div style={{ border: "1.5px solid #e6f4ec", borderRadius: "20px", overflow: "hidden" }}>
                        {/* Header */}
                        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", background: "#f8fdf9", borderBottom: "1.5px solid #e6f4ec" }}>
                            <div className="comparison-header-cell" style={{ textAlign: "right", color: "#7da88a", fontWeight: 600, fontSize: "0.9rem" }}>الميزة</div>
                            {plans.map(p => (
                                <div key={p.id} className="comparison-header-cell" style={{ color: p.id === 1 ? "#00843d" : "#0f1f14", background: p.id === 1 ? "#e8f8ef" : "transparent" }}>
                                    {p.name}
                                    {p.id === 1 && <div style={{ fontSize: "0.75rem", color: "#00843d", fontWeight: 600, marginTop: "2px", display: "flex", alignItems: "center", justifyContent: "center", gap: "3px" }}>
                                        <Star size={12} fill="#00c853" color="#00c853" /> الأشهر
                                    </div>}
                                </div>
                            ))}
                        </div>

                        {[
                            { label: "الطلبات الشهرية", vals: ["500", "غير محدود", "غير محدود"] },
                            { label: "إدارة المنتجات", vals: [true, true, true] },
                            { label: "تقارير متقدمة + P&L", vals: [false, true, true] },
                            { label: "Google Sheets", vals: [false, true, true] },
                            { label: "كل شركات الشحن", vals: [false, true, true] },
                            { label: "محاكي نقطة التعادل", vals: [false, true, true] },
                            { label: "إدارة الفريق", vals: [false, "5 أعضاء", "غير محدود"] },
                            { label: "تكاملات متعددة", vals: [false, false, true] },
                            { label: "مدير حساب خاص", vals: [false, false, true] },
                        ].map((row, i) => (
                            <div key={i} className="comparison-row" style={{ background: i % 2 === 0 ? "#fff" : "#fafdf8" }}>
                                <div className="comparison-cell label">{row.label}</div>
                                {row.vals.map((v, vi) => (
                                    <div key={vi} className="comparison-cell" style={{ background: vi === 1 ? "rgba(0,200,83,0.04)" : "transparent" }}>
                                        {v === true ? <CheckIcon /> : v === false ? <CrossIcon /> : (
                                            <span style={{ fontWeight: 700, color: vi === 1 ? "#00843d" : "#2d4a36", fontSize: "0.92rem" }}>{v}</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ))}

                        {/* CTA row */}
                        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", borderTop: "1.5px solid #e6f4ec", background: "#f8fdf9" }}>
                            <div />
                            {plans.map(p => (
                                <div key={p.id} style={{ padding: "20px 16px" }}>
                                    <Link href="/register" style={{ textDecoration: "none" }}>
                                        {p.id === 1
                                            ? <button className="btn-green" style={{ padding: "12px 20px", fontSize: "0.92rem" }}>اشترك الآن <ArrowRight size={16} /></button>
                                            : <button className="btn-outline-green" style={{ padding: "11px 20px", fontSize: "0.92rem" }}>ابدأ <ArrowRight size={16} /></button>
                                        }
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ── GUARANTEE ── */}
            <section style={{ padding: "0 5% 80px", background: "#fff" }}>
                <div style={{ maxWidth: "700px", margin: "0 auto" }}>
                    <div className="guarantee-box float">
                        <div style={{ fontSize: "3.5rem", marginBottom: "16px" }}>
                            <ShieldCheck size={56} color="#00a844" />
                        </div>
                        <h3 style={{ fontSize: "1.6rem", fontWeight: 900, color: "#00843d", marginBottom: "12px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                            <Shield size={22} color="#00843d" />
                            ضمان استرداد الأموال 14 يوم
                        </h3>
                        <p style={{ color: "#4a6e55", lineHeight: 1.85, fontSize: "1rem" }}>
                            جرّب المنصة كاملاً لمدة 14 يوم بدون أي مخاطرة. إذا لم تكن راضياً 100% — نرد لك أموالك فوراً بدون أسئلة. هذا وعدنا.
                        </p>
                    </div>
                </div>
            </section>

            {/* ── TESTIMONIALS ── */}
            <section style={{ padding: "60px 5% 100px", background: "#f8fdf9" }}>
                <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
                    <div style={{ textAlign: "center", marginBottom: "48px" }}>
                        <h2 style={{ fontSize: "clamp(1.8rem,3.5vw,2.8rem)", fontWeight: 900, color: "#0f1f14", marginBottom: "8px" }}>
                            تجار حققوا نتائج <span style={{ color: "#00a844" }}>حقيقية</span>
                        </h2>
                        <p style={{ color: "#7da88a", fontSize: "1rem" }}>كلامهم أبلغ من أي إعلان</p>
                    </div>
                    <div className="testi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "20px" }}>
                        {testimonials.map((t, i) => (
                            <div key={i} style={{ background: "#fff", border: "1.5px solid #e6f4ec", borderRadius: "20px", padding: "28px", transition: "all 0.3s", boxShadow: "0 2px 12px rgba(0,168,68,0.05)" }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = "#00c853"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,168,68,0.12)"; e.currentTarget.style.transform = "translateY(-4px)"; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = "#e6f4ec"; e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,168,68,0.05)"; e.currentTarget.style.transform = ""; }}>
                                <div style={{ display: "flex", gap: "3px", marginBottom: "14px" }}>
                                    {[...Array(t.stars)].map((_, j) => <Star key={j} size={18} fill="#00c853" color="#00c853" />)}
                                </div>
                                <p style={{ color: "#2d4a36", lineHeight: 1.8, marginBottom: "20px", fontSize: "0.97rem", fontWeight: 500 }}>"{t.text}"</p>
                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                    <div style={{ width: 42, height: 42, borderRadius: "50%", background: "linear-gradient(135deg,#00a844,#00c853)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: "1.1rem" }}>
                                        {t.name[0]}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "#0f1f14" }}>{t.name}</div>
                                        <div style={{ fontSize: "0.8rem", color: "#00843d", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}>
                                            <Check size={12} color="#00a844" /> {t.plan}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── FAQ ── */}
            <section ref={faqRef} style={{ padding: "60px 5% 100px", background: "#fff" }}>
                <div style={{ maxWidth: "720px", margin: "0 auto" }}>
                    <div style={{ textAlign: "center", marginBottom: "48px" }}>
                        <h2 style={{ fontSize: "clamp(1.8rem,3.5vw,2.8rem)", fontWeight: 900, color: "#0f1f14", marginBottom: "8px" }}>
                            أسئلة شائعة
                        </h2>
                        <p style={{ color: "#7da88a" }}>كل ما يدور في بالك — نجاوبك هنا</p>
                    </div>
                    {faqs.map((faq, i) => (
                        <div key={i} className={`faq-item slide-up ${faqInView ? "visible" : ""}`} style={{ transitionDelay: `${i * 0.07}s` }}>
                            <div className="faq-q" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                                <span>{faq.q}</span>
                                <span style={{ transition: "transform 0.3s", transform: openFaq === i ? "rotate(45deg)" : "rotate(0)", display: "flex", alignItems: "center" }}>
                                    {openFaq === i ? <X size={20} color="#00a844" /> : <span style={{ fontSize: "1.4rem", color: "#00a844" }}>+</span>}
                                </span>
                            </div>
                            {openFaq === i && <div className="faq-a">{faq.a}</div>}
                        </div>
                    ))}
                </div>
            </section>

            {/* ── FINAL CTA ── */}
            <section ref={ctaRef} style={{ padding: "0 5% 100px", background: "#fff" }}>
                <div className={`slide-up ${ctaInView ? "visible" : ""}`} style={{ maxWidth: "900px", margin: "0 auto", background: "linear-gradient(135deg,#00843d 0%,#00c853 60%,#00e676 100%)", borderRadius: "32px", padding: "72px 60px", textAlign: "center", position: "relative", overflow: "hidden", boxShadow: "0 32px 80px rgba(0,168,68,0.4)" }}>
                    <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: "rgba(255,255,255,0.08)", top: "-20%", right: "-10%", pointerEvents: "none" }} />
                    <div style={{ position: "absolute", width: 300, height: 300, borderRadius: "50%", background: "rgba(255,255,255,0.06)", bottom: "-20%", left: "5%", pointerEvents: "none" }} />

                    <div style={{ position: "relative", zIndex: 1 }}>
                        <div style={{ fontSize: "3rem", marginBottom: "20px" }}>
                            <Rocket size={64} color="#fff" />
                        </div>
                        <h2 style={{ fontSize: "clamp(1.8rem,4vw,3rem)", fontWeight: 900, color: "#fff", marginBottom: "16px", lineHeight: 1.2 }}>
                            جاهز تبدل من الفوضى<br />للربح الحقيقي؟
                        </h2>
                        <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "1.1rem", lineHeight: 1.8, marginBottom: "40px", maxWidth: "520px", margin: "0 auto 40px" }}>
                            انضم لأكثر من 5,000 بائع يحولون متاجرهم إلى آلات ربح يومية. <strong style={{ color: "#fff" }}>14 يوم مجاناً</strong> بدون أي التزام.
                        </p>
                        <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
                            <Link href="/register" style={{ textDecoration: "none" }}>
                                <button style={{ background: "#fff", color: "#00843d", border: "none", borderRadius: "50px", padding: "18px 48px", fontSize: "1.1rem", fontWeight: 900, fontFamily: "'Tajawal',sans-serif", cursor: "pointer", boxShadow: "0 8px 28px rgba(0,0,0,0.15)", transition: "all 0.3s", display: "flex", alignItems: "center", gap: "8px" }}
                                    onMouseEnter={e => { e.target.style.transform = "translateY(-3px)"; e.target.style.boxShadow = "0 16px 40px rgba(0,0,0,0.22)"; }}
                                    onMouseLeave={e => { e.target.style.transform = ""; e.target.style.boxShadow = "0 8px 28px rgba(0,0,0,0.15)"; }}>
                                    ابدأ مجاناً الآن <ArrowRight size={20} />
                                </button>
                            </Link>
                            <Link href="/#features" style={{ textDecoration: "none" }}>
                                <button style={{ background: "rgba(255,255,255,0.15)", color: "#fff", border: "2px solid rgba(255,255,255,0.5)", borderRadius: "50px", padding: "16px 36px", fontSize: "1rem", fontWeight: 700, fontFamily: "'Tajawal',sans-serif", cursor: "pointer", backdropFilter: "blur(8px)", transition: "all 0.3s", display: "flex", alignItems: "center", gap: "8px" }}
                                    onMouseEnter={e => e.target.style.background = "rgba(255,255,255,0.25)"}
                                    onMouseLeave={e => e.target.style.background = "rgba(255,255,255,0.15)"}>
                                    <ChevronLeft size={18} /> تعرف على المميزات
                                </button>
                            </Link>
                        </div>
                        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.88rem", marginTop: "20px", display: "flex", alignItems: "center", justifyContent: "center", gap: "16px", flexWrap: "wrap" }}>
                            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><Check size={14} color="rgba(255,255,255,0.7)" /> بدون بطاقة بنكية</span>
                            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><Check size={14} color="rgba(255,255,255,0.7)" /> إلغاء في أي وقت</span>
                            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><Check size={14} color="rgba(255,255,255,0.7)" /> ضمان استرداد 14 يوم</span>
                        </p>
                    </div>
                </div>
            </section>

            {/* ── FOOTER ── */}
            <footer style={{ borderTop: "1px solid #e6f4ec", padding: "32px 5%", background: "#f8fdf9", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
                <Link href="/" style={{ textDecoration: "none" }}>
                    <img src={logo.src} alt="شعار" style={{ height: 34, width: "auto", objectFit: "contain" }} />
                </Link>
                <p style={{ color: "#a0b8a8", fontSize: "0.85rem" }}>© 2025 كاش كنترول · جميع الحقوق محفوظة</p>
                <div style={{ display: "flex", gap: "20px" }}>
                    <Link href="/login" style={{ color: "#7da88a", textDecoration: "none", fontSize: "0.88rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}>
                        <ChevronLeft size={14} /> تسجيل الدخول
                    </Link>
                    <Link href="/register" style={{ color: "#00843d", textDecoration: "none", fontSize: "0.88rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px" }}>
                        ابدأ مجاناً <ArrowRight size={14} />
                    </Link>
                </div>
            </footer>
        </div>
    );
}