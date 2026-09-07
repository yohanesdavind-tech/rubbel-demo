# rubbel-demo

Demo Rubbel-like assistant (local). Menyediakan frontend (Chrome) yang menggunakan Web Speech API + Lottie avatar + SpeechSynthesis, dan backend Node.js sederhana yang mem-parsing intent perangkat (TV, AC, Lampu).

## Cara menjalankan (lokal)
1. Pastikan Node.js terpasang.
2. Clone repo (atau salin file ke folder):
   - git clone https://github.com/yohanesdavind-tech/rubbel-demo.git
   - cd rubbel-demo
3. Install dependensi:
   - npm install
4. Jalankan:
   - npm start
5. Buka Chrome dan akses:
   - http://localhost:3000
   - Klik "Mulai Bicara" dan ucapkan contoh: "Matikan TV", "Nyalakan lampu", "Set AC ke 22".

## Integrasi OpenAI (opsional)
- Jika ingin jawaban LLM nyata, tambahkan integrasi di server.js untuk memanggil OpenAI.
- Buat file `.env` berdasarkan `.env.example` dan isi `OPENAI_API_KEY`.
- Pastikan memanggil OpenAI dari backend (jangan masukkan API key di frontend).

## Mosquitto WebSocket (opsional)
- Jika nanti ingin frontend publish MQTT lewat WebSocket, aktifkan listener WebSocket pada Mosquitto (contoh: `mosquitto_ws.conf`) dan sesuaikan URL di frontend.

## Catatan
- Demo ini mensimulasikan aksi perangkat di UI (tidak perlu hardware).
- Web Speech API bekerja baik pada Chrome/Edge dan membutuhkan HTTPS kecuali saat menjalankan di `localhost`.
