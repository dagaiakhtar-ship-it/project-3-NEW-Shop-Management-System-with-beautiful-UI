import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Database, 
  Globe, 
  FileSpreadsheet, 
  HardDrive, 
  RefreshCw, 
  Search, 
  Trash2, 
  Play, 
  Wrench,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Filter,
  XCircle,
  Clock,
  ShieldCheck
} from 'lucide-react';
import { db, type AuditLog } from '../../database/db';
import showToast from '../../utils/toast';
import { runAutomatedTestSuite, type TestSuiteSummary } from '../../utils/testSuite';
import { dataIntegrityService, type DataIntegrityReport } from '../../services/dataIntegrity/DataIntegrityService';

export const SystemAuditPanel: React.FC = () => {
  // Stats & Health states
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [storageStats, setStorageStats] = useState({ used: '0 B', total: '0 B', percent: 0 });
  const [dbTablesCount, setDbTablesCount] = useState(0);
  const [sheetsSyncBound, setSheetsSyncBound] = useState(false);
  const [failedSyncCount, setFailedSyncCount] = useState(0);

  // Automated Testing states
  const [isTesting, setIsTesting] = useState(false);
  const [testSummary, setTestSummary] = useState<TestSuiteSummary | null>(null);
  const [showTestDetails, setShowTestDetails] = useState(false);

  // Integrity Report states
  const [integrityReport, setIntegrityReport] = useState<DataIntegrityReport | null>(null);
  const [showIssuesList, setShowIssuesList] = useState(false);

  // Audit Logs states
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModule, setSelectedModule] = useState('all');
  const [selectedAction, setSelectedAction] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Recovery trigger states
  const [isRetryingSync, setIsRetryingSync] = useState(false);
  const [isRepairing, setIsRepairing] = useState(false);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Gather system health diagnostics
  const runDiagnostics = async () => {
    try {
      // 1. Storage Estimate
      if (navigator.storage && navigator.storage.estimate) {
        const { usage, quota } = await navigator.storage.estimate();
        const usedMB = ((usage || 0) / (1024 * 1024)).toFixed(2);
        const quotaMB = ((quota || 0) / (1024 * 1024)).toFixed(0);
        const pct = quota ? Math.min(100, Math.round((usage || 0) / quota * 100)) : 0;
        setStorageStats({
          used: `${usedMB} MB`,
          total: `${quotaMB} MB`,
          percent: pct
        });
      }

      // 2. Database tables info
      const tables = db.tables;
      setDbTablesCount(tables.length);

      // 3. Google Sheets Link Bind Status
      const configSheet = await db.settings.get('google_sheets_config');
      if (configSheet && configSheet.value) {
        const config = typeof configSheet.value === 'string' ? JSON.parse(configSheet.value) : configSheet.value;
        setSheetsSyncBound(!!config.spreadsheetId);
      } else {
        setSheetsSyncBound(false);
      }

      // 4. Failed sync queue items
      const failedCount = await db.syncQueue.where('status').equals('Failed').count();
      setFailedSyncCount(failedCount);
    } catch (err) {
      console.error('Failed to run diagnostics:', err);
    }
  };

  // Load audit logs
  const loadAuditLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const allLogs = await db.auditLogs.toArray();
      // Sort logs descending by timestamp
      allLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setLogs(allLogs);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
      showToast.error('Failed to fetch audit trails');
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const runIntegrityScan = async () => {
    try {
      const report = await dataIntegrityService.scanDatabase();
      setIntegrityReport(report);
    } catch (err) {
      console.error('Error scanning integrity:', err);
    }
  };

  useEffect(() => {
    runDiagnostics();
    loadAuditLogs();
    runIntegrityScan();
  }, []);

  // Filter logs based on search and selected options
  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          log.username.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesModule = selectedModule === 'all' || log.module.toLowerCase() === selectedModule.toLowerCase();
    const matchesAction = selectedAction === 'all' || log.action.toLowerCase() === selectedAction.toLowerCase();
    
    return matchesSearch && matchesModule && matchesAction;
  });

  // Pagination bounds
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Recovery: Re-trigger failed sync queues
  const handleRetrySyncQueue = async () => {
    setIsRetryingSync(true);
    try {
      const failedItems = await db.syncQueue.where('status').equals('Failed').toArray();
      if (failedItems.length === 0) {
        showToast.info('No failed sync queue records detected');
        setIsRetryingSync(false);
        return;
      }

      // Reset their status to 'Pending' so background backup runners process them
      for (const item of failedItems) {
        await db.syncQueue.update(item.id!, {
          status: 'Pending',
          updatedAt: new Date()
        });
      }

      await db.auditLogs.add({
        username: 'System',
        userRole: 'Administrator',
        action: 'Repair',
        module: 'Sync',
        details: `Reset ${failedItems.length} failed synchronization queue entries to Pending.`,
        timestamp: new Date()
      });

      showToast.success(`Successfully re-queued ${failedItems.length} failed sync operations`);
      runDiagnostics();
      loadAuditLogs();
    } catch (err) {
      console.error('Failed to retry sync queue:', err);
      showToast.error('Sync recovery operation failed');
    } finally {
      setIsRetryingSync(false);
    }
  };

  // Recovery: Self-Repair integrity check
  const handleSelfRepair = async () => {
    setIsRepairing(true);
    showToast.info('Executing database validation & auto-repair...');
    try {
      const report = await dataIntegrityService.repairDatabase();
      setIntegrityReport(report);
      
      await db.auditLogs.add({
        username: 'System',
        userRole: 'Administrator',
        action: 'Repair',
        module: 'Database',
        details: `Ran complete database audit & auto-repair. Checked ${report.totalRecordsChecked} records, resolved ${report.inconsistenciesRepaired} inconsistencies. Health Score is ${report.healthScore}%.`,
        timestamp: new Date()
      });

      if (report.inconsistenciesRepaired > 0) {
        showToast.success(`Integrity repair complete! Safely resolved ${report.inconsistenciesRepaired} database inconsistencies.`);
      } else {
        showToast.success('Database is already perfectly consistent! No issues found to repair.');
      }
      runDiagnostics();
      loadAuditLogs();
    } catch (err: any) {
      console.error('Failed to repair database:', err);
      showToast.error(`System repair failed: ${err.message || err}`);
    } finally {
      setIsRepairing(false);
    }
  };

  // Action: Clear old audit logs
  const handleClearOldLogs = async () => {
    if (!window.confirm('Are you sure you want to prune audit log trails older than 30 days? This action is irreversible.')) {
      return;
    }

    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const oldLogs = await db.auditLogs.where('timestamp').below(thirtyDaysAgo).toArray();
      if (oldLogs.length === 0) {
        showToast.info('No audit log entries older than 30 days found');
        return;
      }

      const ids = oldLogs.map(l => l.id!);
      await db.auditLogs.bulkDelete(ids);

      await db.auditLogs.add({
        username: 'System',
        userRole: 'Administrator',
        action: 'Reset',
        module: 'Settings',
        details: `Pruned ${oldLogs.length} audit logs older than 30 days.`,
        timestamp: new Date()
      });

      showToast.success(`Successfully purged ${oldLogs.length} historical log rows`);
      loadAuditLogs();
    } catch (err) {
      console.error('Failed to clear logs:', err);
      showToast.error('Pruning operation failed');
    }
  };

  // Action: Run Automated Test Runner
  const handleRunQAIntegrationTests = async () => {
    setIsTesting(true);
    showToast.info('Executing automated verification and calculation tests...');
    try {
      const summary = await runAutomatedTestSuite();
      setTestSummary(summary);
      if (summary.failed === 0) {
        showToast.success(`All ${summary.total} tests passed! System calculations verified.`);
      } else {
        showToast.error(`${summary.failed} tests failed! Check reports.`);
      }
      // Add audit log
      await db.auditLogs.add({
        username: 'System',
        userRole: 'Administrator',
        action: 'Repair',
        module: 'Settings',
        details: `Ran Automated QA Compliance Tests: ${summary.passed}/${summary.total} passed in ${summary.durationMs}ms`,
        timestamp: new Date()
      });
      loadAuditLogs();
    } catch (err) {
      console.error('Test execution failed:', err);
      showToast.error('Test suite failed to run');
    } finally {
      setIsTesting(false);
    }
  };

  // Extract distinct modules and actions from logs for filter lists
  const modules = Array.from(new Set(logs.map(l => l.module))).filter(Boolean) as string[];
  const actions = Array.from(new Set(logs.map(l => l.action))).filter(Boolean) as string[];

  return (
    <div className="space-y-6 text-left select-none">
      
      {/* 1. Health Diagnostics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Network Connectivity */}
        <div className="bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-850 shadow-xs flex items-center gap-4">
          <div className={`p-3 rounded-xl ${isOnline ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500' : 'bg-rose-50 dark:bg-rose-950/20 text-rose-500'}`}>
            <Globe className="h-5 w-5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">Internet Link</span>
            <span className="text-sm font-black text-slate-800 dark:text-slate-200 mt-0.5 truncate flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full animate-pulse ${isOnline ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              {isOnline ? 'Online Status' : 'Offline Mode'}
            </span>
            <span className="text-[9px] font-semibold text-slate-450 mt-0.5">
              {isOnline ? 'Live backups active' : 'Queueing locally'}
            </span>
          </div>
        </div>

        {/* Database Space */}
        <div className="bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-850 shadow-xs flex items-center gap-4">
          <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/20 text-indigo-500">
            <Database className="h-5 w-5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">IndexedDB Health</span>
            <span className="text-sm font-black text-slate-800 dark:text-slate-200 mt-0.5 truncate">
              {dbTablesCount} Core Tables
            </span>
            <span className="text-[9px] font-semibold text-slate-450 mt-0.5">
              IndexedDB local storage OK
            </span>
          </div>
        </div>

        {/* Backup Sheets Bind */}
        <div className="bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-850 shadow-xs flex items-center gap-4">
          <div className={`p-3 rounded-xl ${sheetsSyncBound ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500' : 'bg-amber-50 dark:bg-amber-950/20 text-amber-500'}`}>
            <FileSpreadsheet className="h-5 w-5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">Sheets Sync</span>
            <span className="text-sm font-black text-slate-800 dark:text-slate-200 mt-0.5 truncate">
              {sheetsSyncBound ? 'Workbook Linked' : 'Not Configured'}
            </span>
            <span className="text-[9px] font-semibold text-slate-450 mt-0.5">
              {sheetsSyncBound ? 'Sheets backup active' : 'Local copy only'}
            </span>
          </div>
        </div>

        {/* Sandboxed Storage Space */}
        <div className="bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-850 shadow-xs flex items-center gap-4">
          <div className="p-3 rounded-xl bg-fuchsia-50 dark:bg-fuchsia-950/20 text-fuchsia-500">
            <HardDrive className="h-5 w-5" />
          </div>
          <div className="flex flex-col min-w-0 w-full">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">Storage Used</span>
            <span className="text-sm font-black text-slate-800 dark:text-slate-200 mt-0.5 truncate">
              {storageStats.used}
            </span>
            <div className="w-full bg-slate-100 dark:bg-slate-850 h-1 rounded-full mt-1.5 overflow-hidden">
              <div 
                className="bg-fuchsia-500 h-1 rounded-full" 
                style={{ width: `${storageStats.percent}%` }}
              />
            </div>
            <span className="text-[8px] font-extrabold text-slate-400 mt-1 uppercase">
              {storageStats.percent}% of browser quota
            </span>
          </div>
        </div>

      </div>

      {/* 2. System Error Recovery Toolbar */}
      <div className="p-5 rounded-2xl border border-slate-100 dark:border-slate-850 bg-slate-50/20 dark:bg-slate-900/10 text-left">
        <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-350 mb-1 flex items-center gap-1.5">
          <Wrench className="h-4 w-4 text-indigo-500" />
          Operator Diagnostics & Self-Repair Toolbar
        </h4>
        <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 leading-normal max-w-2xl mb-4">
          Run local environment audits, trigger immediate queues retry processing, defragment indexes, or safely clear historical logs.
        </p>

        <div className="flex flex-wrap gap-3">
          
          {/* Retry Failed Backup Syncs */}
          <button
            type="button"
            onClick={handleRetrySyncQueue}
            disabled={isRetryingSync}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-indigo-100 dark:border-indigo-900/40 bg-white hover:bg-slate-50 dark:bg-slate-950 dark:hover:bg-slate-900 text-indigo-600 dark:text-indigo-400 font-bold text-xs select-none transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`h-4.5 w-4.5 ${isRetryingSync ? 'animate-spin' : ''}`} />
            <span>Process Sync Queue ({failedSyncCount} failed)</span>
          </button>

          {/* Self-Repair settings integrity */}
          <button
            type="button"
            onClick={handleSelfRepair}
            disabled={isRepairing}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white hover:bg-slate-50 dark:bg-slate-950 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-350 font-bold text-xs select-none transition-colors cursor-pointer disabled:opacity-50"
          >
            <Wrench className="h-4.5 w-4.5" />
            <span>Verify Integrity & Repaired Fields</span>
          </button>

          {/* Purge Audit History older than 30 days */}
          <button
            type="button"
            onClick={handleClearOldLogs}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-100 dark:border-red-950/40 bg-red-50/30 hover:bg-red-50 dark:bg-red-950/10 text-red-600 dark:text-red-400 font-bold text-xs select-none transition-colors cursor-pointer"
          >
            <Trash2 className="h-4.5 w-4.5" />
            <span>Prune Logs Older than 30 days</span>
          </button>

        </div>
      </div>

      {/* 2a. Data Integrity Audit Report Card */}
      {integrityReport && (
        <div className="p-5 rounded-2xl border border-slate-100 dark:border-slate-850 bg-white dark:bg-slate-950 text-left space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-1.5">
                <ShieldCheck className="h-4.5 w-4.5 text-indigo-500 animate-pulse" />
                Data Integrity & Production Readiness Audit Report
              </h4>
              <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                Last checked: {integrityReport.timestamp.toLocaleTimeString()}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wide text-slate-450">Production Status:</span>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide ${
                integrityReport.isProductionReady 
                  ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400' 
                  : 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400'
              }`}>
                {integrityReport.isProductionReady ? 'Ready for Production (PASSED)' : 'Requires Attention (WARNING)'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50/50 dark:bg-slate-900/10 border border-slate-100 dark:border-slate-850">
            <div className="flex flex-col">
              <span className="text-[9px] font-extrabold uppercase text-slate-400">System Health Score</span>
              <span className={`text-xl font-black mt-1 ${
                integrityReport.healthScore >= 95 ? 'text-emerald-600' : (integrityReport.healthScore >= 80 ? 'text-amber-500' : 'text-red-500')
              }`}>
                {integrityReport.healthScore}%
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-extrabold uppercase text-slate-400">Total Scanned Records</span>
              <span className="text-xl font-black text-slate-700 dark:text-slate-300 mt-1">
                {integrityReport.totalRecordsChecked}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-extrabold uppercase text-slate-400">Discrepancies Found</span>
              <span className={`text-xl font-black mt-1 ${
                integrityReport.inconsistenciesFound > 0 ? 'text-amber-600' : 'text-slate-500'
              }`}>
                {integrityReport.inconsistenciesFound}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-extrabold uppercase text-slate-400">Auto-Repaired Since Load</span>
              <span className={`text-xl font-black mt-1 ${
                integrityReport.inconsistenciesRepaired > 0 ? 'text-emerald-600' : 'text-slate-500'
              }`}>
                {integrityReport.inconsistenciesRepaired}
              </span>
            </div>
          </div>

          <div>
            <button
              type="button"
              onClick={() => setShowIssuesList(prev => !prev)}
              className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide hover:underline cursor-pointer flex items-center gap-1"
            >
              {showIssuesList ? 'Hide Integrity Logs & Issues [-]' : `Show Integrity Logs & Issues (${integrityReport.issues.length}) [+]`}
            </button>

            {showIssuesList && (
              <div className="mt-3 overflow-x-auto border border-slate-150/40 dark:border-slate-800/80 rounded-lg bg-white dark:bg-slate-950">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900 text-[9px] uppercase font-black text-slate-450 border-b border-slate-100 dark:border-slate-850">
                      <th className="p-2.5">Category</th>
                      <th className="p-2.5">Severity</th>
                      <th className="p-2.5">Description</th>
                      <th className="p-2.5">Status</th>
                      <th className="p-2.5">Auto-Repair Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150/40 dark:divide-slate-850">
                    {integrityReport.issues.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-slate-400 font-semibold">
                          No active discrepancies found. All modules conform fully to ACID integrity rules!
                        </td>
                      </tr>
                    ) : (
                      integrityReport.issues.map((issue, idx) => {
                        let sevColor = 'text-slate-500';
                        if (issue.severity === 'Critical') sevColor = 'text-red-600 font-black';
                        if (issue.severity === 'High') sevColor = 'text-rose-500 font-bold';
                        if (issue.severity === 'Medium') sevColor = 'text-amber-500 font-bold';

                        return (
                          <tr key={idx} className="hover:bg-slate-50/40 dark:hover:bg-slate-900/10">
                            <td className="p-2.5 font-bold text-slate-700 dark:text-slate-300">{issue.category}</td>
                            <td className={`p-2.5 text-[10px] uppercase tracking-wide ${sevColor}`}>{issue.severity}</td>
                            <td className="p-2.5 text-slate-500 dark:text-slate-400 max-w-xs md:max-w-md truncate" title={issue.description}>
                              {issue.description}
                            </td>
                            <td className="p-2.5">
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wide ${
                                issue.status === 'Repaired' 
                                  ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400' 
                                  : 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400'
                              }`}>
                                {issue.status}
                              </span>
                            </td>
                            <td className="p-2.5 font-mono text-[10px] text-slate-450">
                              {issue.repairedValue || 'N/A'}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2b. Automated QA & Compliance Testing Suite */}
      <div className="p-5 rounded-2xl border border-slate-100 dark:border-slate-850 bg-white dark:bg-slate-950 text-left space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-col">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-1.5">
              <Activity className="h-4.5 w-4.5 text-indigo-500" />
              Automated QA Test Suite & Diagnostic Runner
            </h4>
            <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
              Execute comprehensive local integration, calculation, and database transaction test cases.
            </span>
          </div>

          <button
            type="button"
            onClick={handleRunQAIntegrationTests}
            disabled={isTesting}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs select-none transition-colors cursor-pointer disabled:opacity-50 shadow-sm"
          >
            <RefreshCw className={`h-4 w-4 ${isTesting ? 'animate-spin' : ''}`} />
            <span>{isTesting ? 'Running Test Suite...' : 'Run QA Integration Test Suite'}</span>
          </button>
        </div>

        {testSummary && (
          <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-900/20 space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="flex flex-col">
                <span className="text-[9px] font-extrabold uppercase text-slate-400">Total Run</span>
                <span className="text-sm font-black text-slate-700 dark:text-slate-300">{testSummary.total} Tests</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-extrabold uppercase text-emerald-500">Passed</span>
                <span className="text-sm font-black text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" /> {testSummary.passed}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-extrabold uppercase text-rose-500">Failed</span>
                <span className="text-sm font-black text-rose-600 flex items-center gap-1">
                  {testSummary.failed > 0 ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                  {testSummary.failed}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-extrabold uppercase text-indigo-500">Duration</span>
                <span className="text-sm font-black text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-slate-400" /> {testSummary.durationMs}ms
                </span>
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-850 pt-3">
              <button
                type="button"
                onClick={() => setShowTestDetails(prev => !prev)}
                className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide hover:underline cursor-pointer"
              >
                {showTestDetails ? 'Hide Detailed Test Logs [-]' : 'Show Detailed Test Logs [+]'}
              </button>

              {showTestDetails && (
                <div className="mt-3 max-h-60 overflow-y-auto border border-slate-150/40 dark:border-slate-800/80 rounded-lg divide-y divide-slate-100 dark:divide-slate-850 bg-white dark:bg-slate-950">
                  {testSummary.results.map((res, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        {res.status === 'Passed' ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                        ) : (
                          <XCircle className="h-4 w-4 text-rose-500 shrink-0" />
                        )}
                        <div className="flex flex-col min-w-0">
                          <span className="font-extrabold text-slate-750 dark:text-slate-350 truncate">{res.name}</span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">{res.category}</span>
                        </div>
                      </div>
                      <span className="font-mono text-[10px] text-slate-400 shrink-0 ml-4">
                        {res.durationMs}ms
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 3. Audit Logs Filters */}
      <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-850 p-5 space-y-4">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col text-left">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-1.5">
              <Activity className="h-4.5 w-4.5 text-indigo-500 animate-pulse" />
              Cashier & Database Audit Trails
            </h4>
            <span className="text-[10px] font-semibold text-slate-400">
              Showing {filteredLogs.length} recorded operations
            </span>
          </div>

          {/* Search bar inside logs */}
          <div className="relative w-full md:w-72 shrink-0">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
              <Search className="h-3.5 w-3.5" />
            </span>
            <input
              type="text"
              placeholder="Search by operator or detail..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl text-xs font-semibold text-slate-850 dark:text-slate-200 focus:outline-hidden focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap gap-3 p-3 rounded-xl bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100/50 dark:border-slate-850/50">
          
          <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase text-slate-450">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <span>Table filters:</span>
          </div>

          {/* Module filter */}
          <div className="flex items-center gap-1">
            <span className="text-[9px] font-bold text-slate-400">Module:</span>
            <select
              value={selectedModule}
              onChange={(e) => {
                setSelectedModule(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2 py-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md text-[9px] font-extrabold uppercase focus:outline-hidden"
            >
              <option value="all">ALL MODULES</option>
              {modules.map(mod => (
                <option key={mod} value={mod}>{mod.toUpperCase()}</option>
              ))}
            </select>
          </div>

          {/* Action filter */}
          <div className="flex items-center gap-1">
            <span className="text-[9px] font-bold text-slate-400">Action:</span>
            <select
              value={selectedAction}
              onChange={(e) => {
                setSelectedAction(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2 py-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md text-[9px] font-extrabold uppercase focus:outline-hidden"
            >
              <option value="all">ALL ACTIONS</option>
              {actions.map(act => (
                <option key={act} value={act}>{act.toUpperCase()}</option>
              ))}
            </select>
          </div>

        </div>

        {/* Logs Table */}
        <div className="overflow-x-auto border border-slate-100 dark:border-slate-850 rounded-xl">
          <table className="w-full text-xs font-semibold">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900 text-[10px] uppercase font-black tracking-wider text-slate-450 border-b border-slate-150/40 dark:border-slate-850">
                <th className="py-3 px-4 text-left">Timestamp</th>
                <th className="py-3 px-4 text-left">Operator</th>
                <th className="py-3 px-4 text-left">Action</th>
                <th className="py-3 px-4 text-left">Module</th>
                <th className="py-3 px-4 text-left">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
              {isLoadingLogs ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto text-indigo-500 mb-1" />
                    <span>Streaming log database entries...</span>
                  </td>
                </tr>
              ) : paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    <AlertTriangle className="h-6 w-6 mx-auto text-amber-500 mb-1" />
                    <span>No log records match search criteria</span>
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log) => {
                  let badgeColor = 'bg-slate-50 text-slate-600 dark:bg-slate-900 dark:text-slate-400';
                  if (log.action === 'Create') badgeColor = 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400';
                  if (log.action === 'Update') badgeColor = 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400';
                  if (log.action === 'Delete') badgeColor = 'bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400';
                  if (log.action === 'Login') badgeColor = 'bg-teal-50 text-teal-600 dark:bg-teal-950/20 dark:text-teal-400';
                  if (log.action === 'Repair') badgeColor = 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400';

                  return (
                    <tr 
                      key={log.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors"
                    >
                      {/* Timestamp */}
                      <td className="py-3.5 px-4 font-mono text-[10px] text-slate-450 shrink-0">
                        {new Date(log.timestamp).toLocaleString('en-US')}
                      </td>

                      {/* Operator Username & Role */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="font-extrabold text-slate-800 dark:text-slate-200">{log.username}</span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide mt-0.5">{log.userRole}</span>
                        </div>
                      </td>

                      {/* Action Type */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${badgeColor}`}>
                          {log.action}
                        </span>
                      </td>

                      {/* System Module */}
                      <td className="py-3.5 px-4 font-extrabold text-slate-700 dark:text-slate-350">
                        {log.module}
                      </td>

                      {/* Details description */}
                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 max-w-xs md:max-w-md truncate" title={log.details}>
                        {log.details}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination */}
        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-850 pt-4 select-none">
          <span className="text-[10px] font-extrabold uppercase tracking-wide text-slate-450">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};

export default SystemAuditPanel;
