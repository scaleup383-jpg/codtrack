import { google } from "googleapis";

export async function POST(req) {
  const { access_token } = await req.json();

  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token });

  const drive = google.drive({ version: "v3", auth });

  const res = await drive.files.list({
    q: "mimeType='application/vnd.google-apps.spreadsheet'",
    fields: "files(id, name)",
  });

  return Response.json(res.data.files);
}