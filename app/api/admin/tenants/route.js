import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Rate limiting map (in-memory, resets on server restart)
const rateLimit = new Map();

function checkRateLimit(ip, limit = 30, windowMs = 60000) {
    const now = Date.now();
    const record = rateLimit.get(ip) || { count: 0, resetAt: now + windowMs };

    if (now > record.resetAt) {
        record.count = 0;
        record.resetAt = now + windowMs;
    }

    record.count++;
    rateLimit.set(ip, record);

    return record.count <= limit;
}

// GET - Fetch all tenants
export async function GET(req) {
    try {
        // Rate limiting
        const ip = req.headers.get("x-forwarded-for") ||
            req.headers.get("x-real-ip") ||
            "unknown";

        if (!checkRateLimit(ip, 50, 60000)) {
            return NextResponse.json(
                { error: "Too many requests. Please try again later." },
                { status: 429 }
            );
        }

        // Verify admin key
        const adminKey = req.headers.get("x-admin-key");
        const validKey = process.env.ADMIN_SECRET_KEY || "super_secret_123";

        if (!adminKey || adminKey !== validKey) {
            console.warn(`Unauthorized tenant access attempt from IP: ${ip}`);
            return NextResponse.json(
                { error: "Unauthorized", message: "Invalid admin key" },
                { status: 401 }
            );
        }

        // Validate environment
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !serviceKey) {
            return NextResponse.json(
                { error: "Server configuration error" },
                { status: 500 }
            );
        }

        // Create Supabase client
        const supabase = createClient(supabaseUrl, serviceKey, {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
            },
        });

        // Parse query parameters
        const url = new URL(req.url);
        const page = parseInt(url.searchParams.get("page")) || 1;
        const limit = parseInt(url.searchParams.get("limit")) || 50;
        const offset = (page - 1) * limit;
        const search = url.searchParams.get("search") || "";
        const plan = url.searchParams.get("plan") || "";
        const status = url.searchParams.get("status") || "";

        // Build query
        let query = supabase
            .from("tenants")
            .select("*", { count: "exact" })
            .order("created_at", { ascending: false })
            .range(offset, offset + limit - 1);

        // Apply filters
        if (search) {
            query = query.ilike("name", `%${search}%`);
        }
        if (plan) {
            query = query.eq("plan", plan);
        }
        if (status === "active") {
            query = query.eq("is_active", true);
        } else if (status === "inactive") {
            query = query.eq("is_active", false);
        }

        const { data, error, count } = await query;

        if (error) {
            console.error("Tenants query error:", error);
            return NextResponse.json(
                { error: "Database query failed", details: error.message },
                { status: 500 }
            );
        }

        // Calculate additional stats
        const tenantsWithStats = (data || []).map(tenant => {
            const isActive = tenant.subscription_ends_at
                ? new Date(tenant.subscription_ends_at) > new Date() && tenant.is_active !== false
                : tenant.is_active !== false;

            const daysLeft = tenant.subscription_ends_at
                ? Math.ceil((new Date(tenant.subscription_ends_at) - new Date()) / (1000 * 60 * 60 * 24))
                : null;

            return {
                ...tenant,
                isActive,
                daysLeft,
            };
        });

        return NextResponse.json({
            success: true,
            page,
            limit,
            total: count || 0,
            totalPages: Math.ceil((count || 0) / limit),
            tenants: tenantsWithStats,
            filters: {
                search: search || null,
                plan: plan || null,
                status: status || null,
            },
        });

    } catch (err) {
        console.error("Unexpected error in GET /api/admin/tenants:", err);
        return NextResponse.json(
            { error: "Internal server error", message: err.message },
            { status: 500 }
        );
    }
}

// POST - Update a tenant
export async function POST(req) {
    try {
        // Verify admin key
        const adminKey = req.headers.get("x-admin-key");
        const validKey = process.env.ADMIN_SECRET_KEY || "super_secret_123";

        if (!adminKey || adminKey !== validKey) {
            return NextResponse.json(
                { error: "Unauthorized", message: "Invalid admin key" },
                { status: 401 }
            );
        }

        const body = await req.json();
        const { id, updates } = body;

        if (!id || !updates) {
            return NextResponse.json(
                { error: "Missing required fields", message: "id and updates are required" },
                { status: 400 }
            );
        }

        // Validate environment
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !serviceKey) {
            return NextResponse.json(
                { error: "Server configuration error" },
                { status: 500 }
            );
        }

        const supabase = createClient(supabaseUrl, serviceKey);

        // Validate allowed fields
        const allowedFields = [
            "name",
            "plan",
            "is_active",
            "subscription_ends_at",
            "subscription_status",
            "assignment_mode",
        ];

        const sanitizedUpdates = {};
        for (const [key, value] of Object.entries(updates)) {
            if (allowedFields.includes(key)) {
                sanitizedUpdates[key] = value;
            }
        }

        if (Object.keys(sanitizedUpdates).length === 0) {
            return NextResponse.json(
                { error: "No valid fields to update" },
                { status: 400 }
            );
        }

        // Update tenant
        const { data, error } = await supabase
            .from("tenants")
            .update(sanitizedUpdates)
            .eq("id", id)
            .select()
            .single();

        if (error) {
            console.error("Update tenant error:", error);
            return NextResponse.json(
                { error: "Failed to update tenant", details: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Tenant updated successfully",
            tenant: data,
        });

    } catch (err) {
        console.error("Unexpected error in POST /api/admin/tenants:", err);
        return NextResponse.json(
            { error: "Internal server error", message: err.message },
            { status: 500 }
        );
    }
}