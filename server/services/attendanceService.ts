import { AttendanceSessionRecord } from '../models/schema';

/**
 * Attendance Service
 * 
 * Handles recording and archiving of swipe attendance sessions.
 */

// In-memory archive of finalized sessions
let attendanceSessions: AttendanceSessionRecord[] = [];

export class AttendanceService {
  /**
   * Get all recorded attendance sessions
   */
  static getAllSessions(): AttendanceSessionRecord[] {
    return attendanceSessions;
  }

  /**
   * Get session by unique ID
   */
  static getSessionById(id: string): AttendanceSessionRecord | null {
    return attendanceSessions.find((s) => s.id === id) || null;
  }

  /**
   * Record and finalize a new attendance session
   */
  static recordSession(session: AttendanceSessionRecord): AttendanceSessionRecord {
    const enrichedSession: AttendanceSessionRecord = {
      ...session,
      id: session.id || `session-${Date.now()}`,
      createdAt: new Date().toISOString()
    };

    attendanceSessions.unshift(enrichedSession);
    return enrichedSession;
  }

  /**
   * Query sessions by course or section
   */
  static getSessionsByCourse(courseId: string): AttendanceSessionRecord[] {
    return attendanceSessions.filter((s) => s.courseId === courseId);
  }
}
