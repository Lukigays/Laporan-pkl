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
                    sans: ['Inter', 'system-ui', 'sans-serif'],
                    display: ['Inter', 'system-ui', 'sans-serif'],
                },
                colors: {
                    // Palet FLAT DESIGN
                    brand: { DEFAULT: '#1D2BF0', dark: '#1723C9', 100: '#E4E6FE', 50: '#F1F2FE' },
                    flat: {
                        ink: '#12161F', muted: '#6B7280', line: '#EBE9F0',
                        surface: '#F5F4F2', navy: '#131A2B',
                        lilac: '#E7C6F7', lilacSoft: '#F3E1FB', pinkSoft: '#EFC4F6',
                        sky: '#BEE7FB', mint: '#D9F6E6', danger: '#E5484D'
                    },
                    // Alias lama (dipakai oleh beberapa template JS) → diarahkan ke palet flat
                    accent: { DEFAULT: '#1D2BF0', light: '#1D2BF0', dark: '#1723C9' },
                    cosmic: { purple: '#1D2BF0', violet: '#4B4DF5', pink: '#EFC4F6', rose: '#E5484D' }
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
