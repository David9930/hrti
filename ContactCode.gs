/*
  Name of File: ContactCode.gs
  Created: Apr 1st, 2026
  Created By: Claude and Uncle Burnie (aka Computer Genius)
  Changes Made: Initial build. Receives contact.html form submissions via doPost.
                - Emails hiddenreigns@gmail.com with the client's message.
                - Texts Patti's phone via carrier email-to-SMS gateways (carrier unknown,
                  so it pings all 4 major carriers — only the real one delivers, others bounce harmlessly).
                - Logs every submission to a Google Sheet ("Contact Form Submissions") for backup.

  SETUP:
  1. Go to script.google.com > New Project, paste this code in.
  2. Deploy > New deployment > type: Web app
     - Execute as: Me
     - Who has access: Anyone
  3. Copy the Web App URL into contact.js (SCRIPT_URL constant).
  4. Once Patti confirms her carrier, you can trim CARRIER_GATEWAYS down to just one
     so she stops getting (harmless) bounce notices in her email from the wrong gateways.
*/

const NOTIFY_EMAIL = "derekdevon17@gmail.com";
const PATTI_PHONE = "9416289300"; // digits only, no dashes/spaces

// Carrier unknown -- texting all major US carrier gateways at once.
// Only the correct one will actually deliver; the rest silently fail/bounce.
const CARRIER_GATEWAYS = [
  "vtext.com",                 // Verizon
  "txt.att.net",                // AT&T
  "tmomail.net",                 // T-Mobile
  "messaging.sprintpcs.com"      // Sprint
];

const SHEET_NAME = "Contact Form Submissions";

function doPost(e) {
  try {
    const data = e.parameter;
    const name = data.name || "(no name)";
    const email = data.email || "(no email)";
    const phone = data.phone || "(none provided)";
    const interests = data.interests || "Not specified";
    const message = data.message || "";
    const submittedAt = data.submittedAt || new Date().toLocaleString();

    sendNotificationEmail(name, email, phone, interests, message, submittedAt);
    sendTextAlert(name, interests);
    logToSheet(name, email, phone, interests, message, submittedAt);

    return ContentService.createTextOutput(
      JSON.stringify({ result: "success" })
    ).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ result: "error", message: err.message })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function sendNotificationEmail(name, email, phone, interests, message, submittedAt) {
  const subject = "New Website Contact: " + name + " (" + interests + ")";
  const body =
    "New contact form submission from the website:\n\n" +
    "Name: " + name + "\n" +
    "Email: " + email + "\n" +
    "Phone: " + phone + "\n" +
    "Interested In: " + interests + "\n" +
    "Submitted: " + submittedAt + "\n\n" +
    "Message:\n" + message + "\n\n" +
    "---\n" +
    "Reply directly to this email to respond to " + name + ".";

  GmailApp.sendEmail(NOTIFY_EMAIL, subject, body, {
    replyTo: email,
    name: "Hidden Reigns Website"
  });
}

function sendTextAlert(name, interests) {
  // Keep SMS short -- carrier gateways often truncate around 140-160 characters.
  const smsBody = "New website contact from " + name + " (" + interests + "). Check email for details.";

  CARRIER_GATEWAYS.forEach(function (gateway) {
    try {
      MailApp.sendEmail(PATTI_PHONE + "@" + gateway, "", smsBody);
    } catch (err) {
      // Ignore individual gateway failures -- expected for the wrong carriers.
    }
  });
}

function logToSheet(name, email, phone, interests, message, submittedAt) {
  let ss = SpreadsheetApp.getActiveSpreadsheet();

  if (!ss) {
    // Script not bound to a sheet yet -- create one and bind it.
    ss = SpreadsheetApp.create(SHEET_NAME);
  }

  let sheet = ss.getSheetByName(SHEET_NAME) || ss.getActiveSheet();

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["Submitted", "Name", "Email", "Phone", "Interested In", "Message"]);
    sheet.setFrozenRows(1);
  }

  sheet.appendRow([submittedAt, name, email, phone, interests, message]);
}
