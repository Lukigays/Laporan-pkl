// ============================================================
// KONFIGURASI APLIKASI (Tailwind, Supabase, State Global)
// ============================================================

// Konfigurasi Tailwind (di-load sebelum CDN tailwind? Tidak —
// tailwind.config harus diset SETELAH script CDN tailwind dimuat,
// jadi bagian ini dipanggil dari index.html via fungsi initTailwindConfig)
function initTailwindConfig() {
    tailwind.config = {
        theme: {
            extend: {
                fontFamily: {
                    sans: ['Inter', 'sans-serif'],
                    display: ['Space Grotesk', 'sans-serif'],
                },
                colors: {
                    void: '#030308',
                    midnight: '#0a0a12',
                    surface: '#12121a',
                    accent: { DEFAULT: '#c026d3', light: '#d946ef', dark: '#a21caf' },
                    cosmic: { purple: '#7c3aed', violet: '#8b5cf6', pink: '#ec4899', rose: '#f43f5e' }
                }
            }
        }
    };
}

// ---------- Kredensial Supabase ----------
const SUPABASE_URL = "https://tdcgtxoaaplcfpwqvvfe.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_SIoTFjw3KqVQvAVu2AHWuw_B2A5o6Xp";

// ---------- State Global ----------
let dataLaporan = [];
let dataTelahBerubah = false;
let dataProfil = {
    nama: 'LUKYY',
    kelas: 'XII',
    nis: '',
    alamat: 'Alamat Tempat PKL',
    progKeahlian: '',
    konsKeahlian: '',
    tahun: '2026...',
    logoSekolah: '',
    logoCatboxUrl: '',

    // ---------- Periode PKL (dipakai kalender, target hari & PDF) ----------
    pklMulai: '',            // format YYYY-MM-DD
    pklSelesai: '',          // format YYYY-MM-DD
    targetHariKerja: '',     // kosong = dihitung otomatis dari rentang
    autoLiburRentang: false  // true = Minggu sepanjang rentang otomatis dicatat "Libur"
    // Catatan: tanggal merah (libur nasional & cuti bersama) TIDAK disimpan di profil —
    // otomatis dikenali dari data SKB 3 Menteri di js/liburnasional.js
};

let supabaseClient = null;
try {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} catch (err) {
    console.warn("Supabase init failed");
}
let currentUser = null;
