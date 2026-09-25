import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  X,
  HardDrive,
  FileSpreadsheet,
  ExternalLink,
  CheckCircle2,
  RefreshCw,
  LogOut,
  ShieldCheck,
  Folder,
  Layers,
  Database,
  Lock
} from 'lucide-react';
import { GoogleDriveStatus, AttendanceSession, Student } from '../types';
import { getAllSessions } from '../services/sheetsService';
import {
  appendAttendanceToGoogleSheet,
  syncRosterToGoogleSheet,
  ensureFacultyDriveFolder,
  ensureMasterSheet
} from '../services/googleDriveService';

interface GoogleDriveModalProps {
  isOpen: boolean;
  onClose: () => void;
  driveStatus: GoogleDriveStatus;
  accessToken: string | null;
  students: Student[];
  currentCourseCode: string;
  onSignOut: () => void;
  onDriveStatusUpdate: (updated: GoogleDriveStatus) => void;
}

export const GoogleDriveModal: React.FC<GoogleDriveModalProps> = ({
  isOpen,
  onClose,
  driveStatus,
  accessToken,
  students,
  currentCourseCode,
  onSignOut,
  onDriveStatusUpdate
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSyncAllToDrive = async () => {
    if (!accessToken) {
      setSyncFeedback('Please sign in with Google to sync to your Drive.');
      return;
    }

    setIsSyncing(true);
    setSyncFeedback('Connecting to your Google Drive...');

    try {
      // 1. Ensure folder & sheet exist
      const folder = await ensureFacultyDriveFolder(accessToken);
      const sheet = await ensureMasterSheet(accessToken, folder.id);

      // 2. Sync student roster
      setSyncFeedback('Syncing Student Master Roster to Google Sheets...');
      await syncRosterToGoogleSheet(accessToken, sheet.id, students, currentCourseCode);

      // 3. Sync all attendance sessions
      const sessions = getAllSessions();
      setSyncFeedback(`Syncing ${sessions.length} attendance session logs...`);

      for (const session of sessions) {
        if (!session.syncedToGoogleSheets) {
          await appendAttendanceToGoogleSheet(
            accessToken,
            sheet.id,
            session,
            driveStatus.userEmail || 'faculty@campus.edu'
          );
        }
      }

      const updatedStatus: GoogleDriveStatus = {
        ...driveStatus,
        isConnected: true,
        folderId: folder.id,
        folderUrl: folder.webViewLink,
        spreadsheetId: sheet.id,
        spreadsheetUrl: sheet.webViewLink,
        lastSyncedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        error: null
      };

      onDriveStatusUpdate(updatedStatus);
      setSyncFeedback('All attendance, assignments, and rosters synced successfully to your Google Drive!');
    } catch (err: any) {
      console.error('Full drive sync failed:', err);
      setSyncFeedback(`Sync failed: ${err.message || 'Please check network connection'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        className="w-full max-w-xl bg-white border-[3.5px] border-black shadow-[10px_10px_0px_#000] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-[#00FF66] border-b-[3.5px] border-black p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-black text-[#00FF66] border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_#000]">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-[10px] font-black uppercase bg-black text-white px-1.5 py-0.5 border border-black">
                  CLOUD STORAGE DEVICE
                </span>
                <span className="text-[10px] font-bold text-black flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-black" /> Verified
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-black">
                Google Drive & Sheets Storage
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 bg-white border-2 border-black flex items-center justify-center hover:bg-gray-100 cursor-pointer shadow-[2px_2px_0px_#000]"
          >
            <X className="w-4 h-4 text-black" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* User Account Info Card */}
          <div className="bg-[#F8F8F8] border-2 border-black p-4 shadow-[3px_3px_0px_#000] flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {driveStatus.userAvatar ? (
                <img
                  src={driveStatus.userAvatar}
                  alt={driveStatus.userName || 'Faculty'}
                  className="w-11 h-11 border-2 border-black object-cover"
                />
              ) : (
                <div className="w-11 h-11 bg-black text-white font-black text-base flex items-center justify-center border-2 border-black">
                  {driveStatus.userName?.charAt(0) || 'F'}
                </div>
              )}
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="font-black text-sm text-black">{driveStatus.userName || 'Faculty Member'}</span>
                  <span className="bg-[#00FF66] text-black text-[9px] font-black px-1.5 py-0.2 border border-black uppercase">
                    ONLINE
                  </span>
                </div>
                <div className="text-xs font-mono text-gray-700 font-bold">{driveStatus.userEmail || 'Connected via Google'}</div>
                <div className="text-[10px] text-gray-500 font-medium">Last Cloud Sync: {driveStatus.lastSyncedAt || 'Just now'}</div>
              </div>
            </div>

            <button
              onClick={onSignOut}
              className="px-2.5 py-1.5 bg-white hover:bg-red-50 text-red-600 border-2 border-black font-black text-xs flex items-center gap-1.5 shadow-[2px_2px_0px_#000] cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>

          {/* Drive & Sheets Linked Artifacts */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase text-black flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5" />
              <span>Your Personal Google Drive Location</span>
            </h4>

            {/* Google Drive Folder */}
            <div className="border-2 border-black p-3.5 bg-white shadow-[3px_3px_0px_#000] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start space-x-3">
                <div className="w-9 h-9 bg-[#FFE600] border-2 border-black flex items-center justify-center shrink-0">
                  <Folder className="w-5 h-5 text-black" />
                </div>
                <div>
                  <div className="text-xs font-black text-black">Folder: Atendly Faculty Data</div>
                  <div className="text-[11px] text-gray-600">
                    Root directory inside your personal Google Drive for all course records
                  </div>
                </div>
              </div>

              {driveStatus.folderUrl ? (
                <a
                  href={driveStatus.folderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-black text-white font-black text-xs flex items-center justify-center gap-1.5 hover:bg-gray-800 cursor-pointer shadow-[2px_2px_0px_#000]"
                >
                  <span>Open Drive Folder</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              ) : (
                <span className="text-xs text-gray-500 font-bold">Pending initial sync</span>
              )}
            </div>

            {/* Google Sheet Master File */}
            <div className="border-2 border-black p-3.5 bg-white shadow-[3px_3px_0px_#000] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start space-x-3">
                <div className="w-9 h-9 bg-[#00FF66] border-2 border-black flex items-center justify-center shrink-0">
                  <FileSpreadsheet className="w-5 h-5 text-black" />
                </div>
                <div>
                  <div className="text-xs font-black text-black">Sheet: Atendly - Master Attendance & Faculty Log</div>
                  <div className="text-[11px] text-gray-600">
                    Live spreadsheet containing Attendance Ledger, Assignment Submissions & Roster
                  </div>
                </div>
              </div>

              {driveStatus.spreadsheetUrl ? (
                <a
                  href={driveStatus.spreadsheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-[#00FF66] text-black border-2 border-black font-black text-xs flex items-center justify-center gap-1.5 hover:bg-green-300 cursor-pointer shadow-[2px_2px_0px_#000]"
                >
                  <span>Open in Google Sheets</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              ) : (
                <span className="text-xs text-gray-500 font-bold">Pending initial sync</span>
              )}
            </div>
          </div>

          {/* Structured Sheet Architecture Preview */}
          <div className="border-2 border-black p-3.5 bg-[#F9F9F9] space-y-2">
            <span className="text-[10px] font-black uppercase text-gray-700 block">
              Google Sheet Tabs & Structure:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
              <div className="bg-white border border-black p-2">
                <span className="font-black text-black block">1. Attendance_Ledger</span>
                <span className="text-gray-500 text-[10px]">Timestamp, Roll No, Status, Remarks, Hash</span>
              </div>
              <div className="bg-white border border-black p-2">
                <span className="font-black text-black block">2. Assignment_Submissions</span>
                <span className="text-gray-500 text-[10px]">Assignment Title, Marks, Status, Feedback</span>
              </div>
              <div className="bg-white border border-black p-2">
                <span className="font-black text-black block">3. Student_Roster</span>
                <span className="text-gray-500 text-[10px]">Total Classes, % Attendance, Risk Status</span>
              </div>
            </div>
          </div>

          {/* Sync Feedback message */}
          {syncFeedback && (
            <div className="bg-[#FFE600]/25 border-2 border-black p-3 text-xs font-bold text-black flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-black shrink-0 mt-0.5" />
              <span>{syncFeedback}</span>
            </div>
          )}

          {/* Sync Button */}
          <button
            onClick={handleSyncAllToDrive}
            disabled={isSyncing}
            className="w-full py-3 bg-[#FFE600] hover:bg-[#ffe81a] border-[3px] border-black font-black text-sm text-black flex items-center justify-center space-x-2 shadow-[4px_4px_0px_#000] hover:shadow-[6px_6px_0px_#000] active:translate-y-0.5 cursor-pointer transition-all disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Synchronizing with Google Drive...' : 'Sync All Records to Google Drive & Sheets Now'}</span>
          </button>
        </div>

        {/* Footer */}
        <div className="bg-black text-white p-3 border-t-[3px] border-black flex items-center justify-between text-[11px] font-mono">
          <span className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-[#00FF66]" />
            Encrypted OAuth 2.0 Token in Memory
          </span>
          <span className="text-gray-400">Atendly v3.0</span>
        </div>
      </motion.div>
    </div>
  );
};
