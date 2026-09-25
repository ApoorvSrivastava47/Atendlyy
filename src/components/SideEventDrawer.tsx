import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CampusEvent, CollegeBranch } from '../types';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  X,
  Radio,
  Share2,
  Bell,
  ChevronRight,
  Sparkles
} from 'lucide-react';

interface SideEventDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  events: CampusEvent[];
  onOpenFullHub: () => void;
}

export function SideEventDrawer({
  isOpen,
  onClose,
  events,
  onOpenFullHub
}: SideEventDrawerProps) {
  const liveEvents = events.filter((e) => e.isLive);
  const upcomingEvents = events.filter((e) => !e.isLive);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end font-sans">
          {/* Backdrop with smooth fade */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={onClose}
          />

          {/* Slide-over Drawer Panel with silky physics */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 320, mass: 0.8 }}
            className="w-full max-w-md bg-white border-l-[3.5px] border-black shadow-[-8px_0px_0px_#000] h-full flex flex-col z-10 relative"
          >
            {/* Header */}
            <div className="bg-[#FFE600] border-b-[3px] border-black p-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-black text-[#FFE600] border-2 border-black flex items-center justify-center font-black">
                  <Radio className="w-4 h-4 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="bg-[#FF1E56] text-white text-[9px] font-black px-1.5 py-0.2 border border-black uppercase">
                      LIVE BROADCAST
                    </span>
                    <span className="text-[10px] font-bold text-black uppercase">
                      DEANS • HODS • FACULTY
                    </span>
                  </div>
                  <h3 className="text-base font-black text-black">
                    ONGOING CAMPUS EVENTS
                  </h3>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-8 h-8 bg-white border-2 border-black flex items-center justify-center hover:bg-gray-100 cursor-pointer shadow-[2px_2px_0px_#000]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

        {/* Live Event Ticker Strip */}
        <div className="bg-black text-white px-3 py-1.5 flex items-center justify-between text-[11px] font-mono">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[#00FF66] animate-ping" />
            <span className="font-bold text-[#00FF66]">
              {liveEvents.length} ACTIVE NOW
            </span>
          </div>
          <span className="text-gray-400 text-[10px]">
            {events.length} TOTAL SCHEDULED
          </span>
        </div>

        {/* Scrollable Event Feed */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5">
          {events.length === 0 ? (
            <div className="p-8 text-center text-gray-500 font-bold text-xs">
              No live campus broadcasts right now.
            </div>
          ) : (
            events.map((evt) => (
              <div
                key={evt.id}
                className={`border-[2.5px] border-black p-3 text-black transition-all ${
                  evt.isLive
                    ? 'bg-white shadow-[4px_4px_0px_#000] border-l-[6px] border-l-[#FF1E56]'
                    : 'bg-[#fafafa] shadow-[2px_2px_0px_#000]'
                }`}
              >
                {/* Event Status Badges */}
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                    {evt.isLive ? (
                      <span className="px-2 py-0.5 bg-[#FF1E56] text-white text-[9px] font-black border border-black flex items-center space-x-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        <span>HAPPENING NOW</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-gray-200 text-black text-[9px] font-black border border-black">
                        UPCOMING
                      </span>
                    )}

                    <span className="text-[10px] font-black bg-[#FFE600] px-1.5 py-0.2 border border-black text-black">
                      {evt.targetAudience}
                    </span>
                  </div>

                  <span className="text-[9px] font-bold text-gray-500">
                    {evt.date}
                  </span>
                </div>

                {/* Title */}
                <h4 className="text-sm font-black text-black leading-snug">
                  {evt.title}
                </h4>

                <p className="text-xs text-gray-700 mt-1 line-clamp-2 leading-relaxed font-medium">
                  {evt.description}
                </p>

                {/* Venue & Timing */}
                <div className="mt-2.5 space-y-1 bg-[#f4f4ee] p-2 border border-black text-[11px] font-semibold text-black">
                  <div className="flex items-center space-x-1.5">
                    <MapPin className="w-3.5 h-3.5 text-black shrink-0" />
                    <span className="truncate">{evt.venue}</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <Clock className="w-3.5 h-3.5 text-black shrink-0" />
                    <span>{evt.time}</span>
                  </div>
                </div>

                {/* Allowed Branches Chips */}
                <div className="mt-2 flex flex-wrap items-center gap-1">
                  <span className="text-[9px] font-black text-gray-600 uppercase mr-0.5">
                    INVITED:
                  </span>
                  {evt.branches.map((br) => (
                    <span
                      key={br}
                      className="px-1.5 py-0.2 text-[9px] font-black bg-white border border-black text-black"
                    >
                      {br}
                    </span>
                  ))}
                  {evt.yearsAllowed.map((yr) => (
                    <span
                      key={yr}
                      className="px-1.5 py-0.2 text-[9px] font-bold bg-[#e8e8e2] border border-black text-gray-800"
                    >
                      {yr}
                    </span>
                  ))}
                </div>

                {/* Organizer */}
                <div className="mt-2 pt-2 border-t border-black/20 flex items-center justify-between text-[10px] text-gray-700 font-bold">
                  <span>Organized by: {evt.postedByFaculty}</span>
                  <span className="text-gray-500">{evt.department}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Bottom CTA to open full broadcast hub */}
        <div className="p-3 border-t-[3px] border-black bg-white">
          <button
            onClick={() => {
              onClose();
              onOpenFullHub();
            }}
            className="w-full py-2.5 bg-[#00FF66] border-2 border-black shadow-[3px_3px_0px_#000] font-black text-xs text-black flex items-center justify-center space-x-1.5 cursor-pointer hover:bg-[#10e775] active:translate-y-0.5"
          >
            <span>GO TO FULL BROADCAST & EVENT HUB</span>
            <ChevronRight className="w-4 h-4 stroke-[3]" />
          </button>
        </div>
      </motion.div>
    </div>
  )}
</AnimatePresence>
  );
}
