import { createClient } from "@supabase/supabase-js";

export async function POST(req) {
    try {
        const { tenant_id } = await req.json();
        console.log("📥 API received tenant_id:", tenant_id);

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        // 🔧 GET USERS WITH AGENT-LIKE ROLES (your actual roles)
        const { data: agents, error: agentsError } = await supabase
            .from("user_profiles")
            .select("id, full_name, role, status")
            .eq("tenant_id", tenant_id)
            .in("role", ["confirmation_agent", "stock_manager", "agent", "admin"])
            .or("status.eq.active,status.is.null");

        console.log("👥 Agents found:", agents);
        console.log("👥 Agents error:", agentsError);

        if (!agents || agents.length === 0) {
            // Try fetching ALL users to debug
            const { data: allUsers } = await supabase
                .from("user_profiles")
                .select("id, full_name, role, status")
                .eq("tenant_id", tenant_id);

            console.log("👥 All users in tenant:", allUsers);

            return Response.json({
                success: false,
                message: "No active agents found. Check user roles and status.",
                allUsers: allUsers?.map(u => ({ role: u.role, status: u.status }))
            });
        }

        console.log(`✅ Found ${agents.length} agents:`, agents.map(a => `${a.full_name} (${a.role})`));

        // Get unassigned leads
        const { data: leads } = await supabase
            .from("leads")
            .select("id")
            .eq("tenant_id", tenant_id)
            .is("assigned_to", null);

        console.log(`📋 ${leads?.length || 0} unassigned leads`);

        if (!leads?.length) {
            return Response.json({
                success: true,
                message: "No unassigned leads",
                agents: agents.length
            });
        }

        // Round robin assignment
        let idx = 0;
        let assigned = 0;

        for (const lead of leads) {
            const agent = agents[idx % agents.length];

            const { error } = await supabase
                .from("leads")
                .update({
                    assigned_to: agent.id,
                    assignment_type: "auto",
                    assigned_at: new Date().toISOString(),
                })
                .eq("id", lead.id);

            if (!error) {
                assigned++;
                console.log(`✅ Lead ${lead.id} → ${agent.full_name} (${agent.role})`);
            } else {
                console.error(`❌ Failed to assign lead ${lead.id}:`, error);
            }

            idx++;
        }

        console.log(`🎉 Assigned ${assigned} of ${leads.length} leads`);

        return Response.json({
            success: true,
            assigned,
            agents: agents.length,
            total: leads.length
        });
    } catch (err) {
        console.error("❌ API error:", err);
        return Response.json({ success: false, error: err.message }, { status: 500 });
    }
}