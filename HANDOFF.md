# Gemini Chatbot — Handoff State

Dokumen ini dibuat agar chat/agent berikutnya dapat melanjutkan implementasi tanpa mengulang eksplorasi.

## Tujuan Produk

Bangun MVP chatbot Next.js + TypeScript + Tailwind CSS + shadcn/ui dengan:

- Multi-turn text generation.
- Room chat linear berbasis `roomId`.
- `previousId` provider-chain per room.
- History room dan pesan di localStorage browser.
- Selector system instruction: General, Coding, Travel, Casual, Writing, Study.
- Endpoint server `POST /api/chat`.
- API key hanya berada di server.

## Aturan Repository

Sumber governance utama adalah `AGENTS.md`. Aturan penting:

- Integrasi provider wajib melalui package npm `gemini-flash-api` dari repository `putradwinandap/gemini-flash-api`.
- Package provider hanya boleh diimpor/dipanggil melalui adapter server di `lib/`.
- Client tidak boleh mengimpor provider atau menerima API key.
- Kontrak request/response dan schema persistence harus menjadi single source of truth.
- Perubahan arsitektur, public API, persistence, atau dependency wajib disinkronkan ke `AGENTS.md`.
- Wajib menambahkan/update test dan menjalankan lint, test, serta build bila environment memungkinkan.

## Implementasi Saat Ini

File utama yang sudah dibuat:

- `app/page.tsx` — UI room list, create/select/rename/delete room, instruction selector, message list, input, loading/error state.
- `app/api/chat/route.ts` — validasi request, allowlist instruction, pemanggilan adapter, sanitized errors.
- `features/chat/use-chat.ts` — state room/chat, optimistic user message, request API, update assistant message dan `previousId`, persistence.
- `lib/gemini-adapter.ts` — server-only boundary untuk `gemini-flash-api`, API key, provider timeout 30 detik.
- `lib/storage.ts` — schema version 1, localStorage read/write, limits, corrupt JSON fallback.
- `lib/validation.ts` — Zod request schema.
- `constants/instructions.ts` — katalog tunggal enam system instruction dan type guard.
- `types/chat.ts` — message, room, storage, request, response types.
- `tests/instructions.test.ts`, `tests/storage.test.ts`, `tests/validation.test.ts`, `tests/chat-route.test.ts`, dan `tests/use-chat.test.tsx` — mencakup katalog instruction, persistence, validasi, error/chain route, dan state chat.
- `components/ui/` dan `lib/utils.ts` — primitives shadcn/ui (Button, Input, Select, Textarea) dan helper class merge yang dipakai halaman utama.
- `package.json`, `tsconfig.json`, Tailwind/PostCSS/Next config, `.env.example`, `.eslintrc.json`.

## Kontrak Data

Room:

```ts
{
  roomId: string;
  title: string;
  systemInstructionId: SystemInstructionId;
  messages: ChatMessage[];
  previousId?: string;
  createdAt: string;
  updatedAt: string;
}
```

Storage:

```ts
{
  schemaVersion: 1;
  activeRoomId: string | null;
  rooms: ChatRoom[];
}
```

Request:

```ts
{
  messages: ChatMessage[];
  systemInstructionId: SystemInstructionId;
  previousId?: string;
}
```

Response:

```ts
{
  message: ChatMessage;
  previousId?: string;
}
```

## Keputusan Perilaku

- Satu room adalah percakapan linear.
- `previousId` adalah ID chain provider, bukan ID pesan lokal.
- Room baru default ke instruction `general`.
- Perubahan instruction mempertahankan pesan lama dan tidak mereset `previousId` otomatis.
- History disimpan di localStorage dengan key `gemini-chat-history`.
- Batas saat ini: maksimal 30 room dan 200 pesan per room.
- Jika localStorage rusak atau schema tidak cocok, fallback ke state kosong.
- Prompt instruction lengkap hanya dipilih dari katalog server-side; client mengirim ID.

## Perbaikan Terakhir

Adapter provider sekarang memanggil API nyata `generateText(prompt, { systemInstruction, previousInteractionId })` dan memetakan `interactionId` ke `previousId`.

Timeout provider 30 detik dipetakan menjadi response HTTP `504` dengan code `PROVIDER_TIMEOUT`.

Rate limit provider dipetakan menjadi HTTP `429` dengan code `RATE_LIMITED`. Kegagalan localStorage (misalnya quota penuh) tidak membatalkan percakapan dalam memori.

## Status Environment

Dependency berhasil dipasang dan diverifikasi pada 22 September 2026.

- `gemini-flash-api` tidak tersedia di npm registry (404), sehingga dependency menggunakan arsip HTTPS branch `main` dari repository GitHub resminya.
- Instalasi Git langsung tidak digunakan karena lingkungan memetakan URL GitHub ke SSH tanpa public key.
- `npm run lint`, `npm test` (13 test), dan `npm run build` semuanya lulus.
- Jika shim `npm` bermasalah, npm CLI bawaan Node dapat dijalankan dengan `C:\Program Files\nodejs\node.exe` dan `C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js`.

## Langkah Berikutnya

1. Jalankan install dependency dari root repo bila belum ada `node_modules`:

   ```powershell
   npm install
   ```

   Jika npm command shim masih rusak, gunakan:

   ```powershell
   & 'C:\Program Files\nodejs\node.exe' 'C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js' install
   ```

2. Jalankan verifikasi:

   ```powershell
   npm run lint
   npm test
   npm run build
   ```

3. Adapter sudah diselaraskan dengan API nyata `generateText(prompt, { systemInstruction, previousInteractionId })` dan memetakan `interactionId` ke `previousId`. Pertahankan kontrak route dan client.
4. Pastikan `.env.local` berisi `GEMINI_API_KEY` secara lokal dan tidak pernah di-commit.
5. Bila UI akan dianggap production-ready, pecah markup besar di `app/page.tsx` menjadi komponen kecil di `components/`/`features/chat/` dan gunakan komponen shadcn/ui sesuai aturan repository.

## Cara Memulai Chat Berikutnya

Prompt yang dapat ditempel:

> Lanjutkan proyek dari `HANDOFF.md`. Baca `AGENTS.md` dan `HANDOFF.md`, periksa implementasi yang ada, lalu selesaikan blocker dependency/npm dan jalankan lint, test, serta build. Jangan mengganti kontrak room, `previousId`, localStorage, atau package `gemini-flash-api` tanpa memperbarui dokumentasi.
