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
jezykMenu.addEventListener("click", (e) => {
  const przycisk = e.target.closest("button[data-jezyk]");
  if (!przycisk) return;
  aktualnyJezyk = przycisk.dataset.jezyk;
  jezykEtykieta.textContent = przycisk.dataset.etykieta;
  jezykMenu.hidePopover();
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
  } catch (err) {
    ustawStatus("Nie udało się połączyć z serwerem.", true);
    kodElement.textContent = "// błąd połączenia";
  } finally {
    przyciskWyslij.disabled = false;
    rozmowa.scrollTop = rozmowa.scrollHeight;
  }
}
