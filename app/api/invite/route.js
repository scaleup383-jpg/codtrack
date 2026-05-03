import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const resend = new Resend(process.env.RESEND_API_KEY);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const body = await req.json();
    const { tenant_id, email, role, permissions, invited_by } = body;

    if (!tenant_id || !email || !role) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    /* =========================================================
       1. Prevent duplicate pending invites
    ========================================================= */
    const { data: existingInvite } = await supabase
      .from("invitations")
      .select("id, status")
      .eq("tenant_id", tenant_id)
      .eq("email", email)
      .eq("status", "pending")
      .maybeSingle();

    if (existingInvite) {
      return NextResponse.json(
        { error: "This user already has a pending invitation" },
        { status: 409 }
      );
    }

    /* =========================================================
       2. Generate secure token
    ========================================================= */
    const token = crypto.randomBytes(32).toString("hex");

    const expires_at = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000
    ).toISOString();

    /* =========================================================
       3. Save invitation
    ========================================================= */
    const { error: insertError } = await supabase
      .from("invitations")
      .insert({
        tenant_id,
        email,
        role,
        permissions: permissions || {},
        token,
        status: "pending",
        invited_by: invited_by || null,
        expires_at,
      });

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }

    /* =========================================================
       4. Build invite URL
    ========================================================= */
    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/accept-invite?token=${token}`;

    /* =========================================================
       5. Send email
    ========================================================= */
    const emailResult = await resend.emails.send({
      from: "CodFlow <onboarding@resend.dev>",
      to: email,
      subject: "You're invited to CodFlow OS",
      html: `
        <div style="font-family: Arial; padding: 20px;">
          <h2>You're invited 🚀</h2>
          <p><strong>Role:</strong> ${role}</p>

          <p style="color:#666;">
            Join your organization by clicking the button below:
          </p>

          <a href="${inviteUrl}" 
             style="display:inline-block;padding:10px 15px;
             background:#4f46e5;color:#fff;text-decoration:none;
             border-radius:8px;">
            Accept Invitation
          </a>

          <p style="margin-top:20px;color:#888;font-size:12px;">
            This link expires in 7 days.
          </p>
        </div>
      `,
    });

    return NextResponse.json({
      success: true,
      message: "Invitation sent successfully",
      emailResult,
    });

  } catch (error) {
    console.error("INVITE ERROR:", error);

    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}