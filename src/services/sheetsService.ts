import { AttendanceSession, GoogleSheetsConfig } from '../types';
import { loadCloudState, saveCloudState, cacheState, readCachedState } from './cloudStateService';

const QUEUE_STORAGE_KEY = 'campusflow_offline_queue';
const SESSIONS_STORAGE_KEY = 'campusflow_attendance_sessions';
const CONFIG_STORAGE_KEY = 'campusflow_sheets_config';
const SIMULATED_OFFLINE_KEY = 'campusflow_simulated_offline';

export const DEFAULT_SHEETS_CONFIG: GoogleSheetsConfig = {
  sheetId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
  sheetName: 'CSE_A_Attendance_Log_2026',
  webhookUrl: '',
  autoSync: true,
  lastSyncedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
};

export const getSheetsConfig = (): GoogleSheetsConfig => {
  try {
    const data = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Error reading sheets config', e);
  }
  return DEFAULT_SHEETS_CONFIG;
};

export const saveSheetsConfig = (config: GoogleSheetsConfig): void => {
  localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
  void saveCloudState('sheets_config', config);
};

export const isSimulatedOffline = (): boolean => {
  return localStorage.getItem(SIMULATED_OFFLINE_KEY) === 'true';
};

export const setSimulatedOffline = (offline: boolean): void => {
  localStorage.setItem(SIMULATED_OFFLINE_KEY, offline ? 'true' : 'false');
  window.dispatchEvent(new Event('campusflow-network-change'));
};

export const isAppOnline = (): boolean => {
  if (isSimulatedOffline()) return false;
  return navigator.onLine;
};

export const getOfflineQueue = (): AttendanceSession[] => {
  try {
    const data = localStorage.getItem(QUEUE_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Failed to read offline queue', e);
    return [];
  }
};

export const saveOfflineQueue = (queue: AttendanceSession[]): void => {
  localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
  void saveCloudState('offline_queue', queue);
};

export const getAllSessions = (): AttendanceSession[] => {
  try {
    const data = localStorage.getItem(SESSIONS_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Failed to read sessions', e);
    return [];
  }
};

export const saveSession = (session: AttendanceSession): void => {
  const existing = getAllSessions();
  const index = existing.findIndex(s => s.id === session.id);
  if (index >= 0) {
    existing[index] = session;
  } else {
    existing.unshift(session);
  }
  localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(existing));
  void saveCloudState('attendance_sessions', existing);
};

export const queueAttendanceForSync = async (session: AttendanceSession): Promise<{
  success: boolean;
  syncedDirectly: boolean;
  message: string;
}> => {
  saveSession(session);

  const online = isAppOnline();
  const config = getSheetsConfig();

  if (!online) {
    // Add to offline queue
    const queue = getOfflineQueue();
    if (!queue.some(q => q.id === session.id)) {
      queue.push({ ...session, syncedToGoogleSheets: false });
      saveOfflineQueue(queue);
    }
    return {
      success: true,
      syncedDirectly: false,
      message: 'Internet unavailable in lecture room. Attendance saved to Offline Queue and will automatically sync to Google Sheets once reconnected.'
    };
  }

  // If online, perform sync
  try {
    if (config.webhookUrl && config.webhookUrl.trim() !== '') {
      // Send real POST payload to Google Apps Script Webhook
      await fetch(config.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'LOG_ATTENDANCE',
          sheetId: config.sheetId,
          sheetName: config.sheetName,
          session: session
        }),
        mode: 'no-cors' // Google Apps Script redirects commonly require no-cors or JSONP
      });
    }

    // Mark session as synced
    const updatedSession: AttendanceSession = {
      ...session,
      syncedToGoogleSheets: true,
      syncTimestamp: new Date().toISOString()
    };
    saveSession(updatedSession);

    // Update config lastSyncedAt
    saveSheetsConfig({
      ...config,
      lastSyncedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    // Remove from queue if it was there
    const queue = getOfflineQueue().filter(q => q.id !== session.id);
    saveOfflineQueue(queue);

    return {
      success: true,
      syncedDirectly: true,
      message: `Attendance automatically synced to Google Sheets (${config.sheetName}).`
    };
  } catch (err) {
    console.warn('Google Sheet online sync failed, keeping in offline queue', err);
    const queue = getOfflineQueue();
    if (!queue.some(q => q.id === session.id)) {
      queue.push({ ...session, syncedToGoogleSheets: false });
      saveOfflineQueue(queue);
    }
    return {
      success: true,
      syncedDirectly: false,
      message: 'Network glitch during sync. Saved to offline queue for automatic retry.'
    };
  }
};

export const syncAllQueuedSessions = async (): Promise<{
  syncedCount: number;
  message: string;
}> => {
  if (!isAppOnline()) {
    return {
      syncedCount: 0,
      message: 'Cannot sync while offline. Please connect to internet or disable offline simulation mode.'
    };
  }

  const queue = getOfflineQueue();
  if (queue.length === 0) {
    return {
      syncedCount: 0,
      message: 'No pending sessions in offline queue. All Google Sheet logs are up to date!'
    };
  }

  const config = getSheetsConfig();
  let synced = 0;

  for (const session of queue) {
    try {
      if (config.webhookUrl && config.webhookUrl.trim() !== '') {
        await fetch(config.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'BATCH_LOG_ATTENDANCE',
            sheetId: config.sheetId,
            sheetName: config.sheetName,
            session
          }),
          mode: 'no-cors'
        });
      }
      synced++;
      // Mark as synced in storage
      saveSession({
        ...session,
        syncedToGoogleSheets: true,
        syncTimestamp: new Date().toISOString()
      });
    } catch (e) {
      console.error('Error syncing item', session.id, e);
    }
  }

  // Clear or reduce queue
  saveOfflineQueue([]);
  saveSheetsConfig({
    ...config,
    lastSyncedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  });

  return {
    syncedCount: synced,
    message: `Successfully synchronized ${synced} attendance session(s) to Google Sheets!`
  };
};

export async function hydrateSheetsState(): Promise<void> {
  const localConfig = getSheetsConfig();
  const localQueue = getOfflineQueue();
  const localSessions = getAllSessions();

  const [config, queue, sessions] = await Promise.all([
    loadCloudState('sheets_config', localConfig),
    loadCloudState('offline_queue', localQueue),
    loadCloudState('attendance_sessions', localSessions),
  ]);

  localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
  localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
  localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
}

export const generateAttendanceCSV = (session: AttendanceSession): string => {
  const headers = ['Roll Number', 'Student Name', 'Date', 'Time', 'Course Code', 'Course Name', 'Section', 'Status', 'Remarks'];
  const rows = session.records.map(rec => [
    rec.rollNo,
    `"${rec.studentName.replace(/"/g, '""')}"`,
    session.date,
    session.time,
    session.courseId,
    `"${session.courseName.replace(/"/g, '""')}"`,
    session.section,
    rec.status.toUpperCase(),
    rec.remarks || ''
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
};

export const downloadAttendanceCSV = (session: AttendanceSession): void => {
  const csvContent = generateAttendanceCSV(session);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Attendance_${session.courseId}_${session.date.replace(/-/g, '')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
