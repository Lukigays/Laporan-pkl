// ============================================================
// SISTEM BADGE / ACHIEVEMENT (Laporan PKL)
// ============================================================

function hitungDanRenderBadge() {
    const wadahBadge = document.getElementById('wadahBadgeAchievement');
    if (!wadahBadge) return;

    const totalLaporan = dataLaporan.length;
    const totalFoto = dataLaporan.filter(i => i.foto && i.foto.trim() !== '').length;

    // Hitung streak hari berturut-turut
    let maxStreak = 0;
    let tempStreak = 0;
    if (totalLaporan > 0) {
        tempStreak = 1;
        maxStreak = 1;
        for (let i = 1; i < totalLaporan; i++) {
            const partsPrev = dataLaporan[i - 1].tanggal.split('/');
            const partsCurr = dataLaporan[i].tanggal.split('/');
            const datePrev = new Date(partsPrev[2], partsPrev[1] - 1, partsPrev[0]);
            const dateCurr = new Date(partsCurr[2], partsCurr[1] - 1, partsCurr[0]);
            const diffTime = Math.abs(dateCurr - datePrev);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                tempStreak++;
                if (tempStreak > maxStreak) maxStreak = tempStreak;
            } else if (diffDays > 1) {
                tempStreak = 1;
            }
        }
    }

    // Progres target periode PKL (kalau periode sudah diatur)
    const progres = (typeof hitungProgresPKL === 'function') ? hitungProgresPKL() : null;

    const daftarBadge = [
        { id: 'target', icon: '🎯', nama: 'Target PKL', desc: (progres && progres.adaRentang) ? `${progres.terisi}/${progres.target} hari kerja (${progres.persen}%)` : 'Atur periode PKL di Setting', aktif: !!(progres && progres.adaRentang && progres.persen >= 100) },
        { id: 'pemula', icon: '🌱', nama: 'Langkah Pertama', desc: 'Isi 1 laporan kegiatan', aktif: totalLaporan >= 1 },
        { id: 'rajin_5', icon: '🔥', nama: 'Konsisten 5', desc: '5 hari laporan berturut-turut', aktif: maxStreak >= 5 },
        { id: 'dokumentator', icon: '📸', nama: 'Fotografer PKL', desc: 'Unggah minimal 10 foto kegiatan', aktif: totalFoto >= 10 },
        { id: 'master_30', icon: '🏆', nama: 'PKL Veteran', desc: 'Mencapai total 30 laporan harian', aktif: totalLaporan >= 30 }
    ];

    wadahBadge.innerHTML = daftarBadge.map(b => `
        <div class="badge-item ${b.aktif ? 'on' : 'off'}">
            <div class="badge-icon">${b.icon}</div>
            <div>
                <p class="badge-name">${b.nama}</p>
                <p class="badge-desc">${b.desc}</p>
            </div>
        </div>
    `).join('');
}
