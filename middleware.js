import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

export async function middleware(req) {
    const res = NextResponse.next();
    const { pathname } = req.nextUrl;

    // Create Supabase server client
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
            cookies: {
                get(name) {
                    return req.cookies.get(name)?.value;
                },
                set(name, value, options) {
                    res.cookies.set({ name, value, ...options });
                },
                remove(name, options) {
                    res.cookies.set({ name, value: "", ...options });
                },
            },
        }
    );

    // Get session
    const {
        data: { session },
    } = await supabase.auth.getSession();

    // ────────────────────────────────────────────────────────
    // PUBLIC ROUTES - No authentication required
    // ────────────────────────────────────────────────────────
    const publicRoutes = [
        "/login",
        "/register",
        "/forgot-password",
        "/reset-password",
        "/accept-invite",
        "/api/public", // public API routes
    ];

    const isPublicRoute = publicRoutes.some(route =>
        pathname === route || pathname.startsWith(route + "/") || pathname.startsWith("/_next") || pathname.startsWith("/api/")
    );

    if (isPublicRoute) {
        return res;
    }

    // ────────────────────────────────────────────────────────
    // AUTHENTICATION CHECK
    // ────────────────────────────────────────────────────────
    if (!session) {
        // Redirect to login if not authenticated
        const loginUrl = new URL("/login", req.url);
        loginUrl.searchParams.set("redirect", pathname);
        return NextResponse.redirect(loginUrl);
    }

    // ────────────────────────────────────────────────────────
    // ADMIN ROUTES PROTECTION
    // ────────────────────────────────────────────────────────
    if (pathname.startsWith("/admin")) {
        try {
            const user = session.user;

            // Check super_admins table via API
            const adminCheckUrl = new URL("/api/admin/check", req.url);

            const checkRes = await fetch(adminCheckUrl, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "x-user-id": user.id,
                    "x-admin-key": process.env.ADMIN_SECRET_KEY || "super_secret_123",
                },
            });

            if (!checkRes.ok) {
                // Admin check failed - redirect to dashboard
                return NextResponse.redirect(new URL("/dashboard", req.url));
            }

            const checkData = await checkRes.json();

            if (!checkData.isAdmin) {
                // Not an admin - redirect to dashboard
                return NextResponse.redirect(new URL("/dashboard", req.url));
            }

            // User is admin - allow access
            console.log(`Admin access granted: ${user.email} → ${pathname}`);

        } catch (err) {
            console.error("Middleware admin check error:", err);
            // On error, redirect to dashboard for safety
            return NextResponse.redirect(new URL("/dashboard", req.url));
        }
    }

    // ────────────────────────────────────────────────────────
    // PROTECTED ROUTES - Authentication required
    // ────────────────────────────────────────────────────────
    // All other routes require authentication (already checked above)

    return res;
}

// ────────────────────────────────────────────────────────
// MATCHER - Routes to apply middleware
// ────────────────────────────────────────────────────────
export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public files (images, fonts, etc.)
         */
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};