import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET(req) {
    try {
        const userId = req.headers.get("x-user-id");

        // Validate request
        if (!userId) {
            return NextResponse.json(
                {
                    isAdmin: false,
                    error: "Missing user ID",
                    message: "User ID header is required"
                },
                { status: 400 }
            );
        }

        // Validate environment variables
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !serviceKey) {
            console.error("Missing Supabase environment variables");
            return NextResponse.json(
                { isAdmin: false, error: "Server configuration error" },
                { status: 500 }
            );
        }

        // Create Supabase admin client with service role
        const supabase = createClient(supabaseUrl, serviceKey, {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
            },
        });

        // Step 1: Check super_admins table first
        const { data: userData } = await supabase.auth.admin.getUserById(userId);

        if (userData?.user?.email) {
            const { data: superAdmin, error: superAdminError } = await supabase
                .from("super_admins")
                .select("id, email, role")
                .eq("email", userData.user.email)
                .single();

            if (!superAdminError && superAdmin) {
                return NextResponse.json({
                    isAdmin: true,
                    type: "super_admin",
                    email: superAdmin.email,
                    role: superAdmin.role || "super_admin",
                });
            }
        }

        // Step 2: Check user_profiles for workspace admin
        const { data: profile, error: profileError } = await supabase
            .from("user_profiles")
            .select("id, role, tenant_id, full_name")
            .eq("id", userId)
            .single();

        if (profileError || !profile) {
            return NextResponse.json({
                isAdmin: false,
                message: "User profile not found",
            });
        }

        // Check if user is workspace admin/owner
        const isWorkspaceAdmin =
            profile.role === "owner" ||
            profile.role === "admin";

        return NextResponse.json({
            isAdmin: isWorkspaceAdmin,
            type: isWorkspaceAdmin ? "workspace_admin" : "regular_user",
            role: profile.role,
            tenantId: profile.tenant_id,
            fullName: profile.full_name,
        });

    } catch (err) {
        console.error("Admin check error:", err);
        return NextResponse.json(
            {
                isAdmin: false,
                error: "Internal server error",
                message: err.message
            },
            { status: 500 }
        );
    }
}