/**
 * Google Apps Script for SheetSync Pro
 * 
 * Deployment Instructions:
 * 1. Open your Google Sheet.
 * 2. Ensure your sheet has the following headers in the first row:
 *    NAME, EMAIL, MOBILE, SEX, AGE, Designation, PAN Number, Office Name, 
 *    Office Address with pin code, Adhar Number, Account Number, IFSC Code, 
 *    BANK NAME, BRANCH, EHRMS CODE, MasterFilter
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
  const pan = e.parameter.pan;
  const adhar = e.parameter.adhar;
  
  if (!mobile && !pan && !adhar) {
    return createResponse({ success: false, error: "Search query is required" });
  }

  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    if (!sheet) {
      return createResponse({ success: false, error: "Sheet '" + SHEET_NAME + "' not found" });
    }

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const mobileIndex = headers.indexOf("MOBILE");
    const panIndex = headers.indexOf("PAN Number");
    const adharIndex = headers.indexOf("Adhar Number");

    let matchRowIndex = -1;
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (pan && panIndex !== -1 && row[panIndex] !== undefined && row[panIndex] !== null) {
        if (row[panIndex].toString().trim().toUpperCase() === pan.toString().trim().toUpperCase()) {
          matchRowIndex = i;
          break;
        }
      }
      if (adhar && adharIndex !== -1 && row[adharIndex] !== undefined && row[adharIndex] !== null) {
        if (row[adharIndex].toString().trim() === adhar.toString().trim()) {
          matchRowIndex = i;
          break;
        }
      }
      if (mobile && mobileIndex !== -1 && row[mobileIndex] !== undefined && row[mobileIndex] !== null) {
        if (row[mobileIndex].toString().trim() === mobile.toString().trim()) {
          matchRowIndex = i;
          break;
        }
      }
    }

    if (matchRowIndex !== -1) {
      const result = {};
      headers.forEach((header, index) => {
        result[header] = data[matchRowIndex][index];
      });
      return createResponse({ success: true, data: result, exists: true });
    }

    return createResponse({ success: true, exists: false });
  } catch (error) {
    return createResponse({ success: false, error: error.toString() });
  }
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    if (!sheet) {
      return createResponse({ success: false, error: "Sheet '" + SHEET_NAME + "' not found" });
    }

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const mobileIndex = headers.indexOf("MOBILE");
    const panIndex = headers.indexOf("PAN Number");
    const adharIndex = headers.indexOf("Adhar Number");

    let rowIndex = -1;
    
    // Find row by PAN or Aadhaar first, since they are our primary keys now
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (panIndex !== -1 && payload["PAN Number"] && row[panIndex] !== undefined && row[panIndex] !== null) {
        if (row[panIndex].toString().trim().toUpperCase() === payload["PAN Number"].toString().trim().toUpperCase()) {
          rowIndex = i + 1;
          break;
        }
      }
      if (adharIndex !== -1 && payload["Adhar Number"] && row[adharIndex] !== undefined && row[adharIndex] !== null) {
        if (row[adharIndex].toString().trim() === payload["Adhar Number"].toString().trim()) {
          rowIndex = i + 1;
          break;
        }
      }
      if (mobileIndex !== -1 && payload.MOBILE && row[mobileIndex] !== undefined && row[mobileIndex] !== null) {
        if (row[mobileIndex].toString().trim() === payload.MOBILE.toString().trim()) {
          rowIndex = i + 1;
          break;
        }
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
