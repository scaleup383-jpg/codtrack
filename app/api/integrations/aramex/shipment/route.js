import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
    try {
        const body = await req.json();
        const { connection_id, shipment } = body;

        if (!connection_id || !shipment) {
            return NextResponse.json(
                { error: "Connection ID and shipment details are required" },
                { status: 400 }
            );
        }

        // Get connection credentials
        const { data: connection } = await supabase
            .from("integration_connections")
            .select("credentials, config")
            .eq("id", connection_id)
            .single();

        if (!connection) {
            return NextResponse.json(
                { error: "Connection not found" },
                { status: 404 }
            );
        }

        const { username, password, account_number, account_pin, account_entity } = connection.credentials;

        // Aramex API endpoint
        const aramexUrl = "https://ws.aramex.net/ShippingAPI.V2/Shipping/Service_1_0.svc/json/CreateShipments";

        const aramexPayload = {
            ClientInfo: {
                UserName: username,
                Password: password,
                Version: "v1.0",
                AccountNumber: account_number,
                AccountPin: account_pin || "",
                AccountEntity: account_entity || "",
                Source: 24,
            },
            LabelInfo: {
                ReportID: 9201,
                ReportType: "URL",
            },
            Shipments: [shipment],
        };

        const aramexRes = await fetch(aramexUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(aramexPayload),
        });

        const aramexData = await aramexRes.json();

        if (!aramexRes.ok || aramexData.HasErrors) {
            return NextResponse.json({
                success: false,
                error: aramexData.Notifications?.[0]?.Message || "Aramex shipment creation failed",
            }, { status: 400 });
        }

        // Save shipment info to lead
        const shipmentInfo = aramexData.Shipments?.[0];
        const trackingNumber = shipmentInfo?.ID || shipmentInfo?.ShipmentNumber?.Value;

        if (trackingNumber && shipment.lead_id) {
            await supabase
                .from("leads")
                .update({
                    tracking_number: trackingNumber,
                    status: "shipped",
                    source: "aramex",
                    delivery_date: new Date().toISOString(),
                })
                .eq("id", shipment.lead_id);
        }

        return NextResponse.json({
            success: true,
            tracking_number: trackingNumber,
            label_url: shipmentInfo?.ShipmentLabel?.LabelURL || null,
            aramex_response: aramexData,
        });
    } catch (err) {
        console.error("Aramex shipment error:", err);
        return NextResponse.json(
            { error: err.message },
            { status: 500 }
        );
    }
}