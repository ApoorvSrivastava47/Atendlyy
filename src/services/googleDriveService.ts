import { AttendanceSession, AssignmentSubmission, Student } from '../types';

export interface DriveFolderInfo {
  id: string;
  name: string;
  webViewLink: string;
}

export interface DriveSheetInfo {
  id: string;
  name: string;
  webViewLink: string;
}

const DRIVE_FOLDER_NAME = 'Atendly Faculty Data';
const MASTER_SHEET_NAME = 'Atendly - Master Attendance & Faculty Log';

const FOLDER_ID_STORAGE_KEY = 'atendly_drive_folder_id';
const FOLDER_URL_STORAGE_KEY = 'atendly_drive_folder_url';
const SHEET_ID_STORAGE_KEY = 'atendly_drive_sheet_id';
const SHEET_URL_STORAGE_KEY = 'atendly_drive_sheet_url';

export const getSavedDriveInfo = () => {
  return {
    folderId: localStorage.getItem(FOLDER_ID_STORAGE_KEY),
    folderUrl: localStorage.getItem(FOLDER_URL_STORAGE_KEY),
    sheetId: localStorage.getItem(SHEET_ID_STORAGE_KEY),
    sheetUrl: localStorage.getItem(SHEET_URL_STORAGE_KEY)
  };
};

export const saveDriveInfo = (
  folderId?: string | null,
  folderUrl?: string | null,
  sheetId?: string | null,
  sheetUrl?: string | null
) => {
  if (folderId) localStorage.setItem(FOLDER_ID_STORAGE_KEY, folderId);
  if (folderUrl) localStorage.setItem(FOLDER_URL_STORAGE_KEY, folderUrl);
  if (sheetId) localStorage.setItem(SHEET_ID_STORAGE_KEY, sheetId);
  if (sheetUrl) localStorage.setItem(SHEET_URL_STORAGE_KEY, sheetUrl);
};

export const clearDriveInfo = () => {
  localStorage.removeItem(FOLDER_ID_STORAGE_KEY);
  localStorage.removeItem(FOLDER_URL_STORAGE_KEY);
  localStorage.removeItem(SHEET_ID_STORAGE_KEY);
  localStorage.removeItem(SHEET_URL_STORAGE_KEY);
};

/**
 * Ensures the dedicated "Atendly Faculty Data" folder exists in the teacher's Google Drive.
 */
export const ensureFacultyDriveFolder = async (accessToken: string): Promise<DriveFolderInfo> => {
  // 1. Search for existing folder
  const query = encodeURIComponent(`name='${DRIVE_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`);
  const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,webViewLink)`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });

  if (!searchRes.ok) {
    const errorText = await searchRes.text();
    throw new Error(`Google Drive API error (${searchRes.status}): ${errorText}`);
  }

  const searchData = await searchRes.json();
  if (searchData.files && searchData.files.length > 0) {
    const folder = searchData.files[0];
    saveDriveInfo(folder.id, folder.webViewLink);
    return folder;
  }

  // 2. Create new folder in teacher's Google Drive
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: DRIVE_FOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder',
      description: 'Atendly faculty attendance logs, assignment evaluations, and student registers'
    })
  });

  if (!createRes.ok) {
    const errorText = await createRes.text();
    throw new Error(`Failed to create Google Drive folder: ${errorText}`);
  }

  const newFolder = await createRes.json();
  saveDriveInfo(newFolder.id, newFolder.webViewLink);
  return newFolder;
};

/**
 * Ensures the Master Google Sheet exists inside the "Atendly Faculty Data" folder.
 */
export const ensureMasterSheet = async (
  accessToken: string,
  folderId: string
): Promise<DriveSheetInfo> => {
  // 1. Search for existing sheet in folder
  const query = encodeURIComponent(`'${folderId}' in parents and name='${MASTER_SHEET_NAME}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`);
  const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,webViewLink)`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });

  if (searchRes.ok) {
    const searchData = await searchRes.json();
    if (searchData.files && searchData.files.length > 0) {
      const sheet = searchData.files[0];
      saveDriveInfo(undefined, undefined, sheet.id, sheet.webViewLink);
      return sheet;
    }
  }

  // 2. Create new structured Google Sheet
  const createSheetRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      properties: {
        title: MASTER_SHEET_NAME
      },
      sheets: [
        {
          properties: {
            title: 'Attendance_Ledger',
            gridProperties: { frozenRowCount: 1 }
          },
          data: [
            {
              startRow: 0,
              startColumn: 0,
              rowData: [
                {
                  values: [
                    { userEnteredValue: { stringValue: 'Timestamp' } },
                    { userEnteredValue: { stringValue: 'Date' } },
                    { userEnteredValue: { stringValue: 'Time' } },
                    { userEnteredValue: { stringValue: 'Course Code' } },
                    { userEnteredValue: { stringValue: 'Course Name' } },
                    { userEnteredValue: { stringValue: 'Section' } },
                    { userEnteredValue: { stringValue: 'Roll No' } },
                    { userEnteredValue: { stringValue: 'Student Name' } },
                    { userEnteredValue: { stringValue: 'Attendance Status' } },
                    { userEnteredValue: { stringValue: 'Overall Attendance %' } },
                    { userEnteredValue: { stringValue: 'Faculty Email' } },
                    { userEnteredValue: { stringValue: 'Remarks / Event Duty' } },
                    { userEnteredValue: { stringValue: 'Verification Hash' } }
                  ]
                }
              ]
            }
          ]
        },
        {
          properties: {
            title: 'Assignment_Submissions',
            gridProperties: { frozenRowCount: 1 }
          },
          data: [
            {
              startRow: 0,
              startColumn: 0,
              rowData: [
                {
                  values: [
                    { userEnteredValue: { stringValue: 'Timestamp' } },
                    { userEnteredValue: { stringValue: 'Date' } },
                    { userEnteredValue: { stringValue: 'Course Code' } },
                    { userEnteredValue: { stringValue: 'Assignment Title' } },
                    { userEnteredValue: { stringValue: 'Roll No' } },
                    { userEnteredValue: { stringValue: 'Student Name' } },
                    { userEnteredValue: { stringValue: 'Evaluation Status' } },
                    { userEnteredValue: { stringValue: 'Marks Awarded' } },
                    { userEnteredValue: { stringValue: 'Faculty Feedback' } },
                    { userEnteredValue: { stringValue: 'Faculty Email' } }
                  ]
                }
              ]
            }
          ]
        },
        {
          properties: {
            title: 'Student_Roster',
            gridProperties: { frozenRowCount: 1 }
          },
          data: [
            {
              startRow: 0,
              startColumn: 0,
              rowData: [
                {
                  values: [
                    { userEnteredValue: { stringValue: 'Roll No' } },
                    { userEnteredValue: { stringValue: 'Student Name' } },
                    { userEnteredValue: { stringValue: 'Email' } },
                    { userEnteredValue: { stringValue: 'WhatsApp Phone' } },
                    { userEnteredValue: { stringValue: 'Course' } },
                    { userEnteredValue: { stringValue: 'Section' } },
                    { userEnteredValue: { stringValue: 'Department' } },
                    { userEnteredValue: { stringValue: 'Classes Attended' } },
                    { userEnteredValue: { stringValue: 'Total Classes' } },
                    { userEnteredValue: { stringValue: 'Current %' } },
                    { userEnteredValue: { stringValue: 'Status' } }
                  ]
                }
              ]
            }
          ]
        }
      ]
    })
  });

  if (!createSheetRes.ok) {
    const errorText = await createSheetRes.text();
    throw new Error(`Failed to create Google Sheet: ${errorText}`);
  }

  const sheetData = await createSheetRes.json();
  const spreadsheetId = sheetData.spreadsheetId;
  const webViewLink = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // 3. Move the newly created spreadsheet into the "Atendly Faculty Data" folder
  try {
    await fetch(`https://www.googleapis.com/drive/v3/files/${spreadsheetId}?addParents=${folderId}&fields=id,parents`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
  } catch (err) {
    console.warn('Could not move sheet to folder parent:', err);
  }

  saveDriveInfo(undefined, undefined, spreadsheetId, webViewLink);
  return {
    id: spreadsheetId,
    name: MASTER_SHEET_NAME,
    webViewLink
  };
};

/**
 * Appends attendance session records directly to the teacher's Google Sheet in Google Drive.
 */
export const appendAttendanceToGoogleSheet = async (
  accessToken: string,
  spreadsheetId: string,
  session: AttendanceSession,
  facultyEmail: string
): Promise<{ success: boolean; rowsAdded: number; message: string }> => {
  const timestamp = new Date().toISOString();

  const rows = session.records.map((rec) => {
    const hash = `ATND-${rec.rollNo}-${session.date.replace(/-/g, '')}-${rec.status.toUpperCase()}`;
    return [
      timestamp,
      session.date,
      session.time,
      session.courseId,
      session.courseName,
      session.section,
      rec.rollNo,
      rec.studentName,
      rec.status.toUpperCase(),
      rec.status === 'present' ? '100%' : rec.status === 'event' ? 'OD (Excused)' : '0%',
      facultyEmail,
      rec.remarks || (rec.status === 'event' ? 'Campus Event / On-Duty Duty Approved' : ''),
      hash
    ];
  });

  const range = encodeURIComponent('Attendance_Ledger!A1');
  const appendRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        values: rows
      })
    }
  );

  if (!appendRes.ok) {
    const errorText = await appendRes.text();
    throw new Error(`Google Sheets append failed (${appendRes.status}): ${errorText}`);
  }

  const result = await appendRes.json();
  const rowsAdded = result.updates?.updatedRows || rows.length;

  return {
    success: true,
    rowsAdded,
    message: `Successfully logged ${rowsAdded} student records to Google Sheet in your Google Drive.`
  };
};

/**
 * Appends assignment review evaluation directly to the teacher's Google Sheet in Google Drive.
 */
export const appendAssignmentToGoogleSheet = async (
  accessToken: string,
  spreadsheetId: string,
  courseCode: string,
  assignmentTitle: string,
  submission: AssignmentSubmission,
  facultyEmail: string
): Promise<boolean> => {
  const timestamp = new Date().toISOString();
  const dateStr = new Date().toLocaleDateString('en-GB');

  const row = [
    timestamp,
    dateStr,
    courseCode,
    assignmentTitle,
    submission.rollNo,
    submission.studentName,
    submission.status.toUpperCase(),
    submission.marksAwarded !== undefined ? `${submission.marksAwarded}/100` : 'Pending',
    submission.notes || '',
    facultyEmail
  ];

  const range = encodeURIComponent('Assignment_Submissions!A1');
  const appendRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        values: [row]
      })
    }
  );

  return appendRes.ok;
};

/**
 * Syncs the student roster to the Student_Roster tab in Google Sheets.
 */
export const syncRosterToGoogleSheet = async (
  accessToken: string,
  spreadsheetId: string,
  students: Student[],
  courseCode: string
): Promise<boolean> => {
  const rows = students.map((s) => {
    const total = s.stats.totalClasses || 1;
    const attended = s.stats.attended || 0;
    const pct = Math.round((attended / total) * 100);
    return [
      s.rollNo,
      s.name,
      s.email,
      s.phone,
      courseCode,
      s.section,
      s.department,
      attended,
      total,
      `${pct}%`,
      pct < 75 ? 'DEBARRED RISK (<75%)' : 'ELIGIBLE'
    ];
  });

  const range = encodeURIComponent('Student_Roster!A2:K');
  const updateRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        values: rows
      })
    }
  );

  return updateRes.ok;
};
