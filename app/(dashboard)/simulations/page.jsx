"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import {
    Calculator,
    Package,
    TrendingUp,
    DollarSign,
    Activity,
    Target,
    AlertTriangle,
    RefreshCw,
    Zap,
    BarChart3,
    Layers,
    Sparkles,
    Percent,
    Gauge,
    ArrowUpRight,
    ArrowDownRight,
    Scale,
    BrainCircuit,
    ChevronDown,
    ChevronUp,
    Info,
    Sliders,
    RotateCcw,
    Download,
    Save,
    History,
    Filter,
    Maximize2,
    Minimize2,
    TrendingDown,
    PieChart as PieChartIcon,
    Grid,
    List
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    RadarChart,
    Radar,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis
} from "recharts";
import ProtectedPage from "@/components/ProtectedPage";

/* =========================================================
   THEME CONFIGURATION - CREAMY WHITE WITH GREEN ACCENTS
========================================================= */
const THEME = {
    colors: {
        primary: {
            50: '#f0fdf4',
            100: '#dcfce7',
            200: '#bbf7d0',
            300: '#86efac',
            400: '#4ade80',
            500: '#22c55e',
            600: '#16a34a',
            700: '#15803d',
            800: '#166534',
            900: '#14532d',
        },
        background: {
            main: '#fefdfb',
            card: '#ffffff',
            hover: '#fafaf7',
            cream: '#fefcf8',
            warm: '#fdfbf7',
        },
        accent: {
            success: '#059669',
            warning: '#d97706',
            danger: '#dc2626',
            info: '#0284c7',
            purple: '#7c3aed',
        },
        chart: {
            primary: '#22c55e',
            secondary: '#16a34a',
            tertiary: '#15803d',
            quaternary: '#4ade80',
            gradient: ['#22c55e', '#16a34a', '#15803d', '#166534'],
            warm: ['#fef3c7', '#fde68a', '#fcd34d', '#fbbf24'],
        }
    },
    shadows: {
        sm: 'shadow-sm',
        md: 'shadow-md',
        lg: 'shadow-lg',
        xl: 'shadow-xl',
        glow: 'shadow-[0_0_15px_rgba(34,197,94,0.15)]',
        card: 'shadow-[0_2px_8px_rgba(0,0,0,0.04)]',
        hover: 'shadow-[0_4px_20px_rgba(0,0,0,0.08)]',
    }
};

/* =========================================================
   CONSTANTS & CONFIGURATIONS
========================================================= */
const CONSTANTS = {
    shipping: {
        delivered: 4,
        returned: 2,
        express: 8,
        international: 15,
    },
    fees: {
        confirmed: 1,
        delivered: 2,
        platform: 0.05, // 5% platform fee
        payment: 0.029, // 2.9% payment processing
    },
    defaults: {
        leads: 100,
        costPerLead: 1.2,
        confirmationRate: 35,
        deliveryRate: 70,
        returnRate: 15,
        upsellRate: 20,
        upsellValue: 25,
        taxRate: 0,
        discountRate: 0,
    }
};

const SCENARIOS = {
    conservative: {
        name: 'Conservative',
        icon: TrendingDown,
        color: 'text-amber-600',
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        description: 'Pessimistic market conditions',
        values: {
            confirmationRate: 25,
            deliveryRate: 60,
            returnRate: 20,
            upsellRate: 10,
            costPerLead: 1.5,
        }
    },
    realistic: {
        name: 'Realistic',
        icon: Target,
        color: 'text-green-600',
        bg: 'bg-green-50',
        border: 'border-green-200',
        description: 'Expected market performance',
        values: {
            confirmationRate: 35,
            deliveryRate: 70,
            returnRate: 15,
            upsellRate: 20,
            costPerLead: 1.2,
        }
    },
    optimistic: {
        name: 'Optimistic',
        icon: TrendingUp,
        color: 'text-emerald-600',
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        description: 'Best case scenario',
        values: {
            confirmationRate: 50,
            deliveryRate: 85,
            returnRate: 8,
            upsellRate: 30,
            costPerLead: 0.9,
        }
    },
    aggressive: {
        name: 'Aggressive',
        icon: Zap,
        color: 'text-purple-600',
        bg: 'bg-purple-50',
        border: 'border-purple-200',
        description: 'High-risk high-reward strategy',
        values: {
            confirmationRate: 45,
            deliveryRate: 75,
            returnRate: 12,
            upsellRate: 40,
            costPerLead: 2.0,
        }
    }
};

const VIEW_MODES = {
    grid: { icon: Grid, label: 'Grid View' },
    list: { icon: List, label: 'List View' },
};

/* =========================================================
   CUSTOM HOOKS
========================================================= */
function useLocalStorage(key, initialValue) {
    const [storedValue, setStoredValue] = useState(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            return initialValue;
        }
    });

    const setValue = (value) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
            console.error('Error saving to localStorage:', error);
        }
    };

    return [storedValue, setValue];
}

function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);

    return debouncedValue;
}

/* =========================================================
   HELPER FUNCTIONS
========================================================= */
const formatters = {
    currency: (value) => new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value),

    percentage: (value) => `${value.toFixed(1)}%`,

    number: (value) => new Intl.NumberFormat('en-US').format(value),

    compact: (value) => {
        if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
        if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
        return value.toString();
    }
};

const analytics = {
    calculateProfitabilityScore: (roi, margin, efficiency) => {
        const score = (roi * 0.4) + (margin * 0.4) + (efficiency * 20);
        return Math.min(100, Math.max(0, score));
    },

    getRiskColor: (level) => {
        const colors = {
            low: 'text-emerald-600 bg-emerald-50',
            moderate: 'text-amber-600 bg-amber-50',
            high: 'text-orange-600 bg-orange-50',
            critical: 'text-red-600 bg-red-50'
        };
        return colors[level] || colors.moderate;
    },

    getTrendIndicator: (current, previous) => {
        if (!previous) return null;
        const change = ((current - previous) / previous) * 100;
        return {
            value: Math.abs(change).toFixed(1),
            isUp: change > 0,
            color: change > 0 ? 'text-green-600' : 'text-red-600'
        };
    }
};

/* =========================================================
   COMPONENTS LIBRARY
========================================================= */

// Animated Number Component
function AnimatedNumber({ value, duration = 1000, formatter = (v) => v }) {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        let startTime;
        const startValue = displayValue;
        const endValue = typeof value === 'string' ? parseFloat(value) : value;

        const animate = (currentTime) => {
            if (!startTime) startTime = currentTime;
            const progress = Math.min((currentTime - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // Ease out cubic

            setDisplayValue(startValue + (endValue - startValue) * eased);

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }, [value, duration]);

    return <span>{formatter(displayValue)}</span>;
}

// Tooltip Component
function TooltipCustom({ children, content }) {
    const [show, setShow] = useState(false);

    return (
        <div className="relative inline-block">
            <div
                onMouseEnter={() => setShow(true)}
                onMouseLeave={() => setShow(false)}
            >
                {children}
            </div>
            {show && (
                <div className="absolute z-50 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg -top-2 left-full ml-2 w-48">
                    {content}
                    <div className="absolute top-3 -left-1 w-2 h-2 bg-gray-900 transform rotate-45" />
                </div>
            )}
        </div>
    );
}

// Badge Component
function Badge({ children, variant = 'default', className = '' }) {
    const variants = {
        default: 'bg-gray-100 text-gray-700',
        success: 'bg-green-100 text-green-700',
        warning: 'bg-amber-100 text-amber-700',
        danger: 'bg-red-100 text-red-700',
        info: 'bg-blue-100 text-blue-700',
        purple: 'bg-purple-100 text-purple-700',
    };

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
            {children}
        </span>
    );
}

// Progress Bar Component
function ProgressBar({ value, max = 100, color = 'green', showLabel = true, height = 'h-2' }) {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));
    const colors = {
        green: 'bg-gradient-to-r from-green-400 to-emerald-500',
        red: 'bg-gradient-to-r from-red-400 to-rose-500',
        amber: 'bg-gradient-to-r from-amber-400 to-orange-500',
        blue: 'bg-gradient-to-r from-blue-400 to-cyan-500',
        purple: 'bg-gradient-to-r from-purple-400 to-violet-500',
    };

    return (
        <div className="w-full">
            {showLabel && (
                <div className="flex justify-between mb-1">
                    <span className="text-xs text-gray-600">{value}/{max}</span>
                    <span className="text-xs font-medium text-gray-700">{percentage.toFixed(0)}%</span>
                </div>
            )}
            <div className={`w-full bg-gray-100 rounded-full ${height}`}>
                <div
                    className={`${height} rounded-full transition-all duration-500 ${colors[color]}`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}

// Skeleton Loader
function Skeleton({ className = '' }) {
    return (
        <div className={`animate-pulse bg-gray-100 rounded-lg ${className}`} />
    );
}

/* =========================================================
   ADVANCED SIMULATION ENGINE CLASS
========================================================= */
class SimulationEngine {
    constructor(product, inputs, constants = CONSTANTS) {
        this.product = product;
        this.inputs = inputs;
        this.constants = constants;
    }

    calculate() {
        const leads = this.inputs.leads;
        const confirmedOrders = leads * (this.inputs.confirmationRate / 100);
        const deliveredOrders = confirmedOrders * (this.inputs.deliveryRate / 100);
        const returnedOrders = deliveredOrders * (this.inputs.returnRate / 100);
        const successfulOrders = deliveredOrders - returnedOrders;
        const upsells = deliveredOrders * (this.inputs.upsellRate / 100);

        // Revenue Calculations
        const primaryRevenue = successfulOrders * this.product.sell_price;
        const upsellRevenue = upsells * this.inputs.upsellValue;
        const totalRevenue = primaryRevenue + upsellRevenue;

        // Platform & Payment Fees
        const platformFees = totalRevenue * this.constants.fees.platform;
        const paymentFees = totalRevenue * this.constants.fees.payment;

        // Cost Calculations
        const productCost = deliveredOrders * this.product.buy_price;
        const adsCost = leads * this.inputs.costPerLead;
        const shippingCost = (deliveredOrders * this.constants.shipping.delivered) +
            (returnedOrders * this.constants.shipping.returned);
        const agentFees = (confirmedOrders * this.constants.fees.confirmed) +
            (deliveredOrders * this.constants.fees.delivered);

        const totalCosts = productCost + adsCost + shippingCost + agentFees + platformFees + paymentFees;
        const grossProfit = totalRevenue - totalCosts;

        // Key Metrics
        const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
        const roi = adsCost > 0 ? ((totalRevenue - totalCosts) / adsCost) * 100 : 0;
        const roas = adsCost > 0 ? totalRevenue / adsCost : 0;

        // Customer Metrics
        const cac = confirmedOrders > 0 ? adsCost / confirmedOrders : 0;
        const aov = deliveredOrders > 0 ? totalRevenue / deliveredOrders : 0;
        const conversionRate = leads > 0 ? (confirmedOrders / leads) * 100 : 0;

        // Efficiency Metrics
        const efficiencyRatio = totalCosts > 0 ? totalRevenue / totalCosts : 0;
        const breakEvenROAS = adsCost > 0 ? totalCosts / adsCost : 0;
        const paybackPeriod = grossProfit > 0 ? totalCosts / (grossProfit / 30) : Infinity;

        // Risk Assessment
        const riskLevel = this.assessRisk(grossProfit, profitMargin, roi);
        const scalabilityScore = this.calculateScalability(roi, profitMargin, conversionRate);

        // Break-even Analysis
        const breakEvenLeads = adsCost > 0 ?
            (totalCosts * leads) / (totalRevenue > 0 ? totalRevenue : 1) : 0;
        const breakEvenCPL = leads > 0 ?
            (totalRevenue - (totalCosts - adsCost)) / leads : 0;

        return {
            // Flow Metrics
            leads,
            confirmedOrders,
            deliveredOrders,
            returnedOrders,
            successfulOrders,
            upsells,

            // Financial Metrics
            primaryRevenue,
            upsellRevenue,
            totalRevenue,
            productCost,
            adsCost,
            shippingCost,
            agentFees,
            platformFees,
            paymentFees,
            totalCosts,
            grossProfit,

            // Performance Metrics
            profitMargin,
            roi,
            roas,
            cac,
            aov,
            conversionRate,
            efficiencyRatio,

            // Analysis Metrics
            breakEvenROAS,
            paybackPeriod,
            riskLevel,
            scalabilityScore,
            breakEvenLeads,
            breakEvenCPL,

            // Unit Economics
            unitProfit: aov - (totalCosts / deliveredOrders),
            contributionMargin: totalRevenue > 0 ? ((totalRevenue - productCost) / totalRevenue) * 100 : 0,

            // Quality Score
            qualityScore: this.calculateQualityScore(conversionRate, profitMargin, efficiencyRatio),
        };
    }

    assessRisk(profit, margin, roi) {
        if (profit < 0 && margin < -10) return 'critical';
        if (profit < 0) return 'high';
        if (margin < 15 || roi < 50) return 'moderate';
        return 'low';
    }

    calculateScalability(roi, margin, conversion) {
        const score = (roi * 0.3) + (margin * 0.5) + (conversion * 2);
        return Math.min(100, Math.max(0, score));
    }

    calculateQualityScore(conversion, margin, efficiency) {
        const score = (conversion * 0.4) + (margin * 0.4) + (efficiency * 20);
        return Math.min(10, Math.max(0, score / 10));
    }

    generateProjections(steps = 10) {
        const projections = [];
        const baseLeads = this.inputs.leads;

        for (let i = 1; i <= steps; i++) {
            const scaledInputs = {
                ...this.inputs,
                leads: baseLeads * (i * 0.5),
            };
            const engine = new SimulationEngine(this.product, scaledInputs, this.constants);
            const result = engine.calculate();

            projections.push({
                step: i,
                leads: scaledInputs.leads,
                revenue: result.totalRevenue,
                profit: result.grossProfit,
                costs: result.totalCosts,
                roi: result.roi,
                margin: result.profitMargin,
            });
        }

        return projections;
    }
}

/* =========================================================
   MAIN PAGE COMPONENT
========================================================= */
function StimulationsPage() {
    // State Management
    const [tenantId, setTenantId] = useState(null);
    const [products, setProducts] = useState([]);
    const [productId, setProductId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // UI State
    const [viewMode, setViewMode] = useState('grid');
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Simulation State
    const [inputs, setInputs] = useState(CONSTANTS.defaults);
    const [selectedScenario, setSelectedScenario] = useState('realistic');
    const [history, setHistory] = useLocalStorage('simulation_history', []);
    const [savedConfigs, setSavedConfigs] = useLocalStorage('saved_configs', []);

    // Debounced inputs for performance
    const debouncedInputs = useDebounce(inputs, 300);

    /* =========================================================
       DATA FETCHING
    ========================================================= */
    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: profile } = await supabase
                .from("user_profiles")
                .select("tenant_id")
                .eq("id", user.id)
                .single();

            setTenantId(profile?.tenant_id);

            const { data: products } = await supabase
                .from("products")
                .select("*")
                .eq("tenant_id", profile?.tenant_id);

            setProducts(products || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    /* =========================================================
       COMPUTED VALUES
    ========================================================= */
    const product = useMemo(() => {
        return products.find(p => p.id === productId);
    }, [productId, products]);

    const simulationResult = useMemo(() => {
        if (!product) return null;
        const engine = new SimulationEngine(product, debouncedInputs);
        return engine.calculate();
    }, [product, debouncedInputs]);

    const projections = useMemo(() => {
        if (!product) return [];
        const engine = new SimulationEngine(product, debouncedInputs);
        return engine.generateProjections(20);
    }, [product, debouncedInputs]);

    const previousResult = useMemo(() => {
        return history.length > 1 ? history[history.length - 2] : null;
    }, [history]);

    /* =========================================================
       EFFECTS
    ========================================================= */
    useEffect(() => {
        if (simulationResult && product) {
            setHistory(prev => {
                const newEntry = {
                    timestamp: new Date().toISOString(),
                    productName: product.name,
                    productId: product.id,
                    ...simulationResult,
                    inputs: { ...debouncedInputs }
                };
                return [...prev, newEntry].slice(-50); // Keep last 50 simulations
            });
        }
    }, [simulationResult, product]);

    /* =========================================================
       HANDLERS
    ========================================================= */
    const applyScenario = useCallback((scenarioKey) => {
        const scenario = SCENARIOS[scenarioKey];
        if (!scenario) return;

        setInputs(prev => ({
            ...prev,
            ...scenario.values,
            confirmationRate: scenario.values.confirmationRate,
            deliveryRate: scenario.values.deliveryRate,
            returnRate: scenario.values.returnRate,
            upsellRate: scenario.values.upsellRate,
            costPerLead: scenario.values.costPerLead,
        }));
        setSelectedScenario(scenarioKey);
    }, []);

    const resetInputs = useCallback(() => {
        setInputs(CONSTANTS.defaults);
        setSelectedScenario('realistic');
    }, []);

    const saveConfiguration = useCallback(() => {
        const config = {
            name: `${product?.name || 'Untitled'} - ${new Date().toLocaleDateString()}`,
            inputs: { ...inputs },
            productId,
            scenario: selectedScenario,
            timestamp: new Date().toISOString(),
        };
        setSavedConfigs(prev => [...prev, config].slice(-20));
    }, [inputs, productId, selectedScenario, product]);

    const exportData = useCallback(() => {
        if (!simulationResult) return;

        const data = {
            product: product,
            inputs: inputs,
            results: simulationResult,
            projections: projections,
            exportDate: new Date().toISOString(),
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `simulation-${product?.name || 'export'}-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }, [simulationResult, product, inputs, projections]);

    const loadConfiguration = useCallback((config) => {
        setInputs(config.inputs);
        setProductId(config.productId);
        setSelectedScenario(config.scenario);
    }, []);

    /* =========================================================
       CHART DATA PREPARATION
    ========================================================= */
    const pieChartData = useMemo(() => {
        if (!simulationResult) return [];

        return [
            { name: 'Product Cost', value: simulationResult.productCost, color: THEME.colors.chart.primary },
            { name: 'Advertising', value: simulationResult.adsCost, color: THEME.colors.chart.secondary },
            { name: 'Shipping', value: simulationResult.shippingCost, color: THEME.colors.chart.tertiary },
            { name: 'Agent Fees', value: simulationResult.agentFees, color: '#86efac' },
            { name: 'Platform Fees', value: simulationResult.platformFees, color: '#bbf7d0' },
            { name: 'Payment Fees', value: simulationResult.paymentFees, color: '#dcfce7' },
        ].filter(item => item.value > 0);
    }, [simulationResult]);

    const radarData = useMemo(() => {
        if (!simulationResult) return [];

        return [
            { metric: 'ROI', value: Math.min(100, simulationResult.roi / 2), fullMark: 100 },
            { metric: 'Margin', value: simulationResult.profitMargin, fullMark: 100 },
            { metric: 'Conversion', value: simulationResult.conversionRate * 2, fullMark: 100 },
            { metric: 'Efficiency', value: simulationResult.efficiencyRatio * 20, fullMark: 100 },
            { metric: 'Quality', value: simulationResult.qualityScore * 10, fullMark: 100 },
            { metric: 'Scale', value: simulationResult.scalabilityScore, fullMark: 100 },
        ];
    }, [simulationResult]);

    /* =========================================================
       RENDER: LOADING STATE
    ========================================================= */
    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-[#fefdfb] to-[#fefcf8] p-6">
                <div className="max-w-7xl mx-auto space-y-6">
                    <Skeleton className="h-16 w-64" />
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {[...Array(4)].map((_, i) => (
                            <Skeleton key={i} className="h-32" />
                        ))}
                    </div>
                    <Skeleton className="h-96" />
                </div>
            </div>
        );
    }

    /* =========================================================
       RENDER: ERROR STATE
    ========================================================= */
    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-[#fefdfb] to-[#fefcf8] flex items-center justify-center">
                <div className="text-center p-8 bg-white rounded-2xl shadow-lg">
                    <AlertTriangle className="mx-auto text-red-500 mb-4" size={48} />
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Data</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={fetchInitialData}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    /* =========================================================
       RENDER: MAIN CONTENT
    ========================================================= */
    return (
        <div className={`min-h-screen bg-gradient-to-b from-[#fefdfb] via-[#fefcf8] to-[#fdfbf7] transition-all duration-300 ${isFullscreen ? 'fixed inset-0 z-50 overflow-auto' : ''}`}>

            {/* Floating Action Buttons */}
            <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-40">
                <button
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    className="p-3 bg-white rounded-full shadow-lg hover:shadow-xl transition-all group"
                >
                    {isFullscreen ? (
                        <Minimize2 size={20} className="text-gray-600 group-hover:text-green-600" />
                    ) : (
                        <Maximize2 size={20} className="text-gray-600 group-hover:text-green-600" />
                    )}
                </button>
                <button
                    onClick={exportData}
                    className="p-3 bg-white rounded-full shadow-lg hover:shadow-xl transition-all group"
                    disabled={!simulationResult}
                >
                    <Download size={20} className="text-gray-600 group-hover:text-green-600" />
                </button>
                <button
                    onClick={saveConfiguration}
                    className="p-3 bg-white rounded-full shadow-lg hover:shadow-xl transition-all group"
                    disabled={!simulationResult}
                >
                    <Save size={20} className="text-gray-600 group-hover:text-green-600" />
                </button>
            </div>

            <div className="max-w-7xl mx-auto p-6 space-y-6">

                {/* HEADER SECTION */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-gradient-to-br from-green-400 to-emerald-600 rounded-2xl shadow-lg">
                                <BrainCircuit className="text-white" size={28} />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold bg-gradient-to-r from-green-700 to-emerald-600 bg-clip-text text-transparent">
                                    Profit Simulation Engine
                                </h1>
                                <p className="text-gray-500 mt-1 flex items-center gap-2">
                                    <Sparkles size={14} className="text-green-500" />
                                    Advanced predictive analytics & profitability modeling
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="flex bg-gray-100 rounded-xl p-1">
                                {Object.entries(VIEW_MODES).map(([key, { icon: Icon, label }]) => (
                                    <button
                                        key={key}
                                        onClick={() => setViewMode(key)}
                                        className={`px-3 py-2 rounded-lg flex items-center gap-2 text-sm transition-all ${viewMode === key
                                                ? 'bg-white shadow-sm text-green-700'
                                                : 'text-gray-600 hover:text-gray-900'
                                            }`}
                                    >
                                        <Icon size={16} />
                                        {label}
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={() => setShowAdvanced(!showAdvanced)}
                                className={`px-4 py-2 rounded-xl border transition-all flex items-center gap-2 text-sm ${showAdvanced
                                        ? 'bg-green-50 border-green-200 text-green-700'
                                        : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                                    }`}
                            >
                                <Gauge size={16} />
                                {showAdvanced ? 'Simple View' : 'Advanced'}
                            </button>

                            <button
                                onClick={resetInputs}
                                className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-600 hover:border-gray-300 transition-all flex items-center gap-2 text-sm"
                            >
                                <RotateCcw size={16} />
                                Reset
                            </button>
                        </div>
                    </div>
                </div>

                {/* SCENARIO SELECTOR */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Sliders size={18} className="text-green-600" />
                        <h2 className="font-semibold text-gray-800">Market Scenarios</h2>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {Object.entries(SCENARIOS).map(([key, scenario]) => {
                            const Icon = scenario.icon;
                            return (
                                <motion.button
                                    key={key}
                                    whileHover={{ scale: 1.02, y: -2 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => applyScenario(key)}
                                    className={`p-4 rounded-2xl border-2 transition-all text-left ${selectedScenario === key
                                            ? `${scenario.border} bg-gradient-to-br ${scenario.bg} to-white shadow-md`
                                            : 'border-gray-100 bg-white hover:border-gray-200'
                                        }`}
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className={`p-1.5 rounded-lg ${scenario.bg}`}>
                                            <Icon size={16} className={scenario.color} />
                                        </div>
                                        <span className={`font-semibold text-sm ${scenario.color}`}>
                                            {scenario.name}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500">{scenario.description}</p>
                                </motion.button>
                            );
                        })}
                    </div>
                </div>

                {/* PRODUCT SELECTOR & INPUTS */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                    {/* Product Selector */}
                    <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                        <label className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
                            <Package size={16} className="text-green-600" />
                            Select Product
                        </label>

                        <select
                            className="w-full p-3 rounded-xl border border-gray-200 focus:border-green-400 focus:ring-2 focus:ring-green-100 bg-gray-50 transition-all outline-none"
                            value={productId || ""}
                            onChange={(e) => setProductId(e.target.value)}
                        >
                            <option value="">Choose a product to simulate</option>
                            {products.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.name} � Buy: ${p.buy_price} | Sell: ${p.sell_price}
                                </option>
                            ))}
                        </select>

                        {product && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-4 p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100"
                            >
                                <h3 className="font-semibold text-green-900 mb-2">{product.name}</h3>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <span className="text-green-700">Buy Price:</span>
                                        <span className="font-semibold text-green-900 ml-1">
                                            {formatters.currency(product.buy_price)}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-green-700">Sell Price:</span>
                                        <span className="font-semibold text-green-900 ml-1">
                                            {formatters.currency(product.sell_price)}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-green-700">Margin:</span>
                                        <span className="font-semibold text-green-900 ml-1">
                                            {formatters.percentage(((product.sell_price - product.buy_price) / product.sell_price) * 100)}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-green-700">Markup:</span>
                                        <span className="font-semibold text-green-900 ml-1">
                                            {formatters.percentage(((product.sell_price - product.buy_price) / product.buy_price) * 100)}
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* Input Controls */}
                    <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-3">
                        <InputCard
                            label="Lead Volume"
                            value={inputs.leads}
                            onChange={(v) => setInputs(p => ({ ...p, leads: Number(v) }))}
                            icon={Zap}
                            prefix=""
                            suffix=""
                        />

                        <InputCard
                            label="Cost per Lead"
                            value={inputs.costPerLead}
                            onChange={(v) => setInputs(p => ({ ...p, costPerLead: Number(v) }))}
                            icon={DollarSign}
                            prefix="$"
                            step="0.01"
                        />

                        <InputCard
                            label="Confirmation Rate"
                            value={inputs.confirmationRate}
                            onChange={(v) => setInputs(p => ({ ...p, confirmationRate: Number(v) }))}
                            icon={Percent}
                            suffix="%"
                        />

                        <InputCard
                            label="Delivery Rate"
                            value={inputs.deliveryRate}
                            onChange={(v) => setInputs(p => ({ ...p, deliveryRate: Number(v) }))}
                            icon={Package}
                            suffix="%"
                        />
                    </div>
                </div>

                {/* SIMULATION RESULTS - CONDITIONAL */}
                {!simulationResult ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-3xl shadow-sm border border-gray-100 p-12 text-center"
                    >
                        <div className="p-4 bg-green-50 rounded-full inline-flex mb-4">
                            <Calculator className="text-green-500" size={48} />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">Ready to Simulate</h3>
                        <p className="text-gray-500 max-w-md mx-auto">
                            Select a product and adjust the parameters to start generating profit simulations and insights.
                        </p>
                    </motion.div>
                ) : (
                    <>
                        {/* TAB NAVIGATION */}
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-2">
                            <div className="flex gap-1">
                                {['overview', 'financials', 'analytics', 'projections', 'history'].map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all capitalize ${activeTab === tab
                                                ? 'bg-green-50 text-green-700 shadow-sm'
                                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                            }`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* OVERVIEW TAB */}
                        {activeTab === 'overview' && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-6"
                            >
                                {/* Primary KPIs */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <KPICard
                                        label="Total Revenue"
                                        value={formatters.currency(simulationResult.totalRevenue)}
                                        icon={TrendingUp}
                                        trend={previousResult ? analytics.getTrendIndicator(simulationResult.totalRevenue, previousResult.totalRevenue) : null}
                                        color="green"
                                    />
                                    <KPICard
                                        label="Net Profit"
                                        value={formatters.currency(simulationResult.grossProfit)}
                                        icon={DollarSign}
                                        trend={previousResult ? analytics.getTrendIndicator(simulationResult.grossProfit, previousResult.grossProfit) : null}
                                        color={simulationResult.grossProfit >= 0 ? 'green' : 'red'}
                                        highlight={simulationResult.grossProfit < 0}
                                    />
                                    <KPICard
                                        label="ROI"
                                        value={formatters.percentage(simulationResult.roi)}
                                        icon={Target}
                                        color={simulationResult.roi >= 50 ? 'green' : simulationResult.roi >= 0 ? 'amber' : 'red'}
                                    />
                                    <KPICard
                                        label="Profit Margin"
                                        value={formatters.percentage(simulationResult.profitMargin)}
                                        icon={Scale}
                                        color={simulationResult.profitMargin >= 25 ? 'green' : simulationResult.profitMargin >= 10 ? 'amber' : 'red'}
                                    />
                                </div>

                                {/* Charts Row */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Profit Projection Chart */}
                                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                                <BarChart3 size={18} className="text-green-600" />
                                                Profit Projection
                                            </h3>
                                            <Badge variant="info">20 Steps</Badge>
                                        </div>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <AreaChart data={projections}>
                                                <defs>
                                                    <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                                                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                                    </linearGradient>
                                                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#16a34a" stopOpacity={0.1} />
                                                        <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                                <XAxis dataKey="leads" stroke="#9ca3af" tick={{ fontSize: 12 }} />
                                                <YAxis stroke="#9ca3af" tick={{ fontSize: 12 }} />
                                                <Tooltip contentStyle={{
                                                    backgroundColor: 'white',
                                                    border: '1px solid #e5e7eb',
                                                    borderRadius: '12px',
                                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                                }} />
                                                <Legend />
                                                <Area
                                                    type="monotone"
                                                    dataKey="revenue"
                                                    stroke="#16a34a"
                                                    fill="url(#revenueGrad)"
                                                    strokeWidth={2}
                                                    name="Revenue"
                                                />
                                                <Area
                                                    type="monotone"
                                                    dataKey="profit"
                                                    stroke="#22c55e"
                                                    fill="url(#profitGrad)"
                                                    strokeWidth={3}
                                                    name="Profit"
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>

                                    {/* Cost Distribution Pie Chart */}
                                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                                <PieChartIcon size={18} className="text-green-600" />
                                                Cost Distribution
                                            </h3>
                                            <Badge variant="success">
                                                {formatters.currency(simulationResult.totalCosts)} Total
                                            </Badge>
                                        </div>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <PieChart>
                                                <Pie
                                                    data={pieChartData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={100}
                                                    paddingAngle={2}
                                                    dataKey="value"
                                                >
                                                    {pieChartData.map((entry, index) => (
                                                        <Cell key={index} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip />
                                                <Legend />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Funnel & Risk Assessment */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Conversion Funnel */}
                                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                                        <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-4">
                                            <Filter size={18} className="text-green-600" />
                                            Conversion Funnel
                                        </h3>
                                        <div className="space-y-3">
                                            <FunnelStep
                                                label="Total Leads"
                                                value={simulationResult.leads}
                                                percentage={100}
                                                color="bg-gradient-to-r from-gray-200 to-gray-300"
                                            />
                                            <FunnelStep
                                                label="Confirmed Orders"
                                                value={simulationResult.confirmedOrders.toFixed(0)}
                                                percentage={(simulationResult.confirmedOrders / simulationResult.leads) * 100}
                                                color="bg-gradient-to-r from-green-200 to-green-300"
                                            />
                                            <FunnelStep
                                                label="Delivered Orders"
                                                value={simulationResult.deliveredOrders.toFixed(0)}
                                                percentage={(simulationResult.deliveredOrders / simulationResult.leads) * 100}
                                                color="bg-gradient-to-r from-green-300 to-emerald-400"
                                            />
                                            <FunnelStep
                                                label="Successful Orders"
                                                value={simulationResult.successfulOrders.toFixed(0)}
                                                percentage={(simulationResult.successfulOrders / simulationResult.leads) * 100}
                                                color="bg-gradient-to-r from-emerald-400 to-green-500"
                                                highlight
                                            />
                                            <FunnelStep
                                                label="Upsells"
                                                value={simulationResult.upsells.toFixed(0)}
                                                percentage={(simulationResult.upsells / simulationResult.leads) * 100}
                                                color="bg-gradient-to-r from-purple-300 to-purple-400"
                                            />
                                        </div>
                                    </div>

                                    {/* Risk Assessment Radar */}
                                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                                        <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-4">
                                            <Gauge size={18} className="text-green-600" />
                                            Performance Radar
                                        </h3>
                                        <ResponsiveContainer width="100%" height={280}>
                                            <RadarChart data={radarData}>
                                                <PolarGrid stroke="#e5e7eb" />
                                                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: '#6b7280' }} />
                                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
                                                <Radar
                                                    name="Performance"
                                                    dataKey="value"
                                                    stroke="#22c55e"
                                                    fill="#22c55e"
                                                    fillOpacity={0.3}
                                                    strokeWidth={2}
                                                />
                                            </RadarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* FINANCIALS TAB */}
                        {activeTab === 'financials' && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-6"
                            >
                                {/* Revenue Breakdown */}
                                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                                    <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-4">
                                        <DollarSign size={18} className="text-green-600" />
                                        Revenue Streams
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FinancialCard
                                            label="Primary Revenue"
                                            value={formatters.currency(simulationResult.primaryRevenue)}
                                            subtext={`${simulationResult.successfulOrders.toFixed(0)} orders � ${formatters.currency(product.sell_price)}`}
                                            color="green"
                                        />
                                        <FinancialCard
                                            label="Upsell Revenue"
                                            value={formatters.currency(simulationResult.upsellRevenue)}
                                            subtext={`${simulationResult.upsells.toFixed(0)} upsells � ${formatters.currency(inputs.upsellValue)}`}
                                            color="purple"
                                        />
                                        <FinancialCard
                                            label="Total Revenue"
                                            value={formatters.currency(simulationResult.totalRevenue)}
                                            subtext={`${simulationResult.deliveredOrders.toFixed(0)} total deliveries`}
                                            color="green"
                                            highlight
                                        />
                                        <FinancialCard
                                            label="Average Order Value"
                                            value={formatters.currency(simulationResult.aov)}
                                            subtext={`Per delivered order`}
                                            color="blue"
                                        />
                                    </div>
                                </div>

                                {/* Cost Breakdown */}
                                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                                    <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-4">
                                        <TrendingDown size={18} className="text-red-600" />
                                        Cost Structure
                                    </h3>
                                    <div className="space-y-2">
                                        <BreakdownRow
                                            label="Product COGS"
                                            value={formatters.currency(simulationResult.productCost)}
                                            percentage={(simulationResult.productCost / simulationResult.totalCosts) * 100}
                                        />
                                        <BreakdownRow
                                            label="Advertising"
                                            value={formatters.currency(simulationResult.adsCost)}
                                            percentage={(simulationResult.adsCost / simulationResult.totalCosts) * 100}
                                        />
                                        <BreakdownRow
                                            label="Shipping"
                                            value={formatters.currency(simulationResult.shippingCost)}
                                            percentage={(simulationResult.shippingCost / simulationResult.totalCosts) * 100}
                                        />
                                        <BreakdownRow
                                            label="Agent Fees"
                                            value={formatters.currency(simulationResult.agentFees)}
                                            percentage={(simulationResult.agentFees / simulationResult.totalCosts) * 100}
                                        />
                                        <BreakdownRow
                                            label="Platform Fees"
                                            value={formatters.currency(simulationResult.platformFees)}
                                            percentage={(simulationResult.platformFees / simulationResult.totalCosts) * 100}
                                        />
                                        <BreakdownRow
                                            label="Payment Processing"
                                            value={formatters.currency(simulationResult.paymentFees)}
                                            percentage={(simulationResult.paymentFees / simulationResult.totalCosts) * 100}
                                        />

                                        <div className="border-t-2 border-gray-200 pt-3 mt-3">
                                            <BreakdownRow
                                                label="TOTAL COSTS"
                                                value={formatters.currency(simulationResult.totalCosts)}
                                                bold
                                            />
                                            <BreakdownRow
                                                label="NET PROFIT"
                                                value={formatters.currency(simulationResult.grossProfit)}
                                                bold
                                                highlight={simulationResult.grossProfit >= 0}
                                                danger={simulationResult.grossProfit < 0}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Unit Economics */}
                                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                                    <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-4">
                                        <Package size={18} className="text-green-600" />
                                        Unit Economics
                                    </h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <MetricBox
                                            label="Unit Profit"
                                            value={formatters.currency(simulationResult.unitProfit)}
                                            trend="up"
                                        />
                                        <MetricBox
                                            label="Contribution Margin"
                                            value={formatters.percentage(simulationResult.contributionMargin)}
                                        />
                                        <MetricBox
                                            label="CAC"
                                            value={formatters.currency(simulationResult.cac)}
                                        />
                                        <MetricBox
                                            label="LTV (est.)"
                                            value={formatters.currency(simulationResult.aov * 1.5)}
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* ANALYTICS TAB */}
                        {activeTab === 'analytics' && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-6"
                            >
                                {/* Performance Indicators */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                                        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                            <Target size={18} className="text-green-600" />
                                            ROI Analysis
                                        </h3>
                                        <div className="text-4xl font-bold text-green-700 mb-2">
                                            {formatters.percentage(simulationResult.roi)}
                                        </div>
                                        <ProgressBar value={simulationResult.roi} max={200} color="green" />
                                        <p className="text-xs text-gray-500 mt-2">
                                            Break-even ROAS: {simulationResult.breakEvenROAS.toFixed(2)}x
                                        </p>
                                    </div>

                                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                                        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                            <Scale size={18} className="text-green-600" />
                                            Risk Assessment
                                        </h3>
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className={`px-3 py-1 rounded-full text-sm font-semibold ${analytics.getRiskColor(simulationResult.riskLevel)
                                                }`}>
                                                {simulationResult.riskLevel.toUpperCase()}
                                            </div>
                                        </div>
                                        <ProgressBar
                                            value={100 - (simulationResult.riskLevel === 'low' ? 25 : simulationResult.riskLevel === 'moderate' ? 50 : simulationResult.riskLevel === 'high' ? 75 : 90)}
                                            max={100}
                                            color={simulationResult.riskLevel === 'low' ? 'green' : simulationResult.riskLevel === 'moderate' ? 'amber' : 'red'}
                                        />
                                    </div>

                                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                                        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                            <Zap size={18} className="text-green-600" />
                                            Scalability Score
                                        </h3>
                                        <div className="text-4xl font-bold text-green-700 mb-2">
                                            {simulationResult.scalabilityScore.toFixed(0)}/100
                                        </div>
                                        <ProgressBar value={simulationResult.scalabilityScore} max={100} color="green" />
                                        <p className="text-xs text-gray-500 mt-2">
                                            Quality Score: {simulationResult.qualityScore.toFixed(1)}/10
                                        </p>
                                    </div>
                                </div>

                                {/* Break-even Analysis */}
                                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                                    <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                        <Info size={18} className="text-green-600" />
                                        Break-even Analysis
                                    </h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <MetricBox
                                            label="Break-even Leads"
                                            value={formatters.number(simulationResult.breakEvenLeads.toFixed(0))}
                                        />
                                        <MetricBox
                                            label="Break-even CPL"
                                            value={formatters.currency(simulationResult.breakEvenCPL)}
                                        />
                                        <MetricBox
                                            label="Payback Period"
                                            value={`${simulationResult.paybackPeriod.toFixed(1)} days`}
                                        />
                                        <MetricBox
                                            label="Efficiency Ratio"
                                            value={`${simulationResult.efficiencyRatio.toFixed(2)}x`}
                                        />
                                    </div>
                                </div>

                                {/* Conversion Metrics */}
                                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                                    <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                        <Activity size={18} className="text-green-600" />
                                        Conversion Metrics
                                    </h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <MetricBox
                                            label="Conversion Rate"
                                            value={formatters.percentage(simulationResult.conversionRate)}
                                        />
                                        <MetricBox
                                            label="Delivery Rate"
                                            value={formatters.percentage(simulationResult.deliveredOrders / simulationResult.confirmedOrders * 100)}
                                        />
                                        <MetricBox
                                            label="Return Rate"
                                            value={formatters.percentage(simulationResult.returnedOrders / simulationResult.deliveredOrders * 100)}
                                        />
                                        <MetricBox
                                            label="Upsell Rate"
                                            value={formatters.percentage(simulationResult.upsells / simulationResult.deliveredOrders * 100)}
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* PROJECTIONS TAB */}
                        {activeTab === 'projections' && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-6"
                            >
                                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                                    <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                        <BarChart3 size={18} className="text-green-600" />
                                        Growth Projections
                                    </h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b border-gray-200">
                                                    <th className="text-left py-3 px-4 text-gray-600 font-medium">Scale</th>
                                                    <th className="text-right py-3 px-4 text-gray-600 font-medium">Leads</th>
                                                    <th className="text-right py-3 px-4 text-gray-600 font-medium">Revenue</th>
                                                    <th className="text-right py-3 px-4 text-gray-600 font-medium">Costs</th>
                                                    <th className="text-right py-3 px-4 text-gray-600 font-medium">Profit</th>
                                                    <th className="text-right py-3 px-4 text-gray-600 font-medium">ROI</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {projections.map((proj, idx) => (
                                                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                                        <td className="py-3 px-4 font-medium text-gray-800">{proj.step}x</td>
                                                        <td className="text-right py-3 px-4">{formatters.number(proj.leads.toFixed(0))}</td>
                                                        <td className="text-right py-3 px-4 text-green-700">
                                                            {formatters.currency(proj.revenue)}
                                                        </td>
                                                        <td className="text-right py-3 px-4 text-red-600">
                                                            {formatters.currency(proj.costs)}
                                                        </td>
                                                        <td className={`text-right py-3 px-4 font-semibold ${proj.profit >= 0 ? 'text-green-600' : 'text-red-600'
                                                            }`}>
                                                            {formatters.currency(proj.profit)}
                                                        </td>
                                                        <td className="text-right py-3 px-4">{proj.roi.toFixed(1)}%</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* HISTORY TAB */}
                        {activeTab === 'history' && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-6"
                            >
                                {/* Saved Configurations */}
                                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                                    <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                        <Save size={18} className="text-green-600" />
                                        Saved Configurations
                                    </h3>
                                    {savedConfigs.length === 0 ? (
                                        <p className="text-gray-500 text-center py-8">No saved configurations yet</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {savedConfigs.map((config, idx) => (
                                                <div
                                                    key={idx}
                                                    className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                                                    onClick={() => loadConfiguration(config)}
                                                >
                                                    <div>
                                                        <p className="font-medium text-gray-800">{config.name}</p>
                                                        <p className="text-xs text-gray-500">
                                                            {new Date(config.timestamp).toLocaleString()}
                                                        </p>
                                                    </div>
                                                    <Badge variant="success">{config.scenario}</Badge>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Simulation History */}
                                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                                    <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                        <History size={18} className="text-green-600" />
                                        Recent Simulations
                                    </h3>
                                    {history.length === 0 ? (
                                        <p className="text-gray-500 text-center py-8">No simulation history yet</p>
                                    ) : (
                                        <div className="space-y-2 max-h-96 overflow-y-auto">
                                            {history.slice().reverse().slice(0, 20).map((sim, idx) => (
                                                <div
                                                    key={idx}
                                                    className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-2 h-2 rounded-full ${sim.grossProfit > 0 ? 'bg-green-500' : 'bg-red-500'
                                                            }`} />
                                                        <div>
                                                            <p className="font-medium text-gray-800 text-sm">{sim.productName}</p>
                                                            <p className="text-xs text-gray-500">
                                                                {new Date(sim.timestamp).toLocaleString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4 text-sm">
                                                        <span className="text-gray-600">{sim.leads} leads</span>
                                                        <span className="text-gray-600">{formatters.currency(sim.totalRevenue)}</span>
                                                        <span className={`font-semibold ${sim.grossProfit >= 0 ? 'text-green-600' : 'text-red-600'
                                                            }`}>
                                                            {formatters.currency(sim.grossProfit)}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {/* RISK ALERT */}
                        {simulationResult.grossProfit < 0 && (
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3"
                            >
                                <AlertTriangle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                                <div>
                                    <h4 className="font-semibold text-red-800">Loss Alert</h4>
                                    <p className="text-sm text-red-700 mt-1">
                                        This configuration generates a loss of {formatters.currency(Math.abs(simulationResult.grossProfit))}.
                                        Consider increasing the price, reducing ad spend, or improving conversion rates.
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

/* =========================================================
   INPUT CARD COMPONENT
========================================================= */
function InputCard({ label, value, onChange, icon: Icon, prefix = "", suffix = "", step = "1" }) {
    return (
        <motion.div
            whileHover={{ scale: 1.02, y: -2 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-all"
        >
            <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-green-50 rounded-lg">
                    <Icon size={14} className="text-green-600" />
                </div>
                <p className="text-xs font-medium text-gray-600">{label}</p>
            </div>
            <div className="flex items-center gap-1">
                {prefix && <span className="text-lg text-gray-400">{prefix}</span>}
                <input
                    type="number"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    step={step}
                    className="w-full bg-transparent font-bold text-2xl text-gray-900 outline-none"
                />
                {suffix && <span className="text-lg text-gray-400">{suffix}</span>}
            </div>
        </motion.div>
    );
}

/* =========================================================
   KPI CARD COMPONENT
========================================================= */
function KPICard({ label, value, icon: Icon, trend, color = 'green', highlight = false }) {
    const colors = {
        green: 'from-green-50 to-emerald-50 border-green-100',
        red: 'from-red-50 to-rose-50 border-red-100',
        amber: 'from-amber-50 to-orange-50 border-amber-100',
        blue: 'from-blue-50 to-cyan-50 border-blue-100',
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02, y: -4 }}
            className={`bg-gradient-to-br ${colors[color]} rounded-2xl p-5 border shadow-sm hover:shadow-md transition-all ${highlight ? 'ring-2 ring-red-300' : ''
                }`}
        >
            <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-white rounded-xl shadow-sm">
                    <Icon size={18} className={color === 'red' ? 'text-red-600' : 'text-green-600'} />
                </div>
                {trend && (
                    <div className={`flex items-center gap-1 text-xs font-medium ${trend.color}`}>
                        {trend.isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                        {trend.value}%
                    </div>
                )}
            </div>
            <p className="text-xs font-medium text-gray-600 mb-1">{label}</p>
            <p className={`text-2xl font-bold ${color === 'red' ? 'text-red-700' :
                    color === 'amber' ? 'text-amber-700' :
                        'text-green-800'
                }`}>
                {value}
            </p>
        </motion.div>
    );
}

/* =========================================================
   FUNNEL STEP COMPONENT
========================================================= */
function FunnelStep({ label, value, percentage, color, highlight = false }) {
    return (
        <div className="relative">
            <div className="flex items-center justify-between mb-1">
                <span className={`text-sm ${highlight ? 'font-semibold text-green-900' : 'text-gray-700'}`}>
                    {label}
                </span>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-600">{value}</span>
                    <Badge variant={highlight ? 'success' : 'default'}>
                        {percentage.toFixed(1)}%
                    </Badge>
                </div>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={`h-full rounded-full ${color}`}
                />
            </div>
        </div>
    );
}

/* =========================================================
   BREAKDOWN ROW COMPONENT
========================================================= */
function BreakdownRow({ label, value, percentage, bold = false, highlight = false, danger = false }) {
    return (
        <div className={`flex items-center justify-between py-2.5 px-3 rounded-lg ${bold ? 'bg-gray-50' : 'hover:bg-gray-50 transition-colors'
            }`}>
            <span className={`text-sm ${bold ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                {label}
                {percentage && (
                    <span className="ml-2 text-xs text-gray-400">({percentage.toFixed(1)}%)</span>
                )}
            </span>
            <span className={`text-sm font-medium ${danger ? 'text-red-600' :
                    highlight ? 'text-green-600' :
                        'text-gray-900'
                }`}>
                {value}
            </span>
        </div>
    );
}

/* =========================================================
   FINANCIAL CARD COMPONENT
========================================================= */
function FinancialCard({ label, value, subtext, color = 'green', highlight = false }) {
    const colors = {
        green: 'border-l-4 border-l-green-500',
        purple: 'border-l-4 border-l-purple-500',
        blue: 'border-l-4 border-l-blue-500',
    };

    return (
        <div className={`p-4 bg-gray-50 rounded-xl ${colors[color]} ${highlight ? 'ring-2 ring-green-200' : ''
            }`}>
            <p className="text-sm text-gray-600 mb-1">{label}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {subtext && <p className="text-xs text-gray-500 mt-1">{subtext}</p>}
        </div>
    );
}

/* =========================================================
   METRIC BOX COMPONENT
========================================================= */
function MetricBox({ label, value, trend }) {
    return (
        <div className="p-4 bg-gray-50 rounded-xl text-center">
            <p className="text-xs text-gray-600 mb-1">{label}</p>
            <p className="text-xl font-bold text-gray-900">{value}</p>
            {trend && (
                <div className="flex items-center justify-center gap-1 mt-1">
                    {trend === 'up' ? (
                        <ArrowUpRight size={14} className="text-green-600" />
                    ) : (
                        <ArrowDownRight size={14} className="text-red-600" />
                    )}
                </div>
            )}
        </div>
    );
}

/* =========================================================
   PROTECTED PAGE WRAPPER
========================================================= */
export default function StimulationsPageWrapper() {
    return (
        <ProtectedPage page="stimulations">
            <StimulationsPage />
        </ProtectedPage>
    );
}