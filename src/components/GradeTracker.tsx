import React, { useState } from 'react';
import { Student, Course } from '../types';
import {
  GraduationCap,
  TrendingUp,
  AlertCircle,
  Award,
  Search,
  MessageCircle,
  CheckCircle2,
  Sliders,
  Filter,
  Plus,
  Minus
} from 'lucide-react';

interface GradeTrackerProps {
  course: Course;
  students: Student[];
  onUpdateStudentGrade: (studentId: string, updatedGrades: Partial<Student['grades']>) => void;
  onOpenWhatsApp: (student: Student, defaultReason?: string) => void;
}

export function GradeTracker({
  course,
  students,
  onUpdateStudentGrade,
  onOpenWhatsApp
}: GradeTrackerProps) {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterType, setFilterType] = useState<'all' | 'at-risk' | 'top'>('all');
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);

  // Helper to calculate score and letter grade
  const calculateAggregate = (student: Student) => {
    const attendancePct = Math.round(
      ((student.stats.attended + student.stats.eventDuty) / (student.stats.totalClasses || 1)) * 100
    );
    const weighted =
      student.grades.assignments * 0.25 +
      student.grades.midterm * 0.25 +
      student.grades.finalExam * 0.4 +
      attendancePct * 0.1;

    let letter = 'F';
    let gpa = 0.0;
    if (weighted >= 90) {
      letter = 'A+';
      gpa = 4.0;
    } else if (weighted >= 80) {
      letter = 'A';
      gpa = 3.7;
    } else if (weighted >= 70) {
      letter = 'B';
      gpa = 3.0;
    } else if (weighted >= 60) {
      letter = 'C';
      gpa = 2.0;
    } else {
      letter = 'F';
      gpa = 0.0;
    }

    return { totalScore: Math.round(weighted), letter, gpa, attendancePct };
  };

  const filteredStudents = students
    .filter((s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.rollNo.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      const { totalScore } = calculateAggregate(s);
      if (filterType === 'at-risk') return totalScore < 65;
      if (filterType === 'top') return totalScore >= 85;
      return true;
    })
    .sort((a, b) => a.rollNo.localeCompare(b.rollNo));

  const scores = students.map((s) => calculateAggregate(s).totalScore);
  const classAvg = Math.round(scores.reduce((a, b) => a + b, 0) / (scores.length || 1));
  const highestScore = Math.max(...scores);
  const atRiskCount = scores.filter((score) => score < 65).length;
  const topCount = scores.filter((score) => score >= 85).length;

  const handleScoreBump = (student: Student, field: 'assignments' | 'midterm' | 'finalExam', delta: number) => {
    const currentVal = student.grades[field] || 0;
    const newVal = Math.min(100, Math.max(0, currentVal + delta));
    onUpdateStudentGrade(student.id, { [field]: newVal });
  };

  return (
    <div id="grade-tracker-container" className="w-full max-w-5xl mx-auto space-y-5 font-mono">
      {/* Top 4 Neo-Pop Stat Cards in Bright Colours */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-[#00FF66] border-[2.5px] border-black shadow-[4px_4px_0px_#000]">
          <div className="text-[10px] font-black uppercase text-black">CLASS AVERAGE</div>
          <div className="text-3xl font-black text-black mt-1">{classAvg}%</div>
          <p className="text-[10px] font-bold text-black mt-0.5">WEIGHTED AGGREGATE</p>
        </div>

        <div className="p-3.5 bg-[#FFE600] border-[2.5px] border-black shadow-[4px_4px_0px_#000]">
          <div className="text-[10px] font-black uppercase text-black">TOP BENCHMARK</div>
          <div className="text-3xl font-black text-black mt-1">{highestScore}%</div>
          <p className="text-[10px] font-bold text-black mt-0.5">HIGHEST SCORER</p>
        </div>

        <div className="p-3.5 bg-[#00E5FF] border-[2.5px] border-black shadow-[4px_4px_0px_#000]">
          <div className="text-[10px] font-black uppercase text-black">DEAN'S LIST</div>
          <div className="text-3xl font-black text-black mt-1">{topCount}</div>
          <p className="text-[10px] font-bold text-black mt-0.5">SCORING 85%+</p>
        </div>

        <div className="p-3.5 bg-[#FF1E56] border-[2.5px] border-black shadow-[4px_4px_0px_#000] text-white">
          <div className="text-[10px] font-black uppercase">NEEDS ATTENTION</div>
          <div className="text-3xl font-black mt-1">{atRiskCount}</div>
          <p className="text-[10px] font-bold mt-0.5">BELOW 65% MARGIN</p>
        </div>
      </div>

      {/* Gradebook Ledger Container */}
      <div className="bg-white border-[3px] border-black shadow-[5px_5px_0px_#000] p-4 sm:p-5 space-y-4">
        {/* Header & Filter Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-black pb-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 text-xs font-black bg-black text-white">
                {course.code}
              </span>
              <span className="text-xs font-bold text-black">
                WEIGHTS: 25% ASSIGN • 25% MIDTERM • 40% FINALS • 10% ATTENDANCE
              </span>
            </div>
            <h3 className="text-lg font-black text-black mt-1">
              CONTINUOUS EVALUATION GRADEBOOK
            </h3>
          </div>

          {/* Minimalist Filter Tabs */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 text-xs font-black border-2 border-black cursor-pointer ${
                filterType === 'all' ? 'bg-[#FFE600] text-black shadow-[2px_2px_0px_#000]' : 'bg-white hover:bg-gray-100'
              }`}
            >
              ALL ({students.length})
            </button>
            <button
              onClick={() => setFilterType('top')}
              className={`px-3 py-1 text-xs font-black border-2 border-black cursor-pointer ${
                filterType === 'top' ? 'bg-[#00FF66] text-black shadow-[2px_2px_0px_#000]' : 'bg-white hover:bg-gray-100'
              }`}
            >
              TOP ({topCount})
            </button>
            <button
              onClick={() => setFilterType('at-risk')}
              className={`px-3 py-1 text-xs font-black border-2 border-black cursor-pointer ${
                filterType === 'at-risk' ? 'bg-[#FF1E56] text-white shadow-[2px_2px_0px_#000]' : 'bg-white hover:bg-gray-100'
              }`}
            >
              AT RISK ({atRiskCount})
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-black" />
          <input
            type="text"
            placeholder="Search by student name or roll number (e.g. 2024CS003)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-[#fafafa] border-2 border-black text-xs font-bold text-black focus:outline-none shadow-[2px_2px_0px_#000]"
          />
        </div>

        {/* Grade Table */}
        <div className="border-2 border-black overflow-x-auto shadow-[3px_3px_0px_#000]">
          <table className="w-full text-left text-xs">
            <thead className="bg-black text-white uppercase text-[10px]">
              <tr>
                <th className="p-2.5 border-r border-gray-700">ROLL NO</th>
                <th className="p-2.5 border-r border-gray-700">STUDENT</th>
                <th className="p-2.5 text-center border-r border-gray-700">ASSIGN (25%)</th>
                <th className="p-2.5 text-center border-r border-gray-700">MIDTERM (25%)</th>
                <th className="p-2.5 text-center border-r border-gray-700">FINALS (40%)</th>
                <th className="p-2.5 text-center border-r border-gray-700">ATTEND %</th>
                <th className="p-2.5 text-center border-r border-gray-700">TOTAL</th>
                <th className="p-2.5 text-center border-r border-gray-700">GRADE</th>
                <th className="p-2.5 text-right">WHATSAPP</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-black bg-white">
              {filteredStudents.map((student) => {
                const { totalScore, letter, gpa, attendancePct } = calculateAggregate(student);

                let gradeColor = 'bg-[#00FF66] text-black';
                if (letter === 'A') gradeColor = 'bg-[#00E5FF] text-black';
                else if (letter === 'B') gradeColor = 'bg-[#FFE600] text-black';
                else if (letter === 'C') gradeColor = 'bg-[#FF9900] text-black';
                else if (letter === 'F') gradeColor = 'bg-[#FF1E56] text-white';

                return (
                  <tr key={student.id} className="hover:bg-yellow-50/70">
                    <td className="p-2.5 font-black border-r-2 border-black">
                      {student.rollNo}
                    </td>
                    <td className="p-2.5 border-r-2 border-black">
                      <div className="flex items-center space-x-2">
                        <img
                          src={student.avatar}
                          alt={student.name}
                          className="w-7 h-7 object-cover border border-black shrink-0"
                        />
                        <span className="font-bold text-black truncate max-w-[120px]">
                          {student.name}
                        </span>
                      </div>
                    </td>

                    {/* Assignments with quick bump controls */}
                    <td className="p-2 text-center border-r-2 border-black">
                      <div className="inline-flex items-center space-x-1">
                        <button
                          onClick={() => handleScoreBump(student, 'assignments', -5)}
                          className="w-5 h-5 bg-white border border-black hover:bg-gray-100 flex items-center justify-center font-bold text-[10px]"
                        >
                          -
                        </button>
                        <span className="font-bold w-7 text-center">{student.grades.assignments}</span>
                        <button
                          onClick={() => handleScoreBump(student, 'assignments', 5)}
                          className="w-5 h-5 bg-white border border-black hover:bg-gray-100 flex items-center justify-center font-bold text-[10px]"
                        >
                          +
                        </button>
                      </div>
                    </td>

                    {/* Midterm with quick bump controls */}
                    <td className="p-2 text-center border-r-2 border-black">
                      <div className="inline-flex items-center space-x-1">
                        <button
                          onClick={() => handleScoreBump(student, 'midterm', -5)}
                          className="w-5 h-5 bg-white border border-black hover:bg-gray-100 flex items-center justify-center font-bold text-[10px]"
                        >
                          -
                        </button>
                        <span className="font-bold w-7 text-center">{student.grades.midterm}</span>
                        <button
                          onClick={() => handleScoreBump(student, 'midterm', 5)}
                          className="w-5 h-5 bg-white border border-black hover:bg-gray-100 flex items-center justify-center font-bold text-[10px]"
                        >
                          +
                        </button>
                      </div>
                    </td>

                    {/* Final Exam with quick bump controls */}
                    <td className="p-2 text-center border-r-2 border-black">
                      <div className="inline-flex items-center space-x-1">
                        <button
                          onClick={() => handleScoreBump(student, 'finalExam', -5)}
                          className="w-5 h-5 bg-white border border-black hover:bg-gray-100 flex items-center justify-center font-bold text-[10px]"
                        >
                          -
                        </button>
                        <span className="font-bold w-7 text-center">{student.grades.finalExam}</span>
                        <button
                          onClick={() => handleScoreBump(student, 'finalExam', 5)}
                          className="w-5 h-5 bg-white border border-black hover:bg-gray-100 flex items-center justify-center font-bold text-[10px]"
                        >
                          +
                        </button>
                      </div>
                    </td>

                    {/* Attendance */}
                    <td className="p-2 text-center border-r-2 border-black font-bold">
                      <span className={attendancePct < 75 ? 'text-[#FF1E56] font-black underline' : 'text-black'}>
                        {attendancePct}%
                      </span>
                    </td>

                    {/* Total */}
                    <td className="p-2 text-center border-r-2 border-black font-black text-sm">
                      {totalScore}%
                    </td>

                    {/* Letter Grade */}
                    <td className="p-2 text-center border-r-2 border-black">
                      <span className={`px-2 py-0.5 text-xs font-black border border-black ${gradeColor}`}>
                        {letter}
                      </span>
                    </td>

                    {/* 1-Click WhatsApp Direct Alert */}
                    <td className="p-2 text-right">
                      <button
                        onClick={() => onOpenWhatsApp(student, 'grade_report')}
                        className="px-2 py-1 bg-[#00FF66] border border-black text-black font-black text-[10px] hover:-translate-y-0.5 transition-all shadow-[1px_1px_0px_#000] cursor-pointer"
                        title="Send complete grade report on WhatsApp"
                      >
                        SEND WA
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
