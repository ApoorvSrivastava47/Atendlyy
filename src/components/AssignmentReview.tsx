import React, { useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'motion/react';
import {
  Student,
  Course,
  Assignment,
  AssignmentSubmission,
  GoogleDriveStatus
} from '../types';
import { INITIAL_ASSIGNMENTS } from '../data/mockData';
import { openWhatsAppChat } from '../services/whatsappService';
import { appendAssignmentToGoogleSheet } from '../services/googleDriveService';
import { loadCloudState, saveCloudState } from '../services/cloudStateService';
import {
  FileText,
  Check,
  X,
  Clock,
  RotateCcw,
  MessageSquare,
  Sparkles,
  Calendar,
  Send,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Filter,
  ExternalLink
} from 'lucide-react';

interface AssignmentReviewProps {
  course: Course;
  students: Student[];
  onOpenWhatsApp: (student: Student, defaultReason?: string) => void;
  driveStatus?: GoogleDriveStatus;
  accessToken?: string | null;
}

export function AssignmentReview({
  course,
  students,
  onOpenWhatsApp,
  driveStatus,
  accessToken
}: AssignmentReviewProps) {
  // Assignments for current course
  const [assignments, setAssignments] = useState<Assignment[]>(() => {
    try {
      const saved = localStorage.getItem('campusflow_assignments');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_ASSIGNMENTS;
  });

  const courseAssignments = assignments.filter(
    (a) => a.courseId === course.id || a.courseCode === course.code
  );
  const activeAssignment = courseAssignments[0] || assignments[0];

  // Storage key for submissions of active assignment
  const subStorageKey = `campusflow_submissions_${activeAssignment?.id || 'default'}`;

  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>(() => {
    try {
      const saved = localStorage.getItem(subStorageKey);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    // Default mock submissions
    return students.map((s, idx) => {
      const isPending = idx === 1 || idx === 4 || idx === 8;
      const isLate = idx === 3 || idx === 7;
      return {
        studentId: s.id,
        rollNo: s.rollNo,
        studentName: s.name,
        status: isPending ? 'not_submitted' : isLate ? 'late' : 'accepted',
        marksAwarded: isPending ? 0 : isLate ? 78 : 92,
        submittedAt: isPending ? undefined : isLate ? '2 hours late' : 'Yesterday, 08:30 PM',
        fileName: isPending ? undefined : `${s.rollNo}_assignment_${activeAssignment?.id || '3'}.pdf`,
        notes: isPending ? 'Submission pending' : isLate ? 'Submitted after 5:00 PM deadline' : 'Clean algorithmic complexity proofs'
      };
    });
  });

  // Sort students by roll sequence for swipe evaluation
  const sortedStudents = [...students].sort((a, b) => a.rollNo.localeCompare(b.rollNo));

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [history, setHistory] = useState<{ studentId: string; prevStatus: AssignmentSubmission['status']; prevMarks?: number }[]>([]);
  const [swipeDirection, setSwipeDirection] = useState<'right' | 'left' | 'late' | null>(null);
  const [sessionCompleted, setSessionCompleted] = useState<boolean>(false);
  const [filterView, setFilterView] = useState<'all' | 'accepted' | 'pending'>('all');
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const isAnimatingRef = React.useRef<boolean>(false);

  // Keep a local cache for instant UI and persist the authoritative state in Supabase.
  useEffect(() => {
    localStorage.setItem(subStorageKey, JSON.stringify(submissions));
    void saveCloudState(`assignment_submissions:${activeAssignment?.id || 'default'}`, submissions);
  }, [submissions, subStorageKey, activeAssignment?.id]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const cloudAssignments = await loadCloudState('assignments', assignments);
      if (!cancelled) setAssignments(cloudAssignments);
      if (activeAssignment?.id) {
        const key = `assignment_submissions:${activeAssignment.id}`;
        const cloudSubmissions = await loadCloudState(key, submissions);
        if (!cancelled) setSubmissions(cloudSubmissions);
      }
    })();
    return () => { cancelled = true; };
  }, [activeAssignment?.id]);

  // Motion physics
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-220, 0, 220], [-15, 0, 15]);
  const acceptOpacity = useTransform(x, [25, 90], [0, 1]);
  const rejectOpacity = useTransform(x, [-25, -90], [0, 1]);

  const activeStudent = sortedStudents[currentIndex];
  const activeSubmission = submissions.find((sub) => sub.studentId === activeStudent?.id);

  const acceptedCount = submissions.filter((s) => s.status === 'accepted').length;
  const pendingCount = submissions.filter((s) => s.status === 'not_submitted' || s.status === 'pending').length;
  const lateCount = submissions.filter((s) => s.status === 'late').length;

  const handleDecision = (status: 'accepted' | 'pending' | 'late') => {
    if (!activeStudent || isAnimatingRef.current) return;
    isAnimatingRef.current = true;
    setIsAnimating(true);
    setSwipeDirection(status === 'accepted' ? 'right' : status === 'pending' ? 'left' : 'late');

    // Record history for undo
    const currentSub = submissions.find((s) => s.studentId === activeStudent.id);
    setHistory((prev) => [
      ...prev,
      {
        studentId: activeStudent.id,
        prevStatus: currentSub?.status || 'not_submitted',
        prevMarks: currentSub?.marksAwarded
      }
    ]);

    // Update submission
    const defaultMarks = status === 'accepted' ? (activeAssignment?.maxMarks || 100) : status === 'late' ? Math.round((activeAssignment?.maxMarks || 100) * 0.8) : 0;
    const updatedSub: AssignmentSubmission = {
      ...(currentSub || {
        id: `sub-${Date.now()}`,
        assignmentId: activeAssignment.id,
        studentId: activeStudent.id,
        rollNo: activeStudent.rollNo,
        studentName: activeStudent.name,
        submittedAt: new Date().toISOString(),
        fileType: 'pdf',
        pageCount: 4,
        plagiarismScore: 5
      }),
      status,
      marksAwarded: defaultMarks
    };

    setSubmissions((prev) =>
      prev.map((s) => (s.studentId === activeStudent.id ? updatedSub : s))
    );

    // Sync evaluation to teacher's Google Drive Sheet if connected
    if (accessToken && driveStatus?.spreadsheetId) {
      appendAssignmentToGoogleSheet(
        accessToken,
        driveStatus.spreadsheetId,
        course.code,
        activeAssignment.title,
        updatedSub,
        driveStatus.userEmail || 'faculty@campus.edu'
      ).catch((err) => console.warn('Could not append assignment grade to Google Sheet:', err));
    }

    const targetX = status === 'accepted' ? 650 : status === 'pending' ? -650 : 0;

    const onFlyOutComplete = () => {
      x.set(0);
      setSwipeDirection(null);
      isAnimatingRef.current = false;
      setIsAnimating(false);
      if (currentIndex + 1 < sortedStudents.length) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        setSessionCompleted(true);
      }
    };

    if (status === 'late') {
      // Late submission
      setTimeout(onFlyOutComplete, 220);
    } else {
      animate(x, targetX, {
        duration: 0.22,
        ease: [0.32, 0.72, 0, 1],
        onComplete: onFlyOutComplete
      });
    }
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const lastAction = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));

    setSubmissions((prev) =>
      prev.map((s) =>
        s.studentId === lastAction.studentId
          ? { ...s, status: lastAction.prevStatus, marksAwarded: lastAction.prevMarks }
          : s
      )
    );

    setSessionCompleted(false);
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const handleResetReview = () => {
    setCurrentIndex(0);
    setSessionCompleted(false);
    setHistory([]);
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (sessionCompleted) return;
      if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') {
        e.preventDefault();
        handleDecision('accepted');
      } else if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') {
        e.preventDefault();
        handleDecision('pending');
      } else if (e.key === 'ArrowUp' || e.key.toLowerCase() === 'l') {
        e.preventDefault();
        handleDecision('late');
      } else if (e.key.toLowerCase() === 'z' || e.key === 'Backspace') {
        e.preventDefault();
        handleUndo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, sessionCompleted, history, submissions]);

  // Broadcast WhatsApp to all pending students
  const handlePingPendingViaWhatsApp = () => {
    const pendingStudents = sortedStudents.filter((st) => {
      const sub = submissions.find((s) => s.studentId === st.id);
      return sub?.status === 'not_submitted' || sub?.status === 'pending';
    });

    if (pendingStudents.length === 0) {
      alert('All students have submitted their assignment!');
      return;
    }

    const firstStudent = pendingStudents[0];
    const message = `Hello ${firstStudent.name}, this is ${course.instructor}. Your submission for "${activeAssignment?.title}" is PENDING. Please submit your PDF before the portal closes.`;
    openWhatsAppChat(firstStudent.phone, message);
  };

  return (
    <div id="assignment-review-container" className="w-full max-w-xl mx-auto flex flex-col items-center px-2 sm:px-0">
      {/* Active Assignment Header Card */}
      <div className="w-full bg-white border-[3px] border-black shadow-[3px_3px_0px_#000] p-3 sm:p-4 mb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-1.5 mb-1">
              <span className="px-2 py-0.5 text-[10px] font-black bg-[#FFE600] border border-black text-black">
                ASSIGNMENT SWIPE
              </span>
              <span className="text-[11px] font-bold text-gray-700 truncate">
                {course.code} • {course.section}
              </span>
            </div>
            <h2 className="text-sm sm:text-base font-black text-black tracking-tight line-clamp-1">
              {activeAssignment?.title || 'Assignment Evaluation'}
            </h2>
            <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-gray-800">
              <span className="flex items-center space-x-1">
                <Calendar className="w-3 h-3 text-black" />
                <span className="font-semibold">{activeAssignment?.dueDate}</span>
              </span>
              <span className="bg-[#f0f0eb] px-1.5 py-0.2 border border-black text-[10px] font-bold">
                Max: {activeAssignment?.maxMarks || 100} Pts
              </span>
            </div>
          </div>

          <button
            onClick={handlePingPendingViaWhatsApp}
            className="shrink-0 px-2.5 py-1.5 bg-[#00FF66] border-2 border-black shadow-[2px_2px_0px_#000] text-[10px] sm:text-xs font-black text-black flex items-center space-x-1 hover:bg-[#10e775] active:translate-y-0.5"
            title="Send WhatsApp reminder to all pending students"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">PING PENDING</span>
            <span className="sm:hidden">PING WA</span>
          </button>
        </div>

        {/* Live Roll Sequence Tape */}
        <div className="mt-2.5 pt-2.5 border-t border-black/20 flex items-center justify-between text-[11px] font-bold">
          <div className="flex items-center space-x-1.5">
            <span className="bg-black text-white px-1.5 py-0.5 text-[10px] font-black">
              {Math.min(currentIndex + 1, sortedStudents.length)} / {sortedStudents.length}
            </span>
            {activeStudent && !sessionCompleted && (
              <span className="text-black font-semibold text-[11px] truncate max-w-[120px]">
                {activeStudent.rollNo}
              </span>
            )}
          </div>

          <div className="flex items-center space-x-1">
            <span className="bg-[#00FF66] border border-black px-1.5 py-0.5 text-[10px] font-black">
              ACC: {acceptedCount}
            </span>
            <span className="bg-[#FF1E56] border border-black px-1.5 py-0.5 text-[10px] font-black text-white">
              PEND: {pendingCount}
            </span>
            <span className="bg-[#FFE600] border border-black px-1.5 py-0.5 text-[10px] font-black">
              LATE: {lateCount}
            </span>
          </div>
        </div>
      </div>

      {/* Main Tinder Card Deck Area */}
      {!sessionCompleted && activeStudent ? (
        <div className="relative w-full max-w-sm h-[390px] sm:h-[430px] flex items-center justify-center select-none">
          {/* Active Draggable Card with Pop-out Entrance (Empty background underneath while swiping) */}
          <motion.div
            key={activeStudent.id}
            style={{ x, rotate }}
            drag={!isAnimating ? 'x' : false}
            dragSnapToOrigin={true}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.82}
            onDragEnd={(_, info) => {
              if (isAnimatingRef.current) return;
              const currentX = x.get();
              const vx = info.velocity.x;
              const swipeDistance = 55;
              const velocityThreshold = 180;
              if (currentX > swipeDistance || vx > velocityThreshold) {
                handleDecision('accepted');
              } else if (currentX < -swipeDistance || vx < -velocityThreshold) {
                handleDecision('pending');
              } else {
                animate(x, 0, { type: 'spring', damping: 22, stiffness: 380, mass: 0.5 });
              }
            }}
            initial={{ scale: 0.88, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 320, mass: 0.6 }}
            className="absolute w-full h-full bg-white border-[3.5px] border-black shadow-[7px_7px_0px_#000] flex flex-col cursor-grab active:cursor-grabbing overflow-hidden touch-none will-change-transform"
          >
            {/* Acceptance / Rejection Stamps */}
            <motion.div
              style={{ opacity: acceptOpacity }}
              className="pointer-events-none absolute top-4 left-4 z-30 border-[3px] border-black bg-[#00FF66] text-black font-black text-xl tracking-wider px-3 py-1 rotate-[-12deg] shadow-[3px_3px_0px_#000] flex items-center space-x-1"
            >
              <Check className="w-5 h-5 stroke-[3.5]" />
              <span>ACCEPTED</span>
            </motion.div>

            <motion.div
              style={{ opacity: rejectOpacity }}
              className="pointer-events-none absolute top-4 right-4 z-30 border-[3px] border-black bg-[#FF1E56] text-white font-black text-xl tracking-wider px-3 py-1 rotate-[12deg] shadow-[3px_3px_0px_#000] flex items-center space-x-1"
            >
              <X className="w-5 h-5 stroke-[3.5]" />
              <span>PENDING</span>
            </motion.div>

            {/* Student Info Top Banner */}
            <div className="bg-[#FFE600] border-b-[2.5px] border-black p-3 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <img
                  src={activeStudent.avatar}
                  alt={activeStudent.name}
                  className="w-10 h-10 object-cover border-2 border-black shrink-0"
                />
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[10px] font-black bg-black text-white px-1.5 py-0.2">
                      {activeStudent.rollNo}
                    </span>
                    <span className="text-[10px] font-bold text-black">
                      {activeStudent.section}
                    </span>
                  </div>
                  <h3 className="text-sm font-black text-black tracking-tight leading-tight mt-0.5">
                    {activeStudent.name}
                  </h3>
                </div>
              </div>

              {/* Exclusive WhatsApp Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenWhatsApp(activeStudent, `Assignment Review: ${activeAssignment?.title}`);
                }}
                className="px-2 py-1 bg-[#00FF66] text-black border border-black font-black text-[10px] shadow-[1.5px_1.5px_0px_#000] flex items-center space-x-1 hover:bg-[#10e775] cursor-pointer"
                title="Direct WhatsApp Chat"
              >
                <MessageSquare className="w-3 h-3" />
                <span>CHAT WA</span>
              </button>
            </div>

            {/* Submission Content / Preview */}
            <div className="p-3.5 flex-1 flex flex-col justify-between bg-white text-xs">
              <div className="space-y-2.5">
                {/* Status Indicator */}
                <div className="flex items-center justify-between p-2 border-2 border-black bg-[#fafafa]">
                  <div>
                    <span className="text-[9px] font-black uppercase text-gray-500 block">SUBMISSION STATUS</span>
                    <span className={`font-black text-xs ${activeSubmission?.status === 'not_submitted' ? 'text-[#FF1E56]' : 'text-black'}`}>
                      {activeSubmission?.status === 'not_submitted'
                        ? '⚠️ NOT YET SUBMITTED'
                        : activeSubmission?.status === 'late'
                        ? '⏳ LATE SUBMISSION'
                        : '✅ SUBMITTED REPORT'}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-gray-600">
                    {activeSubmission?.submittedAt || 'Awaiting file'}
                  </span>
                </div>

                {/* Submitted File Box */}
                <div className="p-2.5 border-2 border-black bg-yellow-50/50">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-black shrink-0" />
                    <div className="truncate flex-1">
                      <p className="font-bold text-[11px] text-black truncate">
                        {activeSubmission?.fileName || `${activeStudent.rollNo}_assignment_pending.pdf`}
                      </p>
                      <p className="text-[9px] text-gray-500 font-semibold">
                        Size: 1.4 MB • Verified PDF
                      </p>
                    </div>
                  </div>
                </div>

                {/* Student remarks / notes */}
                <div className="p-2 border border-black bg-[#fdfdfd] text-[11px]">
                  <span className="font-bold text-gray-700 block text-[9px] uppercase">EVALUATION NOTES:</span>
                  <p className="font-medium text-gray-900 mt-0.5 leading-snug">
                    {activeSubmission?.notes || 'Algorithmic proof included. Test cases passed 8/8.'}
                  </p>
                </div>
              </div>

              {/* Student WhatsApp Contact Strip */}
              <div className="flex items-center justify-between px-2.5 py-1 border-2 border-black bg-[#fafafa] text-[11px] font-bold text-black mt-2">
                <span className="text-gray-700">WhatsApp:</span>
                <span className="font-bold">{activeStudent.phone}</span>
                <button
                  type="button"
                  onClick={() => openWhatsAppChat(activeStudent.phone, `Hello ${activeStudent.name}, checking in regarding your ${activeAssignment?.title}.`)}
                  className="text-[9px] font-black bg-[#00FF66] border border-black px-1.5 py-0.5 hover:underline"
                >
                  SEND WA
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      ) : null}

      {/* Laptop / Desktop Dedicated Action Buttons */}
      {!sessionCompleted && activeStudent && (
        <div className="hidden md:flex items-center justify-center space-x-5 my-3 w-full max-w-sm font-mono select-none">
          {/* Reject / Pending */}
          <div className="flex flex-col items-center">
            <button
              onClick={() => handleDecision('pending')}
              className="w-13 h-13 bg-[#FF1E56] text-white border-[2.5px] border-black shadow-[3px_3px_0px_#000] hover:shadow-[5px_5px_0px_#000] hover:-translate-y-0.5 active:translate-y-1 flex items-center justify-center cursor-pointer transition-all"
              title="Mark Pending [← / A]"
            >
              <X className="w-7 h-7 stroke-[3.5]" />
            </button>
            <span className="text-[10px] font-black mt-1.5">PENDING [←]</span>
          </div>

          {/* Late / Resubmit */}
          <div className="flex flex-col items-center">
            <button
              onClick={() => handleDecision('late')}
              className="w-12 h-12 bg-[#FFE600] text-black border-[2.5px] border-black shadow-[3px_3px_0px_#000] hover:shadow-[5px_5px_0px_#000] hover:-translate-y-0.5 active:translate-y-1 flex items-center justify-center cursor-pointer transition-all"
              title="Mark Late [↑ / L]"
            >
              <Clock className="w-5 h-5 stroke-[3]" />
            </button>
            <span className="text-[10px] font-black mt-1.5">LATE [↑]</span>
          </div>

          {/* Undo */}
          <div className="flex flex-col items-center">
            <button
              onClick={handleUndo}
              disabled={history.length === 0}
              className="w-10 h-10 bg-white text-black border-[2.5px] border-black shadow-[2px_2px_0px_#000] hover:shadow-[4px_4px_0px_#000] hover:-translate-y-0.5 active:translate-y-1 flex items-center justify-center cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              title="Undo [Z]"
            >
              <RotateCcw className="w-4 h-4 stroke-[2.5]" />
            </button>
            <span className="text-[10px] font-bold mt-1.5">UNDO [Z]</span>
          </div>

          {/* Accept */}
          <div className="flex flex-col items-center">
            <button
              onClick={() => handleDecision('accepted')}
              className="w-13 h-13 bg-[#00FF66] text-black border-[2.5px] border-black shadow-[3px_3px_0px_#000] hover:shadow-[5px_5px_0px_#000] hover:-translate-y-0.5 active:translate-y-1 flex items-center justify-center cursor-pointer transition-all"
              title="Accept [→ / D]"
            >
              <Check className="w-7 h-7 stroke-[3.5]" />
            </button>
            <span className="text-[10px] font-black mt-1.5">ACCEPT [→]</span>
          </div>
        </div>
      )}

      {/* Swipe Gesture HUD & Minimal Utility Controls */}
      {!sessionCompleted && activeStudent && (
        <div className="w-full max-w-sm flex flex-col items-center mt-2 select-none font-mono">
          {/* Real-time Gesture Direction Bar (mobile only) */}
          <div className="md:hidden w-full p-2 bg-white border-2 border-black shadow-[3px_3px_0px_#000] flex items-center justify-between text-xs text-black">
            <div className="flex items-center space-x-1 font-black text-[#FF1E56]">
              <span className="text-sm">⟵</span>
              <span>LEFT: PENDING</span>
            </div>

            <div className="flex items-center space-x-1 font-black bg-[#FFE600] px-1.5 py-0.5 border border-black text-[10px]">
              <span>⬆ UP: LATE</span>
            </div>

            <div className="flex items-center space-x-1 font-black text-[#00AA44]">
              <span>RIGHT: ACCEPT</span>
              <span className="text-sm">⟶</span>
            </div>
          </div>

          {/* Minimal Auxiliary Action Strip */}
          <div className="w-full mt-2 flex items-center justify-between gap-2 text-xs">
            <button
              onClick={handleUndo}
              disabled={history.length === 0}
              className="md:hidden flex items-center space-x-1 px-3 py-1.5 bg-white text-black border-2 border-black shadow-[2px_2px_0px_#000] hover:bg-gray-100 active:translate-y-0.5 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed font-black text-[11px]"
              title="Undo last swipe [Z]"
            >
              <RotateCcw className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>UNDO [Z]</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenWhatsApp(activeStudent, `Assignment Review: ${activeAssignment?.title}`)}
              className="flex items-center space-x-1 px-3 py-1.5 bg-[#00FF66] text-black border-2 border-black shadow-[2px_2px_0px_#000] hover:bg-[#10e775] active:translate-y-0.5 font-black text-[11px] transition-all cursor-pointer ml-auto"
              title="Direct WhatsApp Chat"
            >
              <MessageSquare className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>CHAT WA</span>
            </button>
          </div>

          <div className="hidden md:block mt-2 text-[10px] font-mono text-gray-600 text-center">
            KEYBOARD: [← / A] PENDING • [→ / D] ACCEPT • [↑ / L] LATE • [Z] UNDO
          </div>
        </div>
      )}

      {/* Completion Screen */}
      {sessionCompleted && (
        <div className="w-full max-w-sm bg-white border-[3px] border-black shadow-[6px_6px_0px_#000] p-5 text-center space-y-4 my-2">
          <div className="w-14 h-14 bg-[#00FF66] border-[2.5px] border-black shadow-[3px_3px_0px_#000] flex items-center justify-center mx-auto text-black">
            <CheckCircle2 className="w-8 h-8 stroke-[3]" />
          </div>

          <div>
            <h3 className="text-lg font-black text-black">ASSIGNMENT REVIEW COMPLETE</h3>
            <p className="text-xs font-bold text-gray-700 mt-1">
              All {sortedStudents.length} student submissions for "{activeAssignment?.title}" evaluated!
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs font-black">
            <div className="p-2 bg-[#00FF66] border-2 border-black">
              <span className="text-[9px] block">ACCEPTED</span>
              <span className="text-lg">{acceptedCount}</span>
            </div>
            <div className="p-2 bg-[#FF1E56] text-white border-2 border-black">
              <span className="text-[9px] block">PENDING</span>
              <span className="text-lg">{pendingCount}</span>
            </div>
            <div className="p-2 bg-[#FFE600] border-2 border-black">
              <span className="text-[9px] block">LATE</span>
              <span className="text-lg">{lateCount}</span>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t-2 border-black">
            {pendingCount > 0 && (
              <button
                onClick={handlePingPendingViaWhatsApp}
                className="w-full py-2.5 bg-[#FFE600] border-2 border-black shadow-[3px_3px_0px_#000] font-black text-xs flex items-center justify-center space-x-1.5 cursor-pointer hover:bg-yellow-300"
              >
                <MessageSquare className="w-4 h-4" />
                <span>PING ALL {pendingCount} PENDING VIA WHATSAPP</span>
              </button>
            )}

            <button
              onClick={handleResetReview}
              className="w-full py-2 bg-white border-2 border-black shadow-[2px_2px_0px_#000] font-bold text-xs cursor-pointer hover:bg-gray-100 flex items-center justify-center space-x-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>REVIEW AGAIN / EDIT MARKS</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
