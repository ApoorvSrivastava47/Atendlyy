import React, { useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  Check,
  X,
  Award,
  RotateCcw,
  MessageCircle,
  Download,
  Calendar,
  Sparkles,
  Phone,
  ArrowRight,
  ExternalLink,
  Layers,
  ChevronRight,
  FileSpreadsheet,
  CalendarPlus,
  HardDrive
} from 'lucide-react';
import { Student, Course, AttendanceStatus, AttendanceRecord, AttendanceSession, GoogleDriveStatus } from '../types';
import { queueAttendanceForSync, isAppOnline, downloadAttendanceCSV } from '../services/sheetsService';
import { appendAttendanceToGoogleSheet } from '../services/googleDriveService';
import { openWhatsAppChat } from '../services/whatsappService';

interface TinderAttendanceProps {
  course: Course;
  students: Student[];
  onOpenWhatsApp: (student: Student, defaultReason?: string) => void;
  onViewSheetsModal: () => void;
  onOpenUploadSheet?: () => void;
  driveStatus?: GoogleDriveStatus;
  accessToken?: string | null;
  onOpenDriveModal?: () => void;
}

export function TinderAttendance({
  course,
  students,
  onOpenWhatsApp,
  onViewSheetsModal,
  onOpenUploadSheet,
  driveStatus,
  accessToken,
  onOpenDriveModal
}: TinderAttendanceProps) {
  // Sort strictly by roll number sequence as requested
  const sortedStudents = [...students].sort((a, b) => a.rollNo.localeCompare(b.rollNo));

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [history, setHistory] = useState<{ index: number; record: AttendanceRecord }[]>([]);
  const [sessionCompleted, setSessionCompleted] = useState<boolean>(false);
  const [completedSessionData, setCompletedSessionData] = useState<AttendanceSession | null>(null);
  const [syncStatus, setSyncStatus] = useState<{ synced: boolean; message: string } | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | 'event' | null>(null);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const isAnimatingRef = React.useRef<boolean>(false);

  // Calibrated, smooth Motion values for top card
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Organic, subtle rotational response curve
  const rotate = useTransform(x, [-260, 0, 260], [-14, 0, 14]);

  // Smooth stamp opacities linked directly to drag distance
  const presentOpacity = useTransform(x, [25, 90], [0, 1]);
  const absentOpacity = useTransform(x, [-25, -90], [0, 1]);
  const eventOpacity = useTransform(y, [-25, -90], [0, 1]);

  // Ambient side glow indicators
  const rightGlowOpacity = useTransform(x, [10, 120], [0, 0.9]);
  const leftGlowOpacity = useTransform(x, [-10, -120], [0, 0.9]);
  const topGlowOpacity = useTransform(y, [-10, -120], [0, 0.9]);

  // Reset attendance session when course changes
  useEffect(() => {
    setCurrentIndex(0);
    setRecords([]);
    setHistory([]);
    setSessionCompleted(false);
    setCompletedSessionData(null);
    setSyncStatus(null);
    isAnimatingRef.current = false;
    setIsAnimating(false);
    x.set(0);
    y.set(0);
  }, [course.id]);

  const activeStudent = sortedStudents[currentIndex];

  // Count current statistics
  const presentCount = records.filter(r => r.status === 'present').length;
  const absentCount = records.filter(r => r.status === 'absent').length;
  const eventCount = records.filter(r => r.status === 'event').length;
  const totalCount = sortedStudents.length;

  // Handle swipe decision with fluid animation and direct MotionValue driving
  const handleDecision = (status: AttendanceStatus) => {
    if (currentIndex >= sortedStudents.length || isAnimatingRef.current) return;
    isAnimatingRef.current = true;
    setIsAnimating(true);
    setSwipeDirection(status === 'present' ? 'right' : status === 'absent' ? 'left' : 'event');

    const student = sortedStudents[currentIndex];
    const newRecord: AttendanceRecord = {
      studentId: student.id,
      rollNo: student.rollNo,
      studentName: student.name,
      status,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };

    const newRecords = [...records, newRecord];
    setRecords(newRecords);
    setHistory(prev => [...prev, { index: currentIndex, record: newRecord }]);

    const targetX = status === 'present' ? 700 : status === 'absent' ? -700 : 0;
    const targetY = status === 'event' ? -600 : 0;

    const onExitComplete = async () => {
      // Advance to next student card
      const nextIndex = currentIndex + 1;
      x.set(0);
      y.set(0);
      setSwipeDirection(null);
      setCurrentIndex(nextIndex);
      isAnimatingRef.current = false;
      setIsAnimating(false);

      if (nextIndex >= sortedStudents.length) {
        await finalizeSession(newRecords);
      }
    };

    if (status === 'event') {
      animate(y, targetY, {
        duration: 0.22,
        ease: [0.32, 0.72, 0, 1],
        onComplete: onExitComplete
      });
    } else {
      animate(x, targetX, {
        duration: 0.22,
        ease: [0.32, 0.72, 0, 1],
        onComplete: onExitComplete
      });
    }
  };

  // Drag Release Gesture Evaluator (Physical velocity & displacement calculation)
  const handleDragEnd = (_: any, info: { offset: { x: number; y: number }; velocity: { x: number; y: number } }) => {
    if (isAnimatingRef.current) return;

    const currentX = x.get();
    const currentY = y.get();
    const vx = info.velocity.x;
    const vy = info.velocity.y;

    const swipeDistanceThreshold = 55;
    const velocityThreshold = 180;

    // 1. Check vertical swipe up for Event / On-Duty first
    if ((currentY < -swipeDistanceThreshold || vy < -velocityThreshold) && Math.abs(currentY) > Math.abs(currentX)) {
      handleDecision('event');
      return;
    }

    // 2. Check horizontal swipe (Right = Present, Left = Absent)
    if (currentX > swipeDistanceThreshold || vx > velocityThreshold) {
      handleDecision('present');
    } else if (currentX < -swipeDistanceThreshold || vx < -velocityThreshold) {
      handleDecision('absent');
    } else {
      // 3. Fallback: If threshold not reached, SNAP BACK TO EXACT CENTER!
      // This prevents the card from ever getting stuck on the sides.
      animate(x, 0, { type: 'spring', damping: 22, stiffness: 380, mass: 0.5 });
      animate(y, 0, { type: 'spring', damping: 22, stiffness: 380, mass: 0.5 });
    }
  };

  const finalizeSession = async (finalRecords: AttendanceRecord[]) => {
    const pCount = finalRecords.filter(r => r.status === 'present').length;
    const aCount = finalRecords.filter(r => r.status === 'absent').length;
    const eCount = finalRecords.filter(r => r.status === 'event').length;

    const now = new Date();
    const session: AttendanceSession = {
      id: `session-${Date.now()}`,
      courseId: course.id,
      courseName: course.name,
      section: course.section,
      date: now.toISOString().split('T')[0],
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      records: finalRecords,
      totalStudents: finalRecords.length,
      presentCount: pCount,
      absentCount: aCount,
      eventCount: eCount,
      syncedToGoogleSheets: false
    };

    setCompletedSessionData(session);
    setSessionCompleted(true);

    try {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#FFE600', '#00FF66', '#FF1E56', '#00E5FF']
      });
    } catch (e) {
      console.log('Confetti', e);
    }

    // Sync to Google Drive and Google Sheets or save to offline queue
    setIsSyncing(true);
    let syncedLive = false;
    let syncMsg = '';

    if (accessToken && driveStatus?.spreadsheetId) {
      try {
        const driveResult = await appendAttendanceToGoogleSheet(
          accessToken,
          driveStatus.spreadsheetId,
          session,
          driveStatus.userEmail || 'faculty@campus.edu'
        );
        if (driveResult.success) {
          session.syncedToGoogleSheets = true;
          syncedLive = true;
          syncMsg = `Directly logged to Google Sheet in your Google Drive ("${driveStatus.spreadsheetId.substring(0, 8)}...").`;
        }
      } catch (driveErr: any) {
        console.warn('Google Drive direct append error, falling back to local sync queue:', driveErr);
      }
    }

    if (!syncedLive) {
      const syncRes = await queueAttendanceForSync(session);
      syncedLive = syncRes.syncedDirectly;
      syncMsg = syncRes.message;
    }

    setSyncStatus({
      synced: syncedLive,
      message: syncMsg
    });
    setIsSyncing(false);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const lastItem = history[history.length - 1];
    setHistory(history.slice(0, -1));
    setRecords(records.slice(0, -1));
    x.set(0);
    y.set(24);
    animate(y, 0, { type: 'spring', damping: 18, stiffness: 320, mass: 0.6 });
    setCurrentIndex(lastItem.index);
    setSessionCompleted(false);
  };

  const handleResetSession = () => {
    setCurrentIndex(0);
    setRecords([]);
    setHistory([]);
    setSessionCompleted(false);
    setCompletedSessionData(null);
    setSyncStatus(null);
  };

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (sessionCompleted || currentIndex >= sortedStudents.length) return;

      if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') {
        handleDecision('present');
      } else if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') {
        handleDecision('absent');
      } else if (e.key === 'ArrowUp' || e.key.toLowerCase() === 'e' || e.code === 'Space') {
        e.preventDefault();
        handleDecision('event');
      } else if (e.key.toLowerCase() === 'z' || e.key === 'Backspace') {
        handleUndo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, sessionCompleted, history, records, sortedStudents]);

  return (
    <div id="tinder-attendance-container" className="w-full max-w-2xl mx-auto flex flex-col items-center">
      {/* Live Minimal Header Banner */}
      <div className="w-full bg-white border-[3px] border-black shadow-[4px_4px_0px_#000] p-4 sm:p-5 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 text-xs font-mono font-black bg-[#FFE600] border-2 border-black text-black">
                {course.code}
              </span>
              <span className="text-xs font-mono font-bold text-black">
                {course.section} • {course.room}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-black mt-1 tracking-tight">
              {course.name}
            </h2>
            {course.currentLecture && (
              <div className="mt-1.5 flex items-center space-x-1.5 text-xs font-mono">
                <span className="bg-[#00E5FF] px-2 py-0.5 border border-black font-black text-black">
                  LECTURE:
                </span>
                <span className="bg-[#fafafa] px-2 py-0.5 border border-black font-bold text-black">
                  {course.currentLecture}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2 font-mono">
            {onOpenUploadSheet && (
              <button
                id="tinder-schedule-class-btn"
                onClick={onOpenUploadSheet}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#FFE600] border-2 border-black shadow-[2px_2px_0px_#000] text-xs font-black text-black hover:-translate-y-0.5 transition-all cursor-pointer"
                title="Schedule class or switch section roster"
              >
                <CalendarPlus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>SCHEDULE CLASS</span>
              </button>
            )}

            <button
              onClick={onViewSheetsModal}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#00FF66] border-2 border-black shadow-[2px_2px_0px_#000] text-xs font-black text-black hover:-translate-y-0.5 transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>SHEETS SYNC</span>
            </button>
          </div>
        </div>

        {/* Live Roll Sequence Tape: Out-of-the-Box Minimal Interactive Ticker */}
        <div className="mt-3 pt-3 border-t-2 border-black">
          <div className="flex items-center justify-between text-xs font-mono font-black mb-2">
            <div className="flex items-center space-x-2">
              <span className="bg-black text-white px-1.5 py-0.5">
                SEQUENCE: {Math.min(currentIndex + 1, totalCount)} / {totalCount}
              </span>
              {activeStudent && !sessionCompleted && (
                <span className="text-black underline">
                  ACTIVE: {activeStudent.rollNo}
                </span>
              )}
            </div>

            <div className="flex items-center space-x-1.5 text-[11px]">
              <span className="bg-[#00FF66] border border-black px-1.5 py-0.5 text-black">
                P: {presentCount}
              </span>
              <span className="bg-[#FF1E56] border border-black px-1.5 py-0.5 text-white">
                A: {absentCount}
              </span>
              <span className="bg-[#FFE600] border border-black px-1.5 py-0.5 text-black">
                EV: {eventCount}
              </span>
            </div>
          </div>

          {/* Horizontal Roll Sequence Badges */}
          <div className="flex items-center space-x-1.5 overflow-x-auto py-1 scrollbar-none">
            {sortedStudents.map((st, idx) => {
              const rec = records.find(r => r.studentId === st.id);
              const isActive = idx === currentIndex && !sessionCompleted;
              const shortRoll = st.rollNo.slice(-3); // e.g. 001, 002

              let bg = 'bg-white text-black border-black';
              if (rec?.status === 'present') bg = 'bg-[#00FF66] text-black border-black';
              else if (rec?.status === 'absent') bg = 'bg-[#FF1E56] text-white border-black';
              else if (rec?.status === 'event') bg = 'bg-[#FFE600] text-black border-black';
              else if (isActive) bg = 'bg-[#00E5FF] text-black border-black scale-110 font-extrabold shadow-[2px_2px_0px_#000]';

              return (
                <div
                  key={st.id}
                  title={`${st.rollNo} - ${st.name} ${rec ? `(${rec.status})` : ''}`}
                  className={`shrink-0 px-2 py-0.5 text-[10px] font-mono border-2 transition-transform ${bg}`}
                >
                  #{shortRoll}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Tinder Card Deck Area - Literal Gesture-Driven Physical Swiping */}
      {!sessionCompleted && activeStudent ? (
        <div className="relative w-full max-w-md h-[470px] sm:h-[490px] flex items-center justify-center my-2 select-none">
          {/* Ambient Edge Indicators that light up during drag */}
          {/* Left: Absent Edge Glow */}
          <motion.div
            style={{ opacity: leftGlowOpacity }}
            className="pointer-events-none absolute -left-4 sm:-left-8 top-12 bottom-12 w-6 sm:w-8 bg-[#FF1E56] border-2 border-black shadow-[2px_2px_0px_#000] z-30 flex items-center justify-center"
          >
            <span className="text-white text-[10px] sm:text-xs font-black font-mono tracking-widest [writing-mode:vertical-lr] rotate-180">
              ⟵ ABSENT
            </span>
          </motion.div>

          {/* Right: Present Edge Glow */}
          <motion.div
            style={{ opacity: rightGlowOpacity }}
            className="pointer-events-none absolute -right-4 sm:-right-8 top-12 bottom-12 w-6 sm:w-8 bg-[#00FF66] border-2 border-black shadow-[2px_2px_0px_#000] z-30 flex items-center justify-center"
          >
            <span className="text-black text-[10px] sm:text-xs font-black font-mono tracking-widest [writing-mode:vertical-lr]">
              PRESENT ⟶
            </span>
          </motion.div>

          {/* Top: On-Duty Edge Glow */}
          <motion.div
            style={{ opacity: topGlowOpacity }}
            className="pointer-events-none absolute -top-5 inset-x-8 h-7 bg-[#FFE600] border-2 border-black shadow-[2px_2px_0px_#000] z-30 flex items-center justify-center"
          >
            <span className="text-black text-[10px] font-black font-mono tracking-wider flex items-center space-x-1">
              <span>⬆</span>
              <span>SWIPE UP: ON-DUTY (OD)</span>
            </span>
          </motion.div>

          {/* Active Top Draggable Student Card (Single card on canvas - reveals empty background while swiping) */}
          <motion.div
            key={activeStudent.rollNo}
            id={`tinder-student-card-${activeStudent.rollNo}`}
            style={{ x, y, rotate }}
            drag={!isAnimating}
            dragSnapToOrigin={true}
            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
            dragElastic={0.85}
            onDragEnd={handleDragEnd}
            initial={{ scale: 0.88, opacity: 0, y: 24 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 320, mass: 0.6 }}
            className="absolute w-full h-full bg-white border-[3.5px] border-black shadow-[8px_8px_0px_#000] flex flex-col cursor-grab active:cursor-grabbing overflow-hidden touch-none select-none z-20 will-change-transform"
          >
            {/* Dynamic Stamp Overlays linked directly to swipe velocity/position */}
            {/* 1. PRESENT Stamp */}
            <motion.div
              style={{ opacity: presentOpacity }}
              className="pointer-events-none absolute top-7 left-6 z-40 border-[4px] border-black bg-[#00FF66] text-black font-black font-mono text-2xl tracking-widest px-4 py-1.5 rotate-[-14deg] shadow-[4px_4px_0px_#000] flex items-center space-x-1.5"
            >
              <Check className="w-7 h-7 stroke-[4]" />
              <span>PRESENT</span>
            </motion.div>

            {/* 2. ABSENT Stamp */}
            <motion.div
              style={{ opacity: absentOpacity }}
              className="pointer-events-none absolute top-7 right-6 z-40 border-[4px] border-black bg-[#FF1E56] text-white font-black font-mono text-2xl tracking-widest px-4 py-1.5 rotate-[14deg] shadow-[4px_4px_0px_#000] flex items-center space-x-1.5"
            >
              <X className="w-7 h-7 stroke-[4]" />
              <span>ABSENT</span>
            </motion.div>

            {/* 3. EVENT / ON-DUTY Stamp */}
            <motion.div
              style={{ opacity: eventOpacity }}
              className="pointer-events-none absolute top-10 inset-x-8 z-40 border-[4px] border-black bg-[#FFE600] text-black font-black font-mono text-xl tracking-widest py-2 px-3 shadow-[4px_4px_0px_#000] flex items-center justify-center space-x-2 text-center"
            >
              <Award className="w-6 h-6 stroke-[3]" />
              <span>ON-DUTY (OD)</span>
            </motion.div>

            {/* Student Photo & Top Bar */}
            <div className="relative h-64 sm:h-70 w-full bg-black border-b-[3px] border-black overflow-hidden pointer-events-none">
              <img
                src={activeStudent.avatar}
                alt={activeStudent.name}
                className="w-full h-full object-cover pointer-events-none"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent pointer-events-none" />

              {/* Top Card Info Chips */}
              <div className="absolute top-3 inset-x-3 flex items-center justify-between z-10 font-mono">
                <div className="flex items-center space-x-1.5">
                  <span className="px-3 py-1 bg-[#FFE600] text-black font-black text-sm border-2 border-black shadow-[2px_2px_0px_#000]">
                    {activeStudent.rollNo}
                  </span>
                  <span className="px-2 py-1 bg-white text-black font-bold text-xs border-2 border-black">
                    #{currentIndex + 1}/{totalCount}
                  </span>
                </div>

                <span className="px-2.5 py-1 bg-black text-[#00FF66] font-mono font-bold text-[10px] border border-[#00FF66]/40 tracking-wider">
                  SWIPE ME ↔
                </span>
              </div>

              {/* Student Name & Section on Photo */}
              <div className="absolute bottom-3 left-4 right-4 z-10 text-white">
                <h3 className="text-2xl font-black tracking-tight leading-tight drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
                  {activeStudent.name}
                </h3>
                <p className="text-xs font-mono font-bold text-[#FFE600] drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
                  {activeStudent.department} • {activeStudent.section}
                </p>
              </div>
            </div>

            {/* Student Quick Dossier & Stats */}
            <div className="p-4 flex-1 flex flex-col justify-between bg-white font-mono pointer-events-none">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 border-2 border-black bg-[#fafafa]">
                  <div className="text-[10px] font-bold text-black uppercase">ATTENDED</div>
                  <div className="text-base font-black text-black">
                    {activeStudent.stats.attended}/{activeStudent.stats.totalClasses}
                  </div>
                </div>

                <div className="p-2 border-2 border-black bg-[#00FF66]">
                  <div className="text-[10px] font-bold text-black uppercase">ATTEND %</div>
                  <div className="text-base font-black text-black">
                    {Math.round(((activeStudent.stats.attended + activeStudent.stats.eventDuty) / (activeStudent.stats.totalClasses || 1)) * 100)}%
                  </div>
                </div>

                <div className="p-2 border-2 border-black bg-[#FFE600]">
                  <div className="text-[10px] font-bold text-black uppercase">GPA</div>
                  <div className="text-base font-black text-black">
                    {activeStudent.grades.gpa.toFixed(1)} ({activeStudent.grades.letterGrade})
                  </div>
                </div>
              </div>

              {/* Swipe Cue Instruction */}
              <div className="mt-2 text-center py-1 bg-gray-50 border border-black/20 text-[11px] font-mono text-gray-600 font-bold">
                Drag right for Present • Left for Absent
              </div>
            </div>
          </motion.div>
        </div>
      ) : null}

      {/* Laptop / Desktop Dedicated Action Buttons (Prominent in md/lg viewports) */}
      {!sessionCompleted && activeStudent && (
        <div className="hidden md:flex items-center justify-center space-x-6 my-4 w-full max-w-md font-mono select-none">
          {/* Absent Button */}
          <div className="flex flex-col items-center">
            <button
              id="desktop-btn-absent"
              type="button"
              onClick={() => handleDecision('absent')}
              className="w-16 h-16 bg-[#FF1E56] text-white border-[3px] border-black shadow-[4px_4px_0px_#000] hover:shadow-[6px_6px_0px_#000] hover:-translate-y-0.5 active:translate-x-1 active:translate-y-1 active:shadow-none flex items-center justify-center transition-all cursor-pointer group"
              title="Mark Absent [Press ← or A]"
            >
              <X className="w-8 h-8 stroke-[3.5] group-hover:scale-110 transition-transform" />
            </button>
            <span className="text-xs font-black text-black mt-2">
              ABSENT <span className="text-[10px] text-gray-500 font-normal">[← / A]</span>
            </span>
          </div>

          {/* Event / OD Button */}
          <div className="flex flex-col items-center">
            <button
              id="desktop-btn-event"
              type="button"
              onClick={() => handleDecision('event')}
              className="w-14 h-14 bg-[#FFE600] text-black border-[3px] border-black shadow-[4px_4px_0px_#000] hover:shadow-[6px_6px_0px_#000] hover:-translate-y-0.5 active:translate-x-1 active:translate-y-1 active:shadow-none flex items-center justify-center transition-all cursor-pointer group"
              title="Mark Event / On-Duty [Press ↑ or E or Space]"
            >
              <Award className="w-7 h-7 stroke-[3] group-hover:scale-110 transition-transform" />
            </button>
            <span className="text-xs font-black text-black mt-2">
              EVENT / OD <span className="text-[10px] text-gray-500 font-normal">[↑ / E]</span>
            </span>
          </div>

          {/* Undo Button */}
          <div className="flex flex-col items-center">
            <button
              id="desktop-btn-undo"
              type="button"
              disabled={history.length === 0}
              onClick={handleUndo}
              className="w-12 h-12 bg-white text-black border-[2.5px] border-black shadow-[3px_3px_0px_#000] hover:shadow-[4px_4px_0px_#000] hover:-translate-y-0.5 active:translate-x-1 active:translate-y-1 active:shadow-none flex items-center justify-center transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              title="Undo Last Swipe [Press Z]"
            >
              <RotateCcw className="w-5 h-5 stroke-[2.5]" />
            </button>
            <span className="text-xs font-black text-black mt-2">
              UNDO <span className="text-[10px] text-gray-500 font-normal">[Z]</span>
            </span>
          </div>

          {/* Present Button */}
          <div className="flex flex-col items-center">
            <button
              id="desktop-btn-present"
              type="button"
              onClick={() => handleDecision('present')}
              className="w-16 h-16 bg-[#00FF66] text-black border-[3px] border-black shadow-[4px_4px_0px_#000] hover:shadow-[6px_6px_0px_#000] hover:-translate-y-0.5 active:translate-x-1 active:translate-y-1 active:shadow-none flex items-center justify-center transition-all cursor-pointer group"
              title="Mark Present [Press → or D]"
            >
              <Check className="w-8 h-8 stroke-[3.5] group-hover:scale-110 transition-transform" />
            </button>
            <span className="text-xs font-black text-black mt-2">
              PRESENT <span className="text-[10px] text-gray-500 font-normal">[→ / D]</span>
            </span>
          </div>
        </div>
      )}

      {/* Swipe Affordance HUD & Minimal Utility Controls */}
      {!sessionCompleted && activeStudent && (
        <div className="w-full max-w-md flex flex-col items-center mt-2 select-none font-mono">
          {/* Real-time Gesture Direction Bar (Visible on mobile/tablet) */}
          <div className="md:hidden w-full p-2 bg-white border-2 border-black shadow-[3px_3px_0px_#000] flex items-center justify-between text-xs text-black">
            <div className="flex items-center space-x-1 font-black text-[#FF1E56]">
              <span className="text-base">⟵</span>
              <span>SWIPE LEFT: ABSENT</span>
            </div>

            <div className="flex items-center space-x-1 font-black bg-[#FFE600] px-1.5 py-0.5 border border-black text-[10px]">
              <span>⬆ UP: OD</span>
            </div>

            <div className="flex items-center space-x-1 font-black text-[#00AA44]">
              <span>SWIPE RIGHT: PRESENT</span>
              <span className="text-base">⟶</span>
            </div>
          </div>

          {/* Minimal Auxiliary Action Strip: Undo, Student WhatsApp, Keyboard hints */}
          <div className="w-full mt-2 flex items-center justify-between gap-2 text-xs">
            <button
              id="tinder-btn-undo"
              type="button"
              disabled={history.length === 0}
              onClick={handleUndo}
              className="md:hidden flex items-center space-x-1.5 px-3 py-1.5 bg-white text-black border-2 border-black shadow-[2px_2px_0px_#000] hover:bg-gray-100 active:translate-y-0.5 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed font-black"
              title="Undo last swipe (Shortcut: Z)"
            >
              <RotateCcw className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>UNDO SWIPE [Z]</span>
            </button>

            <button
              id={`whatsapp-card-trigger-${activeStudent.rollNo}`}
              type="button"
              onClick={() => onOpenWhatsApp(activeStudent)}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#00FF66] text-black border-2 border-black shadow-[2px_2px_0px_#000] hover:bg-[#10e775] active:translate-y-0.5 font-black transition-all cursor-pointer ml-auto"
              title="Chat with student on WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>CHAT WA</span>
            </button>
          </div>

          <div className="hidden md:block mt-2 text-[11px] font-mono text-black text-center bg-[#fafafa] border border-black px-3 py-1">
            ⌨️ KEYBOARD SHORTCUTS: [← / A] ABSENT • [→ / D] PRESENT • [↑ / E / SPACE] ON-DUTY • [Z] UNDO
          </div>

          <div className="md:hidden mt-2 text-[10px] font-mono text-gray-500 text-center">
            Tip: You can flick the card fast with your thumb or mouse in any direction.
          </div>
        </div>
      )}

      {/* Session Completed Summary Screen */}
      {sessionCompleted && completedSessionData && (
        <div
          id="session-completed-summary"
          className="w-full bg-white border-[3.5px] border-black shadow-[6px_6px_0px_#000] p-5 sm:p-6 space-y-5 font-mono"
        >
          {/* Header */}
          <div className="text-center space-y-1">
            <div className="inline-block p-2 bg-[#FFE600] border-2 border-black shadow-[2px_2px_0px_#000]">
              <Sparkles className="w-6 h-6 text-black" />
            </div>
            <h3 className="text-2xl font-black text-black tracking-tight">
              ROLL CALL FINISHED!
            </h3>
            <p className="text-xs font-bold text-gray-700">
              {course.code} • {course.name} • {completedSessionData.date} {completedSessionData.time}
            </p>
          </div>

          {/* Metric Badges */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-[#00FF66] border-[2.5px] border-black shadow-[3px_3px_0px_#000] text-center">
              <div className="text-[10px] font-black uppercase text-black">PRESENT</div>
              <div className="text-3xl font-black text-black mt-0.5">
                {completedSessionData.presentCount}
              </div>
              <div className="text-[10px] font-bold text-black mt-0.5">
                {Math.round((completedSessionData.presentCount / totalCount) * 100)}% TURN-OUT
              </div>
            </div>

            <div className="p-3 bg-[#FF1E56] border-[2.5px] border-black shadow-[3px_3px_0px_#000] text-center text-white">
              <div className="text-[10px] font-black uppercase">ABSENT</div>
              <div className="text-3xl font-black mt-0.5">
                {completedSessionData.absentCount}
              </div>
              <div className="text-[10px] font-bold mt-0.5">
                NEEDS ALERT
              </div>
            </div>

            <div className="p-3 bg-[#FFE600] border-[2.5px] border-black shadow-[3px_3px_0px_#000] text-center">
              <div className="text-[10px] font-black uppercase text-black">EVENT / OD</div>
              <div className="text-3xl font-black text-black mt-0.5">
                {completedSessionData.eventCount}
              </div>
              <div className="text-[10px] font-bold text-black mt-0.5">
                EXCUSED
              </div>
            </div>
          </div>

          {/* Google Sheets Sync Result Banner */}
          <div className="p-4 bg-[#fafafa] border-2 border-black shadow-[3px_3px_0px_#000]">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div>
                <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                  <span className="text-xs font-black uppercase text-black">
                    GOOGLE DRIVE & SHEETS STORAGE:
                  </span>
                  <span className={`px-2 py-0.5 text-[10px] font-black border border-black ${
                    syncStatus?.synced
                      ? 'bg-[#00FF66] text-black'
                      : 'bg-[#FFE600] text-black'
                  }`}>
                    {syncStatus?.synced ? 'SAVED IN YOUR DRIVE' : 'OFFLINE QUEUED IN CLASS'}
                  </span>
                </div>
                <p className="text-xs font-bold text-black mt-1">
                  {syncStatus?.message || 'Attendance stored safely in your teacher ledger.'}
                </p>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                {driveStatus?.spreadsheetUrl && (
                  <a
                    href={driveStatus.spreadsheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-[#00FF66] border-2 border-black text-xs font-black text-black shadow-[2px_2px_0px_#000] hover:-translate-y-0.5 transition-all flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>VIEW GOOGLE SHEET</span>
                  </a>
                )}
                <button
                  onClick={onViewSheetsModal}
                  className="px-3 py-1.5 bg-[#00E5FF] border-2 border-black text-xs font-black text-black shadow-[2px_2px_0px_#000] hover:-translate-y-0.5 transition-all"
                >
                  AUDIT LOGS
                </button>
              </div>
            </div>
          </div>

          {/* Absent Students with Direct 1-Click WhatsApp Button */}
          {completedSessionData.absentCount > 0 && (
            <div className="border-2 border-black p-4 bg-white shadow-[3px_3px_0px_#000]">
              <div className="flex items-center justify-between mb-3 border-b-2 border-black pb-2">
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 bg-[#FF1E56] border border-black"></span>
                  <h4 className="text-xs font-black uppercase text-black">
                    ABSENT STUDENTS ({completedSessionData.absentCount}) • 1-CLICK WHATSAPP
                  </h4>
                </div>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {completedSessionData.records
                  .filter(r => r.status === 'absent')
                  .map(rec => {
                    const studentObj = students.find(s => s.id === rec.studentId);
                    if (!studentObj) return null;

                    return (
                      <div
                        key={rec.studentId}
                        className="flex items-center justify-between p-2 bg-[#fafafa] border-2 border-black hover:bg-yellow-50 transition-colors"
                      >
                        <div className="flex items-center space-x-2.5">
                          <img
                            src={studentObj.avatar}
                            alt={studentObj.name}
                            className="w-8 h-8 object-cover border border-black"
                          />
                          <div>
                            <div className="text-xs font-black text-black">
                              {studentObj.name}
                            </div>
                            <div className="text-[10px] text-gray-600 font-mono">
                              {studentObj.rollNo} • {studentObj.phone}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => onOpenWhatsApp(studentObj, 'absent')}
                          className="px-2.5 py-1 bg-[#00FF66] border border-black text-black text-xs font-black flex items-center space-x-1 shadow-[2px_2px_0px_#000] hover:-translate-y-0.5 transition-all cursor-pointer"
                        >
                          <MessageCircle className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>NOTIFY WA</span>
                        </button>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t-2 border-black">
            <button
              onClick={handleResetSession}
              className="px-4 py-2 bg-white text-black border-2 border-black shadow-[2px_2px_0px_#000] text-xs font-black hover:bg-gray-100 cursor-pointer"
            >
              TAKE ATTENDANCE AGAIN
            </button>

            <button
              onClick={() => downloadAttendanceCSV(completedSessionData)}
              className="px-4 py-2 bg-[#FFE600] text-black border-2 border-black shadow-[2px_2px_0px_#000] text-xs font-black flex items-center space-x-1.5 hover:-translate-y-0.5 cursor-pointer"
            >
              <Download className="w-4 h-4 stroke-[2.5]" />
              <span>EXPORT CSV / SHEETS</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
