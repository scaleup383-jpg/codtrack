import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
    try {
        const body = await req.json();
        const { connection_id } = body;

        if (!connection_id) {
            return NextResponse.json(
                { error: "Connection ID is required" },
                { status: 400 }
            );
        }

        const { error } = await supabase
            .from("integration_connections")
            .update({ status: "inactive" })
            .eq("id", connection_id);

        if (error) throw error;

        return NextResponse.json({
            success: true,
            message: "Olaivraison disconnected",
        });
    } catch (err) {
        return NextResponse.json(
            { error: err.message },
            { status: 500 }
        );
    }
}