// ============================================================
// DATA LIBUR NASIONAL & CUTI BERSAMA INDONESIA
// Sumber: SKB 3 Menteri (Menag, Menaker, MenPANRB)
//   • 2025 : SKB 3 Menteri 2025 (17 libur nasional + 10 cuti bersama)
//   • 2026 : SKB 3 Menteri No. Menag 1497/2025, Menaker 2/2025, MenPANRB 5/2025
//   • 2027 : SKB 3 Menteri No. 1205/2026, 3/2026, 2/2026
// Dipakai kalender untuk menampilkan keterangan nama hari libur
// (seperti kalender HP) & tidak menghitungnya sebagai hari kerja.
// ============================================================

// jenis: 'nasional' = Libur Nasional, 'cuti' = Cuti Bersama
// { kunci-tanggal: { nama, singkat, jenis } }
const LIBUR_NASIONAL = {
    // ===================== 2025 =====================
    '2025-01-01': { nama: 'Tahun Baru 2025 Masehi', singkat: 'Tahun Baru', jenis: 'nasional' },
    '2025-01-27': { nama: 'Isra Mikraj Nabi Muhammad SAW', singkat: 'Isra Mikraj', jenis: 'nasional' },
    '2025-01-28': { nama: 'Cuti Bersama Tahun Baru Imlek 2576', singkat: 'Cuti: Imlek', jenis: 'cuti' },
    '2025-01-29': { nama: 'Tahun Baru Imlek 2576 Kongzili', singkat: 'Imlek', jenis: 'nasional' },
    '2025-03-28': { nama: 'Cuti Bersama Hari Suci Nyepi', singkat: 'Cuti: Nyepi', jenis: 'cuti' },
    '2025-03-29': { nama: 'Hari Suci Nyepi (Tahun Baru Saka 1947)', singkat: 'Nyepi', jenis: 'nasional' },
    '2025-03-31': { nama: 'Hari Raya Idul Fitri 1446 Hijriah', singkat: 'Idul Fitri', jenis: 'nasional' },
    '2025-04-01': { nama: 'Hari Raya Idul Fitri 1446 Hijriah', singkat: 'Idul Fitri', jenis: 'nasional' },
    '2025-04-02': { nama: 'Cuti Bersama Hari Raya Idul Fitri', singkat: 'Cuti: Idul Fitri', jenis: 'cuti' },
    '2025-04-03': { nama: 'Cuti Bersama Hari Raya Idul Fitri', singkat: 'Cuti: Idul Fitri', jenis: 'cuti' },
    '2025-04-04': { nama: 'Cuti Bersama Hari Raya Idul Fitri', singkat: 'Cuti: Idul Fitri', jenis: 'cuti' },
    '2025-04-07': { nama: 'Cuti Bersama Hari Raya Idul Fitri', singkat: 'Cuti: Idul Fitri', jenis: 'cuti' },
    '2025-04-18': { nama: 'Wafat Yesus Kristus (Jumat Agung)', singkat: 'Jumat Agung', jenis: 'nasional' },
    '2025-04-20': { nama: 'Kebangkitan Yesus Kristus (Paskah)', singkat: 'Paskah', jenis: 'nasional' },
    '2025-05-01': { nama: 'Hari Buruh Internasional', singkat: 'Hari Buruh', jenis: 'nasional' },
    '2025-05-12': { nama: 'Hari Raya Waisak 2569 BE', singkat: 'Waisak', jenis: 'nasional' },
    '2025-05-13': { nama: 'Cuti Bersama Hari Raya Waisak', singkat: 'Cuti: Waisak', jenis: 'cuti' },
    '2025-05-29': { nama: 'Kenaikan Yesus Kristus', singkat: 'Kenaikan Isa', jenis: 'nasional' },
    '2025-05-30': { nama: 'Cuti Bersama Kenaikan Yesus Kristus', singkat: 'Cuti: Kenaikan', jenis: 'cuti' },
    '2025-06-01': { nama: 'Hari Lahir Pancasila', singkat: 'Pancasila', jenis: 'nasional' },
    '2025-06-06': { nama: 'Hari Raya Idul Adha 1446 Hijriah', singkat: 'Idul Adha', jenis: 'nasional' },
    '2025-06-09': { nama: 'Cuti Bersama Hari Raya Idul Adha', singkat: 'Cuti: Idul Adha', jenis: 'cuti' },
    '2025-06-27': { nama: '1 Muharam Tahun Baru Islam 1447 H', singkat: '1 Muharam', jenis: 'nasional' },
    '2025-08-17': { nama: 'Hari Proklamasi Kemerdekaan RI', singkat: 'Proklamasi RI', jenis: 'nasional' },
    '2025-09-05': { nama: 'Maulid Nabi Muhammad SAW', singkat: 'Maulid Nabi', jenis: 'nasional' },
    '2025-12-25': { nama: 'Kelahiran Yesus Kristus (Natal)', singkat: 'Natal', jenis: 'nasional' },
    '2025-12-26': { nama: 'Cuti Bersama Hari Raya Natal', singkat: 'Cuti: Natal', jenis: 'cuti' },

    // ===================== 2026 =====================
    '2026-01-01': { nama: 'Tahun Baru 2026 Masehi', singkat: 'Tahun Baru', jenis: 'nasional' },
    '2026-01-16': { nama: 'Isra Mikraj Nabi Muhammad SAW', singkat: 'Isra Mikraj', jenis: 'nasional' },
    '2026-02-16': { nama: 'Cuti Bersama Tahun Baru Imlek 2577', singkat: 'Cuti: Imlek', jenis: 'cuti' },
    '2026-02-17': { nama: 'Tahun Baru Imlek 2577 Kongzili', singkat: 'Imlek', jenis: 'nasional' },
    '2026-03-18': { nama: 'Cuti Bersama Hari Suci Nyepi', singkat: 'Cuti: Nyepi', jenis: 'cuti' },
    '2026-03-19': { nama: 'Hari Suci Nyepi (Tahun Baru Saka 1948)', singkat: 'Nyepi', jenis: 'nasional' },
    '2026-03-20': { nama: 'Cuti Bersama Hari Raya Idul Fitri', singkat: 'Cuti: Idul Fitri', jenis: 'cuti' },
    '2026-03-21': { nama: 'Hari Raya Idul Fitri 1447 Hijriah', singkat: 'Idul Fitri', jenis: 'nasional' },
    '2026-03-22': { nama: 'Hari Raya Idul Fitri 1447 Hijriah', singkat: 'Idul Fitri', jenis: 'nasional' },
    '2026-03-23': { nama: 'Cuti Bersama Hari Raya Idul Fitri', singkat: 'Cuti: Idul Fitri', jenis: 'cuti' },
    '2026-03-24': { nama: 'Cuti Bersama Hari Raya Idul Fitri', singkat: 'Cuti: Idul Fitri', jenis: 'cuti' },
    '2026-04-03': { nama: 'Wafat Yesus Kristus (Jumat Agung)', singkat: 'Jumat Agung', jenis: 'nasional' },
    '2026-04-05': { nama: 'Kebangkitan Yesus Kristus (Paskah)', singkat: 'Paskah', jenis: 'nasional' },
    '2026-05-01': { nama: 'Hari Buruh Internasional', singkat: 'Hari Buruh', jenis: 'nasional' },
    '2026-05-14': { nama: 'Kenaikan Yesus Kristus', singkat: 'Kenaikan Isa', jenis: 'nasional' },
    '2026-05-15': { nama: 'Cuti Bersama Kenaikan Yesus Kristus', singkat: 'Cuti: Kenaikan', jenis: 'cuti' },
    '2026-05-27': { nama: 'Hari Raya Idul Adha 1447 Hijriah', singkat: 'Idul Adha', jenis: 'nasional' },
    '2026-05-28': { nama: 'Cuti Bersama Hari Raya Idul Adha', singkat: 'Cuti: Idul Adha', jenis: 'cuti' },
    '2026-05-31': { nama: 'Hari Raya Waisak 2570 BE', singkat: 'Waisak', jenis: 'nasional' },
    '2026-06-01': { nama: 'Hari Lahir Pancasila', singkat: 'Pancasila', jenis: 'nasional' },
    '2026-06-16': { nama: '1 Muharam Tahun Baru Islam 1448 H', singkat: '1 Muharam', jenis: 'nasional' },
    '2026-08-17': { nama: 'Hari Proklamasi Kemerdekaan RI', singkat: 'Proklamasi RI', jenis: 'nasional' },
    '2026-08-25': { nama: 'Maulid Nabi Muhammad SAW', singkat: 'Maulid Nabi', jenis: 'nasional' },
    '2026-12-24': { nama: 'Cuti Bersama Kelahiran Yesus Kristus', singkat: 'Cuti: Natal', jenis: 'cuti' },
    '2026-12-25': { nama: 'Kelahiran Yesus Kristus (Natal)', singkat: 'Natal', jenis: 'nasional' },

    // ===================== 2027 =====================
    '2027-01-01': { nama: 'Tahun Baru 2027 Masehi', singkat: 'Tahun Baru', jenis: 'nasional' },
    '2027-01-05': { nama: 'Isra Mikraj Nabi Muhammad SAW 1448 H', singkat: 'Isra Mikraj', jenis: 'nasional' },
    '2027-02-05': { nama: 'Cuti Bersama Tahun Baru Imlek 2578', singkat: 'Cuti: Imlek', jenis: 'cuti' },
    '2027-02-06': { nama: 'Tahun Baru Imlek 2578 Kongzili', singkat: 'Imlek', jenis: 'nasional' },
    '2027-03-08': { nama: 'Hari Suci Nyepi (Tahun Baru Saka 1949)', singkat: 'Nyepi', jenis: 'nasional' },
    '2027-03-09': { nama: 'Cuti Bersama Hari Raya Idul Fitri', singkat: 'Cuti: Idul Fitri', jenis: 'cuti' },
    '2027-03-10': { nama: 'Hari Raya Idul Fitri 1448 Hijriah', singkat: 'Idul Fitri', jenis: 'nasional' },
    '2027-03-11': { nama: 'Hari Raya Idul Fitri 1448 Hijriah', singkat: 'Idul Fitri', jenis: 'nasional' },
    '2027-03-12': { nama: 'Cuti Bersama Hari Raya Idul Fitri', singkat: 'Cuti: Idul Fitri', jenis: 'cuti' },
    '2027-03-15': { nama: 'Cuti Bersama Hari Raya Idul Fitri', singkat: 'Cuti: Idul Fitri', jenis: 'cuti' },
    '2027-03-25': { nama: 'Cuti Bersama Wafat Yesus Kristus', singkat: 'Cuti: Paskah', jenis: 'cuti' },
    '2027-03-26': { nama: 'Wafat Yesus Kristus (Jumat Agung)', singkat: 'Jumat Agung', jenis: 'nasional' },
    '2027-03-28': { nama: 'Kebangkitan Yesus Kristus (Paskah)', singkat: 'Paskah', jenis: 'nasional' },
    '2027-05-01': { nama: 'Hari Buruh Internasional', singkat: 'Hari Buruh', jenis: 'nasional' },
    '2027-05-06': { nama: 'Kenaikan Yesus Kristus', singkat: 'Kenaikan Isa', jenis: 'nasional' },
    '2027-05-17': { nama: 'Hari Raya Idul Adha 1448 Hijriah', singkat: 'Idul Adha', jenis: 'nasional' },
    '2027-05-18': { nama: 'Cuti Bersama Hari Raya Idul Adha', singkat: 'Cuti: Idul Adha', jenis: 'cuti' },
    '2027-05-19': { nama: 'Cuti Bersama Hari Raya Waisak', singkat: 'Cuti: Waisak', jenis: 'cuti' },
    '2027-05-20': { nama: 'Hari Raya Waisak 2571 BE', singkat: 'Waisak', jenis: 'nasional' },
    '2027-06-01': { nama: 'Hari Lahir Pancasila', singkat: 'Pancasila', jenis: 'nasional' },
    '2027-06-06': { nama: '1 Muharam Tahun Baru Islam 1449 H', singkat: '1 Muharam', jenis: 'nasional' },
    '2027-08-15': { nama: 'Maulid Nabi Muhammad SAW', singkat: 'Maulid Nabi', jenis: 'nasional' },
    '2027-08-17': { nama: 'Hari Proklamasi Kemerdekaan RI', singkat: 'Proklamasi RI', jenis: 'nasional' },
    '2027-12-24': { nama: 'Cuti Bersama Kelahiran Yesus Kristus', singkat: 'Cuti: Natal', jenis: 'cuti' },
    '2027-12-25': { nama: 'Kelahiran Yesus Kristus (Natal)', singkat: 'Natal', jenis: 'nasional' },
    '2027-12-26': { nama: 'Isra Mikraj Nabi Muhammad SAW 1449 H', singkat: 'Isra Mikraj', jenis: 'nasional' }
};

// Tahun data yang tersedia (dipakai untuk info di pengaturan)
const TAHUN_LIBUR_TERSEDIA = [...new Set(Object.keys(LIBUR_NASIONAL).map(k => k.slice(0, 4)))].sort();

// ---------- Pencarian informasi libur ----------
function infoLibur(kunci) {
    return LIBUR_NASIONAL[kunci] || null;
}

function adalahLiburNasional(kunci) {
    return !!LIBUR_NASIONAL[kunci];
}

// Nama pendek untuk chip di kalender + tooltip lengkap
function singkatLibur(kunci) {
    const info = infoLibur(kunci);
    return info ? info.singkat : '';
}

function tooltipLibur(kunci) {
    const info = infoLibur(kunci);
    if (!info) return '';
    return (info.jenis === 'cuti' ? 'Cuti Bersama: ' : 'Libur Nasional: ') + info.nama;
}

// ---------- Libur dalam sebuah rentang tanggal ----------
function daftarLiburRentang(mulai, selesai) {
    const hasil = [];
    if (!mulai || !selesai) return hasil;
    const d = new Date(mulai.getFullYear(), mulai.getMonth(), mulai.getDate());
    const akhir = new Date(selesai.getFullYear(), selesai.getMonth(), selesai.getDate());
    for (; d <= akhir; d.setDate(d.getDate() + 1)) {
        const kunci = kunciTanggalDariDate(d);
        if (adalahLiburNasional(kunci)) {
            hasil.push({ kunci, tanggal: new Date(d), ...LIBUR_NASIONAL[kunci] });
        }
    }
    return hasil;
}

function jumlahLiburTahun(tahun) {
    return Object.keys(LIBUR_NASIONAL).filter(k => k.startsWith(String(tahun)) && LIBUR_NASIONAL[k].jenis === 'nasional').length;
}
