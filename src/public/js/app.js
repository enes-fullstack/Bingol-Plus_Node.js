(function () {
  "use strict";

  if (window.__appJsLoaded) return;
  window.__appJsLoaded = true;

  /* ── Utilities ── */
  function showToast(msg) {
    var el = document.getElementById("toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(el._timer);
    el._timer = setTimeout(function () { el.classList.remove("show"); }, 2500);
  }

  function escapeHtml(str) {
    var d = document.createElement("div");
    d.appendChild(document.createTextNode(str));
    return d.innerHTML;
  }

  function getLargeUrl(url) {
    if (!url) return null;
    return url.replace("/upload/", "/upload/w_150,h_150,c_fill,f_auto,q_auto/");
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
          }
        } else {
          showToast(data.error || "Bir hata oluştu");
        }
      })
      .catch(function () { showToast("Bağlantı hatası"); });
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

  /* ── Profile Avatar Upload ── */
  (function () {
    var avatarInput = document.getElementById("avatar-input");
    var avatarPreview = document.getElementById("avatar-preview");
    var avatarSubmit = document.getElementById("avatar-submit");
    var avatarError = document.getElementById("avatar-error");
    if (!avatarInput) return;

    avatarInput.addEventListener("change", function () {
      var file = avatarInput.files[0];
      avatarError.textContent = "";

      if (!file) {
        avatarPreview.style.display = "none";
        avatarPreview.innerHTML = "";
        avatarSubmit.style.display = "none";
        return;
      }

      var allowedTypes = ["image/jpeg", "image/png", "image/webp"];
      var allowedExts = [".jpg", ".jpeg", ".png", ".webp"];
      var ext = "." + file.name.split(".").pop().toLowerCase();

      if (!allowedTypes.includes(file.type) || !allowedExts.includes(ext)) {
        avatarError.textContent = "Yalnızca JPEG, PNG ve WebP formatları kabul edilir.";
        avatarInput.value = "";
        avatarPreview.style.display = "none";
        avatarPreview.innerHTML = "";
        avatarSubmit.style.display = "none";
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        avatarError.textContent = "Dosya boyutu en fazla 5 MB olabilir.";
        avatarInput.value = "";
        avatarPreview.style.display = "none";
        avatarPreview.innerHTML = "";
        avatarSubmit.style.display = "none";
        return;
      }

      var reader = new FileReader();
      reader.onload = function (e) {
        avatarPreview.innerHTML = '<img src="' + e.target.result + '" class="avatar-preview-img" loading="lazy">';
        avatarPreview.style.display = "block";
        avatarSubmit.style.display = "inline-block";
      };
      reader.readAsDataURL(file);
    });

    var avatarForm = document.getElementById("avatar-form");
    if (avatarForm && avatarSubmit) {
      avatarForm.addEventListener("submit", function () {
        if (!avatarInput.files || !avatarInput.files[0]) return;
        if (avatarSubmit.disabled) return;
        avatarSubmit.textContent = "Yükleniyor...";
        avatarSubmit.disabled = true;
        avatarSubmit.style.opacity = "0.7";
        avatarSubmit.style.cursor = "wait";
      });
    }
  })();

  /* ── Forum Like (detail page) ── */
  (function () {
    var likeBtn = document.getElementById("likeBtn");
    if (!likeBtn) return;

    likeBtn.addEventListener("click", async function () {
      if (document.body.dataset.userLoggedIn !== "true") {
        alert("Giriş yapmalısınız.");
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
          alert(data.error || "Bir hata oluştu");
        }
      } catch (err) {
        alert("Bağlantı hatası");
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
        alert("Giriş yapmalısınız.");
        return;
      }

      var postId = document.getElementById("likeBtn").dataset.postId;
      var content = document.getElementById("replyContent").value.trim();

      if (!content) {
        alert("Yanıt boş olamaz.");
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
          list.insertAdjacentHTML("afterbegin", buildReplyHtml(data.reply));
          document.getElementById("replyContent").value = "";

          var label = document.getElementById("repliesToggleLabel");
          var match = label.textContent.match(/\((\d+)\)/);
          var count = match ? parseInt(match[1]) + 1 : 1;
          label.textContent = "Yanıtlar (" + count + ")";
        } else {
          alert(data.error || "Bir hata oluştu");
        }
      } catch (err) {
        alert("Bağlantı hatası");
      }
    });

    function buildReplyHtml(r) {
      var date = new Date(r.createdAt).toLocaleDateString("tr-TR");
      var username = escapeHtml(r.User.username);
      var content = escapeHtml(r.content);
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
      return (
        '<div class="reply-item">' +
        '<div class="reply-avatar" ' + avatarAttr + ">" + avatarHtml + "</div>" +
        '<div class="reply-body">' +
        '<div class="reply-head"><strong>' + username + "</strong> &middot; " + date + "</div>" +
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
        alert("Bağlantı hatası");
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
      alert("Giriş yapmalısınız.");
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
          alert(data.error || "Hata");
        }
      })
      .catch(function () { alert("Bağlantı hatası"); });
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
      alert("Giriş yapmalısınız.");
      return;
    }

    var postId = btn.dataset.postId;
    var textarea = btn.closest(".reply-form").querySelector(".reply-textarea");
    var content = textarea.value.trim();

    if (!content) {
      alert("Yanıt boş olamaz.");
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
        list.insertAdjacentHTML("afterbegin", buildFeedReplyHtml(data.reply));
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
        alert(data.error || "Bir hata oluştu");
      }
    } catch (err) {
      alert("Bağlantı hatası");
    }
  });

  function buildFeedReplyHtml(r) {
    var date = new Date(r.createdAt).toLocaleDateString("tr-TR");
    var username = escapeHtml(r.User ? r.User.username : "");
    var content = escapeHtml(r.content);
    var avatarHtml;
    if (r.User && r.User.avatarUrl) {
      var profileImage = r.User.profileImage || "";
      avatarHtml = '<img src="' + escapeHtml(r.User.avatarUrl) + '" alt="" class="reply-avatar-img" loading="lazy" data-avatar="' + escapeHtml(profileImage) + '">';
    } else {
      var initial = escapeHtml(r.User ? r.User.username.charAt(0).toUpperCase() : "?");
      avatarHtml = '<div class="reply-avatar">' + initial + "</div>";
    }
    return (
      '<div class="reply-item">' +
      avatarHtml +
      '<div class="reply-body">' +
      '<div class="reply-head"><strong>' + username + "</strong> &middot; " + date + "</div>" +
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
      alert("Bağlantı hatası");
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
      var avatarHtml;
      if (post.User && post.User.avatarUrl) {
        avatarHtml = '<img src="' + escapeHtml(post.User.avatarUrl) + '" alt="" class="feed-avatar" loading="lazy">';
      } else {
        avatarHtml = '<span class="feed-avatar-letter">' + initial + "</span>";
      }

      var authorHtml =
        '<span class="post-author" data-avatar="' +
        (post.User && post.User.profileImage ? escapeHtml(post.User.profileImage) : "") +
        '">' +
        avatarHtml +
        "<strong>" +
        escapeHtml(post.User ? post.User.username : "?") +
        "</strong>" +
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

      return (
        '<article class="post-card" style="margin-bottom:20px;">' +
        '<span class="pin"></span>' +
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
      if (!confirm("Bu konuyu silmek istediğinize emin misiniz?")) return;
      fetch("/admin/konu-sil/" + postId, {
        method: "POST",
        headers: { "csrf-token": csrfToken },
      })
        .then(function (res) {
          if (res.ok || res.redirected) location.reload();
          else alert("Silme işlemi başarısız");
        })
        .catch(function () { alert("Bağlantı hatası"); });
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
                avatarInner = '<span class="topic-author-letter">' + initial + "</span>";
              }
              authorHtml =
                '<span class="topic-author" data-avatar="' +
                (post.User.profileImage ? escapeHtml(post.User.profileImage) : "") +
                '">' +
                avatarInner +
                "<span>" +
                escapeHtml(post.User.username) +
                "</span>" +
                "</span>";
            } else {
              authorHtml = "?";
            }

            var date = new Date(post.createdAt).toLocaleDateString("tr-TR");
            var deleteHtml = isAdmin
              ? '<button class="delete-btn" data-post-id="' + post.id + '">Sil</button>'
              : "";

            div.innerHTML =
              '<div class="topic-avatar" style="background:var(--lake)">' +
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

  /* ── Admin Users: Delete Confirmation ── */
  (function () {
    var table = document.querySelector(".user-table");
    if (!table) return;

    table.addEventListener("click", function (e) {
      var btn = e.target.closest(".btn-delete");
      if (!btn) return;
      var form = btn.closest("form");
      if (!form) return;
      var username = form.dataset.username || "bu kullanıcıyı";
      if (!confirm(username + " kullanıcısını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.")) {
        e.preventDefault();
      }
    });
  })();

  /* ── Admin Jobs: Delete Confirmation ── */
  (function () {
    var list = document.querySelector(".job-list");
    if (!list) return;

    list.addEventListener("click", function (e) {
      var btn = e.target.closest(".job-delete-form");
      if (!btn) return;
      var title = (btn.closest(".job-card").querySelector(".job-info strong") || {}).textContent || "Bu ilanı";
      if (!confirm('"' + title + '" ilanını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) {
        e.preventDefault();
      }
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
      var title = (form && form.dataset.title) || "Bu ilanı";
      if (!confirm('"' + title + '" ilanını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) {
        e.preventDefault();
      }
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
      phone: { phone: true, label: "Telefon numarası geçersiz." },
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
      } else if (rule.phone && val && !/^[\d\s()+\-\s]{7,20}$/.test(val)) {
        msg = rule.label;
      } else if (rule.salary && val && !/^[\d\s.,\-₺$€₼]{0,50}$/.test(val)) {
        msg = rule.label;
      }

      setError(name, msg);
      return !msg;
    }

    var fields = ["title", "company", "location", "description", "email", "phone", "salary"];
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
})();
