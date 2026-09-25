import React, { useState } from 'react';
import { CampusEvent, CollegeBranch } from '../types';
import {
  Radio,
  Plus,
  Calendar,
  Clock,
  MapPin,
  Users,
  Filter,
  Check,
  X,
  Send,
  Building,
  Sparkles,
  Share2
} from 'lucide-react';

interface CampusEventBroadcastProps {
  events: CampusEvent[];
  onAddEvent: (newEvent: CampusEvent) => void;
  currentFacultyName: string;
  onOpenSideDrawer: () => void;
}

const COLLEGE_BRANCHES: CollegeBranch[] = [
  'CSE',
  'Mechanical Engg',
  'AIML',
  'EE',
  'EC',
  'CE'
];

const COLLEGE_YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'All Years'];

export function CampusEventBroadcast({
  events,
  onAddEvent,
  currentFacultyName,
  onOpenSideDrawer
}: CampusEventBroadcastProps) {
  const [showRaiseModal, setShowRaiseModal] = useState<boolean>(false);
  const [branchFilter, setBranchFilter] = useState<string>('ALL');

  // Form State for raising an event
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [venue, setVenue] = useState<string>('');
  const [date, setDate] = useState<string>('Tomorrow, Sep 15');
  const [time, setTime] = useState<string>('10:00 AM - 01:00 PM');
  const [selectedYears, setSelectedYears] = useState<string[]>(['All Years']);
  const [selectedBranches, setSelectedBranches] = useState<CollegeBranch[]>([
    'CSE',
    'Mechanical Engg',
    'AIML',
    'EE',
    'EC',
    'CE'
  ]);
  const [targetAudience, setTargetAudience] = useState<string>('Deans, HODs & Faculty Members');
  const [department, setDepartment] = useState<string>('Computer Science & Engineering');
  const [isLiveNow, setIsLiveNow] = useState<boolean>(false);

  const toggleBranch = (branch: CollegeBranch) => {
    setSelectedBranches((prev) =>
      prev.includes(branch) ? prev.filter((b) => b !== branch) : [...prev, branch]
    );
  };

  const toggleYear = (yr: string) => {
    if (yr === 'All Years') {
      setSelectedYears(['All Years']);
      return;
    }
    const filtered = selectedYears.filter((y) => y !== 'All Years');
    if (filtered.includes(yr)) {
      const next = filtered.filter((y) => y !== yr);
      setSelectedYears(next.length === 0 ? ['All Years'] : next);
    } else {
      setSelectedYears([...filtered, yr]);
    }
  };

  const handleSelectAllBranches = () => {
    if (selectedBranches.length === COLLEGE_BRANCHES.length) {
      setSelectedBranches([]);
    } else {
      setSelectedBranches([...COLLEGE_BRANCHES]);
    }
  };

  const handleSubmitEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !venue.trim() || selectedBranches.length === 0) return;

    const newEvt: CampusEvent = {
      id: `evt-${Date.now().toString().slice(-4)}`,
      title: title.trim(),
      description: description.trim(),
      venue: venue.trim(),
      date: date.trim(),
      time: time.trim(),
      yearsAllowed: selectedYears,
      branches: selectedBranches,
      targetAudience,
      postedByFaculty: currentFacultyName,
      department,
      isLive: isLiveNow,
      createdAt: 'Just now'
    };

    onAddEvent(newEvt);

    // Reset Form
    setTitle('');
    setDescription('');
    setVenue('');
    setShowRaiseModal(false);
  };

  const filteredEvents = events.filter((e) => {
    if (branchFilter === 'ALL') return true;
    return e.branches.includes(branchFilter as CollegeBranch);
  });

  return (
    <div id="campus-event-broadcast-container" className="w-full max-w-xl mx-auto space-y-4 px-2 sm:px-0">
      {/* Header Banner */}
      <div className="bg-[#FFE600] border-[3px] border-black shadow-[3px_3px_0px_#000] p-3.5 sm:p-4 text-black flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center space-x-1.5">
            <span className="px-2 py-0.5 text-[10px] font-black bg-black text-[#FFE600] border border-black uppercase">
              FACULTY BROADCAST NETWORK
            </span>
            <span className="text-[10px] font-bold text-black uppercase hidden sm:inline">
              DEANS & HODs
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-black tracking-tight mt-0.5">
            CAMPUS EVENTS & BROADCASTS
          </h2>
          <p className="text-[11px] font-semibold text-gray-800 line-clamp-1">
            Publish event circulars to Deans, HODs, and invited engineering branches.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-1.5 shrink-0">
          <button
            onClick={() => setShowRaiseModal(true)}
            className="px-3 py-2 bg-black text-white border-2 border-black shadow-[2px_2px_0px_#000] text-xs font-black flex items-center justify-center space-x-1 hover:bg-gray-800 active:translate-y-0.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>RAISE EVENT</span>
          </button>

          <button
            onClick={onOpenSideDrawer}
            className="px-2.5 py-2 bg-[#FF1E56] text-white border-2 border-black shadow-[2px_2px_0px_#000] text-[11px] font-black flex items-center justify-center space-x-1 hover:bg-red-600 active:translate-y-0.5 cursor-pointer"
            title="Pop up side drawer for ongoing events"
          >
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span className="hidden sm:inline">SIDE POPUP</span>
          </button>
        </div>
      </div>

      {/* College Branches Filter Bar */}
      <div className="bg-white border-[2.5px] border-black p-2.5 shadow-[2px_2px_0px_#000]">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-black uppercase text-gray-600 flex items-center space-x-1">
            <Filter className="w-3 h-3" />
            <span>FILTER BY BRANCH:</span>
          </span>
          <span className="text-[10px] font-bold text-gray-500">
            {filteredEvents.length} Events Listed
          </span>
        </div>

        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setBranchFilter('ALL')}
            className={`px-2 py-1 text-[11px] font-black border border-black shrink-0 transition-all ${
              branchFilter === 'ALL'
                ? 'bg-black text-white'
                : 'bg-[#fafafa] text-black hover:bg-gray-200'
            }`}
          >
            ALL BRANCHES
          </button>
          {COLLEGE_BRANCHES.map((branch) => (
            <button
              key={branch}
              onClick={() => setBranchFilter(branch)}
              className={`px-2 py-1 text-[11px] font-black border border-black shrink-0 transition-all ${
                branchFilter === branch
                  ? 'bg-[#FFE600] text-black shadow-[1.5px_1.5px_0px_#000]'
                  : 'bg-[#fafafa] text-black hover:bg-yellow-50'
              }`}
            >
              {branch}
            </button>
          ))}
        </div>
      </div>

      {/* Event Cards List */}
      <div className="space-y-3">
        {filteredEvents.length === 0 ? (
          <div className="p-8 text-center bg-white border-[3px] border-black shadow-[3px_3px_0px_#000]">
            <Radio className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <h4 className="font-black text-sm text-black">NO EVENTS FOR SELECTED BRANCH</h4>
            <p className="text-xs text-gray-600 mt-1">Try selecting "ALL BRANCHES" or raise a new event.</p>
          </div>
        ) : (
          filteredEvents.map((evt) => (
            <div
              key={evt.id}
              className={`bg-white border-[3px] border-black shadow-[3px_3px_0px_#000] p-3.5 sm:p-4 text-black flex flex-col space-y-2.5 transition-all ${
                evt.isLive ? 'border-l-[6px] border-l-[#FF1E56]' : ''
              }`}
            >
              {/* Header tags */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                  {evt.isLive ? (
                    <span className="px-2 py-0.5 bg-[#FF1E56] text-white text-[9px] font-black border border-black flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      <span>LIVE NOW</span>
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-[#00FF66] text-black text-[9px] font-black border border-black">
                      UPCOMING
                    </span>
                  )}

                  <span className="px-2 py-0.5 bg-[#FFE600] text-black text-[9px] font-black border border-black">
                    {evt.targetAudience}
                  </span>
                </div>

                <span className="text-[10px] font-bold text-gray-500 shrink-0">
                  {evt.date}
                </span>
              </div>

              {/* Title & Description */}
              <div>
                <h3 className="font-black text-sm sm:text-base text-black tracking-tight leading-snug">
                  {evt.title}
                </h3>
                <p className="text-xs text-gray-700 mt-1 font-medium leading-relaxed">
                  {evt.description}
                </p>
              </div>

              {/* Venue & Timing Box */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 bg-[#f6f6f2] p-2.5 border border-black text-xs font-semibold">
                <div className="flex items-center space-x-1.5">
                  <MapPin className="w-3.5 h-3.5 text-black shrink-0" />
                  <span className="truncate">{evt.venue}</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <Clock className="w-3.5 h-3.5 text-black shrink-0" />
                  <span>{evt.time}</span>
                </div>
              </div>

              {/* Invited Branches & Year Badges */}
              <div>
                <span className="text-[9px] font-black uppercase text-gray-500 block mb-1">
                  INVITED ENGINEERING BRANCHES:
                </span>
                <div className="flex flex-wrap items-center gap-1">
                  {evt.branches.map((br) => (
                    <span
                      key={br}
                      className="px-2 py-0.5 text-[10px] font-black bg-white border border-black text-black shadow-[1px_1px_0px_#000]"
                    >
                      {br}
                    </span>
                  ))}
                  {evt.yearsAllowed.map((yr) => (
                    <span
                      key={yr}
                      className="px-2 py-0.5 text-[10px] font-bold bg-[#eaeae4] border border-black text-gray-800"
                    >
                      {yr}
                    </span>
                  ))}
                </div>
              </div>

              {/* Footer row */}
              <div className="border-t border-black/20 pt-2 flex items-center justify-between text-[10px] text-gray-700 font-bold">
                <div className="flex items-center space-x-1 truncate">
                  <span>Raised by:</span>
                  <span className="font-black text-black">{evt.postedByFaculty}</span>
                  <span>({evt.department})</span>
                </div>

                <button
                  onClick={onOpenSideDrawer}
                  className="text-black font-black underline hover:text-red-600 cursor-pointer shrink-0"
                >
                  POPUP SIDEBAR
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Raise Event Modal Dialog */}
      {showRaiseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs font-sans">
          <div className="bg-white border-[3.5px] border-black shadow-[6px_6px_0px_#000] w-full max-w-lg p-4 sm:p-5 text-black max-h-[92vh] overflow-y-auto space-y-4">
            {/* Modal Title */}
            <div className="flex items-center justify-between border-b-2 border-black pb-2">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-[#FFE600] text-black border-2 border-black flex items-center justify-center font-black">
                  <Radio className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-black">
                    RAISE EVENT / CAMPUS BROADCAST
                  </h3>
                  <p className="text-[10px] font-bold text-gray-600 uppercase">
                    BROADCAST TO DEANS, HODs, & FACULTY
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowRaiseModal(false)}
                className="p-1 hover:bg-gray-200 border border-black cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitEvent} className="space-y-3.5 text-xs">
              {/* 1. Event Title */}
              <div>
                <label className="block font-black uppercase text-black mb-1">
                  EVENT TITLE: *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dean's Academic Review / Robotics Hackathon"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2.5 bg-[#fafafa] border-2 border-black text-xs font-bold text-black focus:outline-none focus:bg-yellow-50 shadow-[2px_2px_0px_#000]"
                />
              </div>

              {/* 2. Venue */}
              <div>
                <label className="block font-black uppercase text-black mb-1">
                  VENUE: *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Auditorium Hall B, Senate Hall, Mechanical Workshop"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  className="w-full p-2.5 bg-[#fafafa] border-2 border-black text-xs font-bold text-black focus:outline-none shadow-[2px_2px_0px_#000]"
                />
              </div>

              {/* 3. Date & Timing Grid */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-black uppercase text-black mb-1">
                    DATE: *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tomorrow, Sep 15"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full p-2 bg-[#fafafa] border-2 border-black text-xs font-bold text-black focus:outline-none shadow-[2px_2px_0px_#000]"
                  />
                </div>
                <div>
                  <label className="block font-black uppercase text-black mb-1">
                    TIMING: *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 10:30 AM - 01:00 PM"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full p-2 bg-[#fafafa] border-2 border-black text-xs font-bold text-black focus:outline-none shadow-[2px_2px_0px_#000]"
                  />
                </div>
              </div>

              {/* 4. Branches Allowed / Invited */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-black uppercase text-black">
                    BRANCHES ALLOWED / INVITED: *
                  </label>
                  <button
                    type="button"
                    onClick={handleSelectAllBranches}
                    className="text-[10px] font-black underline cursor-pointer hover:text-blue-600"
                  >
                    {selectedBranches.length === COLLEGE_BRANCHES.length ? 'DESELECT ALL' : 'SELECT ALL'}
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {COLLEGE_BRANCHES.map((branch) => {
                    const isChecked = selectedBranches.includes(branch);
                    return (
                      <button
                        key={branch}
                        type="button"
                        onClick={() => toggleBranch(branch)}
                        className={`p-2 border-2 border-black text-[11px] font-black flex items-center justify-between cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-[#00FF66] text-black shadow-[2px_2px_0px_#000]'
                            : 'bg-white text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <span className="truncate">{branch}</span>
                        {isChecked && <Check className="w-3.5 h-3.5 stroke-[3] shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 5. Year Allowed */}
              <div>
                <label className="block font-black uppercase text-black mb-1">
                  YEARS ALLOWED / ELIGIBLE:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {COLLEGE_YEARS.map((yr) => {
                    const isSel = selectedYears.includes(yr);
                    return (
                      <button
                        key={yr}
                        type="button"
                        onClick={() => toggleYear(yr)}
                        className={`px-2.5 py-1 text-[10px] font-black border-2 border-black cursor-pointer ${
                          isSel
                            ? 'bg-[#FFE600] text-black shadow-[1.5px_1.5px_0px_#000]'
                            : 'bg-white text-black hover:bg-gray-100'
                        }`}
                      >
                        {yr}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 6. Target Audience */}
              <div>
                <label className="block font-black uppercase text-black mb-1">
                  TARGET AUDIENCE:
                </label>
                <select
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  className="w-full p-2 bg-[#fafafa] border-2 border-black text-xs font-bold text-black focus:outline-none shadow-[2px_2px_0px_#000]"
                >
                  <option value="Deans, HODs & Faculty Members">Deans, HODs & Faculty Members</option>
                  <option value="Faculty Members Only">Faculty Members Only</option>
                  <option value="Faculty & Invited Students">Faculty & Invited Students</option>
                  <option value="Entire Campus (Deans, Faculty & All Students)">Entire Campus (Deans, Faculty & All Students)</option>
                </select>
              </div>

              {/* 7. Description */}
              <div>
                <label className="block font-black uppercase text-black mb-1">
                  EVENT DESCRIPTION & AGENDA:
                </label>
                <textarea
                  rows={2}
                  placeholder="Key topics, agenda, keynote speakers, or requirements..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2 bg-[#fafafa] border-2 border-black text-xs font-medium text-black focus:outline-none focus:bg-yellow-50 shadow-[2px_2px_0px_#000]"
                />
              </div>

              {/* 8. Is Live Now Toggle */}
              <div className="flex items-center space-x-2 p-2 border-2 border-black bg-yellow-50">
                <input
                  type="checkbox"
                  id="liveNowCheckbox"
                  checked={isLiveNow}
                  onChange={(e) => setIsLiveNow(e.target.checked)}
                  className="w-4 h-4 accent-black cursor-pointer"
                />
                <label htmlFor="liveNowCheckbox" className="text-xs font-black cursor-pointer text-black">
                  BROADCAST AS "LIVE NOW" (Instantly flags as active in the side popup)
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end space-x-2 pt-3 border-t-2 border-black">
                <button
                  type="button"
                  onClick={() => setShowRaiseModal(false)}
                  className="px-3 py-2 border-2 border-black bg-white text-xs font-black cursor-pointer hover:bg-gray-100"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border-2 border-black bg-[#FFE600] text-black text-xs font-black shadow-[2px_2px_0px_#000] hover:bg-yellow-300 active:translate-y-0.5 cursor-pointer flex items-center space-x-1"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>PUBLISH & BROADCAST</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
