import { supabase } from "./supabase/client";

export async function getProfile() {
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", user.id)
        .single();

    if (error) return null;

    return data;
}