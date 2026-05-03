"use client";

import { useState, useEffect, useContext, createContext, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";

const PermissionsContext = createContext({
    permissions: {},
    profile: null,
    tenant: null,
    loading: true,
    canAccess: () => false,
    refreshPermissions: () => { },
});

export function PermissionsProvider({ children }) {
    const [permissions, setPermissions] = useState({});
    const [profile, setProfile] = useState(null);
    const [tenant, setTenant] = useState(null);
    const [loading, setLoading] = useState(true);

    const loadPermissions = useCallback(async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) {
                setLoading(false);
                return;
            }

            // Get user profile
            const { data: userProfile } = await supabase
                .from("user_profiles")
                .select("*")
                .eq("id", session.user.id)
                .single();

            if (!userProfile) {
                setLoading(false);
                return;
            }

            setProfile(userProfile);

            // Fetch tenant data for subscription/trial checks
            if (userProfile.tenant_id) {
                const { data: tenantData, error: tenantError } = await supabase
                    .from("tenants")
                    .select("*")
                    .eq("id", userProfile.tenant_id)
                    .single();

                if (!tenantError && tenantData) {
                    setTenant(tenantData);
                } else {
                    console.error("Failed to fetch tenant:", tenantError);
                }
            }

            // Owner can access everything
            if (userProfile.role === "owner") {
                const allPerms = {};
                ["dashboard", "leads", "finance", "team", "integrations", "settings"].forEach(page => {
                    allPerms[page] = true;
                });
                setPermissions(allPerms);
                setLoading(false);
                return;
            }

            // Get permissions for this role
            const { data: rolePerms } = await supabase
                .from("role_permissions")
                .select("*")
                .eq("role_name", userProfile.role);

            if (rolePerms) {
                const permsMap = {};
                rolePerms.forEach(p => {
                    permsMap[p.page_name] = p.can_access;
                });
                setPermissions(permsMap);
            } else {
                setPermissions({});
            }
        } catch (err) {
            console.error("Failed to load permissions:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadPermissions();
    }, [loadPermissions]);

    const canAccess = useCallback((page) => {
        // Owner can access everything
        if (profile?.role === "owner") return true;
        // Check specific permission
        return permissions[page] === true;
    }, [profile, permissions]);

    const refreshPermissions = useCallback(() => {
        loadPermissions();
    }, [loadPermissions]);

    return (
        <PermissionsContext.Provider value={{
            permissions,
            profile,
            tenant,
            loading,
            canAccess,
            refreshPermissions
        }}>
            {children}
        </PermissionsContext.Provider>
    );
}

export function usePermissions() {
    return useContext(PermissionsContext);
}