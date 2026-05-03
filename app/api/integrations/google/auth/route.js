import { getGoogleAuthUrl } from "@/lib/integrations/providers/google";

export async function GET() {
  return Response.json({ url: getGoogleAuthUrl() });
}