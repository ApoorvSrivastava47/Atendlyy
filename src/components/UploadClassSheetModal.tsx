import React, { useState, useRef, useEffect } from 'react';
import {
  CalendarPlus,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Download,
  Sparkles,
  Layers,
  BookOpen,
  User,
  MapPin,
  Clock,
  X,
  FileText,
  ChevronRight,
  ArrowRight,
  Check,
  ShieldCheck,
  Lock,
  LogOut,
  Plus,
  Trash2,
  RefreshCw,
  Search,
  Upload
} from 'lucide-react';
import { Course, Student } from '../types';
import {
  parseSpreadsheetBuffer,
  convertToAppStudents,
  downloadSampleCsv,
  generateDemoMultiClassCsv,
  SheetParseResult,
  ParsedStudentRow
} from '../services/sheetParserService';
import {
  AdminClassRecord,
  getAdminClasses,
  findClassBySection,
  addOrUpdateAdminClass,
  bulkSaveAdminClasses,
  saveAdminClasses,
  isAdminAuthenticated,
  setAdminAuthenticated,
  hydrateAdminClasses
} from '../services/adminClassService';

interface UploadClassSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClassLoaded: (newCourse: Course, newStudents: Student[]) => void;
  currentInstructor?: string;
}

export function UploadClassSheetModal({
  isOpen,
  onClose,
  onClassLoaded,
  currentInstructor = 'Prof. Rajesh Sharma'
}: UploadClassSheetModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const adminFileInputRef = useRef<HTMLInputElement>(null);

  // Tab State: 'teacher' (Schedule Class) | 'admin' (Admin Portal)
  const [activeModalTab, setActiveModalTab] = useState<'teacher' | 'admin'>('teacher');

  // Admin Auth State
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => isAdminAuthenticated());
  const [adminEmailInput, setAdminEmailInput] = useState<string>('admin@campus.edu');
  const [adminPasscodeInput, setAdminPasscodeInput] = useState<string>('ADMIN2026');
  const [adminAuthError, setAdminAuthError] = useState<string | null>(null);
  const [adminClasses, setAdminClasses] = useState<AdminClassRecord[]>(() => getAdminClasses());
  const [adminSuccessMsg, setAdminSuccessMsg] = useState<string | null>(null);

  // Admin New Section Form
  const [newSectionCode, setNewSectionCode] = useState<string>('');
  const [newSectionDept, setNewSectionDept] = useState<string>('Computer Science & Engineering');
  const [newSectionSubject, setNewSectionSubject] = useState<string>('Programming & Algorithms');
  const [newSectionRawData, setNewSectionRawData] = useState<string>('');
  const [showAddSectionForm, setShowAddSectionForm] = useState<boolean>(false);

  // Teacher Schedule Class State
  const [sectionQuery, setSectionQuery] = useState<string>('1B10');
  const [matchedAdminClass, setMatchedAdminClass] = useState<AdminClassRecord | null>(null);
  const [sectionLookupAttempted, setSectionLookupAttempted] = useState<boolean>(true);

  // Faculty Lecture Details
  const [classNameInput, setClassNameInput] = useState<string>('Section 1B10');
  const [subjectNameInput, setSubjectNameInput] = useState<string>('Engineering Physics & Computing (PHY-102)');
  const [lectureTitleInput, setLectureTitleInput] = useState<string>('Lecture 14: Quantum States & Logic Gates');
  const [instructorInput, setInstructorInput] = useState<string>(currentInstructor);
  const [roomInput, setRoomInput] = useState<string>('LH-302 (Turing Hall)');

  // Faculty Custom Upload (at the very bottom of modal)
  const [facultyParseResult, setFacultyParseResult] = useState<SheetParseResult | null>(null);
  const [facultyDragActive, setFacultyDragActive] = useState<boolean>(false);
  const [facultyRawPasteOpen, setFacultyRawPasteOpen] = useState<boolean>(false);
  const [facultyRawText, setFacultyRawText] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Instant Section Lookup as teacher types or selects (defined before useEffect to avoid TDZ)
  const handleSectionLookup = (input: string, _classList: AdminClassRecord[] = adminClasses) => {
    setSectionQuery(input);
    setSectionLookupAttempted(true);

    if (!input.trim()) {
      setMatchedAdminClass(null);
      return;
    }

    const match = findClassBySection(input.trim());
    if (match) {
      setMatchedAdminClass(match);
      setClassNameInput(match.className || `Section ${match.section}`);
      if (match.defaultSubject) {
        setSubjectNameInput(match.defaultSubject);
      }
      setErrorMessage(null);
    } else {
      setMatchedAdminClass(null);
      setClassNameInput(`Section ${input.trim().toUpperCase()}`);
    }
  };

  // Refresh admin classes list and initial lookup
  useEffect(() => {
    if (isOpen) {
      void (async () => {
      const list = await hydrateAdminClasses();
      setAdminClasses(list);
      handleSectionLookup('1B10', list);
      })();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Determine current active student records (Admin matched OR Faculty uploaded)
  const getActiveStudents = (): ParsedStudentRow[] => {
    if (facultyParseResult && facultyParseResult.students.length > 0) {
      return facultyParseResult.students;
    }
    if (matchedAdminClass && matchedAdminClass.students.length > 0) {
      return matchedAdminClass.students;
    }
    return [];
  };

  const activeStudents = getActiveStudents();

  // Faculty File Upload Processing (bottom fallback)
  const handleFacultyFileProcess = async (file: File) => {
    setErrorMessage(null);
    try {
      const buffer = await file.arrayBuffer();
      const result = parseSpreadsheetBuffer(buffer, file.name);
      if (!result.success || result.students.length === 0) {
        setErrorMessage(result.errorMessage || 'No valid student records detected.');
        return;
      }
      setFacultyParseResult(result);
      if (result.detectedClasses.length > 0) {
        const topClass = result.detectedClasses[0].className;
        setClassNameInput(topClass);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to parse student spreadsheet.');
    }
  };

  // Admin Master Roster Bulk Upload Processing
  const handleAdminBulkFileUpload = async (file: File) => {
    setAdminAuthError(null);
    setAdminSuccessMsg(null);
    try {
      const buffer = await file.arrayBuffer();
      const result = parseSpreadsheetBuffer(buffer, file.name);
      if (!result.success || result.students.length === 0) {
        setAdminAuthError(result.errorMessage || 'No valid student records in file.');
        return;
      }

      // Group students by section
      const sectionGroups = new Map<string, ParsedStudentRow[]>();
      for (const st of result.students) {
        const sec = (st.section || '1B10').trim().toUpperCase();
        const existing = sectionGroups.get(sec) || [];
        existing.push(st);
        sectionGroups.set(sec, existing);
      }

      const bulkPayload = Array.from(sectionGroups.entries()).map(([sec, stList]) => ({
        section: sec,
        department: stList[0]?.department || 'Academic Department',
        students: stList
      }));

      const added = bulkSaveAdminClasses(bulkPayload, 'Campus Institutional Admin');
      const updatedList = getAdminClasses();
      setAdminClasses(updatedList);
      setAdminSuccessMsg(`Successfully uploaded ${added} section(s) (${Array.from(sectionGroups.keys()).join(', ')}) to Master Database!`);

      // If current teacher query was updated, refresh
      if (sectionQuery) {
        handleSectionLookup(sectionQuery, updatedList);
      }
    } catch (e: any) {
      setAdminAuthError(e?.message || 'Error processing master file.');
    }
  };

  // Admin Manual Section Addition
  const handleAdminAddSection = () => {
    if (!newSectionCode.trim()) {
      setAdminAuthError('Please enter a section code like 1B10 or 2B11.');
      return;
    }

    let parsedRows: ParsedStudentRow[] = [];
    if (newSectionRawData.trim()) {
      const encoder = new TextEncoder();
      const buffer = encoder.encode(newSectionRawData);
      const res = parseSpreadsheetBuffer(buffer, 'pasted.csv');
      parsedRows = res.students;
    }

    // If no raw rows entered, create 10 initial students automatically
    if (parsedRows.length === 0) {
      const sec = newSectionCode.trim().toUpperCase();
      parsedRows = Array.from({ length: 12 }, (_, i) => {
        const num = String(i + 1).padStart(2, '0');
        return {
          rollNo: `24${sec}-${num}`,
          name: `Student ${sec}-${num}`,
          phone: `+91 98100 ${sec.slice(0, 2)}${num}`,
          email: `student${num}.${sec.toLowerCase()}@campus.edu`,
          section: sec,
          department: newSectionDept
        };
      });
    }

    const secKey = newSectionCode.trim().toUpperCase();
    const newRecord: AdminClassRecord = {
      section: secKey,
      className: `Section ${secKey}`,
      department: newSectionDept,
      semester: 'Current Semester',
      defaultSubject: newSectionSubject,
      students: parsedRows,
      uploadedAt: new Date().toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      uploadedBy: 'Institutional Admin'
    };

    addOrUpdateAdminClass(newRecord);
    const updated = getAdminClasses();
    setAdminClasses(updated);
    setAdminSuccessMsg(`Saved section "${secKey}" with ${parsedRows.length} students to Admin Roster!`);
    setNewSectionCode('');
    setNewSectionRawData('');
    setShowAddSectionForm(false);

    // Refresh teacher view if section matches
    if (sectionQuery.toUpperCase() === secKey) {
      handleSectionLookup(secKey, updated);
    }
  };

  // Admin Delete Section
  const handleAdminDeleteSection = (section: string) => {
    const filtered = adminClasses.filter((c) => c.section.toUpperCase() !== section.toUpperCase());
    saveAdminClasses(filtered);
    setAdminClasses(filtered);
    setAdminSuccessMsg(`Removed section "${section}" from Master Database.`);
    if (sectionQuery.toUpperCase() === section.toUpperCase()) {
      handleSectionLookup(sectionQuery, filtered);
    }
  };

  // Admin Login Handler
  const handleAdminLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAdminAuthError(null);

    // Accept ADMIN2026, admin123, or any non-empty passcode for demonstration
    if (adminPasscodeInput.trim().length > 0) {
      setAdminAuthenticated(true);
      setIsAdminLoggedIn(true);
      setAdminSuccessMsg('Welcome, Institutional Administrator. You can now upload and manage all class rosters.');
    } else {
      setAdminAuthError('Please enter the administrator passcode (default: ADMIN2026).');
    }
  };

  const handleAdminLogout = () => {
    setAdminAuthenticated(false);
    setIsAdminLoggedIn(false);
    setAdminSuccessMsg(null);
  };

  // Launch Attendance with Loaded Class
  const handleLaunchAttendance = () => {
    if (activeStudents.length === 0) {
      setErrorMessage('No student roster found. Enter a valid section (e.g. 1B10) or upload a CSV below.');
      return;
    }

    const courseId = `COURSE-${Date.now()}`;
    const subjectCodeMatch = subjectNameInput.match(/\b([A-Z]{2,4}[-\s]?\d{3,4})\b/i);
    const subjectCode = subjectCodeMatch ? subjectCodeMatch[1].toUpperCase() : 'SUB-101';
    const sectionName = matchedAdminClass?.section || sectionQuery.trim().toUpperCase() || 'CLASS-SEC';

    const newCourse: Course = {
      id: courseId,
      code: subjectCode,
      name: subjectNameInput.trim() || 'Academic Class Session',
      instructor: instructorInput.trim() || currentInstructor,
      department: matchedAdminClass?.department || activeStudents[0]?.department || 'Academic Department',
      section: sectionName,
      room: roomInput.trim() || 'Room LH-1',
      schedule: `Today • ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      totalStudents: activeStudents.length,
      currentLecture: lectureTitleInput.trim() || 'Regular Lecture'
    };

    const newStudents = convertToAppStudents(
      activeStudents,
      courseId,
      newCourse.section,
      newCourse.department
    );

    onClassLoaded(newCourse, newStudents);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs font-mono">
      <div
        id="schedule-class-modal"
        className="bg-white border-[3.5px] border-black shadow-[9px_9px_0px_#000] w-full max-w-2xl overflow-hidden text-black flex flex-col max-h-[94vh]"
      >
        {/* Modal Top Header Bar */}
        <div className="bg-[#FFE600] px-4 sm:px-5 py-3 border-b-[3px] border-black flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 bg-black text-[#FFE600] border-2 border-black flex items-center justify-center font-black shadow-[2px_2px_0px_#000]">
              <CalendarPlus className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight text-black">
                SCHEDULE CLASS & SECTION ROSTER
              </h3>
              <p className="text-[10px] font-bold text-black uppercase">
                INSTANT SECTION RETRIEVAL • ADMIN ROSTER DATA • FACULTY SETUP
              </p>
            </div>
          </div>
          <button
            id="close-schedule-class-modal"
            onClick={onClose}
            className="p-1.5 bg-black text-white hover:bg-gray-800 border-2 border-black cursor-pointer shadow-[2px_2px_0px_#000]"
          >
            <X className="w-4 h-4 stroke-[3]" />
          </button>
        </div>

        {/* Modal Mode Selector Tabs */}
        <div className="flex border-b-2 border-black bg-[#fafafa]">
          <button
            type="button"
            onClick={() => setActiveModalTab('teacher')}
            className={`flex-1 py-2.5 px-4 text-xs font-black flex items-center justify-center space-x-2 border-r-2 border-black transition-all cursor-pointer ${
              activeModalTab === 'teacher'
                ? 'bg-white text-black shadow-[inset_0_-3px_0_#FFE600]'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <BookOpen className="w-4 h-4 stroke-[2.5]" />
            <span>FACULTY: SCHEDULE CLASS</span>
            {matchedAdminClass && (
              <span className="bg-[#00FF66] text-black px-1.5 py-0.2 text-[10px] border border-black font-black">
                READY: {matchedAdminClass.section}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveModalTab('admin')}
            className={`flex-1 py-2.5 px-4 text-xs font-black flex items-center justify-center space-x-2 transition-all cursor-pointer ${
              activeModalTab === 'admin'
                ? 'bg-white text-black shadow-[inset_0_-3px_0_#FFE600]'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <ShieldCheck className="w-4 h-4 stroke-[2.5] text-[#FF1E56]" />
            <span>ADMIN PORTAL: UPLOAD CLASSES DATA</span>
            <span className="bg-black text-[#FFE600] px-1.5 py-0.2 text-[10px] font-mono">
              {adminClasses.length} SECTIONS
            </span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* ========================================================= */}
          {/* TAB 1: TEACHER / FACULTY SCHEDULE CLASS VIEW             */}
          {/* ========================================================= */}
          {activeModalTab === 'teacher' && (
            <>
              {/* STEP 1: Enter Section / Class Code with Instant Admin Lookup */}
              <div className="p-4 bg-[#FFE600]/15 border-2 border-black shadow-[3px_3px_0px_#000] space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase text-black flex items-center space-x-1.5">
                    <span className="w-5 h-5 bg-black text-white text-center inline-block leading-5 text-[11px]">1</span>
                    <span>ENTER CLASS SECTION (e.g. 1B10, 2B11):</span>
                  </label>
                  <span className="text-[10px] bg-black text-white px-2 py-0.5 font-bold">
                    INSTANT ADMIN LOOKUP
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="relative flex-1">
                    <input
                      id="teacher-section-input"
                      type="text"
                      value={sectionQuery}
                      onChange={(e) => handleSectionLookup(e.target.value)}
                      placeholder="Type section code (e.g. 1B10, 2B11)..."
                      className="w-full p-2.5 bg-white border-2 border-black text-sm font-black uppercase text-black focus:outline-none shadow-[2px_2px_0px_#000]"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSectionLookup(sectionQuery)}
                    className="px-3.5 py-2.5 bg-black text-[#FFE600] border-2 border-black font-black text-xs cursor-pointer shadow-[2px_2px_0px_#000] hover:bg-gray-800 flex items-center space-x-1"
                  >
                    <Search className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>CHECK</span>
                  </button>
                </div>

                {/* Instant Quick-Select Section Chips from Admin Master Database */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] font-bold text-gray-700">Admin Uploaded Sections:</span>
                  {adminClasses.map((cls) => (
                    <button
                      key={cls.section}
                      type="button"
                      onClick={() => handleSectionLookup(cls.section)}
                      className={`px-2 py-0.5 text-[11px] font-mono font-black border border-black cursor-pointer transition-all ${
                        sectionQuery.toUpperCase() === cls.section.toUpperCase()
                          ? 'bg-[#FFE600] text-black shadow-[2px_2px_0px_#000] -translate-y-0.5'
                          : 'bg-white text-black hover:bg-yellow-50'
                      }`}
                    >
                      ⚡ {cls.section} ({cls.students.length})
                    </button>
                  ))}
                </div>

                {/* Outcome A: Found in Admin Database */}
                {matchedAdminClass && (
                  <div className="p-3 bg-[#00FF66] border-2 border-black shadow-[2px_2px_0px_#000] space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5 text-black font-black text-xs">
                        <CheckCircle2 className="w-4 h-4 text-black stroke-[3]" />
                        <span>INSTITUTIONAL ROSTER FOUND (ADMIN UPLOADED)</span>
                      </div>
                      <span className="px-2 py-0.5 bg-black text-white text-[10px] font-bold">
                        {matchedAdminClass.students.length} STUDENTS LOADED
                      </span>
                    </div>
                    <div className="text-[11px] text-black font-bold">
                      Section: <span className="underline">{matchedAdminClass.section}</span> • Department: {matchedAdminClass.department}
                    </div>
                    <div className="text-[10px] text-gray-800">
                      Uploaded by: {matchedAdminClass.uploadedBy} • {matchedAdminClass.uploadedAt}
                    </div>
                  </div>
                )}

                {/* Outcome B: Section NOT Available in Admin Database */}
                {!matchedAdminClass && sectionQuery.trim().length > 0 && sectionLookupAttempted && (
                  <div className="p-3 bg-[#FFE600] border-2 border-black shadow-[2px_2px_0px_#000] space-y-1">
                    <div className="flex items-center space-x-1.5 text-black font-black text-xs">
                      <AlertCircle className="w-4 h-4 text-black stroke-[2.5]" />
                      <span>SECTION "{sectionQuery.toUpperCase()}" NOT FOUND IN ADMIN DATABASE</span>
                    </div>
                    <p className="text-[11px] text-black font-medium leading-relaxed">
                      The institutional admin has not uploaded roster data for this section yet. You can still schedule this class — simply upload your student spreadsheet at the bottom below!
                    </p>
                  </div>
                )}
              </div>

              {/* STEP 2: Lecture & Subject Details */}
              <div className="p-4 bg-white border-2 border-black shadow-[3px_3px_0px_#000] space-y-3">
                <div className="border-b-2 border-black pb-1.5 flex items-center justify-between">
                  <label className="text-xs font-black uppercase text-black flex items-center space-x-1.5">
                    <span className="w-5 h-5 bg-black text-white text-center inline-block leading-5 text-[11px]">2</span>
                    <span>CLASS & LECTURE DETAILS:</span>
                  </label>
                  <span className="text-[10px] font-bold text-gray-500">FACULTY PARAMETERS</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-black uppercase text-black mb-1">
                      📖 SUBJECT NAME & CODE:
                    </label>
                    <input
                      type="text"
                      value={subjectNameInput}
                      onChange={(e) => setSubjectNameInput(e.target.value)}
                      placeholder="e.g. Computer Networks (CS-401)"
                      className="w-full p-2 bg-[#fafafa] border-2 border-black text-xs font-black text-black focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase text-black mb-1">
                      ⚡ LECTURE / SESSION TOPIC:
                    </label>
                    <input
                      type="text"
                      value={lectureTitleInput}
                      onChange={(e) => setLectureTitleInput(e.target.value)}
                      placeholder="e.g. Lecture 14: Sliding Window Protocols"
                      className="w-full p-2 bg-[#fafafa] border-2 border-black text-xs font-black text-black focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-black uppercase text-black mb-1">
                      🏛️ ROOM / HALL:
                    </label>
                    <input
                      type="text"
                      value={roomInput}
                      onChange={(e) => setRoomInput(e.target.value)}
                      placeholder="e.g. LH-302 (Turing Hall)"
                      className="w-full p-2 bg-[#fafafa] border-2 border-black text-xs font-bold text-black focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase text-black mb-1">
                      👨‍🏫 FACULTY IN CHARGE:
                    </label>
                    <input
                      type="text"
                      value={instructorInput}
                      onChange={(e) => setInstructorInput(e.target.value)}
                      placeholder="e.g. Prof. Rajesh Sharma"
                      className="w-full p-2 bg-[#fafafa] border-2 border-black text-xs font-bold text-black focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Live Student Roll Preview (if records available from admin or upload) */}
              {activeStudents.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-black flex items-center space-x-1.5">
                      <span className="w-5 h-5 bg-black text-white text-center inline-block leading-5 text-[11px]">3</span>
                      <span>
                        ROSTER READY ({activeStudents.length} STUDENTS • {matchedAdminClass ? 'ADMIN VERIFIED' : 'FACULTY LOADED'})
                      </span>
                    </span>
                    <span className="text-[10px] bg-[#00FF66] border border-black px-2 py-0.5 font-black text-black">
                      ACTIVE QUEUE
                    </span>
                  </div>

                  <div className="border-2 border-black max-h-36 overflow-y-auto shadow-[2px_2px_0px_#000]">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-black text-white uppercase text-[10px] sticky top-0">
                        <tr>
                          <th className="p-1.5 border-r border-gray-700">ROLL NO</th>
                          <th className="p-1.5 border-r border-gray-700">STUDENT NAME</th>
                          <th className="p-1.5 border-r border-gray-700">PHONE (WHATSAPP)</th>
                          <th className="p-1.5">SECTION</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y border-black bg-white">
                        {activeStudents.slice(0, 8).map((st, i) => (
                          <tr key={i} className="hover:bg-yellow-50">
                            <td className="p-1.5 font-black border-r border-black">{st.rollNo}</td>
                            <td className="p-1.5 border-r border-black font-bold">{st.name}</td>
                            <td className="p-1.5 border-r border-black underline text-gray-800">{st.phone}</td>
                            <td className="p-1.5 font-mono text-[11px]">{st.section || sectionQuery}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {activeStudents.length > 8 && (
                    <div className="text-[10px] text-gray-600 text-right font-bold">
                      + {activeStudents.length - 8} more students in queue
                    </div>
                  )}
                </div>
              )}

              {/* =================================================================== */}
              {/* STEP 3: FACULTY MANUAL CSV UPLOAD (AT THE VERY BOTTOM AS REQUESTED) */}
              {/* =================================================================== */}
              <div className="p-4 bg-[#fafafa] border-2 border-black shadow-[3px_3px_0px_#000] space-y-2.5">
                <div className="flex items-center justify-between border-b border-black pb-1.5">
                  <label className="text-xs font-black uppercase text-black flex items-center space-x-1.5">
                    <Upload className="w-4 h-4 text-black" />
                    <span>FACULTY MANUAL ROSTER UPLOAD (CSV / XLSX)</span>
                  </label>
                  <span className="text-[10px] bg-white border border-black px-1.5 py-0.5 font-bold text-gray-700">
                    USE IF SECTION NOT IN ADMIN LIST OR OVERRIDE
                  </span>
                </div>

                <p className="text-[11px] text-gray-700 font-medium">
                  If your section is not uploaded by the admin or you have a custom guest roster, upload a CSV or Excel sheet below:
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv, .xlsx, .xls, .tsv, text/csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFacultyFileProcess(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />

                {!facultyParseResult ? (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setFacultyDragActive(true);
                    }}
                    onDragLeave={() => setFacultyDragActive(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setFacultyDragActive(false);
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        handleFacultyFileProcess(e.dataTransfer.files[0]);
                      }
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`p-4 border-2 border-dashed border-black cursor-pointer text-center transition-all ${
                      facultyDragActive ? 'bg-yellow-100 border-[#FF1E56]' : 'bg-white hover:bg-yellow-50'
                    }`}
                  >
                    <FileSpreadsheet className="w-7 h-7 mx-auto text-black mb-1 stroke-[1.8]" />
                    <div className="text-xs font-black text-black">
                      CLICK TO BROWSE OR DRAG & DROP SPREADSHEET (CSV / EXCEL)
                    </div>
                    <div className="text-[10px] text-gray-600 font-bold mt-0.5">
                      Columns: Roll No, Student Name, Phone, Section
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5 bg-[#00FF66] border-2 border-black flex items-center justify-between shadow-[2px_2px_0px_#000]">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-black stroke-[3]" />
                      <div className="text-xs font-black text-black">
                        FILE LOADED: {facultyParseResult.fileName} ({facultyParseResult.students.length} Students)
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2 py-0.5 bg-white border border-black text-[10px] font-black cursor-pointer"
                    >
                      CHANGE FILE
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-between pt-1 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setFacultyRawPasteOpen(!facultyRawPasteOpen)}
                    className="underline text-black font-bold hover:text-[#00E5FF]"
                  >
                    {facultyRawPasteOpen ? 'Hide text paste box' : 'Or paste comma/tab-separated student text'}
                  </button>

                  <button
                    type="button"
                    onClick={downloadSampleCsv}
                    className="underline text-black font-bold hover:text-[#FF1E56] flex items-center space-x-1"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download sample format</span>
                  </button>
                </div>

                {facultyRawPasteOpen && (
                  <div className="p-2.5 bg-white border border-black space-y-2">
                    <textarea
                      rows={3}
                      value={facultyRawText}
                      onChange={(e) => setFacultyRawText(e.target.value)}
                      placeholder="Roll No,Student Name,Section,Phone&#10;24B10-01,Aarav Sharma,1B10,+919812345601&#10;24B10-02,Ananya Verma,1B10,+919812345602"
                      className="w-full p-2 bg-[#fafafa] border border-black text-xs font-mono focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!facultyRawText.trim()) return;
                        const encoder = new TextEncoder();
                        const buffer = encoder.encode(facultyRawText);
                        const res = parseSpreadsheetBuffer(buffer, 'faculty_pasted.csv');
                        if (res.students.length > 0) {
                          setFacultyParseResult(res);
                          setFacultyRawPasteOpen(false);
                        } else {
                          setErrorMessage('Could not parse pasted records.');
                        }
                      }}
                      className="px-2.5 py-1 bg-black text-white text-[11px] font-black cursor-pointer"
                    >
                      PARSE PASTED ROSTER
                    </button>
                  </div>
                )}

                {errorMessage && (
                  <div className="p-2 bg-[#FF1E56] text-white border-2 border-black text-xs font-bold flex items-center space-x-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ========================================================= */}
          {/* TAB 2: ADMIN PORTAL - UPLOAD ALL CLASSES (1B10, 2B11...)   */}
          {/* ========================================================= */}
          {activeModalTab === 'admin' && (
            <div className="space-y-4">
              {!isAdminLoggedIn ? (
                /* Admin Login View */
                <div className="p-6 bg-[#fafafa] border-[3px] border-black shadow-[4px_4px_0px_#000] space-y-4">
                  <div className="flex items-center space-x-2.5 border-b-2 border-black pb-3">
                    <div className="w-10 h-10 bg-black text-[#FFE600] border-2 border-black flex items-center justify-center">
                      <Lock className="w-5 h-5 stroke-[2.5]" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black uppercase text-black">
                        INSTITUTIONAL ADMINISTRATOR SIGN-IN
                      </h4>
                      <p className="text-[11px] font-bold text-gray-600">
                        Upload & manage official rosters for all sections (1B10, 2B11, etc.)
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleAdminLogin} className="space-y-3">
                    <div>
                      <label className="block text-xs font-black uppercase text-black mb-1">
                        ADMINISTRATOR ID / EMAIL:
                      </label>
                      <input
                        type="email"
                        value={adminEmailInput}
                        onChange={(e) => setAdminEmailInput(e.target.value)}
                        placeholder="admin@campus.edu"
                        className="w-full p-2.5 bg-white border-2 border-black text-xs font-black text-black focus:outline-none shadow-[2px_2px_0px_#000]"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase text-black mb-1">
                        ADMIN PASSCODE / PIN:
                      </label>
                      <input
                        type="password"
                        value={adminPasscodeInput}
                        onChange={(e) => setAdminPasscodeInput(e.target.value)}
                        placeholder="Enter admin passcode (e.g. ADMIN2026)"
                        className="w-full p-2.5 bg-white border-2 border-black text-xs font-black text-black focus:outline-none shadow-[2px_2px_0px_#000]"
                        required
                      />
                    </div>

                    {adminAuthError && (
                      <div className="p-2.5 bg-[#FF1E56] text-white border-2 border-black text-xs font-bold flex items-center space-x-1.5">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{adminAuthError}</span>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
                      <button
                        type="submit"
                        className="w-full sm:flex-1 py-2.5 bg-black text-[#FFE600] border-2 border-black font-black text-xs shadow-[3px_3px_0px_#000] hover:bg-gray-800 cursor-pointer flex items-center justify-center space-x-1.5"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>SIGN IN AS ADMIN</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setAdminAuthenticated(true);
                          setIsAdminLoggedIn(true);
                          setAdminSuccessMsg('Logged in via Quick Demo Admin.');
                        }}
                        className="w-full sm:w-auto px-4 py-2.5 bg-[#00FF66] text-black border-2 border-black font-black text-xs shadow-[3px_3px_0px_#000] hover:bg-[#15f375] cursor-pointer"
                      >
                        ⚡ 1-CLICK DEMO ADMIN LOGIN
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                /* Logged In Admin Class Management Hub */
                <div className="space-y-4">
                  {/* Admin Status Banner */}
                  <div className="p-3 bg-black text-white border-2 border-black flex items-center justify-between shadow-[3px_3px_0px_#FFE600]">
                    <div className="flex items-center space-x-2">
                      <ShieldCheck className="w-5 h-5 text-[#00FF66] stroke-[2.5]" />
                      <div>
                        <div className="text-xs font-black">ADMINISTRATOR ACTIVE: {adminEmailInput}</div>
                        <div className="text-[10px] text-gray-300 font-mono">
                          Master Database: {adminClasses.length} institutional sections active
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleAdminLogout}
                      className="px-2.5 py-1 bg-white text-black border border-white text-[11px] font-black hover:bg-gray-200 cursor-pointer flex items-center space-x-1"
                    >
                      <LogOut className="w-3 h-3" />
                      <span>LOGOUT</span>
                    </button>
                  </div>

                  {adminSuccessMsg && (
                    <div className="p-2.5 bg-[#00FF66] border-2 border-black text-black text-xs font-black flex items-center justify-between shadow-[2px_2px_0px_#000]">
                      <div className="flex items-center space-x-1.5">
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>{adminSuccessMsg}</span>
                      </div>
                      <button onClick={() => setAdminSuccessMsg(null)} className="cursor-pointer">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Feature 1: Bulk Master CSV Upload (All Classes like 1B10, 2B11) */}
                  <div className="p-4 bg-white border-2 border-black shadow-[3px_3px_0px_#000] space-y-3">
                    <div className="flex items-center justify-between border-b-2 border-black pb-1.5">
                      <div className="flex items-center space-x-1.5">
                        <FileSpreadsheet className="w-4 h-4 text-black" />
                        <h4 className="text-xs font-black uppercase text-black">
                          BULK UPLOAD ALL CLASSES DATA (1B10, 2B11, etc.)
                        </h4>
                      </div>
                      <span className="text-[10px] bg-[#FFE600] px-1.5 py-0.5 border border-black font-black">
                        MULTI-CLASS CSV / EXCEL
                      </span>
                    </div>

                    <p className="text-xs text-gray-700 font-medium">
                      Upload an institutional master spreadsheet containing student lists for multiple sections (e.g. 1B10, 2B11). As teachers enter section names, their rosters will be loaded instantly!
                    </p>

                    <input
                      ref={adminFileInputRef}
                      type="file"
                      accept=".csv, .xlsx, .xls, .tsv"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleAdminBulkFileUpload(e.target.files[0]);
                        }
                      }}
                      className="hidden"
                    />

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => adminFileInputRef.current?.click()}
                        className="px-4 py-2 bg-[#FFE600] text-black border-2 border-black font-black text-xs shadow-[2px_2px_0px_#000] hover:shadow-[4px_4px_0px_#000] cursor-pointer flex items-center space-x-1.5"
                      >
                        <Upload className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>SELECT MASTER SPREADSHEET</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const demoCsv = generateDemoMultiClassCsv();
                          const encoder = new TextEncoder();
                          const buffer = encoder.encode(demoCsv);
                          const file = new File([buffer], 'Campus_Master_Roster_Demo.csv', { type: 'text/csv' });
                          handleAdminBulkFileUpload(file);
                        }}
                        className="px-3 py-2 bg-white text-black border-2 border-black font-black text-xs hover:bg-gray-100 cursor-pointer flex items-center space-x-1"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-[#FF1E56]" />
                        <span>LOAD DEMO ALL-CLASSES DATA</span>
                      </button>
                    </div>
                  </div>

                  {/* Feature 2: Registered Sections in Database */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black uppercase text-black flex items-center space-x-1.5">
                        <Layers className="w-4 h-4" />
                        <span>REGISTERED INSTITUTIONAL SECTIONS ({adminClasses.length})</span>
                      </h4>
                      <button
                        type="button"
                        onClick={() => setShowAddSectionForm(!showAddSectionForm)}
                        className="px-2 py-1 bg-black text-[#FFE600] text-[11px] font-black border border-black cursor-pointer flex items-center space-x-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>{showAddSectionForm ? 'CLOSE FORM' : 'ADD SINGLE SECTION'}</span>
                      </button>
                    </div>

                    {showAddSectionForm && (
                      <div className="p-3.5 bg-[#fafafa] border-2 border-black space-y-2.5 shadow-[2px_2px_0px_#000]">
                        <div className="text-xs font-black uppercase text-black">
                          CREATE NEW CLASS SECTION:
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <input
                            type="text"
                            value={newSectionCode}
                            onChange={(e) => setNewSectionCode(e.target.value)}
                            placeholder="Section code (e.g. 1B10, 3CS4)..."
                            className="p-2 bg-white border border-black text-xs font-black uppercase focus:outline-none"
                          />
                          <input
                            type="text"
                            value={newSectionDept}
                            onChange={(e) => setNewSectionDept(e.target.value)}
                            placeholder="Department name..."
                            className="p-2 bg-white border border-black text-xs font-bold focus:outline-none"
                          />
                          <input
                            type="text"
                            value={newSectionSubject}
                            onChange={(e) => setNewSectionSubject(e.target.value)}
                            placeholder="Default subject name..."
                            className="p-2 bg-white border border-black text-xs font-bold focus:outline-none"
                          />
                        </div>
                        <textarea
                          rows={2}
                          value={newSectionRawData}
                          onChange={(e) => setNewSectionRawData(e.target.value)}
                          placeholder="Optional: Paste student list (Roll No, Name, Phone) or leave blank for auto-generated 12 students"
                          className="w-full p-2 bg-white border border-black text-xs font-mono focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleAdminAddSection}
                          className="px-3.5 py-1.5 bg-[#00FF66] text-black border-2 border-black font-black text-xs cursor-pointer shadow-[2px_2px_0px_#000]"
                        >
                          SAVE SECTION TO MASTER DATABASE
                        </button>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {adminClasses.map((cls) => (
                        <div
                          key={cls.section}
                          className="p-3 bg-white border-2 border-black shadow-[2px_2px_0px_#000] flex flex-col justify-between"
                        >
                          <div className="flex items-center justify-between border-b border-gray-300 pb-1 mb-1.5">
                            <div className="flex items-center space-x-1.5">
                              <span className="px-2 py-0.5 bg-[#FFE600] text-black font-black text-xs border border-black">
                                SECTION {cls.section}
                              </span>
                              <span className="text-[11px] font-bold text-gray-700">
                                {cls.students.length} Students
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleAdminDeleteSection(cls.section)}
                              className="p-1 text-gray-500 hover:text-[#FF1E56] hover:bg-gray-100 cursor-pointer"
                              title={`Delete section ${cls.section}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="text-xs font-bold text-black truncate">
                            {cls.className || cls.defaultSubject || cls.department}
                          </div>
                          <div className="text-[10px] text-gray-500 mt-1 flex items-center justify-between">
                            <span>By {cls.uploadedBy}</span>
                            <button
                              type="button"
                              onClick={() => {
                                handleSectionLookup(cls.section);
                                setActiveModalTab('teacher');
                              }}
                              className="text-black font-black underline hover:text-[#00E5FF] cursor-pointer"
                            >
                              Test in Faculty Tab ⟶
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Bottom Footer Actions */}
        <div className="p-3.5 px-5 bg-[#fafafa] border-t-[3px] border-black flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs font-bold text-gray-700 flex items-center space-x-1.5 self-start sm:self-auto">
            {activeModalTab === 'teacher' ? (
              activeStudents.length > 0 ? (
                <span className="text-black font-black flex items-center space-x-1">
                  <span>✅</span>
                  <span>
                    {activeStudents.length} Students ready for Section{' '}
                    <span className="bg-[#FFE600] px-1 border border-black font-black">
                      {matchedAdminClass?.section || sectionQuery.toUpperCase() || 'CLASS'}
                    </span>
                  </span>
                </span>
              ) : (
                <span className="text-gray-600">
                  Enter an admin section (e.g. 1B10) or upload a CSV below to proceed.
                </span>
              )
            ) : (
              <span className="text-black font-black">
                Administrator Mode • Changes save immediately for all teachers.
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 border-2 border-black bg-white text-xs font-black text-black hover:bg-gray-100 cursor-pointer"
            >
              CLOSE
            </button>

            {activeModalTab === 'teacher' ? (
              <button
                id="confirm-launch-attendance-btn"
                type="button"
                onClick={handleLaunchAttendance}
                disabled={activeStudents.length === 0}
                className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-5 py-2.5 bg-[#00FF66] border-2 border-black text-black font-black text-xs shadow-[3px_3px_0px_#000] hover:shadow-[5px_5px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>LOAD CLASS & TAKE ATTENDANCE</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setActiveModalTab('teacher');
                  if (adminClasses.length > 0) {
                    handleSectionLookup(adminClasses[0].section);
                  }
                }}
                className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 px-4 py-2 bg-[#FFE600] border-2 border-black text-black font-black text-xs cursor-pointer shadow-[2px_2px_0px_#000]"
              >
                <span>SWITCH TO TEACHER VIEW</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
