// DOM Elements
const body = document.body;
const audio = document.getElementById("weddingAudio");
const openBtn = document.querySelector(".hero .btn");
const scrollIndicator = document.getElementById("scrollIndicator");
const indicatorText = document.getElementById("indicatorText");
const externalLinks = document.querySelectorAll('a[target="_blank"]');
const commentForm = document.getElementById("comment-form");
const commentsList = document.getElementById("comments-list");
const audioLoading = document.getElementById("audioLoading");

// State variables
let isAudioPlaying = false;
let lastScrollPosition = 0;

// Initialize
document.addEventListener("DOMContentLoaded", function () {
  // Check if invitation was previously opened
  if (localStorage.getItem("invitationOpened")) {
    body.classList.remove("locked");
    scrollIndicator.style.display = "block";
  }

  // Restore scroll position if coming back from external link
  restoreScrollPosition();

  // Setup event listeners
  setupEventListeners();
});

// Event Listeners Setup
function setupEventListeners() {
  // Open invitation button
  openBtn.addEventListener("click", function (e) {
    e.preventDefault();
    openInvitation();
  });

  // External links (maps, instagram)
  externalLinks.forEach((link) => {
    link.addEventListener("click", function () {
      saveScrollPosition();
      if (isAudioPlaying) {
        audio.pause();
      }
    });
  });

  // Visibility change (when returning to tab)
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) {
      restoreScrollPosition();
      if (isAudioPlaying && audio.paused) {
        audio.play().catch((e) => console.log("Audio resume error:", e));
      }
    }
  });

  // Scroll events
  window.addEventListener("scroll", function () {
    // Prevent scrolling if locked
    if (body.classList.contains("locked")) {
      window.scrollTo(0, 0);
      return;
    }

    // Check scroll position for indicator
    checkScrollPosition();

    // Adjust audio volume based on scroll direction
    adjustAudioVolume();
  });

  // Audio events
  audio.addEventListener("waiting", () => {
    audioLoading.style.display = "block";
  });

  audio.addEventListener("canplay", () => {
    audioLoading.style.display = "none";
  });

  // Form submission
  commentForm.addEventListener("submit", handleCommentSubmit);
}

// Open invitation function
function openInvitation() {
  // Unlock scroll
  body.classList.remove("locked");
  localStorage.setItem("invitationOpened", "true");

  // Show scroll indicator
  scrollIndicator.style.display = "block";
  checkScrollPosition();

  // Start audio with low volume
  audio.volume = 0.3;
  audio
    .play()
    .then(() => {
      isAudioPlaying = true;
    })
    .catch((error) => {
      console.log("Audio play failed:", error);
      // Fallback: continue without audio
      smoothScrollToMain();
    });

  // Smooth scroll to main
  smoothScrollToMain();
}

// Smooth scroll animation
function smoothScrollToMain() {
  const mainSection = document.getElementById("main");
  const targetPosition = mainSection.offsetTop;
  const startPosition = window.pageYOffset;
  const distance = targetPosition - startPosition;
  const duration = 3000;
  let startTime = null;

  function animation(currentTime) {
    if (startTime === null) startTime = currentTime;
    const timeElapsed = currentTime - startTime;
    const run = easeInOutQuad(timeElapsed, startPosition, distance, duration);
    window.scrollTo(0, run);
    if (timeElapsed < duration) requestAnimationFrame(animation);
  }

  requestAnimationFrame(animation);
}

// Easing function for smooth scroll
function easeInOutQuad(t, b, c, d) {
  t /= d / 2;
  if (t < 1) return (c / 2) * t * t + b;
  t--;
  return (-c / 2) * (t * (t - 2) - 1) + b;
}

// Check scroll position for indicator
function checkScrollPosition() {
  const scrollPosition = window.scrollY + window.innerHeight;
  const pageHeight = document.documentElement.scrollHeight;
  const isAtBottom = scrollPosition >= pageHeight - 50;

  if (isAtBottom) {
    scrollIndicator.classList.remove("down");
    scrollIndicator.classList.add("up");
    indicatorText.textContent = "Kembali";

    scrollIndicator.onclick = function () {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    };
  } else {
    scrollIndicator.classList.remove("up");
    scrollIndicator.classList.add("down");
    indicatorText.textContent = "Scroll";

    scrollIndicator.onclick = function () {
      window.scrollBy({
        top: window.innerHeight * 0.8,
        behavior: "smooth",
      });
    };
  }
}

// Adjust audio volume based on scroll direction
function adjustAudioVolume() {
  const currentPosition = window.scrollY;

  if (currentPosition > lastScrollPosition) {
    // Scrolling down - increase volume
    if (audio.volume < 0.7) audio.volume += 0.005;
  } else {
    // Scrolling up - decrease volume
    if (audio.volume > 0.3) audio.volume -= 0.005;
  }

  lastScrollPosition = currentPosition;
}

// Save scroll position before leaving
function saveScrollPosition() {
  sessionStorage.setItem("lastScrollPosition", window.scrollY);
}

// Restore scroll position when returning
function restoreScrollPosition() {
  const savedPosition = sessionStorage.getItem("lastScrollPosition");
  if (savedPosition && savedPosition > 0) {
    // Show temporary loader
    body.style.opacity = "0.5";

    setTimeout(() => {
      window.scrollTo({
        top: savedPosition,
        behavior: "instant",
      });
      sessionStorage.removeItem("lastScrollPosition");
      body.style.opacity = "1";
    }, 100);
  }
}

// Handle comment submission
function handleCommentSubmit(e) {
  e.preventDefault();
  const submitBtn = commentForm.querySelector("button");
  const originalText = submitBtn.textContent;

  // Show loading state
  submitBtn.disabled = true;
  submitBtn.textContent = "Mengirim...";

  const scriptURL =
    "https://script.google.com/macros/s/AKfycbwLgsretbK89b0TgZClxzE_yZt3fDotsETj75-KFbdXjAmD1X5I9zgKyDmM41v5wAv3/exec";
  const formData = new FormData(commentForm);

  fetch(scriptURL, {
    method: "POST",
    body: formData,
  })
    .then((response) => {
      if (!response.ok) throw new Error("Network response was not ok");
      return response;
    })
    .then(() => {
      alert("Terima kasih atas ucapan Anda!");
      commentForm.reset();
      loadComments();
    })
    .catch((error) => {
      console.error("Error:", error);
      alert("Gagal mengirim ucapan. Silakan coba lagi nanti.");
    })
    .finally(() => {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    });
}

// Load comments from Google Sheets
async function loadComments() {
  try {
    const sheetURL =
      "https://docs.google.com/spreadsheets/d/1Uq4q7ry5nETqQkVcDUx_hAUO21fj5K1VKNvhHodmYC8/gviz/tq?tqx=out:json";
    const res = await fetch(sheetURL);
    if (!res.ok) throw new Error("Failed to fetch comments");

    const text = await res.text();
    const json = JSON.parse(text.substring(47).slice(0, -2));

    commentsList.innerHTML = "";

    json.table.rows.reverse().forEach((row) => {
      const nama = row.c[0]?.v;
      const komentar = row.c[1]?.v;
      const tanggal = row.c[2]?.v;

      if (!nama || !komentar || !tanggal) return;
      if (
        nama.toLowerCase() === "nama" ||
        komentar.toLowerCase() === "komentar"
      )
        return;

      // Format date
      let formattedDate;
      try {
        const dateObj = new Date(tanggal);
        if (isNaN(dateObj.getTime())) {
          formattedDate = tanggal;
        } else {
          formattedDate = dateObj.toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });
        }
      } catch (e) {
        formattedDate = tanggal;
      }

      const commentEl = document.createElement("div");
      commentEl.className = "single-comment";
      commentEl.innerHTML = `
        <div class="comment-author">${nama}</div>
        <div class="comment-text">${komentar}</div>
        <div class="comment-date">${formattedDate}</div>
      `;
      commentsList.appendChild(commentEl);
    });
  } catch (error) {
    console.error("Error loading comments:", error);
    commentsList.innerHTML = `<p class="error-message">Gagal memuat komentar. Silakan refresh halaman.</p>`;
  }
}

// Initial load of comments
loadComments();
