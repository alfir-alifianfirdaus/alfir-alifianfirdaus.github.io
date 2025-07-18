// Ganti dengan URL CSV yang Anda dapatkan dari Google Sheet yang dipublikasikan.
// URL ini harus diawali dengan "https://docs.google.com/spreadsheets/d/e/..."
const GOOGLE_SHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTrVdxv0wI4tNSH7a73oj3A5ci2s92w16ibsdwaSisCXBOFc109mh7g8AU_9COWqBD7Rh29TnpIRWI9/pub?gid=1329532146&single=true&output=csv";

document.addEventListener("DOMContentLoaded", function () {
  const openBtn = document.getElementById("open-invitation-btn");
  const bgMusic = document.getElementById("background-music");
  const htmlElement = document.documentElement; // Mengacu pada tag <html>
  let isMusicPlayingInitiated = false; // Flag untuk melacak apakah musik pernah diputar oleh pengguna

  // Ambil elemen daftar komentar
  const commentsList = document.getElementById("comments-list");

  // --- KODE BARU: Cek status pembukaan undangan di localStorage ---
  const hasOpenedInvitation = localStorage.getItem("hasOpenedInvitation");

  if (hasOpenedInvitation === "true") {
    // Jika sudah pernah dibuka (ditandai di localStorage), langsung aktifkan scroll dan AOS
    htmlElement.style.overflow = "auto";
    if (bgMusic) {
      // Coba putar musik, tapi tidak wajib berhasil karena browser mungkin memblokir auto-play
      bgMusic.play().catch((e) => console.log("Music auto-play prevented:", e));
      isMusicPlayingInitiated = true;
    }
    // Sembunyikan tombol "Buka Undangan" jika Anda tidak ingin terlihat lagi
    // Opsi: Anda bisa menghapus elemen hero section seluruhnya untuk pengalaman yang lebih mulus
    if (openBtn) {
      openBtn.style.display = "none";
      // Jika Anda ingin menyembunyikan seluruh hero section:
      // document.getElementById('hero').style.display = 'none';
      // customSmoothScroll("main-content", 0); // Langsung lompat ke konten utama
    }
    // Inisialisasi AOS karena halaman sudah "terbuka"
    AOS.init({
      duration: 1000,
      once: true,
    });
    // Jika Anda ingin halaman langsung berada di bagian konten utama saat refresh
    // customSmoothScroll("main-content", 10); // Durasi sangat singkat untuk efek instan
  }
  // --- AKHIR KODE BARU ---

  // Fungsi untuk melakukan smooth scroll secara kustom
  function customSmoothScroll(targetId, duration) {
    const targetElement = document.getElementById(targetId);
    if (!targetElement) return;

    const startPosition = window.pageYOffset;
    const targetPosition =
      targetElement.getBoundingClientRect().top + window.pageYOffset;
    const distance = targetPosition - startPosition;
    let startTime = null;

    function animation(currentTime) {
      if (startTime === null) startTime = currentTime;
      const timeElapsed = currentTime - startTime;
      const run = easeInOutQuad(timeElapsed, startPosition, distance, duration);
      window.scrollTo(0, run);
      if (timeElapsed < duration) requestAnimationFrame(animation);
    }

    // Fungsi easing (membuat animasi lebih halus dari linear)
    function easeInOutQuad(t, b, c, d) {
      t /= d / 2;
      if (t < 1) return (c / 2) * t * t + b;
      t--;
      return (-c / 2) * (t * (t - 2) - 1) + b;
    }

    requestAnimationFrame(animation);
  }

  // Fungsi yang dipanggil saat tombol "Buka Undangan" diklik
  function activateContentAndScroll() {
    htmlElement.style.overflow = "auto"; // Mengaktifkan scroll
    if (bgMusic) {
      bgMusic
        .play()
        .then(() => {
          isMusicPlayingInitiated = true; // Musik berhasil diputar
        })
        .catch((e) => console.error("Error playing music:", e));
    }
    openBtn.removeEventListener("click", activateContentAndScroll);

    // --- KODE BARU: Tandai bahwa undangan sudah dibuka di localStorage ---
    localStorage.setItem("hasOpenedInvitation", "true");
    // --- AKHIR KODE BARU ---

    // Panggil custom smooth scroll
    customSmoothScroll("main-content", 1500); // 1500ms = 1.5 detik

    AOS.init({
      duration: 1000,
      once: true,
    });
  }

  // Tambahkan event listener ke tombol "Buka Undangan"
  // Pastikan event listener hanya ditambahkan jika tombol ada dan belum pernah dibuka
  if (openBtn && hasOpenedInvitation !== "true") {
    openBtn.addEventListener("click", function (event) {
      event.preventDefault();
      activateContentAndScroll(); // Panggil fungsi baru ini
    });
  } else if (openBtn) {
    // Jika undangan sudah dibuka tapi tombol masih ada (misal tidak disembunyikan total)
    // Kita tetap bisa menghapus event listener jika ingin mencegah klik berulang
    // openBtn.removeEventListener("click", activateContentAndScroll);
  }

  // --- Bagian Mengelola Musik berdasarkan Visibilitas Tab ---
  document.addEventListener("visibilitychange", function () {
    if (bgMusic && isMusicPlayingInitiated) {
      if (document.hidden) {
        bgMusic.pause();
      } else {
        bgMusic.play().catch((e) => console.error("Error resuming music:", e));
      }
    }
  });

  // --- Bagian untuk Menghentikan Musik saat Link Eksternal Diklik ---
  const externalLinks = document.querySelectorAll('a[target="_blank"]');

  externalLinks.forEach((link) => {
    link.addEventListener("click", function () {
      if (bgMusic && !bgMusic.paused) {
        bgMusic.pause();
      }
    });
  });

  // --- KODE UNTUK MEMUAT KOMENTAR DARI GOOGLE SHEET ---
  async function loadCommentsFromSheet() {
    try {
      const response = await fetch(GOOGLE_SHEET_CSV_URL);
      const csvText = await response.text();

      // Memecah CSV menjadi baris dan memfilter baris kosong
      const rows = csvText.split("\n").filter((row) => row.trim() !== "");

      commentsList.innerHTML = ""; // Kosongkan daftar komentar sebelum memuat ulang

      if (rows.length <= 1) {
        // Jika hanya ada header atau tidak ada data
        commentsList.innerHTML =
          '<p style="text-align: center; margin-top: 20px; color: var(--warna4);">Belum ada ucapan dan doa. Jadilah yang pertama!</p>';
        return;
      }

      // Asumsi baris pertama adalah header: Timestamp, Nama Anda, Ucapan & Doa
      // Kita abaikan header dan mulai dari baris kedua
      // Menggunakan regex untuk memecah CSV dengan benar, termasuk koma dalam tanda kutip
      const commentData = rows
        .slice(1)
        .map((row, index) => {
          const columns = row.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g);

          // Tambahkan console log untuk melihat raw data dan kolom yang diparsing
          // console.log(`Row ${index + 1} raw:`, row);
          // console.log(`Row ${index + 1} columns:`, columns);

          if (!columns || columns.length < 3) {
            // Pastikan ada minimal 3 kolom (Timestamp, Nama, Ucapan)
            console.warn(
              `Baris ${index + 1} tidak valid atau kurang kolom:`,
              row
            );
            return null; // Abaikan baris ini
          }

          return {
            timestamp: columns[0] ? columns[0].replace(/"/g, "").trim() : "",
            name: columns[1] ? columns[1].replace(/"/g, "").trim() : "Anonim", // Default jika nama kosong
            comment: columns[2] ? columns[2].replace(/"/g, "").trim() : "",
          };
        })
        .filter((comment) => comment !== null); // Filter baris yang diabaikan

      if (commentData.length === 0) {
        commentsList.innerHTML =
          '<p style="text-align: center; margin-top: 20px; color: var(--warna4);">Belum ada ucapan dan doa. Jadilah yang pertama!</p>';
        return;
      }

      // Tampilkan komentar terbaru di atas (reverse())
      commentData.reverse().forEach((comment) => {
        const commentDiv = document.createElement("div");
        commentDiv.classList.add("single-comment");

        // Perbaiki penanganan tanggal: pastikan tanggal valid
        let formattedDate = "Invalid Date";
        const dateObj = new Date(comment.timestamp);
        if (!isNaN(dateObj)) {
          // Periksa apakah dateObj adalah tanggal yang valid
          formattedDate = dateObj.toLocaleString("id-ID", {
            dateStyle: "medium",
            timeStyle: "short",
          });
        } else {
          console.warn("Timestamp tidak valid:", comment.timestamp);
        }

        commentDiv.innerHTML = `
                        <p class="comment-author"><strong>${comment.name}</strong></p>
                        <p class="comment-text">${comment.comment}</p>
                        <p class="comment-date">${formattedDate}</p>
                    `;
        commentsList.appendChild(commentDiv);
      });
    } catch (error) {
      console.error("Error loading comments from Google Sheet:", error);
      commentsList.innerHTML =
        '<p style="text-align: center; margin-top: 20px; color: red;">Gagal memuat komentar. Pastikan URL Google Sheet CSV benar dan dipublikasikan. (Lihat console log untuk detail)</p>';
    }
  }

  loadCommentsFromSheet();
});
