// server.js — backend asystenta kodowania
// Chowa klucz API po stronie serwera (użytkownik nigdy go nie widzi w przeglądarce)
// i przekazuje zapytania do darmowego API Google Gemini.

const express = require("express");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-2.0-flash"; // szybki, darmowy model — dobry do kodu

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "..", "frontend")));

// Prosty licznik zapytań na dzień (w pamięci) — żeby nie wyczerpać darmowego limitu
const dziennyLimit = 200; // dostosuj do własnego limitu API
let licznik = { data: nowaData(), ile: 0 };

function nowaData() {
  return new Date().toISOString().slice(0, 10);
}

function sprawdzLimit() {
  const dzis = nowaData();
  if (licznik.data !== dzis) {
    licznik = { data: dzis, ile: 0 };
  }
  licznik.ile += 1;
  return licznik.ile <= dziennyLimit;
}

// Prompty systemowe dopasowane pod każdy język
const PROMPTY = {
  cpp: "Jesteś ekspertem C++. Odpowiadaj czystym, poprawnym kodem C++ (nowoczesny standard, C++17+ jeśli to możliwe). Krótko skomentuj kluczowe fragmenty. Nie tłumacz oczywistych rzeczy.",
  python: "Jesteś ekspertem Python. Pisz czysty, idiomatyczny kod zgodny z PEP8. Krótko skomentuj kluczowe fragmenty.",
  javascript: "Jesteś ekspertem JavaScript (nowoczesny ES2022+). Pisz czysty, czytelny kod. Krótko skomentuj kluczowe fragmenty.",
  html: "Jesteś ekspertem HTML. Pisz semantyczny, poprawny kod HTML5. Krótko skomentuj kluczowe fragmenty.",
  css: "Jesteś ekspertem CSS. Pisz nowoczesny, czysty CSS (flexbox/grid, zmienne CSS gdy pasuje). Krótko skomentuj kluczowe fragmenty.",
};

app.post("/api/generate", async (req, res) => {
  try {
    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: "Brak klucza GEMINI_API_KEY na serwerze. Ustaw go w zmiennych środowiskowych." });
    }
    if (!sprawdzLimit()) {
      return res.status(429).json({ error: "Dzienny limit zapytań wyczerpany. Spróbuj jutro." });
    }

    const { prompt, jezyk } = req.body;
    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "Brak treści zapytania (prompt)." });
    }

    const systemPrompt = PROMPTY[jezyk] || "Jesteś ekspertem programowania. Odpowiadaj czystym, poprawnym kodem.";

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: { temperature: 0.3, maxOutputTokens: 2048 },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Błąd Gemini API:", errText);
      return res.status(502).json({ error: "Błąd po stronie modelu AI. Spróbuj ponownie." });
    }

    const data = await response.json();
    const tekst = data?.candidates?.[0]?.content?.parts?.[0]?.text || "(brak odpowiedzi)";

    res.json({ wynik: tekst });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Błąd serwera." });
  }
});

app.listen(PORT, () => {
  console.log(`Serwer działa na porcie ${PORT}`);
});
