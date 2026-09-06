# Bingöl Plus

Yerel platform (Bingöl) — **İş İlanları + Forum**. Kullanıcılar ilanları görüntüleyip kaydedebilir, forumda konu açıp yanıtlayabilir, ilan talebi oluşturabilir. Admin paneli üzerinden ilan/talep/kullanıcı/kategori/log yönetimi yapılır.

Canlı: `https://bingolplus.com` — `SITE_URL` env ile canonical URL üretilir (`src/app.ts:68-74`).

---

## Stack

| Katman | Teknoloji |
|---|---|
| Runtime | Node.js 22 (Alpine) + TypeScript `nodenext` (`target: es2020`, `outDir: dist`, `rootDir: src`) |
| Backend | Express 5 · EJS · express-session + connect-session-sequelize |
| DB | MySQL 8.4 + Sequelize v6 + sequelize-cli |
| Güvenlik | helmet (CSP) · express-rate-limit · custom HMAC CSRF · bcryptjs |
| Dosya | multer (memory) → Cloudinary · file-type (magic bytes) |
| Mail | nodemailer (Gmail App Password) |
| Log | winston + custom SequelizeTransport (console + DB) |
| Frontend | Vanilla JS (`src/public/js/app.js` 1216 satır, IIFE) · CSS (sayfa bazlı) |
| Test | Vitest 4 + Supertest · workspace `unit` / `integration` |
| Infra | Docker multi-stage · Nginx (prod: gzip, HSTS, 1y immutable, 80→443) |

**Scripts** (`package.json`):

```json
"test": "cross-env NODE_ENV=test vitest run --no-file-parallelism"
"test:coverage": "cross-env NODE_ENV=test vitest run --coverage --no-file-parallelism"
"build": "tsc"
"tsx": "cross-env NODE_ENV=development tsx watch src/server.ts"
"dev": "cross-env NODE_ENV=development node dist/server.js"
"prod": "cross-env NODE_ENV=production PORT=8080 node dist/server.js"
"start": "cross-env NODE_ENV=production node dist/server.js"
```

---

## Klasör Yapısı

| Yol | İçerik |
|---|---|
| `src/app.ts` | Express kurulumu, middleware sırası, `trust proxy`, route mount, 404 |
| `src/server.ts` | `sequelize.authenticate()` + `sessionStore.sync()` + `defineRelationships()` + `app.listen` |
| `src/config/config.ts` | Typed `Config` (database/session/email/cloudinary), `NODE_ENV`'a göre `.env` / `.env.development` seçimi |
| `src/config/session.ts` | `SequelizeStore`, `sessionMiddleware` (httpOnly, sameSite lax, 24h, secure auto), `destroyUserSessions` / `destroyStaleUserSessions` (7 gün) |
| `src/controller/` | 5 controller: `user.ts` (452), `auth.ts` (306), `forum.ts` (317), `admin.ts` (586), `api.ts` (308) |
| `src/middleware/` | `csrf.ts` (60), `isAuth.ts` (`requireAuth` + `redirectIfAuth`), `isAdmin.ts` (DB role + session sync), `loadUser.ts` (locals + flash), `rateLimit.ts` |
| `src/models/` | 10 Sequelize model: `user.ts` (paranoid), `jobs.ts`, `savedJobs.ts`, `post.ts`, `postCategory.ts`, `postLike.ts`, `postReply.ts`, `passwordReset.ts`, `jobRequest.ts`, `log.ts` |
| `src/routers/` | 6 router: `user.ts`, `auth.ts`, `forum.ts`, `admin.ts`, `api.ts`, `sitemap.ts` |
| `src/views/` | 32 EJS: `partials/` (head/navbar/footer/flash/feed-posts) + `user/` (11) + `forum/` (4) + `admin/` (8) + `auth/` (4) |
| `src/cloud/` | `config.ts` (v2) + `upload.ts` (`uploadImage`, `uploadImageFromBuffer` stream, `deleteImage`, `optimizeUrl` `f_auto,q_auto,c_fill`) |
| `src/database/` | `connection.ts` (Sequelize init) + `relationships.ts` (10 ilişki) |
| `src/helpers/` | `slug.ts` (Türkçe `& → ve`, 0-80), `validation.ts` (regex), `normalizeError.ts` (redact + circular safe), `formatLogMessage.ts` |
| `src/log/` | `logger.ts` (winston + SequelizeTransport, 5 seviye) |
| `src/security/` | `helmet.ts` (CSP) |
| `src/services/` | `mail.ts` (Gmail, `sendResetEmail` 1h link + `sendJobNotification` approved/rejected) |
| `src/types/session.d.ts` | `SessionData` (isAuth, userId, username, role, flash, csrfSecret) |
| `src/constants/errorCode.ts` | 1001-6004 hata kodları |
| `src/public/js/app.js` | Toast, theme, navbar, avatar popup (150x150), save/like/reply AJAX, infinite scroll, search, validation |
| `src/public/css/` | `style.css` + `admin.css` + `auth.css` + `forum.css` + `jobs.css` + `profile.css` + `detail.css` + `contact.css` + `page.css` + `error.css` |
| `src/public/images/` | `logo.webp`, `small-logo.webp`, `full-logo.webp` |
| `migrations/` | **12** migration (sessions + 11 tablo) |
| `seeders/` | 5 seeder: admin (`enes`) + ~25 user + 6 kategori + 4 konu + 45 yanıt + like |
| `config/config.cjs` | Sequelize CLI config (`NODE_ENV` → `.env` / `.env.development` / `.env.test`) |
| `vitest.workspace.ts` | 2 proje: `unit` (`test/helpers`, `test/middleware`) + `integration` (`test/integration`, `test/controller`) |
| `nginx/` | `nginx.conf` (dev, 80 → `app:3000`) + `nginx.prod.conf` (gzip, 80→301 https, 443 TLS1.2/1.3, HSTS, static 1y) |
| `scripts/` | `reset.bat` / `reset.sh` / `migrate.sh` (`db:drop → db:create → db:migrate → db:seed`) |
| `.sequelizerc` | `config` / `models-path` / `migrations-path` / `seeders-path` eşlemesi |
| `Dockerfile` | Multi-stage: `builder` (npm install + `npm run build`) → `production` (prod deps + dist + views/public/config/migrations/seeders) |

---

## Ortam Değişkenleri

`.env.example` şablon, `.env` / `.env.development` / `.env.test` gitignore'da:

```
# DATABASE (MYSQL)
DB_USERNAME / DB_PASSWORD / DB_ROOT_PASSWORD / DB_NAME / DB_NAME_TEST / DB_HOST / DB_DIALECT / DB_PORT

# SESSION
SESSION_SECRET

# EMAIL
GMAIL / GMAIL_APP_PASSWORD

# CLOUDINARY
CLOUDINARY_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET / CLOUDINARY_FOLDER

# ACCOUNT (seed)
ADMIN_USERNAME / ADMIN_PASSWORD / ADMIN_EMAIL / USER_PASSWORD

# SEO
SITE_URL=https://bingolplus.com
```

`src/config/config.ts` ve `config/config.cjs` `NODE_ENV`'a göre doğru dosyayı yükler.

---

## Modüller

### Auth (`/kayit-ol`, `/giris-yap`, `/cikis-yap`, `/sifremi-unuttum`, `/sifre-sifirla/:token`)

- Kayıt: `validateUsername` / `validatePassword` / `validateEmail` (regex), email/username unique, `bcrypt.hash(10)`, IP + User-Agent kaydı, `session.regenerate()` (fixation koruması) — `src/controller/auth.ts`
- Giriş: ban kontrolü, `bcrypt.compare`, `destroyStaleUserSessions` (7 gün), `session.regenerate()` + `session.save()`
- Şifre sıfırlama: `crypto.randomBytes(32)` → sha256 hash DB'de, `expiresAt = +1h`, `usedAt`, transaction ile eski tokenlar invalidate, `sendResetEmail` (nodemailer). Token URL'de 64 hex (`^[a-f0-9]{64}$`), tek kullanımlık, expire sonrası 403
- `redirectIfAuth` girişli kullanıcıyı anasayfaya yönlendirir, `requireAuth` ban kontrolü yapar (`src/middleware/isAuth.ts`)

### İş İlanları (`/ilanlar`, `/ilanlar/:id/:slug`, `/ilanlar/ilan-ekle`)

- Liste + detay (slug yoksa 301 redirect `slugify` ile)
- `POST /api/ilan-kaydet/:jobId` AJAX save/unsave toggle (`saved_jobs`, `apiLimiter`)
- Kullanıcı `ilan-ekle` → `job_requests` (`pending`) — `validateJobForm` (title/company/location/description zorunlu, phone/salary regex). Admin onayı gerekir. Aynı anda sadece 1 pending talebe izin (duplicate kontrol)
- Admin `GET/POST /admin/ilan-ekle` direkt `jobs` tablosuna ekler, `GET/POST /admin/ilan-duzenle/:id`, `POST /admin/ilan-sil/:id`
- Profilimde `kayıtlı ilanlar` + `ilanlarım` listesi, `POST /ilanlar/sil/:id` (sahip kontrolü)

### Forum (`/forum`, `/forum/konu/:id/:slug`, `/forum/konu-ac`, `/forum/akis`, `/forum/akis/:kategori`)

- Kategoriler: `post_categories` 6 sabit (seed: `20260701130500-post-categories.cjs`), anasayfada Üniversite 3. sıraya taşınır
- Konu: `validateForumForm` — başlık 5-120, içerik 20-10.000 (`src/helpers/validation.ts`)
- Liste: `GET /api/posts?offset=N&category=slug` 10'ar sonsuz kaydırma (IntersectionObserver `src/public/js/app.js`) — `fetchPostsWithMeta` (replies 3, avatar optimize `optimizeUrl(36/28)`, `userLikedMap`)
- Detay: likes + `GET /api/yanitlar/:postId?offset=N` 10'ar + like toggle + reply
- Akış: `getAkisData` ortak — tüm konular full içerik + inline reply formu. Arama: `GET /api/arama?q=` başlık+içerikte `Op.like` (escape) → aynı kart yapısı
- Kategori filtresi: `/forum/akis/:kategori` (slug)

### Admin (`/admin/*`, `requireAdmin` — `session.role === "admin"` + DB `role` sync)

- Dashboard: counts (ilan/konu/kullanıcı/bekleyen talep) — `admin/index.ejs`
- İlan: ekle/duzenle/sil + talepler listesi (`/admin/talepler`) + detay (`/admin/talep/:id`) → `POST /admin/talep-onayla/:id` (`Job.create` + `approved` + `sendJobNotification`) / `POST /admin/talep-reddet/:id` (`rejected` + mail)
- Kullanıcı: `GET /admin/kullanicilar` sayfalı (20) + arama (username/email) + `postCount` subquery, `POST /admin/kullanici-ban/:id` (toggle, admin banlanamaz, `destroyUserSessions`), `POST /admin/kullanici-sil/:id` (manuel cascade: SavedJob/PostLike/Reply/Post/Job/PasswordReset/JobRequest + `User.destroy` paranoid soft delete, kendini silemez)
- Kategori: `GET /admin/kategoriler` (postCount), `POST /admin/kategori-ekle`, `POST /admin/kategori-sil/:id` (ilişkili post varsa engel)
- Log: `GET /admin/loglar` sayfalı (20) + tip filtresi (`success/info/warning/error/critical`), `POST /admin/log-sil/:id`, `POST /admin/loglar/sil` (tümünü sil)
- Forum: `POST /admin/konu-sil/:postId` (like + reply cascade)

### Profil (`/profilim`, `requireAuth`)

- Bilgiler + kayıt tarihi + açtığı konu sayısı + kayıtlı ilanlar (AJAX kaldırma) + kendi ilanları
- Avatar: `POST /profilim/resim-yukle` — `multer` memory (5MB, `file-type` magic JPEG/PNG/WebP) → `uploadImageFromBuffer` (stream) → Cloudinary → temp yok, `User.update` `CASE` ile atomik günlük limit **2/gün** (`profileImageDate` YYYY-MM-DD + `profileImageCount`), eski resim `deleteImage` (`extractPublicId`). Rate limit `profileUploadLimiter` 5/15dk. Görüntülemede `optimizeUrl(150,150)` + popup `data-attribute`

### API (`/api/*`)

| Endpoint | Method | Auth | Limiter | Açıklama |
|---|---|---|---|---|
| `/api/posts?offset=N&category=slug` | GET | - | general (60/dk) | 10'ar post, offset 0-10000 clamp |
| `/api/arama?q=` | GET | - | general | Başlık+içerik `LIKE %q%` (escaped) |
| `/api/ilan-kaydet/:jobId` | POST | ✓ | api (30/dk) | SavedJob toggle |
| `/api/post-begen/:postId` | POST | ✓ | api (30/dk) | PostLike toggle + `posts.likes` sayaç |
| `/api/yanit-ekle/:postId` | POST | ✓ | forum (10/dk) | `validateReplyContent` 1-10.000 |
| `/api/yanitlar/:postId?offset=N` | GET | - | general | 10'ar reply |

### Sitemap & SEO (`GET /sitemap.xml`, `GET /robots.txt`)

- `src/routers/sitemap.ts` (84 satır): 9 statik URL + tüm postlar + tüm joblar (slug + `updatedAt`), `escapeXml`, `Cache-Control: public, max-age=3600`
- `src/app.ts:68-74` canonical middleware: `SITE_URL + req.path` → `res.locals.canonical` (view `head.ejs`'te `<link rel="canonical">`)
- `src/public/robots.txt` + Helmet CSP + meta description HTML tag regex temizliği

### Statik Sayfalar

`/`, `/iletisim`, `/hakkimizda`, `/gizlilik-politikasi`, `/kullanim-sartlari`, `/cerez-politikasi` — `src/controller/user.ts` + `src/views/user/*.ejs`

---

## Güvenlik

### CSP (Helmet — `src/security/helmet.ts:17`)

```
default-src 'self'
script-src 'self' 'sha256-6pNZ95ONb/PhdKHLjnUiz7Ufwe8qoTXaGinPK/2QQdY='
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com
font-src 'self' https://fonts.gstatic.com
img-src 'self' data: https://res.cloudinary.com
```

- `hsts: false` — HSTS prod'da `nginx.prod.conf` üzerinden yönetilir
- `script-src`'te `unsafe-inline` yok, sadece hash'li inline theme script (`src/views/partials/head.ejs`) izinli
- `style-src`'te `unsafe-inline` zorunlu (EJS inline style attribute yaygın)

### CSRF (Custom HMAC-SHA256 — `src/middleware/csrf.ts:60`)

- Sebep: `csurf` Express 5 ile uyumsuz
- Token: `salt(8 bayt hex, 16 char)-hash(HMAC-SHA256(sessionSecret, salt), 64 hex)` → toplam `16+1+64 = 81` char. `timingSafeEqual` ile doğrulanır
- İletim: hidden input `_csrf` (normal POST) ; `csrf-token` header (AJAX `fetch` → `src/public/js/app.js`)
- Multipart (`/profilim/resim-yukle`): middleware `multer` öncesi olduğu için defer — controller'da `validateToken(body._csrf || header)` manuel
- `req.query._csrf` **kabul edilmez**, SAFE_METHODS `GET/HEAD/OPTIONS` muaf, her GET'te yeni salt → yeni token (`res.locals.csrfToken`)

### Rate Limit (`src/middleware/rateLimit.ts:46`)

| Limiter | Window | Max | Kullanıldığı Route'lar |
|---|---|---|---|
| `authLimiter` | 1 dk | 5 | `POST /kayit-ol`, `POST /giris-yap`, `POST /sifre-sifirla/:token` |
| `forumLimiter` | 1 dk | 10 | `POST /forum/konu-ac`, `POST /api/yanit-ekle/:postId` |
| `apiLimiter` | 1 dk | 30 | `POST /api/ilan-kaydet/:id`, `POST /api/post-begen/:id` |
| `adminLimiter` | 1 dk | 30 | Tüm `POST /admin/*` |
| `forgotPasswordLimiter` | 5 dk | 2 | `POST /sifremi-unuttum` |
| `generalLimiter` | 1 dk | 60 | Tüm GET sayfaları (`/`, `/forum`, `/ilanlar`, `/api/posts` vb.) |
| `profileUploadLimiter` | 15 dk | 5 | `POST /profilim/resim-yukle` |

- `isVitest` ise tüm limiterlar `noop` (testlerde bypass)
- `trust proxy` sadece `NODE_ENV=production` ( `src/app.ts:4` )

### Session (`src/config/session.ts:87`)

- `connect-session-sequelize` → MySQL `sessions` tablosu (migration `20260701124731-sessions.cjs`)
- `secret: SESSION_SECRET`, `resave: false`, `saveUninitialized: false`, `proxy: NODE_ENV==="production"`
- Cookie: `httpOnly: true`, `secure: "auto"` (prod https, dev http), `sameSite: "lax"`, `maxAge: 24h`
- `destroyUserSessions(userId)` — ban/silme/şifre reset sonrası tüm sessionları düşürür (JSON `LIKE %\"userId\":N%` + parse filtre)
- `destroyStaleUserSessions(userId)` — 7 günden eski sessionları temizler
- Flash race fix: `src/app.ts:41-56` `res.redirect` override → `session.save()` sonrası redirect

### Input Validation (`src/helpers/validation.ts:80`)

```ts
EMAIL_REGEX    = /^[^\s@]{1,94}@[^\s@]+\.[^\s@]{2,}$/
USERNAME_REGEX = /^[a-zA-Z0-9_-]{2,50}$/
PASSWORD_REGEX = /^.{8,100}$/
PHONE_REGEX    = /^[\d\s()+\-\s]{7,20}$/
SALARY_REGEX   = /^[\d\s.,\-₺$€₼]{0,50}$/
```

- `validatePostTitle` 5-120, `validatePostContent` 20-10.000, `validateReplyContent` 1-10.000
- Tüm sorgular Sequelize parameterized (SQL injection koruması), `req.params.id` → `Number()` + `isNaN()` guard

### XSS Koruması

- EJS `<%= %>` escaping, `<%- %>` sadece `include()` için
- AJAX HTML `escapeHtml()` (`src/public/js/app.js`)
- Meta description HTML tag regex ile strip
- `slugify` `strict: true` ile XSS-safe URL

---

## Veritabanı (12 Migration, 10 Model)

**Tablolar:**

| Tablo | Alanlar |
|---|---|
| `users` | `email` (10-50, unique), `username` (2-50, unique), `password` (bcrypt), `role` (user/admin), `banned` (bool), `ip`, `userAgent`, `profileImage` (Cloudinary URL), `profileImageDate` (YYYY-MM-DD), `profileImageCount` (0), `deletedAt` (paranoid soft delete) |
| `jobs` | `title`, `description` (TEXT), `company`, `location`, `salary?`, `phone?`, `type?`, `userId` FK |
| `saved_jobs` | `userId` FK + `jobId` FK (unique composite) |
| `posts` | `userId` FK, `categoryId` FK, `title`, `content` (TEXT), `likes` (0) |
| `post_categories` | `name`, `slug` (unique) — 6 kategori |
| `post_likes` | `userId` FK + `postId` FK |
| `post_replies` | `postId` FK, `userId` FK, `content` (TEXT) |
| `password_resets` | `userId` FK, `token` (UNIQUE, sha256 64 hex), `expiresAt` (1h), `usedAt?` |
| `job_requests` | `userId` FK + tüm job alanları + `status` (pending/approved/rejected) |
| `logs` | `type` (success/info/warning/error/critical), `message` (TEXT) |
| `sessions` | `sid`, `data` (JSON), `expires` — `connect-session-sequelize` |
| `SequelizeMeta` | migration takibi |

**İlişkiler** (`src/database/relationships.ts:41`): `User↔SavedJob`, `Job↔SavedJob`, `User↔Post`, `PostCategory↔Post`, `User↔PostLike`, `Post↔PostLike`, `User↔PostReply`, `Post↔PostReply`, `User↔PasswordReset`, `User↔JobRequest`

**Migrationlar** (`migrations/`): `20260701124731-sessions.cjs`, `20260701130500-create-users.cjs`, `20260701131000-create-jobs.cjs`, `20260701132000-create-saved-jobs.cjs`, `20260701133000-create-posts.cjs`, `20260701134000-create-post-likes.cjs`, `20260701134500-create-post-replies.cjs`, `20260701140000-create-post-categories.cjs`, `20260701141000-alter-posts-add-category-id.cjs`, `20260705150000-create-password-resets.cjs`, `20260705150030-create-job-requests.cjs`, `20260705160000-create-logs.cjs`

**Seeders** (`seeders/`): `20260701130000-users.cjs` (admin `ADMIN_USERNAME` + ~25 user, hepsi `USER_PASSWORD` bcrypt), `20260701130500-post-categories.cjs` (6), `20260701133500-posts.cjs` (4 konu), `20260701135000-post-replies.cjs` (45 yanıt), `20260701136000-post-likes.cjs`

---

## Frontend (`src/public/js/app.js` — 1216 satır, IIFE)

- **Tema:** `localStorage` + `prefers-color-scheme` + `data-theme` attribute, toggle buton
- **Flash/Toast:** `flash.ejs` dismiss 4.5s + `toast` AJAX bildirimleri
- **Navbar:** mobile menu toggle, `currentPage` highlight
- **Avatar:** popup `data-attribute` → `optimizeUrl(150,150)`, preview + client validation (5MB, mime)
- **İlan:** `POST /api/ilan-kaydet/:id` toggle (CSRF header), job-card click → detail, form validation (char counter, required)
- **Forum:** like delegation (`POST /api/post-begen`), reply toggle + `POST /api/yanit-ekle`, `GET /api/yanitlar` pagination (10'ar), `escapeHtml`
- **Infinite scroll:** `IntersectionObserver` — sentinel `#feed-sentinel` / `#topic-sentinel` + `GET /api/posts?offset=&category=` (10'ar), kategori çubuğu
- **Arama:** `/forum/akis` `Ara` butonu → `GET /api/arama?q=` → aynı kart yapısıyla render
- **Diğer:** password toggle, delete confirm (`confirm()`), char counter 10.000

**CSS:** `style.css` (ana) + sayfa bazlı 9 dosya (`admin.css`, `auth.css`, `forum.css`, `jobs.css`, `profile.css`, `detail.css`, `contact.css`, `page.css`, `error.css`)

**Footer** (`src/views/partials/footer.ejs`): `Güvenli oturum` badge + sosyal: Instagram (`instagram.com/bingol_plus`), TikTok (`tiktok.com/@bingol_plus`), Telegram (`t.me/bingol_plus`) + `© 2026` + 4 statik link

---

## Log Sistemi

`src/log/logger.ts:65` — `winston` + `SequelizeTransport`:

- Seviyeler: `success` / `info` / `warning` / `error` / `critical` (5 tip, `LOG_TYPES`)
- `normalizeError` (`src/helpers/normalizeError.ts`) — sensitive redact, circular Buffer safe, `formatErrorInstance`
- Her seviye `Log.create({ type, message })` → DB + console (timestamp `YYYY-MM-DD HH:mm:ss` + `[TYPE]`)
- Admin `Log` filtreleme/silme (`logsGet`, `logDeletePost`, `logsDeleteAllPost`)

---

## Önemli Mimari Kararlar

1. **Custom HMAC CSRF** — `csurf` Express 5 uyumsuz → `salt(16 hex)-hash(64 hex)` HMAC-SHA256, her GET yeni salt, `timingSafeEqual`, `query._csrf` reddedilir, multipart defer
2. **Session bazlı admin** — `session.role === "admin"` + DB `User.role` sync (`src/middleware/isAdmin.ts`), girişten sonra DB'den okunur
3. **Flash race fix** — `src/app.ts:41-56` redirect öncesi `session.save()` (connect-session-sequelize async)
4. **XSS çift katman** — server `<%= %>` + client `escapeHtml()`, meta description regex strip, `slugify strict`
5. **Cloudinary avatar pipeline** — `multer` memory → `file-type` magic → `uploadImageFromBuffer` stream → `deleteImage` eski, `f_auto,q_auto` optimize, `CASE` atomik 2/gün limit
6. **Log sistemi** — Winston + SequelizeTransport, 5 tip, DB + console, `normalizeError` ile güvenli
7. **İlan talebi akışı** — user `job_requests` pending → admin `approve` → `jobs` create + `sendJobNotification` (approved/rejected html) → `rejected` ise kayıt silinmez
8. **Admin kullanıcı silme** — manuel cascade (8 tablo) + paranoid soft delete, admin kendini/bir admini banlayamaz/silemez, `destroyUserSessions` ile oturum düşürme
9. **Sonsuz kaydırma** — `IntersectionObserver` + `GET /api/posts?offset` 10'ar, feed + liste, offset 0-10000 clamp
10. **SEO** — `SITE_URL` canonical middleware + `slugify` 80 char + `sitemap.xml` (1h cache) + `robots.txt`
11. **Rate limit test bypass** — `isVitest` → `noop`, testlerde gerçek limit tetiklenmez

---

## Projeyi Çalıştırma

### 1) Gereksinimler

- Node.js 22, MySQL 8.4, Docker (opsiyonel)

### 2) Ortam Değişkenleri

```bash
cp .env.example .env
# .env, .env.development, .env.test dosyalarını doldur (DB_*, SESSION_SECRET, GMAIL_*, CLOUDINARY_*, ADMIN_*, USER_PASSWORD, SITE_URL)
```

### 3) Docker ile (önerilen)

```bash
docker compose up -d --build
docker compose exec app npx sequelize-cli db:migrate
docker compose exec app npx sequelize-cli db:seed:all
# http://127.0.0.1  (nginx → app:3000)
```

Prod:

```bash
docker compose -f docker-compose.yaml -f docker-compose.prod.yaml up -d --build
# nginx.prod.conf: 80→301 https, 443 TLS, HSTS, gzip, static 1y immutable
```

### 4) Lokal (MySQL kuruluysa)

```bash
npm install
npm run build        # tsc → dist/
npm run tsx          # dev watch (tsx watch src/server.ts)
# veya
npm run dev          # node dist/server.js (NODE_ENV=development, DB_HOST=localhost)
```

`.env.development` için `DB_HOST=localhost`, `.env` için `DB_HOST=mysql` (docker).

### 5) Veritabanı Yönetimi

```bash
npx sequelize-cli db:migrate          # tüm migrationlar
npx sequelize-cli db:migrate:undo     # son migration geri al
npx sequelize-cli db:seed:all         # tüm seederlar
npx sequelize-cli db:seed:undo:all    # seed geri al
# Windows / Linux reset scriptleri:
./scripts/reset.sh   # veya reset.bat → db:drop → db:create → db:migrate → db:seed:all
./scripts/migrate.sh
```

> Migration yalnızca ilk kurulumda veya şema değişince çalıştırılır.

---

## Testler

```bash
npm test              # vitest run --no-file-parallelism
npm run test:coverage # --coverage --no-file-parallelism
```

- Workspace: `unit` (`test/helpers/**/*.test.ts`, `test/middleware/**/*.test.ts`) + `integration` (`test/integration/**/*.test.ts`, `test/controller/**/*.test.ts`)
- 14 test dosyası: `validation`, `slug`, `optimize`, `normalizeError`, `csrf`, `auth`, `admin`, `api`, `forum`, `search`, `sitemap`, `missing`, `user`, `app`
- `supertest` ile HTTP assertion, `cross-env NODE_ENV=test` + `.env.test` + `DB_NAME_TEST`

---

## Deployment Notları

- `Dockerfile` multi-stage: `builder` → `production` (`EXPOSE 3000`, `CMD npm start`, `NODE_ENV=production`)
- `nginx/nginx.conf` dev, `nginx.prod.conf` prod (gzip, TLS1.2/1.3, HSTS, `client_max_body_size 6M`)
- `trust proxy = 1` prod'da aktif, `secure: "auto"` cookie, `helmet hsts: false` (nginx yönetir)
- `SITE_URL` prod'da `https://bingolplus.com` olmalı (canonical + mail linkleri)

---

## Lisans

© 2026 Bingöl Plus — All Rights Reserved (`LICENCE`)
