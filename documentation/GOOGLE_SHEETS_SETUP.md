# Google Sheets Cloud Synchronization Setup Guide

Integrating your retail application with Google Sheets provides an automated, free, and secure cloud mirroring backup database. This setup guide outlines the complete steps to configure and publish your Google Apps Script endpoint.

---

## Step 1: Create Your Google Sheet
1. Open [Google Sheets](https://sheets.google.com) and click **Blank Spreadsheet**.
2. Name your sheet (e.g., `Shop_Management_Backup`).
3. You do not need to create any columns or sheets manually. The Apps Script will automatically generate and format all tabs (Products, Sales, Customers, Purchases, Expenses, etc.) upon first sync!

---

## Step 2: Open Google Apps Script
1. Inside your new Google Sheet, click the top menu bar: **Extensions** -> **Apps Script**.
2. A new browser tab will open showing the Google Apps Script code editor.
3. Delete any default code inside `Code.gs`.

---

## Step 3: Insert the Apps Script Sync Engine Code
Paste the following complete, production-ready Apps Script code into the script editor:

```javascript
// Google Apps Script Sync Engine - Single Shop Management System

function doPost(e) {
  try {
    const requestData = JSON.parse(e.postData.contents);
    const action = requestData.action; // 'sync' or 'fetch'
    const payload = requestData.payload;

    if (action === 'sync') {
      return handleSync(payload);
    } else if (action === 'restore') {
      return handleRestore();
    } else {
      return createResponse({ success: false, error: 'Unknown action: ' + action });
    }
  } catch (error) {
    return createResponse({ success: false, error: error.toString() });
  }
}

function handleSync(syncQueue) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  
  for (let i = 0; i < syncQueue.length; i++) {
    const item = syncQueue[i];
    const tableName = item.table; // e.g., 'products', 'sales'
    const recordId = item.recordId;
    const actionType = item.action; // 'CREATE', 'UPDATE', 'DELETE'
    const recordData = JSON.parse(item.recordData);

    let sheet = spreadsheet.getSheetByName(tableName);
    if (!sheet) {
      sheet = spreadsheet.insertSheet(tableName);
      // Generate headers based on keys
      const headers = Object.keys(recordData);
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.setFrozenRows(1);
    }

    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const idColumnIdx = headers.indexOf('id');
    
    if (idColumnIdx === -1) {
      return createResponse({ success: false, error: 'Table sheet is missing "id" index' });
    }

    // Locate row if exists
    let rowToModify = -1;
    if (sheet.getLastRow() > 1) {
      const idValues = sheet.getRange(2, idColumnIdx + 1, sheet.getLastRow() - 1, 1).getValues();
      for (let r = 0; r < idValues.length; r++) {
        if (Number(idValues[r][0]) === Number(recordId)) {
          rowToModify = r + 2; // Offset for header + 0-index
          break;
        }
      }
    }

    if (actionType === 'DELETE') {
      if (rowToModify !== -1) {
        sheet.deleteRow(rowToModify);
      }
    } else {
      // Create or Update
      const rowValues = headers.map(header => {
        const val = recordData[header];
        if (val && typeof val === 'object') {
          return JSON.stringify(val);
        }
        return val === undefined || val === null ? '' : val;
      });

      if (rowToModify !== -1) {
        // Update row
        sheet.getRange(rowToModify, 1, 1, headers.length).setValues([rowValues]);
      } else {
        // Create (Append row)
        sheet.appendRow(rowValues);
      }
    }
  }

  return createResponse({ success: true, message: 'Sync batch processed successfully' });
}

function handleRestore() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = spreadsheet.getSheets();
  const dbDump = {};

  sheets.forEach(sheet => {
    const tableName = sheet.getName();
    if (sheet.getLastRow() < 2) {
      dbDump[tableName] = [];
      return;
    }

    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const dataRange = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn());
    const rows = dataRange.getValues();

    dbDump[tableName] = rows.map(row => {
      const record = {};
      headers.forEach((header, index) => {
        let val = row[index];
        // Safely parse JSON strings if applicable
        if (typeof val === 'string' && (val.startsWith('{') || val.startsWith('['))) {
          try {
            val = JSON.parse(val);
          } catch(e) {}
        }
        record[header] = val;
      });
      return record;
    });
  });

  return createResponse({ success: true, tables: dbDump });
}

function createResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
```

---

## Step 4: Deploy Your Script as a Web App
To allow the retail application to send secure sync requests:

1. Click the blue **Deploy** button at the top-right of the script editor, then select **New deployment**.
2. Click the gear icon (**Select type**) and select **Web app**.
3. Fill in the deployment details:
   - **Description**: `Shop Management Sync Server`
   - **Execute as**: Select **Me (your-email@gmail.com)**
   - **Who has access**: Select **Anyone** *(This is required so your client browser can push updates without requiring explicit browser sign-in sessions)*.
4. Click **Deploy**.
5. **Authorization Prompt**: You will be prompted to grant permission. Click **Authorize access**, log in with your Google account, click "Advanced" -> "Go to Untitled project (unsafe)", and click "Allow".
6. Once the deployment finishes, Google will provide you with a **Web App URL**. It will look similar to this:
   `https://script.google.com/macros/s/AKfycb..._ws/exec`
7. Copy this Web App URL.

---

## Step 5: Configure the Shop Management App
1. Open the **Shop Management System**.
2. Go to **Settings** -> **Google Sheets Cloud Sync Configuration**.
3. Toggle the integration switch to **Active**.
4. Paste the copied **Web App URL** into the URL text input field.
5. Click **Verify & Bind Sync**.
6. The system will run a handshake test and instantly start syncing your offline records to the sheet!
