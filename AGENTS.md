# Repository Guidelines

## Tujuan dan Batasan MVP

Bangun web chatbot sederhana dengan Next.js 16, TypeScript, Tailwind CSS, dan shadcn/ui. MVP wajib mendukung text generation, percakapan multi-turn, daftar history chat, pemilihan system instruction, serta penyimpanan history di browser. Integrasi AI wajib menggunakan package npm `gemini-flash-api` dari repository [putradwinandap/gemini-flash-api](https://github.com/putradwinandap/gemini-flash-api), dengan endpoint `POST /api/chat`; jangan mengekspos API key ke client.

## Arsitektur yang Disarankan

Gunakan App Router dan pisahkan tanggung jawab berikut:

- `app/` — route, layout, dan `app/api/chat/route.ts` sebagai BFF/server boundary.
- `components/` — komponen UI presentasional; gunakan komponen shadcn/ui.
- `features/chat/` — state, hook, tipe, dan komponen khusus chat.
- `lib/` — API client server, konfigurasi, validasi, dan utilitas umum.
- `constants/` — katalog system instruction yang aman dan versioned.
- `types/` — tipe request, response, message, dan chat session.
- `tests/` — unit/integration test yang mencerminkan struktur source.

Alur utama: UI mengirim `{ messages, systemInstructionId }` ke `/api/chat`; route memvalidasi input, memilih instruction dari allowlist, meneruskan request ke package npm `gemini-flash-api`, lalu mengembalikan response yang konsisten. Local storage hanya menyimpan metadata session dan pesan; buat schema version, batas ukuran, dan fallback jika JSON rusak.

`gemini-flash-api` adalah integration boundary resmi proyek. Dependency provider dipasang dari arsip HTTPS branch `main` repository GitHub resminya (bukan tag registry `latest`) karena package belum tersedia di npm registry dan instalasi Git dapat dipetakan ke SSH pada lingkungan tertentu. Bungkus pemanggilannya di adapter server pada `lib/`; komponen client tidak boleh mengimpor package tersebut. Jangan menambahkan pemanggilan SDK Gemini langsung atau mengganti package tanpa memperbarui kontrak arsitektur, dependency configuration, dan alasan migrasinya di `AGENTS.md`.

## Prinsip Engineering

Terapkan SOLID secara pragmatis, terutama dependency inversion pada adapter API dan single responsibility pada route, state, serta UI. Ikuti KISS untuk MVP, YAGNI untuk fitur yang belum dibutuhkan, DRY tanpa mengorbankan keterbacaan, dan fail-fast pada konfigurasi invalid. Hindari global mutable state, duplikasi kontrak API, prop drilling berlebihan, serta abstraksi sebelum ada kebutuhan nyata. Validasi semua input server-side dan tangani loading, timeout, rate limit, empty response, serta error dengan pesan yang aman bagi pengguna.

## Rendering Pesan

Pesan assistant dirender sebagai Markdown menggunakan `react-markdown` dan `remark-gfm` agar heading, penekanan, daftar, tabel, tautan, dan blok kode ditampilkan sebagai konten terformat. Raw HTML dari jawaban tidak diaktifkan. Pesan user tetap ditampilkan sebagai teks biasa supaya input yang diketik tidak berubah makna. Ini adalah keputusan presentasi client-side; kontrak API dan format history local storage tetap menyimpan teks sumber Markdown, sehingga tidak memerlukan migrasi data.

## Architecture Change Contract

`AGENTS.md` adalah sumber aturan governance proyek. Setiap perubahan arsitektur, kontrak API, struktur folder, teknologi, strategi state, persistence, atau aturan coding wajib memperbarui dokumen ini pada perubahan yang sama. Catat alasan, dampak, trade-off, dan langkah migrasi bila relevan. Jangan menambahkan pola yang bertentangan dengan panduan; hapus atau revisi aturan lama jika keputusan baru menggantikannya. Perubahan dianggap belum selesai sebelum dokumentasi dan implementasi kembali sinkron.

## Single Source of Truth

- `AGENTS.md` — aturan contributor dan keputusan arsitektur aktif untuk tahap MVP.
- Tipe TypeScript dan schema validasi — sumber kontrak runtime request, response, message, dan session.
- Katalog system instruction — satu-satunya sumber instruction yang boleh dipilih client.
- Schema version local storage — sumber kompatibilitas data history yang tersimpan di browser.

Jangan menduplikasi kontrak API atau system instruction di banyak tempat. Jika duplikasi diperlukan untuk boundary server/client, salah satu harus dihasilkan atau diverifikasi terhadap sumber utama.

## Consistency Checklist

Setiap perubahan wajib ditinjau terhadap struktur folder, API request/response, error handling, state management, local storage schema, security, accessibility, testing, serta formatting/linting. Pastikan perubahan tidak membuat API key masuk ke client, tidak memecahkan history lama, dan tidak memperkenalkan dependency tanpa kebutuhan yang terdokumentasi.

## Definition of Done

Fitur atau perubahan arsitektur selesai jika kode mengikuti struktur dan prinsip proyek, test ditambahkan atau diperbarui, lint/test/build berhasil, `AGENTS.md` sudah sinkron, dan `.env.example` diperbarui bila konfigurasi berubah. PR wajib menyebutkan checklist yang relevan dan alasan jika ada item yang tidak berlaku.

## Keputusan yang Memerlukan Persetujuan

Dokumentasikan dan sepakati terlebih dahulu setiap perubahan framework atau library inti, public API, format data local storage, strategi state management, serta server/client boundary. Untuk perubahan tersebut, jelaskan dampak kompatibilitas dan rencana migrasi di PR serta perbarui bagian terkait di `AGENTS.md`.

## Coding Style & Formatting

Gunakan TypeScript strict, formatter/linter proyek (disarankan Prettier + ESLint), dua spasi untuk JSON/YAML, dan nama `PascalCase` untuk komponen/tipe, `camelCase` untuk fungsi/variabel, serta `kebab-case` untuk folder/file non-komponen. Hindari `any`; gunakan union type dan type guard. Class Tailwind harus konsisten; gabungkan variant dengan utility yang sudah dipakai proyek, bukan CSS inline baru.

## System Instruction MVP

Mulai dengan instruction berikut: `general` (asisten umum), `coding` (jelas, aman, sertakan contoh dan asumsi), `travel` (rencana perjalanan berdasarkan budget/waktu, tandai informasi yang perlu diverifikasi), `casual` (santai dan ringkas), `writing` (menulis atau menyunting dengan menjaga intent), dan `study` (mengajar bertahap dengan kuis singkat). Simpan id, label, deskripsi, dan prompt di satu katalog; client hanya mengirim id yang diizinkan.

## Testing dan Perintah

Setiap fitur wajib memiliki test untuk reducer/state chat, validasi payload, pemilihan instruction, persistence local storage, serta error route. Mock SDK dan jangan membutuhkan API key untuk test default. Setelah `package.json` tersedia, sediakan perintah konsisten seperti `npm run dev`, `npm run lint`, `npm test`, dan `npm run build`; CI harus menjalankan lint, test, dan build.

## Kontrak Interface MVP

- Client memanggil `POST /api/chat`.
- Request menggunakan `messages` dan `systemInstructionId`.
- Server memvalidasi request dan memilih instruction dari allowlist.
- API key hanya berada di server.
- History disimpan lokal menggunakan schema version.
- Error response harus konsisten dan aman ditampilkan kepada pengguna.
- Setiap room menyimpan `systemInstructionId` dan provider-chain `previousId`; perubahan instruction mempertahankan history dan tidak mereset `previousId` secara otomatis.
- `gemini-flash-api` dipanggil hanya melalui adapter server di `lib/`; client tidak boleh mengimpor package provider.
- Dependency production wajib diverifikasi dengan `npm audit --omit=dev` dan tidak boleh memiliki vulnerability critical/high yang diketahui dan dapat diperbaiki.
- Next.js, React, dan eslint-config-next harus di-upgrade sebagai satu compatibility set; hindari `npm audit fix --force` tanpa migration review.

## Commit, PR, dan Security

Gunakan commit imperatif dengan prefix konsisten, misalnya `feat: add chat history` atau `fix: handle invalid payload`. PR harus menjelaskan perubahan, test yang dijalankan, perubahan environment, dan screenshot jika UI berubah. Simpan secret hanya di `.env.local`, commit `.env.example` tanpa nilai rahasia, jangan log prompt sensitif/API key, dan tampilkan error provider yang sudah disanitasi.

## Dokumentasi Perubahan

ADR terpisah belum diperlukan untuk tahap MVP. Alasan perubahan dicatat langsung di `AGENTS.md` dan PR. Perubahan arsitektur, kontrak interface, dan aturan konsistensi tidak boleh dianggap selesai jika dokumentasinya belum diperbarui.

## Security Hardening MVP

- `POST /api/chat` membatasi ukuran payload dan menerapkan in-memory sliding-window rate limit 20 request per 60 detik per client identifier. Ini sesuai untuk single-instance MVP dan perlu diganti storage terdistribusi sebelum multi-instance deployment.
- Header `x-forwarded-for` hanya dipercaya jika `TRUST_PROXY=true` pada reverse proxy tepercaya; default-nya tidak dipercaya.
- Local storage harus divalidasi terhadap schema runtime sebelum dipakai; item room atau message yang malformed difilter dan storage yang tidak kompatibel dikosongkan.
- Route server tidak boleh mencatat prompt, API key, atau pesan error provider mentah. Error yang dikirim ke client harus berupa kode dan pesan aman.
- Timeout provider harus membatalkan request melalui `AbortSignal` yang didukung boundary `gemini-flash-api`; API key tetap server-only.
- `GEMINI_STORE=true` harus digunakan untuk kontrak provider-chain `previousId`; jika dinonaktifkan, multi-turn stateful tidak tersedia.
- UI melakukan hydration guard sebelum memilih intro atau room tersimpan agar localStorage tidak menyebabkan flash state awal.
- Root chat menggunakan viewport-locked layout; hanya history room dan daftar message yang boleh memiliki scroll vertikal.
