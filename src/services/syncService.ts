import { db, syncState, type SyncQueueItem, type BackupHistoryItem } from '../database/db';
import showToast from '../utils/toast';

// Define sync setting keys for indexing settings DB
export const SYNC_URL_KEY = 'sync_google_apps_script_url';
export const SYNC_SECRET_KEY = 'sync_secret_token';
export const SYNC_AUTO_TOGGLE = 'sync_auto_toggle';
export const SYNC_INTERVAL_KEY = 'sync_interval';
export const SYNC_CONFLICT_POLICY = 'sync_conflict_policy'; // 'local', 'cloud', 'manual'

export interface SyncConfiguration {
  url: string;
  secret: string;
  autoSync: boolean;
  interval: number; // in minutes
  conflictPolicy: 'local' | 'cloud' | 'manual';
}

// Supported tables in IndexedDB that can be synced
export const SYNCABLE_TABLES = [
  'products',
  'categories',
  'customers',
  'suppliers',
  'sales',
  'saleItems',
  'purchases',
  'purchaseItems',
  'expenses',
  'expenseCategories',
  'creditAccounts',
  'creditPayments',
  'settings',
  'users',
  'stockHistory'
] as const;

export type SyncableTable = typeof SYNCABLE_TABLES[number];

/**
 * Returns the Google Apps Script script code as a string so that the user
 * can copy and deploy it easily to their Google Drive.
 */
export function getGoogleAppsScriptCode(): string {
  return `/**
 * =====================================================================
 * SHOP MANAGEMENT SYSTEM CLOUD BACKUP & SYNCHRONIZATION BACKEND SCRIPT
 * =====================================================================
 * 
 * Instructions:
 * 1. Open Google Sheets (create a blank new spreadsheet or open an existing one).
 * 2. Click "Extensions" -> "Apps Script" in the top menu bar.
 * 3. Delete any default code in Code.gs and paste this entire script.
 * 4. Change the SECRET_TOKEN below to a secure, custom password of your choice.
 * 5. Click the "Save" icon.
 * 6. Click "Deploy" (top right) -> "New deployment".
 * 7. Choose type: "Web app".
 * 8. Set Description: "Shop Management Sync API".
 * 9. Set "Execute as": "Me (your-email@gmail.com)".
 * 10. Set "Who has access": "Anyone". (This is critical for web calls to succeed).
 * 11. Click "Deploy", authorize any Google permissions requested.
 * 12. Copy the generated "Web app URL" (it ends with /exec) and paste it into the 
 *     Shop Management Cloud Sync Settings along with your Secret Token.
 * 
 * Note: Sheets will be created automatically upon the first synchronization!
 */

const SECRET_TOKEN = "SHOP_SECRET_PASS_2026"; // CHANGE THIS PASSWORD!

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return responseJson({ status: "error", error: "Missing post body payload." });
    }
    
    const requestData = JSON.parse(e.postData.contents);
    const clientToken = requestData.secretToken || requestData.secret;
    
    // Auth Validation
    if (SECRET_TOKEN && SECRET_TOKEN !== "YOUR_SECRET_TOKEN" && clientToken !== SECRET_TOKEN) {
      return responseJson({ status: "error", error: "Unauthorized: Invalid Secret Token." });
    }
    
    const action = requestData.action;
    const response = handleAction(action, requestData);
    return responseJson(response);
  } catch (err) {
    return responseJson({ status: "error", error: err.toString() });
  }
}

function doGet(e) {
  return ContentService.createTextOutput("Shop Management Sync Server is Active. Please use POST requests.")
    .setMimeType(ContentService.MimeType.TEXT);
}

function responseJson(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeader("Access-Control-Allow-Origin", "*")
    .setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
    .setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function handleAction(action, data) {
  if (action === "healthCheck" || action === "ping") {
    return { 
      status: "success", 
      message: "Connection verified! Google Apps Script is active and linked to Google Sheets.",
      spreadsheetName: SpreadsheetApp.getActiveSpreadsheet().getName(),
      spreadsheetId: SpreadsheetApp.getActiveSpreadsheet().getId()
    };
  }
  
  if (action === "syncBatch") {
    const results = {};
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const batch = data.payload || []; // Array of { table: string, records: Array }
    
    for (let i = 0; i < batch.length; i++) {
      const item = batch[i];
      const tableName = item.table;
      const records = item.records || [];
      results[tableName] = syncRecordsToSheet(ss, tableName, records);
    }
    return { status: "success", results: results };
  }
  
  if (action === "downloadAll") {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const tables = data.tables || [];
    const results = {};
    
    for (let i = 0; i < tables.length; i++) {
      const tableName = tables[i];
      results[tableName] = downloadRecordsFromSheet(ss, tableName);
    }
    return { status: "success", data: results };
  }
  
  if (action === "deleteRecord") {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const success = deleteRecordInSheet(ss, data.table, data.recordId);
    return { status: success ? "success" : "failed", message: "Record delete executed." };
  }
  
  throw new Error("Unsupported API action: " + action);
}

/**
 * Syncs an array of records to a specific spreadsheet tab.
 * Uses 'id' as the unique key to insert or update.
 */
function syncRecordsToSheet(ss, sheetName, records) {
  if (records.length === 0) return { inserted: 0, updated: 0 };
  
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  
  // Collect all keys from all records to build standard headers
  const headersMap = {};
  records.forEach(r => {
    Object.keys(r).forEach(k => {
      headersMap[k] = true;
    });
  });
  
  // Ensure 'id' is always the first header column
  delete headersMap['id'];
  const headers = ['id', ...Object.keys(headersMap)];
  
  // Verify or construct headers
  let sheetHeaders = [];
  if (sheet.getLastRow() > 0) {
    sheetHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  }
  
  if (sheetHeaders.length === 0 || !sheetHeaders[0]) {
    // Write fresh headers
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheetHeaders = headers;
    sheet.setFrozenRows(1);
  } else {
    // If sheet already has headers, merge any new incoming fields
    let updatedHeaders = [...sheetHeaders];
    let headersChanged = false;
    headers.forEach(h => {
      if (updatedHeaders.indexOf(h) === -1) {
        updatedHeaders.push(h);
        headersChanged = true;
      }
    });
    if (headersChanged) {
      sheet.getRange(1, 1, 1, updatedHeaders.length).setValues([updatedHeaders]);
      sheetHeaders = updatedHeaders;
    }
  }
  
  // Read existing ID index to locate rows quickly
  const lastRow = sheet.getLastRow();
  const idRowMap = {}; // Maps id -> row number
  if (lastRow > 1) {
    const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (let r = 0; r < ids.length; r++) {
      const val = ids[r][0];
      if (val !== undefined && val !== "") {
        idRowMap[val.toString()] = r + 2; // Rows are 1-indexed, and index 1 is headers
      }
    }
  }
  
  let inserted = 0;
  let updated = 0;
  
  // Write records
  records.forEach(record => {
    const recordId = record.id;
    if (recordId === undefined || recordId === null) return;
    
    // Prepare row array matching current sheetHeaders order
    const rowValues = sheetHeaders.map(header => {
      let val = record[header];
      if (val === undefined || val === null) return "";
      if (typeof val === "object") {
        if (val instanceof Date || (val.getTime && typeof val.getTime === 'function')) {
          return val.toISOString();
        }
        return JSON.stringify(val); // serialize nested objects
      }
      return val;
    });
    
    const existingRow = idRowMap[recordId.toString()];
    if (existingRow) {
      // Update existing row
      sheet.getRange(existingRow, 1, 1, sheetHeaders.length).setValues([rowValues]);
      updated++;
    } else {
      // Append new row
      sheet.appendRow(rowValues);
      inserted++;
      // Cache this new row in case there are duplicates inside this batch
      idRowMap[recordId.toString()] = sheet.getLastRow();
    }
  });
  
  return { inserted: inserted, updated: updated };
}

/**
 * Downloads all rows from a sheet and maps them back into JSON objects
 */
function downloadRecordsFromSheet(ss, sheetName) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() < 2) return [];
  
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const rows = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  
  return rows.map(row => {
    const obj = {};
    headers.forEach((header, index) => {
      if (!header) return;
      let val = row[index];
      
      // Parse serialized strings
      if (typeof val === "string") {
        if ((val.startsWith("{") && val.endsWith("}")) || (val.startsWith("[") && val.endsWith("]"))) {
          try {
            val = JSON.parse(val);
          } catch (e) {
            // Keep as string if JSON parsing fails
          }
        } else if (val.match(/^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}/)) {
          // Attempt parsing standard ISO Date strings
          const dateTest = new Date(val);
          if (!isNaN(dateTest.getTime())) {
            val = dateTest;
          }
        }
      }
      obj[header] = val;
    });
    return obj;
  });
}

/**
 * Deletes a record from a sheet by its id
 */
function deleteRecordInSheet(ss, sheetName, recordId) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() < 2) return false;
  
  const lastRow = sheet.getLastRow();
  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  
  for (let r = 0; r < ids.length; r++) {
    if (ids[r][0].toString() === recordId.toString()) {
      sheet.deleteRow(r + 2);
      return true;
    }
  }
  return false;
}
`;
}

/**
 * Service to execute API operations on Google Apps Script
 */
export const syncService = {
  /**
   * Retrieves current sync setup from local IndexedDB Settings table
   */
  async getConfiguration(): Promise<SyncConfiguration> {
    const urlSetting = await db.settings.get(SYNC_URL_KEY);
    const secretSetting = await db.settings.get(SYNC_SECRET_KEY);
    const autoSetting = await db.settings.get(SYNC_AUTO_TOGGLE);
    const intervalSetting = await db.settings.get(SYNC_INTERVAL_KEY);
    const policySetting = await db.settings.get(SYNC_CONFLICT_POLICY);

    return {
      url: urlSetting ? urlSetting.value : '',
      secret: secretSetting ? secretSetting.value : '',
      autoSync: autoSetting ? !!autoSetting.value : false,
      interval: intervalSetting ? Number(intervalSetting.value) : 15,
      conflictPolicy: policySetting ? policySetting.value : 'manual'
    };
  },

  /**
   * Saves synchronization credentials and policies
   */
  async saveConfiguration(config: SyncConfiguration): Promise<void> {
    const now = new Date();
    await db.settings.put({ key: SYNC_URL_KEY, value: config.url, updatedAt: now });
    await db.settings.put({ key: SYNC_SECRET_KEY, value: config.secret, updatedAt: now });
    await db.settings.put({ key: SYNC_AUTO_TOGGLE, value: config.autoSync, updatedAt: now });
    await db.settings.put({ key: SYNC_INTERVAL_KEY, value: config.interval, updatedAt: now });
    await db.settings.put({ key: SYNC_CONFLICT_POLICY, value: config.conflictPolicy, updatedAt: now });
  },

  async syncWithLocalServer(): Promise<{ success: boolean; results?: any }> {
    const originalInProgress = syncState.inProgress;
    syncState.inProgress = true;
    try {
      const pendingItems = await db.syncQueue
        .where('status')
        .equals('Pending')
        .toArray();

      if (pendingItems.length === 0) {
        return { success: true };
      }

      const batchMap: Record<string, { queueIds: number[]; records: any[] }> = {};

      for (const item of pendingItems) {
        const table = item.table;
        const recordId = item.recordId;
        
        let record = await (db as any)[table].get(recordId);
        
        if (!record && item.recordData) {
          try {
            record = JSON.parse(item.recordData);
          } catch (e) {
            // skip if invalid
          }
        }

        if (record) {
          const cleanedRecord = { ...record };
          Object.keys(cleanedRecord).forEach(key => {
            if (cleanedRecord[key] instanceof Date) {
              cleanedRecord[key] = cleanedRecord[key].toISOString();
            }
          });

          cleanedRecord.syncStatus = 'Synced';
          cleanedRecord.lastSyncedAt = new Date().toISOString();
          cleanedRecord.syncVersion = (record.syncVersion || 0) + 1;

          if (!batchMap[table]) {
            batchMap[table] = { queueIds: [], records: [] };
          }
          batchMap[table].queueIds.push(item.id!);
          batchMap[table].records.push(cleanedRecord);
        } else {
          await db.syncQueue.update(item.id!, { status: 'Synced', updatedAt: new Date() });
        }
      }

      const payload = Object.entries(batchMap).map(([table, data]) => ({
        table,
        records: data.records
      }));

      if (payload.length > 0) {
        const response = await fetch('/api/db/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ payload })
        });

        if (!response.ok) {
          throw new Error(`Server returned ${response.status}: ${response.statusText}`);
        }

        const resJson = await response.json();
        if (resJson.status !== 'success') {
          throw new Error(resJson.error || 'Server rejected sync batch');
        }

        for (const [table, data] of Object.entries(batchMap)) {
          for (const qId of data.queueIds) {
            await db.syncQueue.update(qId, {
              status: 'Synced',
              error: undefined,
              updatedAt: new Date()
            });
          }

          for (const rec of data.records) {
            const keyPath = (db as any)[table].schema?.primKey?.keyPath;
            let recordKey = undefined;
            if (typeof keyPath === 'string') {
              recordKey = rec[keyPath];
            }
            if (recordKey === undefined || recordKey === null) {
              recordKey = rec.id ?? rec.key ?? rec.invoiceNo ?? rec.purchaseNumber ?? rec.expenseNumber;
            }
            
            if (recordKey === undefined || recordKey === null) {
              console.warn(`Could not resolve primary key for table ${table} with record:`, rec);
              continue;
            }

            try {
              const localRec = await (db as any)[table].get(recordKey);
              if (localRec) {
                await (db as any)[table].update(recordKey, {
                  syncStatus: 'Synced',
                  lastSyncedAt: new Date(),
                  syncVersion: (localRec.syncVersion || 0) + 1,
                  syncError: undefined
                });
              }
            } catch (err) {
              console.error(`Failed to update local sync state for ${table}:${recordKey}`, err);
            }
          }
        }
        return { success: true, results: resJson.results };
      }

      return { success: true };
    } catch (err: any) {
      console.error('Error during local server sync:', err);
      return { success: false };
    } finally {
      syncState.inProgress = originalInProgress;
    }
  },

  /**
   * Checks local internet availability and then verifies Apps Script connectivity
   */
  async verifyConnection(url: string, secret: string): Promise<{ success: boolean; message: string; details?: any }> {
    if (!navigator.onLine) {
      return { success: false, message: 'Offline Mode: No local internet connection detected.' };
    }

    if (!url) {
      return { success: false, message: 'Configuration Error: Apps Script Web App URL is empty.' };
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
        redirect: 'follow',
        body: JSON.stringify({
          action: 'healthCheck',
          secret: secret
        })
      });

      if (!response.ok) {
        return { 
          success: false, 
          message: `HTTP Connection Error: Server returned status code ${response.status} (${response.statusText}).` 
        };
      }

      const resJson = await response.json();
      if (resJson.status === 'success') {
        return { 
          success: true, 
          message: resJson.message || 'Successfully connected to Google Sheets!', 
          details: resJson 
        };
      } else {
        return { 
          success: false, 
          message: resJson.error || 'Connection rejected by Google Sheets script.' 
        };
      }
    } catch (err: any) {
      console.error('Verify connection error:', err);
      return { 
        success: false, 
        message: `Connection Failed: Ensure that CORS is supported, your Apps Script is deployed with access set to "Anyone", and the URL is correct. Details: ${err.message || err}` 
      };
    }
  },

  /**
   * Uploads a batch of multiple records to different sheets via the Apps Script Sync API
   */
  async uploadBatch(url: string, secret: string, payload: { table: string; records: any[] }[]): Promise<any> {
    const response = await fetch(url, {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'application/json' },
      redirect: 'follow',
      body: JSON.stringify({
        action: 'syncBatch',
        secret: secret,
        payload: payload
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
    }

    const resJson = await response.json();
    if (resJson.status !== 'success') {
      throw new Error(resJson.error || 'Apps Script sync action rejected.');
    }

    return resJson.results;
  },

  /**
   * Downloads records for specified tables from Google Sheets
   */
  async downloadAll(url: string, secret: string, tables: string[]): Promise<Record<string, any[]>> {
    const response = await fetch(url, {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'application/json' },
      redirect: 'follow',
      body: JSON.stringify({
        action: 'downloadAll',
        secret: secret,
        tables: tables
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
    }

    const resJson = await response.json();
    if (resJson.status !== 'success') {
      throw new Error(resJson.error || 'Apps Script download action rejected.');
    }

    return resJson.data;
  },

  /**
   * Export all database tables into a combined JSON backup package
   */
  async exportDatabaseToJSON(): Promise<string> {
    const backup: Record<string, any[]> = {};
    for (const table of SYNCABLE_TABLES) {
      backup[table] = await (db as any)[table].toArray();
    }
    return JSON.stringify(backup, null, 2);
  },

  /**
   * Import database tables from a combined JSON string
   */
  async importDatabaseFromJSON(jsonString: string, policy: 'overwrite' | 'merge' = 'merge'): Promise<{ success: boolean; count: number }> {
    const originalInProgress = syncState.inProgress;
    syncState.inProgress = true;
    try {
      const data = JSON.parse(jsonString);
      let loadedCount = 0;
      
      await db.transaction('rw', SYNCABLE_TABLES as any, async () => {
        for (const table of SYNCABLE_TABLES) {
          const records = data[table];
          if (Array.isArray(records)) {
            if (policy === 'overwrite') {
              await (db as any)[table].clear();
            }
            
            for (const rec of records) {
              // Standardize dates
              if (rec.createdAt) rec.createdAt = new Date(rec.createdAt);
              if (rec.updatedAt) rec.updatedAt = new Date(rec.updatedAt);
              if (rec.saleDate) rec.saleDate = new Date(rec.saleDate);
              if (rec.purchaseDate) rec.purchaseDate = new Date(rec.purchaseDate);
              if (rec.expenseDate) rec.expenseDate = new Date(rec.expenseDate);
              if (rec.paymentDate) rec.paymentDate = new Date(rec.paymentDate);
              
              await (db as any)[table].put(rec);
              loadedCount++;
            }
          }
        }
      });
      
      return { success: true, count: loadedCount };
    } catch (e: any) {
      console.error(e);
      throw new Error('Invalid JSON structure: ' + e.message);
    } finally {
      syncState.inProgress = originalInProgress;
    }
  },

  /**
   * Converts table data to CSV format
   */
  exportTableToCSV(records: any[]): string {
    if (records.length === 0) return '';
    
    // Extract headers
    const keys = Array.from(
      new Set(records.reduce((acc, curr) => acc.concat(Object.keys(curr)), []))
    ) as string[];
    
    const csvRows = [keys.join(',')];
    
    for (const record of records) {
      const values = keys.map(key => {
        let val = record[key];
        if (val === undefined || val === null) {
          return '';
        }
        if (typeof val === 'object') {
          if (val instanceof Date) {
            val = val.toISOString();
          } else {
            val = JSON.stringify(val);
          }
        }
        // Escape quotes
        const escaped = ('' + val).replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    }
    
    return csvRows.join('\n');
  },

  /**
   * Parses CSV string to records
   */
  parseCSVToRecords(csvText: string): any[] {
    if (!csvText) return [];
    
    const lines = csvText.split('\n');
    if (lines.length === 0) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const records: any[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Simple regex split by commas ignoring commas in quotes
      const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(',');
      const obj: any = {};
      
      headers.forEach((header, index) => {
        let val = matches[index] ? matches[index].trim().replace(/^"|"$/g, '') : '';
        
        // Convert numbers, booleans or serializations
        if (val === 'true') obj[header] = true;
        else if (val === 'false') obj[header] = false;
        else if (!isNaN(Number(val)) && val !== '') obj[header] = Number(val);
        else obj[header] = val;
      });
      
      records.push(obj);
    }
    
    return records;
  }
};
