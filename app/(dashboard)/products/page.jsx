"use client";

import { useEffect, useState, useMemo, useCallback, useRef, createContext, useContext } from "react";
import { supabase } from "@/lib/supabase/client";
import ProtectedPage from "@/components/ProtectedPage";
import * as XLSX from "xlsx";
import {
    Plus, Search, Download, Edit, Trash2, Copy, X,
    Table2, Grid3x3, Package, Layers,
    TrendingUp, TrendingDown, AlertTriangle, CheckCheck, Loader2,
    RefreshCw, ArrowUpDown, ArrowUp, ArrowDown, BarChart3,
    ChevronLeft, ChevronRight, FileSpreadsheet,
    Moon, Sun, Pencil, CheckCircle2, XCircle, Info, Banknote
} from "lucide-react";
import { createPortal } from "react-dom";

// ─── UTILITY FUNCTIONS ────────────────────────────────────
const cn = (...classes) => classes.filter(Boolean).join(' ');

const formatMAD = (amount) => {
    return new Intl.NumberFormat('fr-MA', {
        style: 'currency',
        currency: 'MAD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
};

const formatMADCompact = (amount) => {
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M MAD`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K MAD`;
    return formatMAD(amount);
};

const formatNumber = (n) => new Intl.NumberFormat('en-US').format(n);
const formatPercentage = (v, d = 1) => `${v.toFixed(d)}%`;

// ─── HOOKS ────────────────────────────────────────────────
function useDebounce(value, delay = 300) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);
    return debouncedValue;
}

function useLocalStorage(key, initialValue) {
    const [storedValue, setStoredValue] = useState(() => {
        if (typeof window === 'undefined') return initialValue;
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch { return initialValue; }
    });

    const setValue = (value) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            if (typeof window !== 'undefined') window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (e) { console.error(e); }
    };
    return [storedValue, setValue];
}

// ─── TOAST SYSTEM ─────────────────────────────────────────
const ToastContext = createContext(null);

function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'success', options = {}) => {
        const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const toast = { id, message, type, duration: options.duration || 4000, action: options.action || null };
        setToasts(prev => [...prev, toast]);
        if (toast.duration > 0) setTimeout(() => dismissToast(id), toast.duration);
        return id;
    }, []);

    const dismissToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const contextValue = useMemo(() => ({
        toasts, addToast, dismissToast,
        success: (m, o) => addToast(m, 'success', o),
        error: (m, o) => addToast(m, 'error', o),
        warning: (m, o) => addToast(m, 'warning', o),
        info: (m, o) => addToast(m, 'info', o),
    }), [toasts, addToast, dismissToast]);

    return (
        <ToastContext.Provider value={contextValue}>
            {children}
            <ToastContainer />
        </ToastContext.Provider>
    );
}

function useToast() {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within a ToastProvider');
    return context;
}

const TOAST_STYLES = {
    success: { icon: CheckCircle2, bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-800', text: 'text-green-800 dark:text-green-200', iconColor: 'text-green-600 dark:text-green-400' },
    error: { icon: XCircle, bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800', text: 'text-red-800 dark:text-red-200', iconColor: 'text-red-600 dark:text-red-400' },
    warning: { icon: AlertTriangle, bg: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'border-yellow-200 dark:border-yellow-800', text: 'text-yellow-800 dark:text-yellow-200', iconColor: 'text-yellow-600 dark:text-yellow-400' },
    info: { icon: Info, bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800', text: 'text-blue-800 dark:text-blue-200', iconColor: 'text-blue-600 dark:text-blue-400' },
};

function ToastContainer() {
    const { toasts, dismissToast } = useToast();
    if (!toasts.length) return null;

    return createPortal(
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col-reverse gap-2 max-w-sm pointer-events-none">
            {toasts.map((toast, index) => {
                const style = TOAST_STYLES[toast.type] || TOAST_STYLES.info;
                const Icon = style.icon;
                return (
                    <div key={toast.id} className={cn("flex items-start gap-3 p-4 rounded-xl shadow-lg border pointer-events-auto bg-white dark:bg-gray-800", style.border)} style={{ opacity: 1 - index * 0.1 }}>
                        <Icon size={16} className={cn("mt-0.5 flex-shrink-0", style.iconColor)} />
                        <div className="flex-1">
                            <p className={cn("text-sm leading-5", style.text)}>{toast.message}</p>
                            {toast.action && <button onClick={toast.action.onClick} className={cn("text-xs font-semibold mt-1", style.iconColor)}>{toast.action.label} →</button>}
                        </div>
                        <button onClick={() => dismissToast(toast.id)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0"><X size={14} /></button>
                    </div>
                );
            })}
        </div>,
        document.body
    );
}

// ─── MODAL ────────────────────────────────────────────────
function Modal({ isOpen, onClose, children, maxWidth = 'max-w-lg' }) {
    useEffect(() => {
        if (!isOpen) return;
        const handleEscape = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handleEscape);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className={cn("bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full overflow-hidden flex flex-col", maxWidth)} style={{ maxHeight: '90vh' }}>
                {children}
            </div>
        </div>,
        document.body
    );
}

function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmLabel = 'Delete', variant = 'danger' }) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-md">
            <div className="p-6">
                <div className="flex items-start gap-4 mb-6">
                    <div className={cn("w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0", variant === 'danger' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-yellow-100 dark:bg-yellow-900/30')}>
                        {variant === 'danger' ? <Trash2 size={20} className="text-red-600 dark:text-red-400" /> : <AlertTriangle size={20} className="text-yellow-600 dark:text-yellow-400" />}
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium">Cancel</button>
                    <button onClick={() => { onConfirm(); onClose(); }} className={cn("flex-1 px-4 py-2.5 rounded-lg text-white text-sm font-medium transition-colors", variant === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700')}>{confirmLabel}</button>
                </div>
            </div>
        </Modal>
    );
}

// ─── BADGES ───────────────────────────────────────────────
function StockBadge({ quantity, showLabel = false }) {
    const status = useMemo(() => {
        if (quantity <= 0) return { type: 'error', label: 'Out of Stock', classes: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400' };
        if (quantity < 10) return { type: 'warning', label: 'Low Stock', classes: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400' };
        if (quantity < 50) return { type: 'info', label: 'In Stock', classes: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' };
        return { type: 'success', label: 'Well Stocked', classes: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' };
    }, [quantity]);

    return (
        <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold", status.classes)}>
            <span className={cn("w-1.5 h-1.5 rounded-full", status.type === 'error' && "bg-red-500 animate-pulse", status.type === 'warning' && "bg-yellow-500 animate-pulse", status.type === 'info' && "bg-blue-500", status.type === 'success' && "bg-green-500")} />
            {showLabel ? status.label : quantity}
        </span>
    );
}

function MarginBadge({ buyPrice, sellPrice }) {
    if (!buyPrice || !sellPrice || buyPrice <= 0) return null;
    const margin = ((sellPrice - buyPrice) / buyPrice) * 100;
    const isGood = margin > 30;

    return (
        <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold", isGood ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400')}>
            {isGood ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {formatPercentage(margin)}
        </span>
    );
}

// ─── SKELETONS ────────────────────────────────────────────
function SkeletonGrid() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 animate-pulse">
                    <div className="flex justify-between mb-5">
                        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-xl" />
                        <div className="w-20 h-6 bg-gray-200 dark:bg-gray-700 rounded-full" />
                    </div>
                    <div className="h-5 w-3/4 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                    <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded mb-6" />
                    <div className="flex justify-between pt-5 border-t border-gray-200 dark:border-gray-700">
                        <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
                        <div className="h-6 w-12 bg-gray-200 dark:bg-gray-700 rounded" />
                    </div>
                </div>
            ))}
        </div>
    );
}

function SkeletonTable() {
    return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden animate-pulse">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex gap-4">
                    {[40, 200, 100, 90, 90, 80, 80, 90, 80].map((w, i) => <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded" style={{ width: w }} />)}
                </div>
            </div>
            {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex gap-4">
                        {[40, 200, 100, 90, 90, 80, 80, 90, 80].map((w, j) => <div key={j} className="h-3 bg-gray-200 dark:bg-gray-700 rounded" style={{ width: w }} />)}
                    </div>
                </div>
            ))}
        </div>
    );
}

function EmptyState({ hasFilters, onAdd }) {
    return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-16 text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-green-50 dark:bg-green-900/20 rounded-2xl flex items-center justify-center">
                <Package size={36} className="text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{hasFilters ? 'No matching products' : 'Start your inventory'}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                {hasFilters ? 'Try adjusting your search or filters.' : 'Add your first product to start tracking inventory, stock levels, and profits.'}
            </p>
            {!hasFilters && (
                <button onClick={onAdd} className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-colors shadow-sm hover:shadow-md">
                    <Plus size={18} /> Add First Product
                </button>
            )}
        </div>
    );
}

// ─── KPI CARD ─────────────────────────────────────────────
function KpiCard({ label, value, subtitle, icon: Icon, color, alert }) {
    return (
        <div className={cn("bg-white dark:bg-gray-800 rounded-xl p-5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5", alert ? 'border border-yellow-200 dark:border-yellow-800' : 'border border-gray-200 dark:border-gray-700 shadow-sm')}>
            <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{label}</span>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
                    <Icon size={20} color={color} />
                </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{value}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">{subtitle}</p>
        </div>
    );
}

// ─── PAGINATION ───────────────────────────────────────────
function Pagination({ currentPage, totalPages, onPageChange }) {
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
        const delta = 2;
        const range = [];
        const rangeWithDots = [];
        let l;

        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) range.push(i);
        }

        for (let i of range) {
            if (l) {
                if (i - l === 2) rangeWithDots.push(l + 1);
                else if (i - l !== 1) rangeWithDots.push('...');
            }
            rangeWithDots.push(i);
            l = i;
        }
        return rangeWithDots;
    };

    return (
        <div className="flex items-center justify-center gap-1.5">
            <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <ChevronLeft size={18} />
            </button>
            {getPageNumbers().map((page, index) => page === '...' ? (
                <span key={`dots-${index}`} className="w-10 text-center text-gray-400 text-sm select-none">...</span>
            ) : (
                <button key={page} onClick={() => onPageChange(page)} className={cn("w-10 h-10 flex items-center justify-center rounded-lg text-sm font-medium transition-colors", page === currentPage ? 'bg-green-600 text-white shadow-sm' : 'border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700')}>
                    {page}
                </button>
            ))}
            <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <ChevronRight size={18} />
            </button>
        </div>
    );
}

// ─── SORT HEADER ──────────────────────────────────────────
function SortHeader({ label, sortKey, currentSort, onSort }) {
    const isActive = currentSort.key === sortKey;
    const direction = isActive ? currentSort.direction : null;

    return (
        <th onClick={() => onSort(sortKey)} className={cn("px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer select-none transition-colors bg-gray-50 dark:bg-gray-800/50 whitespace-nowrap", isActive ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400')}>
            <span className="inline-flex items-center gap-1">
                {label}
                {isActive ? (direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={12} className="opacity-30" />}
            </span>
        </th>
    );
}

// ─── PRODUCT CARD ─────────────────────────────────────────
function ProductCard({ product, selected, onSelect, onEdit, onDuplicate, onDelete }) {
    const [isHovered, setIsHovered] = useState(false);
    const profit = (product.sell_price || 0) - (product.buy_price || 0);
    const hasBuyPrice = product.buy_price && product.buy_price > 0;

    return (
        <div className={cn("relative bg-white dark:bg-gray-800 rounded-2xl p-5 pb-6 cursor-pointer transition-all duration-200", selected ? 'border-2 border-green-500 shadow-lg shadow-green-500/10' : 'border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg hover:-translate-y-0.5')}
            onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)} onClick={onEdit}>
            <button onClick={(e) => { e.stopPropagation(); onSelect(); }} className={cn("absolute top-5 left-5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all z-10", selected ? 'border-green-500 bg-green-500' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800')}>
                {selected && <CheckCircle2 size={14} className="text-white" />}
            </button>
            <div className={cn("absolute top-4 right-4 flex gap-1 transition-all duration-200 z-10", isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1')}>
                <button onClick={(e) => { e.stopPropagation(); onDuplicate(); }} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" title="Duplicate"><Copy size={14} /></button>
                <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Delete"><Trash2 size={14} /></button>
            </div>
            <div className="flex justify-between items-start mb-5">
                <div className="w-12 h-12 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center"><Package size={26} className="text-green-600 dark:text-green-400" /></div>
                <StockBadge quantity={product.stock_qty || 0} showLabel />
            </div>
            <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-2 truncate">{product.name}</h4>
            <div className="flex gap-2 mb-5 flex-wrap">
                {product.sku && <span className="text-xs font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md text-gray-600 dark:text-gray-400">{product.sku}</span>}
                {product.category && <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md text-gray-600 dark:text-gray-400">{product.category}</span>}
                <span className="text-xs bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-md text-blue-600 dark:text-blue-400 font-semibold">{product.stock_qty || 0} units</span>
            </div>
            <div className="flex justify-between items-end pt-5 border-t border-gray-200 dark:border-gray-700">
                <div>
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Price</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{formatMAD(product.sell_price || 0)}</p>
                </div>
                <div className="text-right">
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">{hasBuyPrice ? 'Profit' : 'Cost'}</p>
                    <div className="flex items-center gap-2">
                        <p className={cn("text-base font-semibold", hasBuyPrice ? (profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400') : 'text-gray-600 dark:text-gray-400')}>
                            {hasBuyPrice ? formatMAD(profit) : formatMAD(product.buy_price || 0)}
                        </p>
                        {hasBuyPrice && <MarginBadge buyPrice={product.buy_price} sellPrice={product.sell_price} />}
                    </div>
                </div>
            </div>
            <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className={cn("absolute bottom-6 left-1/2 -translate-x-1/2 inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 text-sm font-medium shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200", isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2')}>
                <Pencil size={14} /> Edit
            </button>
        </div>
    );
}

// ─── PRODUCT FORM MODAL ───────────────────────────────────
function ProductFormModal({ isOpen, onClose, onSubmit, product, categories }) {
    const [formData, setFormData] = useState({ name: '', sku: '', category: '', buy_price: '', sell_price: '', stock_qty: '0' });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const nameInputRef = useRef(null);
    const { success, error: showError } = useToast();

    useEffect(() => {
        if (isOpen) {
            if (product) {
                setFormData({
                    name: product.name || '', sku: product.sku || '', category: product.category || '',
                    buy_price: product.buy_price?.toString() || '', sell_price: product.sell_price?.toString() || '',
                    stock_qty: (product.stock_qty || 0).toString(),
                });
            } else setFormData({ name: '', sku: '', category: '', buy_price: '', sell_price: '', stock_qty: '0' });
            setErrors({});
            setTimeout(() => nameInputRef.current?.focus(), 100);
        }
    }, [isOpen, product]);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = 'Product name is required';
        if (!formData.sell_price || parseFloat(formData.sell_price) < 0) newErrors.sell_price = 'Selling price is required';
        if (formData.buy_price && parseFloat(formData.buy_price) < 0) newErrors.buy_price = 'Cost price cannot be negative';
        if (parseInt(formData.stock_qty) < 0) newErrors.stock_qty = 'Quantity cannot be negative';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e?.preventDefault();
        if (!validate()) return;
        setIsSubmitting(true);
        try {
            await onSubmit({
                name: formData.name.trim(), sku: formData.sku.trim() || null, category: formData.category.trim() || null,
                buy_price: parseFloat(formData.buy_price) || 0, sell_price: parseFloat(formData.sell_price), stock_qty: parseInt(formData.stock_qty) || 0,
            });
            success(product ? 'Product updated' : 'Product added');
            onClose();
        } catch (error) { showError(`Error: ${error.message}`); }
        finally { setIsSubmitting(false); }
    };

    const profitMargin = useMemo(() => {
        if (!formData.buy_price || !formData.sell_price) return null;
        const buyPrice = parseFloat(formData.buy_price), sellPrice = parseFloat(formData.sell_price);
        if (buyPrice <= 0 || sellPrice <= 0) return null;
        return { margin: ((sellPrice - buyPrice) / buyPrice) * 100, profit: sellPrice - buyPrice };
    }, [formData.buy_price, formData.sell_price]);

    const inputClass = (hasError) => cn("w-full px-3.5 py-2.5 rounded-lg border bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm outline-none transition-all", hasError ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' : 'border-gray-200 dark:border-gray-600 focus:border-green-500 focus:ring-2 focus:ring-green-500/20');

    return (
        <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-lg">
            <form onSubmit={handleSubmit} className="flex flex-col h-full">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{product ? 'Edit Product' : 'Add New Product'}</h2>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{product ? 'Update product details' : 'Add to inventory'}</p>
                        </div>
                        <button type="button" onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"><X size={20} /></button>
                    </div>
                </div>
                <div className="p-6 overflow-y-auto flex-1 space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">Product Name <span className="text-red-500">*</span></label>
                        <input ref={nameInputRef} type="text" value={formData.name} onChange={(e) => handleChange('name', e.target.value)} placeholder="Product name" className={inputClass(!!errors.name)} />
                        {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">SKU</label><input type="text" value={formData.sku} onChange={(e) => handleChange('sku', e.target.value)} placeholder="e.g., SKU-001" className={inputClass(false)} /></div>
                        <div><label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">Category</label><input type="text" value={formData.category} onChange={(e) => handleChange('category', e.target.value)} placeholder="Select or type" list="cats" className={inputClass(false)} /><datalist id="cats">{categories.map(c => <option key={c} value={c} />)}</datalist></div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        {[
                            { label: 'Cost Price (MAD)', field: 'buy_price', error: errors.buy_price },
                            { label: 'Selling Price (MAD)', field: 'sell_price', required: true, error: errors.sell_price },
                            { label: 'Stock Qty', field: 'stock_qty', error: errors.stock_qty },
                        ].map(({ label, field, required, error }) => (
                            <div key={field}>
                                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">{label}{required && <span className="text-red-500"> *</span>}</label>
                                <input type="number" min="0" step={field === 'stock_qty' ? '1' : '0.01'} value={formData[field]} onChange={(e) => handleChange(field, e.target.value)} placeholder="0" className={inputClass(!!error)} />
                                {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
                            </div>
                        ))}
                    </div>
                    {profitMargin && (
                        <div className={cn("p-5 rounded-xl border flex items-center justify-between", profitMargin.margin > 30 ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800')}>
                            <div>
                                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Profit Margin</p>
                                <p className={cn("text-2xl font-bold", profitMargin.margin > 30 ? 'text-green-700 dark:text-green-400' : 'text-yellow-700 dark:text-yellow-400')}>{formatPercentage(profitMargin.margin)}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Profit: {formatMAD(profitMargin.profit)}/unit</p>
                            </div>
                            <div className={cn("w-13 h-13 rounded-full flex items-center justify-center", profitMargin.margin > 30 ? 'bg-green-100 dark:bg-green-800' : 'bg-yellow-100 dark:bg-yellow-800')}>
                                {profitMargin.margin > 30 ? <TrendingUp size={28} className="text-green-600 dark:text-green-400" /> : <TrendingDown size={28} className="text-yellow-600 dark:text-yellow-400" />}
                            </div>
                        </div>
                    )}
                </div>
                <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3">
                    <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium">Cancel</button>
                    <button type="submit" disabled={isSubmitting} className={cn("flex-1 px-4 py-2.5 rounded-lg text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2", isSubmitting ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700')}>
                        {isSubmitting ? <><Loader2 size={16} className="animate-spin" />{product ? 'Saving...' : 'Adding...'}</> : <>{product ? <CheckCircle2 size={16} /> : <Plus size={16} />}{product ? 'Save' : 'Add'}</>}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

// ─── MAIN INVENTORY CONTENT ───────────────────────────────
function InventoryContent() {
    const [theme, setTheme] = useLocalStorage('inventory-theme', 'light');
    const [viewMode, setViewMode] = useLocalStorage('inventory-view', 'grid');
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [tenantId, setTenantId] = useState(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedProducts, setSelectedProducts] = useState(new Set());
    const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });
    const [stockFilter, setStockFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [showProductForm, setShowProductForm] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const searchInputRef = useRef(null);
    const toast = useToast();
    const debouncedSearch = useDebounce(searchQuery, 300);
    const ITEMS_PER_PAGE = 12;

    useEffect(() => { document.documentElement.classList.toggle('dark', theme === 'dark'); }, [theme]);

    useEffect(() => {
        const init = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) throw new Error('Please sign in');
                const { data: profile, error: profileError } = await supabase.from('user_profiles').select('tenant_id').eq('id', user.id).single();
                if (profileError) throw profileError;
                if (!profile?.tenant_id) throw new Error('No organization found');
                setTenantId(profile.tenant_id);
            } catch (err) { setError(err.message); toast.error(err.message); }
        };
        init();
    }, [toast]);

    const fetchProducts = useCallback(async (silent = false) => {
        if (!tenantId) return;
        try {
            silent ? setIsRefreshing(true) : setIsLoading(true);
            setError(null);
            const { data, error: queryError } = await supabase.from('products').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false });
            if (queryError) throw queryError;
            setProducts(data || []);
        } catch (err) {
            setError(err.message);
            if (!silent) toast.error('Failed to load products', { action: { label: 'Retry', onClick: () => fetchProducts() } });
        } finally { setIsLoading(false); setIsRefreshing(false); }
    }, [tenantId, toast]);

    useEffect(() => { fetchProducts(); }, [fetchProducts]);

    const categories = useMemo(() => [...new Set(products.map(p => p.category).filter(Boolean))].sort(), [products]);

    const filteredProducts = useMemo(() => {
        let result = [...products];
        if (debouncedSearch) {
            const q = debouncedSearch.toLowerCase();
            result = result.filter(p => p.name?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q));
        }
        if (stockFilter === 'out') result = result.filter(p => (p.stock_qty || 0) <= 0);
        if (stockFilter === 'low') result = result.filter(p => p.stock_qty > 0 && p.stock_qty < 10);
        if (stockFilter === 'healthy') result = result.filter(p => p.stock_qty >= 50);
        if (categoryFilter !== 'all') result = result.filter(p => p.category === categoryFilter);
        result.sort((a, b) => {
            const aVal = a[sortConfig.key] ?? '', bVal = b[sortConfig.key] ?? '';
            const numCols = ['buy_price', 'sell_price', 'stock_qty'];
            if (numCols.includes(sortConfig.key)) return sortConfig.direction === 'asc' ? (+aVal - +bVal) : (+bVal - +aVal);
            const cmp = String(aVal).localeCompare(String(bVal));
            return sortConfig.direction === 'asc' ? cmp : -cmp;
        });
        return result;
    }, [products, debouncedSearch, stockFilter, categoryFilter, sortConfig]);

    const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
    const paginatedProducts = useMemo(() => filteredProducts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE), [filteredProducts, currentPage]);
    useEffect(() => { setCurrentPage(1); }, [debouncedSearch, stockFilter, categoryFilter]);

    const kpis = useMemo(() => {
        const total = products.length;
        const totalStock = products.reduce((s, p) => s + (p.stock_qty || 0), 0);
        const invValue = products.reduce((s, p) => s + (p.buy_price || 0) * (p.stock_qty || 0), 0);
        const potRev = products.reduce((s, p) => s + (p.sell_price || 0) * (p.stock_qty || 0), 0);
        const potProfit = potRev - invValue;
        const lowStock = products.filter(p => p.stock_qty > 0 && p.stock_qty < 10).length;
        const outStock = products.filter(p => (p.stock_qty || 0) <= 0).length;
        const withMargin = products.filter(p => p.buy_price > 0 && p.sell_price > 0);
        const avgMargin = withMargin.length ? withMargin.reduce((s, p) => s + ((p.sell_price - p.buy_price) / p.buy_price) * 100, 0) / withMargin.length : 0;
        return { total, totalStock, invValue, potRev, potProfit, lowStock, outStock, avgMargin };
    }, [products]);

    const handleAddProduct = async (formData) => { if (!tenantId) throw new Error('Not authenticated'); const { error } = await supabase.from('products').insert([{ ...formData, tenant_id: tenantId }]); if (error) throw error; await fetchProducts(true); };
    const handleUpdateProduct = async (formData) => { if (!editingProduct) throw new Error('No product selected'); const { error } = await supabase.from('products').update(formData).eq('id', editingProduct.id); if (error) throw error; await fetchProducts(true); };
    const handleDeleteProduct = async (productId) => { const { error } = await supabase.from('products').delete().eq('id', productId); if (error) throw error; setSelectedProducts(prev => { const n = new Set(prev); n.delete(productId); return n; }); await fetchProducts(true); toast.success('Product deleted'); };
    const handleDuplicateProduct = async (product) => { if (!tenantId) return; const { error } = await supabase.from('products').insert([{ tenant_id: tenantId, name: `${product.name} (Copy)`, sku: product.sku ? `${product.sku}-COPY` : null, category: product.category, buy_price: product.buy_price, sell_price: product.sell_price, stock_qty: 0 }]); if (error) { toast.error('Failed to duplicate'); return; } await fetchProducts(true); toast.success('Product duplicated'); };

    const handleExport = (format = 'xlsx') => {
        if (!filteredProducts.length) { toast.warning('Nothing to export'); return; }
        const data = filteredProducts.map(p => ({
            SKU: p.sku || '', Name: p.name || '', Category: p.category || '', 'Cost Price (MAD)': p.buy_price || 0, 'Sell Price (MAD)': p.sell_price || 0, Stock: p.stock_qty || 0,
            'Stock Value (MAD)': (p.buy_price || 0) * (p.stock_qty || 0), 'Potential Revenue (MAD)': (p.sell_price || 0) * (p.stock_qty || 0),
            'Margin %': p.buy_price > 0 ? formatPercentage(((p.sell_price - p.buy_price) / p.buy_price) * 100) : '0%',
        }));
        if (format === 'csv') {
            const headers = Object.keys(data[0]);
            const csv = [headers.join(','), ...data.map(r => headers.map(h => `"${r[h]}"`).join(','))].join('\n');
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `inventory_export_${new Date().toISOString().split('T')[0]}.csv`; a.click();
        } else {
            const ws = XLSX.utils.json_to_sheet(data); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Products');
            XLSX.writeFile(wb, `inventory_export_${new Date().toISOString().split('T')[0]}.xlsx`);
        }
        toast.success(`Exported ${data.length} products`);
    };

    const handleSelectAll = () => setSelectedProducts(s => s.size === paginatedProducts.length ? new Set() : new Set(paginatedProducts.map(p => p.id)));
    const handleSort = (key) => setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }));

    useEffect(() => {
        const handler = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); searchInputRef.current?.focus(); }
            if ((e.metaKey || e.ctrlKey) && e.key === 'n') { e.preventDefault(); setEditingProduct(null); setShowProductForm(true); }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    // ─── RENDER ─────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200">
            <div className="max-w-[1440px] mx-auto px-6 py-6 pb-16">
                <div className="flex flex-col gap-6">

                    {/* Header */}
                    <header className="flex justify-between items-start flex-wrap gap-4">
                        <div>
                            <h1 className="text-3xl font-extrabold tracking-tight mb-1">Inventory</h1>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{formatNumber(kpis.total)} products · {formatMADCompact(kpis.invValue)} value</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">{theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}</button>
                            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1 gap-1">
                                <button onClick={() => setViewMode('grid')} className={cn("px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1.5", viewMode === 'grid' ? 'bg-white dark:bg-gray-700 text-green-600 dark:text-green-400 shadow-sm' : 'text-gray-500 dark:text-gray-400')}><Grid3x3 size={16} /> Grid</button>
                                <button onClick={() => setViewMode('table')} className={cn("px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1.5", viewMode === 'table' ? 'bg-white dark:bg-gray-700 text-green-600 dark:text-green-400 shadow-sm' : 'text-gray-500 dark:text-gray-400')}><Table2 size={16} /> Table</button>
                            </div>
                            <button onClick={() => fetchProducts(true)} disabled={isRefreshing} className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 disabled:opacity-50"><RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} /> Refresh</button>
                            <button onClick={() => handleExport('xlsx')} className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"><Download size={14} /> Export</button>
                            <button onClick={() => { setEditingProduct(null); setShowProductForm(true); }} className="px-5 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-colors shadow-sm hover:shadow-md flex items-center gap-2"><Plus size={16} /> Add Product</button>
                        </div>
                    </header>

                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                        <KpiCard label="Products" value={formatNumber(kpis.total)} subtitle="Total SKUs" icon={Package} color="#10B981" />
                        <KpiCard label="Total Stock" value={formatNumber(kpis.totalStock)} subtitle="Units across all items" icon={Layers} color="#3B82F6" />
                        <KpiCard label="Inventory Value" value={formatMADCompact(kpis.invValue)} subtitle="At cost price" icon={Banknote} color="#374151" />
                        <KpiCard label="Potential Revenue" value={formatMADCompact(kpis.potRev)} subtitle={`${formatMADCompact(kpis.potProfit)} profit`} icon={TrendingUp} color="#059669" />
                        <KpiCard label="Low Stock" value={kpis.lowStock} subtitle={`${kpis.outStock} out of stock`} icon={AlertTriangle} color="#D97706" alert={kpis.lowStock > 0} />
                        <KpiCard label="Average Margin" value={formatPercentage(kpis.avgMargin)} subtitle="Across all products" icon={BarChart3} color="#3B82F6" />
                    </div>

                    {/* Filters */}
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm">
                        <div className="flex gap-3 flex-wrap items-center">
                            <div className="relative flex-1 min-w-[200px]">
                                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input ref={searchInputRef} type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search products... (⌘K)" className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-transparent focus:border-green-500 focus:ring-2 focus:ring-green-500/20 focus:bg-white dark:focus:bg-gray-800 rounded-lg text-sm outline-none transition-all" />
                            </div>
                            {['all', 'low', 'out', 'healthy'].map(filter => (
                                <button key={filter} onClick={() => setStockFilter(filter)} className={cn("px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors", stockFilter === filter ? 'bg-green-600 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700')}>
                                    {filter === 'all' ? 'All Stock' : filter === 'low' ? 'Low Stock' : filter === 'out' ? 'Out of Stock' : 'Healthy'}
                                </button>
                            ))}
                            {categories.length > 0 && (
                                <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="px-3.5 py-2.5 bg-gray-50 dark:bg-gray-700 border border-transparent focus:border-green-500 rounded-lg text-sm outline-none cursor-pointer transition-all">
                                    <option value="all">All Categories</option>
                                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                            )}
                            <span className="text-xs text-gray-400 ml-auto">{formatNumber(filteredProducts.length)} result{filteredProducts.length !== 1 ? 's' : ''}</span>
                        </div>
                    </div>

                    {/* Bulk Actions */}
                    {selectedProducts.size > 0 && (
                        <div className="flex items-center gap-3 px-5 py-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                            <CheckCircle2 size={18} className="text-green-600 dark:text-green-400" />
                            <span className="text-sm font-semibold text-green-700 dark:text-green-400">{selectedProducts.size} selected</span>
                            <button onClick={() => setSelectedProducts(new Set())} className="ml-auto px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Clear</button>
                            <button onClick={() => setDeleteTarget({ type: 'bulk', ids: Array.from(selectedProducts) })} className="px-3 py-1.5 text-xs rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition-colors">Delete Selected</button>
                        </div>
                    )}

                    {/* Content */}
                    {error ? (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-12 text-center">
                            <AlertTriangle size={48} className="text-red-600 dark:text-red-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold mb-2">Error Loading Data</h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-5">{error}</p>
                            <button onClick={() => fetchProducts()} className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors">Try Again</button>
                        </div>
                    ) : isLoading ? (
                        viewMode === 'table' ? <SkeletonTable /> : <SkeletonGrid />
                    ) : filteredProducts.length === 0 ? (
                        <EmptyState hasFilters={!!(debouncedSearch || stockFilter !== 'all' || categoryFilter !== 'all')} onAdd={() => { setEditingProduct(null); setShowProductForm(true); }} />
                    ) : viewMode === 'grid' ? (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {paginatedProducts.map(product => (
                                    <ProductCard key={product.id} product={product} selected={selectedProducts.has(product.id)} onSelect={() => { setSelectedProducts(prev => { const next = new Set(prev); next.has(product.id) ? next.delete(product.id) : next.add(product.id); return next; }); }} onEdit={() => { setEditingProduct(product); setShowProductForm(true); }} onDuplicate={() => handleDuplicateProduct(product)} onDelete={() => setDeleteTarget({ type: 'single', product })} />
                                ))}
                            </div>
                            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                        </>
                    ) : (
                        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse min-w-[1100px]">
                                    <thead>
                                        <tr>
                                            <th className="px-4 py-3.5 w-10 bg-gray-50 dark:bg-gray-800/50"><input type="checkbox" checked={paginatedProducts.length > 0 && selectedProducts.size === paginatedProducts.length} onChange={handleSelectAll} className="w-4 h-4 rounded accent-green-600 cursor-pointer" /></th>
                                            <SortHeader label="Product" sortKey="name" currentSort={sortConfig} onSort={handleSort} />
                                            <SortHeader label="SKU" sortKey="sku" currentSort={sortConfig} onSort={handleSort} />
                                            <SortHeader label="Category" sortKey="category" currentSort={sortConfig} onSort={handleSort} />
                                            <SortHeader label="Cost (MAD)" sortKey="buy_price" currentSort={sortConfig} onSort={handleSort} />
                                            <SortHeader label="Price (MAD)" sortKey="sell_price" currentSort={sortConfig} onSort={handleSort} />
                                            <th className="px-4 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/50">Margin</th>
                                            <SortHeader label="Stock" sortKey="stock_qty" currentSort={sortConfig} onSort={handleSort} />
                                            <th className="px-4 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/50">Available Units</th>
                                            <th className="px-4 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/50">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedProducts.map(product => (
                                            <tr key={product.id} className={cn("border-b border-gray-200 dark:border-gray-700 transition-colors", selectedProducts.has(product.id) ? 'bg-green-50 dark:bg-green-900/10' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50')}>
                                                <td className="px-4 py-3.5"><input type="checkbox" checked={selectedProducts.has(product.id)} onChange={() => { setSelectedProducts(prev => { const next = new Set(prev); prev.has(product.id) ? next.delete(product.id) : next.add(product.id); return next; }); }} className="w-4 h-4 rounded accent-green-600 cursor-pointer" /></td>
                                                <td className="px-4 py-3.5"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center"><Package size={18} className="text-green-600 dark:text-green-400" /></div><span className="font-semibold text-sm text-gray-900 dark:text-white">{product.name}</span></div></td>
                                                <td className="px-4 py-3.5">{product.sku ? <code className="text-xs font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-600 dark:text-gray-400">{product.sku}</code> : <span className="text-gray-300 dark:text-gray-600">—</span>}</td>
                                                <td className="px-4 py-3.5 text-sm text-gray-600 dark:text-gray-400">{product.category || <span className="text-gray-300 dark:text-gray-600">—</span>}</td>
                                                <td className="px-4 py-3.5 text-sm text-gray-600 dark:text-gray-400 font-mono">{formatMAD(product.buy_price || 0)}</td>
                                                <td className="px-4 py-3.5 font-semibold text-sm font-mono">{formatMAD(product.sell_price || 0)}</td>
                                                <td className="px-4 py-3.5 text-center"><MarginBadge buyPrice={product.buy_price} sellPrice={product.sell_price} /></td>
                                                <td className="px-4 py-3.5 text-center"><StockBadge quantity={product.stock_qty || 0} showLabel /></td>
                                                <td className="px-4 py-3.5 text-center">
                                                    <div className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold",
                                                        (product.stock_qty || 0) <= 0 ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400' :
                                                            (product.stock_qty || 0) < 10 ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400' :
                                                                'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                                                    )}>
                                                        <Package size={14} />
                                                        {product.stock_qty || 0} unit{(product.stock_qty || 0) !== 1 ? 's' : ''}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <div className="flex gap-1 justify-center">
                                                        <button onClick={() => { setEditingProduct(product); setShowProductForm(true); }} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" title="Edit"><Edit size={14} /></button>
                                                        <button onClick={() => handleDuplicateProduct(product)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" title="Duplicate"><Copy size={14} /></button>
                                                        <button onClick={() => setDeleteTarget({ type: 'single', product })} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Delete"><Trash2 size={14} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                                <p className="text-sm text-gray-400">Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredProducts.length)} of {formatNumber(filteredProducts.length)}</p>
                                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            <ProductFormModal isOpen={showProductForm} onClose={() => { setShowProductForm(false); setEditingProduct(null); }} onSubmit={editingProduct ? handleUpdateProduct : handleAddProduct} product={editingProduct} categories={categories} />
            <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={async () => { if (!deleteTarget) return; if (deleteTarget.type === 'bulk') { for (const id of deleteTarget.ids) await handleDeleteProduct(id); toast.success(`${deleteTarget.ids.length} products deleted`); } else await handleDeleteProduct(deleteTarget.product.id); }} title={deleteTarget?.type === 'bulk' ? `Delete ${deleteTarget.ids.length} products` : 'Delete product'} message={deleteTarget?.type === 'bulk' ? 'This action cannot be undone.' : `Delete "${deleteTarget?.product?.name}"?`} confirmLabel={deleteTarget?.type === 'bulk' ? `Delete ${deleteTarget.ids.length} Products` : 'Delete'} />
        </div>
    );
}

// ─── EXPORT ───────────────────────────────────────────────
export default function ProductsPage() {
    return (
        <ProtectedPage>
            <ToastProvider>
                <InventoryContent />
            </ToastProvider>
        </ProtectedPage>
    );
}