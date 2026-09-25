import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Layers,
  FileSpreadsheet,
  Users,
  Wifi,
  WifiOff,
  ChevronDown,
  Zap,
  Send,
  Upload,
  Radio,
  FileCheck,
  AlertTriangle,
  MessageSquare,
  HardDrive,
  CalendarPlus
} from 'lucide-react';
import { Course, GoogleDriveStatus } from '../types';
import { isSimulatedOffline, setSimulatedOffline, getOfflineQueue } from '../services/sheetsService';

export type NavigationTab = 'attendance' | 'assignments' | 'complaints' | 'events' | 'roster';

interface HeaderProps {
  activeTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  courses: Course[];
  selectedCourseId: string;
  onSelectCourse: (courseId: string) => void;
  onOpenSheetsModal: () => void;
  onOpenQuickWhatsApp: () => void;
  onOpenUploadModal: () => void;
  onOpenSideDrawer: () => void;
  liveEventsCount?: number;
  isOnline: boolean;
  driveStatus?: GoogleDriveStatus;
  onOpenDriveModal?: () => void;
}

export function Header({
  activeTab,
  onTabChange,
  courses,
  selectedCourseId,
  onSelectCourse,
  onOpenSheetsModal,
  onOpenQuickWhatsApp,
  onOpenUploadModal,
  onOpenSideDrawer,
  liveEventsCount = 2,
  isOnline,
  driveStatus,
  onOpenDriveModal
}: HeaderProps) {
  const pendingQueueCount = getOfflineQueue().length;
  const currentCourse = courses.find((c) => c.id === selectedCourseId) || courses[0];
  const simOffline = isSimulatedOffline();
  const [showMobileCourseSheet, setShowMobileCourseSheet] = useState<boolean>(false);

  const handleToggleOffline = () => {
    setSimulatedOffline(!simOffline);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b-[3px] border-black shadow-[0_3px_0px_#000] font-sans">
        {/* Offline micro-banner when disconnected */}
        {!isOnline && (
          <div className="bg-[#FF1E56] text-white px-3 py-1 text-center text-[10px] sm:text-xs font-black uppercase border-b-2 border-black flex items-center justify-center space-x-2">
            <WifiOff className="w-3.5 h-3.5 animate-pulse" />
            <span className="truncate">OFFLINE MODE • ATTENDANCE LOGGED LOCALLY</span>
            <button
              onClick={handleToggleOffline}
              className="underline font-bold text-[9px] bg-white text-black px-1.5 py-0.2 border border-black cursor-pointer ml-1 shrink-0"
            >
              Go Online
            </button>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-2.5 sm:px-6 py-2 sm:py-2.5">
          <div className="flex items-center justify-between gap-2">
            {/* Left: Brand + Course Pill */}
            <div className="flex items-center space-x-2 shrink-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#FFE600] border-[2px] sm:border-[2.5px] border-black shadow-[2px_2px_0px_#000] flex items-center justify-center text-black font-black">
                <Zap className="w-5 h-5 sm:w-6 sm:h-6 fill-black text-black" />
              </div>
              <div>
                <div className="flex items-center space-x-1">
                  <span className="text-lg sm:text-2xl font-black tracking-tight text-black">
                    ATEND<span className="bg-[#FFE600] px-1 py-0.2 border border-black ml-0.5 text-xs sm:text-sm">LY</span>
                  </span>
                </div>
              </div>

              {/* Mobile Quick Course Pill */}
              <button
                onClick={() => setShowMobileCourseSheet(true)}
                className="md:hidden flex items-center space-x-1 px-2 py-1 bg-[#00E5FF] border-[1.5px] border-black text-[10px] font-black text-black shadow-[1.5px_1.5px_0px_#000] max-w-[130px] truncate"
              >
                <span className="truncate">{currentCourse.code}</span>
                <ChevronDown className="w-3 h-3 stroke-[3] shrink-0" />
              </button>
            </div>

            {/* Desktop Course Selector */}
            <div className="relative hidden md:block max-w-xs">
              <select
                value={selectedCourseId}
                onChange={(e) => onSelectCourse(e.target.value)}
                aria-label="Select Course"
                className="w-full bg-[#00E5FF] border-[2px] border-black shadow-[2px_2px_0px_#000] px-2.5 py-1.5 text-xs font-black text-black focus:outline-none pr-7 cursor-pointer"
              >
                {courses.map((course) => (
                  <option key={course.id} value={course.id} className="bg-white text-black">
                    {course.code} • {course.name} ({course.section})
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1.5 text-black">
                <ChevronDown className="w-3.5 h-3.5 stroke-[3]" />
              </div>
            </div>

            {/* Desktop Navigation Tabs */}
            <nav className="hidden lg:flex items-center space-x-1.5 font-sans">
              <button
                onClick={() => onTabChange('attendance')}
                className={`flex items-center space-x-1 px-2.5 py-1.5 text-xs font-black border-[2px] border-black transition-all cursor-pointer ${
                  activeTab === 'attendance'
                    ? 'bg-[#FFE600] text-black shadow-[2.5px_2.5px_0px_#000] -translate-x-0.5 -translate-y-0.5'
                    : 'bg-white text-black hover:bg-yellow-50'
                }`}
              >
                <Layers className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>ATTENDANCE</span>
              </button>

              <button
                onClick={() => onTabChange('assignments')}
                className={`flex items-center space-x-1 px-2.5 py-1.5 text-xs font-black border-[2px] border-black transition-all cursor-pointer ${
                  activeTab === 'assignments'
                    ? 'bg-[#00FF66] text-black shadow-[2.5px_2.5px_0px_#000] -translate-x-0.5 -translate-y-0.5'
                    : 'bg-white text-black hover:bg-emerald-50'
                }`}
              >
                <FileCheck className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>ASSIGNMENTS</span>
              </button>

              <button
                onClick={() => onTabChange('complaints')}
                className={`flex items-center space-x-1 px-2.5 py-1.5 text-xs font-black border-[2px] border-black transition-all cursor-pointer ${
                  activeTab === 'complaints'
                    ? 'bg-[#FF1E56] text-white shadow-[2.5px_2.5px_0px_#000] -translate-x-0.5 -translate-y-0.5'
                    : 'bg-white text-black hover:bg-red-50'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>COMPLAINTS</span>
              </button>

              <button
                onClick={() => onTabChange('events')}
                className={`flex items-center space-x-1 px-2.5 py-1.5 text-xs font-black border-[2px] border-black transition-all cursor-pointer ${
                  activeTab === 'events'
                    ? 'bg-[#FFE600] text-black shadow-[2.5px_2.5px_0px_#000] -translate-x-0.5 -translate-y-0.5'
                    : 'bg-white text-black hover:bg-yellow-50'
                }`}
              >
                <Radio className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>BROADCAST</span>
              </button>

              <button
                onClick={() => onTabChange('roster')}
                className={`flex items-center space-x-1 px-2.5 py-1.5 text-xs font-black border-[2px] border-black transition-all cursor-pointer ${
                  activeTab === 'roster'
                    ? 'bg-[#00E5FF] text-black shadow-[2.5px_2.5px_0px_#000] -translate-x-0.5 -translate-y-0.5'
                    : 'bg-white text-black hover:bg-cyan-50'
                }`}
              >
                <Users className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>STUDENTS</span>
              </button>
            </nav>

            {/* Right Action Buttons */}
            <div className="flex items-center space-x-1.5 shrink-0">
              {/* Ongoing Events Side Pop-Up Trigger */}
              <button
                id="header-side-event-btn"
                onClick={onOpenSideDrawer}
                className="flex items-center space-x-1 px-2 sm:px-2.5 py-1.5 bg-[#FF1E56] text-white border-[2px] border-black shadow-[2px_2px_0px_#000] text-[11px] font-black hover:-translate-y-0.5 active:translate-y-0.5 transition-all cursor-pointer"
                title="Open Live Events & Broadcast Side Panel"
              >
                <span className="w-2 h-2 rounded-full bg-white animate-ping shrink-0" />
                <span className="hidden sm:inline">EVENTS</span>
                <span className="bg-black text-[#FFE600] px-1 py-0.2 text-[9px] font-mono font-black border border-black">
                  {liveEventsCount}
                </span>
              </button>

              {/* Schedule Class Trigger */}
              <button
                id="header-schedule-class-btn"
                onClick={onOpenUploadModal}
                className="flex items-center space-x-1.5 px-2 sm:px-2.5 py-1.5 bg-[#FFE600] text-black border-[2px] border-black shadow-[2px_2px_0px_#000] text-[11px] font-black hover:-translate-y-0.5 active:translate-y-0.5 transition-all cursor-pointer"
                title="Schedule Class & Load Section Roster"
              >
                <CalendarPlus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span className="hidden md:inline">SCHEDULE CLASS</span>
                <span className="md:hidden">SCHEDULE</span>
              </button>

              {/* Google Sheets Trigger */}
              <button
                id="header-sheets-btn"
                onClick={onOpenSheetsModal}
                className={`flex items-center space-x-1 px-2 py-1.5 text-[11px] font-black border-[2px] border-black shadow-[2px_2px_0px_#000] transition-all cursor-pointer ${
                  pendingQueueCount > 0
                    ? 'bg-[#FFE600] text-black animate-pulse'
                    : 'bg-[#00FF66] text-black hover:bg-[#10e775]'
                }`}
                title="Google Sheets Auto-Sync"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 stroke-[2.5]" />
                {pendingQueueCount > 0 && (
                  <span className="bg-black text-white px-1 text-[9px]">
                    {pendingQueueCount}
                  </span>
                )}
              </button>

              {/* Direct WhatsApp Trigger */}
              <button
                id="header-whatsapp-direct"
                onClick={onOpenQuickWhatsApp}
                className="flex items-center space-x-1 px-2.5 py-1.5 bg-[#00FF66] text-black border-[2px] border-black shadow-[2px_2px_0px_#000] text-[11px] font-black hover:-translate-y-0.5 active:translate-y-0.5 transition-all cursor-pointer"
                title="Open WhatsApp chat with student"
              >
                <MessageSquare className="w-3.5 h-3.5 stroke-[2.5]" />
                <span className="hidden sm:inline">CHAT WA</span>
              </button>

              {/* Google Drive Storage & Teacher Profile Trigger */}
              {onOpenDriveModal && (
                <button
                  id="header-google-drive-btn"
                  onClick={onOpenDriveModal}
                  className={`flex items-center space-x-1.5 px-2 sm:px-2.5 py-1.5 border-[2px] border-black shadow-[2px_2px_0px_#000] text-[11px] font-black transition-all cursor-pointer ${
                    driveStatus?.isConnected
                      ? 'bg-white text-black hover:bg-green-50'
                      : 'bg-[#FFE600] text-black hover:bg-yellow-400'
                  }`}
                  title={
                    driveStatus?.isConnected
                      ? `Google Drive Connected (${driveStatus.userEmail})`
                      : 'Connect Google Drive & Sheets'
                  }
                >
                  <HardDrive className="w-3.5 h-3.5 stroke-[2.5] text-[#0066FF]" />
                  {driveStatus?.isConnected ? (
                    <div className="flex items-center space-x-1">
                      <span className="w-2 h-2 rounded-full bg-[#00FF66] border border-black shrink-0" />
                      <span className="hidden md:inline truncate max-w-[80px]">
                        {driveStatus.userName?.split(' ')[0] || 'DRIVE'}
                      </span>
                    </div>
                  ) : (
                    <span className="hidden sm:inline">G-DRIVE</span>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Course Selection Bottom Sheet Dialog */}
      <AnimatePresence>
        {showMobileCourseSheet && (
          <div className="fixed inset-0 z-50 flex items-end justify-center font-sans">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
              onClick={() => setShowMobileCourseSheet(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300, mass: 0.8 }}
              className="w-full max-w-md bg-white border-t-[3.5px] sm:border-[3.5px] border-black shadow-[0_-6px_0px_#000] p-4 space-y-3 relative z-10"
            >
              <div className="flex items-center justify-between border-b-2 border-black pb-2">
                <div>
                  <h4 className="font-black text-sm text-black">SELECT ACTIVE CLASS</h4>
                  <p className="text-[10px] font-bold text-gray-500 uppercase">
                    SWITCH CURRENT LECTURE
                  </p>
                </div>
                <button
                  onClick={() => setShowMobileCourseSheet(false)}
                  className="px-2 py-0.5 bg-black text-white font-black text-xs cursor-pointer"
                >
                  CLOSE
                </button>
              </div>

              <div className="space-y-1.5 max-h-60 overflow-y-auto">
                {courses.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      onSelectCourse(c.id);
                      setShowMobileCourseSheet(false);
                    }}
                    className={`w-full p-2.5 text-left border-2 border-black text-xs font-bold flex items-center justify-between cursor-pointer ${
                      c.id === selectedCourseId ? 'bg-[#FFE600] font-black shadow-[2px_2px_0px_#000]' : 'bg-white hover:bg-gray-100'
                    }`}
                  >
                    <div>
                      <span className="font-black block">{c.code} • {c.section}</span>
                      <span className="text-[10px] text-gray-700">{c.name}</span>
                    </div>
                    <span className="text-[10px] bg-black text-white px-1.5 py-0.2">
                      {c.totalStudents} STU
                    </span>
                  </button>
                ))}
              </div>

              <button
                onClick={() => {
                  setShowMobileCourseSheet(false);
                  onOpenUploadModal();
                }}
                className="w-full py-2 bg-[#00FF66] border-2 border-black font-black text-xs flex items-center justify-center space-x-1.5 shadow-[2px_2px_0px_#000] cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>+ UPLOAD NEW CLASS SHEET</span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Primary Mobile Bottom Navigation Bar (Ultra-clean, touch-friendly, optimized for phone) */}
      <nav
        id="mobile-bottom-navigation-bar"
        className="fixed bottom-0 inset-x-0 z-40 bg-white border-t-[3px] border-black shadow-[0_-4px_0px_#000] lg:hidden flex items-stretch justify-around py-1 px-1 select-none font-sans"
      >
        {/* 1. Attendance Swipe */}
        <button
          onClick={() => onTabChange('attendance')}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 px-0.5 transition-all cursor-pointer min-h-[48px] ${
            activeTab === 'attendance'
              ? 'bg-[#FFE600] border-2 border-black shadow-[1.5px_1.5px_0px_#000] font-black'
              : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Layers className="w-5 h-5 stroke-[2.5]" />
          <span className="text-[10px] font-black tracking-tight mt-0.5">SWIPE</span>
        </button>

        {/* 2. Assignment Review */}
        <button
          onClick={() => onTabChange('assignments')}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 px-0.5 transition-all cursor-pointer min-h-[48px] ${
            activeTab === 'assignments'
              ? 'bg-[#00FF66] border-2 border-black shadow-[1.5px_1.5px_0px_#000] font-black text-black'
              : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          <FileCheck className="w-5 h-5 stroke-[2.5]" />
          <span className="text-[10px] font-black tracking-tight mt-0.5">TASKS</span>
        </button>

        {/* 3. Classroom Complaints */}
        <button
          onClick={() => onTabChange('complaints')}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 px-0.5 transition-all cursor-pointer min-h-[48px] ${
            activeTab === 'complaints'
              ? 'bg-[#FF1E56] text-white border-2 border-black shadow-[1.5px_1.5px_0px_#000] font-black'
              : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          <AlertTriangle className="w-5 h-5 stroke-[2.5]" />
          <span className="text-[10px] font-black tracking-tight mt-0.5">ISSUES</span>
        </button>

        {/* 4. Campus Broadcast */}
        <button
          onClick={() => onTabChange('events')}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 px-0.5 transition-all cursor-pointer min-h-[48px] ${
            activeTab === 'events'
              ? 'bg-[#FFE600] border-2 border-black shadow-[1.5px_1.5px_0px_#000] font-black text-black'
              : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Radio className="w-5 h-5 stroke-[2.5]" />
          <span className="text-[10px] font-black tracking-tight mt-0.5">EVENTS</span>
        </button>

        {/* 5. Student Roster */}
        <button
          onClick={() => onTabChange('roster')}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 px-0.5 transition-all cursor-pointer min-h-[48px] ${
            activeTab === 'roster'
              ? 'bg-[#00E5FF] border-2 border-black shadow-[1.5px_1.5px_0px_#000] font-black text-black'
              : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Users className="w-5 h-5 stroke-[2.5]" />
          <span className="text-[10px] font-black tracking-tight mt-0.5">STUDENTS</span>
        </button>
      </nav>
    </>
  );
}
