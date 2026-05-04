import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

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

function mapRow(row, rowIndex) {
    const [id, customer, source, phone, city, product, amount, quantity, status, agent, tracking, date] = row;
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

export async function POST(req) {
    try {
        const { connection } = await req.json();

        if (!connection) {
            return Response.json({ success: false, error: "Missing connection" }, { status: 400 });
        }

        const tenantId = connection.tenant_id;
        if (!tenantId) {
            return Response.json({ success: false, error: "No tenant_id found" }, { status: 400 });
        }

        console.log("📥 Import for tenant:", tenantId);

        const config = connection.config;
        const sheetId = config.sheet_id;
        const sheetName = config.sheet_name || "Sheet1";
        const startLine = config.start_line || 2;
        const apiKey = process.env.GOOGLE_SHEETS_API_KEY;

        if (!sheetId || !apiKey) {
            return Response.json({ success: false, error: "Missing sheet_id or API key" }, { status: 400 });
        }

        // 📥 Load ALL sheet rows
        const rows = await fetchSheet(sheetId, sheetName, apiKey);
        if (!rows.length) {
            return Response.json({ success: false, message: "No data found in sheet", imported: 0 });
        }

        console.log("TOTAL ROWS:", rows.length);

        // Get the last imported row index from config
        const lastImportedRow = config.last_imported_row || (startLine - 1);
        console.log("Last imported row:", lastImportedRow);

        // 🔄 Only process NEW rows (after last imported row)
        const newRows = rows.slice(lastImportedRow);
        console.log("NEW ROWS TO PROCESS:", newRows.length);

        if (newRows.length === 0) {
            return Response.json({
                success: true,
                message: "No new data to import",
                imported: 0,
                last_imported_row: lastImportedRow,
            });
        }

        // Map new rows
        const leads = newRows
            .map((row, i) => mapRow(row, lastImportedRow + i))
            .filter(Boolean);

        if (!leads.length) {
            // Even if no valid leads, update the last row to avoid re-checking
            return Response.json({
                success: true,
                message: "No valid leads in new rows",
                imported: 0,
            });
        }

        // ✅ ADD tenant_id to EVERY lead
        const leadsWithTenant = leads.map(lead => ({
            ...lead,
            tenant_id: tenantId,
        }));

        // Check for duplicates by phone number in the last hour
        const recentPhones = leadsWithTenant.map(l => l.phone).filter(Boolean);
        const { data: existingLeads } = await supabase
            .from("leads")
            .select("phone")
            .eq("tenant_id", tenantId)
            .in("phone", recentPhones)
            .gte("created_at", new Date(Date.now() - 60 * 60 * 1000).toISOString());

        const existingPhones = new Set((existingLeads || []).map(l => l.phone));

        // Filter out duplicates
        const uniqueLeads = leadsWithTenant.filter(l => !existingPhones.has(l.phone));

        console.log(`📝 Inserting ${uniqueLeads.length} new leads (${leadsWithTenant.length - uniqueLeads.length} duplicates skipped)`);

        let imported = 0;
        if (uniqueLeads.length > 0) {
            const { data, error } = await supabase
                .from("leads")
                .insert(uniqueLeads)
                .select();

            if (error) {
                console.error("DB INSERT ERROR:", error);
                return Response.json({ success: false, error: error.message }, { status: 500 });
            }

            imported = data?.length || 0;
            console.log(`✅ Imported ${imported} leads`);
        }

        // Update the last imported row in config
        const newLastRow = rows.length; // We've processed all rows now
        const updatedConfig = {
            ...config,
            last_imported_row: newLastRow,
            last_import_date: new Date().toISOString(),
            total_imported: (config.total_imported || 0) + imported,
        };

        await supabase
            .from("integration_connections")
            .update({ config: updatedConfig })
            .eq("id", connection.id);

        // 🔥 AUTO-ASSIGN after import
        if (imported > 0) {
            try {
                const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
                await fetch(`${baseUrl}/api/assign-leads`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ tenant_id: tenantId, mode: "smart" }),
                });
            } catch (assignErr) {
                console.warn("Auto-assign failed:", assignErr);
            }
        }

        return Response.json({
            success: true,
            imported,
            skipped: leadsWithTenant.length - imported,
            last_imported_row: newLastRow,
            total_rows: rows.length,
        });

    } catch (err) {
        console.error("IMPORT ERROR:", err);
        return Response.json({ success: false, error: err.message }, { status: 500 });
    }
}