// ============================================================
// PWA INSTALLER & REGISTER SERVICE WORKER
// ============================================================

let deferredPrompt = null;

// Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then((reg) => console.log('Service Worker terdaftar:', reg.scope))
      .catch((err) => console.warn('Gagal daftar Service Worker:', err));
  });
}

// Menangkap event sebelum prompt install bawaan browser muncul
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  const btnInstall = document.getElementById('btnInstallPWA');
  if (btnInstall) {
    btnInstall.classList.remove('hidden');
  }
});

// Fungsi untuk memicu modal install aplikasi
function installPWA() {
  if (!deferredPrompt) {
    showToast('💡 Aplikasi sudah terinstal atau browser tidak mendukung install otomatis.');
    return;
  }
  deferredPrompt.prompt();
  deferredPrompt.userChoice.then((choiceResult) => {
    if (choiceResult.outcome === 'accepted') {
      showToast('🎉 Aplikasi berhasil dipasang di Homescreen!');
      const btnInstall = document.getElementById('btnInstallPWA');
      if (btnInstall) btnInstall.classList.add('hidden');
    }
    deferredPrompt = null;
  });
}
