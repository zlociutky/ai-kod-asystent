const przycisk = document.getElementById("generuj");
const status = document.getElementById("status");
const wynikKod = document.getElementById("wynik-kod");
const etykietaJezyka = document.getElementById("etykieta-jezyka");
const selectJezyk = document.getElementById("jezyk");
const kopiujBtn = document.getElementById("kopiuj");

function ustawStatus(tekst, blad = false) {
  status.textContent = tekst;
  status.classList.toggle("blad", blad);
}

przycisk.addEventListener("click", async () => {
  const prompt = document.getElementById("prompt").value.trim();
  const jezyk = selectJezyk.value;

  if (!prompt) {
    ustawStatus("Wpisz najpierw, co mam napisać.", true);
    return;
  }

  przycisk.disabled = true;
  ustawStatus("Generuję...");
  etykietaJezyka.textContent = jezyk;

  try {
    const odpowiedz = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, jezyk }),
    });

    const dane = await odpowiedz.json();

    if (!odpowiedz.ok) {
      ustawStatus(dane.error || "Coś poszło nie tak.", true);
      return;
    }

    wynikKod.textContent = dane.wynik;
    ustawStatus("Gotowe.");
  } catch (err) {
    ustawStatus("Nie udało się połączyć z serwerem.", true);
  } finally {
    przycisk.disabled = false;
  }
});

kopiujBtn.addEventListener("click", async () => {
  await navigator.clipboard.writeText(wynikKod.textContent);
  const oryginalny = kopiujBtn.textContent;
  kopiujBtn.textContent = "Skopiowano";
  setTimeout(() => (kopiujBtn.textContent = oryginalny), 1500);
});
