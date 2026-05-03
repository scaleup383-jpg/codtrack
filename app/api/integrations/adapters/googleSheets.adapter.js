import { google } from "googleapis";

export default class GoogleSheetsAdapter {
  getClient(connection) {
    const auth = new google.auth.OAuth2();
    auth.setCredentials(connection.credentials);

    return google.sheets({ version: "v4", auth });
  }

  async getRows(connection) {
    const sheets = this.getClient(connection);

    const { spreadsheet_id, range } = connection.config;

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheet_id,
      range: range || "A1:Z1000",
    });

    return res.data.values || [];
  }
}