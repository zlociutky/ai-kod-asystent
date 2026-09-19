// ===== AUTORYZACJA (Supabase) =====

const ekranLogowania = document.getElementById("ekran-logowania");
const aplikacja = document.getElementById("aplikacja");
const uzytkownikEmail = document.getElementById("uzytkownik-email");

const tabLogowanie = document.getElementById("tab-logowanie");
const tabRejestracja = document.getElementById("tab-rejestracja");
const loginEmail = document.getElementById("login-email");
const loginHaslo = document.getElementById("login-haslo");
const loginSubmit = document.getElementById("login-submit");
const loginGoogle = document.getElementById("login-google");
const loginStatus = document.getElementById("login-status");

const przyciskWyloguj = document.getElementById("przycisk-wyloguj");
const przyciskHistoria = document.getElementById("przycisk-historia");
const zamknijHistorie = document.getElementById("zamknij-historie");
const panelHistorii = document.getElementById("panel-historii");
const listaHistorii = document.getElementById("lista-historii");

let trybRejestracji = false;

tabLogowanie.addEventListener("click", () => ustawTrybLogowania(false));
tabRejestracja.addEventListener("click", () => ustawTrybLogowania(true));

function ustawTrybLogowania(rejestracja) {
  trybRejestracji = rejestracja;
  tabLogowanie.classList.toggle("aktywna", !rejestracja);
  tabRejestracja.classList.toggle("aktywna", rejestracja);
  loginSubmit.textContent = rejestracja ? "Załóż konto" : "Zaloguj się";
  loginStatus.textContent = "";
}

loginSubmit.addEventListener("click", async () => {
  const email = loginEmail.value.trim();
  const haslo = loginHaslo.value;

  if (!email || !haslo) {
    loginStatus.textContent = "Podaj e-mail i hasło.";
    return;
  }

  loginSubmit.disabled = true;
  loginStatus.textContent = "";

  try {
    if (trybRejestracji) {
      const { error } = await supabaseClient.auth.signUp({ email, password: haslo });
      if (error) throw error;
      loginStatus.style.color = "var(--fiolet-jasny)";
      loginStatus.textContent = "Konto założone. Sprawdź e-mail, żeby je potwierdzić, potem zaloguj się.";
      ustawTrybLogowania(false);
    } else {
      const { error } = await supabaseClient.auth.signInWithPassword({ email, password: haslo });
      if (error) throw error;
    }
  } catch (err) {
    loginStatus.style.color = "var(--blad)";
    loginStatus.textContent = przetlumaczBladLogowania(err.message);
  } finally {
    loginSubmit.disabled = false;
  }
});

loginGoogle.addEventListener("click", async () => {
  await supabaseClient.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: window.location.origin },
  });
});

przyciskWyloguj.addEventListener("click", async () => {
  await supabaseClient.auth.signOut();
});

function przetlumaczBladLogowania(tresc) {
  if (tresc.includes("Invalid login credentials")) return "Zły e-mail lub hasło.";
  if (tresc.includes("already registered")) return "Ten e-mail jest już zarejestrowany.";
  if (tresc.includes("Password should be")) return "Hasło musi mieć co najmniej 6 znaków.";
  return tresc;
}

// Reakcja na zmianę stanu logowania
supabaseClient.auth.onAuthStateChange((_zdarzenie, sesja) => {
  if (sesja) {
    ekranLogowania.style.display = "none";
    aplikacja.classList.remove("ukryta");
    uzytkownikEmail.textContent = sesja.user.email;
  } else {
    ekranLogowania.style.display = "flex";
    aplikacja.classList.add("ukryta");
    panelHistorii.classList.add("ukryta");
  }
});

// ===== HISTORIA =====

przyciskHistoria.addEventListener("click", async () => {
  panelHistorii.classList.remove("ukryta");
  await zaladujHistorie();
});

zamknijHistorie.addEventListener("click", () => {
  panelHistorii.classList.add("ukryta");
});

async function zaladujHistorie() {
  listaHistorii.innerHTML = "<p class='pusta-historia'>Wczytuję...</p>";

  const { data, error } = await supabaseClient
    .from("historia")
    .select("*")
    .order("utworzono", { ascending: false })
    .limit(50);

  if (error) {
    listaHistorii.innerHTML = "<p class='pusta-historia'>Nie udało się wczytać historii.</p>";
    return;
  }

  if (!data || data.length === 0) {
    listaHistorii.innerHTML = "<p class='pusta-historia'>Brak zapytań — Twoja historia pojawi się tutaj.</p>";
    return;
  }

  listaHistorii.innerHTML = "";
  data.forEach((wpis) => {
    const el = document.createElement("button");
    el.className = "wpis-historii";
    el.innerHTML = `<span class="wpis-historii-jezyk">${wpis.jezyk}</span><span class="wpis-historii-tresc">${escapujHtml(wpis.prompt)}</span>`;
    el.addEventListener("click", () => {
      scena.classList.add("aktywna");
      dodajWiadomoscUzytkownika(wpis.prompt);
      const kodElement = dodajBlokKodu(wpis.jezyk);
      kodElement.textContent = wpis.wynik;
      panelHistorii.classList.add("ukryta");
      rozmowa.scrollTop = rozmowa.scrollHeight;
    });
    listaHistorii.appendChild(el);
  });
}

async function zapiszWHistorii(jezyk, prompt, wynik) {
  const { data: sesjaDane } = await supabaseClient.auth.getSession();
  const userId = sesjaDane?.session?.user?.id;
  if (!userId) return;

  await supabaseClient.from("historia").insert({
    user_id: userId,
    jezyk,
    prompt,
    wynik,
  });
}

function escapujHtml(tekst) {
  const div = document.createElement("div");
  div.textContent = tekst;
  return div.innerHTML;
}

// ===== ASYSTENT KODU =====

const scena = document.querySelector(".scena");
const rozmowa = document.getElementById("rozmowa");
const promptPole = document.getElementById("prompt");
const przyciskWyslij = document.getElementById("generuj");
const status = document.getElementById("status");

const jezykPrzycisk = document.getElementById("jezyk-przycisk");
const jezykEtykieta = document.getElementById("jezyk-etykieta");
const jezykMenu = document.getElementById("jezyk-menu");

let aktualnyJezyk = "cpp";

// Wybór języka z menu
jezykPrzycisk.addEventListener("click", (e) => {
  e.stopPropagation();
  jezykMenu.classList.toggle("otwarte");
});

jezykMenu.addEventListener("click", (e) => {
  const przycisk = e.target.closest("button[data-jezyk]");
  if (!przycisk) return;
  aktualnyJezyk = przycisk.dataset.jezyk;
  jezykEtykieta.textContent = przycisk.dataset.etykieta;
  jezykMenu.classList.remove("otwarte");
});

document.addEventListener("click", (e) => {
  if (!jezykMenu.contains(e.target) && e.target !== jezykPrzycisk) {
    jezykMenu.classList.remove("otwarte");
  }
});

// Auto-rozszerzanie pola tekstowego
promptPole.addEventListener("input", () => {
  promptPole.style.height = "auto";
  promptPole.style.height = Math.min(promptPole.scrollHeight, 160) + "px";
});

promptPole.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    generuj();
  }
});

przyciskWyslij.addEventListener("click", generuj);

function ustawStatus(tekst, blad = false) {
  status.textContent = tekst;
  status.classList.toggle("blad", blad);
}

function dodajWiadomoscUzytkownika(tekst) {
  const div = document.createElement("div");
  div.className = "wiadomosc-uzytkownik";
  div.textContent = tekst;
  rozmowa.appendChild(div);
}

function dodajBlokKodu(jezykEtykietaTekst) {
  const blok = document.createElement("div");
  blok.className = "blok-kodu";
  blok.innerHTML = `
    <div class="blok-kodu-naglowek">
      <span>${jezykEtykietaTekst}</span>
      <button type="button">Kopiuj</button>
    </div>
    <pre><code></code></pre>
  `;
  rozmowa.appendChild(blok);

  const kopiujBtn = blok.querySelector("button");
  const kodElement = blok.querySelector("code");

  kopiujBtn.addEventListener("click", async () => {
    await navigator.clipboard.writeText(kodElement.textContent);
    const oryginalny = kopiujBtn.textContent;
    kopiujBtn.textContent = "Skopiowano";
    setTimeout(() => (kopiujBtn.textContent = oryginalny), 1500);
  });

  return kodElement;
}

async function generuj() {
  const prompt = promptPole.value.trim();
  if (!prompt) {
    ustawStatus("Wpisz najpierw, co mam napisać.", true);
    return;
  }

  scena.classList.add("aktywna");
  dodajWiadomoscUzytkownika(prompt);
  const kodElement = dodajBlokKodu(jezykEtykieta.textContent);
  kodElement.textContent = "";

  promptPole.value = "";
  promptPole.style.height = "auto";
  przyciskWyslij.disabled = true;
  ustawStatus("Generuję...");
  rozmowa.scrollTop = rozmowa.scrollHeight;

  try {
    const odpowiedz = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, jezyk: aktualnyJezyk }),
    });

    const dane = await odpowiedz.json();

    if (!odpowiedz.ok) {
      ustawStatus(dane.error || "Coś poszło nie tak.", true);
      kodElement.textContent = "// błąd generowania";
      return;
    }

    kodElement.textContent = dane.wynik;
    ustawStatus("Gotowe.");
    zapiszWHistorii(jezykEtykieta.textContent, prompt, dane.wynik);
  } catch (err) {
    ustawStatus("Nie udało się połączyć z serwerem.", true);
    kodElement.textContent = "// błąd połączenia";
  } finally {
    przyciskWyslij.disabled = false;
    rozmowa.scrollTop = rozmowa.scrollHeight;
  }
}
