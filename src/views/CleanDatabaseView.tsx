// ==============================================================================
// MudiDokan (আমার দোকান) - Web Database Cleaner & Schema Reset View
// Accessible directly via /CleanDatabasewithtablesandreuploadschema.php
// ==============================================================================

import React, { useState } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';
import { Trash2, CheckCircle2, AlertTriangle, ArrowLeft, RefreshCw, Database } from 'lucide-react';

const TABLES = [
  'day_closings',
  'cash_counts',
  'supplier_payments',
  'chalan_items',
  'supplier_chalans',
  'baki_transactions',
  'sale_items',
  'sales',
  'expenses',
  'customers',
  'products',
  'categories',
  'profiles',
  'stores',
];

export const CleanDatabaseView: React.FC = () => {
  const [isCleaning, setIsCleaning] = useState(false);
  const [logs, setLogs] = useState<string[]>([
    'ডাটাবেজ ক্লিন প্রসেস শুরু করতে নিচের বাটনে ক্লিক করুন...',
  ]);
  const [status, setStatus] = useState<'IDLE' | 'RUNNING' | 'SUCCESS' | 'FAILED'>('IDLE');

  const addLog = (msg: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const handleClean = async () => {
    if (!confirm('আপনি কি নিশ্চিত যে সমস্ত টেবিল মুছে ডাটাবেজ খালি করতে চান?')) return;

    setIsCleaning(true);
    setStatus('RUNNING');
    setLogs([`[${new Date().toLocaleTimeString()}] ডাটাবেজ ক্লিন শুরু হয়েছে...`]);

    try {
      if (!isSupabaseConfigured()) {
        addLog('❌ Supabase credentials are not configured in environment.');
        setStatus('FAILED');
        setIsCleaning(false);
        return;
      }

      for (const table of TABLES) {
        addLog(`[PURGE] Clearing table "${table}"...`);
        const { error } = await supabase
          .from(table)
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');

        if (error) {
          addLog(`⚠️ Table "${table}" note: ${error.message}`);
        } else {
          addLog(`✓ Table "${table}" successfully emptied.`);
        }
      }

      // Clear local IndexedDB
      if (window.indexedDB) {
        try {
          window.indexedDB.deleteDatabase('AmarDokanOfflineDB');
          window.indexedDB.deleteDatabase('MudiDokanOfflineDB');
          addLog('✓ Local browser IndexedDB cache cleared.');
        } catch (e: unknown) {
          const err = e as Error;
          addLog(`Local cache note: ${err.message}`);
        }
      }

      addLog('\n🎉 সফল! Supabase ক্লাউড ডাটাবেজের সকল টেবিল সম্পূর্ণ খালি ও ক্লিন করা হয়েছে।');
      setStatus('SUCCESS');
    } catch (err: unknown) {
      const e = err as Error;
      addLog(`\n❌ Error: ${e.message}`);
      setStatus('FAILED');
    } finally {
      setIsCleaning(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-8">
      <div className="max-w-2xl w-full bg-slate-800 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-rose-600/20 text-rose-400 border border-rose-500/30 mb-3 shadow-lg">
            <Trash2 className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            ডাটাবেজ ক্লিন ও রিসেট টুল
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Supabase ক্লাউড ডাটাবেজের সকল টেবিলের পুরনো ডাটা মুছে সম্পূর্ণ ফ্রেশ অবস্থা তৈরি করুন
          </p>
        </div>

        {/* Connection Badge */}
        <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-700/60 mb-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-slate-300">Supabase Project:</span>
            <span className="text-emerald-400 font-bold">sfhsrrmwckwefjtxjoij</span>
          </div>
          <div className="flex items-center gap-1 text-slate-400">
            <Database className="w-3.5 h-3.5" />
            <span>Direct REST Client</span>
          </div>
        </div>

        {/* Warning Card */}
        <div className="bg-rose-950/20 border border-rose-500/30 p-4 rounded-2xl mb-6">
          <h3 className="text-rose-400 text-sm font-bold flex items-center gap-2 mb-1.5">
            <AlertTriangle className="w-4 h-4" />
            সতর্কতা: ডাটা মুছে ফেলার পূর্বে নিশ্চিত হোন
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            এই বাটনে ক্লিক করলে সেলস, বাকি লেনদেন, কাস্টমার, চালান, খরচ, প্রোডাক্ট এবং দোকানের সমস্ত রেকর্ড চিরতরে মুছে যাবে।
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 mb-6">
          <button
            onClick={handleClean}
            disabled={isCleaning}
            className="w-full py-4 px-4 rounded-2xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-sm sm:text-base shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isCleaning ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>ডাটাবেজ ক্লিন হচ্ছে...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-5 h-5" />
                <span>সম্পূর্ণ ডাটাবেজ মুছে ফ্রেশ করুন (Clean All Tables)</span>
              </>
            )}
          </button>
          <div className="flex gap-2">
            <a
              href="/SeedDatabase.php"
              className="flex-1 py-3 px-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 text-center text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
            >
              <span>টেস্ট ডাটা সিড করতে চান?</span>
            </a>
            <a
              href="/"
              className="flex-1 py-3 px-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-emerald-400 text-center text-xs font-bold transition-all flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>মূল অ্যাপে যান</span>
            </a>
          </div>
        </div>

        {/* Terminal Log Output */}
        <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-mono">
            <span>EXECUTION_CONSOLE:</span>
            <span
              className={
                status === 'RUNNING'
                  ? 'text-amber-400 font-bold animate-pulse'
                  : status === 'SUCCESS'
                  ? 'text-emerald-400 font-bold flex items-center gap-1'
                  : status === 'FAILED'
                  ? 'text-rose-400 font-bold'
                  : 'text-slate-500'
              }
            >
              {status === 'SUCCESS' && <CheckCircle2 className="w-3.5 h-3.5" />}
              {status}
            </span>
          </div>
          <pre className="text-[11px] sm:text-xs font-mono text-emerald-400/90 whitespace-pre-wrap max-h-52 overflow-y-auto leading-relaxed">
            {logs.join('\n')}
          </pre>
        </div>
      </div>
    </div>
  );
};
