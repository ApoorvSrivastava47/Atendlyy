import React, { useState } from 'react';
import { Student } from '../types';
import {
  Search,
  Plus,
  MessageSquare,
  AlertTriangle,
  GraduationCap,
  X,
  UserPlus,
  Upload
} from 'lucide-react';

interface StudentDirectoryProps {
  students: Student[];
  onAddStudent: (newStudent: Student) => void;
  onOpenWhatsApp: (student: Student, defaultReason?: string) => void;
  onOpenUploadModal?: () => void;
}

export function StudentDirectory({
  students,
  onAddStudent,
  onOpenWhatsApp,
  onOpenUploadModal
}: StudentDirectoryProps) {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filter, setFilter] = useState<'all' | 'low-attendance' | 'high-performers'>('all');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // Form state for adding a student
  const [name, setName] = useState<string>('');
  const [rollNo, setRollNo] = useState<string>('');
  const [phone, setPhone] = useState<string>('+91 ');
  const [email, setEmail] = useState<string>('');
  const [section, setSection] = useState<string>('CSE-A');

  const filteredStudents = students
    .filter((s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.rollNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.phone.includes(searchTerm);

      if (!matchesSearch) return false;

      const attPct = Math.round(
        ((s.stats.attended + s.stats.eventDuty) / (s.stats.totalClasses || 1)) * 100
      );

      if (filter === 'low-attendance') return attPct < 75;
      if (filter === 'high-performers') return s.grades.gpa >= 3.8;
      return true;
    })
    .sort((a, b) => a.rollNo.localeCompare(b.rollNo));

  const handleEnrollSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !rollNo) return;

    const newStudent: Student = {
      id: `stud-${Date.now()}`,
      rollNo: rollNo.trim().toUpperCase(),
      name: name.trim(),
      email: email.trim() || `${name.toLowerCase().replace(/\s+/g, '.')}@college.edu`,
      phone: phone.trim() || '+91 98765 43210',
      avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
      section,
      semester: '6th Semester',
      batch: '2022-2026',
      department: 'Computer Science & Engineering',
      stats: {
        totalClasses: 32,
        attended: 30,
        absent: 2,
        eventDuty: 0
      },
      grades: {
        courseId: 'CS301',
        assignments: 85,
        midterm: 88,
        finalExam: 90,
        gpa: 3.8,
        letterGrade: 'A'
      }
    };

    onAddStudent(newStudent);
    setName('');
    setRollNo('');
    setPhone('+91 ');
    setEmail('');
    setShowAddModal(false);
  };

  return (
    <div id="student-directory-container" className="w-full max-w-5xl mx-auto space-y-5 font-mono">
      {/* Top Header in Neo-Pop Style */}
      <div className="bg-white border-[3px] border-black shadow-[5px_5px_0px_#000] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-black">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 text-xs font-black bg-[#FFE600] border border-black uppercase text-black">
              ROSTER BY ROLL SEQUENCE
            </span>
            <span className="text-xs font-bold text-gray-700">
              {students.length} ENROLLED STUDENTS
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-black mt-1">
            CLASS STUDENT DIRECTORY
          </h2>
          <p className="text-xs font-bold text-gray-600 mt-0.5">
            1-click instant WhatsApp communication using student phone numbers.
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          {onOpenUploadModal && (
            <button
              onClick={onOpenUploadModal}
              className="px-3.5 py-2 bg-[#FFE600] border-2 border-black shadow-[3px_3px_0px_#000] text-black font-black text-xs hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer flex items-center space-x-1.5"
            >
              <Upload className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>UPLOAD SHEET</span>
            </button>
          )}

          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-2 bg-[#00FF66] border-2 border-black shadow-[3px_3px_0px_#000] text-black font-black text-xs hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
          >
            + ENROLL NEW STUDENT
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-black" />
          <input
            type="text"
            placeholder="Search by roll number, name or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border-2 border-black text-xs font-bold text-black focus:outline-none shadow-[2px_2px_0px_#000]"
          />
        </div>

        <div className="flex items-center space-x-1.5 self-stretch sm:self-auto justify-center">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 text-xs font-black border-2 border-black cursor-pointer ${
              filter === 'all'
                ? 'bg-[#FFE600] text-black shadow-[2px_2px_0px_#000]'
                : 'bg-white hover:bg-gray-100'
            }`}
          >
            ALL ({students.length})
          </button>
          <button
            onClick={() => setFilter('low-attendance')}
            className={`px-3 py-1.5 text-xs font-black border-2 border-black cursor-pointer ${
              filter === 'low-attendance'
                ? 'bg-[#FF1E56] text-white shadow-[2px_2px_0px_#000]'
                : 'bg-white hover:bg-gray-100'
            }`}
          >
            &lt;75% ATTENDANCE
          </button>
          <button
            onClick={() => setFilter('high-performers')}
            className={`px-3 py-1.5 text-xs font-black border-2 border-black cursor-pointer ${
              filter === 'high-performers'
                ? 'bg-[#00FF66] text-black shadow-[2px_2px_0px_#000]'
                : 'bg-white hover:bg-gray-100'
            }`}
          >
            GPA &gt;3.8
          </button>
        </div>
      </div>

      {/* Grid of Student Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStudents.map((student) => {
          const attPct = Math.round(
            ((student.stats.attended + student.stats.eventDuty) / (student.stats.totalClasses || 1)) * 100
          );
          const isAtRisk = attPct < 75;

          return (
            <div
              key={student.id}
              className="bg-white border-[3px] border-black shadow-[4px_4px_0px_#000] p-4 flex flex-col justify-between hover:-translate-y-0.5 transition-all"
            >
              <div>
                {/* Header row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-2.5">
                    <img
                      src={student.avatar}
                      alt={student.name}
                      className="w-11 h-11 object-cover border-2 border-black shrink-0"
                    />
                    <div>
                      <span className="px-1.5 py-0.2 text-[10px] font-black bg-[#FFE600] border border-black text-black">
                        {student.rollNo}
                      </span>
                      <h4 className="text-xs font-black text-black mt-1 line-clamp-1">
                        {student.name}
                      </h4>
                    </div>
                  </div>

                  {isAtRisk ? (
                    <span className="px-2 py-0.5 text-[9px] font-black bg-[#FF1E56] text-white border border-black shrink-0">
                      &lt;75% ALERT
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 text-[9px] font-black bg-[#00FF66] text-black border border-black shrink-0">
                      GOOD
                    </span>
                  )}
                </div>

                {/* Info Stats */}
                <div className="grid grid-cols-2 gap-2 mt-3 text-center">
                  <div className="p-1.5 bg-[#fafafa] border-2 border-black">
                    <div className="text-[9px] uppercase font-bold text-gray-500">ATTENDANCE</div>
                    <div className={`text-xs font-black mt-0.5 ${isAtRisk ? 'text-[#FF1E56]' : 'text-black'}`}>
                      {attPct}% ({student.stats.attended}/{student.stats.totalClasses})
                    </div>
                  </div>

                  <div className="p-1.5 bg-[#fafafa] border-2 border-black">
                    <div className="text-[9px] uppercase font-bold text-gray-500">GPA / GRADE</div>
                    <div className="text-xs font-black text-black mt-0.5">
                      {student.grades.gpa.toFixed(1)} ({student.grades.letterGrade})
                    </div>
                  </div>
                </div>

                {/* Exclusively WhatsApp Contact Detail */}
                <div className="mt-2.5 p-2 bg-[#f6f6f2] border-2 border-black flex items-center justify-between text-xs text-black">
                  <div className="flex items-center space-x-1.5 truncate">
                    <span className="text-[10px] font-black uppercase text-gray-600">WA:</span>
                    <span className="font-bold text-[11px] truncate">{student.phone}</span>
                  </div>
                  <span className="text-[9px] font-black text-[#00AA44] bg-green-100 px-1 border border-black/20">
                    VERIFIED
                  </span>
                </div>
              </div>

              {/* Bottom 1-Click WhatsApp Button */}
              <div className="mt-3 pt-2.5 border-t-2 border-black">
                <button
                  type="button"
                  onClick={() => onOpenWhatsApp(student)}
                  className="w-full py-2 px-2 bg-[#00FF66] border-2 border-black text-black text-xs font-black flex items-center justify-center space-x-1.5 shadow-[2px_2px_0px_#000] hover:shadow-[3px_3px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer transition-all"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>CHAT WA</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Enroll Student Modal in Neo-Pop Style */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white border-[3.5px] border-black shadow-[8px_8px_0px_#000] w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between border-b-2 border-black pb-2">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 bg-[#00FF66] border-2 border-black flex items-center justify-center font-black text-xs">
                  +
                </div>
                <h3 className="text-base font-black text-black">ENROLL STUDENT</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 bg-black text-white hover:bg-gray-800 border-2 border-black cursor-pointer"
              >
                <X className="w-4 h-4 stroke-[3]" />
              </button>
            </div>

            <form onSubmit={handleEnrollSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-black uppercase text-black mb-1">
                  FULL NAME:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Diya Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2 bg-[#fafafa] border-2 border-black text-xs font-bold text-black focus:outline-none shadow-[2px_2px_0px_#000]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-black mb-1">
                  ROLL NUMBER:
                </label>
                <input
                  type="text"
                  placeholder="e.g. 2024CS013"
                  value={rollNo}
                  onChange={(e) => setRollNo(e.target.value)}
                  className="w-full p-2 bg-[#fafafa] border-2 border-black text-xs font-bold text-black focus:outline-none shadow-[2px_2px_0px_#000]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-black mb-1">
                  WHATSAPP PHONE NUMBER:
                </label>
                <input
                  type="text"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-2 bg-[#fafafa] border-2 border-black text-xs font-bold text-black focus:outline-none shadow-[2px_2px_0px_#000]"
                  required
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t-2 border-black">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 border-2 border-black bg-white text-xs font-black hover:bg-gray-100 cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 border-2 border-black bg-[#00FF66] text-xs font-black text-black shadow-[2px_2px_0px_#000] hover:shadow-[4px_4px_0px_#000] cursor-pointer"
                >
                  CONFIRM ENROLLMENT
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
