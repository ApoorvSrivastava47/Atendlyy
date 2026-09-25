import React, { useState } from 'react';
import { Student, Course, NoticeItem } from '../types';
import {
  MessageSquare,
  Send,
  BellRing,
  Phone,
  Search,
  Plus,
  Clock,
  CheckCircle2,
  ExternalLink,
  Users
} from 'lucide-react';
import { WHATSAPP_TEMPLATES, openWhatsAppChat, cleanPhoneNumber } from '../services/whatsappService';

interface CommunicationHubProps {
  course: Course;
  students: Student[];
  notices: NoticeItem[];
  onAddNotice: (notice: NoticeItem) => void;
  onOpenWhatsApp: (student: Student, defaultReason?: string) => void;
}

export function CommunicationHub({
  course,
  students,
  notices,
  onAddNotice,
  onOpenWhatsApp
}: CommunicationHubProps) {
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || '');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('attendance_warning');
  const [customText, setCustomText] = useState<string>('');
  const [searchStudent, setSearchStudent] = useState<string>('');

  // Notice creation form state
  const [showNewNotice, setShowNewNotice] = useState<boolean>(false);
  const [newNoticeTitle, setNewNoticeTitle] = useState<string>('');
  const [newNoticeContent, setNewNoticeContent] = useState<string>('');
  const [newNoticeCategory, setNewNoticeCategory] = useState<NoticeItem['category']>('Academic');

  const activeStudent = students.find((s) => s.id === selectedStudentId) || students[0];

  // Update text when template or student changes
  React.useEffect(() => {
    if (activeStudent) {
      const tmpl = WHATSAPP_TEMPLATES.find((t) => t.id === selectedTemplateId);
      if (tmpl) {
        setCustomText(tmpl.generateText(activeStudent, { courseCode: course.code }));
      }
    }
  }, [selectedStudentId, selectedTemplateId, course.code]);

  const handleSendWhatsApp = () => {
    if (!activeStudent) return;
    openWhatsAppChat(activeStudent.phone, customText);
  };

  const handlePostNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoticeTitle.trim() || !newNoticeContent.trim()) return;

    const notice: NoticeItem = {
      id: `notice-${Date.now()}`,
      title: newNoticeTitle,
      content: newNoticeContent,
      category: newNoticeCategory,
      postedAt: 'Just now',
      author: course.instructor,
      priority: newNoticeCategory === 'Urgent' ? 'high' : 'medium'
    };

    onAddNotice(notice);
    setNewNoticeTitle('');
    setNewNoticeContent('');
    setShowNewNotice(false);
  };

  const matchingStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchStudent.toLowerCase()) ||
      s.rollNo.toLowerCase().includes(searchStudent.toLowerCase())
  );

  return (
    <div id="communication-hub-container" className="w-full max-w-5xl mx-auto space-y-5 font-mono">
      {/* Top Banner in Bright Neo-Pop Electric Yellow */}
      <div className="bg-[#FFE600] border-[3px] border-black shadow-[5px_5px_0px_#000] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-black">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 bg-black text-white text-xs font-black">
              DISPATCH & NOTICES
            </span>
            <span className="text-xs font-bold">{course.code} • {course.section}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black mt-1 tracking-tight">
            PROFESSOR-STUDENT DIRECT COMMS
          </h2>
          <p className="text-xs font-bold text-gray-800 mt-0.5">
            1-Click encrypted WhatsApp messaging directly using student phone numbers & class-wide circulars.
          </p>
        </div>

        <button
          onClick={() => setShowNewNotice(!showNewNotice)}
          className="px-3.5 py-2 bg-white border-2 border-black shadow-[3px_3px_0px_#000] text-black font-black text-xs hover:-translate-y-0.5 transition-all self-start sm:self-auto cursor-pointer"
        >
          {showNewNotice ? 'CLOSE NOTICE FORM' : '+ POST NEW CIRCULAR'}
        </button>
      </div>

      {/* New Notice Modal Form */}
      {showNewNotice && (
        <form
          onSubmit={handlePostNotice}
          className="bg-white border-[3px] border-black shadow-[5px_5px_0px_#000] p-4 sm:p-5 space-y-3"
        >
          <div className="flex items-center justify-between border-b-2 border-black pb-2">
            <h3 className="text-sm font-black text-black">
              PUBLISH CIRCULAR TO {course.section}
            </h3>
            <span className="text-xs font-bold text-gray-600">INSTRUCTOR: {course.instructor}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-black uppercase text-black mb-1">
                CIRCULAR TITLE:
              </label>
              <input
                type="text"
                placeholder="e.g. Midterm Evaluation Submission Deadline"
                value={newNoticeTitle}
                onChange={(e) => setNewNoticeTitle(e.target.value)}
                className="w-full p-2 bg-[#fafafa] border-2 border-black text-xs font-bold text-black focus:outline-none shadow-[2px_2px_0px_#000]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-black mb-1">
                CATEGORY:
              </label>
              <select
                value={newNoticeCategory}
                onChange={(e) => setNewNoticeCategory(e.target.value as any)}
                className="w-full p-2 bg-[#fafafa] border-2 border-black text-xs font-bold text-black focus:outline-none shadow-[2px_2px_0px_#000] cursor-pointer"
              >
                <option value="Academic">Academic</option>
                <option value="Exam">Exam Schedule</option>
                <option value="Urgent">Urgent Alert</option>
                <option value="Event">Event / OD</option>
                <option value="General">General</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-black mb-1">
              CIRCULAR CONTENT:
            </label>
            <textarea
              rows={3}
              placeholder="Enter announcement details, instructions, or deadlines..."
              value={newNoticeContent}
              onChange={(e) => setNewNoticeContent(e.target.value)}
              className="w-full p-2 bg-[#fafafa] border-2 border-black text-xs font-bold text-black focus:outline-none shadow-[2px_2px_0px_#000] resize-none"
              required
            />
          </div>

          <div className="flex justify-end space-x-2 pt-1">
            <button
              type="button"
              onClick={() => setShowNewNotice(false)}
              className="px-3 py-1.5 bg-white border-2 border-black text-black text-xs font-black hover:bg-gray-100 cursor-pointer"
            >
              CANCEL
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-[#00FF66] border-2 border-black text-black text-xs font-black shadow-[2px_2px_0px_#000] hover:shadow-[4px_4px_0px_#000] cursor-pointer"
            >
              PUBLISH CIRCULAR
            </button>
          </div>
        </form>
      )}

      {/* Two Column Layout: Left = WhatsApp Direct Sender, Right = Notice Board */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Direct WhatsApp Dispatcher */}
        <div className="lg:col-span-6 bg-white border-[3px] border-black shadow-[5px_5px_0px_#000] p-4 sm:p-5 space-y-4">
          <div className="flex items-center space-x-2 border-b-2 border-black pb-2">
            <div className="w-6 h-6 bg-[#00FF66] border border-black flex items-center justify-center font-black text-xs">
              WA
            </div>
            <h3 className="text-sm font-black text-black uppercase">
              STUDENT WHATSAPP DISPATCH
            </h3>
          </div>

          {/* Student Selector Search & Dropdown */}
          <div>
            <label className="block text-xs font-black uppercase text-black mb-1">
              CHOOSE STUDENT (ROLL NO):
            </label>
            <div className="flex space-x-2 mb-2">
              <input
                type="text"
                placeholder="Filter student list..."
                value={searchStudent}
                onChange={(e) => setSearchStudent(e.target.value)}
                className="flex-1 p-1.5 bg-[#fafafa] border-2 border-black text-xs font-bold focus:outline-none"
              />
            </div>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full p-2 bg-[#00E5FF] border-2 border-black text-xs font-black text-black focus:outline-none shadow-[2px_2px_0px_#000] cursor-pointer"
            >
              {matchingStudents.map((s) => (
                <option key={s.id} value={s.id} className="bg-white text-black font-mono">
                  {s.rollNo} • {s.name} ({s.phone})
                </option>
              ))}
            </select>
          </div>

          {/* Selected Student Card Details */}
          {activeStudent && (
            <div className="p-3 bg-[#fafafa] border-2 border-black flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <img
                  src={activeStudent.avatar}
                  alt={activeStudent.name}
                  className="w-10 h-10 object-cover border-2 border-black shrink-0"
                />
                <div>
                  <div className="text-xs font-black text-black">
                    {activeStudent.name}
                  </div>
                  <div className="text-[10px] text-gray-600">
                    {activeStudent.rollNo} • <span className="underline">{activeStudent.phone}</span>
                  </div>
                </div>
              </div>

              <span className="px-2 py-0.5 bg-[#FFE600] border border-black text-[10px] font-black">
                {activeStudent.section}
              </span>
            </div>
          )}

          {/* Template Buttons */}
          <div>
            <label className="block text-xs font-black uppercase text-black mb-1">
              TEMPLATE:
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {WHATSAPP_TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.id}
                  type="button"
                  onClick={() => setSelectedTemplateId(tmpl.id)}
                  className={`p-2 text-left text-xs font-bold border-2 border-black cursor-pointer transition-all ${
                    selectedTemplateId === tmpl.id
                      ? 'bg-[#FFE600] text-black shadow-[2px_2px_0px_#000] -translate-y-0.5 font-black'
                      : 'bg-white text-black hover:bg-gray-100'
                  }`}
                >
                  {tmpl.label}
                </button>
              ))}
            </div>
          </div>

          {/* Message textarea & Send button */}
          <div>
            <label className="block text-xs font-black uppercase text-black mb-1">
              CUSTOMIZABLE MESSAGE:
            </label>
            <textarea
              rows={4}
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              className="w-full p-2.5 bg-white border-2 border-black text-xs font-mono focus:outline-none shadow-[2px_2px_0px_#000] resize-none"
            />
          </div>

          <button
            onClick={handleSendWhatsApp}
            className="w-full py-2.5 bg-[#00FF66] border-2 border-black text-black font-black text-xs shadow-[3px_3px_0px_#000] hover:shadow-[5px_5px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 flex items-center justify-center space-x-1.5 cursor-pointer transition-all"
          >
            <Send className="w-4 h-4 stroke-[2.5]" />
            <span>LAUNCH OFFICIAL WHATSAPP CHAT</span>
          </button>
        </div>

        {/* Right Column: Circular & Notice Feed */}
        <div className="lg:col-span-6 bg-white border-[3px] border-black shadow-[5px_5px_0px_#000] p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between border-b-2 border-black pb-2">
            <div className="flex items-center space-x-2">
              <BellRing className="w-5 h-5 text-black" />
              <h3 className="text-sm font-black text-black uppercase">
                CLASSROOM CIRCULARS & NOTICES ({notices.length})
              </h3>
            </div>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {notices.map((notice) => {
              let badgeColor = 'bg-[#00E5FF] text-black';
              if (notice.category === 'Urgent') badgeColor = 'bg-[#FF1E56] text-white';
              else if (notice.category === 'Exam') badgeColor = 'bg-[#8B5CF6] text-white';
              else if (notice.category === 'Event') badgeColor = 'bg-[#FFE600] text-black';

              return (
                <div
                  key={notice.id}
                  className="p-3.5 border-2 border-black bg-white shadow-[3px_3px_0px_#000] space-y-2 hover:bg-yellow-50/50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`px-2 py-0.5 text-[10px] font-black border border-black ${badgeColor}`}>
                      {notice.category.toUpperCase()}
                    </span>
                    <span className="text-[10px] text-gray-500 font-bold">
                      {notice.postedAt} • {notice.author}
                    </span>
                  </div>

                  <h4 className="text-sm font-black text-black leading-tight">
                    {notice.title}
                  </h4>

                  <p className="text-xs text-gray-800 font-medium whitespace-pre-line">
                    {notice.content}
                  </p>

                  <div className="pt-2 border-t border-black flex items-center justify-between text-[10px]">
                    <span className="text-gray-500 font-bold">AUDIENCE: {course.section}</span>
                    <button
                      onClick={() => {
                        const broadcastText = `📢 *NOTICE: ${notice.title}*\n${notice.content}\n\n— ${notice.author} (${course.code})`;
                        if (activeStudent) {
                          openWhatsAppChat(activeStudent.phone, broadcastText);
                        }
                      }}
                      className="px-2 py-1 bg-[#00FF66] border border-black font-black text-black hover:-translate-y-0.5 shadow-[1px_1px_0px_#000] cursor-pointer"
                    >
                      FORWARD TO WA
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
