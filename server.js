// Backend dengan integrasi OpenAI jika OPENAI_API_KEY tersedia.
// Jalankan: npm install && npm start
// Jika tidak ada OPENAI_API_KEY, server tetap berjalan dengan intent parsing berbasis keyword (simulasi).

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

let openai = null;
const OPENAI_KEY = process.env.OPENAI_API_KEY;
if (OPENAI_KEY) {
  try {
    const { Configuration, OpenAIApi } = require('openai');
    const conf = new Configuration({ apiKey: OPENAI_KEY });
    openai = new OpenAIApi(conf);
    console.log('OpenAI client initialized');
  } catch (e) {
    console.warn('OpenAI package not installed or failed to initialize. Run `npm install openai` to enable.');
  }
} else {
  console.log('OPENAI_API_KEY not set — running in fallback mode (keyword intent parsing)');
}

// Serve static frontend (index.html) jika diletakkan di folder yang sama
app.use('/', express.static(path.join(__dirname, '/')));

// Utility: try to extract JSON object from model text
function extractJSON(text) {
  if (!text) return null;
  // find first { ... } block
  const firstBrace = text.indexOf('{');
  if (firstBrace === -1) return null;
  const lastBrace = text.lastIndexOf('}');
  if (lastBrace === -1) return null;
  const jsonStr = text.slice(firstBrace, lastBrace + 1);
  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    return null;
  }
}

// call OpenAI Chat Completion with system prompt enforcing JSON output
async function callOpenAI(userText) {
  if (!openai) return null;
  const system = `You are a home assistant. ALWAYS respond ONLY with a single JSON object (no extra text) using this schema:
{
  "reply": "<string, user-facing reply>",
  "device_action": { "device":"tv|ac|lamp", "action":"on|off|set", "value":<number?> } | null
}
If the user requests a device control action, fill device_action appropriately. If not, set device_action to null. Do NOT add any other keys.`;

  try {
    const resp = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: userText }
      ],
      max_tokens: 200,
      temperature: 0.2
    });

    const text = resp.data.choices[0].message.content.trim();
    // attempt parse
    const parsed = extractJSON(text) || (() => {
      try { return JSON.parse(text); } catch(e){return null;} })();
    return parsed;
  } catch (e) {
    console.error('OpenAI call error:', e?.message || e);
    return null;
  }
}

// POST /api/chat
// Request: { message: "..." }
// Response: { reply: "...", device_action?: { device, action, value? } }
app.post('/api/chat', async (req, res) => {
  const raw = (req.body.message || '').toString();
  const msg = raw.toLowerCase();
  if (!msg) return res.json({ reply: 'Silakan katakan sesuatu.' });

  // If OpenAI available, try to get structured response
  if (openai) {
    const out = await callOpenAI(raw);
    if (out && out.reply) {
      // validate device_action structure if present
      if (out.device_action && out.device_action.device) {
        return res.json({ reply: out.reply, device_action: out.device_action });
      }
      return res.json({ reply: out.reply, device_action: out.device_action || null });
    }
    // fallback to keyword parsing if OpenAI fails to produce valid JSON
  }

  // Fallback simple intent parsing (keyword based)
  // TV
  if (msg.includes('tv')) {
    if (msg.match(/(matikan|mati|off|mat(i|ik)kan tv)/)) {
      return res.json({ reply: 'Oke, saya mematikan TV sekarang.', device_action: { device: 'tv', action: 'off' }});
    }
    if (msg.match(/(hidupkan|nyalakan|on|nyala)/)) {
      return res.json({ reply: 'Baik, saya menyalakan TV.', device_action: { device: 'tv', action: 'on' }});
    }
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

  if (msg.match(/halo|hai|halo/i)) {
    return res.json({ reply: 'Halo! Saya Rubbel-sederhana. Ada yang bisa saya bantu?' });
  }

  return res.json({ reply: `Anda menanyakan: "${raw}". (Ini respons simulasi dari backend demo).` });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Demo backend berjalan di http://localhost:${PORT}`));
