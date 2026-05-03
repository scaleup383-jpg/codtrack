"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import logo from "@/assets/logo.png";
import {
    Package,
    ShoppingBag,
    Link2,
    BarChart3,
    Truck,
    TrendingUp,
    Users,
    Star,
    Zap,
    Play,
    ArrowRight,
    Shield,
    Headphones,Eye,
    Globe,
    Layout,
    FileSpreadsheet,
    Calculator,
    UserCheck,
    MessageSquare,
    Smartphone,
    Store,
    ShoppingCart,
    BadgeCheck,
    MapPin,
    Wallet,
    Sparkles,
    Rocket,
    Check,
    ChevronRight,
    Menu,
    X,
    ClipboardList,
    Boxes,
    ArrowUpRight,
    PieChart,
    LineChart,
    Target,
    DollarSign,
    Lock,
    Bell,
    Activity,
    Send,
    BarChart4,
    Receipt,
    Heart,
    Clock,
    RefreshCw,
    ShieldCheck,
    CreditCard,
} from "lucide-react";

const useInView = (threshold = 0.15) => {
    const ref = useRef(null);
    const [inView, setInView] = useState(false);
    useEffect(() => {
        const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
        if (ref.current) obs.observe(ref.current);
        return () => obs.disconnect();
    }, []);
    return [ref, inView];
};

const AnimatedCounter = ({ target, suffix = "" }) => {
    const [count, setCount] = useState(0);
    const [ref, inView] = useInView();
    useEffect(() => {
        if (!inView) return;
        let start = 0;
        const step = target / 60;
        const timer = setInterval(() => {
            start += step;
            if (start >= target) { setCount(target); clearInterval(timer); }
            else setCount(Math.floor(start));
        }, 16);
        return () => clearInterval(timer);
    }, [inView, target]);
    return <span ref={ref}>{count.toLocaleString("ar-MA")}{suffix}</span>;
};

export default function CRMLanding() {
    const [activeFeature, setActiveFeature] = useState(0);
    const [scrollY, setScrollY] = useState(0);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrollY(window.scrollY);
        window.addEventListener("scroll", onScroll);
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const features = [
        {
            icon: Package,
            title: "إدارة الطلبات",
            desc: "تتبع كل طلب من لحظة إنشائه حتى التسليم. لوحة تحكم ذكية تعرض حالة الطلبات، المرتجعات، والتحصيل النقدي بلمسة واحدة.",
            color: "#00a844",
            gradient: "linear-gradient(135deg, #e8f8ef 0%, #c8ecd5 100%)",
            details: [
                { icon: ClipboardList, label: "تتبع الطلبات" },
                { icon: RefreshCw, label: "إدارة المرتجعات" },
                { icon: DollarSign, label: "تحصيل نقدي" },
                { icon: Bell, label: "إشعارات ذكية" },
            ],
        },
        {
            icon: ShoppingBag,
            title: "إدارة المنتجات",
            desc: "تحكم كامل في كتالوج منتجاتك، المخزون، والأسعار. ربط فوري مع متجرك الإلكتروني بدون أي تعقيد.",
            color: "#00c853",
            gradient: "linear-gradient(135deg, #f0faf4 0%, #d4edde 100%)",
            details: [
                { icon: Boxes, label: "كتالوج المنتجات" },
                { icon: BarChart4, label: "إدارة المخزون" },
                { icon: DollarSign, label: "تسعير ذكي" },
                { icon: Store, label: "ربط المتجر" },
            ],
        },
        {
            icon: Link2,
            title: "تكاملات فورية",
            desc: "اربط متجرك مع WooCommerce، Shopify، Youcan، وكل المنصات الكبرى. مزامنة تلقائية للطلبات والمخزون.",
            color: "#00a844",
            gradient: "linear-gradient(135deg, #e8f8ef 0%, #c8ecd5 100%)",
            details: [
                { icon: ShoppingCart, label: "WooCommerce" },
                { icon: Store, label: "Shopify" },
                { icon: ShoppingBag, label: "Youcan" },
                { icon: RefreshCw, label: "مزامنة تلقائية" },
            ],
        },
        {
            icon: FileSpreadsheet,
            title: "Google Sheets",
            desc: "صدّر تقاريرك وبياناتك مباشرة إلى Google Sheets بضغطة زر. أتمتة كاملة لتوفير وقتك.",
            color: "#00c853",
            gradient: "linear-gradient(135deg, #f0faf4 0%, #d4edde 100%)",
            details: [
                { icon: FileSpreadsheet, label: "تصدير مباشر" },
                { icon: BarChart3, label: "تقارير تفاعلية" },
                { icon: Zap, label: "أتمتة كاملة" },
                { icon: Clock, label: "توفير الوقت" },
            ],
        },
        {
            icon: Truck,
            title: "شركات الشحن",
            desc: "تكامل مع أبرز شركات الشحن. إنشاء بوليصات، تتبع الشحنات، وإدارة عمليات الإرجاع في مكان واحد.",
            color: "#00a844",
            gradient: "linear-gradient(135deg, #e8f8ef 0%, #c8ecd5 100%)",
            details: [
                { icon: Truck, label: "شركات شحن متعددة" },
                { icon: Receipt, label: "إنشاء بوليصات" },
                { icon: MapPin, label: "تتبع الشحنات" },
                { icon: RefreshCw, label: "إدارة الإرجاع" },
            ],
        },
        {
            icon: TrendingUp,
            title: "الربح والخسارة + نقطة التعادل",
            desc: "محاكي ذكي لحساب نقطة التعادل وتحليل الأرباح والخسائر. اتخذ قرارات مبنية على أرقام حقيقية.",
            color: "#00c853",
            gradient: "linear-gradient(135deg, #f0faf4 0%, #d4edde 100%)",
            details: [
                { icon: Target, label: "نقطة التعادل" },
                { icon: PieChart, label: "تحليل P&L" },
                { icon: LineChart, label: "هامش الربح" },
                { icon: ArrowUpRight, label: "مقارنة الربحية" },
            ],
        },
        {
            icon: Users,
            title: "إدارة الفريق",
            desc: "أضف موظفيك، حدد الصلاحيات، وتابع أداء كل عضو في فريقك. تعاون سلس وشفافية تامة.",
            color: "#00a844",
            gradient: "linear-gradient(135deg, #e8f8ef 0%, #c8ecd5 100%)",
            details: [
                { icon: Users, label: "إضافة أعضاء" },
                { icon: Lock, label: "إدارة الصلاحيات" },
                { icon: Activity, label: "متابعة الأداء" },
                { icon: Send, label: "تعاون داخلي" },
            ],
        },
    ];

    const stats = [
        { value: 5000, suffix: "+", label: "بائع نشط", icon: Users },
        { value: 2000000, suffix: "+", label: "طلب مُعالَج", icon: Package },
        { value: 98, suffix: "%", label: "رضا العملاء", icon: Star },
        { value: 120, suffix: "+", label: "متجر مربوط", icon: Store },
    ];

    const testimonials = [
        { name: "أحمد رضا", role: "صاحب متجر إلكتروني - المغرب", text: "بعد ما بدأت نستخدم المنصة، ارتفعت نسبة التوصيل عندي بـ 35% في أول شهر. لوحة التحكم وضحت ليا وين كنت خسران.", avatar: "أ" },
        { name: "سارة المنصوري", role: "بائعة أونلاين - الإمارات", text: "التكامل مع شركات الشحن وجّهني توفر ساعات كل يوم. الآن كل شيء في مكان واحد وما عدت أضيع وقتي.", avatar: "س" },
        { name: "كريم بوعزيز", role: "مدير عمليات - الجزائر", text: "محاكي نقطة التعادل غيّر طريقة تفكيري في التسعير. الآن أعرف بالضبط من أين يجي الربح.", avatar: "ك" },
    ];

    const [heroRef, heroInView] = useInView(0.1);
    const [statsRef, statsInView] = useInView(0.2);
    const [featRef, featInView] = useInView(0.1);

    const navScrolled = scrollY > 30;

    const integrations = [
        { icon: ShoppingCart, name: "WooCommerce" },
        { icon: Store, name: "Shopify" },
        { icon: ShoppingBag, name: "Youcan" },
        { icon: FileSpreadsheet, name: "Google Sheets" },
        { icon: Truck, name: "Maystro" },
        { icon: Package, name: "Zid" },
        { icon: Globe, name: "J&T Express" },
        { icon: Link2, name: "AMANA" },
        { icon: MessageSquare, name: "WhatsApp API" },
        { icon: Smartphone, name: "TikTok Shop" },
        { icon: Layout, name: "Salla" },
        { icon: Wallet, name: "Noqodi" },
    ];

    return (
        <div dir="rtl" style={{ fontFamily: "'Tajawal', 'Cairo', sans-serif", background: "#ffffff", color: "#0f1f14", overflowX: "hidden", minHeight: "100vh" }}>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800;900&family=Cairo:wght@300;400;600;700;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #f0faf4; }
        ::-webkit-scrollbar-thumb { background: #00c853; border-radius: 3px; }

        .hero-title { font-size: clamp(2.8rem, 7vw, 6rem); font-weight: 900; line-height: 1.1; letter-spacing: -1px; }
        .glow-text {
          background: linear-gradient(135deg, #00a844 0%, #00c853 50%, #00e676 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }
        .section-title { font-size: clamp(2rem, 4vw, 3.2rem); font-weight: 900; line-height: 1.15; }

        .btn-primary {
          background: linear-gradient(135deg, #00a844, #00c853);
          color: #fff; border: none; border-radius: 50px;
          padding: 18px 40px; font-size: 1.1rem; font-weight: 800;
          font-family: 'Tajawal', sans-serif; cursor: pointer;
          transition: all 0.3s ease; box-shadow: 0 8px 24px rgba(0,168,68,0.35);
          display: flex; align-items: center; gap: 8px; justify-content: center;
        }
        .btn-primary:hover { transform: translateY(-3px) scale(1.03); box-shadow: 0 16px 40px rgba(0,168,68,0.5); }

        .btn-outline {
          background: transparent; color: #00a844;
          border: 2px solid #00c853; border-radius: 50px;
          padding: 16px 36px; font-size: 1rem; font-weight: 700;
          font-family: 'Tajawal', sans-serif; cursor: pointer; transition: all 0.3s ease;
          display: flex; align-items: center; gap: 8px; justify-content: center;
        }
        .btn-outline:hover { background: #f0faf4; border-color: #00a844; transform: translateY(-2px); }

        .nav-link {
          color: #2d4a36; text-decoration: none; font-weight: 600;
          font-size: 1rem; transition: color 0.2s; cursor: pointer;
          font-family: 'Tajawal', sans-serif;
        }
        .nav-link:hover { color: #00a844; }

        .card-white {
          background: #ffffff; border: 1.5px solid #e6f4ec;
          border-radius: 24px; transition: all 0.4s ease;
          box-shadow: 0 2px 16px rgba(0,168,68,0.06);
        }
        .card-white:hover {
          border-color: #00c853; transform: translateY(-4px);
          box-shadow: 0 16px 48px rgba(0,168,68,0.14);
        }

        .card-green {
          background: #f2fbf5; border: 1.5px solid #c8ecd5;
          border-radius: 24px; transition: all 0.4s ease;
        }
        .card-green:hover { border-color: #00c853; box-shadow: 0 12px 40px rgba(0,168,68,0.12); transform: translateY(-3px); }

        .badge {
          background: #e8f8ef; border: 1.5px solid #a8ddb8;
          border-radius: 50px; padding: 8px 20px;
          font-size: 0.85rem; font-weight: 700; color: #00843d;
          display: inline-flex; align-items: center; gap: 6px; letter-spacing: 0.3px;
        }

        .grid-bg {
          background-image:
            linear-gradient(rgba(0,168,68,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,168,68,0.05) 1px, transparent 1px);
          background-size: 60px 60px;
        }

        .feature-tab {
          background: #f8fdf9; border: 1.5px solid #ddf0e5;
          border-radius: 16px; padding: 18px 22px; cursor: pointer;
          transition: all 0.3s ease; text-align: right;
        }
        .feature-tab.active { background: #e8f8ef; border-color: #00c853; box-shadow: 0 4px 20px rgba(0,168,68,0.12); }
        .feature-tab:hover { background: #edf9f1; border-color: #00c853; }

        .stat-number {
          font-size: clamp(2.5rem, 5vw, 3.8rem); font-weight: 900;
          background: linear-gradient(135deg, #00843d, #00c853);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }

        .testimonial-card {
          background: #fff; border: 1.5px solid #e2f0e8;
          border-radius: 24px; padding: 32px; transition: all 0.4s;
          box-shadow: 0 2px 12px rgba(0,168,68,0.06);
        }
        .testimonial-card:hover { border-color: #00c853; box-shadow: 0 16px 48px rgba(0,168,68,0.13); transform: translateY(-4px); }

        .avatar {
          width: 52px; height: 52px;
          background: linear-gradient(135deg, #00a844, #00e676);
          border-radius: 50%; display: flex; align-items: center; justify-content: center;
          font-size: 1.3rem; font-weight: 800; color: #fff; flex-shrink: 0;
        }

        .integration-logo {
          background: #f8fdf9; border: 1.5px solid #ddf0e5; border-radius: 16px;
          padding: 18px 28px; font-size: 1rem; font-weight: 700; color: #2d4a36;
          text-align: center; transition: all 0.3s; display: flex;
          align-items: center; gap: 10px; justify-content: center;
        }
        .integration-logo:hover { border-color: #00c853; color: #00843d; background: #edf9f1; transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,168,68,0.1); }

        @keyframes float { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } }
        @keyframes pulse-glow { 0%,100% { box-shadow: 0 8px 24px rgba(0,168,68,0.35); } 50% { box-shadow: 0 16px 48px rgba(0,168,68,0.6); } }
        @keyframes scroll-x { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        @keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        @keyframes blob { 0%,100% { border-radius: 60% 40% 30% 70%/60% 30% 70% 40%; } 50% { border-radius: 30% 60% 70% 40%/50% 60% 30% 60%; } }

        .float { animation: float 6s ease-in-out infinite; }
        .pulse-glow { animation: pulse-glow 3s ease-in-out infinite; }
        .ticker-track { display: flex; animation: scroll-x 22s linear infinite; width: max-content; }
        .shimmer-line {
          background: linear-gradient(90deg, rgba(0,168,68,0.08) 0%, rgba(0,200,83,0.35) 50%, rgba(0,168,68,0.08) 100%);
          background-size: 200% auto; animation: shimmer 3s linear infinite; height: 1.5px; width: 100%;
        }
        .slide-up { opacity: 0; transform: translateY(40px); transition: all 0.8s cubic-bezier(0.16,1,0.3,1); }
        .slide-up.visible { opacity: 1; transform: translateY(0); }
        .fade-in { opacity: 0; transition: opacity 0.9s ease; }
        .fade-in.visible { opacity: 1; }

        .cta-section {
          background: linear-gradient(135deg, #00a844 0%, #00c853 60%, #00e676 100%);
          border-radius: 32px; padding: 80px 60px; text-align: center;
          position: relative; overflow: hidden;
          box-shadow: 0 24px 80px rgba(0,168,68,0.35);
        }
        .cta-section::before {
          content: ''; position: absolute; inset: 0;
          background: radial-gradient(ellipse at 30% 50%, rgba(255,255,255,0.18) 0%, transparent 60%);
        }

        .hero-badge-float {
          position: absolute; border-radius: 16px; padding: 13px 18px;
          font-weight: 800; font-size: 0.9rem; font-family: 'Tajawal', sans-serif;
          box-shadow: 0 8px 28px rgba(0,0,0,0.1); backdrop-filter: blur(12px);
          display: flex; align-items: center; gap: 8px;
        }

        .feature-preview-card {
          background: #ffffff; border: 1.5px solid #e6f4ec;
          border-radius: 24px; padding: 40px; overflow: hidden;
          transition: all 0.4s ease;
        }

        .icon-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        .icon-grid-item {
          background: #f8fdf9;
          border: 1.5px solid #ddf0e5;
          border-radius: 16px;
          padding: 20px 18px;
          display: flex;
          align-items: center;
          gap: 12px;
          transition: all 0.3s;
        }
        .icon-grid-item:hover {
          border-color: #00c853;
          background: #edf9f1;
          transform: translateY(-2px);
        }

        .mobile-menu-btn { display: none; background: none; border: none; cursor: pointer; padding: 4px; }

        @media (max-width: 900px) {
          .features-inner { grid-template-columns: 1fr !important; }
          .pl-grid { grid-template-columns: 1fr !important; }
          .team-grid { grid-template-columns: 1fr !important; }
          .testimonials-grid { grid-template-columns: 1fr !important; }
          .icon-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 768px) {
          .hero-title { font-size: 2.4rem; }
          .cta-section { padding: 50px 24px; }
          .stats-grid { grid-template-columns: 1fr 1fr !important; }
          .hero-btns { flex-direction: column; align-items: stretch; }
          .hero-btns button, .hero-btns a { width: 100%; text-align: center; }
          .nav-links { display: none !important; }
          .footer-grid { grid-template-columns: 1fr 1fr !important; }
          .mobile-menu-btn { display: block !important; }
        }
      `}</style>

            {/* ═══════════════ NAVBAR ═══════════════ */}
            <nav style={{
                position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
                padding: "0 5%", height: "72px",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                background: navScrolled ? "rgba(255,255,255,0.95)" : "transparent",
                backdropFilter: navScrolled ? "blur(20px)" : "none",
                borderBottom: navScrolled ? "1px solid #e6f4ec" : "none",
                transition: "all 0.4s ease",
                boxShadow: navScrolled ? "0 2px 20px rgba(0,168,68,0.08)" : "none",
            }}>
                <Link href="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
                    <img src={logo.src} alt="الشعار" style={{ height: 40, width: "auto", objectFit: "contain" }} />
                </Link>
                <div className="nav-links" style={{ display: "flex", gap: "36px", alignItems: "center" }}>
                    <a href="#features" className="nav-link">المميزات</a>
                    <a href="#integrations" className="nav-link">التكاملات</a>
                    <Link href="/billing" className="nav-link">الأسعار</Link>
                    <a href="#testimonials" className="nav-link">التجار</a>
                </div>
                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    <Link href="/login" style={{ textDecoration: "none" }}>
                        <button className="btn-outline" style={{ padding: "10px 24px", fontSize: "0.95rem" }}>تسجيل الدخول</button>
                    </Link>
                    <Link href="/register" style={{ textDecoration: "none" }}>
                        <button className="btn-primary" style={{ padding: "10px 24px", fontSize: "0.95rem" }}>ابدأ مجاناً</button>
                    </Link>
                    <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                        {mobileMenuOpen ? <X size={24} color="#00843d" /> : <Menu size={24} color="#00843d" />}
                    </button>
                </div>
            </nav>

            {/* ═══════════════ HERO ═══════════════ */}
            <section ref={heroRef} className="grid-bg" style={{
                minHeight: "100vh", display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                padding: "130px 5% 80px", position: "relative", textAlign: "center",
                background: "linear-gradient(180deg, #f0faf4 0%, #ffffff 60%)",
            }}>
                <div style={{ position: "absolute", width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,200,83,0.1) 0%, transparent 70%)", top: "5%", left: "50%", transform: "translateX(-50%)", pointerEvents: "none" }} />
                <div style={{ position: "absolute", width: 350, height: 350, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,168,68,0.08) 0%, transparent 70%)", top: "15%", right: "2%", pointerEvents: "none" }} />

                <div className={`slide-up ${heroInView ? "visible" : ""}`} style={{ position: "relative", zIndex: 1, maxWidth: "960px" }}>
                    <div className="badge" style={{ marginBottom: "28px" }}>
                        <MapPin size={16} /> الحل الأول لبائعي الدفع عند الاستلام
                    </div>
                    <h1 className="hero-title" style={{ marginBottom: "28px", color: "#0f1f14" }}>
                        أدر متجرك بالكامل<br />
                        <span className="glow-text">من لوحة تحكم واحدة</span>
                    </h1>
                    <p style={{ fontSize: "clamp(1.1rem,2.5vw,1.35rem)", color: "#4a6e55", maxWidth: "680px", margin: "0 auto 48px", lineHeight: 1.85, fontWeight: 400 }}>
                        CRM متكامل مُصمَّم خصيصاً لبائعي الكاش أون ديليفري. تتبع طلباتك، حصّل دفعاتك، وحلل أرباحك — كل شيء في مكان واحد.
                    </p>
                    <div className="hero-btns" style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
                        <Link href="/register" style={{ textDecoration: "none" }}>
                            <button className="btn-primary pulse-glow" style={{ fontSize: "1.15rem", padding: "20px 48px" }}>
                                <Rocket size={22} /> ابدأ مجاناً الآن
                            </button>
                        </Link>
                        <button className="btn-outline" style={{ fontSize: "1.05rem" }}>
                            <Play size={18} /> شاهد العرض التوضيحي
                        </button>
                    </div>
                    <p style={{ marginTop: "20px", color: "#7da88a", fontSize: "0.9rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "16px", flexWrap: "wrap" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><Check size={14} color="#00a844" /> بدون بطاقة بنكية</span>
                        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><Check size={14} color="#00a844" /> إعداد في 5 دقائق</span>
                        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><Check size={14} color="#00a844" /> دعم باللغة العربية</span>
                    </p>
                </div>

                {/* Hero visual - icon-based dashboard mockup */}
                <div className={`float fade-in ${heroInView ? "visible" : ""}`} style={{ position: "relative", zIndex: 1, marginTop: "64px", width: "100%", maxWidth: "1000px", transition: "opacity 1s ease 0.4s" }}>
                    <div className="card-white" style={{ padding: "48px", background: "linear-gradient(135deg, #f8fdf9 0%, #ffffff 100%)", borderRadius: "24px", boxShadow: "0 24px 64px rgba(0,168,68,0.12), 0 4px 16px rgba(0,0,0,0.06)" }}>
                        {/* Mock dashboard */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "16px", marginBottom: "24px" }}>
                            {[
                                { icon: Package, label: "الطلبات", value: "247", color: "#00a844" },
                                { icon: DollarSign, label: "المبيعات", value: "12,450", color: "#00c853" },
                                { icon: Truck, label: "قيد التوصيل", value: "89", color: "#00843d" },
                                { icon: Star, label: "التقييم", value: "4.8", color: "#00e676" },
                            ].map((item, i) => {
                                const ItemIcon = item.icon;
                                return (
                                    <div key={i} style={{ background: "#fff", border: "1.5px solid #e6f4ec", borderRadius: "16px", padding: "20px", textAlign: "center" }}>
                                        <ItemIcon size={28} color={item.color} style={{ marginBottom: "8px" }} />
                                        <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "#0f1f14" }}>{item.value}</div>
                                        <div style={{ fontSize: "0.85rem", color: "#7da88a", marginTop: "4px" }}>{item.label}</div>
                                    </div>
                                );
                            })}
                        </div>
                        {/* Chart placeholder */}
                        <div style={{ background: "#f8fdf9", border: "1.5px solid #ddf0e5", borderRadius: "16px", padding: "32px", display: "flex", alignItems: "center", justifyContent: "center", gap: "24px", flexWrap: "wrap" }}>
                            <BarChart3 size={48} color="#00a844" opacity={0.3} />
                            <LineChart size={48} color="#00c853" opacity={0.3} />
                            <PieChart size={48} color="#00843d" opacity={0.3} />
                            <Activity size={48} color="#00e676" opacity={0.3} />
                        </div>
                    </div>

                    {/* Floating badges */}
                    <div className="hero-badge-float" style={{ top: "-18px", right: "-16px", background: "linear-gradient(135deg,#00a844,#00c853)", color: "#fff" }}>
                        <Package size={18} /> +247 طلب اليوم
                    </div>
                    <div className="hero-badge-float" style={{ bottom: "28px", left: "-16px", background: "rgba(255,255,255,0.95)", border: "1.5px solid #c8ecd5", color: "#00843d" }}>
                        <BadgeCheck size={18} /> نسبة التوصيل 94%
                    </div>
                </div>

                <div className="shimmer-line" style={{ marginTop: "80px", maxWidth: "800px", width: "100%" }} />
            </section>

            {/* ═══════════════ TICKER ═══════════════ */}
            <div style={{ background: "#f2fbf5", borderTop: "1px solid #d4edde", borderBottom: "1px solid #d4edde", padding: "14px 0", overflow: "hidden" }}>
                <div className="ticker-track">
                    {["WooCommerce", "Shopify", "Youcan", "Maystro", "Zid", "J&T Express", "AMANA", "Google Sheets", "WhatsApp API", "WooCommerce", "Shopify", "Youcan", "Maystro", "Zid", "J&T Express", "AMANA", "Google Sheets", "WhatsApp API"].map((t, i) => (
                        <span key={i} style={{ padding: "0 40px", color: "#00843d", fontWeight: 700, fontSize: "0.95rem", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: "6px" }}>
                            <Zap size={14} color="#00c853" /> {t}
                        </span>
                    ))}
                </div>
            </div>

            {/* ═══════════════ STATS ═══════════════ */}
            <section ref={statsRef} style={{ padding: "100px 5%", background: "#fff" }}>
                <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "24px", maxWidth: "1100px", margin: "0 auto" }}>
                    {stats.map((s, i) => {
                        const StatIcon = s.icon;
                        return (
                            <div key={i} className="card-white" style={{ padding: "40px 24px", textAlign: "center" }}>
                                <StatIcon size={28} color="#00a844" style={{ marginBottom: "12px", opacity: 0.7 }} />
                                <div className="stat-number">
                                    {statsInView ? <AnimatedCounter target={s.value} suffix={s.suffix} /> : "0"}
                                </div>
                                <div style={{ color: "#5a7d65", marginTop: "8px", fontSize: "1rem", fontWeight: 600 }}>{s.label}</div>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* ═══════════════ FEATURES ═══════════════ */}
            <section id="features" ref={featRef} style={{ padding: "80px 5% 120px", background: "#f8fdf9" }}>
                <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
                    <div style={{ textAlign: "center", marginBottom: "72px" }}>
                        <div className="badge" style={{ marginBottom: "20px" }}>
                            <Layout size={14} /> كل ما تحتاجه في مكان واحد
                        </div>
                        <h2 className={`section-title slide-up ${featInView ? "visible" : ""}`}>
                            مميزات صُنِعت لبائعي<br /><span className="glow-text">الكاش أون ديليفري</span>
                        </h2>
                    </div>

                    <div className="features-inner" style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "28px", alignItems: "start" }}>
                        {/* Tabs */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                            {features.map((f, i) => {
                                const FeatureIcon = f.icon;
                                return (
                                    <div key={i} className={`feature-tab ${activeFeature === i ? "active" : ""}`} onClick={() => setActiveFeature(i)}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                            <FeatureIcon size={22} color={activeFeature === i ? "#00843d" : "#00a844"} />
                                            <span style={{ fontWeight: 700, fontSize: "0.97rem", color: activeFeature === i ? "#00843d" : "#2d4a36" }}>{f.title}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Feature panel - Icon-based preview */}
                        <div style={{ position: "sticky", top: "90px" }}>
                            <div className="card-white" style={{ padding: "40px", overflow: "hidden", background: features[activeFeature].gradient }}>
                                {(() => {
                                    const ActiveIcon = features[activeFeature].icon;
                                    return (
                                        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
                                            <div style={{ width: 64, height: 64, borderRadius: "20px", background: "rgba(255,255,255,0.8)", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid " + features[activeFeature].color }}>
                                                <ActiveIcon size={32} color={features[activeFeature].color} />
                                            </div>
                                            <h3 style={{ fontSize: "1.8rem", fontWeight: 800, color: features[activeFeature].color }}>{features[activeFeature].title}</h3>
                                        </div>
                                    );
                                })()}
                                <p style={{ color: "#4a6e55", marginTop: "12px", lineHeight: 1.9, fontSize: "1.05rem", marginBottom: "28px" }}>{features[activeFeature].desc}</p>

                                {/* Icon grid for feature details */}
                                <div className="icon-grid">
                                    {features[activeFeature].details.map((detail, idx) => {
                                        const DetailIcon = detail.icon;
                                        return (
                                            <div key={idx} className="icon-grid-item">
                                                <DetailIcon size={20} color={features[activeFeature].color} />
                                                <span style={{ fontWeight: 600, fontSize: "0.92rem", color: "#2d4a36" }}>{detail.label}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════════════ INTEGRATIONS ═══════════════ */}
            <section id="integrations" style={{ padding: "100px 5%", background: "#fff" }}>
                <div style={{ maxWidth: "1100px", margin: "0 auto", textAlign: "center" }}>
                    <div className="badge" style={{ marginBottom: "20px" }}>
                        <Link2 size={14} /> تكاملات فورية
                    </div>
                    <h2 className="section-title" style={{ marginBottom: "16px" }}>
                        يتصل بكل ما <span className="glow-text">تستخدمه</span>
                    </h2>
                    <p style={{ color: "#5a7d65", marginBottom: "56px", fontSize: "1.1rem" }}>
                        اربط متجرك ببضع ثوانٍ بدون أي خبرة تقنية
                    </p>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: "14px" }}>
                        {integrations.map((item, i) => {
                            const ItemIcon = item.icon;
                            return (
                                <div key={i} className="integration-logo">
                                    <ItemIcon size={20} color="#00a844" />
                                    {item.name}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ═══════════════ P&L / SIMULATION ═══════════════ */}
            <section style={{ padding: "100px 5%", background: "#f8fdf9" }}>
                <div className="pl-grid" style={{ maxWidth: "1100px", margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "60px", alignItems: "center" }}>
                    <div>
                        <div className="badge" style={{ marginBottom: "20px" }}>
                            <Calculator size={14} /> محاكاة ذكية
                        </div>
                        <h2 className="section-title" style={{ marginBottom: "24px" }}>
                            اعرف <span className="glow-text">وين ربحك</span><br />قبل ما تبيع
                        </h2>
                        <p style={{ color: "#4a6e55", lineHeight: 2, fontSize: "1.05rem", marginBottom: "36px" }}>
                            محرك المحاكاة يحسب نقطة التعادل، هامش الربح، وتكلفة الاقتناء — كل شيء بشكل مرئي وبسيط.
                        </p>
                        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                            {[
                                { icon: Target, label: "حساب نقطة التعادل تلقائياً" },
                                { icon: PieChart, label: "تحليل P&L يومي وشهري وسنوي" },
                                { icon: ArrowUpRight, label: "مقارنة المنتجات حسب الربحية" },
                                { icon: Bell, label: "تنبيهات عند الاقتراب من الخسارة" },
                            ].map((item, i) => {
                                const ItemIcon = item.icon;
                                return (
                                    <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#00a844,#00c853)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                            <ItemIcon size={14} color="#fff" />
                                        </div>
                                        <span style={{ color: "#2d4a36", fontWeight: 600 }}>{item.label}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Icon-based simulation preview */}
                    <div className="card-white" style={{ padding: "48px", background: "linear-gradient(135deg, #f8fdf9 0%, #e8f8ef 100%)", height: "420px", display: "flex", flexDirection: "column", gap: "24px", justifyContent: "center" }}>
                        <div style={{ textAlign: "center" }}>
                            <Target size={48} color="#00a844" style={{ marginBottom: "12px" }} />
                            <div style={{ fontSize: "2rem", fontWeight: 900, color: "#00843d" }}>نقطة التعادل</div>
                            <div style={{ color: "#7da88a", fontSize: "0.9rem" }}>1,250 وحدة</div>
                        </div>
                        <div className="shimmer-line" />
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                            {[
                                { icon: DollarSign, label: "الإيرادات", value: "$45,000", color: "#00a844" },
                                { icon: Receipt, label: "التكاليف", value: "$32,500", color: "#e74c3c" },
                                { icon: TrendingUp, label: "الربح", value: "$12,500", color: "#00c853" },
                                { icon: Activity, label: "الهامش", value: "27.8%", color: "#00843d" },
                            ].map((item, idx) => {
                                const ItemIcon = item.icon;
                                return (
                                    <div key={idx} style={{ background: "#fff", borderRadius: "12px", padding: "16px", textAlign: "center", border: "1.5px solid #e6f4ec" }}>
                                        <ItemIcon size={20} color={item.color} style={{ marginBottom: "8px" }} />
                                        <div style={{ fontWeight: 800, color: item.color, fontSize: "1.1rem" }}>{item.value}</div>
                                        <div style={{ fontSize: "0.8rem", color: "#7da88a", marginTop: "4px" }}>{item.label}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════════════ TEAM ═══════════════ */}
            <section style={{ padding: "100px 5%", background: "#fff" }}>
                <div className="team-grid" style={{ maxWidth: "1100px", margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "60px", alignItems: "center" }}>
                    {/* Icon-based team visualization */}
                    <div className="card-white" style={{ padding: "48px", background: "linear-gradient(135deg, #f0faf4 0%, #ffffff 100%)", height: "400px", display: "flex", flexDirection: "column", gap: "20px", justifyContent: "center" }}>
                        <div style={{ display: "flex", gap: "16px", justifyContent: "center" }}>
                            {["أ", "م", "س", "ك"].map((letter, idx) => (
                                <div key={idx} className="avatar" style={{ width: idx === 0 ? 64 : 48, height: idx === 0 ? 64 : 48, fontSize: idx === 0 ? "1.5rem" : "1.1rem", opacity: idx === 0 ? 1 : 0.7 }}>
                                    {letter}
                                </div>
                            ))}
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                            {[
                                { icon: Lock, label: "المالك", color: "#00843d" },
                                { icon: Shield, label: "مدير", color: "#00a844" },
                                { icon: Users, label: "مندوب", color: "#00c853" },
                                { icon: Eye, label: "محاسب", color: "#00e676" },
                            ].map((role, idx) => {
                                const RoleIcon = role.icon;
                                return (
                                    <div key={idx} style={{ background: "#f8fdf9", borderRadius: "12px", padding: "16px", border: "1.5px solid #ddf0e5", display: "flex", alignItems: "center", gap: "10px" }}>
                                        <RoleIcon size={18} color={role.color} />
                                        <span style={{ fontWeight: 600, fontSize: "0.9rem", color: "#2d4a36" }}>{role.label}</span>
                                    </div>
                                );
                            })}
                        </div>
                        <div style={{ background: "#e8f8ef", borderRadius: "12px", padding: "16px", textAlign: "center", border: "1.5px solid #c8ecd5" }}>
                            <Activity size={20} color="#00a844" style={{ display: "inline-block", marginBottom: "4px" }} />
                            <div style={{ fontWeight: 700, color: "#00843d", fontSize: "0.9rem" }}>4 أعضاء نشطين الآن</div>
                        </div>
                    </div>

                    <div>
                        <div className="badge" style={{ marginBottom: "20px" }}>
                            <Users size={14} /> إدارة الفريق
                        </div>
                        <h2 className="section-title" style={{ marginBottom: "24px" }}>
                            فريقك في <span className="glow-text">قبضة يدك</span>
                        </h2>
                        <p style={{ color: "#4a6e55", lineHeight: 2, fontSize: "1.05rem", marginBottom: "36px" }}>
                            أضف موظفيك وحدد لكل واحد صلاحياته بالضبط. تابع الأداء، الطلبات المعالجة، والتحصيلات — شفافية تامة.
                        </p>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                            {[
                                { icon: Users, label: "إضافة أعضاء" },
                                { icon: Shield, label: "إدارة الصلاحيات" },
                                { icon: BarChart3, label: "تقارير الأداء" },
                                { icon: MessageSquare, label: "تواصل داخلي" },
                            ].map((item, i) => {
                                const ItemIcon = item.icon;
                                return (
                                    <div key={i} className="card-green" style={{ padding: "18px 20px", display: "flex", alignItems: "center", gap: "10px" }}>
                                        <ItemIcon size={22} color="#00a844" />
                                        <span style={{ fontWeight: 700, fontSize: "0.92rem", color: "#00843d" }}>{item.label}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════════════ TESTIMONIALS ═══════════════ */}
            <section id="testimonials" style={{ padding: "100px 5%", background: "#f8fdf9" }}>
                <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
                    <div style={{ textAlign: "center", marginBottom: "64px" }}>
                        <div className="badge" style={{ marginBottom: "20px" }}>
                            <MessageSquare size={14} /> ماذا يقول تجارنا
                        </div>
                        <h2 className="section-title">آلاف البائعين <span className="glow-text">وثقوا بنا</span></h2>
                    </div>
                    <div className="testimonials-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "24px" }}>
                        {testimonials.map((t, i) => (
                            <div key={i} className="testimonial-card">
                                <div style={{ display: "flex", gap: "14px", alignItems: "center", marginBottom: "20px" }}>
                                    <div className="avatar">{t.avatar}</div>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: "1rem", color: "#0f1f14" }}>{t.name}</div>
                                        <div style={{ color: "#7da88a", fontSize: "0.85rem", marginTop: "2px" }}>{t.role}</div>
                                    </div>
                                </div>
                                <div style={{ display: "flex", gap: "3px", marginBottom: "14px" }}>
                                    {[...Array(5)].map((_, j) => <Star key={j} size={18} fill="#00c853" color="#00c853" />)}
                                </div>
                                <p style={{ color: "#4a6e55", lineHeight: 1.85, fontSize: "0.97rem" }}>"{t.text}"</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════════ CTA ═══════════════ */}
            <section style={{ padding: "80px 5% 120px", background: "#fff" }}>
                <div style={{ maxWidth: "900px", margin: "0 auto" }}>
                    <div className="cta-section">
                        <div style={{ position: "relative", zIndex: 1 }}>
                            <div style={{ background: "rgba(255,255,255,0.2)", border: "1.5px solid rgba(255,255,255,0.4)", borderRadius: "50px", padding: "8px 20px", fontSize: "0.85rem", fontWeight: 700, color: "#fff", display: "inline-flex", alignItems: "center", gap: "6px", marginBottom: "24px" }}>
                                <Sparkles size={14} color="#fff" /> ابدأ اليوم — مجاناً
                            </div>
                            <h2 className="section-title" style={{ marginBottom: "20px", color: "#fff" }}>
                                حان وقت تحويل متجرك<br />إلى ماكينة ربح حقيقية
                            </h2>
                            <p style={{ color: "rgba(255,255,255,0.85)", marginBottom: "44px", fontSize: "1.1rem", lineHeight: 1.8 }}>
                                انضم لأكثر من 5,000 بائع يستخدمون المنصة يومياً.<br />
                                جرّبها مجاناً لمدة 14 يوم — بدون بطاقة بنكية.
                            </p>
                            <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
                                <Link href="/register" style={{ textDecoration: "none" }}>
                                    <button style={{ background: "#fff", color: "#00843d", border: "none", borderRadius: "50px", padding: "20px 52px", fontSize: "1.15rem", fontWeight: 800, fontFamily: "'Tajawal',sans-serif", cursor: "pointer", transition: "all 0.3s", boxShadow: "0 8px 24px rgba(0,0,0,0.15)", display: "flex", alignItems: "center", gap: "8px" }}
                                        onMouseEnter={e => { e.target.style.transform = "translateY(-3px)"; e.target.style.boxShadow = "0 16px 40px rgba(0,0,0,0.2)"; }}
                                        onMouseLeave={e => { e.target.style.transform = ""; e.target.style.boxShadow = "0 8px 24px rgba(0,0,0,0.15)"; }}>
                                        <Rocket size={22} /> ابدأ الآن مجاناً
                                    </button>
                                </Link>
                                <Link href="/billing" style={{ textDecoration: "none" }}>
                                    <button style={{ background: "rgba(255,255,255,0.15)", color: "#fff", border: "2px solid rgba(255,255,255,0.6)", borderRadius: "50px", padding: "18px 36px", fontSize: "1rem", fontWeight: 700, fontFamily: "'Tajawal',sans-serif", cursor: "pointer", transition: "all 0.3s", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", gap: "8px" }}
                                        onMouseEnter={e => { e.target.style.background = "rgba(255,255,255,0.25)"; }}
                                        onMouseLeave={e => { e.target.style.background = "rgba(255,255,255,0.15)"; }}>
                                        <ChevronRight size={18} /> عرض الأسعار
                                    </button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════════════ FOOTER ═══════════════ */}
            <footer style={{ borderTop: "1px solid #e6f4ec", padding: "56px 5% 32px", background: "#f8fdf9" }}>
                <div className="footer-grid" style={{ maxWidth: "1100px", margin: "0 auto", display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: "48px", marginBottom: "48px" }}>
                    <div>
                        <Link href="/" style={{ textDecoration: "none", display: "inline-block", marginBottom: "16px" }}>
                            <img src={logo.src} alt="الشعار" style={{ height: 40, width: "auto", objectFit: "contain" }} />
                        </Link>
                        <p style={{ color: "#7da88a", lineHeight: 1.8, maxWidth: "260px", fontSize: "0.95rem" }}>
                            المنصة الأولى في المنطقة العربية المتخصصة في بائعي الدفع عند الاستلام.
                        </p>
                    </div>
                    {[
                        { title: "المنتج", links: [{ label: "المميزات", href: "#features" }, { label: "الأسعار", href: "/billing" }, { label: "التكاملات", href: "#integrations" }, { label: "الروادمب", href: "#" }] },
                        { title: "الشركة", links: [{ label: "عن الفريق", href: "#" }, { label: "المدونة", href: "#" }, { label: "الشراكات", href: "#" }, { label: "تواصل معنا", href: "#" }] },
                        { title: "الحساب", links: [{ label: "تسجيل الدخول", href: "/login" }, { label: "إنشاء حساب", href: "/register" }, { label: "مركز المساعدة", href: "#" }, { label: "حالة النظام", href: "#" }] },
                    ].map((col, i) => (
                        <div key={i}>
                            <h4 style={{ color: "#00843d", fontWeight: 800, marginBottom: "18px", fontSize: "1rem" }}>{col.title}</h4>
                            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                {col.links.map(l => (
                                    <Link key={l.label} href={l.href} style={{ color: "#7da88a", textDecoration: "none", fontSize: "0.92rem", fontWeight: 500, transition: "color 0.2s", display: "flex", alignItems: "center", gap: "4px" }}
                                        onMouseEnter={e => e.target.style.color = "#00843d"}
                                        onMouseLeave={e => e.target.style.color = "#7da88a"}>
                                        <ChevronRight size={12} /> {l.label}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
                <div style={{ borderTop: "1px solid #e6f4ec", paddingTop: "24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                    <p style={{ color: "#a8c8b4", fontSize: "0.85rem" }}>© 2025 كاش كنترول. جميع الحقوق محفوظة.</p>
                    <p style={{ color: "#a8c8b4", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "4px" }}>
                        صُنع بـ <Heart size={14} color="#00c853" fill="#00c853" /> للبائعين العرب
                    </p>
                </div>
            </footer>
        </div>
    );
}