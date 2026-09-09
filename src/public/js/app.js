(function () {
  "use strict";

  if (window.__appJsLoaded) return;
  window.__appJsLoaded = true;

  /* ── Utilities ── */
  function showMessage(message, type) {
    var el = document.getElementById("toast");
    if (!el) return;
    var msg = message === null || message === undefined ? "" : String(message);
    if (!msg) return;
    var t = type === null || type === undefined ? "info" : String(type).toLowerCase();
    if (t !== "success" && t !== "error" && t !== "warning" && t !== "info") t = "info";
    el.textContent = msg;
    el.classList.remove("toast-success", "toast-error", "toast-warning");
    if (t !== "info") el.classList.add("toast-" + t);
    el.classList.add("show");
    clearTimeout(el._timer);
    var duration = t === "error" ? 3500 : 2500;
    el._timer = setTimeout(function () { el.classList.remove("show"); }, duration);
  }

  function showToast(msg) {
    showMessage(msg, "info");
  }

  /* ── Confirm modal (replaces native confirm()) ── */
  var confirmOverlay = null;
  var confirmMessageEl = null;
  var confirmOkBtn = null;
  var confirmCancelBtn = null;
  var confirmPending = null;
  var confirmLastFocus = null;

  function ensureConfirmEls() {
    if (confirmOverlay) return true;
    confirmOverlay = document.getElementById("confirm-overlay");
    confirmMessageEl = document.getElementById("confirm-message");
    confirmOkBtn = document.getElementById("confirm-ok");
    confirmCancelBtn = document.getElementById("confirm-cancel");
    if (!confirmOverlay || !confirmMessageEl || !confirmOkBtn || !confirmCancelBtn) return false;
    confirmOkBtn.addEventListener("click", function () {
      var cb = confirmPending;
      hideConfirm();
      if (typeof cb === "function") cb();
    });
    confirmCancelBtn.addEventListener("click", function () { hideConfirm(); });
    confirmOverlay.addEventListener("click", function (e) {
      if (e.target === confirmOverlay) hideConfirm();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && confirmOverlay && confirmOverlay.style.display !== "none") hideConfirm();
    });
    return true;
  }

  function showConfirm(message, onConfirm, options) {
    if (!ensureConfirmEls()) {
      if (typeof onConfirm === "function") onConfirm();
      return;
    }
    var msg = message === null || message === undefined ? "" : String(message);
    if (!msg) msg = "Emin misiniz?";
    confirmMessageEl.textContent = msg;
    var opts = options || {};
    confirmOkBtn.textContent = opts.okText || "Sil";
    confirmCancelBtn.textContent = opts.cancelText || "Vazgeç";
    confirmPending = (typeof onConfirm === "function") ? onConfirm : null;
    try { confirmLastFocus = document.activeElement; } catch (e) { confirmLastFocus = null; }
    confirmOverlay.style.display = "flex";
    confirmOverlay.setAttribute("aria-hidden", "false");
    try { confirmCancelBtn.focus(); } catch (e) {}
  }

  function hideConfirm() {
    if (!confirmOverlay) return;
    confirmOverlay.style.display = "none";
    confirmOverlay.setAttribute("aria-hidden", "true");
    confirmPending = null;
    if (confirmLastFocus && typeof confirmLastFocus.focus === "function") {
      try { confirmLastFocus.focus(); } catch (e) {}
    }
    confirmLastFocus = null;
  }

  window.showMessage = showMessage;
  window.showToast = showToast;
  window.showConfirm = showConfirm;

  function escapeHtml(str) {
    var d = document.createElement("div");
    d.appendChild(document.createTextNode(str));
    return d.innerHTML;
  }

  function getLargeUrl(url) {
    if (!url) return null;
    if (url.indexOf("/upload/") === -1) return url;
    // Strip any existing Cloudinary transformation segment (e.g. w_36,h_36,c_fill,f_auto,q_auto)
    // which contains a comma, so we don't upscale a low-res thumbnail
    var cleanUrl = url.replace(/\/upload\/[^\/]*,[^\/]*\//, "/upload/");
    return cleanUrl.replace("/upload/", "/upload/w_800,h_800,c_fill,f_auto,q_auto/");
  }

  /* ── Theme (Dark / Light) ── */
  (function () {
    var STORAGE_KEY = "theme";
    var html = document.documentElement;
    var meta = document.querySelector('meta[name="color-scheme"]');
    var btn = document.getElementById("theme-toggle");

    function applyTheme(theme, persist) {
      if (theme === "dark") {
        html.setAttribute("data-theme", "dark");
        html.style.colorScheme = "dark";
        if (meta) meta.content = "dark";
        if (btn) {
          btn.setAttribute("aria-label", "Açık moda geç");
          btn.title = "Açık moda geç";
        }
      } else {
        html.setAttribute("data-theme", "light");
        html.style.colorScheme = "light";
        if (meta) meta.content = "light dark";
        if (btn) {
          btn.setAttribute("aria-label", "Koyu moda geç");
          btn.title = "Koyu moda geç";
        }
      }
      if (persist) {
        try { localStorage.setItem(STORAGE_KEY, theme); } catch (e) {}
      }
    }

    // init label based on current attribute (set by inline head script)
    var initial = html.getAttribute("data-theme");
    if (initial === "dark") applyTheme("dark", false);
    else if (initial === "light") applyTheme("light", false);
    else {
      // no stored preference -> dark (default)
      try {
        var stored = localStorage.getItem(STORAGE_KEY);
        if (stored === "light") applyTheme("light", false);
        else applyTheme("dark", false);
      } catch (e) { applyTheme("dark", false); }
    }

    // enable transitions after initial paint to avoid FOUC transition
    setTimeout(function () { html.classList.add("theme-ready"); }, 50);

    if (btn) {
      btn.addEventListener("click", function () {
        var current = html.getAttribute("data-theme");
        var next = current === "dark" ? "light" : "dark";
        applyTheme(next, true);
      });
    }

    // sync across tabs
    window.addEventListener("storage", function (e) {
      if (e.key === STORAGE_KEY && (e.newValue === "dark" || e.newValue === "light")) {
        applyTheme(e.newValue, false);
      }
    });
  })();

  /* ── Flash Dismiss ── */
  (function () {
    var e = document.querySelector(".flash");
    if (!e) return;
    setTimeout(function () {
      e.classList.add("flash-out");
      setTimeout(function () { if (e.parentNode) e.parentNode.removeChild(e); }, 300);
    }, 4500);
  })();

  /* ── Navbar Toggle ── */
  (function () {
    var btn = document.querySelector(".nav-toggle");
    var menu = document.querySelector(".mobile-menu");
    if (btn && menu) {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        var open = menu.classList.toggle("open");
        btn.setAttribute("aria-expanded", open);
      });
      document.addEventListener("click", function () {
        menu.classList.remove("open");
        btn.setAttribute("aria-expanded", "false");
      });
      menu.addEventListener("click", function (e) { e.stopPropagation(); });
    }
  })();

  /* ── Avatar Popup ── */
  (function () {
    var overlay = document.getElementById("avatar-overlay");
    var popup = document.getElementById("avatar-popup");
    var popupImg = document.getElementById("avatar-popup-img");
    if (!overlay || !popup || !popupImg) return;

    function openPopup(url) {
      if (!url) return;
      var largeUrl = getLargeUrl(url);
      if (!largeUrl) return;
      popupImg.src = largeUrl;
      overlay.style.display = "block";
      popup.style.display = "flex";
    }

    function closePopup() {
      overlay.style.display = "none";
      popup.style.display = "none";
      popupImg.src = "";
    }

    overlay.addEventListener("click", closePopup);
    popup.addEventListener("click", function (e) {
      if (e.target === popup) closePopup();
    });

    document.addEventListener("click", function (e) {
      var target = e.target.closest("[data-avatar]");
      if (target && target.dataset.avatar) openPopup(target.dataset.avatar);
    });
  })();

  /* ── Save / Unsave Job (shared across pages) ── */
  document.addEventListener("click", function (e) {
    var btn = e.target.closest(".save-btn, .save-btn-detail");
    if (!btn) return;

    if (document.body.dataset.userLoggedIn !== "true") {
      showToast("Giriş yapmalısınız.");
      return;
    }

    var jobId = btn.dataset.jobId;
    var csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute("content");

    fetch("/api/ilan-kaydet/" + jobId, {
      method: "POST",
      headers: { "Content-Type": "application/json", "csrf-token": csrfToken },
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data.saved !== undefined) {
          if (btn.classList.contains("save-btn-detail")) {
            btn.classList.toggle("saved", data.saved);
            btn.classList.toggle("btn-solid", data.saved);
            btn.classList.toggle("btn-ghost", !data.saved);
            var icon = btn.querySelector("svg");
            var text = btn.querySelector(".save-text");
            if (data.saved) {
              icon.setAttribute("fill", "#fff");
              icon.setAttribute("stroke", "#fff");
              if (text) text.textContent = "Kaydedildi";
              showToast("İlan kaydedildi");
            } else {
              icon.setAttribute("fill", "none");
              icon.setAttribute("stroke", "var(--ink)");
              if (text) text.textContent = "Kaydet";
              showToast("İlan kayıttan kaldırıldı");
            }
          } else {
            btn.classList.toggle("saved", data.saved);
            showToast(data.saved ? "İlan kaydedildi" : "İlan kayıttan kaldırıldı");
            // If we are on /profilim/kaydedilenler, remove the card when unsaved
            if (!data.saved) {
              var savedCountEl = document.getElementById("savedCount");
              if (savedCountEl) {
                var card = btn.closest(".job-card");
                if (card && card.closest(".jobs-list")) {
                  // Only remove if the button is inside the saved list (not other pages)
                  var isSavedPage = window.location.pathname === "/profilim/kaydedilenler";
                  if (isSavedPage) {
                    card.remove();
                    var match = savedCountEl.textContent.match(/\((\d+)\)/);
                    if (match) {
                      var newCount = parseInt(match[1], 10) - 1;
                      savedCountEl.textContent = "(" + newCount + ")";
                      if (newCount === 0) {
                        var jobsList = document.querySelector(".jobs-list");
                        if (jobsList && jobsList.children.length === 0) {
                          jobsList.outerHTML = '<div class="empty">Henüz kaydedilmiş ilan bulunmuyor. <a href="/ilanlar">İlanlara göz at</a>.</div>';
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        } else {
          showToast(data.error || "Bir hata oluştu");
        }
      })
      .catch(function () { showToast("Bağlantı hatası"); });
  });

  /* ── Save / Unsave Post (bookmark) ── */
  document.addEventListener("click", function (e) {
    var btn = e.target.closest(".save-post-btn");
    if (!btn) return;

    if (document.body.dataset.userLoggedIn !== "true") {
      showToast("Giriş yapmalısınız.");
      return;
    }

    var postId = btn.dataset.postId;
    var csrfMeta = document.querySelector('meta[name="csrf-token"]');
    var csrfToken = csrfMeta ? csrfMeta.getAttribute("content") : "";

    if (btn._saving) return;
    btn._saving = true;

    fetch("/api/post-kaydet/" + postId, {
      method: "POST",
      headers: { "Content-Type": "application/json", "csrf-token": csrfToken }
    })
      .then(function (r) {
        return r.json().then(function (data) { return { status: r.status, data: data }; });
      })
      .then(function (res) {
        var data = res.data;
        if (res.status === 401) {
          showToast(data.error || "Giriş yapmalısınız.");
          return;
        }
        if (data.saved !== undefined) {
          var isSaved = data.saved;
          btn.classList.toggle("saved", isSaved);
          var svg = btn.querySelector("svg");
          if (svg) svg.setAttribute("fill", isSaved ? "currentColor" : "none");
          btn.setAttribute("aria-label", isSaved ? "Kaydı kaldır" : "Kaydet");
          btn.setAttribute("title", isSaved ? "Kaydedildi" : "Kaydet");
          showToast(isSaved ? "Post kaydedildi" : "Post kayıttan kaldırıldı");
          if (!isSaved && window.location.pathname === "/profilim/kaydedilen-postlar") {
            var card = btn.closest(".post-card");
            var countEl = document.getElementById("savedPostCount");
            if (card) {
              card.remove();
              if (countEl) {
                var match = countEl.textContent.match(/\((\d+)\)/);
                if (match) {
                  var newCount = parseInt(match[1], 10) - 1;
                  countEl.textContent = "(" + newCount + ")";
                  if (newCount === 0) {
                    var list = document.getElementById("savedPostsList");
                    if (list) {
                      list.outerHTML = '<div class="empty">Henüz kaydedilmiş post bulunmuyor. <a href="/forum/akis">Foruma göz at</a>.</div>';
                    }
                  }
                }
              }
            }
          }
        } else {
          showToast(data.error || "Bir hata oluştu");
        }
      })
      .catch(function () { showToast("Bağlantı hatası"); })
      .finally(function () { btn._saving = false; });
  });

  /* ── Job Card Click ── */
  document.addEventListener("click", function (e) {
    var card = e.target.closest(".job-card[data-href]");
    if (card && !e.target.closest(".save-btn, .save-btn-detail")) {
      window.location.href = card.dataset.href;
    }
  });

  /* ── Profile: Remove saved job card ── */
  document.addEventListener("click", function (e) {
    var btn = e.target.closest("#savedCount") ? null : null;
  });
  /* handled via save-btn above on profile page — card removal */
  document.addEventListener("click", function (e) {
    var btn = e.target.closest(".save-btn");
    if (!btn || !document.getElementById("savedCount")) return;

    var originalListener = btn._profileHandler;
  });
  (function () {
    var savedCount = document.getElementById("savedCount");
    if (!savedCount) return;

    document.addEventListener("click", function (e) {
      var btn = e.target.closest("#savedCount ~ .jobs-list .save-btn, .jobs-list .save-btn");
      if (!btn) return;
      var card = btn.closest(".job-card");
      if (!card) return;

      var jobId = btn.dataset.jobId;
      var csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute("content");

      fetch("/api/ilan-kaydet/" + jobId, {
        method: "POST",
        headers: { "Content-Type": "application/json", "csrf-token": csrfToken },
      })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (data.saved !== undefined && !data.saved) {
            card.remove();
            var match = savedCount.textContent.match(/\((\d+)\)/);
            if (match) {
              var newCount = parseInt(match[1], 10) - 1;
              savedCount.textContent = "(" + newCount + ")";
            }
          } else if (data.error) {
            showToast(data.error);
          }
        })
        .catch(function () { showToast("Bağlantı hatası"); });
    });
  })();

  /* ── Profile Avatar Upload + Crop (Cropper.js 1:1) ── */
  (function () {
    var avatarInput = document.getElementById("avatar-input");
    var avatarPreview = document.getElementById("avatar-preview");
    var avatarSubmit = document.getElementById("avatar-submit");
    var avatarError = document.getElementById("avatar-error");
    var avatarForm = document.getElementById("avatar-form");
    if (!avatarInput) return;

    var cropModal = document.getElementById("crop-modal");
    var cropBackdrop = document.getElementById("crop-modal-backdrop");
    var cropImage = document.getElementById("crop-image");
    var cropCancel = document.getElementById("crop-cancel");
    var cropClose = document.getElementById("crop-close");
    var cropConfirm = document.getElementById("crop-confirm");
    var cropZoomIn = document.getElementById("crop-zoom-in");
    var cropZoomOut = document.getElementById("crop-zoom-out");
    var cropError = document.getElementById("crop-error");

    var cropper = null;
    var originalFile = null;
    var originalFileType = "";

    function destroyCropper() {
      if (cropper) {
        try { cropper.destroy(); } catch (e) {}
        cropper = null;
      }
    }

    function setError(msg) {
      if (avatarError) avatarError.textContent = msg;
      if (cropError) cropError.textContent = msg;
      if (msg) showToast(msg);
    }
    function clearError() {
      if (avatarError) avatarError.textContent = "";
      if (cropError) cropError.textContent = "";
    }

    function closeCropModal(resetInput) {
      destroyCropper();
      if (cropModal) {
        cropModal.style.display = "none";
        cropModal.setAttribute("aria-hidden", "true");
      }
      document.body.style.overflow = "";
      // Reset preview elements (legacy)
      if (avatarPreview) { avatarPreview.style.display = "none"; avatarPreview.innerHTML = ""; }
      if (avatarSubmit) { avatarSubmit.style.display = "none"; }
      if (resetInput) {
        avatarInput.value = "";
        originalFile = null;
        originalFileType = "";
      }
    }

    function openCropModal(dataUrl) {
      clearError();
      if (!cropModal || !cropImage) return;
      cropImage.src = dataUrl;
      cropModal.style.display = "flex";
      cropModal.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";

      // Wait for image to load before initializing cropper
      var initCropper = function () {
        destroyCropper();
        if (typeof Cropper === "undefined") {
          setError("Kırpma bileşeni yüklenemedi.");
          return;
        }
        cropper = new Cropper(cropImage, {
          aspectRatio: 1,
          viewMode: 1,
          guides: true,
          center: true,
          highlight: false,
          background: false,
          autoCropArea: 1,
          responsive: true,
          movable: true,
          zoomable: true,
          scalable: false,
          rotatable: false,
          dragMode: "move",
          cropBoxMovable: true,
          cropBoxResizable: true,
          minCropBoxWidth: 50,
          minCropBoxHeight: 50
        });
      };

      if (cropImage.complete) {
        // Slight delay to ensure layout
        setTimeout(initCropper, 30);
      } else {
        cropImage.onload = function () { setTimeout(initCropper, 30); };
        cropImage.onerror = function () {
          setError("Görüntü yüklenemedi.");
          closeCropModal(false);
        };
      }
    }

    // Ensure legacy submit button never triggers (prevent non-cropped upload via form submit)
    if (avatarForm) {
      avatarForm.addEventListener("submit", function (e) {
        // If crop modal is open or cropper flow is active, block native form submit
        // We always handle upload via cropConfirm, so block any direct form submit
        e.preventDefault();
        // If user pressed Enter or clicked legacy submit, reopen crop if file exists
        if (originalFile && !cropper && avatarInput.files && avatarInput.files[0]) {
          // Fallback: trigger change flow again
          var ev = new Event("change");
          avatarInput.dispatchEvent(ev);
        }
      });
    }

    avatarInput.addEventListener("change", function () {
      var file = avatarInput.files[0];
      clearError();

      if (!file) {
        closeCropModal(false);
        return;
      }

      var allowedTypes = ["image/jpeg", "image/png", "image/webp"];
      var allowedExts = [".jpg", ".jpeg", ".png", ".webp"];
      var ext = "." + file.name.split(".").pop().toLowerCase();

      if (!allowedTypes.includes(file.type) || !allowedExts.includes(ext)) {
        setError("Yalnızca JPEG, PNG ve WebP formatları kabul edilir.");
        avatarInput.value = "";
        closeCropModal(false);
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setError("Dosya boyutu en fazla 5 MB olabilir.");
        avatarInput.value = "";
        closeCropModal(false);
        return;
      }

      originalFile = file;
      originalFileType = file.type;

      var reader = new FileReader();
      reader.onload = function (e) {
        openCropModal(e.target.result);
      };
      reader.onerror = function () {
        setError("Dosya okunamadı.");
        avatarInput.value = "";
      };
      reader.readAsDataURL(file);
    });

    function handleCancel() { closeCropModal(true); }

    if (cropCancel) cropCancel.addEventListener("click", handleCancel);
    if (cropClose) cropClose.addEventListener("click", handleCancel);
    if (cropBackdrop) cropBackdrop.addEventListener("click", handleCancel);

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && cropModal && cropModal.style.display !== "none") {
        handleCancel();
      }
    });

    if (cropZoomIn) {
      cropZoomIn.addEventListener("click", function () {
        if (cropper) cropper.zoom(0.1);
      });
    }
    if (cropZoomOut) {
      cropZoomOut.addEventListener("click", function () {
        if (cropper) cropper.zoom(-0.1);
      });
    }

    function getCsrfToken() {
      var meta = document.querySelector('meta[name="csrf-token"]');
      var t = meta ? meta.getAttribute("content") : "";
      if (!t && avatarForm) {
        var hidden = avatarForm.querySelector('input[name="_csrf"]');
        if (hidden) t = hidden.value;
      }
      return t;
    }

    if (cropConfirm) {
      cropConfirm.addEventListener("click", function () {
        if (!cropper || !originalFile) return;
        if (cropConfirm.disabled) return;

        var csrfToken = getCsrfToken();
        if (!csrfToken) {
          setError("Güvenlik anahtarı bulunamadı.");
          return;
        }
        clearError();

        cropConfirm.textContent = "Yükleniyor...";
        cropConfirm.disabled = true;
        cropConfirm.style.opacity = "0.7";
        cropConfirm.style.cursor = "wait";
        if (cropCancel) cropCancel.disabled = true;

        var canvas;
        try {
          canvas = cropper.getCroppedCanvas({
            imageSmoothingQuality: "high",
            fillColor: "#fff"
          });
        } catch (err) {
          setError("Kırpma sırasında hata oluştu.");
          cropConfirm.textContent = "Yükle";
          cropConfirm.disabled = false;
          cropConfirm.style.opacity = "1";
          cropConfirm.style.cursor = "pointer";
          if (cropCancel) cropCancel.disabled = false;
          return;
        }

        if (!canvas) {
          setError("Kırpma alanını kontrol edin.");
          cropConfirm.textContent = "Yükle";
          cropConfirm.disabled = false;
          cropConfirm.style.opacity = "1";
          cropConfirm.style.cursor = "pointer";
          if (cropCancel) cropCancel.disabled = false;
          return;
        }

        var mime = originalFileType;
        if (!["image/jpeg", "image/png", "image/webp"].includes(mime)) mime = "image/jpeg";
        var quality = 1.0;

        var blobHandler = function (blob) {
          if (!blob) {
            if (mime === "image/webp") {
              mime = "image/jpeg";
              canvas.toBlob(blobHandler, "image/jpeg", 1.0);
              return;
            }
            setError("Kırpılmış görüntü oluşturulamadı.");
            cropConfirm.textContent = "Yükle";
            cropConfirm.disabled = false;
            cropConfirm.style.opacity = "1";
            cropConfirm.style.cursor = "pointer";
            if (cropCancel) cropCancel.disabled = false;
            return;
          }

          if (blob.size > 5 * 1024 * 1024) {
            setError("Kırpılmış görüntü 5 MB'ı aşıyor.");
            cropConfirm.textContent = "Yükle";
            cropConfirm.disabled = false;
            cropConfirm.style.opacity = "1";
            cropConfirm.style.cursor = "pointer";
            if (cropCancel) cropCancel.disabled = false;
            return;
          }

          var extMap = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp" };
          var outExt = extMap[mime] || ".jpg";
          var baseName = originalFile.name ? originalFile.name.replace(/\.[^/.]+$/, "") : "avatar";
          if (!baseName) baseName = "avatar";
          var outName = baseName + outExt;
          var croppedFile;
          try {
            croppedFile = new File([blob], outName, { type: mime });
          } catch (e) {
            // Fallback for browsers without File constructor support with type
            croppedFile = blob;
            croppedFile.name = outName;
          }

          var formData = new FormData();
          formData.append("_csrf", csrfToken);
          formData.append("profileImage", croppedFile, outName);

          // Use XMLHttpRequest for AJAX JSON (avoids redirect follow issues that caused Failed to fetch)
          var xhr = new XMLHttpRequest();
          xhr.open("POST", "/profilim/resim-yukle", true);
          xhr.withCredentials = true;
          xhr.timeout = 30000;
          xhr.setRequestHeader("csrf-token", csrfToken);
          xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
          xhr.setRequestHeader("Accept", "application/json");
          // Let browser set Content-Type with boundary automatically
          xhr.onload = function () {
            var t = xhr.responseText || "";
            var isJson = (xhr.getResponseHeader("content-type") || "").indexOf("application/json") !== -1;
            var data = null;
            if (isJson) {
              try { data = JSON.parse(t); } catch (e) {}
            }
            if (xhr.status >= 200 && xhr.status < 300) {
              if (data && data.success) {
                showToast(data.message || "Profil resmi güncellendi.");
                setTimeout(function(){ window.location.href = "/profilim"; }, 400);
              } else if (isJson && data && data.error) {
                setError(data.error + " (kod " + xhr.status + ")");
                cropConfirm.textContent = "Yükle";
                cropConfirm.disabled = false;
                cropConfirm.style.opacity = "1";
                cropConfirm.style.cursor = "pointer";
                if (cropCancel) cropCancel.disabled = false;
              } else {
                window.location.href = "/profilim";
              }
            } else {
              var msg = "Yükleme başarısız.";
              if (data && data.error) msg = data.error;
              else if (xhr.status === 403) msg = "Güvenlik doğrulaması başarısız. Sayfayı yenileyip tekrar deneyin.";
              else if (xhr.status === 413) msg = "Dosya çok büyük.";
              else if (xhr.status === 429) msg = "Çok fazla istek. Lütfen biraz bekleyin.";
              else if (t && t.length < 2000) {
                if (t.indexOf("Güvenlik") !== -1) msg = "Güvenlik doğrulaması başarısız.";
                else if (t.indexOf("günde en fazla") !== -1) msg = "Profil fotoğrafını günde en fazla 2 kez değiştirebilirsiniz.";
                else if (t.indexOf("Yalnızca JPEG") !== -1) msg = "Yalnızca JPEG, PNG ve WebP kabul edilir.";
                else if (t.indexOf("CSRF") !== -1) msg = "Güvenlik doğrulaması başarısız.";
              }
              setError(msg + " (kod " + xhr.status + ")");
              cropConfirm.textContent = "Yükle";
              cropConfirm.disabled = false;
              cropConfirm.style.opacity = "1";
              cropConfirm.style.cursor = "pointer";
              if (cropCancel) cropCancel.disabled = false;
            }
          };
          xhr.onerror = function () {
            fetchFallback();
          };
          xhr.ontimeout = function () {
            setError("Yükleme zaman aşımına uğradı. Lütfen tekrar deneyin.");
            cropConfirm.textContent = "Yükle";
            cropConfirm.disabled = false;
            cropConfirm.style.opacity = "1";
            cropConfirm.style.cursor = "pointer";
            if (cropCancel) cropCancel.disabled = false;
          };
          xhr.onabort = function () {
            setError("Yükleme iptal edildi.");
            cropConfirm.textContent = "Yükle";
            cropConfirm.disabled = false;
            cropConfirm.style.opacity = "1";
            cropConfirm.style.cursor = "pointer";
            if (cropCancel) cropCancel.disabled = false;
          };
          function fetchFallback() {
            fetch("/profilim/resim-yukle", {
              method: "POST",
              headers: { "csrf-token": csrfToken, "X-Requested-With": "XMLHttpRequest", "Accept": "application/json" },
              body: formData,
              credentials: "same-origin"
            }).then(function (res) {
              var ctype = res.headers.get("content-type") || "";
              var isJson = ctype.indexOf("application/json") !== -1;
              if (isJson) {
                return res.json().then(function(data){
                  if (res.ok && data && data.success) {
                    showToast(data.message || "Profil resmi güncellendi.");
                    setTimeout(function(){ window.location.href="/profilim"; }, 400);
                  } else {
                    var msg = (data && data.error) || "Yükleme başarısız (yedek).";
                    setError(msg + " (kod " + res.status + ")");
                    cropConfirm.textContent = "Yükle";
                    cropConfirm.disabled = false;
                    cropConfirm.style.opacity = "1";
                    cropConfirm.style.cursor = "pointer";
                    if (cropCancel) cropCancel.disabled = false;
                  }
                });
              }
              if (res.ok || res.redirected || (res.status >= 200 && res.status < 400)) {
                window.location.href = "/profilim";
              } else {
                return res.text().then(function (t) {
                  var msg = "Yükleme başarısız (yedek).";
                  if (res.status === 403) msg = "Güvenlik doğrulaması başarısız. Sayfayı yenileyin.";
                  setError(msg + " (kod " + res.status + ")");
                  cropConfirm.textContent = "Yükle";
                  cropConfirm.disabled = false;
                  cropConfirm.style.opacity = "1";
                  cropConfirm.style.cursor = "pointer";
                  if (cropCancel) cropCancel.disabled = false;
                });
              }
            }).catch(function (err) {
              var detail = err && err.message ? " ("+err.message+")" : "";
              setError("Bağlantı hatası. Lütfen internet bağlantınızı kontrol edin. (ağ hatası"+detail+")");
              cropConfirm.textContent = "Yükle";
              cropConfirm.disabled = false;
              cropConfirm.style.opacity = "1";
              cropConfirm.style.cursor = "pointer";
              if (cropCancel) cropCancel.disabled = false;
            });
          }
          try {
            xhr.send(formData);
          } catch (err) {
            setError("Bağlantı hatası. (" + (err && err.message ? err.message : "gönderilemedi") + ")");
            cropConfirm.textContent = "Yükle";
            cropConfirm.disabled = false;
            cropConfirm.style.opacity = "1";
            cropConfirm.style.cursor = "pointer";
            if (cropCancel) cropCancel.disabled = false;
          }
        };
        try {
          canvas.toBlob(blobHandler, mime, quality);
        } catch (e) {
          canvas.toBlob(blobHandler, "image/jpeg", 1.0);
        }
      });
    }
  })();

  /* ── Forum Like (detail page) ── */
  (function () {
    var likeBtn = document.getElementById("likeBtn");
    if (!likeBtn) return;

    likeBtn.addEventListener("click", async function () {
      if (document.body.dataset.userLoggedIn !== "true") {
        showMessage("Giriş yapmalısınız.", "warning");
        return;
      }

      var postId = likeBtn.dataset.postId;
      var csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute("content");

      try {
        var res = await fetch("/api/post-begen/" + postId, {
          method: "POST",
          headers: { "Content-Type": "application/json", "csrf-token": csrfToken },
        });
        var data = await res.json();
        if (res.ok) {
          var icon = document.getElementById("likeIcon");
          if (data.liked) {
            icon.setAttribute("fill", "var(--lake-deep)");
            likeBtn.setAttribute("data-liked", "true");
          } else {
            icon.setAttribute("fill", "none");
            likeBtn.setAttribute("data-liked", "false");
          }
          document.getElementById("likeCount").textContent = data.likes;
        } else {
          showMessage(data.error || "Bir hata oluştu", "error");
        }
      } catch (err) {
        showMessage("Bağlantı hatası", "error");
      }
    });
  })();

  /* ── Forum Detail: Reply Toggle ── */
  (function () {
    var toggleBtn = document.getElementById("repliesToggleBtn");
    if (!toggleBtn) return;

    toggleBtn.addEventListener("click", function () {
      var section = document.getElementById("repliesSection");
      section.style.display = section.style.display === "none" ? "block" : "none";
    });
  })();

  /* ── Forum Detail: Submit Reply ── */
  (function () {
    var replySubmit = document.getElementById("replySubmitBtn");
    if (!replySubmit) return;

    replySubmit.addEventListener("click", async function () {
      if (document.body.dataset.userLoggedIn !== "true") {
        showMessage("Giriş yapmalısınız.", "warning");
        return;
      }

      var postId = document.getElementById("likeBtn").dataset.postId;
      var content = document.getElementById("replyContent").value.trim();

      if (!content) {
        showMessage("Yanıt boş olamaz.", "warning");
        return;
      }

      var csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute("content");

      try {
        var res = await fetch("/api/yanit-ekle/" + postId, {
          method: "POST",
          headers: { "Content-Type": "application/json", "csrf-token": csrfToken },
          body: JSON.stringify({ content: content }),
        });
        var data = await res.json();

        if (res.ok && data.reply) {
          var list = document.getElementById("repliesList");
          var empty = document.getElementById("noRepliesMsg");
          if (empty) empty.remove();
          var html = buildReplyHtml(data.reply);
          var isAdmin = data.reply.User && data.reply.User.role === "admin";
          if (!isAdmin) {
            var items = list.querySelectorAll(".reply-item");
            var lastAdmin = -1;
            for (var i = 0; i < items.length; i++) { if (items[i].querySelector(".admin-username")) lastAdmin = i; }
            if (lastAdmin >= 0) { items[lastAdmin].insertAdjacentHTML("afterend", html); } else { list.insertAdjacentHTML("afterbegin", html); }
          } else {
            list.insertAdjacentHTML("afterbegin", html);
          }
          document.getElementById("replyContent").value = "";

          var label = document.getElementById("repliesToggleLabel");
          var match = label.textContent.match(/\((\d+)\)/);
          var count = match ? parseInt(match[1]) + 1 : 1;
          label.textContent = "Yanıtlar (" + count + ")";
        } else {
          showMessage(data.error || "Bir hata oluştu", "error");
        }
      } catch (err) {
        showMessage("Bağlantı hatası", "error");
      }
    });

    function buildReplyHtml(r) {
      var date = new Date(r.createdAt).toLocaleDateString("tr-TR");
      var username = escapeHtml(r.User.username);
      var content = escapeHtml(r.content);
      var isAdmin = r.User && r.User.role === "admin";
      var adminClass = isAdmin ? ' class="admin-username"' : "";
      var avatarAdminClass = isAdmin ? ' admin-avatar' : "";
      var tickHtml = isAdmin ? '<span class="admin-tick" title="Doğrulanmış Admin" aria-label="Doğrulanmış Admin"><span class="admin-tick-outer" aria-hidden="true"><svg viewBox="0 0 100 100" class="admin-tick-gear" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M98 50 L79.42 55.85 L94.35 68.37 L74.94 66.67 L83.94 83.94 L66.67 74.94 L68.37 94.35 L55.85 79.42 L50 98 L44.15 79.42 L31.63 94.35 L33.33 74.94 L16.06 83.94 L25.06 66.67 L5.65 68.37 L20.58 55.85 L2 50 L20.58 44.15 L5.65 31.63 L25.06 33.33 L16.06 16.06 L33.33 25.06 L31.63 5.65 L44.15 20.58 L50 2 L55.85 20.58 L68.37 5.65 L66.67 25.06 L83.94 16.06 L74.94 33.33 L94.35 31.63 L79.42 44.15 Z"/></svg></span><span class="admin-tick-inner"><svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M8.2 12.4l2.8 2.8 5.8-5.8" stroke="white" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg></span></span>' : "";
      var avatarHtml;
      var avatarAttr = 'data-avatar=""';
      if (r.User.profileImage) {
        var src = r.User.avatarUrl || "";
        avatarHtml = '<img src="' + escapeHtml(src) + '" alt="" class="reply-avatar-img" style="width:34px;height:34px;" loading="lazy">';
        avatarAttr = 'data-avatar="' + escapeHtml(r.User.profileImage) + '"';
      } else {
        var initial = escapeHtml(r.User.username.charAt(0).toUpperCase());
        avatarHtml = initial;
      }
      var nameAvatarAttr = r.User && r.User.profileImage ? ' data-avatar="' + escapeHtml(r.User.profileImage) + '"' : ' data-avatar=""';
      return (
        '<div class="reply-item">' +
        '<div class="reply-avatar' + avatarAdminClass + '" ' + avatarAttr + ">" + avatarHtml + "</div>" +
        '<div class="reply-body">' +
        '<div class="reply-head"><strong' + adminClass + nameAvatarAttr + ">" + username + "</strong>" + tickHtml + " &middot; " + date + "</div>" +
        '<div class="reply-text">' + content + "</div>" +
        "</div>" +
        "</div>"
      );
    }
  })();

  /* ── Forum Detail: Load More Replies ── */
  (function () {
    var loadMoreBtn = document.getElementById("loadMoreBtn");
    if (!loadMoreBtn) return;

    var replyOffset = 10;

    loadMoreBtn.addEventListener("click", async function () {
      var postId = document.getElementById("likeBtn").dataset.postId;

      try {
        var res = await fetch("/api/yanitlar/" + postId + "?offset=" + replyOffset);
        var data = await res.json();

        if (res.ok) {
          var list = document.getElementById("repliesList");
          data.replies.forEach(function (r) {
            list.insertAdjacentHTML("beforeend", buildReplyHtml(r));
          });
          replyOffset += 10;
          if (!data.hasMore) {
            loadMoreBtn.remove();
          }
        }
      } catch (err) {
        showMessage("Bağlantı hatası", "error");
      }
    });
  })();

  /* ── Forum Feed: Quick Create Form Validation ── */
  (function () {
    var form = document.querySelector(".create-card form");
    if (!form) return;

    var title = document.getElementById("feed-title");
    var content = document.getElementById("feed-content");
    var titleErr = document.getElementById("feed-title-error");
    var contentErr = document.getElementById("feed-content-error");

    function validateTitle() {
      var val = title.value.trim();
      if (val.length < 5) { titleErr.textContent = "Başlık en az 5 karakter olmalıdır."; titleErr.style.display = ""; return false; }
      if (val.length > 120) { titleErr.textContent = "Başlık en fazla 120 karakter olabilir."; titleErr.style.display = ""; return false; }
      titleErr.style.display = "none"; return true;
    }

    function validateContent() {
      var val = content.value.trim();
      if (val.length < 20) { contentErr.textContent = "İçerik en az 20 karakter olmalıdır."; contentErr.style.display = ""; return false; }
      if (val.length > 10000) { contentErr.textContent = "İçerik en fazla 10.000 karakter olabilir."; contentErr.style.display = ""; return false; }
      contentErr.style.display = "none"; return true;
    }

    title.addEventListener("input", function () { titleErr.style.display = "none"; });
    content.addEventListener("input", function () { contentErr.style.display = "none"; });

    form.addEventListener("submit", function (e) {
      var ok = validateTitle() & validateContent();
      if (!ok) e.preventDefault();
    });
  })();

  /* ── Forum Feed / Detail: Like Btn (event delegation) ── */
  document.addEventListener("click", function (e) {
    var btn = e.target.closest(".like-btn");
    if (!btn) return;

    if (document.body.dataset.userLoggedIn !== "true") {
      showMessage("Giriş yapmalısınız.", "warning");
      return;
    }

    var postId = btn.dataset.postId;
    var csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute("content");

    fetch("/api/post-begen/" + postId, {
      method: "POST",
      headers: { "Content-Type": "application/json", "csrf-token": csrfToken },
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data.liked !== undefined) {
          var icon = btn.querySelector(".like-icon");
          var count = btn.querySelector(".like-count");
          icon.setAttribute("fill", data.liked ? "var(--lake-deep)" : "none");
          count.textContent = data.likes;
        } else {
          showMessage(data.error || "Hata", "error");
        }
      })
      .catch(function () { showMessage("Bağlantı hatası", "error"); });
  });

  /* ── Forum Feed / Detail: Reply Toggle (event delegation) ── */
  document.addEventListener("click", function (e) {
    var btn = e.target.closest(".reply-btn");
    if (!btn) return;

    var section = btn.closest(".post-card").querySelector(".reply-section");
    var isHidden = section.style.display === "none" || !section.style.display;
    section.style.display = isHidden ? "block" : "none";
    btn.classList.toggle("active", isHidden);
  });

  /* ── Forum Feed: Submit Reply (event delegation) ── */
  document.addEventListener("click", async function (e) {
    var btn = e.target.closest(".reply-submit-btn");
    if (!btn) return;

    if (document.body.dataset.userLoggedIn !== "true") {
      showMessage("Giriş yapmalısınız.", "warning");
      return;
    }

    var postId = btn.dataset.postId;
    var textarea = btn.closest(".reply-form").querySelector(".reply-textarea");
    var content = textarea.value.trim();

    if (!content) {
      showMessage("Yanıt boş olamaz.", "warning");
      return;
    }

    var csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute("content");

    try {
      var res = await fetch("/api/yanit-ekle/" + postId, {
        method: "POST",
        headers: { "Content-Type": "application/json", "csrf-token": csrfToken },
        body: JSON.stringify({ content: content }),
      });
      var data = await res.json();

      if (res.ok && data.reply) {
        var section = btn.closest(".reply-section");
        var list = section.querySelector(".replies-list");
        var empty = list.querySelector(".no-replies-msg");
        if (empty) empty.remove();
        var html2 = buildFeedReplyHtml(data.reply);
        var isAdmin2 = data.reply.User && data.reply.User.role === "admin";
        if (!isAdmin2) {
          var items2 = list.querySelectorAll(".reply-item");
          var lastAdmin2 = -1;
          for (var j = 0; j < items2.length; j++) { if (items2[j].querySelector(".admin-username")) lastAdmin2 = j; }
          if (lastAdmin2 >= 0) { items2[lastAdmin2].insertAdjacentHTML("afterend", html2); } else { list.insertAdjacentHTML("afterbegin", html2); }
        } else {
          list.insertAdjacentHTML("afterbegin", html2);
        }
        textarea.value = "";

        var loadBtn = section.querySelector(".load-more-btn");
        if (loadBtn) {
          var match = loadBtn.textContent.match(/\((\d+)\)/);
          if (match) {
            var remaining = parseInt(match[1]);
            if (remaining > 0) {
              loadBtn.textContent = "Daha fazla yanıt göster (" + (remaining - 1) + ")";
            }
            if (remaining <= 1) {
              loadBtn.remove();
            }
          }
        }
      } else {
        showMessage(data.error || "Bir hata oluştu", "error");
      }
    } catch (err) {
      showMessage("Bağlantı hatası", "error");
    }
  });

  function buildFeedReplyHtml(r) {
    var date = new Date(r.createdAt).toLocaleDateString("tr-TR");
    var username = escapeHtml(r.User ? r.User.username : "");
    var content = escapeHtml(r.content);
    var isAdmin = r.User && r.User.role === "admin";
    var adminClass = isAdmin ? ' class="admin-username"' : "";
    var avatarAdminClass = isAdmin ? ' admin-avatar' : "";
    var tickHtml = isAdmin ? '<span class="admin-tick" title="Doğrulanmış Admin" aria-label="Doğrulanmış Admin"><span class="admin-tick-outer" aria-hidden="true"><svg viewBox="0 0 100 100" class="admin-tick-gear" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M98 50 L79.42 55.85 L94.35 68.37 L74.94 66.67 L83.94 83.94 L66.67 74.94 L68.37 94.35 L55.85 79.42 L50 98 L44.15 79.42 L31.63 94.35 L33.33 74.94 L16.06 83.94 L25.06 66.67 L5.65 68.37 L20.58 55.85 L2 50 L20.58 44.15 L5.65 31.63 L25.06 33.33 L16.06 16.06 L33.33 25.06 L31.63 5.65 L44.15 20.58 L50 2 L55.85 20.58 L68.37 5.65 L66.67 25.06 L83.94 16.06 L74.94 33.33 L94.35 31.63 L79.42 44.15 Z"/></svg></span><span class="admin-tick-inner"><svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M8.2 12.4l2.8 2.8 5.8-5.8" stroke="white" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg></span></span>' : "";
    var avatarHtml;
    var nameAvatarAttr = r.User && r.User.profileImage ? ' data-avatar="' + escapeHtml(r.User.profileImage) + '"' : ' data-avatar=""';
    if (r.User && r.User.avatarUrl) {
      var profileImage = r.User.profileImage || "";
      avatarHtml = '<img src="' + escapeHtml(r.User.avatarUrl) + '" alt="" class="reply-avatar-img" loading="lazy" data-avatar="' + escapeHtml(profileImage) + '">';
    } else {
      var initial = escapeHtml(r.User ? r.User.username.charAt(0).toUpperCase() : "?");
      avatarHtml = '<div class="reply-avatar' + avatarAdminClass + '" data-avatar="' + escapeHtml((r.User && r.User.profileImage) || "") + '">' + initial + "</div>";
    }
    return (
      '<div class="reply-item">' +
      avatarHtml +
      '<div class="reply-body">' +
      '<div class="reply-head"><strong' + adminClass + nameAvatarAttr + ">" + username + "</strong>" + tickHtml + " &middot; " + date + "</div>" +
      '<div class="reply-text">' + content + "</div>" +
      "</div>" +
      "</div>"
    );
  }

  /* ── Forum Feed: Load More Replies (event delegation) ── */
  document.addEventListener("click", async function (e) {
    var btn = e.target.closest(".load-more-btn");
    if (!btn) return;

    var postId = btn.dataset.postId;
    var offset = parseInt(btn.dataset.offset);

    try {
      var res = await fetch("/api/yanitlar/" + postId + "?offset=" + offset);
      var data = await res.json();

      if (res.ok) {
        var section = btn.closest(".reply-section");
        var list = section.querySelector(".replies-list");
        var empty = list.querySelector(".no-replies-msg");
        if (empty) empty.remove();

        data.replies.forEach(function (r) {
          list.insertAdjacentHTML("beforeend", buildFeedReplyHtml(r));
        });

        btn.dataset.offset = offset + 10;

        if (!data.hasMore) {
          btn.remove();
        } else {
          var remaining = data.total - (offset + 10);
          btn.textContent = "Daha fazla yanıt göster (" + remaining + ")";
        }
      }
    } catch (err) {
      showMessage("Bağlantı hatası", "error");
    }
  });

  /* ── Forum Feed: Infinite Scroll ── */
  (function () {
    var feedList = document.getElementById("feed-list");
    var sentinel = document.getElementById("sentinel");
    var body = document.body;
    if (!feedList || !sentinel) return;

    var offset = parseInt(body.dataset.initialOffset) || 10;
    var hasMore = body.dataset.hasMore === "true";
    var kategori = body.dataset.kategori || "";
    var loading = false;
    var searching = false;

    function buildPostHtml(post) {
      var initial = post.User ? post.User.username.charAt(0).toUpperCase() : "?";
      var isPostAdmin = post.User && post.User.role === "admin";
      var avatarHtml;
      if (post.User && post.User.avatarUrl) {
        avatarHtml = '<img src="' + escapeHtml(post.User.avatarUrl) + '" alt="" class="feed-avatar" loading="lazy">';
      } else {
        avatarHtml = '<span class="feed-avatar-letter' + (isPostAdmin ? ' admin-avatar' : '') + '">' + initial + "</span>";
      }

      var tickHtml = isPostAdmin ? '<span class="admin-tick" title="Doğrulanmış Admin" aria-label="Doğrulanmış Admin"><span class="admin-tick-outer" aria-hidden="true"><svg viewBox="0 0 100 100" class="admin-tick-gear" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M98 50 L79.42 55.85 L94.35 68.37 L74.94 66.67 L83.94 83.94 L66.67 74.94 L68.37 94.35 L55.85 79.42 L50 98 L44.15 79.42 L31.63 94.35 L33.33 74.94 L16.06 83.94 L25.06 66.67 L5.65 68.37 L20.58 55.85 L2 50 L20.58 44.15 L5.65 31.63 L25.06 33.33 L16.06 16.06 L33.33 25.06 L31.63 5.65 L44.15 20.58 L50 2 L55.85 20.58 L68.37 5.65 L66.67 25.06 L83.94 16.06 L74.94 33.33 L94.35 31.63 L79.42 44.15 Z"/></svg></span><span class="admin-tick-inner"><svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M8.2 12.4l2.8 2.8 5.8-5.8" stroke="white" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg></span></span>' : "";
      var authorHtml =
        '<span class="post-author" data-avatar="' +
        (post.User && post.User.profileImage ? escapeHtml(post.User.profileImage) : "") +
        '">' +
        avatarHtml +
        '<strong' + (isPostAdmin ? ' class="admin-username"' : "") + ">" +
        escapeHtml(post.User ? post.User.username : "?") +
        "</strong>" + tickHtml +
        "</span>";

      var date = new Date(post.createdAt).toLocaleDateString("tr-TR");
      var likes = post.likes || 0;
      var replyCount = post.replyCount || 0;

      var repliesHtml = "";
      var replies = post.replies || [];
      replies.forEach(function (r) { repliesHtml += buildFeedReplyHtml(r); });
      if (replies.length === 0) {
        repliesHtml = '<p class="no-replies-msg">Henüz yanıt yok.</p>';
      }

      var isLoggedIn = document.body.dataset.userLoggedIn === "true";
      var replyFormHtml = isLoggedIn
        ? '<div class="reply-form">' +
          '<textarea class="reply-textarea" rows="3" placeholder="Yanıtınızı yazın..."></textarea>' +
          '<button class="btn btn-solid reply-submit-btn" data-post-id="' + post.id + '">Gönder</button>' +
          "</div>"
        : '<div class="guest-note"><a href="/giris-yap">Giriş yap</a> veya <a href="/kayit-ol">kaydol</a> ve yanıt yaz.</div>';

      var loadMoreHtml = replyCount > 3
        ? '<button class="load-more-btn" data-post-id="' + post.id + '" data-offset="3">Daha fazla yanıt göster (' + (replyCount - 3) + ")</button>"
        : "";

      var pinHtml = isPostAdmin
        ? '<span class="creator-badge">Kurucu Tarafından</span>'
        : '<span class="pin"></span>';
      return (
        '<article class="post-card" style="margin-bottom:20px;">' +
        pinHtml +
        '<h1 class="post-title">' + escapeHtml(post.title) + "</h1>" +
        '<div class="post-meta">' +
        '<span class="cat-tag">' + escapeHtml(post.category) + "</span>" +
        "<span>·</span>" +
        authorHtml +
        "<span>·</span>" +
        '<span class="mono">' + date + "</span>" +
        "</div>" +
        '<div class="post-content">' + escapeHtml(post.content) + "</div>" +
        '<div class="actions" style="margin-top:16px;">' +
        '<button class="like-btn action-btn" data-post-id="' + post.id + '">' +
        '<svg class="like-icon" width="18" height="18" viewBox="0 0 24 24" fill="' + (post.userLiked ? "var(--lake-deep)" : "none") + '" stroke="var(--lake-deep)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />' +
        "</svg>" +
        '<span class="like-count">' + likes + "</span>" +
        "</button>" +
        '<button class="reply-btn action-btn" data-post-id="' + post.id + '">' +
        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--ink)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />' +
        "</svg>" +
        "<span>Yanıtlar" + (replyCount > 0 ? " (" + replyCount + ")" : "") + "</span>" +
        "</button>" +
        "</div>" +
        '<button class="save-post-btn' + (post.userSaved ? ' saved' : '') + '" data-post-id="' + post.id + '" aria-label="' + (post.userSaved ? 'Kaydı kaldır' : 'Kaydet') + '" title="' + (post.userSaved ? 'Kaydedildi' : 'Kaydet') + '"><svg width="16" height="16" viewBox="0 0 24 24" stroke-width="2" fill="' + (post.userSaved ? 'currentColor' : 'none') + '" stroke="currentColor"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg></button>' +
        '<div class="reply-section" style="display:none;">' +
        replyFormHtml +
        '<div class="replies-list">' + repliesHtml + "</div>" +
        loadMoreHtml +
        "</div>" +
        "</article>"
      );
    }

    function loadMore() {
      if (loading || searching || !hasMore) return;
      loading = true;

      var loadingEl = document.createElement("div");
      loadingEl.className = "loading";
      loadingEl.textContent = "Yükleniyor...";
      sentinel.parentNode.insertBefore(loadingEl, sentinel);

      var url = "/api/posts?offset=" + offset;
      if (kategori) url += "&category=" + encodeURIComponent(kategori);

      fetch(url)
        .then(function (res) { return res.json(); })
        .then(function (data) {
          loadingEl.remove();
          if (!data.posts || data.posts.length === 0) { hasMore = false; return; }

          var fragment = document.createDocumentFragment();
          data.posts.forEach(function (post) {
            var div = document.createElement("div");
            div.innerHTML = buildPostHtml(post);
            fragment.appendChild(div.firstElementChild);
          });

          feedList.appendChild(fragment);
          offset += data.posts.length;
          hasMore = data.hasMore;

          if (!hasMore) {
            var endNote = document.createElement("div");
            endNote.className = "end-note";
            endNote.textContent = "Tüm gönderiler yüklendi.";
            sentinel.parentNode.insertBefore(endNote, sentinel);
          }

          loading = false;
        })
        .catch(function () {
          loadingEl.textContent = "Yüklenirken bir hata oluştu.";
          loading = false;
        });
    }

    if (typeof IntersectionObserver !== "undefined") {
      var observer = new IntersectionObserver(
        function (entries) {
          if (entries[0].isIntersecting) loadMore();
        },
        { rootMargin: "200px" }
      );
      observer.observe(sentinel);
    }

    /* ── Forum Feed: Search ── */
    var searchForm = document.getElementById("feed-search-form");
    if (searchForm) {
      var searchInput = document.getElementById("feed-search-input");
      var searchStatus = document.getElementById("feed-search-status");
      var searchMessage = document.getElementById("feed-search-message");
      var searchClearBtn = document.getElementById("feed-search-clear");

      function executeSearch(q) {
        if (!q) {
          window.location.href = window.location.pathname;
          return;
        }
        searching = true;
        var endNote = feedList.parentNode.querySelector(".end-note");
        if (endNote) endNote.remove();
        feedList.innerHTML = '<div class="loading">Aranıyor...</div>';
        fetch("/api/arama?q=" + encodeURIComponent(q))
          .then(function (res) { return res.json(); })
          .then(function (data) {
            if (data.error) throw new Error(data.error);
            feedList.innerHTML = "";
            if (!data.posts || data.posts.length === 0) {
              feedList.innerHTML =
                '<div class="empty"><p>"' + escapeHtml(q) + '" için sonuç bulunamadı.</p></div>';
            } else {
              data.posts.forEach(function (post) {
                var div = document.createElement("div");
                div.innerHTML = buildPostHtml(post);
                feedList.appendChild(div.firstElementChild);
              });
            }
            searchMessage.textContent = '"' + q + '" için ' + data.total + " sonuç bulundu.";
            searchStatus.style.display = "flex";
            searchInput.blur();
          })
          .catch(function () {
            feedList.innerHTML = "";
            searchMessage.textContent = "Arama yapılırken bir hata oluştu.";
            searchStatus.style.display = "flex";
          });
      }

      searchForm.addEventListener("submit", function (e) {
        e.preventDefault();
        var q = searchInput.value.trim();
        executeSearch(q);
      });

      searchClearBtn.addEventListener("click", function () {
        window.location.href = window.location.pathname;
      });

      // Auto-search when ?q= present (e.g., homepage search redirect)
      try {
        var params = new URLSearchParams(window.location.search);
        var initialQ = params.get("q");
        if (initialQ && initialQ.trim()) {
          var trimmedQ = initialQ.trim();
          searchInput.value = trimmedQ;
          executeSearch(trimmedQ);
        }
      } catch (err) {}
    }
  })();

  /* ── Forum List: Infinite Scroll + Delete ── */
  (function () {
    var topicList = document.getElementById("topic-list");
    var sentinel = document.getElementById("sentinel");
    var body = document.body;
    if (!topicList || !sentinel) return;

    var offset = parseInt(body.dataset.initialOffset) || 10;
    var hasMore = body.dataset.hasMore === "true";
    var isAdmin = body.dataset.isAdmin === "true";
    var loading = false;
    var csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute("content");

    function deletePost(postId) {
      showConfirm("Bu konuyu silmek istediğinize emin misiniz?", function () {
        fetch("/admin/konu-sil/" + postId, {
          method: "POST",
          headers: { "csrf-token": csrfToken },
        })
          .then(function (res) {
            if (res.ok || res.redirected) location.reload();
            else showMessage("Silme işlemi başarısız", "error");
          })
          .catch(function () { showMessage("Bağlantı hatası", "error"); });
      });
    }

    topicList.addEventListener("click", function (e) {
      var btn = e.target.closest(".delete-btn");
      if (btn) {
        deletePost(btn.dataset.postId);
      }
    });

    function loadMore() {
      if (loading || !hasMore) return;
      loading = true;

      var loadingEl = document.createElement("div");
      loadingEl.className = "loading";
      loadingEl.textContent = "Yükleniyor...";
      sentinel.parentNode.insertBefore(loadingEl, sentinel);

      fetch("/api/posts?offset=" + offset)
        .then(function (res) { return res.json(); })
        .then(function (data) {
          loadingEl.remove();
          if (!data.posts || data.posts.length === 0) { hasMore = false; return; }

          isAdmin = data.isAdmin;
          var fragment = document.createDocumentFragment();

          data.posts.forEach(function (post) {
            var div = document.createElement("div");
            div.className = "topic";

            var initial = post.User ? post.User.username.charAt(0).toUpperCase() : "?";
            var isTopicAdmin = post.User && post.User.role === "admin";
            var avatarHtml;
            if (post.User && post.User.avatarUrl) {
              avatarHtml = '<img src="' + escapeHtml(post.User.avatarUrl) + '" alt="" class="topic-avatar-img" loading="lazy">';
            } else {
              avatarHtml = initial;
            }

            var authorHtml;
            if (post.User) {
              var avatarSrc = escapeHtml(post.User.avatarUrl || "");
              var avatarInner;
              if (post.User.avatarUrl) {
                avatarInner = '<img src="' + avatarSrc + '" alt="" class="topic-author-avatar" loading="lazy">';
              } else {
                avatarInner = '<span class="topic-author-letter' + (isTopicAdmin ? ' admin-avatar' : '') + '">' + initial + "</span>";
              }
              var isAuthorAdmin = post.User.role === "admin";
              var topicTickHtml = isAuthorAdmin ? '<span class="admin-tick" title="Doğrulanmış Admin" aria-label="Doğrulanmış Admin"><span class="admin-tick-outer" aria-hidden="true"><svg viewBox="0 0 100 100" class="admin-tick-gear" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M98 50 L79.42 55.85 L94.35 68.37 L74.94 66.67 L83.94 83.94 L66.67 74.94 L68.37 94.35 L55.85 79.42 L50 98 L44.15 79.42 L31.63 94.35 L33.33 74.94 L16.06 83.94 L25.06 66.67 L5.65 68.37 L20.58 55.85 L2 50 L20.58 44.15 L5.65 31.63 L25.06 33.33 L16.06 16.06 L33.33 25.06 L31.63 5.65 L44.15 20.58 L50 2 L55.85 20.58 L68.37 5.65 L66.67 25.06 L83.94 16.06 L74.94 33.33 L94.35 31.63 L79.42 44.15 Z"/></svg></span><span class="admin-tick-inner"><svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M8.2 12.4l2.8 2.8 5.8-5.8" stroke="white" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg></span></span>' : "";
              authorHtml =
                '<span class="topic-author" data-avatar="' +
                (post.User.profileImage ? escapeHtml(post.User.profileImage) : "") +
                '">' +
                avatarInner +
                '<span' + (isAuthorAdmin ? ' class="admin-username"' : "") + ">" +
                escapeHtml(post.User.username) +
                "</span>" + topicTickHtml +
                "</span>";
            } else {
              authorHtml = "?";
            }

            var date = new Date(post.createdAt).toLocaleDateString("tr-TR");
            var deleteHtml = isAdmin
              ? '<button class="delete-btn" data-post-id="' + post.id + '">Sil</button>'
              : "";

            div.innerHTML =
              '<div class="topic-avatar' + (isTopicAdmin && !post.User.avatarUrl ? ' admin-avatar' : '') + '" style="background:var(--lake)">' +
              avatarHtml +
              "</div>" +
              '<div class="topic-body">' +
              '<div class="topic-title">' +
              '<a href="/forum/konu/' +
              post.id +
              "/" +
              escapeHtml(post.slug || "") +
              '">' +
              escapeHtml(post.title) +
              "</a>" +
              deleteHtml +
              "</div>" +
              '<div class="topic-sub">' +
              '<span class="cat-tag">' +
              escapeHtml(post.category) +
              "</span>" +
              " · " +
              authorHtml +
              ' · <span class="mono">' +
              date +
              "</span>" +
              "</div>" +
              "</div>" +
              '<div class="topic-stats">' +
              "<b>" +
              (post.likes || 0) +
              "</b>" +
              "<span>beğeni</span>" +
              "</div>";

            fragment.appendChild(div);
          });

          topicList.appendChild(fragment);
          offset += data.posts.length;
          hasMore = data.hasMore;

          if (!hasMore) {
            var endNote = document.createElement("div");
            endNote.className = "end-note";
            endNote.textContent = "Tüm konular yüklendi.";
            sentinel.parentNode.insertBefore(endNote, sentinel);
          }

          loading = false;
        })
        .catch(function () {
          loadingEl.textContent = "Yüklenirken bir hata oluştu.";
          loading = false;
        });
    }

    if (typeof IntersectionObserver !== "undefined") {
      var observer = new IntersectionObserver(
        function (entries) {
          if (entries[0].isIntersecting) loadMore();
        },
        { rootMargin: "200px" }
      );
      observer.observe(sentinel);
    }
  })();

  /* ── Forum Create: Char Counter ── */
  (function () {
    var titleInput = document.getElementById("title");
    var contentInput = document.getElementById("content");
    var titleHint = document.getElementById("title-hint");
    var contentHint = document.getElementById("content-hint");

    function updateCharCount(input, hint, max) {
      var len = input.value.length;
      hint.textContent = "(" + len + "/" + max + ")";
      hint.style.color = len > max ? "var(--clay)" : "";
    }

    if (titleInput && titleHint) {
      titleInput.addEventListener("input", function () { updateCharCount(titleInput, titleHint, 120); });
    }
    if (contentInput && contentHint) {
      contentInput.addEventListener("input", function () { updateCharCount(contentInput, contentHint, 10000); });
    }
  })();

  /* ── Password Reset: Match Check ── */
  (function () {
    var password = document.getElementById("password");
    var confirm = document.getElementById("password-confirm");
    var errorEl = document.getElementById("password-error");
    var submitBtn = document.getElementById("submit-btn");
    if (!password || !confirm || !errorEl || !submitBtn) return;

    function checkMatch() {
      if (confirm.value.length === 0) {
        errorEl.style.display = "none";
        submitBtn.disabled = false;
        return;
      }
      if (password.value !== confirm.value) {
        errorEl.style.display = "block";
        submitBtn.disabled = true;
      } else {
        errorEl.style.display = "none";
        submitBtn.disabled = false;
      }
    }

    password.addEventListener("input", checkMatch);
    confirm.addEventListener("input", checkMatch);
  })();

  /* ── Confirm forms via data-confirm (replaces onsubmit="return confirm()") ── */
  document.addEventListener("submit", function (e) {
    var form = e.target;
    if (!form || !form.hasAttribute || !form.hasAttribute("data-confirm")) return;
    e.preventDefault();
    var msg = form.getAttribute("data-confirm") || "Emin misiniz?";
    showConfirm(msg, function () { form.submit(); });
  });

  /* ── Admin Users: Delete Confirmation ── */
  (function () {
    var table = document.querySelector(".user-table");
    if (!table) return;

    table.addEventListener("click", function (e) {
      var btn = e.target.closest(".btn-delete");
      if (!btn) return;
      var form = btn.closest("form");
      if (!form) return;
      e.preventDefault();
      var username = form.dataset.username || "bu kullanıcıyı";
      showConfirm(username + " kullanıcısını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.", function () {
        form.submit();
      });
    });
  })();

  /* ── Admin Jobs: Delete Confirmation ── */
  (function () {
    var list = document.querySelector(".job-list");
    if (!list) return;

    list.addEventListener("click", function (e) {
      var btn = e.target.closest(".job-delete-form");
      if (!btn) return;
      var form = btn.tagName === "FORM" ? btn : btn.closest("form");
      if (!form) return;
      e.preventDefault();
      var title = (btn.closest(".job-card").querySelector(".job-info strong") || {}).textContent || "Bu ilanı";
      showConfirm('"' + title + '" ilanını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.', function () {
        form.submit();
      });
    });
  })();

  /* ── Profile Jobs: Delete Confirmation ── */
  (function () {
    var list = document.getElementById("myJobs");
    if (!list) return;

    list.addEventListener("click", function (e) {
      var btn = e.target.closest(".job-delete-form");
      if (!btn) return;
      var form = btn.closest("form");
      if (!form) return;
      e.preventDefault();
      var title = (form && form.dataset.title) || "Bu ilanı";
      showConfirm('"' + title + '" ilanını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.', function () {
        form.submit();
      });
    });
  })();

  /* ── Admin Users: Avatar Popup ── */
  (function () {
    var overlay = document.getElementById("avatar-overlay");
    var popup = document.getElementById("avatar-popup");
    var popupImg = document.getElementById("avatar-popup-img");
    if (!overlay || !popup || !popupImg) return;

    document.querySelector(".user-table")?.addEventListener("click", function (e) {
      var avatar = e.target.closest(".user-avatar-click");
      if (avatar && avatar.dataset.avatar) {
        var largeUrl = getLargeUrl(avatar.dataset.avatar);
        if (!largeUrl) return;
        popupImg.src = largeUrl;
        overlay.style.display = "block";
        popup.style.display = "flex";
      }
    });
  })();

  /* ── Password Toggle (auth pages) ── */
  (function () {
    document.addEventListener("click", function (e) {
      var btn = e.target.closest(".password-toggle");
      if (!btn) return;
      var field = btn.closest(".password-field");
      if (!field) return;
      var input = field.querySelector('input[type="password"], input[type="text"]');
      if (!input) return;
      var isPassword = input.type === "password";
      input.type = isPassword ? "text" : "password";
      field.classList.toggle("show-password", isPassword);
      btn.setAttribute("aria-label", isPassword ? "Şifreyi gizle" : "Şifreyi göster");
    });
  })();

  /* ── Add Job: Form Validation ── */
  (function () {
    var form = document.getElementById("job-form");
    if (!form) return;

    var rules = {
      title: { required: true, label: "İlan başlığı zorunludur." },
      company: { required: true, label: "Şirket adı zorunludur." },
      location: { required: true, label: "Konum zorunludur." },
      description: { required: true, label: "İş açıklaması zorunludur." },
      salary: { salary: true, label: "Maaş bilgisi geçersiz." },
    };

    function getErrorEl(name) { return document.getElementById(name + "-error"); }

    function setError(name, msg) {
      var el = getErrorEl(name);
      if (el) { el.textContent = msg || ""; el.style.display = msg ? "block" : "none"; }
    }

    function validateField(name) {
      var input = form.elements[name];
      if (!input) return true;
      var rule = rules[name];
      if (!rule) return true;
      var val = input.value.trim();
      var msg = "";

      if (rule.required && !val) {
        msg = rule.label;
      } else if (rule.email && val && !/^[^\s@]{1,94}@[^\s@]+\.[^\s@]{2,}$/.test(val)) {
        msg = rule.label;
      } else if (rule.salary && val && !/^[\d\s.,\-₺$€₼]{0,50}$/.test(val)) {
        msg = rule.label;
      }

      setError(name, msg);
      return !msg;
    }

    var fields = ["title", "company", "location", "description", "email", "salary"];
    fields.forEach(function (name) {
      var input = form.elements[name];
      if (input) {
        input.addEventListener("input", function () { validateField(name); });
        input.addEventListener("blur", function () { validateField(name); });
      }
    });

    form.addEventListener("submit", function (e) {
      var valid = true;
      fields.forEach(function (name) { if (!validateField(name)) valid = false; });
      if (!valid) e.preventDefault();
    });
  })();

  /* ── Job Application: Toggle Form (detail page) ── */
  (function () {
    var btn = document.getElementById("apply-toggle-btn");
    var wrap = document.getElementById("application-form-wrap");
    if (!btn || !wrap) return;

    var isLoggedIn = document.body.getAttribute("data-user-logged-in") === "true";

    // Eğer server flash hatası varsa otomatik aç (validation errors)
    var hasErrors = wrap.querySelector('.field-error[style*="block"]');
    if (hasErrors) {
      wrap.classList.add("open");
      btn.innerHTML =
        '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18"/><path d="M6 6l12 12"/></svg> Kapat';
    }

    btn.addEventListener("click", function () {
      if (!isLoggedIn) {
        window.location.href = "/giris-yap";
        return;
      }
      var isOpen = wrap.classList.contains("open");
      if (isOpen) {
        wrap.classList.remove("open");
        btn.innerHTML =
          '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 11l-3 3-3-3"/><path d="M19 14V8"/></svg> Başvur';
      } else {
        wrap.classList.add("open");
        btn.innerHTML =
          '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18"/><path d="M6 6l12 12"/></svg> Kapat';
        setTimeout(function () {
          wrap.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 300);
      }
    });
  })();
})();
