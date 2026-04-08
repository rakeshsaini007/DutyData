/**
 * Google Apps Script for SheetSync Pro
 * 
 * Deployment Instructions:
 * 1. Open your Google Sheet.
 * 2. Ensure your sheet has the following headers in the first row:
 *    NAME, EMAIL, MOBILE, SEX, AGE, Designation, Identity No, PAN Number, Office Name, 
 *    Office Address with pin code, Land Line Number, Identity Name(Others), Adhar Number, 
 *    Account Number, IFSC Code, BANK NAME, BRANCH, EHRMS CODE
 * 3. Go to Extensions > Apps Script.
 * 4. Paste this code into the editor.
 * 5. Click 'Deploy' > 'New Deployment'.
 * 6. Select 'Web App'.
 * 7. Set 'Execute as' to 'Me'.
 * 8. Set 'Who has access' to 'Anyone'.
 * 9. Click 'Deploy'.
 * 10. Copy the 'Web App URL' and paste it into APPS_SCRIPT_URL in src/App.tsx.
 * 
 * IMPORTANT: If you change the code, you must create a 'New Deployment' or 
 * update the existing one to 'New Version' for changes to take effect.
 */

const SHEET_NAME = "Sheet1";

function doGet(e) {
  const mobile = e.parameter.mobile;
  if (!mobile) {
    return createResponse({ success: false, error: "Mobile number is required" });
  }

  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    if (!sheet) {
      return createResponse({ success: false, error: "Sheet '" + SHEET_NAME + "' not found" });
    }

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const mobileIndex = headers.indexOf("MOBILE");

    if (mobileIndex === -1) {
      return createResponse({ success: false, error: "MOBILE column not found" });
    }

    for (let i = 1; i < data.length; i++) {
      if (data[i][mobileIndex].toString().trim() === mobile.toString().trim()) {
        const result = {};
        headers.forEach((header, index) => {
          result[header] = data[i][index];
        });
        return createResponse({ success: true, data: result, exists: true });
      }
    }

    return createResponse({ success: true, exists: false });
  } catch (error) {
    return createResponse({ success: false, error: error.toString() });
  }
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const mobile = payload.MOBILE;
    
    if (!mobile) {
      return createResponse({ success: false, error: "Mobile number is required" });
    }

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const mobileIndex = headers.indexOf("MOBILE");

    if (mobileIndex === -1) {
      return createResponse({ success: false, error: "MOBILE column not found" });
    }

    let rowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][mobileIndex].toString().trim() === mobile.toString().trim()) {
        rowIndex = i + 1;
        break;
      }
    }

    if (rowIndex !== -1) {
      // Update existing row
      headers.forEach((header, index) => {
        if (payload.hasOwnProperty(header)) {
          sheet.getRange(rowIndex, index + 1).setValue(payload[header]);
        }
      });
      return createResponse({ success: true, message: "Record updated successfully in Google Sheets!" });
    } else {
      // Append new row
      const newRow = headers.map(header => payload[header] || "");
      sheet.appendRow(newRow);
      return createResponse({ success: true, message: "New record saved successfully to Google Sheets!" });
    }
  } catch (error) {
    return createResponse({ success: false, error: "Server Error: " + error.toString() });
  }
}

function createResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
