import React, { useState, useEffect, useRef } from 'react';
import { Download, Upload, ShieldCheck, AlertTriangle, FileJson, CheckCircle2, Wrench, RefreshCw, FileText } from 'lucide-react';
import { jsonBackupService, type JSONValidationReport } from '../../services/jsonBackupService';
import { dataIntegrityService, type DataIntegrityReport } from '../../services/dataIntegrity/DataIntegrityService';
import showToast from '../../utils/toast';
import Button from '../ui/Button';

export const JsonBackupCard: React.FC = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isRepairing, setIsRepairing] = useState(false);
  const [report, setReport] = useState<DataIntegrityReport | null>(null);

  // JSON Import States
  const [importFile, setImportFile] = useState<File | null>(null);
  const [jsonContent, setJsonContent] = useState<string>('');
  const [validationReport, setValidationReport] = useState<JSONValidationReport | null>(null);
  const [importPolicy, setImportPolicy] = useState<'merge' | 'overwrite'>('merge');
  const [showImportModal, setShowImportModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initial Integrity Scan on Load
  const handleScanIntegrity = async () => {
    setIsScanning(true);
    try {
      const res = await dataIntegrityService.scanDatabase();
      setReport(res);
    } catch (err: any) {
      showToast.error(`Data integrity scan error: ${err.message || err}`);
    } finally {
      setIsScanning(false);
    }
  };

  useEffect(() => {
    handleScanIntegrity();
  }, []);

  // Export Central JSON
  const handleExportJSON = async () => {
    setIsExporting(true);
    try {
      const jsonStr = await jsonBackupService.exportDatabaseToJSONString();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ShopCraft_JSON_Database_Backup_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      showToast.success('Central JSON Database exported successfully!');
    } catch (err: any) {
      showToast.error(`Export failed: ${err.message || err}`);
    } finally {
      setIsExporting(false);
    }
  };

  // Handle File Select for Import
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setJsonContent(content);
      const valReport = jsonBackupService.validateJSONBackup(content);
      setValidationReport(valReport);
      setShowImportModal(true);
    };
    reader.onerror = () => {
      showToast.error('Failed to read selected JSON file.');
    };
    reader.readAsText(file);
    // Reset file input value
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Execute Restore
  const handleConfirmImport = async () => {
    if (!jsonContent) return;
    try {
      const result = await jsonBackupService.importDatabaseFromJSON(jsonContent, importPolicy);
      showToast.success(`Database successfully restored! ${result.recordCount} records imported.`);
      setShowImportModal(false);
      setValidationReport(null);
      setJsonContent('');
      setImportFile(null);
      // Re-scan integrity and refresh UI
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      showToast.error(`Restore failed: ${err.message || err}`);
    }
  };

  // Execute Safe Repair
  const handleRepairIntegrity = async () => {
    setIsRepairing(true);
    try {
      const res = await dataIntegrityService.repairDatabase();
      setReport(res);
      if (res.inconsistenciesRepaired > 0) {
        showToast.success(`Successfully repaired ${res.inconsistenciesRepaired} database inconsistencies!`);
      } else {
        showToast.info('No repairable issues found.');
      }
    } catch (err: any) {
      showToast.error(`Repair failed: ${err.message || err}`);
    } finally {
      setIsRepairing(false);
    }
  };

  // Export Integrity Report
  const handleExportIntegrityReport = () => {
    if (!report) return;
    const jsonStr = JSON.stringify(report, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ShopCraft_Integrity_Report_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast.success('Integrity report downloaded!');
  };

  return (
    <div className="p-6 rounded-2xl bg-white border border-slate-100 dark:bg-slate-950 dark:border-slate-800 shadow-sm space-y-6 text-left">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            Central Data Integrity & JSON Architecture
          </h3>
          <p className="text-xs font-semibold text-slate-450 dark:text-slate-500 mt-1 leading-normal max-w-xl">
            Export a comprehensive, JSON-compatible database snapshot or validate relational integrity offline. All business data is safely stored in IndexedDB.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileSelect} 
            accept=".json,application/json" 
            className="hidden" 
            id="json-file-input"
          />

          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 font-bold text-xs cursor-pointer"
            id="import-json-btn"
          >
            <Upload className="h-4 w-4 text-slate-600 dark:text-slate-300" />
            <span>Import JSON</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleExportJSON}
            disabled={isExporting}
            className="flex items-center gap-1.5 font-bold text-xs cursor-pointer"
            id="export-full-json-btn"
          >
            <Download className="h-4 w-4" />
            <span>{isExporting ? 'Exporting...' : 'Export JSON Backup'}</span>
          </Button>
        </div>
      </div>

      {/* Integrity Telemetry Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100/80 dark:border-slate-800">
        <div>
          <span className="text-[10px] font-extrabold uppercase text-slate-450 dark:text-slate-500">Health Score</span>
          <div className="text-xl font-black mt-0.5 flex items-center gap-1.5">
            <span className={report && report.healthScore >= 95 ? 'text-emerald-600' : 'text-amber-500'}>
              {report ? `${report.healthScore}%` : '---'}
            </span>
            {report && report.healthScore >= 95 && (
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            )}
          </div>
        </div>

        <div>
          <span className="text-[10px] font-extrabold uppercase text-slate-450 dark:text-slate-500">Records Checked</span>
          <div className="text-xl font-black text-slate-800 dark:text-slate-200 mt-0.5">
            {report ? report.totalRecordsChecked : '---'}
          </div>
        </div>

        <div>
          <span className="text-[10px] font-extrabold uppercase text-slate-450 dark:text-slate-500">Inconsistencies</span>
          <div className={`text-xl font-black mt-0.5 ${report && report.issues.length > 0 ? 'text-amber-500' : 'text-slate-800 dark:text-slate-200'}`}>
            {report ? report.issues.filter(i => i.status !== 'Repaired').length : '---'}
          </div>
        </div>

        <div>
          <span className="text-[10px] font-extrabold uppercase text-slate-450 dark:text-slate-500">Status</span>
          <div className="text-xs font-black text-slate-700 dark:text-slate-300 mt-1 truncate">
            {report ? (report.isProductionReady ? 'Production Ready' : 'Attention Required') : 'Scanning...'}
          </div>
        </div>
      </div>

      {/* Integrity Actions & Issues Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            Database Integrity Issues ({report ? report.issues.length : 0})
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={handleScanIntegrity}
              disabled={isScanning}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-all cursor-pointer"
              id="run-integrity-check-btn"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isScanning ? 'animate-spin' : ''}`} />
              <span>Run Integrity Check</span>
            </button>

            <button
              onClick={handleRepairIntegrity}
              disabled={isRepairing || !report || report.issues.length === 0}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              id="repair-safe-issues-btn"
            >
              <Wrench className={`h-3.5 w-3.5 ${isRepairing ? 'animate-spin' : ''}`} />
              <span>{isRepairing ? 'Repairing...' : 'Repair Safe Issues'}</span>
            </button>

            {report && (
              <button
                onClick={handleExportIntegrityReport}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 flex items-center gap-1.5 transition-all cursor-pointer"
                id="export-integrity-report-btn"
              >
                <FileText className="h-3.5 w-3.5" />
                <span>Export Report</span>
              </button>
            )}
          </div>
        </div>

        {report && report.issues.length > 0 ? (
          <div className="max-h-60 overflow-y-auto border border-slate-100 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800">
            {report.issues.map((issue) => (
              <div key={issue.id} className="p-3 text-xs flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                      issue.severity === 'Critical' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400' :
                      issue.severity === 'High' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' :
                      'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}>
                      {issue.severity}
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{issue.category} (Record #{String(issue.recordId)})</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400">{issue.description}</p>
                  {issue.repairedValue && (
                    <p className="text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">Resolution: {issue.repairedValue}</p>
                  )}
                </div>

                <span className={`px-2 py-1 rounded text-[10px] font-bold shrink-0 ${
                  issue.status === 'Repaired' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                }`}>
                  {issue.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 text-center text-xs font-bold text-slate-500">
            {isScanning ? 'Scanning database for inconsistencies...' : 'No data integrity issues detected. Database is 100% synchronized!'}
          </div>
        )}
      </div>

      {/* Pre-Import Validation Modal */}
      {showImportModal && validationReport && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 max-w-xl w-full p-6 shadow-xl space-y-5 text-left">
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <FileJson className="h-5 w-5 text-indigo-600" />
                Validate JSON Database Import
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Review payload verification report before applying restore to local IndexedDB.
              </p>
            </div>

            {/* Validation Summary */}
            <div className={`p-4 rounded-xl border space-y-2 ${validationReport.valid ? 'bg-emerald-50/50 border-emerald-200' : 'bg-rose-50/50 border-rose-200'}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-slate-700">Schema Status</span>
                <span className={`text-xs font-black uppercase ${validationReport.valid ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {validationReport.valid ? 'Valid JSON Package' : 'Validation Errors Detected'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div>Total Records: <strong className="text-slate-900 dark:text-white">{validationReport.totalRecords}</strong></div>
                <div>Schema Version: <strong className="text-slate-900 dark:text-white">v{validationReport.schemaVersion}</strong></div>
                <div>Orphaned Records: <strong className={validationReport.orphanedRecordsCount > 0 ? 'text-amber-600' : 'text-slate-900 dark:text-white'}>{validationReport.orphanedRecordsCount}</strong></div>
                <div>Duplicate IDs: <strong className={validationReport.duplicateIdsCount > 0 ? 'text-rose-600' : 'text-slate-900 dark:text-white'}>{validationReport.duplicateIdsCount}</strong></div>
              </div>
            </div>

            {/* Error & Warning Lists */}
            {validationReport.errors.length > 0 && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
                <span className="text-xs font-black text-rose-700 uppercase">Errors (Blocking)</span>
                <ul className="text-xs text-rose-600 list-disc list-inside max-h-28 overflow-y-auto">
                  {validationReport.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            {validationReport.warnings.length > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
                <span className="text-xs font-black text-amber-700 uppercase">Warnings</span>
                <ul className="text-xs text-amber-600 list-disc list-inside max-h-28 overflow-y-auto">
                  {validationReport.warnings.slice(0, 5).map((warn, i) => (
                    <li key={i}>{warn}</li>
                  ))}
                  {validationReport.warnings.length > 5 && (
                    <li>...and {validationReport.warnings.length - 5} more warnings</li>
                  )}
                </ul>
              </div>
            )}

            {/* Import Policy */}
            <div className="space-y-2">
              <span className="text-xs font-extrabold uppercase text-slate-500">Restore Policy</span>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setImportPolicy('merge')}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    importPolicy === 'merge' ? 'border-indigo-600 bg-indigo-50/20' : 'border-slate-200'
                  }`}
                >
                  <div className="font-bold text-xs">Merge Records</div>
                  <div className="text-[10px] text-slate-500">Upsert matching IDs, keep non-overlapping data.</div>
                </button>

                <button
                  type="button"
                  onClick={() => setImportPolicy('overwrite')}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    importPolicy === 'overwrite' ? 'border-indigo-600 bg-indigo-50/20' : 'border-slate-200'
                  }`}
                >
                  <div className="font-bold text-xs text-rose-600">Overwrite All Data</div>
                  <div className="text-[10px] text-slate-500">Clear existing tables and restore JSON snapshot.</div>
                </button>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 border-t pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowImportModal(false);
                  setValidationReport(null);
                }}
              >
                Cancel
              </Button>

              <Button
                variant="primary"
                size="sm"
                disabled={!validationReport.valid}
                onClick={handleConfirmImport}
                id="confirm-json-restore-btn"
              >
                Confirm Restore
              </Button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default JsonBackupCard;
