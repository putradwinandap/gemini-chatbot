# Gemini Chatbot

Chatbot web MVP berbasis Next.js dan TypeScript dengan percakapan multi-turn, room history, system instruction, dan penyimpanan lokal di browser.

## Fitur

- Text generation melalui `gemini-flash-api`.
- Percakapan multi-turn menggunakan provider-chain `previousId`.
- Banyak room chat dan rename/delete room.
- System instruction `general`, `coding`, `travel`, `casual`, `writing`, dan `study`.
- History disimpan di `localStorage` dengan schema version dan validasi runtime.
- Validasi request server-side, payload limit, timeout provider, dan error response aman.
- In-memory rate limit untuk deployment single-instance.

## Tech stack

Next.js 16 App Router, React 18, TypeScript strict, Tailwind CSS, Zod, Vitest, dan `gemini-flash-api`.

## Struktur proyek

```text
app/                 Route, layout, dan POST /api/chat
components/          Komponen UI
features/chat/       Hook dan state chat
lib/                 Validasi, storage, rate limit, dan provider adapter
constants/           Katalog system instruction
types/               Kontrak TypeScript
tests/               Unit dan integration test
```

## Menjalankan lokal

Prasyarat: Node.js >= 20.9 dan npm.

```bash
npm install
cp .env.example .env.local
npm run dev
```

PowerShell:

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

Buka `http://localhost:3000`, lalu isi `GEMINI_API_KEY` di `.env.local`.

## Environment variables

```env
GEMINI_API_KEY=
GEMINI_MODEL=
GEMINI_STORE=true
TRUST_PROXY=false
```

`GEMINI_API_KEY` hanya digunakan server dan tidak boleh di-commit. Set `TRUST_PROXY=true` hanya jika aplikasi berjalan di belakang reverse proxy tepercaya yang mengatur header forwarding.

## API

Client memanggil `POST /api/chat`:

```json
{
  "messages": [{
    "id": "message-1",
    "role": "user",
    "content": "Halo",
    "createdAt": "2026-09-22T00:00:00.000Z"
  }],
  "systemInstructionId": "general",
  "previousId": "interaction-1"
}
```

Server memvalidasi payload, memilih prompt dari allowlist, memanggil adapter provider, lalu mengembalikan message assistant dan `previousId` berikutnya. Error menggunakan kode aman: `INVALID_PAYLOAD`, `INVALID_INSTRUCTION`, `PAYLOAD_TOO_LARGE`, `RATE_LIMITED`, `PROVIDER_TIMEOUT`, atau `CHAT_FAILED`.

## Security dan reliability

- API key tidak pernah dikirim ke browser.
- Client hanya mengirim ID system instruction; prompt dipilih server dari katalog.
- Request dibatasi maksimal 256 KB, 200 message, dan 20.000 karakter per message.
- Rate limit default adalah 20 request per 60 detik per client dan state limiter dibatasi 10.000 client.
- Rate limiter masih in-memory dan hanya cocok untuk single-instance. Multi-instance membutuhkan Redis atau storage terdistribusi.
- Forwarded IP hanya dipercaya jika `TRUST_PROXY=true`.
- Timeout provider adalah 30 detik dan membatalkan request melalui `AbortSignal` provider.
- `GEMINI_STORE=true` diperlukan untuk melanjutkan percakapan menggunakan `previousId`.
- Scroll global dikunci pada viewport; daftar room dan daftar message masing-masing memiliki scroll container.
- Prompt, API key, dan error provider mentah tidak ditulis ke log.
- Production dependency diaudit dengan `npm audit --omit=dev`; target saat ini adalah 0 vulnerability.
- LocalStorage divalidasi sebelum dipakai; room atau message yang rusak difilter.
- History dibatasi 30 room dan 200 message per room.
- Jika credential pernah terekspos, revoke dan rotate key sebelum deploy.

## Perintah development

```bash
npm run dev       # development server
npm run lint      # ESLint
npm test          # Vitest
  npm run build     # production build (Webpack)
```

## Testing dan pre-push checklist

```powershell
.\node_modules\.bin\vitest.cmd run
.\node_modules\.bin\tsc.cmd --noEmit
.\node_modules\.bin\eslint.cmd .
.\node_modules\.bin\next.cmd build
```

Sebelum push, pastikan `.env.local`, `node_modules`, `.next`, log, coverage, dan `*.tsbuildinfo` tidak staged. Review `git diff --cached` dan jangan push API key.

## Batasan MVP

- Belum ada authentication atau authorization.
- History hanya tersimpan di browser, belum ada database.
- Rate limit belum terdistribusi.
- Observability dan metrics terpusat belum tersedia.
- Cancellation provider bergantung dukungan `gemini-flash-api`.

Lihat `AGENTS.md` untuk aturan arsitektur dan governance repository.
