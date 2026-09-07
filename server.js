// Minimal backend untuk demo lokal (intent parsing berbasis keyword).
// Jalankan: node server.js
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Serve static frontend (index.html) jika diletakkan di folder yang sama
app.use('/', express.static(path.join(__dirname, '/')));

// POST /api/chat
// Request: { message: "..." }
// Response: { reply: "...", device_action?: { device, action, value? } }
app.post('/api/chat', (req, res) => {
  const msg = (req.body.message || '').toString().toLowerCase();
  if (!msg) return res.json({ reply: 'Silakan katakan sesuatu.' });

  // Simple intent parsing
  // TV
  if (msg.includes('tv')) {
    if (msg.match(/(matikan|mati|off|mat(i|ik)kan tv)/)) {
      return res.json({ reply: 'Oke, saya mematikan TV sekarang.', device_action: { device: 'tv', action: 'off' }});
    }
    if (msg.match(/(hidupkan|nyalakan|on|nyala)/)) {
      return res.json({ reply: 'Baik, saya menyalakan TV.', device_action: { device: 'tv', action: 'on' }});
    }
    // channel / volume simple fallback
    if (msg.match(/volume/) && msg.match(/\d+/)) {
      const v = msg.match(/\d+/)[0];
      return res.json({ reply: `Mengatur volume TV ke ${v}. (simulasi)`});
    }
  }

  // Lampu
  if (msg.includes('lamp') || msg.includes('lampu')) {
    if (msg.match(/(matikan|mati|off)/)) {
      return res.json({ reply: 'Oke, saya mematikan lampu.', device_action: { device: 'lamp', action: 'off' }});
    }
    if (msg.match(/(nyalakan|hidupkan|on|nyala)/)) {
      return res.json({ reply: 'Baik, saya menyalakan lampu.', device_action: { device: 'lamp', action: 'on' }});
    }
  }

  // AC
  if (msg.includes('ac') || msg.includes('air conditioner') || msg.includes('aircon')) {
    // set temperature
    const num = msg.match(/(\d{2})/); // cari angka dua digit
    if (num) {
      const val = parseInt(num[1], 10);
      return res.json({ reply: `Saya set AC ke ${val}°C.`, device_action: { device: 'ac', action: 'set', value: val }});
    }
    if (msg.match(/(matikan|mati|off)/)) {
      return res.json({ reply: 'Oke, saya mematikan AC.', device_action: { device: 'ac', action: 'off' }});
    }
    if (msg.match(/(nyalakan|hidupkan|on|nyala)/)) {
      return res.json({ reply: 'Baik, saya menyalakan AC.', device_action: { device: 'ac', action: 'on' }});
    }
  }

  // Jika tidak ada intent perangkat, balasan umum (simulasi LLM sederhana)
  if (msg.match(/halo|hai|halo/i)) {
    return res.json({ reply: 'Halo! Saya Rubbel-sederhana. Ada yang bisa saya bantu?' });
  }

  // fallback: echo / simple Q&A style
  return res.json({ reply: `Anda menanyakan: "${req.body.message}". (Ini respons simulasi dari backend demo).` });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Demo backend berjalan di http://localhost:${PORT}`));
