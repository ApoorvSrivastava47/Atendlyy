import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  ShieldCheck,
  CheckCircle2,
  HardDrive,
  FileSpreadsheet,
  Zap,
  ArrowRight,
  Sparkles,
  Lock,
  UserCheck
} from 'lucide-react';
import { googleSignIn } from '../services/googleAuthService';
import { ensureFacultyDriveFolder, ensureMasterSheet } from '../services/googleDriveService';
import { GoogleDriveStatus } from '../types';

interface AuthScreenProps {
  onAuthSuccess: (driveStatus: GoogleDriveStatus, token: string) => void;
  onContinueAsGuest: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess, onContinueAsGuest }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setStatusMessage('Redirecting to Google Account sign-in...');

    try {
      await googleSignIn();
      // Supabase redirects back to the current Vercel/local URL.
      // App.tsx completes the session + Google Drive initialization after the callback.
    } catch (err: any) {
      console.error('Login error:', err);
      setErrorMessage(err?.message || 'Unable to connect with Google. Check Supabase/Google OAuth configuration.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#FAFAFA] flex flex-col items-center justify-center p-4 sm:p-6 font-sans relative overflow-hidden">
      {/* Background Subtle Grid Texture */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)',
          backgroundSize: '32px 32px'
        }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.28, ease: [0.25, 1, 0.5, 1] }}
        className="w-full max-w-xl bg-white border-[3.5px] border-black shadow-[10px_10px_0px_#000] relative z-10 overflow-hidden"
      >
        {/* Top Header Banner */}
        <div className="bg-[#FFE600] border-b-[3.5px] border-black p-5 sm:p-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-black text-[#FFE600] border-2 border-black flex items-center justify-center shadow-[3px_3px_0px_#000]">
              <Zap className="w-7 h-7 fill-[#FFE600]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-black text-white px-2 py-0.5 border border-black">
                  FACULTY PORTAL
                </span>
                <span className="text-[11px] font-bold text-black flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-black" /> Google Workspace + Supabase Auth
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-black mt-0.5">
                Atendly
              </h1>
            </div>
          </div>

          <div className="hidden sm:flex flex-col items-end text-right">
            <span className="text-xs font-black uppercase text-black bg-white border-2 border-black px-2 py-1 shadow-[2px_2px_0px_#000]">
              Cloud Sync v3.0
            </span>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-5 sm:p-8 space-y-6">
          <div className="space-y-2">
            <h2 className="text-lg sm:text-xl font-black text-black">
              Sign In to Your Teacher Account
            </h2>
            <p className="text-xs sm:text-sm font-semibold text-gray-700 leading-relaxed">
              Atendly automatically syncs lecture attendance, assignment grades, and student directories
              directly into a structured spreadsheet inside your personal <strong className="text-black">Google Drive</strong>.
            </p>
          </div>

          {/* Architecture Benefits Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-[#F4F4F4] border-2 border-black p-3 shadow-[2px_2px_0px_#000] flex flex-col justify-between">
              <div className="flex items-center space-x-2 text-black mb-1.5">
                <HardDrive className="w-4 h-4 text-[#0066FF]" />
                <span className="text-[11px] font-black uppercase">Your Google Drive</span>
              </div>
              <p className="text-[10px] font-medium text-gray-600">
                You own 100% of your data. Stored directly in your Drive folder.
              </p>
            </div>

            <div className="bg-[#F4F4F4] border-2 border-black p-3 shadow-[2px_2px_0px_#000] flex flex-col justify-between">
              <div className="flex items-center space-x-2 text-black mb-1.5">
                <FileSpreadsheet className="w-4 h-4 text-[#00AA44]" />
                <span className="text-[11px] font-black uppercase">Structured Sheets</span>
              </div>
              <p className="text-[10px] font-medium text-gray-600">
                Auto-creates Attendance Ledger, Assignment Grades & Roster sheets.
              </p>
            </div>

            <div className="bg-[#F4F4F4] border-2 border-black p-3 shadow-[2px_2px_0px_#000] flex flex-col justify-between">
              <div className="flex items-center space-x-2 text-black mb-1.5">
                <Lock className="w-4 h-4 text-[#FF1E56]" />
                <span className="text-[11px] font-black uppercase">Tamper-Proof</span>
              </div>
              <p className="text-[10px] font-medium text-gray-600">
                Timestamped records with verification IDs for university compliance.
              </p>
            </div>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#FF1E56]/10 border-2 border-[#FF1E56] text-[#FF1E56] p-3 text-xs font-bold flex items-start space-x-2"
            >
              <div className="mt-0.5 font-black">!</div>
              <div>{errorMessage}</div>
            </motion.div>
          )}

          {/* Loading status message */}
          {isLoading && statusMessage && (
            <div className="bg-[#FFE600]/20 border-2 border-black p-3 text-xs font-bold text-black flex items-center space-x-2 animate-pulse">
              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Google Sign-in Button */}
          <div className="space-y-3 pt-2">
            <button
              id="google-signin-button"
              type="button"
              disabled={isLoading}
              onClick={handleGoogleLogin}
              className="w-full bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-900 border-[3px] border-black font-black text-sm sm:text-base py-3.5 px-4 flex items-center justify-center space-x-3 shadow-[5px_5px_0px_#000] hover:shadow-[7px_7px_0px_#000] active:translate-y-0.5 active:shadow-[2px_2px_0px_#000] cursor-pointer transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {/* Google Official Multicolored SVG Icon */}
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{isLoading ? 'Connecting Google Workspace...' : 'Sign in with Google Account'}</span>
            </button>

            {/* Offline / Guest Mode Option */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={onContinueAsGuest}
                className="text-xs font-bold text-gray-600 hover:text-black underline underline-offset-4 cursor-pointer inline-flex items-center gap-1.5 transition-colors"
              >
                <span>Continue in Guest / Offline Mode (Local Storage only)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Privacy & Security Footnote */}
          <div className="pt-4 border-t-2 border-gray-200 flex flex-col sm:flex-row items-center justify-between text-[11px] text-gray-500 gap-2 font-medium">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
              OAuth Scopes: Drive files & Google Sheets
            </span>
            <span className="text-[10px] text-gray-400">
              Only accesses files created by Atendly
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
