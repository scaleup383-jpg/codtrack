import { getGoogleOAuthClient } from "@/lib/integrations/providers/google";

export async function GET(req) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");

  const client = getGoogleOAuthClient();
  const { tokens } = await client.getToken(code);

  // TEMP: store tokens in session / local storage OR redirect with them
  // DO NOT create connection yet

  return Response.redirect(
    `http://localhost:3000/integrations/google/select?access=${tokens.access_token}&refresh=${tokens.refresh_token}`
  );
}