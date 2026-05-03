"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { usePermissions } from "@/lib/hooks/usePermissions";
import ProtectedPage from "@/components/ProtectedPage";
import {
    CheckCircle, Clock, Truck, XCircle, Phone, Mail, MapPin,
    Package, DollarSign, TrendingUp, TrendingDown, Target,
    Search, Filter, RefreshCw, Loader2, AlertTriangle,
    ChevronDown, ChevronUp, BarChart3, Activity, Users,
    ShoppingCart, UserCheck, Star, Zap, Layers, ArrowUp,
    ArrowDown, Calendar, Edit, Check, X, Trophy, Medal,
    Award, Crown, Plus, Minus, Trash2, Save, PackagePlus,
    ShoppingBag, Hash, List, GripVertical, Settings
} from "lucide-react";

/* ================================================================
   CONSTANTS
================================================================ */
const STATUS_STYLES = {
    pending: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500", icon: Clock, label: "Pending" },
    confirmed: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500", icon: CheckCircle, label: "Confirmed" },
    delivered: { bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-200", dot: "bg-teal-500", icon: Truck, label: "Delivered" },
    canceled: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200", dot: "bg-rose-500", icon: XCircle, label: "Canceled" },
    shipped: { bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200", dot: "bg-violet-500", icon: Zap, label: "Shipped" },
    returned: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", dot: "bg-orange-500", icon: AlertTriangle, label: "Returned" },
};

/* ================================================================
   PRODUCT MANAGEMENT MODAL (FIXED - Uses 'product' field only)
================================================================ */
function ProductManagementModal({ lead, onClose, onSave }) {
    const [catalogProducts, setCatalogProducts] = useState([]);
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [newProduct, setNewProduct] = useState({ name: "", quantity: 1, price: 0 });
    const [error, setError] = useState(null);

    // Parse existing products from the lead's product field
    useEffect(() => {
        fetchCatalogProducts();

        if (lead?.product) {
            try {
                // Check if product field contains JSON data
                if (lead.product.startsWith('[') || lead.product.startsWith('{')) {
                    const parsed = JSON.parse(lead.product);
                    if (Array.isArray(parsed)) {
                        setSelectedProducts(parsed);
                    } else {
                        // Single product object or old format
                        setSelectedProducts([{
                            id: `existing-${Date.now()}`,
                            name: lead.product,
                            quantity: lead.quantity || 1,
                            price: lead.amount || 0
                        }]);
                    }
                } else {
                    // Plain string product name
                    setSelectedProducts([{
                        id: `existing-${Date.now()}`,
                        name: lead.product,
                        quantity: lead.quantity || 1,
                        price: lead.amount || 0
                    }]);
                }
            } catch {
                // Not JSON, treat as plain string
                setSelectedProducts([{
                    id: `existing-${Date.now()}`,
                    name: lead.product,
                    quantity: lead.quantity || 1,
                    price: lead.amount || 0
                }]);
            }
        }
    }, [lead]);

    const fetchCatalogProducts = async () => {
        try {
            setLoading(true);
            setError(null);

            // Try to fetch from products table first
            const { data: productsData, error: productsError } = await supabase
                .from("products")
                .select("*")
                .eq("tenant_id", lead.tenant_id)
                .order("name");

            if (!productsError && productsData && productsData.length > 0) {
                setCatalogProducts(productsData);
                return;
            }

            // Fallback: Get unique products from leads table
            const { data: leadsData } = await supabase
                .from("leads")
                .select("product")
                .eq("tenant_id", lead.tenant_id)
                .not("product", "is", null);

            if (leadsData) {
                const uniqueNames = [...new Set(
                    leadsData
                        .map(l => {
                            // Try to parse JSON products
                            try {
                                const parsed = JSON.parse(l.product);
                                if (Array.isArray(parsed)) {
                                    return parsed.map(p => p.name);
                                }
                                return [l.product];
                            } catch {
                                return [l.product];
                            }
                        })
                        .flat()
                        .filter(Boolean)
                )];

                const fallbackProducts = uniqueNames.map(name => ({
                    id: `lead-${name}`,
                    name,
                    sell_price: 0,
                    stock_qty: 0,
                }));

                setCatalogProducts(fallbackProducts);
            }
        } catch (err) {
            console.error("Failed to fetch products:", err);
        } finally {
            setLoading(false);
        }
    };

    const addProduct = (product) => {
        setSelectedProducts(prev => {
            const existingIndex = prev.findIndex(p => p.name === product.name);

            if (existingIndex >= 0) {
                return prev.map((p, i) =>
                    i === existingIndex ? { ...p, quantity: p.quantity + 1 } : p
                );
            }

            return [...prev, {
                id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                name: product.name,
                quantity: 1,
                price: product.sell_price || product.price || 0
            }];
        });
    };

    const removeProduct = (index) => {
        setSelectedProducts(prev => prev.filter((_, i) => i !== index));
    };

    const updateProductQuantity = (index, quantity) => {
        const qty = parseInt(quantity);
        if (isNaN(qty) || qty < 1) return;

        setSelectedProducts(prev =>
            prev.map((p, i) => i === index ? { ...p, quantity: qty } : p)
        );
    };

    const updateProductPrice = (index, price) => {
        const prc = parseFloat(price);
        if (isNaN(prc)) return;

        setSelectedProducts(prev =>
            prev.map((p, i) => i === index ? { ...p, price: prc } : p)
        );
    };

    const addNewProduct = () => {
        const name = newProduct.name.trim();
        if (!name) return;

        setSelectedProducts(prev => [...prev, {
            id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name,
            quantity: parseInt(newProduct.quantity) || 1,
            price: parseFloat(newProduct.price) || 0
        }]);

        setNewProduct({ name: "", quantity: 1, price: 0 });
    };

    const handleSave = async () => {
        if (saving) return;

        if (selectedProducts.length === 0) {
            setError("Please add at least one product");
            return;
        }

        try {
            setSaving(true);
            setError(null);

            // Calculate totals
            const totalAmount = selectedProducts.reduce(
                (sum, p) => sum + ((p.price || 0) * (p.quantity || 1)), 0
            );
            const totalQuantity = selectedProducts.reduce(
                (sum, p) => sum + (p.quantity || 1), 0
            );

            // Create human-readable product string
            const productString = selectedProducts
                .map(p => `${p.name}${p.quantity > 1 ? ` x${p.quantity}` : ''}`)
                .join(", ");

            // Store full product data as JSON in the product field
            // This way we can parse it back when editing
            const productData = JSON.stringify(selectedProducts);

            // Prepare updates - use EXISTING columns only
            const updates = {
                product: productData,  // Store JSON in product field
                quantity: totalQuantity,
                amount: totalAmount,
            };

            await onSave(updates);
            onClose();
        } catch (err) {
            console.error("Save error:", err);
            setError(err.message || "Failed to save products. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    // Filter available products
    const filteredProducts = catalogProducts.filter(p =>
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !selectedProducts.some(sp => sp.name === p.name)
    );

    // Calculate totals
    const totalAmount = selectedProducts.reduce(
        (sum, p) => sum + ((p.price || 0) * (p.quantity || 1)), 0
    );
    const totalQuantity = selectedProducts.reduce(
        (sum, p) => sum + (p.quantity || 1), 0
    );

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-green-50 flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-100 rounded-xl">
                                <ShoppingBag size={20} className="text-emerald-600" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Manage Products</h2>
                                <p className="text-xs text-gray-500">
                                    {lead?.customer || "Order"} • {selectedProducts.length} product(s)
                                </p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-colors">
                            <X size={18} className="text-gray-500" />
                        </button>
                    </div>

                    {error && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
                            <AlertTriangle size={14} className="text-red-500 flex-shrink-0" />
                            <p className="text-xs text-red-700">{error}</p>
                            <button onClick={() => setError(null)} className="ml-auto p-1 hover:bg-red-100 rounded-lg">
                                <X size={12} className="text-red-400" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Body */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Left Panel - Available Products */}
                    <div className="w-1/2 border-r border-gray-100 flex flex-col">
                        <div className="p-4 border-b border-gray-50">
                            <div className="relative">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search available products..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 transition-all"
                                />
                                {searchTerm && (
                                    <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4">
                            {loading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 size={24} className="text-emerald-500 animate-spin" />
                                </div>
                            ) : filteredProducts.length === 0 ? (
                                <div className="text-center py-12">
                                    <Package size={48} className="text-gray-300 mx-auto mb-3" />
                                    <p className="text-sm text-gray-500 font-medium">
                                        {searchTerm ? "No products found" : "No products in catalog"}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        Use the custom product field below to add new items
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-1.5">
                                    {filteredProducts.map(product => (
                                        <button
                                            key={product.id || product.name}
                                            onClick={() => addProduct(product)}
                                            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-emerald-50 border border-transparent hover:border-emerald-200 transition-all text-left"
                                        >
                                            <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                                                <Package size={16} className="text-gray-500" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                                                {product.sell_price > 0 && (
                                                    <span className="text-xs text-gray-500">${product.sell_price.toLocaleString()}</span>
                                                )}
                                            </div>
                                            <Plus size={14} className="text-gray-300 flex-shrink-0" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Custom Product */}
                        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                            <p className="text-xs font-semibold text-gray-700 mb-2">Add Custom Product</p>
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    placeholder="Product name"
                                    value={newProduct.name}
                                    onChange={e => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                                    onKeyDown={e => e.key === 'Enter' && addNewProduct()}
                                    className="flex-1 px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm focus:outline-none focus:border-emerald-400"
                                />
                                <button
                                    onClick={addNewProduct}
                                    disabled={!newProduct.name.trim()}
                                    className="p-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                                >
                                    <Plus size={16} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right Panel - Selected Products */}
                    <div className="w-1/2 flex flex-col bg-gray-50/30">
                        <div className="p-4 border-b border-gray-100">
                            <h3 className="text-sm font-semibold text-gray-700">
                                Selected Products ({selectedProducts.length})
                            </h3>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4">
                            {selectedProducts.length === 0 ? (
                                <div className="text-center py-12">
                                    <ShoppingCart size={48} className="text-gray-300 mx-auto mb-4" />
                                    <p className="text-sm font-medium text-gray-500">No products selected</p>
                                    <p className="text-xs text-gray-400 mt-1">Click products from the left panel</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {selectedProducts.map((product, index) => (
                                        <div key={product.id || index} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                            <div className="flex items-start justify-between mb-3">
                                                <p className="text-sm font-semibold text-gray-900 truncate flex-1">{product.name}</p>
                                                <button
                                                    onClick={() => removeProduct(index)}
                                                    className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0 ml-2"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <div className="flex-1">
                                                    <label className="text-[10px] text-gray-500 uppercase font-semibold mb-1 block">Qty</label>
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            onClick={() => updateProductQuantity(index, product.quantity - 1)}
                                                            disabled={product.quantity <= 1}
                                                            className="w-7 h-7 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center hover:border-emerald-300 disabled:opacity-50 transition-colors"
                                                        >
                                                            <Minus size={12} />
                                                        </button>
                                                        <input
                                                            type="number"
                                                            value={product.quantity}
                                                            onChange={(e) => updateProductQuantity(index, e.target.value)}
                                                            className="w-14 text-center text-sm font-semibold bg-white border border-gray-200 rounded-lg py-1.5 focus:outline-none focus:border-emerald-400"
                                                            min="1"
                                                        />
                                                        <button
                                                            onClick={() => updateProductQuantity(index, product.quantity + 1)}
                                                            className="w-7 h-7 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center hover:border-emerald-300 transition-colors"
                                                        >
                                                            <Plus size={12} />
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="flex-1">
                                                    <label className="text-[10px] text-gray-500 uppercase font-semibold mb-1 block">Price</label>
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-sm text-gray-500">$</span>
                                                        <input
                                                            type="number"
                                                            value={product.price}
                                                            onChange={(e) => updateProductPrice(index, e.target.value)}
                                                            className="w-full text-sm font-mono bg-white border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-emerald-400"
                                                            step="0.01"
                                                            min="0"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="text-right flex-shrink-0 min-w-[70px]">
                                                    <label className="text-[10px] text-gray-500 uppercase font-semibold mb-1 block">Item Total</label>
                                                    <p className="text-sm font-bold text-emerald-600">
                                                        ${((product.price || 0) * (product.quantity || 1)).toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Totals & Save */}
                        <div className="p-4 border-t border-gray-200 bg-white">
                            {selectedProducts.length > 0 && (
                                <>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm text-gray-600">Total Items:</span>
                                        <span className="text-sm font-bold text-gray-900">{totalQuantity} units</span>
                                    </div>
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-sm text-gray-600">Total Amount:</span>
                                        <span className="text-lg font-bold text-emerald-600">${totalAmount.toLocaleString()}</span>
                                    </div>
                                </>
                            )}
                            <div className="flex gap-2">
                                <button
                                    onClick={onClose}
                                    className="flex-1 px-4 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={saving || selectedProducts.length === 0}
                                    className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-200"
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 size={14} className="animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={14} />
                                            Save Products
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ================================================================
   KPI CARD
================================================================ */
function KpiCard({ label, value, sub, icon: Icon, color, bgColor, trend }) {
    return (
        <div className="relative bg-white rounded-2xl border-2 border-gray-100 p-5 overflow-hidden group hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-50 transition-all duration-300">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r" style={{ backgroundImage: `linear-gradient(to right, ${color}, ${color}88)` }} />
            <div className="flex items-start justify-between mb-3">
                <div className="p-2.5 rounded-xl transition-transform group-hover:scale-110 duration-300" style={{ backgroundColor: bgColor }}>
                    <Icon size={18} style={{ color }} />
                </div>
                {trend != null && (
                    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${trend >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>
                        {trend >= 0 ? <ArrowUp size={10} /> : <ArrowDown size={10} />}{Math.abs(trend)}%
                    </div>
                )}
            </div>
            <p className="text-[11px] text-gray-500 font-medium uppercase tracking-widest mb-1">{label}</p>
            <h3 className="text-2xl font-bold text-gray-900 font-mono tracking-tight">{value}</h3>
            {sub && <p className="text-[11px] text-gray-400 mt-1">{sub}</p>}
        </div>
    );
}

/* ================================================================
   INLINE EDITABLE FIELD
================================================================ */
function EditableField({ value, type = "text", onSave, placeholder = "—", className = "", isProduct = false, onProductClick, extra }) {
    const [editing, setEditing] = useState(false);
    const [editValue, setEditValue] = useState(value);
    const [saving, setSaving] = useState(false);

    useEffect(() => { setEditValue(value); }, [value]);

    const handleSave = async () => {
        if (editValue === value) { setEditing(false); return; }
        setSaving(true);
        try {
            await onSave(editValue);
            setEditing(false);
        } catch (err) {
            console.error("Failed to save:", err);
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => { setEditValue(value); setEditing(false); };
    const handleKeyDown = (e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") handleCancel(); };

    if (isProduct) {
        // Parse JSON to get readable product string
        let displayValue = value || placeholder;
        try {
            if (value && (value.startsWith('[') || value.startsWith('{'))) {
                const parsed = JSON.parse(value);
                if (Array.isArray(parsed)) {
                    displayValue = parsed.map(p => `${p.name}${p.quantity > 1 ? ` x${p.quantity}` : ''}`).join(", ");
                }
            }
        } catch { }

        return (
            <div className="group cursor-pointer flex items-center gap-1.5 relative" onClick={e => { e.stopPropagation(); onProductClick?.(); }}>
                <div className="flex items-center gap-1.5 min-w-0">
                    <ShoppingBag size={12} className="text-emerald-500 flex-shrink-0" />
                    <span className={displayValue ? "text-xs font-medium truncate" : "text-gray-400 text-xs"}>
                        {displayValue || placeholder}
                    </span>
                </div>
                <Settings size={10} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-1" />
                {extra}
            </div>
        );
    }

    if (editing) {
        return (
            <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                <input type={type} value={editValue} onChange={e => setEditValue(e.target.value)} onKeyDown={handleKeyDown}
                    className={`w-full px-2 py-1 rounded-lg border border-emerald-300 bg-emerald-50 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-100 ${className}`}
                    autoFocus step={type === "number" ? "0.01" : undefined} min={type === "number" ? "0" : undefined} />
                <button onClick={handleSave} disabled={saving} className="p-1 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors flex-shrink-0">
                    {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                </button>
                <button onClick={handleCancel} className="p-1 rounded-lg bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors flex-shrink-0"><X size={12} /></button>
            </div>
        );
    }

    return (
        <div onClick={e => { e.stopPropagation(); setEditing(true); }} className="group cursor-pointer flex items-center gap-1.5 relative">
            <span className={value ? "" : "text-gray-400"}>{value || placeholder}</span>
            <Edit size={10} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
        </div>
    );
}

/* ================================================================
   LEADERBOARD CARD
================================================================ */
function LeaderboardCard({ rank, name, total, confirmed, delivered, rate, revenue, isTop }) {
    const medals = [
        { icon: Crown, color: "#f59e0b", bg: "#fef3c7", label: "1st" },
        { icon: Medal, color: "#94a3b8", bg: "#f1f5f9", label: "2nd" },
        { icon: Medal, color: "#d97706", bg: "#fffbeb", label: "3rd" },
    ];
    const medal = medals[rank] || { icon: Star, color: "#6b7280", bg: "#f3f4f6", label: `${rank + 1}th` };
    const Icon = medal.icon;

    return (
        <div className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-300 ${isTop ? "bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 shadow-sm" : "bg-gray-50 border border-gray-100 hover:border-gray-200"}`}>
            <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: medal.bg }}>
                <Icon size={20} style={{ color: medal.color }} />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center text-white text-[10px] font-bold">
                        {(name || "A")[0].toUpperCase()}
                    </div>
                    <p className="font-semibold text-gray-900 text-sm truncate">{name}</p>
                    {isTop && <Trophy size={14} className="text-amber-500 flex-shrink-0" />}
                </div>
            </div>
            <div className="flex items-center gap-4 md:gap-6 flex-shrink-0">
                <div className="text-center">
                    <p className="text-[10px] text-gray-500 uppercase font-semibold">Total</p>
                    <p className="text-sm font-bold text-gray-900">{total}</p>
                </div>
                <div className="text-center">
                    <p className="text-[10px] text-gray-500 uppercase font-semibold">Confirmed</p>
                    <p className="text-sm font-bold text-emerald-600">{confirmed}</p>
                </div>
                <div className="text-center">
                    <p className="text-[10px] text-gray-500 uppercase font-semibold">Delivered</p>
                    <p className="text-sm font-bold text-teal-600">{delivered}</p>
                </div>
                <div className="text-center min-w-[60px]">
                    <p className="text-[10px] text-gray-500 uppercase font-semibold">Rate</p>
                    <div className="flex items-center justify-center gap-1.5">
                        <div className="w-10 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(rate, 100)}%`, backgroundColor: rate >= 50 ? "#22c55e" : rate >= 25 ? "#f59e0b" : "#ef4444" }} />
                        </div>
                        <span className="text-xs font-bold text-gray-700">{rate.toFixed(0)}%</span>
                    </div>
                </div>
                <div className="text-center hidden md:block">
                    <p className="text-[10px] text-gray-500 uppercase font-semibold">Revenue</p>
                    <p className="text-sm font-bold text-gray-900">${revenue.toLocaleString()}</p>
                </div>
            </div>
        </div>
    );
}

/* ================================================================
   MAIN CONTENT
================================================================ */
function ConfirmationContent() {
    const { profile } = usePermissions();
    const [leads, setLeads] = useState([]);
    const [agentMap, setAgentMap] = useState({});
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState("all");
    const [search, setSearch] = useState("");
    const [sortConfig, setSortConfig] = useState({ key: "date", direction: "desc" });
    const [selectedLead, setSelectedLead] = useState(null);
    const [showLeaderboard, setShowLeaderboard] = useState(true);
    const [productModalLead, setProductModalLead] = useState(null);

    const isOwner = profile?.role === "owner";
    const isAdmin = profile?.role === "admin";
    const isManager = isOwner || isAdmin;
    const currentUserId = profile?.id;

    /* ── FETCH LEADS ─────────────── */
    const fetchLeads = useCallback(async (silent = false) => {
        if (!profile?.tenant_id) return;
        try {
            if (!silent) setLoading(true); else setRefreshing(true);
            const [leadsRes, agentsRes] = await Promise.all([
                supabase.from("leads").select("*").eq("tenant_id", profile.tenant_id).order("date", { ascending: false }),
                supabase.from("user_profiles").select("id, full_name").eq("tenant_id", profile.tenant_id)
            ]);
            const aMap = {};
            if (agentsRes.data) agentsRes.data.forEach(a => { aMap[a.id] = a.full_name; });
            setAgentMap(aMap);
            let allLeads = leadsRes.data || [];
            if (!isManager) allLeads = allLeads.filter(l => l.assigned_to === currentUserId);
            const mapped = allLeads.map(l => ({ ...l, agent: aMap[l.assigned_to] || l.agent || "—" }));
            setLeads(mapped);
        } catch (err) { console.error("Failed to fetch leads:", err); }
        finally { setLoading(false); setRefreshing(false); }
    }, [profile?.tenant_id, isManager, currentUserId]);

    useEffect(() => { if (profile) fetchLeads(); }, [fetchLeads, profile]);

    /* ── UPDATE SINGLE FIELD ─────────────────────── */
    const updateField = async (leadId, field, value) => {
        const { error } = await supabase.from("leads").update({ [field]: value }).eq("id", leadId);
        if (!error) {
            setLeads(prev => prev.map(l => (l.id === leadId ? { ...l, [field]: value } : l)));
            if (selectedLead?.id === leadId) setSelectedLead(prev => ({ ...prev, [field]: value }));
        }
        if (error) throw error;
    };

    const updateStatus = async (id, status) => { await updateField(id, "status", status); };

    /* ── PRODUCT UPDATE FROM MODAL ───────────────── */
    const handleProductSave = async (updates) => {
        if (!productModalLead) return;

        try {
            // Only update fields that exist in the database: product, quantity, amount
            const { error } = await supabase
                .from("leads")
                .update({
                    product: updates.product,
                    quantity: updates.quantity,
                    amount: updates.amount
                })
                .eq("id", productModalLead.id);

            if (error) throw error;

            // Update local state
            setLeads(prev => prev.map(l =>
                l.id === productModalLead.id ? {
                    ...l,
                    product: updates.product,
                    quantity: updates.quantity,
                    amount: updates.amount
                } : l
            ));

            setProductModalLead(null);
        } catch (err) {
            console.error("Failed to update products:", err);
            throw err;
        }
    };

    /* ── FILTERED + SORTED ───────────────────────── */
    const filteredLeads = useMemo(() => {
        let result = [...leads];
        if (filter !== "all") result = result.filter(l => l.status === filter);
        if (search) {
            const s = search.toLowerCase();
            result = result.filter(l => (l.customer || "").toLowerCase().includes(s) || (l.phone || "").includes(s) || (l.product || "").toLowerCase().includes(s) || (l.city || "").toLowerCase().includes(s));
        }
        result.sort((a, b) => { const av = a[sortConfig.key] ?? "", bv = b[sortConfig.key] ?? ""; if (sortConfig.key === "amount" || sortConfig.key === "quantity") return sortConfig.direction === "asc" ? (av || 0) - (bv || 0) : (bv || 0) - (av || 0); if (sortConfig.key === "date") return sortConfig.direction === "asc" ? new Date(av) - new Date(bv) : new Date(bv) - new Date(av); return sortConfig.direction === "asc" ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av)); });
        return result;
    }, [leads, filter, search, sortConfig]);

    /* ── STATS ────────────────────────────────────── */
    const stats = useMemo(() => {
        const total = leads.length;
        const confirmed = leads.filter(l => l.status === "confirmed").length;
        const delivered = leads.filter(l => l.status === "delivered").length;
        const pending = leads.filter(l => l.status === "pending").length;
        const canceled = leads.filter(l => l.status === "canceled").length;
        const revenue = leads.reduce((s, l) => s + (parseFloat(l.amount) || 0), 0);
        const confirmRate = total ? ((confirmed / total) * 100).toFixed(1) : "0.0";
        const deliverRate = total ? ((delivered / total) * 100).toFixed(1) : "0.0";
        return { total, confirmed, delivered, pending, canceled, revenue, confirmRate, deliverRate };
    }, [leads]);

    /* ── LEADERBOARD DATA ────────────────────────── */
    const leaderboard = useMemo(() => {
        if (!isManager) return [];
        const agentStats = {};
        for (const lead of leads) {
            const agentId = lead.assigned_to;
            if (!agentId) continue;
            if (!agentStats[agentId]) {
                agentStats[agentId] = { id: agentId, name: agentMap[agentId] || lead.agent || "Unknown", total: 0, confirmed: 0, delivered: 0, revenue: 0 };
            }
            agentStats[agentId].total++;
            agentStats[agentId].revenue += parseFloat(lead.amount) || 0;
            if (lead.status === "confirmed") agentStats[agentId].confirmed++;
            if (lead.status === "delivered") agentStats[agentId].delivered++;
        }
        return Object.values(agentStats)
            .map(a => ({ ...a, rate: a.total > 0 ? ((a.confirmed + a.delivered) / a.total) * 100 : 0 }))
            .sort((a, b) => b.total - a.total);
    }, [leads, agentMap, isManager]);

    const handleSort = (key) => setSortConfig(p => ({ key, direction: p.key === key && p.direction === "asc" ? "desc" : "asc" }));
    const SortIcon = ({ col }) => sortConfig.key !== col ? <ChevronDown size={12} className="text-gray-400" /> : sortConfig.direction === "asc" ? <ChevronUp size={12} className="text-emerald-500" /> : <ChevronDown size={12} className="text-emerald-500" />;
    const formatCurrency = (v) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#f8faf8] via-white to-[#f0fdf4]">
            <div className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 space-y-6">

                {/* ─── HEADER ─── */}
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-gradient-to-br from-emerald-400 to-green-600 rounded-2xl shadow-lg shadow-green-200">
                            <CheckCircle size={22} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                                {isManager ? "Confirmation Dashboard" : "My Orders"}
                            </h1>
                            <p className="text-sm text-gray-500 mt-1">
                                {leads.length.toLocaleString()} {isManager ? "total orders" : "assigned to you"}
                                {!isManager && (
                                    <span className="ml-2 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold">Agent View</span>
                                )}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {isManager && leaderboard.length > 0 && (
                            <button onClick={() => setShowLeaderboard(!showLeaderboard)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm ${showLeaderboard ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                                <Trophy size={15} /> {showLeaderboard ? "Hide" : "Show"} Leaderboard
                            </button>
                        )}
                        <button onClick={() => fetchLeads(true)} disabled={refreshing} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 shadow-sm transition-all">
                            <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} /> Refresh
                        </button>
                    </div>
                </div>

                {/* ─── LEADERBOARD ─── */}
                {isManager && showLeaderboard && leaderboard.length > 0 && (
                    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-amber-50 to-yellow-50">
                            <div className="flex items-center gap-3">
                                <div className="p-1.5 bg-amber-100 rounded-lg">
                                    <Trophy size={18} className="text-amber-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">Agent Leaderboard</h3>
                                    <p className="text-xs text-gray-500">Top performing agents based on total assigned leads</p>
                                </div>
                            </div>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {leaderboard.map((agent, index) => (
                                <LeaderboardCard key={agent.id} rank={index} name={agent.name} total={agent.total} confirmed={agent.confirmed} delivered={agent.delivered} rate={agent.rate} revenue={agent.revenue} isTop={index < 3} />
                            ))}
                        </div>
                    </div>
                )}

                {/* ─── KPI CARDS ─── */}
                {!loading && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                        <KpiCard label="Total Orders" value={stats.total.toLocaleString()} icon={ShoppingCart} color="#6366f1" bgColor="#eef2ff" />
                        <KpiCard label="Revenue" value={formatCurrency(stats.revenue)} icon={DollarSign} color="#059669" bgColor="#ecfdf5" />
                        <KpiCard label="Confirmed" value={stats.confirmed} sub={`${stats.confirmRate}% rate`} icon={CheckCircle} color="#16a34a" bgColor="#dcfce7" trend={parseFloat(stats.confirmRate)} />
                        <KpiCard label="Delivered" value={stats.delivered} sub={`${stats.deliverRate}% rate`} icon={Truck} color="#0891b2" bgColor="#ecfeff" trend={parseFloat(stats.deliverRate)} />
                        <KpiCard label="Pending" value={stats.pending} icon={Clock} color="#d97706" bgColor="#fffbeb" />
                        <KpiCard label="Canceled" value={stats.canceled} icon={XCircle} color="#e11d48" bgColor="#fff1f2" />
                    </div>
                )}

                {/* ─── FILTERS ─── */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input type="text" placeholder="Search by name, phone, product..." value={search} onChange={e => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 shadow-sm transition-all" />
                        {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><XCircle size={14} /></button>}
                    </div>
                    <div className="flex items-center gap-1.5 bg-white rounded-xl p-1 border border-gray-200 shadow-sm">
                        {["all", "pending", "confirmed", "delivered", "canceled"].map(s => (
                            <button key={s} onClick={() => setFilter(s)} className={`px-3.5 py-2 rounded-lg text-xs font-semibold capitalize transition-all ${filter === s ? "bg-emerald-500 text-white shadow-md shadow-emerald-200" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}>{s}</button>
                        ))}
                    </div>
                </div>

                {/* ─── TABLE ─── */}
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                    {loading ? (
                        <div className="py-20 text-center"><Loader2 size={24} className="text-emerald-500 animate-spin mx-auto mb-3" /><p className="text-sm text-gray-500">Loading orders...</p></div>
                    ) : filteredLeads.length === 0 ? (
                        <div className="py-20 text-center"><Package size={32} className="text-gray-300 mx-auto mb-3" /><p className="text-sm text-gray-500">{filter !== "all" ? `No ${filter} orders` : isManager ? "No orders yet" : "No orders assigned to you yet"}</p></div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-gradient-to-r from-gray-50 to-white">
                                            <th className="px-4 py-3.5 text-left text-[11px] font-semibold text-gray-500 uppercase cursor-pointer" onClick={() => handleSort("customer")}><div className="flex items-center gap-1.5">Customer<SortIcon col="customer" /></div></th>
                                            <th className="px-4 py-3.5 text-left text-[11px] font-semibold text-gray-500 uppercase">Phone</th>
                                            <th className="px-4 py-3.5 text-left text-[11px] font-semibold text-gray-500 uppercase">City</th>
                                            <th className="px-4 py-3.5 text-left text-[11px] font-semibold text-gray-500 uppercase cursor-pointer" onClick={() => handleSort("product")}><div className="flex items-center gap-1.5">Product<SortIcon col="product" /></div></th>
                                            <th className="px-4 py-3.5 text-center text-[11px] font-semibold text-gray-500 uppercase cursor-pointer" onClick={() => handleSort("quantity")}><div className="flex items-center justify-center gap-1.5">Qty<SortIcon col="quantity" /></div></th>
                                            <th className="px-4 py-3.5 text-right text-[11px] font-semibold text-gray-500 uppercase cursor-pointer" onClick={() => handleSort("amount")}><div className="flex items-center justify-end gap-1.5">Amount<SortIcon col="amount" /></div></th>
                                            <th className="px-4 py-3.5 text-center text-[11px] font-semibold text-gray-500 uppercase">Status</th>
                                            {isManager && <th className="px-4 py-3.5 text-left text-[11px] font-semibold text-gray-500 uppercase">Agent</th>}
                                            <th className="px-4 py-3.5 text-left text-[11px] font-semibold text-gray-500 uppercase cursor-pointer" onClick={() => handleSort("date")}><div className="flex items-center gap-1.5">Date<SortIcon col="date" /></div></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {filteredLeads.map(lead => (
                                            <tr key={lead.id} className={`group transition-all duration-200 ${selectedLead?.id === lead.id ? "bg-emerald-50/50" : "hover:bg-gray-50/50"}`}>
                                                <td className="px-4 py-3"><EditableField value={lead.customer || ""} onSave={(val) => updateField(lead.id, "customer", val)} placeholder="Add name" className="font-medium" /></td>
                                                <td className="px-4 py-3"><EditableField value={lead.phone || ""} onSave={(val) => updateField(lead.id, "phone", val)} placeholder="Add phone" className="font-mono text-xs" /></td>
                                                <td className="px-4 py-3"><EditableField value={lead.city || ""} onSave={(val) => updateField(lead.id, "city", val)} placeholder="Add city" className="text-xs" /></td>
                                                <td className="px-4 py-3">
                                                    <EditableField
                                                        value={lead.product || ""}
                                                        onSave={(val) => updateField(lead.id, "product", val)}
                                                        placeholder="Manage products"
                                                        className="text-xs"
                                                        isProduct={true}
                                                        onProductClick={() => setProductModalLead(lead)}
                                                    />
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className="text-xs font-semibold text-gray-700">{lead.quantity || 1}</span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <span className="text-xs font-semibold text-gray-900 font-mono">
                                                        {formatCurrency(lead.amount || 0)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <select value={lead.status} onChange={e => updateStatus(lead.id, e.target.value)} onClick={e => e.stopPropagation()}
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-emerald-100 ${(STATUS_STYLES[lead.status] || STATUS_STYLES.pending).bg} ${(STATUS_STYLES[lead.status] || STATUS_STYLES.pending).text} ${(STATUS_STYLES[lead.status] || STATUS_STYLES.pending).border}`}>
                                                        {Object.keys(STATUS_STYLES).map(s => (<option key={s} value={s} className="bg-white text-gray-900">{STATUS_STYLES[s].label}</option>))}
                                                    </select>
                                                </td>
                                                {isManager && (
                                                    <td className="px-4 py-3">
                                                        {lead.agent && lead.agent !== "—" ? (
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold">{(lead.agent)[0].toUpperCase()}</div>
                                                                <span className="text-xs font-medium text-gray-700">{lead.agent}</span>
                                                            </div>
                                                        ) : (<span className="text-xs text-gray-400">Unassigned</span>)}
                                                    </td>
                                                )}
                                                <td className="px-4 py-3"><span className="text-xs text-gray-500 whitespace-nowrap">{lead.date ? new Date(lead.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" }) : "—"}</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
                                <p className="text-xs text-gray-500">{filteredLeads.length.toLocaleString()} order{filteredLeads.length !== 1 ? "s" : ""}</p>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* ─── PRODUCT MANAGEMENT MODAL ─── */}
            {productModalLead && (
                <ProductManagementModal
                    lead={productModalLead}
                    onClose={() => setProductModalLead(null)}
                    onSave={handleProductSave}
                />
            )}

            <style jsx global>{`@keyframes scaleIn{from{transform:scale(.95);opacity:0}to{transform:scale(1);opacity:1}}.animate-scale-in{animation:scaleIn .2s ease-out}`}</style>
        </div>
    );
}

export default function ConfirmationPage() {
    return (
        <ProtectedPage page="leads">
            <ConfirmationContent />
        </ProtectedPage>
    );
}