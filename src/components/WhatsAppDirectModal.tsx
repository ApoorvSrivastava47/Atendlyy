import { useState, useEffect } from 'react';
import { Student } from '../types';
import { WHATSAPP_TEMPLATES, openWhatsAppChat, cleanPhoneNumber } from '../services/whatsappService';
import { MessageSquare, Phone, Send, CheckCircle2, User, X } from 'lucide-react';

interface WhatsAppDirectModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  initialStudent?: Student | null;
  courseCode?: string;
  defaultReason?: string;
}

export function WhatsAppDirectModal({
  isOpen,
  onClose,
  students,
  initialStudent,
  courseCode = 'CS-301',
  defaultReason
}: WhatsAppDirectModalProps) {
  const [selectedStudentId, setSelectedStudentId] = useState<string>(initialStudent?.id || students[0]?.id || '');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('absent_alert');
  const [customMessage, setCustomMessage] = useState<string>('');
  const [sentAlert, setSentAlert] = useState<boolean>(false);

  const activeStudent = students.find(s => s.id === selectedStudentId) || students[0];

  useEffect(() => {
    if (initialStudent) {
      setSelectedStudentId(initialStudent.id);
    }
  }, [initialStudent]);

  useEffect(() => {
    if (defaultReason === 'absent') {
      setSelectedTemplateId('absent_alert');
    } else if (defaultReason === 'event') {
      setSelectedTemplateId('event_od');
    }
  }, [defaultReason]);

  // Update preview message when student or template changes
  useEffect(() => {
    if (!activeStudent) return;
    const template = WHATSAPP_TEMPLATES.find(t => t.id === selectedTemplateId);
    if (template) {
      setCustomMessage(template.generateText(activeStudent, { courseCode }));
    }
  }, [selectedStudentId, selectedTemplateId, courseCode]);

  if (!isOpen || !activeStudent) return null;

  const handleSend = () => {
    openWhatsAppChat(activeStudent.phone, customMessage);
    setSentAlert(true);
    setTimeout(() => {
      setSentAlert(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div 
        id="whatsapp-modal-container"
        className="bg-white border-[3.5px] border-black shadow-[8px_8px_0px_#000] w-full max-w-xl overflow-hidden text-black flex flex-col max-h-[92vh] font-mono"
      >
        {/* Header */}
        <div className="bg-[#00FF66] px-5 py-3.5 border-b-[3px] border-black flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 bg-black text-[#00FF66] border-2 border-black flex items-center justify-center font-black">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight text-black">
                  WHATSAPP DIRECT DISPATCH
                </h3>
              </div>
              <p className="text-[10px] font-bold text-black uppercase">
                DIRECT TO STUDENT PHONE • FAST COMMS
              </p>
            </div>
          </div>
          <button
            id="close-whatsapp-modal"
            onClick={onClose}
            className="p-1.5 bg-black text-white hover:bg-gray-800 border-2 border-black cursor-pointer"
          >
            <X className="w-4 h-4 stroke-[3]" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Student Selector */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-black mb-1">
              TARGET STUDENT (BY ROLL NUMBER):
            </label>
            <div className="relative">
              <select
                id="select-whatsapp-student"
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full bg-[#FFE600] border-2 border-black px-3 py-2 text-xs font-mono font-black text-black focus:outline-none pr-8 cursor-pointer shadow-[2px_2px_0px_#000]"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id} className="bg-white text-black font-mono">
                    {s.rollNo} • {s.name} ({s.phone})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Student Info Chip */}
          <div className="flex items-center space-x-3 p-3 bg-[#fafafa] border-2 border-black shadow-[2px_2px_0px_#000]">
            <img
              src={activeStudent.avatar}
              alt={activeStudent.name}
              className="w-12 h-12 object-cover border-2 border-black shrink-0"
            />
            <div className="flex-1 min-w-0 font-mono">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-black px-1.5 py-0.2 bg-[#FFE600] border border-black text-black">
                  {activeStudent.rollNo}
                </span>
                <span className="text-[11px] text-gray-700 font-bold">
                  {activeStudent.section}
                </span>
              </div>
              <h4 className="text-sm font-black truncate text-black mt-0.5">
                {activeStudent.name}
              </h4>
              <div className="flex items-center space-x-1.5 text-xs text-black font-bold mt-0.5">
                <Phone className="w-3.5 h-3.5 text-black" />
                <span className="underline">{activeStudent.phone}</span>
                <span className="text-[10px] text-gray-500">({cleanPhoneNumber(activeStudent.phone)})</span>
              </div>
            </div>
          </div>

          {/* Quick Message Templates */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-black mb-1">
              PRESET QUICK MESSAGES:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {WHATSAPP_TEMPLATES.map((tmpl) => {
                const isSelected = selectedTemplateId === tmpl.id;
                let bgCol = 'bg-white';
                if (tmpl.id === 'absent_alert') bgCol = isSelected ? 'bg-[#FF1E56] text-white' : 'bg-rose-50 text-black';
                else if (tmpl.id === 'event_od') bgCol = isSelected ? 'bg-[#FFE600] text-black' : 'bg-yellow-50 text-black';
                else if (tmpl.id === 'grade_report') bgCol = isSelected ? 'bg-[#00FF66] text-black' : 'bg-emerald-50 text-black';
                else bgCol = isSelected ? 'bg-[#00E5FF] text-black' : 'bg-cyan-50 text-black';

                return (
                  <button
                    key={tmpl.id}
                    id={`template-btn-${tmpl.id}`}
                    type="button"
                    onClick={() => setSelectedTemplateId(tmpl.id)}
                    className={`text-left p-2.5 border-2 border-black transition-all flex flex-col justify-between cursor-pointer ${bgCol} ${
                      isSelected ? 'shadow-[3px_3px_0px_#000] -translate-x-0.5 -translate-y-0.5 font-black' : 'hover:bg-gray-100 shadow-[1px_1px_0px_#000]'
                    }`}
                  >
                    <span className="text-xs font-bold leading-tight">{tmpl.label}</span>
                    <span className="text-[9px] uppercase mt-1 opacity-80 font-mono">
                      {tmpl.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Message Textarea */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-black uppercase tracking-wider text-black">
                MESSAGE BODY:
              </label>
              <span className="text-[10px] text-gray-500 font-bold">
                *bold* _italic_ supported
              </span>
            </div>
            <textarea
              id="whatsapp-message-textarea"
              rows={4}
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              className="w-full p-3 bg-white border-2 border-black text-xs font-mono focus:outline-none shadow-[2px_2px_0px_#000] resize-none"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 px-5 bg-[#fafafa] border-t-2 border-black flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 border-2 border-black bg-white text-xs font-black text-black hover:bg-gray-100 cursor-pointer"
          >
            CANCEL
          </button>

          <button
            id="submit-whatsapp-send-btn"
            type="button"
            onClick={handleSend}
            className="flex items-center space-x-1.5 px-4 py-2 bg-[#00FF66] border-2 border-black text-black font-black text-xs shadow-[3px_3px_0px_#000] hover:shadow-[5px_5px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer transition-all"
          >
            {sentAlert ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-black" />
                <span>OPENING WA...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4 stroke-[2.5]" />
                <span>DISPATCH TO WHATSAPP</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
