<?php
/**
 * ==============================================================================
 * MudiDokan (আমার দোকান) - Database Reset & Schema Cleaner
 * Dual-Mode Execution: Web Browser GUI & CLI / PHP Backend
 * URL: https://mudi-dokan-2-00.vercel.app/CleanDatabasewithtablesandreuploadschema.php
 * ==============================================================================
 */

$SUPABASE_URL = "https://sfhsrrmwckwefjtxjoij.supabase.co";
$SUPABASE_KEY = "sb_publishable_C9LiVCRDDwHEpwC7teg5LQ_3qw41Jue";

// Tables in reverse foreign-key dependency order
$TABLES = [
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
    'stores'
];

// If running in PHP CLI mode
if (php_sapi_name() === 'cli') {
    echo "====================================================\n";
    echo " MudiDokan Supabase Cloud Database Cleaner\n";
    echo " Target: $SUPABASE_URL\n";
    echo "====================================================\n\n";

    foreach ($TABLES as $table) {
        echo "Deleting records from table: $table ... ";
        $ch = curl_init("$SUPABASE_URL/rest/v1/$table?id=neq.00000000-0000-0000-0000-000000000000");
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'DELETE');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            "apikey: $SUPABASE_KEY",
            "Authorization: Bearer $SUPABASE_KEY",
            "Content-Type: application/json"
        ]);
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode >= 200 && $httpCode < 300) {
            echo "SUCCESS (HTTP $httpCode)\n";
        } else {
            echo "RESPONSE ($httpCode): $response\n";
        }
    }
    echo "\nDatabase purge complete!\n";
    exit(0);
}
?>
<!DOCTYPE html>
<html lang="bn">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Amar Dokan - Clean Database & Reset Schema</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Hind Siliguri', sans-serif; }
    </style>
</head>
<body class="bg-slate-900 text-slate-100 min-h-screen p-4 sm:p-8 flex flex-col justify-center items-center">
    <div class="max-w-2xl w-full bg-slate-800 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <!-- Header -->
        <div class="text-center mb-6">
            <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-rose-600/20 text-rose-400 border border-rose-500/30 mb-3 shadow-lg">
                <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
            </div>
            <h1 class="text-2xl sm:text-3xl font-black text-white">
                ডাটাবেজ ক্লিন ও রিসেট টুল
            </h1>
            <p class="text-xs sm:text-sm text-slate-400 mt-1">
                Supabase ক্লাউড ডাটাবেজের সকল টেবিলের পুরনো ডাটা মুছে সম্পূর্ণ ফ্রেশ অবস্থা তৈরি করুন
            </p>
        </div>

        <!-- Connection Badge -->
        <div class="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-700/60 mb-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-mono">
            <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span class="text-slate-300">Supabase Project:</span>
                <span class="text-emerald-400 font-bold">sfhsrrmwckwefjtxjoij</span>
            </div>
            <span class="text-slate-500 text-[11px]">API: v1/REST</span>
        </div>

        <!-- Action Card -->
        <div class="bg-rose-950/20 border border-rose-500/30 p-4 rounded-2xl mb-6">
            <h3 class="text-rose-400 text-sm font-bold flex items-center gap-2 mb-1.5">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                সতর্কতা: ডাটা মুছে ফেলার পূর্বে নিশ্চিত হোন
            </h3>
            <p class="text-xs text-slate-300 leading-relaxed">
                এই বাটনে ক্লিক করলে সেলস, বাকি লেনদেন, কাস্টমার, চালান, খরচ, প্রোডাক্ট এবং দোকানের সমস্ত রেকর্ড চিরতরে মুছে যাবে।
            </p>
        </div>

        <!-- Action Buttons -->
        <div class="space-y-3 mb-6">
            <button
                id="btn-clean-db"
                onclick="executeDatabaseClean()"
                class="w-full py-3.5 px-4 rounded-2xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-sm sm:text-base shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
                <span>সম্পূর্ণ ডাটাবেজ মুছে ফ্রেশ করুন (Clean All Tables)</span>
            </button>
            <a
                href="./SeedDatabase.php"
                class="w-full py-3 px-4 rounded-2xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-2"
            >
                <span>ক্লিনের পর টেস্ট ডাটা দিয়ে সিড করতে চান? (Go to Seed Tool)</span>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
            </a>
        </div>

        <!-- Progress Log Terminal -->
        <div class="bg-slate-950 rounded-2xl p-4 border border-slate-800">
            <div class="flex items-center justify-between text-xs text-slate-400 mb-2 font-mono">
                <span>EXECUTION_CONSOLE:</span>
                <span id="status-badge" class="text-slate-500">IDLE</span>
            </div>
            <pre id="log-output" class="text-[11px] sm:text-xs font-mono text-emerald-400/90 whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed">অপারেশন শুরু করার জন্য উপরের বাটনে ক্লিক করুন...</pre>
        </div>

        <!-- Footer link back to app -->
        <div class="mt-6 text-center">
            <a href="/" class="text-xs text-emerald-400 hover:underline font-bold">← আমার দোকান অ্যাপে ফিরে যান</a>
        </div>
    </div>

    <script>
        const SUPABASE_URL = "<?= $SUPABASE_URL ?>";
        const SUPABASE_KEY = "<?= $SUPABASE_KEY ?>";
        const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

        const tables = <?= json_encode($TABLES) ?>;

        function log(msg) {
            const el = document.getElementById('log-output');
            el.textContent += "\n" + msg;
            el.scrollTop = el.scrollHeight;
        }

        async function executeDatabaseClean() {
            if (!confirm('আপনি কি নিশ্চিত যে সমস্ত ডাটা মুছে ডাটাবেজ খালি করতে চান?')) return;

            const btn = document.getElementById('btn-clean-db');
            const badge = document.getElementById('status-badge');
            const logEl = document.getElementById('log-output');

            btn.disabled = true;
            badge.textContent = "RUNNING...";
            badge.className = "text-amber-400 font-bold animate-pulse";
            logEl.textContent = `[${new Date().toLocaleTimeString()}] ডাটাবেজ ক্লিন প্রসেস শুরু হচ্ছে...\n`;

            try {
                for (const table of tables) {
                    log(`[PURGE] Clearing table "${table}"...`);
                    const { error } = await supabase
                        .from(table)
                        .delete()
                        .neq('id', '00000000-0000-0000-0000-000000000000');

                    if (error) {
                        log(`⚠️ Table "${table}" note: ${error.message}`);
                    } else {
                        log(`✓ Table "${table}" successfully emptied.`);
                    }
                }

                // Also clear local IndexedDB if running in browser
                if (window.indexedDB) {
                    try {
                        window.indexedDB.deleteDatabase('AmarDokanOfflineDB');
                        window.indexedDB.deleteDatabase('MudiDokanOfflineDB');
                        log(`✓ Local browser IndexedDB cache cleared.`);
                    } catch (e) {
                        log(`Local cache clear note: ${e.message}`);
                    }
                }

                log(`\n🎉 সফল! ডাটাবেজের সমস্ত টেবিল সম্পূর্ণ খালি ও ক্লিন করা হয়েছে।`);
                badge.textContent = "COMPLETED";
                badge.className = "text-emerald-400 font-bold";
            } catch (err) {
                log(`\n❌ Error during cleanup: ${err.message}`);
                badge.textContent = "FAILED";
                badge.className = "text-rose-400 font-bold";
            } finally {
                btn.disabled = false;
            }
        }
    </script>
</body>
</html>
