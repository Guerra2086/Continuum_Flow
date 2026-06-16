const SHEET_ID = "1lOyg0kgGmKA5xUT4jWfY9nAYYijoR-Ul0cuWRgCAVZ4";

function doGet() {
  return ContentService.createTextOutput("OK - Web App ativo");
}

function doPost(e) {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheets()[0];
  let data = {};

  try {
    data = e.postData ? JSON.parse(e.postData.contents) : {};
  } catch (err) {
    data = { raw: e.postData ? e.postData.contents : "" };
  }

  sheet.appendRow([
    new Date(),
    data.tipo || "form_submit",
    data.name || "",
    data.email || "",
    data.phone || "",
    data.company || "",
    data.message || "",
    data.page_url || "",
    data.visitor_id || "",
    data.user_agent || "",
    data.referer || "",
    data.language || "",
    data.screen || ""
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ status: "OK" }))
    .setMimeType(ContentService.MimeType.JSON);
}
