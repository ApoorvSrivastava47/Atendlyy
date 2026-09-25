import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Student, Course, NoticeItem, CampusEvent, GoogleDriveStatus } from './types';
import { INITIAL_COURSES, INITIAL_STUDENTS, INITIAL_NOTICES, INITIAL_CAMPUS_EVENTS } from './data/mockData';
import { Header, NavigationTab } from './components/Header';
import { TinderAttendance } from './components/TinderAttendance';
import { AssignmentReview } from './components/AssignmentReview';
import { ComplaintSection } from './components/ComplaintSection';
import { CampusEventBroadcast } from './components/CampusEventBroadcast';
import { SideEventDrawer } from './components/SideEventDrawer';
import { StudentDirectory } from './components/StudentDirectory';
import { WhatsAppDirectModal } from './components/WhatsAppDirectModal';
import { GoogleSheetsModal } from './components/GoogleSheetsModal';
import { UploadClassSheetModal } from './components/UploadClassSheetModal';
import { AuthScreen } from './components/AuthScreen';
import { GoogleDriveModal } from './components/GoogleDriveModal';
import { initAuth, logoutUser } from './services/googleAuthService';
import { getSavedDriveInfo, clearDriveInfo, ensureFacultyDriveFolder, ensureMasterSheet } from './services/googleDriveService';
import { isAppOnline, hydrateSheetsState } from './services/sheetsService';
import { loadCloudState, saveCloudState } from './services/cloudStateService';
import { CheckCircle2, X, Radio } from 'lucide-react';

const COURSES_STORAGE_KEY = 'campusflow_courses_data';
const STUDENTS_STORAGE_KEY = 'campusflow_students_data';
const NOTICES_STORAGE_KEY = 'campusflow_notices_data';
const EVENTS_STORAGE_KEY = 'campusflow_campus_events';
const AUTH_MODE_KEY = 'atendly_auth_mode';

export default function App() {
  const [courses, setCourses] = useState<Course[]>(() => {
    try {
      const saved = localStorage.getItem(COURSES_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading stored courses', e);
    }
    return INITIAL_COURSES;
  });

  const [selectedCourseId, setSelectedCourseId] = useState<string>(() => {
    return courses[0]?.id || 'CS301';
  });

  // Load students from localStorage or initial mock data
  const [students, setStudents] = useState<Student[]>(() => {
    try {
      const saved = localStorage.getItem(STUDENTS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading stored students', e);
    }
    return INITIAL_STUDENTS;
  });

  // Load campus events
  const [campusEvents, setCampusEvents] = useState<CampusEvent[]>(() => {
    try {
      const saved = localStorage.getItem(EVENTS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading campus events', e);
    }
    return INITIAL_CAMPUS_EVENTS;
  });

  const [activeTab, setActiveTab] = useState<NavigationTab>('attendance');
  const [isOnline, setIsOnline] = useState<boolean>(isAppOnline());

  // Authentication & Google Drive Storage State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem(AUTH_MODE_KEY) !== null;
  });
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [driveStatus, setDriveStatus] = useState<GoogleDriveStatus>(() => {
    const saved = getSavedDriveInfo();
    return {
      isConnected: false,
      userEmail: null,
      userName: null,
      userAvatar: null,
      folderId: saved.folderId,
      folderUrl: saved.folderUrl,
      spreadsheetId: saved.sheetId,
      spreadsheetUrl: saved.sheetUrl,
      lastSyncedAt: null,
      isSyncing: false,
      error: null
    };
  });
  const [driveModalOpen, setDriveModalOpen] = useState<boolean>(false);

  // Modals & Drawers state
  const [whatsAppModalOpen, setWhatsAppModalOpen] = useState<boolean>(false);
  const [selectedWhatsAppStudent, setSelectedWhatsAppStudent] = useState<Student | null>(null);
  const [whatsAppReason, setWhatsAppReason] = useState<string | undefined>(undefined);
  const [sheetsModalOpen, setSheetsModalOpen] = useState<boolean>(false);
  const [uploadModalOpen, setUploadModalOpen] = useState<boolean>(false);
  const [sideEventDrawerOpen, setSideEventDrawerOpen] = useState<boolean>(false);

  // Success Notification Toast for Class Upload
  const [toastMessage, setToastMessage] = useState<{
    title: string;
    subtitle: string;
  } | null>(null);

  // Listen for Firebase Auth state on mount
  useEffect(() => {
    const unsubscribe = initAuth(
      async (user, token) => {
        setAccessToken(token);
        localStorage.setItem(AUTH_MODE_KEY, 'google');
        setIsAuthenticated(true);

        // Hydrate the Supabase-backed app state for this faculty account.
        const [cloudCourses, cloudStudents, cloudEvents] = await Promise.all([
          loadCloudState('courses', INITIAL_COURSES),
          loadCloudState('students', INITIAL_STUDENTS),
          loadCloudState('campus_events', INITIAL_CAMPUS_EVENTS),
        ]);
        setCourses(cloudCourses);
        setStudents(cloudStudents);
        setCampusEvents(cloudEvents);
        await hydrateSheetsState();

        const saved = getSavedDriveInfo();
        setDriveStatus((prev) => ({
          ...prev,
          isConnected: true,
          userEmail: user.email,
          userName: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Faculty Member',
          userAvatar: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
          folderId: saved.folderId,
          folderUrl: saved.folderUrl,
          spreadsheetId: saved.sheetId,
          spreadsheetUrl: saved.sheetUrl,
          isSyncing: true
        }));

        // Google Drive/Sheets is an optional integration on top of Supabase.
        // A provider token is normally available immediately after Google OAuth.
        if (!token) {
          setDriveStatus((prev) => ({
            ...prev,
            isSyncing: false,
            error: 'Google Drive token is unavailable after refresh. Sign in with Google again to reconnect Drive/Sheets.'
          }));
          return;
        }
        try {
          const folder = await ensureFacultyDriveFolder(token);
          const sheet = await ensureMasterSheet(token, folder.id);
          const nextStatus = {
            isConnected: true,
            userEmail: user.email,
            userName: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Faculty Member',
            userAvatar: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
            folderId: folder.id,
            folderUrl: folder.webViewLink,
            spreadsheetId: sheet.id,
            spreadsheetUrl: sheet.webViewLink,
            lastSyncedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isSyncing: false,
            error: null
          };
          setDriveStatus(nextStatus);
        } catch (driveError: any) {
          console.warn('Google Drive setup skipped:', driveError);
          setDriveStatus((prev) => ({
            ...prev,
            isSyncing: false,
            error: driveError?.message || 'Google Drive setup failed. Supabase data is still connected.'
          }));
        }
      },
      () => {
        const mode = localStorage.getItem(AUTH_MODE_KEY);
        if (mode !== 'guest') {
          setIsAuthenticated(false);
          setAccessToken(null);
        }
      }
    );
    return () => unsubscribe();
  }, []);

  const handleAuthSuccess = (newStatus: GoogleDriveStatus, token: string) => {
    localStorage.setItem(AUTH_MODE_KEY, 'google');
    setAccessToken(token);
    setDriveStatus(newStatus);
    setIsAuthenticated(true);
    setToastMessage({
      title: 'GOOGLE DRIVE & SHEETS CONNECTED',
      subtitle: `Logged in as ${newStatus.userEmail}. Faculty folder & sheets initialized in your Drive.`
    });
  };

  const handleContinueAsGuest = () => {
    localStorage.setItem(AUTH_MODE_KEY, 'guest');
    setIsAuthenticated(true);
  };

  const handleSignOut = async () => {
    await logoutUser();
    clearDriveInfo();
    localStorage.removeItem(AUTH_MODE_KEY);
    setAccessToken(null);
    setDriveStatus({
      isConnected: false,
      userEmail: null,
      userName: null,
      userAvatar: null,
      folderId: null,
      folderUrl: null,
      spreadsheetId: null,
      spreadsheetUrl: null,
      lastSyncedAt: null,
      isSyncing: false,
      error: null
    });
    setDriveModalOpen(false);
    setIsAuthenticated(false);
  };

  // Sync state changes to storage
  useEffect(() => {
    localStorage.setItem(COURSES_STORAGE_KEY, JSON.stringify(courses));
    void saveCloudState('courses', courses);
  }, [courses]);

  useEffect(() => {
    localStorage.setItem(STUDENTS_STORAGE_KEY, JSON.stringify(students));
    void saveCloudState('students', students);
  }, [students]);

  useEffect(() => {
    localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(campusEvents));
    void saveCloudState('campus_events', campusEvents);
  }, [campusEvents]);

  // Track network connectivity & classroom offline simulation
  useEffect(() => {
    const handleNetworkChange = () => {
      setIsOnline(isAppOnline());
    };

    window.addEventListener('online', handleNetworkChange);
    window.addEventListener('offline', handleNetworkChange);
    window.addEventListener('campusflow-network-change', handleNetworkChange);

    return () => {
      window.removeEventListener('online', handleNetworkChange);
      window.removeEventListener('offline', handleNetworkChange);
      window.removeEventListener('campusflow-network-change', handleNetworkChange);
    };
  }, []);

  const activeCourse = courses.find((c) => c.id === selectedCourseId) || courses[0];

  // Specific students for active class
  const activeClassStudents = students.filter(
    (s) =>
      s.courseId === activeCourse?.id ||
      (s.section &&
        activeCourse?.section &&
        s.section.toLowerCase().trim() === activeCourse.section.toLowerCase().trim())
  );
  const displayedStudents = activeClassStudents.length > 0 ? activeClassStudents : students;

  // Handle uploaded class sheet: immediately load class data and switch to attendance
  const handleClassLoaded = (newCourse: Course, newStudents: Student[]) => {
    // 1. Add new course
    setCourses((prev) => [newCourse, ...prev.filter((c) => c.id !== newCourse.id)]);
    // 2. Select this course immediately
    setSelectedCourseId(newCourse.id);
    // 3. Add or update students
    setStudents((prev) => {
      const remainingStudents = prev.filter(
        (s) =>
          !(s.courseId === newCourse.id || (newStudents.some((ns) => ns.rollNo === s.rollNo && s.section === newCourse.section)))
      );
      return [...newStudents, ...remainingStudents];
    });
    // 4. Switch immediately to Tinder swipe roll call tab
    setActiveTab('attendance');
    // 5. Provide celebratory confirmation toast
    setToastMessage({
      title: `CLASS LOADED: ${newCourse.section} • ${newCourse.name}`,
      subtitle: `${newStudents.length} students loaded in roll sequence for "${newCourse.currentLecture || 'Session'}". Ready to take attendance!`
    });

    setTimeout(() => {
      setToastMessage(null);
    }, 7000);
  };

  const handleOpenWhatsApp = (student: Student, defaultReason?: string) => {
    setSelectedWhatsAppStudent(student);
    setWhatsAppReason(defaultReason);
    setWhatsAppModalOpen(true);
  };

  const handleAddCampusEvent = (newEvent: CampusEvent) => {
    setCampusEvents((prev) => [newEvent, ...prev]);
    // Also trigger feedback toast
    setToastMessage({
      title: `EVENT BROADCASTED: ${newEvent.title}`,
      subtitle: `Dispatched to Deans, HODs, and invited branches: ${newEvent.branches.join(', ')}.`
    });
    setTimeout(() => {
      setToastMessage(null);
    }, 6000);
  };

  const handleAddStudent = (newStudent: Student) => {
    setStudents((prev) => [...prev, newStudent]);
  };

  const liveEventsCount = campusEvents.filter((e) => e.isLive).length;

  // Gate app behind Login Window if not authenticated
  if (!isAuthenticated) {
    return (
      <AuthScreen
        onAuthSuccess={handleAuthSuccess}
        onContinueAsGuest={handleContinueAsGuest}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F4F0] text-black flex flex-col font-sans antialiased tracking-[-0.015em] selection:bg-[#FFE600] selection:text-black relative overflow-x-hidden">
      {/* Top Notification Toast for Instant Feedback */}
      {toastMessage && (
        <div
          id="faculty-class-loaded-toast"
          className="fixed bottom-20 sm:bottom-5 right-4 sm:right-5 z-50 bg-[#00FF66] border-[3px] border-black shadow-[4px_4px_0px_#000] p-3.5 max-w-sm sm:max-w-md animate-bounce-short text-black"
        >
          <div className="flex items-start justify-between space-x-2.5">
            <div className="flex items-start space-x-2">
              <CheckCircle2 className="w-5 h-5 mt-0.5 text-black stroke-[2.5] shrink-0" />
              <div>
                <h4 className="text-xs font-black uppercase text-black">{toastMessage.title}</h4>
                <p className="text-[11px] font-bold text-gray-900 mt-0.5 leading-snug">
                  {toastMessage.subtitle}
                </p>
              </div>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="p-1 hover:bg-black/10 border border-black text-black cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Top Application Bar */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        courses={courses}
        selectedCourseId={selectedCourseId}
        onSelectCourse={setSelectedCourseId}
        onOpenSheetsModal={() => setSheetsModalOpen(true)}
        onOpenQuickWhatsApp={() => {
          setSelectedWhatsAppStudent(displayedStudents[0] || students[0]);
          setWhatsAppModalOpen(true);
        }}
        onOpenUploadModal={() => setUploadModalOpen(true)}
        onOpenSideDrawer={() => setSideEventDrawerOpen(true)}
        liveEventsCount={liveEventsCount}
        isOnline={isOnline}
        driveStatus={driveStatus}
        onOpenDriveModal={() => setDriveModalOpen(true)}
      />

      {/* Main Container - optimized for mobile with pb-24 padding to prevent bottom bar overlap */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-2.5 sm:px-6 lg:px-8 py-4 sm:py-6 pb-24 lg:pb-8 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: [0.25, 1, 0.5, 1] }}
            className="w-full"
          >
            {activeTab === 'attendance' && (
              <TinderAttendance
                course={activeCourse}
                students={displayedStudents}
                onOpenWhatsApp={handleOpenWhatsApp}
                onViewSheetsModal={() => setSheetsModalOpen(true)}
                onOpenUploadSheet={() => setUploadModalOpen(true)}
                driveStatus={driveStatus}
                accessToken={accessToken}
                onOpenDriveModal={() => setDriveModalOpen(true)}
              />
            )}

            {activeTab === 'assignments' && (
              <AssignmentReview
                course={activeCourse}
                students={displayedStudents}
                onOpenWhatsApp={handleOpenWhatsApp}
                driveStatus={driveStatus}
                accessToken={accessToken}
              />
            )}

            {activeTab === 'complaints' && (
              <ComplaintSection
                currentFacultyName={activeCourse.instructor}
                defaultClassroom={activeCourse.room}
              />
            )}

            {activeTab === 'events' && (
              <CampusEventBroadcast
                events={campusEvents}
                onAddEvent={handleAddCampusEvent}
                currentFacultyName={activeCourse.instructor}
                onOpenSideDrawer={() => setSideEventDrawerOpen(true)}
              />
            )}

            {activeTab === 'roster' && (
              <StudentDirectory
                students={students}
                onOpenWhatsApp={handleOpenWhatsApp}
                onAddStudent={handleAddStudent}
                onOpenUploadModal={() => setUploadModalOpen(true)}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Floating Side Event Trigger for Mobile (Quick 1-tap view of ongoing broadcasts) */}
      <div className="fixed bottom-18 right-3 z-30 lg:hidden">
        <button
          onClick={() => setSideEventDrawerOpen(true)}
          className="px-3 py-2 bg-[#FF1E56] text-white border-2 border-black shadow-[3px_3px_0px_#000] text-xs font-black flex items-center space-x-1.5 active:translate-y-0.5 cursor-pointer"
        >
          <Radio className="w-3.5 h-3.5 animate-pulse" />
          <span>{liveEventsCount} LIVE EVENTS</span>
        </button>
      </div>

      {/* Ongoing Events & Broadcast Side Pop-Up Drawer */}
      <SideEventDrawer
        isOpen={sideEventDrawerOpen}
        onClose={() => setSideEventDrawerOpen(false)}
        events={campusEvents}
        onOpenFullHub={() => setActiveTab('events')}
      />

      {/* Direct WhatsApp Messaging Modal (Exclusive Student Chat) */}
      <WhatsAppDirectModal
        isOpen={whatsAppModalOpen}
        onClose={() => setWhatsAppModalOpen(false)}
        students={displayedStudents}
        initialStudent={selectedWhatsAppStudent}
        courseCode={activeCourse.code}
        defaultReason={whatsAppReason}
      />

      {/* Offline-First Google Sheets Sync Hub Modal */}
      <GoogleSheetsModal
        isOpen={sheetsModalOpen}
        onClose={() => setSheetsModalOpen(false)}
      />

      {/* Faculty Class Sheet Upload & Lecture Setup Modal */}
      <UploadClassSheetModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onClassLoaded={handleClassLoaded}
        currentInstructor={activeCourse.instructor}
      />

      {/* Teacher's Google Drive & Master Sheets Storage Manager */}
      <GoogleDriveModal
        isOpen={driveModalOpen}
        onClose={() => setDriveModalOpen(false)}
        driveStatus={driveStatus}
        accessToken={accessToken}
        students={students}
        currentCourseCode={activeCourse.code}
        onSignOut={handleSignOut}
        onDriveStatusUpdate={setDriveStatus}
      />
    </div>
  );
}
