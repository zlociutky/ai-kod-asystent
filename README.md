# Asystent Kodu (AI)

Prosta strona z AI do generowania kodu w C++, Python, JavaScript, HTML i CSS.
Korzysta z **darmowego** API Google Gemini — bez płacenia, w ramach limitów.

## Jak to działa

- **frontend/** — strona, którą widzi użytkownik (HTML/CSS/JS)
- **backend/** — mały serwer Node.js, który chowa Twój klucz API i przekazuje
  zapytania do Gemini. Dzięki temu klucz nigdy nie jest widoczny w przeglądarce.

## Krok 1: Zdobądź darmowy klucz API

1. Wejdź na https://aistudio.google.com/app/apikey
2. Zaloguj się kontem Google
3. Kliknij "Create API key" — kopiujesz wygenerowany klucz
4. Karta kredytowa nie jest wymagana na darmowym tierze

## Krok 2: Uruchom lokalnie (test)

```bash
cd backend
npm install
cp .env.example .env
# wklej swój klucz do pliku .env, w miejsce "twoj_klucz_tutaj"
npm start
```

Otwórz http://localhost:3000 w przeglądarce — gotowe.

## Krok 3: Wystaw stronę publicznie (za darmo)

Najprostsze darmowe opcje hostingu dla backendu Node.js:

- **Render.com** (render.com) — darmowy plan "Web Service", wdrożenie z GitHuba
- **Railway.app** — darmowy limit godzin miesięcznie
- **Fly.io** — darmowy plan dla małych aplikacji

Ogólny proces (na przykładzie Render):

1. Wrzuć ten folder na GitHub (nowe repozytorium)
2. Na Render: "New" → "Web Service" → połącz repozytorium
3. Root Directory: `backend`
4. Build Command: `npm install`
5. Start Command: `npm start`
6. W zakładce "Environment" dodaj zmienną `GEMINI_API_KEY` ze swoim kluczem
7. Deploy — po chwili dostajesz publiczny adres URL

## Ograniczenia darmowego API (orientacyjnie)

Darmowy tier Gemini Flash ma limity liczby zapytań na minutę i na dzień —
dokładne wartości sprawdzaj na https://ai.google.dev/gemini-api/docs/rate-limits,
bo providerzy zmieniają je dość często. W `server.js` jest prosty licznik
dziennego limitu (`dziennyLimit`), który możesz dostosować, żeby nie
przekroczyć darmowego progu przy większym ruchu.

## Co dalej (pomysły na rozwój)

- Dodać historię wygenerowanych fragmentów (baza danych)
- Dodać logowanie użytkowników i osobne limity na osobę
- Podpiąć drugi model jako "fallback" gdy limit się wyczerpie
- Dodać podświetlanie składni w edytorze wyjściowym (np. biblioteka Prism.js)
