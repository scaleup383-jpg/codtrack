import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
    try {
        const body = await req.json();
        const { connection_id, action, tracking_numbers, bl_ref } = body;

        if (!connection_id) {
            return NextResponse.json({ error: "Missing connection_id" }, { status: 400 });
        }

        const { data: connection } = await supabase
            .from("integration_connections")
            .select("*")
            .eq("id", connection_id)
            .single();

        if (!connection) {
            return NextResponse.json({ error: "Connection not found" }, { status: 404 });
        }

        const { client_id, api_key, api_url } = connection.credentials;
        const baseUrl = api_url || "https://api.ozonexpress.ma";
        const customerUrl = `${baseUrl}/customers/${client_id}/${api_key}`;

        let result;

        switch (action) {
            case "create": {
                // Step 1: Create delivery note
                const createRes = await fetch(`${customerUrl}/add-delivery-note`, { method: "POST" });
                const createData = await createRes.json();
                const ref = createData.ref || bl_ref;

                // Step 2: Add parcels to delivery note
                if (tracking_numbers && tracking_numbers.length > 0) {
                    const formData = new FormData();
                    formData.append("Ref", ref);
                    tracking_numbers.forEach((code, i) => {
                        formData.append(`Codes[${i}]`, code);
                    });
                    await fetch(`${customerUrl}/add-parcel-to-delivery-note`, { method: "POST", body: formData });
                }

                // Step 3: Save delivery note
                const saveForm = new FormData();
                saveForm.append("Ref", ref);
                await fetch(`${customerUrl}/save-delivery-note`, { method: "POST", body: saveForm });

                result = {
                    ref,
                    pdf_url: `https://client.ozoneexpress.ma/pdf-delivery-note?dn-ref=${ref}`,
                    tickets_a4: `https://client.ozoneexpress.ma/pdf-delivery-note-tickets?dn-ref=${ref}`,
                    tickets_10x10: `https://client.ozoneexpress.ma/pdf-delivery-note-tickets-4-4?dn-ref=${ref}`,
                };
                break;
            }
            case "pdf": {
                result = {
                    pdf_url: `https://client.ozoneexpress.ma/pdf-delivery-note?dn-ref=${bl_ref}`,
                    tickets_a4: `https://client.ozoneexpress.ma/pdf-delivery-note-tickets?dn-ref=${bl_ref}`,
                    tickets_10x10: `https://client.ozoneexpress.ma/pdf-delivery-note-tickets-4-4?dn-ref=${bl_ref}`,
                };
                break;
            }
            default:
                return NextResponse.json({ error: "Invalid action. Use 'create' or 'pdf'" }, { status: 400 });
        }

        return NextResponse.json({ success: true, ...result });
    } catch (err) {
        console.error("Ozon delivery note error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}