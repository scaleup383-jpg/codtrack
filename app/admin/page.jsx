"use client";

import { useRouter } from "next/navigation";

export default function AdminPage() {
    const router = useRouter();

    // Redirect to analytics by default
    if (typeof window !== "undefined") {
        router.push("/admin/analytics");
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="text-center">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                    <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                </div>
                <p className="text-sm text-gray-500">Redirecting to analytics...</p>
            </div>
        </div>
    );
}