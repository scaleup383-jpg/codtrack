export async function assignLeads(supabase, tenant_id) {
    // Get agents - use YOUR actual agent roles
    const { data: agents } = await supabase
        .from("user_profiles")
        .select("id, full_name, role")
        .eq("tenant_id", tenant_id)
        .in("role", ["confirmation_agent", "stock_manager", "agent", "admin"])
        .or("status.eq.active,status.is.null");

    console.log("👥 Agents found:", agents?.length || 0);

    if (!agents || agents.length === 0) {
        return { success: false, message: "No active agents found", agents: 0, assigned: 0 };
    }

    const { data: leads } = await supabase
        .from("leads")
        .select("id")
        .eq("tenant_id", tenant_id)
        .is("assigned_to", null)
        .order("date", { ascending: true });

    if (!leads || leads.length === 0) {
        return { success: true, message: "No unassigned leads", assigned: 0, agents: agents.length };
    }

    let agentIndex = 0;
    let assignedCount = 0;

    for (const lead of leads) {
        const agent = agents[agentIndex];
        const { error } = await supabase
            .from("leads")
            .update({
                assigned_to: agent.id,
                assignment_type: "auto",
                assigned_at: new Date().toISOString(),
            })
            .eq("id", lead.id);

        if (!error) assignedCount++;
        agentIndex = (agentIndex + 1) % agents.length;
    }

    return {
        success: true,
        assigned: assignedCount,
        agents: agents.length,
        total: leads.length,
    };
}