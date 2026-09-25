import React, { useState, useRef, useEffect } from 'react';
import { Complaint, ComplaintStatus } from '../types';
import { loadCloudState, saveCloudState } from '../services/cloudStateService';
import { INITIAL_COMPLAINTS } from '../data/mockData';
import {
  AlertTriangle,
  Camera,
  Upload,
  CheckCircle2,
  Clock,
  Wrench,
  Building2,
  Image as ImageIcon,
  X,
  ChevronRight,
  Plus,
  Send,
  MessageSquare,
  Sparkles
} from 'lucide-react';

interface ComplaintSectionProps {
  currentFacultyName: string;
  defaultClassroom?: string;
}

const ISSUE_CATEGORIES = [
  'Projector & HDMI Display',
  'Air Conditioning & Ventilation',
  'Electrical & Power Sockets',
  'Wi-Fi & LAN Network',
  'Benches, Desks & Furniture',
  'Cleanliness & Dustbins',
  'Whiteboard & Marker Stand',
  'Water Dispenser & Washroom'
];

const PRESET_SAMPLE_IMAGES = [
  {
    title: 'Broken HDMI / Projector',
    url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600&auto=format&fit=crop&q=80'
  },
  {
    title: 'AC Water Leakage',
    url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&auto=format&fit=crop&q=80'
  },
  {
    title: 'Faulty Wi-Fi Router',
    url: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=600&auto=format&fit=crop&q=80'
  },
  {
    title: 'Broken Desk / Furniture',
    url: 'https://images.unsplash.com/photo-1588072432836-e10032774350?w=600&auto=format&fit=crop&q=80'
  }
];

export function ComplaintSection({
  currentFacultyName,
  defaultClassroom = 'Room LH-302'
}: ComplaintSectionProps) {
  const [complaints, setComplaints] = useState<Complaint[]>(() => {
    try {
      const saved = localStorage.getItem('campusflow_complaints_data');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_COMPLAINTS;
  });

  // Form State
  const [showLodgeModal, setShowLodgeModal] = useState<boolean>(false);
  const [classroomNumber, setClassroomNumber] = useState<string>(defaultClassroom);
  const [category, setCategory] = useState<string>(ISSUE_CATEGORIES[0]);
  const [description, setDescription] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [priority, setPriority] = useState<Complaint['priority']>('high');
  const [imagePreviewName, setImagePreviewName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter state
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'resolved'>('all');
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null);

  const saveComplaints = (newComplaints: Complaint[]) => {
    setComplaints(newComplaints);
    localStorage.setItem('campusflow_complaints_data', JSON.stringify(newComplaints));
    void saveCloudState('complaints', newComplaints);
  };

  useEffect(() => {
    let cancelled = false;
    loadCloudState('complaints', complaints).then((cloud) => {
      if (!cancelled) setComplaints(cloud);
    });
    return () => { cancelled = true; };
  }, []);

  // Handle local image file upload
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImagePreviewName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImageUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit new complaint
  const handleLodgeComplaint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!classroomNumber.trim() || !description.trim()) return;

    const newComplaint: Complaint = {
      id: `comp-${Date.now().toString().slice(-4)}`,
      facultyName: currentFacultyName,
      classroomNumber: classroomNumber.trim(),
      category,
      description: description.trim(),
      imageUrl: imageUrl || undefined,
      priority,
      status: 'lodged',
      lodgedAt: 'Just now',
      updates: [
        {
          timestamp: 'Just now',
          text: `Complaint lodged by ${currentFacultyName} for ${classroomNumber.trim()}. Ticket dispatched to Estate Central Maintenance.`,
          updatedBy: 'System Auto-Dispatch'
        }
      ]
    };

    const updated = [newComplaint, ...complaints];
    saveComplaints(updated);

    // Reset form
    setDescription('');
    setImageUrl('');
    setImagePreviewName('');
    setShowLodgeModal(false);
  };

  // Simulate maintenance dispatch / progress step
  const handleAdvanceStatus = (complaintId: string) => {
    const updated = complaints.map((c) => {
      if (c.id !== complaintId) return c;

      let nextStatus: ComplaintStatus = c.status;
      let updateText = '';
      let updater = 'Estate Maintenance Office';

      if (c.status === 'lodged') {
        nextStatus = 'dispatched';
        updateText = `Technician team dispatched to ${c.classroomNumber} for physical inspection.`;
        updater = 'Maintenance Desk';
      } else if (c.status === 'dispatched') {
        nextStatus = 'in_progress';
        updateText = `Work in progress: Replacement spares requisitioned & repair active in ${c.classroomNumber}.`;
        updater = 'On-site Technician';
      } else if (c.status === 'in_progress') {
        nextStatus = 'resolved';
        updateText = `Issue verified and repaired completely in ${c.classroomNumber}. Classroom ready for lectures.`;
        updater = 'Chief Works Inspector';
      }

      const newUpdate = {
        timestamp: 'Just now',
        text: updateText,
        updatedBy: updater
      };

      return {
        ...c,
        status: nextStatus,
        updates: [...c.updates, newUpdate]
      };
    });

    saveComplaints(updated);
  };

  const filteredComplaints = complaints.filter((c) => {
    if (filterStatus === 'active') return c.status !== 'resolved';
    if (filterStatus === 'resolved') return c.status === 'resolved';
    return true;
  });

  const getStatusBadge = (status: ComplaintStatus) => {
    switch (status) {
      case 'lodged':
        return { label: 'LODGED', bg: 'bg-[#FFE600] text-black', step: 1 };
      case 'dispatched':
        return { label: 'DISPATCHED', bg: 'bg-[#00E5FF] text-black', step: 2 };
      case 'in_progress':
        return { label: 'IN PROGRESS', bg: 'bg-orange-400 text-black', step: 3 };
      case 'resolved':
        return { label: 'RESOLVED', bg: 'bg-[#00FF66] text-black', step: 4 };
    }
  };

  return (
    <div id="complaint-section-container" className="w-full max-w-xl mx-auto space-y-4 px-2 sm:px-0">
      {/* Top Banner with 1-Tap Action */}
      <div className="bg-[#FF1E56] border-[3px] border-black shadow-[3px_3px_0px_#000] p-3.5 sm:p-4 text-white flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center space-x-1.5">
            <span className="px-2 py-0.5 text-[10px] font-black bg-black text-[#FFE600] border border-black uppercase">
              ESTATE & MAINTENANCE
            </span>
            <span className="text-[10px] font-bold text-white uppercase hidden sm:inline">
              FACULTY DESK
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-black tracking-tight mt-0.5">
            CLASSROOM COMPLAINT HUB
          </h2>
          <p className="text-[11px] font-medium text-red-100 line-clamp-1">
            Lodge classroom issues with photo evidence & track live repair progress.
          </p>
        </div>

        <button
          id="lodge-new-complaint-btn"
          onClick={() => setShowLodgeModal(true)}
          className="shrink-0 px-3 py-2 bg-[#FFE600] text-black border-2 border-black shadow-[2px_2px_0px_#000] text-xs font-black flex items-center space-x-1 hover:bg-yellow-300 active:translate-y-0.5 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>LODGE ISSUE</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b-2 border-black pb-2 text-xs font-bold">
        <div className="flex space-x-1.5">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-2.5 py-1 border-2 border-black text-xs font-black transition-all ${
              filterStatus === 'all'
                ? 'bg-black text-white shadow-[2px_2px_0px_#000]'
                : 'bg-white text-black hover:bg-gray-100'
            }`}
          >
            ALL ({complaints.length})
          </button>
          <button
            onClick={() => setFilterStatus('active')}
            className={`px-2.5 py-1 border-2 border-black text-xs font-black transition-all ${
              filterStatus === 'active'
                ? 'bg-[#FFE600] text-black shadow-[2px_2px_0px_#000]'
                : 'bg-white text-black hover:bg-yellow-50'
            }`}
          >
            ACTIVE ({complaints.filter((c) => c.status !== 'resolved').length})
          </button>
          <button
            onClick={() => setFilterStatus('resolved')}
            className={`px-2.5 py-1 border-2 border-black text-xs font-black transition-all ${
              filterStatus === 'resolved'
                ? 'bg-[#00FF66] text-black shadow-[2px_2px_0px_#000]'
                : 'bg-white text-black hover:bg-green-50'
            }`}
          >
            RESOLVED ({complaints.filter((c) => c.status === 'resolved').length})
          </button>
        </div>

        <span className="text-[11px] font-bold text-gray-600 hidden sm:inline">
          {currentFacultyName}
        </span>
      </div>

      {/* List of Lodged Complaints */}
      <div className="space-y-3">
        {filteredComplaints.length === 0 ? (
          <div className="p-8 text-center bg-white border-[3px] border-black shadow-[3px_3px_0px_#000]">
            <CheckCircle2 className="w-8 h-8 text-[#00FF66] stroke-[2.5] mx-auto mb-2" />
            <h4 className="font-black text-sm">NO COMPLAINTS IN THIS CATEGORY</h4>
            <p className="text-xs text-gray-600 mt-1">All classroom maintenance tickets are up to date.</p>
          </div>
        ) : (
          filteredComplaints.map((item) => {
            const badge = getStatusBadge(item.status);
            const isExpanded = selectedComplaintId === item.id;

            return (
              <div
                key={item.id}
                id={`complaint-card-${item.id}`}
                className="bg-white border-[3px] border-black shadow-[3px_3px_0px_#000] p-3.5 sm:p-4 text-black flex flex-col space-y-3"
              >
                {/* Header info */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                      <span className="px-2 py-0.5 bg-black text-[#FFE600] text-[10px] font-black border border-black">
                        {item.classroomNumber}
                      </span>
                      <span className={`px-2 py-0.5 text-[10px] font-black border border-black ${badge.bg}`}>
                        {badge.label}
                      </span>
                      <span className="text-[10px] font-bold text-gray-500">
                        {item.lodgedAt}
                      </span>
                    </div>
                    <h3 className="font-black text-sm text-black mt-1">
                      {item.category}
                    </h3>
                  </div>

                  <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 border border-black ${
                    item.priority === 'urgent' ? 'bg-[#FF1E56] text-white' : item.priority === 'high' ? 'bg-[#FFE600] text-black' : 'bg-gray-100 text-black'
                  }`}>
                    {item.priority}
                  </span>
                </div>

                {/* Description & Image Row */}
                <div className="flex items-start gap-3">
                  <div className="flex-1 text-xs text-gray-900 leading-relaxed font-medium bg-[#fafafa] p-2.5 border border-black">
                    {item.description}
                  </div>

                  {item.imageUrl && (
                    <div className="shrink-0 w-20 h-20 sm:w-24 sm:h-24 border-2 border-black overflow-hidden bg-black relative group">
                      <img
                        src={item.imageUrl}
                        alt="Issue evidence"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[9px] text-white font-bold transition-opacity">
                        EVIDENCE
                      </div>
                    </div>
                  )}
                </div>

                {/* Progress Stepper Bar (4 Steps) */}
                <div className="pt-1">
                  <div className="flex items-center justify-between text-[10px] font-black text-black mb-1">
                    <span className="text-gray-500">MAINTENANCE PROGRESS:</span>
                    <span className="text-black">{badge.label} (Step {badge.step}/4)</span>
                  </div>

                  <div className="w-full h-3 bg-gray-200 border border-black flex overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        badge.step === 4
                          ? 'bg-[#00FF66] w-full'
                          : badge.step === 3
                          ? 'bg-orange-400 w-3/4'
                          : badge.step === 2
                          ? 'bg-[#00E5FF] w-2/4'
                          : 'bg-[#FFE600] w-1/4'
                      }`}
                    />
                  </div>

                  <div className="grid grid-cols-4 gap-1 text-[9px] font-bold text-center mt-1 text-gray-600">
                    <span className={badge.step >= 1 ? 'text-black font-black' : ''}>1. Lodged</span>
                    <span className={badge.step >= 2 ? 'text-black font-black' : ''}>2. Dispatched</span>
                    <span className={badge.step >= 3 ? 'text-black font-black' : ''}>3. Repairing</span>
                    <span className={badge.step >= 4 ? 'text-black font-black' : ''}>4. Resolved</span>
                  </div>
                </div>

                {/* Timeline updates & expander */}
                <div className="border-t border-black/20 pt-2 text-xs">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setSelectedComplaintId(isExpanded ? null : item.id)}
                      className="text-[11px] font-bold underline hover:text-black flex items-center space-x-1 cursor-pointer"
                    >
                      <span>{isExpanded ? 'Hide' : 'View'} Timeline ({item.updates.length} Updates)</span>
                      <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </button>

                    {item.status !== 'resolved' && (
                      <button
                        onClick={() => handleAdvanceStatus(item.id)}
                        className="px-2 py-1 bg-[#00FF66] text-black border border-black text-[10px] font-black hover:bg-[#10e775] active:translate-y-0.5 cursor-pointer flex items-center space-x-1"
                        title="Simulate maintenance technician updating progress"
                      >
                        <Wrench className="w-3 h-3" />
                        <span>UPDATE PROGRESS</span>
                      </button>
                    )}
                  </div>

                  {/* Expanded Timeline View */}
                  {isExpanded && (
                    <div className="mt-2.5 space-y-2 pl-2 border-l-2 border-black text-xs">
                      {item.updates.map((up, uIdx) => (
                        <div key={uIdx} className="bg-[#f9f9f6] p-2 border border-black/40">
                          <div className="flex items-center justify-between text-[10px] font-bold text-gray-600">
                            <span>{up.updatedBy}</span>
                            <span>{up.timestamp}</span>
                          </div>
                          <p className="text-[11px] font-medium text-black mt-0.5">{up.text}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Lodge Complaint Modal Dialog */}
      {showLodgeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs font-sans">
          <div className="bg-white border-[3.5px] border-black shadow-[6px_6px_0px_#000] w-full max-w-lg p-4 sm:p-5 text-black max-h-[92vh] overflow-y-auto space-y-4">
            {/* Modal Title */}
            <div className="flex items-center justify-between border-b-2 border-black pb-2">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-[#FF1E56] text-white border-2 border-black flex items-center justify-center font-black">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-black">
                    LODGE CLASSROOM COMPLAINT
                  </h3>
                  <p className="text-[10px] font-bold text-gray-600 uppercase">
                    ESTATE OFFICE DIRECT DISPATCH
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowLodgeModal(false)}
                className="p-1 hover:bg-gray-200 border border-black cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleLodgeComplaint} className="space-y-3.5 text-xs">
              {/* 1. Classroom Number */}
              <div>
                <label className="block font-black uppercase text-black mb-1">
                  CLASSROOM NUMBER / VENUE: *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Room LH-302, CS Lab-4, Turing Hall"
                  value={classroomNumber}
                  onChange={(e) => setClassroomNumber(e.target.value)}
                  className="w-full p-2.5 bg-[#fafafa] border-2 border-black text-xs font-bold text-black focus:outline-none focus:bg-yellow-50 shadow-[2px_2px_0px_#000]"
                />
                <div className="flex items-center space-x-1.5 mt-1.5 overflow-x-auto pb-1 scrollbar-none">
                  <span className="text-[10px] font-bold text-gray-500 shrink-0">Quick pick:</span>
                  {['Room LH-302', 'CS Lab-4', 'LH-201', 'Ada Lovelace Wing'].map((rm) => (
                    <button
                      key={rm}
                      type="button"
                      onClick={() => setClassroomNumber(rm)}
                      className="px-1.5 py-0.5 bg-[#f0f0eb] hover:bg-[#FFE600] border border-black text-[10px] font-bold shrink-0 cursor-pointer"
                    >
                      {rm}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Issue Category */}
              <div>
                <label className="block font-black uppercase text-black mb-1">
                  ISSUE CATEGORY:
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-2.5 bg-[#fafafa] border-2 border-black text-xs font-bold text-black focus:outline-none shadow-[2px_2px_0px_#000]"
                >
                  {ISSUE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Description Box */}
              <div>
                <label className="block font-black uppercase text-black mb-1">
                  DESCRIPTION OF THE ISSUE: *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe what is broken, abnormal sounds, leakage, or hazard..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 bg-[#fafafa] border-2 border-black text-xs font-medium text-black focus:outline-none focus:bg-yellow-50 shadow-[2px_2px_0px_#000]"
                />
              </div>

              {/* 4. Attach Image of the Issue */}
              <div>
                <label className="block font-black uppercase text-black mb-1">
                  ATTACH IMAGE OF THE ISSUE:
                </label>

                {/* Upload or Camera trigger */}
                <div className="border-2 border-dashed border-black p-3 text-center bg-[#fafafa] space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleImageFileChange}
                    className="hidden"
                  />

                  {imageUrl ? (
                    <div className="relative inline-block border-2 border-black max-w-[200px] max-h-[140px] overflow-hidden">
                      <img src={imageUrl} alt="Attached" className="object-cover w-full h-full" />
                      <button
                        type="button"
                        onClick={() => {
                          setImageUrl('');
                          setImagePreviewName('');
                        }}
                        className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full border border-black cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <Camera className="w-6 h-6 text-gray-500 mx-auto mb-1" />
                      <p className="text-[11px] font-bold text-gray-700">
                        Take photo on phone or select image
                      </p>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-1.5 px-3 py-1.5 bg-[#FFE600] border-2 border-black font-black text-[11px] cursor-pointer hover:bg-yellow-300"
                      >
                        UPLOAD / CAMERA
                      </button>
                    </div>
                  )}
                </div>

                {/* Quick Presets for Demo / Rapid testing */}
                <div className="mt-2">
                  <span className="text-[10px] font-bold text-gray-600 block mb-1">
                    Or select sample photo for testing:
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {PRESET_SAMPLE_IMAGES.map((preset, pIdx) => (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={() => {
                          setImageUrl(preset.url);
                          setImagePreviewName(preset.title);
                        }}
                        className="px-2 py-1 bg-[#f4f4f0] hover:bg-cyan-100 border border-black text-[10px] font-bold text-left truncate cursor-pointer"
                      >
                        📷 {preset.title}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 5. Priority */}
              <div>
                <label className="block font-black uppercase text-black mb-1">
                  PRIORITY LEVEL:
                </label>
                <div className="grid grid-cols-4 gap-1 text-center font-black text-[10px]">
                  {(['low', 'medium', 'high', 'urgent'] as const).map((pr) => (
                    <button
                      key={pr}
                      type="button"
                      onClick={() => setPriority(pr)}
                      className={`py-1.5 border-2 border-black uppercase cursor-pointer ${
                        priority === pr
                          ? pr === 'urgent'
                            ? 'bg-[#FF1E56] text-white'
                            : pr === 'high'
                            ? 'bg-[#FFE600] text-black'
                            : 'bg-black text-white'
                          : 'bg-white text-black'
                      }`}
                    >
                      {pr}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-2 pt-3 border-t-2 border-black">
                <button
                  type="button"
                  onClick={() => setShowLodgeModal(false)}
                  className="px-3 py-2 border-2 border-black bg-white text-xs font-black cursor-pointer hover:bg-gray-100"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border-2 border-black bg-[#FF1E56] text-white text-xs font-black shadow-[2px_2px_0px_#000] hover:bg-red-600 active:translate-y-0.5 cursor-pointer flex items-center space-x-1"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>LODGE COMPLAINT</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
