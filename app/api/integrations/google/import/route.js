import { createClient } from "@supabase/supabase-js";

// 🔐 Supabase init (safe JS version)
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
    throw new Error("Missing Supabase environment variables");
}

const supabase = createClient(url, key);

// 📥 Fetch Google Sheet
async function fetchSheet(sheetId, sheetName, apiKey) {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${sheetName}?key=${apiKey}`;

    const res = await fetch(url);

    if (!res.ok) {
        const err = await res.json();
        console.error("Google Sheets error:", err);
        return [];
    }

    const data = await res.json();
    return data.values || [];
}

// 🔄 Map sheet row → leads table
function mapRow(row) {
    const [
        id,
        customer,
        source,
        phone,
        city,
        product,
        amount,
        quantity,
        status,
        agent,
        tracking,
        date,
    ] = row;

    // skip empty rows
    if (!phone && !customer) return null;

    return {
        customer: customer || "Unknown",
        source: source || null,
        phone: phone ? String(phone).replace(/\.0$/, "") : null,
        city: city || null,
        product: product || null,
        quantity: Number(quantity || 1),
        amount: Number(amount || 0),
        status: status || "pending",
        agent: agent || null,
        tracking: tracking || null,
        date: date ? new Date(date).toISOString() : new Date().toISOString(),
    };
}

// 🚀 API Route
export async function POST(req) {
    try {
        const { connection } = await req.json();

        if (!connection) {
            return Response.json(
                { success: false, error: "Missing connection" },
                { status: 400 }
            );
        }

        // 🔑 GET TENANT ID from connection
        const tenantId = connection.tenant_id;

        if (!tenantId) {
            return Response.json(
                { success: false, error: "No tenant_id found in connection" },
                { status: 400 }
            );
        }

        console.log("📥 Import for tenant:", tenantId);

        const config = connection.config;

        const sheetId = config.sheet_id;
        const sheetName = config.sheet_name || "Sheet1";
        const startLine = config.start_line || 2;

        const apiKey = process.env.GOOGLE_SHEETS_API_KEY;

        if (!sheetId || !apiKey) {
            return Response.json(
                { success: false, error: "Missing sheet_id or API key" },
                { status: 400 }
            );
        }

        // 📥 Load sheet rows
        const rows = await fetchSheet(sheetId, sheetName, apiKey);

        if (!rows.length) {
            return Response.json({
                success: false,
                message: "No data found in sheet",
                imported: 0,
            });
        }

        console.log("TOTAL ROWS:", rows.length);

        // 🔄 Transform rows
        const leads = rows
            .slice(startLine - 1)
            .map(mapRow)
            .filter(Boolean);

        if (!leads.length) {
            return Response.json({
                success: false,
                message: "No valid leads after mapping",
                imported: 0,
            });
        }

        // ✅ ADD tenant_id to EVERY lead
        const leadsWithTenant = leads.map(lead => ({
            ...lead,
            tenant_id: tenantId,
        }));

        console.log(`📝 Inserting ${leadsWithTenant.length} leads for tenant ${tenantId}`);

        // 💾 Insert into Supabase
        const { data, error } = await supabase
            .from("leads")
            .insert(leadsWithTenant)
            .select();

        if (error) {
            console.error("DB INSERT ERROR:", error);
            return Response.json(
                { success: false, error: error.message },
                { status: 500 }
            );
        }

        console.log(`✅ Imported ${data.length} leads`);

        // 🔥 AUTO-ASSIGN after import
        if (data.length > 0) {
            try {
                const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
                const assignResponse = await fetch(`${baseUrl}/api/assign-leads`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        tenant_id: tenantId,
                        mode: "smart"
                    }),
                });
                const assignResult = await assignResponse.json();
                console.log("🔄 Auto-assign result:", assignResult);
            } catch (assignErr) {
                console.warn("Auto-assign after import failed:", assignErr);
            }
        }

        // ✅ Success response
        return Response.json({
            success: true,
            imported: data.length,
            tenant_id: tenantId,
            sample: data.slice(0, 2),
        });

    } catch (err) {
        console.error("IMPORT ERROR:", err);
        return Response.json(
            { success: false, error: err.message },
            { status: 500 }
        );
    }
}