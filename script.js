// ===== AUTORYZACJA (Supabase) =====

const ekranLogowania = document.getElementById("ekran-logowania");
const aplikacja = document.getElementById("aplikacja");

const tabLogowanie = document.getElementById("tab-logowanie");
const tabRejestracja = document.getElementById("tab-rejestracja");
const loginEmail = document.getElementById("login-email");
const loginHaslo = document.getElementById("login-haslo");
const loginSubmit = document.getElementById("login-submit");
const loginGoogle = document.getElementById("login-google");
const loginStatus = document.getElementById("login-status");

const przyciskWyloguj = document.getElementById("przycisk-wyloguj");
const nowyCzatBtn = document.getElementById("nowy-czat");
const szukajCzatow = document.getElementById("szukaj-czatow");
const listaPrzypiete = document.getElementById("lista-przypiete");
const listaOstatnie = document.getElementById("lista-ostatnie");
const sekcjaPrzypiete = document.getElementById("sekcja-przypiete");

const kontoPrzycisk = document.getElementById("konto-przycisk");
const kontoMenu = document.getElementById("konto-menu");
const kontoNazwa = document.getElementById("konto-nazwa");
const kontoMenuNazwa = document.getElementById("konto-menu-nazwa");
const kontoMenuEmail = document.getElementById("konto-menu-email");
const avatarInicjaly = document.getElementById("avatar-inicjaly");

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
    wypelnijKonto(sesja.user);
    zaladujCzaty();
  } else {
    ekranLogowania.style.display = "flex";
    aplikacja.classList.add("ukryta");
  }
});

function wypelnijKonto(user) {
  const nazwa = user.user_metadata?.full_name || user.user_metadata?.name || user.email.split("@")[0];
  const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture;

  kontoNazwa.textContent = nazwa;
  kontoMenuNazwa.textContent = nazwa;
  kontoMenuEmail.textContent = user.email;

  if (avatarUrl) {
    avatarInicjaly.innerHTML = `<img src="${avatarUrl}" alt="">`;
  } else {
    avatarInicjaly.textContent = user.email.charAt(0).toUpperCase();
  }
}

kontoPrzycisk.addEventListener("click", (e) => {
  e.stopPropagation();
  kontoMenu.classList.toggle("ukryta");
});

document.addEventListener("click", (e) => {
  if (!kontoMenu.contains(e.target) && e.target !== kontoPrzycisk) {
    kontoMenu.classList.add("ukryta");
  }
});

// ===== PASEK BOCZNY: CZATY =====

let wszystkieCzaty = [];

nowyCzatBtn.addEventListener("click", () => {
  rozmowa.innerHTML = "";
  scena.classList.remove("aktywna");
  promptPole.value = "";
  promptPole.focus();
});

szukajCzatow.addEventListener("input", () => {
  renderujListyCzatow(szukajCzatow.value.trim().toLowerCase());
});

async function zaladujCzaty() {
  const { data, error } = await supabaseClient
    .from("historia")
    .select("*")
    .order("utworzono", { ascending: false })
    .limit(100);

  if (error || !data) return;

  wszystkieCzaty = data;
  renderujListyCzatow("");
}

function renderujListyCzatow(filtr) {
  const przefiltrowane = filtr
    ? wszystkieCzaty.filter((c) => c.prompt.toLowerCase().includes(filtr))
    : wszystkieCzaty;

  const przypiete = przefiltrowane.filter((c) => c.przypiety);
  const ostatnie = przefiltrowane.filter((c) => !c.przypiety);

  sekcjaPrzypiete.style.display = przypiete.length ? "block" : "none";

  listaPrzypiete.innerHTML = "";
  przypiete.forEach((wpis) => listaPrzypiete.appendChild(zbudujWpisCzatu(wpis)));

  listaOstatnie.innerHTML = "";
  ostatnie.forEach((wpis) => listaOstatnie.appendChild(zbudujWpisCzatu(wpis)));
}

function zbudujWpisCzatu(wpis) {
  const el = document.createElement("div");
  el.className = "wpis-czatu";

  const tytul = document.createElement("span");
  tytul.className = "wpis-czatu-tytul";
  tytul.textContent = wpis.prompt;

  const pinBtn = document.createElement("button");
  pinBtn.type = "button";
  pinBtn.className = "wpis-czatu-pin" + (wpis.przypiety ? " aktywny" : "");
  pinBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="${wpis.przypiety ? "currentColor" : "none"}"><path d="M12 2L14.5 8.5L21 9.5L16 14.5L17.5 21L12 17.5L6.5 21L8 14.5L3 9.5L9.5 8.5L12 2Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>`;

  pinBtn.addEventListener("click", async (e) => {
    e.stopPropagation();
    const nowyStan = !wpis.przypiety;
    await supabaseClient.from("historia").update({ przypiety: nowyStan }).eq("id", wpis.id);
    wpis.przypiety = nowyStan;
    renderujListyCzatow(szukajCzatow.value.trim().toLowerCase());
  });

  el.addEventListener("click", () => {
    rozmowa.innerHTML = "";
    scena.classList.add("aktywna");

    const czyKod = wpis.jezyk !== "ogolny";
    trybProgramisty = czyKod;
    aplikacja.classList.toggle("tryb-dev", czyKod);
    trybEtykieta.textContent = czyKod ? "Tryb zwykły" : "Tryb Programisty";
    promptPole.placeholder = czyKod ? "Zapytaj o kod..." : "Zapytaj o cokolwiek...";

    dodajWiadomoscUzytkownika(wpis.prompt);
    const element = czyKod ? dodajBlokKodu(wpis.jezyk) : dodajOdpowiedzZwykla();
    element.textContent = wpis.wynik;
    rozmowa.scrollTop = rozmowa.scrollHeight;
  });

  el.appendChild(tytul);
  el.appendChild(pinBtn);
  return el;
}

async function zapiszWHistorii(jezyk, prompt, wynik) {
  const { data: sesjaDane } = await supabaseClient.auth.getSession();
  const userId = sesjaDane?.session?.user?.id;
  if (!userId) return;

  const { data } = await supabaseClient
    .from("historia")
    .insert({ user_id: userId, jezyk, prompt, wynik })
    .select()
    .single();

  if (data) {
    wszystkieCzaty.unshift(data);
    renderujListyCzatow(szukajCzatow.value.trim().toLowerCase());
  }
}

// ===== TRYB PROGRAMISTY / ZWYKŁY =====

const trybPrzelacznik = document.getElementById("tryb-przelacznik");
const trybEtykieta = document.getElementById("tryb-etykieta");
const powitanieTekst = document.getElementById("powitanie-tekst");

let trybProgramisty = false;

trybPrzelacznik.addEventListener("click", () => {
  trybProgramisty = !trybProgramisty;
  aplikacja.classList.toggle("tryb-dev", trybProgramisty);
  trybEtykieta.textContent = trybProgramisty ? "Tryb zwykły" : "Tryb Programisty";
  promptPole.placeholder = trybProgramisty ? "Zapytaj o kod..." : "Zapytaj o cokolwiek...";
  powitanieTekst.textContent = trybProgramisty ? "Gotowy, żeby napisać dla Ciebie kod." : "Co dziś wyczarujemy?";
});

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

function dodajOdpowiedzZwykla() {
  const div = document.createElement("div");
  div.className = "wiadomosc-asystenta";
  rozmowa.appendChild(div);
  return div;
}

async function generuj() {
  const prompt = promptPole.value.trim();
  if (!prompt) {
    ustawStatus("Wpisz najpierw, co mam napisać.", true);
    return;
  }

  scena.classList.add("aktywna");
  dodajWiadomoscUzytkownika(prompt);

  const jezykDoWyslania = trybProgramisty ? aktualnyJezyk : "ogolny";
  const etykietaDoWyslania = trybProgramisty ? jezykEtykieta.textContent : "ogolny";

  let elementOdpowiedzi;
  if (trybProgramisty) {
    elementOdpowiedzi = dodajBlokKodu(etykietaDoWyslania);
  } else {
    elementOdpowiedzi = dodajOdpowiedzZwykla();
  }
  elementOdpowiedzi.textContent = "";

  promptPole.value = "";
  promptPole.style.height = "auto";
  przyciskWyslij.disabled = true;
  ustawStatus("Generuję...");
  rozmowa.scrollTop = rozmowa.scrollHeight;

  try {
    const odpowiedz = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, jezyk: jezykDoWyslania }),
    });

    const dane = await odpowiedz.json();

    if (!odpowiedz.ok) {
      ustawStatus(dane.error || "Coś poszło nie tak.", true);
      elementOdpowiedzi.textContent = trybProgramisty ? "// błąd generowania" : "Coś poszło nie tak.";
      return;
    }

    elementOdpowiedzi.textContent = dane.wynik;
    ustawStatus("Gotowe.");
    zapiszWHistorii(etykietaDoWyslania, prompt, dane.wynik);
  } catch (err) {
    ustawStatus("Nie udało się połączyć z serwerem.", true);
    elementOdpowiedzi.textContent = trybProgramisty ? "// błąd połączenia" : "Nie udało się połączyć z serwerem.";
  } finally {
    przyciskWyslij.disabled = false;
    rozmowa.scrollTop = rozmowa.scrollHeight;
  }
}
