import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  CloudCheck,
  CloudOff,
  RefreshCw,
  Download,
  Settings,
  Copy,
  Check,
  X,
  Wifi,
  WifiOff,
  Database
} from 'lucide-react';
import { GoogleSheetsConfig, AttendanceSession } from '../types';
import {
  getSheetsConfig,
  saveSheetsConfig,
  getOfflineQueue,
  getAllSessions,
  syncAllQueuedSessions,
  isAppOnline,
  isSimulatedOffline,
  setSimulatedOffline,
  downloadAttendanceCSV
} from '../services/sheetsService';

interface GoogleSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GoogleSheetsModal({ isOpen, onClose }: GoogleSheetsModalProps) {
  const [config, setConfig] = useState<GoogleSheetsConfig>(getSheetsConfig());
  const [queue, setQueue] = useState<AttendanceSession[]>([]);
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [simOffline, setSimOffline] = useState<boolean>(isSimulatedOffline());
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'queue' | 'preview' | 'config'>('queue');

  useEffect(() => {
    if (isOpen) {
      setConfig(getSheetsConfig());
      setQueue(getOfflineQueue());
      setSessions(getAllSessions());
      setSimOffline(isSimulatedOffline());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleSimOffline = (enabled: boolean) => {
    setSimulatedOffline(enabled);
    setSimOffline(enabled);
    setSyncResult(enabled ? '⚠️ CLASSROOM OFFLINE MODE: Swiping in class will now store attendance locally.' : '✅ ONLINE CONNECTION RESTORED: Direct Google Sheets sync ready.');
  };

  const handleSyncQueue = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    const result = await syncAllQueuedSessions();
    setSyncResult(result.message);
    setQueue(getOfflineQueue());
    setSessions(getAllSessions());
    setIsSyncing(false);
  };

  const handleSaveConfig = () => {
    saveSheetsConfig(config);
    setSyncResult('Google Sheets configuration saved successfully.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs font-mono">
      <div 
        id="sheets-modal-container"
        className="bg-white border-[3.5px] border-black shadow-[8px_8px_0px_#000] w-full max-w-3xl overflow-hidden text-black flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="bg-[#FFE600] px-5 py-3.5 border-b-[3px] border-black flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 bg-black text-[#FFE600] border-2 border-black flex items-center justify-center font-black">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight text-black">
                GOOGLE SHEETS OFFLINE-SYNC HUB
              </h3>
              <p className="text-[10px] font-bold text-black uppercase">
                AUTOMATED ATTENDANCE RECORDING • WORKS WITH OR WITHOUT INTERNET
              </p>
            </div>
          </div>
          <button
            id="close-sheets-modal"
            onClick={onClose}
            className="p-1.5 bg-black text-white hover:bg-gray-800 border-2 border-black cursor-pointer"
          >
            <X className="w-4 h-4 stroke-[3]" />
          </button>
        </div>

        {/* Offline Classroom Simulation Toggle Bar */}
        <div className="p-3 bg-[#00E5FF] border-b-2 border-black flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2 text-xs font-black">
            {simOffline ? (
              <WifiOff className="w-4 h-4 text-black animate-pulse" />
            ) : (
              <Wifi className="w-4 h-4 text-black" />
            )}
            <span>
              STATUS: {simOffline ? 'OFFLINE CLASSROOM (NO INTERNET)' : 'ONLINE (DIRECT SYNC READY)'}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleToggleSimOffline(!simOffline)}
              className={`px-2.5 py-1 text-xs font-black border-2 border-black shadow-[2px_2px_0px_#000] transition-all cursor-pointer ${
                simOffline
                  ? 'bg-[#00FF66] text-black'
                  : 'bg-[#FF1E56] text-white'
              }`}
            >
              {simOffline ? 'SWITCH TO ONLINE' : 'SIMULATE NO INTERNET IN CLASS'}
            </button>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="flex border-b-2 border-black bg-white">
          <button
            onClick={() => setActiveTab('queue')}
            className={`flex-1 py-2 text-center text-xs font-black border-r-2 border-black ${
              activeTab === 'queue' ? 'bg-[#FFE600] text-black' : 'hover:bg-gray-100'
            }`}
          >
            OFFLINE QUEUE ({queue.length})
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`flex-1 py-2 text-center text-xs font-black border-r-2 border-black ${
              activeTab === 'preview' ? 'bg-[#00FF66] text-black' : 'hover:bg-gray-100'
            }`}
          >
            LIVE SHEET PREVIEW
          </button>
          <button
            onClick={() => setActiveTab('config')}
            className={`flex-1 py-2 text-center text-xs font-black ${
              activeTab === 'config' ? 'bg-[#00E5FF] text-black' : 'hover:bg-gray-100'
            }`}
          >
            SHEET CONFIG
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {syncResult && (
            <div className="p-2.5 bg-[#FFE600] border-2 border-black font-bold text-xs text-black shadow-[2px_2px_0px_#000]">
              {syncResult}
            </div>
          )}

          {/* 1. Offline Queue Tab */}
          {activeTab === 'queue' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black uppercase text-black">
                    STORED CLASSROOM SESSIONS:
                  </h4>
                  <p className="text-[11px] text-gray-700">
                    If internet is disconnected in class, every swipe is safely stored here.
                  </p>
                </div>

                <button
                  onClick={handleSyncQueue}
                  disabled={isSyncing || queue.length === 0}
                  className="px-3 py-1.5 bg-[#00FF66] border-2 border-black text-black text-xs font-black shadow-[2px_2px_0px_#000] hover:shadow-[4px_4px_0px_#000] disabled:opacity-30 cursor-pointer flex items-center space-x-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'SYNCING...' : 'SYNC ALL TO SHEETS'}</span>
                </button>
              </div>

              {queue.length === 0 ? (
                <div className="p-6 text-center border-2 border-dashed border-black bg-[#fafafa]">
                  <CloudCheck className="w-8 h-8 mx-auto text-black mb-1" />
                  <div className="text-xs font-black text-black uppercase">ALL SESSIONS SYNCED!</div>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    No pending attendance records in offline queue.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {queue.map((sess) => (
                    <div
                      key={sess.id}
                      className="p-3 border-2 border-black bg-white shadow-[2px_2px_0px_#000] flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs font-black text-black">
                          {sess.courseName} ({sess.section})
                        </div>
                        <div className="text-[10px] text-gray-600">
                          {sess.date} {sess.time} • {sess.totalStudents} Students ({sess.presentCount} P, {sess.absentCount} A, {sess.eventCount} EV)
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => downloadAttendanceCSV(sess)}
                          className="px-2 py-1 bg-[#FFE600] border border-black text-[11px] font-black shadow-[1px_1px_0px_#000]"
                        >
                          CSV
                        </button>
                        <span className="px-2 py-0.5 bg-[#FF1E56] text-white text-[10px] font-black border border-black">
                          QUEUED
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 2. Live Sheet Preview Tab */}
          {activeTab === 'preview' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-black">
                  SPREADSHEET ROWS (GOOGLE SHEETS FORMAT):
                </span>
                <span className="text-[10px] bg-[#00FF66] border border-black px-2 py-0.5 font-bold">
                  SHEET: {config.sheetName}
                </span>
              </div>

              <div className="border-2 border-black overflow-x-auto shadow-[3px_3px_0px_#000]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-black text-white uppercase text-[10px]">
                    <tr>
                      <th className="p-2 border-r border-gray-700">ROLL NO</th>
                      <th className="p-2 border-r border-gray-700">STUDENT NAME</th>
                      <th className="p-2 border-r border-gray-700">STATUS</th>
                      <th className="p-2 border-r border-gray-700">DATE & TIME</th>
                      <th className="p-2">COURSE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-black bg-white">
                    {sessions[0]?.records.slice(0, 10).map((r, i) => (
                      <tr key={i} className="hover:bg-yellow-50">
                        <td className="p-2 font-black border-r-2 border-black">{r.rollNo}</td>
                        <td className="p-2 border-r-2 border-black font-bold">{r.studentName}</td>
                        <td className="p-2 border-r-2 border-black">
                          <span className={`px-1.5 py-0.5 text-[10px] font-black border border-black ${
                            r.status === 'present'
                              ? 'bg-[#00FF66] text-black'
                              : r.status === 'absent'
                              ? 'bg-[#FF1E56] text-white'
                              : 'bg-[#FFE600] text-black'
                          }`}>
                            {r.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-2 border-r-2 border-black text-[11px] text-gray-700">
                          {sessions[0].date} {r.timestamp}
                        </td>
                        <td className="p-2 text-[11px] font-bold">{sessions[0].courseId}</td>
                      </tr>
                    )) || (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-gray-500 font-bold">
                          Take attendance via Tinder Swipe first to preview rows here!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3. Sheet Configuration Tab */}
          {activeTab === 'config' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-black uppercase text-black mb-1">
                  TARGET GOOGLE SHEET ID:
                </label>
                <input
                  type="text"
                  value={config.sheetId}
                  onChange={(e) => setConfig({ ...config, sheetId: e.target.value })}
                  className="w-full p-2.5 bg-white border-2 border-black text-xs font-mono focus:outline-none shadow-[2px_2px_0px_#000]"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-black mb-1">
                  SHEET / TAB NAME:
                </label>
                <input
                  type="text"
                  value={config.sheetName}
                  onChange={(e) => setConfig({ ...config, sheetName: e.target.value })}
                  className="w-full p-2.5 bg-white border-2 border-black text-xs font-mono focus:outline-none shadow-[2px_2px_0px_#000]"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-black mb-1">
                  APPS SCRIPT WEBHOOK URL (FOR AUTOMATED SHEET APPEND):
                </label>
                <input
                  type="text"
                  placeholder="https://script.google.com/macros/s/.../exec"
                  value={config.webhookUrl}
                  onChange={(e) => setConfig({ ...config, webhookUrl: e.target.value })}
                  className="w-full p-2.5 bg-white border-2 border-black text-xs font-mono focus:outline-none shadow-[2px_2px_0px_#000]"
                />
              </div>

              <button
                onClick={handleSaveConfig}
                className="px-4 py-2 bg-[#FFE600] border-2 border-black text-black font-black text-xs shadow-[2px_2px_0px_#000] hover:shadow-[4px_4px_0px_#000] cursor-pointer"
              >
                SAVE CONFIGURATION
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 px-5 bg-[#fafafa] border-t-2 border-black flex items-center justify-between">
          <span className="text-[11px] font-bold text-gray-600">
            Automated Google Sheets Logging
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 border-2 border-black bg-black text-white text-xs font-black hover:bg-gray-800 cursor-pointer"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}
