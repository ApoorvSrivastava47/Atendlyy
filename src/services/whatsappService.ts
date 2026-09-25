import { Student } from '../types';

export interface WhatsAppTemplate {
  id: string;
  label: string;
  badge: string;
  color: string;
  generateText: (student: Student, extra?: { courseCode?: string; attendancePct?: number; date?: string; marks?: string }) => string;
}

export const cleanPhoneNumber = (phone: string): string => {
  // Strip out spaces, dashes, brackets, and leading '+'
  return phone.replace(/[^0-9]/g, '');
};

export const createWhatsAppUrl = (phone: string, text: string): string => {
  const clean = cleanPhoneNumber(phone);
  return `https://wa.me/${clean}?text=${encodeURIComponent(text)}`;
};

export const openWhatsAppChat = (phone: string, text: string): void => {
  const url = createWhatsAppUrl(phone, text);
  window.open(url, '_blank', 'noopener,noreferrer');
};

export const WHATSAPP_TEMPLATES: WhatsAppTemplate[] = [
  {
    id: 'absent_alert',
    label: 'Marked Absent Today',
    badge: 'Attendance Alert',
    color: 'rose',
    generateText: (student, extra) => {
      const course = extra?.courseCode || 'CS-301';
      const date = extra?.date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      return `📢 *ATTENDLY ATTENDANCE NOTICE*\n\nDear *${student.name}* (Roll No: *${student.rollNo}*),\n\nYou were marked *ABSENT* for class *${course}* on *${date}*.\n\n⚠️ If this was due to medical reasons or college duty, please submit an OD slip to Prof. Sharma within 24 hours.\n\n_Automated alert from Attendly._`;
    }
  },
  {
    id: 'event_od',
    label: 'On-Duty (OD) / Event Approved',
    badge: 'Event Duty',
    color: 'amber',
    generateText: (student, extra) => {
      const course = extra?.courseCode || 'CS-301';
      const date = extra?.date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return `🎖️ *ATTENDLY - ON-DUTY APPROVAL*\n\nHello *${student.name}*,\n\nYour attendance for *${course}* on *${date}* has been marked as *EVENT / ON-DUTY (OD)*. Your attendance record has been protected and synchronized with the college registrar.\n\nBest of luck with your event!`;
    }
  },
  {
    id: 'attendance_warning',
    label: 'Low Attendance Warning (<75%)',
    badge: 'Academic Warning',
    color: 'amber',
    generateText: (student, extra) => {
      const course = extra?.courseCode || 'CS-301';
      const total = student.stats.totalClasses;
      const attended = student.stats.attended + student.stats.eventDuty;
      const pct = Math.round((attended / (total || 1)) * 100);
      return `⚠️ *URGENT ATTENDANCE WARNING*\n\nDear *${student.name}* (Roll: *${student.rollNo}*),\n\nYour current attendance in *${course}* is *${pct}%* (${attended}/${total} sessions), which is below the mandatory university threshold of *75%*.\n\nPlease meet your Course Instructor (Room LH-302) during faculty office hours to discuss academic eligibility.\n\n_Attendly Academic Directorate_`;
    }
  },
  {
    id: 'grade_update',
    label: 'Gradebook & Marks Update',
    badge: 'Grade Alert',
    color: 'emerald',
    generateText: (student, extra) => {
      const course = extra?.courseCode || 'CS-301';
      return `📊 *GRADE UPDATE - ATTENDLY*\n\nDear *${student.name}*,\n\nYour internal assessment grades for *${course}* have been uploaded:\n• Assignments: *${student.grades.assignments}/100*\n• Midterm Exam: *${student.grades.midterm}/100*\n• Current Letter Grade: *${student.grades.letterGrade}* (GPA: *${student.grades.gpa}*)\n\nReview complete grading rubric on your student portal.`;
    }
  },
  {
    id: 'urgent_call',
    label: 'Faculty Office Call Request',
    badge: 'Faculty Notice',
    color: 'indigo',
    generateText: (student, extra) => {
      const course = extra?.courseCode || 'CS-301';
      return `🔔 *FACULTY ADVISOR NOTICE*\n\nDear *${student.name}* (${student.rollNo}),\n\nProf. Sharma has requested to see you in the CS Department office regarding your project milestone for *${course}*. Please drop by today before 4:00 PM.`;
    }
  }
];
