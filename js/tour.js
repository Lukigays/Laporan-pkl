// ============================================================
// PANDUAN (TOUR) PENGGUNA BARU
// ============================================================

const langkahTour = [
    { icon: '🚀', title: 'Selamat Datang di Laporan PKL', desc: 'Aplikasi canggih untuk menyusun dan mengekspor laporan PKL harian Anda dengan mudah.' },
    { icon: '📝', title: 'Tab Input Data', desc: 'Gunakan tab ini untuk mencatat kegiatan baru harian Anda.' },
    { icon: '✏️', title: 'Tab Pengeditan Laporan', desc: 'Pilih dan edit catatan laporan sebelumnya secara cepat.' },
    { icon: '📋', title: 'Tab Laporan & PDF', desc: 'Lihat ringkasan statistik, saring data, lalu unduh dokumen ke format PDF.' }
];
let indexTourAktif = 0;

function cekDanJalankanTour() {
    if (!localStorage.getItem('sudahTourPKL')) bukaTourManual();
}

function bukaTourManual() {
    if (typeof tutupSemuaModal === 'function') tutupSemuaModal('modalTour');
    indexTourAktif = 0;
    renderTourStep();
    const modal = document.getElementById('modalTour');
    modal.classList.remove('hidden');
    setTimeout(() => modal.classList.remove('opacity-0'), 10);
}

function renderTourStep() {
    const step = langkahTour[indexTourAktif];
    document.getElementById('tourIcon').innerText = step.icon;
    document.getElementById('tourTitle').innerText = step.title;
    document.getElementById('tourDesc').innerText = step.desc;
    for (let i = 0; i < 4; i++) {
        const dot = document.getElementById('dot-' + i);
        dot.classList.toggle('active', i === indexTourAktif);
    }
}

function lanjutTour() {
    indexTourAktif++;
    if (indexTourAktif < langkahTour.length) renderTourStep();
    else tutupTour();
}

function lewatiTour() { tutupTour(); }

function tutupTour() {
    localStorage.setItem('sudahTourPKL', 'true');
    const modal = document.getElementById('modalTour');
    modal.classList.add('opacity-0');
    setTimeout(() => modal.classList.add('hidden'), 300);
}
