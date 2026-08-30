# Bingöl Plus

Yerel platform (Bingöl) — İş ilanları + Forum. Kullanıcılar ilanları görüntüleyip kaydedebilir, forumda konu açıp yanıtlayabilir. Admin paneli üzerinden ilan/talep/kullanıcı/log yönetimi yapılır.

---

## Stack

Node.js + TypeScript (nodenext) · Express 5 · MySQL + Sequelize v6 + sequelize-cli · EJS · express-session + connect-session-sequelize · bcryptjs · helmet · express-rate-limit · multer → Cloudinary · nodemailer (Gmail) · winston (console + DB)

---

## Klasör Yapısı (Özet)

| Klasör | İçerik |
|---|---|
| `src/app.ts` | Express kurulumu, middleware sırası, route mount |
| `src/controller/` | 5 controller: user, auth, forum, admin, api |
| `src/middleware/` | isAuth, isAdmin, csrf, loadUser, rateLimit |
| `src/models/` | 9 Sequelize model: User, Job, SavedJob, Post, PostLike, PostReply, PasswordReset, JobRequest, Log |
| `src/routers/` | 6 router: user, auth, forum, admin, api, sitemap |
| `src/views/` | EJS: partials (navbar/footer/flash) + user/ + forum/ + admin/ + auth/ |
| `src/cloud/` | Cloudinary config + upload/delete/optimize |
| `src/database/` | connection, relationships |
| `src/helpers/` | slug.ts (Türkçe slug), validation.ts (regex validator'lar) |
| `src/log/` | Winston logger (console + Sequelize transport) |
| `src/security/` | Helmet CSP yapılandırması |
| `src/services/` | Nodemailer (şifre sıfırlama, ilan bildirimi) |
| `src/public/js/app.js` | Tüm frontend JS (toast, avatar, AJAX, infinite scroll, validation) |
| `src/public/css/` | style.css + sayfa bazlı css'ler |
| `migrations/` | 10 migration dosyası |
| `seeders/` | Admin user (enes/eneskaya) + 5 ilan + 4 konu + 45 yanıt |
| `config/config.cjs` | Sequelize CLI DB config |
| `reset.bat` | db:drop → db:create → db:migrate → db:seed |

---

## Modüller

### Auth (`/giris-yap`, `/kayit-ol`, `/cikis-yap`, `/sifremi-unuttum`, `/sifre-sifirla/:token`)
- Kayıtta bcrypt hash + IP/User-Agent kaydı + session regenerate (fixation koruması)
- Girişte ban kontrolü, `session.regenerate()` ile yeni session
- Şifre sıfırlama: crypto.randomBytes(32) token, 1 saat geçerli, nodemailer ile email
- `redirectIfAuth` middleware: giriş yapmışsa anasayfaya yönlendir

### İş İlanları (`/ilanlar`, `/ilanlar/:id`, `/ilanlar/ilan-ekle`)
- Liste + detay sayfaları, her ilanda AJAX ile kaydetme/kaldırma
- Kullanıcı ilan ekleyebilir → `job_requests` tablosuna `pending` olarak eklenir, admin onayı gerekir
- Admin `ilan-ekle` sayfasından direkt ilan ekleyebilir

### Forum (`/forum`, `/forum/konu/:id`, `/forum/konu-ac`, `/forum/akis`, `/forum/akis/:kategori`)
- Konu başlık + içerik + kategori (6 kategoriden biri)
- `GET /api/posts?offset=N` ile 10'ar post sonsuz kaydırma (IntersectionObserver)
- `POST /api/post-begen/:postId` AJAX like toggle (postLike tablosu + likes sayacı)
- `POST /api/yanit-ekle/:postId` AJAX yanıt (XSS korumalı, escapeHtml)
- `GET /api/yanitlar/:postId?offset=N` sayfalı yanıtlar (10'ar)
- `/forum/akis` tüm konuların full içerik + inline yanıt formu ile görüntülendiği feed
- `/forum/akis` sayfasında konu arama: başlık + içerikte arama (`Ara` butonu ile), sonuçlar aynı kart yapısıyla listelenir (`GET /api/arama?q=...`)

### Admin (`/admin/*`, requireAdmin — session.role === "admin")
- Dashboard: istatistik kartları (ilan/konu/kullanıcı/bekleyen talep sayısı)
- İlan ekleme (direkt jobs tablosuna), ilan talepleri onay/red (email bildirimi)
- Kullanıcı listeleme (sayfalı + arama), banlama/toggle, silme (cascade + soft delete)
- Log görüntüleme (sayfalı + tip filtresi)
- Forum konusu silme (like + reply cascade)

### Profil (`/profilim`, requireAuth)
- Kullanıcı bilgileri + kayıt tarihi + açtığı konu sayısı
- Kaydedilen ilanlar listesi (AJAX ile kaldırma)
- Avatar yükleme: multer (temp, 5MB, JPEG/PNG/WebP) → Cloudinary upload → temp silme
- Günlük limit: 2 kez/gün (profileImageDate + profileImageCount), rate limit: 5/15dk
- Avatar popup: data-attribute ile Cloudinary 150x150 optimize URL

### API (`/api/*`)
- `GET /api/posts` (sonsuz kaydırma), `GET /api/arama?q=` (forum konu arama), `POST /api/ilan-kaydet/:id`, `POST /api/post-begen/:id`, `POST /api/yanit-ekle/:id`, `GET /api/yanitlar/:id`

### Sitemap (`GET /sitemap.xml`)
- Statik sayfalar + tüm forum konuları + tüm iş ilanları (slug ile, son güncelleme tarihi)

---

## Güvenlik

### CSP (Helmet)
```
default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://res.cloudinary.com
```
- `script-src`'de `unsafe-inline` yok (template'lerde inline script/event handler kullanılmaz)
- `style-src`'de `unsafe-inline` zorunlu (EJS'de yaygın inline style attribute kullanımı)

### CSRF (Custom HMAC-SHA256)
- Sebep: `csurf` Express 5 ile uyumsuz. Custom implementasyon: `salt(8 bayt hex)-hash(HMAC-SHA256(sessionSecret, salt))`
- Token iletimi: hidden input (`_csrf`) normal POST'larda; `csrf-token` header AJAX'da
- Multipart upload'lar: hidden input → multer sonrası `validateToken()` ile controller'da doğrulanır
- `req.query._csrf` kabul **edilmez**
- Her sayfada yeni token (salt değişir)

### Rate Limit
| Limiter | Limit | Kullandığı Route'lar |
|---|---|---|
| authLimiter | 5/dk | giriş, kayıt, şifre sıfırlama |
| forumLimiter | 5/dk | konu açma, yanıt ekleme |
| apiLimiter | 10/dk | beğeni, kaydetme |
| adminLimiter | 10/dk | admin POST işlemleri |
| forgotPasswordLimiter | 2/5dk | şifre sıfırlama talebi |
| generalLimiter | 30/dk | GET sayfaları |
| profileUploadLimiter | 5/15dk | profil resmi yükleme |

- `trust proxy` sadece `NODE_ENV=production` iken aktif (`app.ts:29`)

### Session
- MySQL'de saklanır (connect-session-sequelize), httpOnly + sameSite lax + 24h
- `secure` sadece production'da, `saveUninitialized: false`, `resave: false`

### Input Validation
- Regex kontroller: email, username (2-50), password (8-100), forum başlık/içerik, ilan alanları, telefon, maaş
- Tüm sorgular Sequelize parameterized (SQL injection koruması)
- `req.params.id` → `Number()` + `isNaN()` ile zorlanır

### XSS Koruması
- EJS `<%= %>` (escaping), `<%- %>` sadece `include()` için
- AJAX HTML: `escapeHtml()` JS fonksiyonu
- Meta description HTML tag regex ile temizlenir

---

## Veritabanı (10 Tablo)

**users** — email, username, password(bcrypt), role(user/admin), banned, ip, userAgent, profileImage(Cloudinary URL), profileImageDate, profileImageCount, deletedAt(paranoid)  
**jobs** — title, description, company, location, salary?, phone?, type?, userId FK  
**saved_jobs** — userId FK + jobId FK (kaydedilen ilanlar)  
**posts** — userId FK, title, content, category(6 sabit), likes(sayaç)  
**post_likes** — userId FK + postId FK  
**post_replies** — postId FK, userId FK, content  
**password_resets** — userId FK, token(UNIQUE), expiresAt(1 saat), usedAt?  
**job_requests** — userId FK, tüm job alanları + status(pending/approved/rejected)  
**logs** — type(success/info/warning/error/critical), message  
**sessions** — connect-session-sequelize tarafından otomatik oluşturulur

İlişkiler: `src/database/relationships.ts`

---

## Önemli Mimari Kararlar

1. **Custom HMAC CSRF**: `csurf` Express 5 uyumsuz olduğu için sıfırdan HMAC-SHA256 implementasyonu. Her sayfada yeni salt ile token üretilir.
2. **Session bazlı admin**: `session.role === "admin"` ile kontrol (`isAdmin.ts`). Girişte DB'den okunur. Forum controller'ı ayrıca DB'den de sorgular (çift kontrol).
3. **Flash mesaj race condition fix**: `app.ts:74-90` — redirect öncesi `session.save()` ile flash mesajın kaybolması önlenir. Flash tipleri: success/error/warning + errors objesi + oldInput.
4. **XSS çift katman**: Server-side (EJS escaping) + client-side (escapeHtml JS fonksiyonu). Meta description HTML tag regex ile temizlenir.
5. **Cloudinary avatar pipeline**: Multer(temp) → Cloudinary upload → temp dosya silme. Görüntülemede `f_auto,q_auto` optimize URL. Günlük 2 değiştirme limiti.
6. **Log sistemi**: Winston + custom SequelizeTransport, 5 seviye, console + DB'ye yazılır.
7. **İlan talebi akışı**: Kullanıcı ekler → `job_requests` (pending) → admin onay/red → email bildirimi + Job oluşturma.
8. **Admin kullanıcı silme**: Cascade manuel (tüm ilişkili tablolar temizlenir) + paranoid soft delete. Admin kendini silemez.
9. **Sonsuz kaydırma**: IntersectionObserver + `GET /api/posts?offset=N` (10'ar post). Forum listesi ve akış sayfasında kullanılır.

---

## Projeyi Çalıştırma

```bash
git clone <repo-url>
cd <repo>

# .env.example dosyasını .env olarak değiştirin ve gerekli ortam değişkenlerini doldurun.

docker compose up -d --build
docker compose exec app npx sequelize-cli db:migrate
docker compose exec app npx sequelize-cli db:seed:all
```

Uygulama başlatıldıktan sonra tarayıcıdan aşağıdaki adrese gidin:

```
http://127.0.0.1
```

> **Not:** Migration işlemini yalnızca ilk kurulumda veya veritabanı şemasında değişiklik yaptığınızda çalıştırmanız yeterlidir.
