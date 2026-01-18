import fetch from "node-fetch";
import cron from "node-cron";

/* =====================
   KONFIGURATION
===================== */

const MAX_DIFF = 20; // % Abweichung

const ITEMS = [
  { 
    material: "DIAMOND", 
    yourBuy: 120,     // dein Ankaufspreis im Shop
    yourSell: 150     // dein Verkaufspreis im Shop
  },
  { 
    material: "IRON_INGOT", 
    yourBuy: 35, 
    yourSell: 55 
  }
];

// OPTIONAL (Discord)
const WEBHOOK_URL = "HIER_DEINE_DISCORD_WEBHOOK_URL";

/* ===================== */

async function sendDiscord(msg) {
  if (!WEBHOOK_URL.startsWith("http")) return;
  await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: msg })
  });
}

async function checkPrices() {
  console.log("🔄 Preischeck gestartet");

  for (const item of ITEMS) {
    try {
      const res = await fetch(
        `https://api.opsucht.net/market/price/${item.material}`
      );
      const data = await res.json();

      const diffBuy = Math.abs((item.buy - data.buy) / data.buy * 100);
      const diffSell = Math.abs((item.sell - data.sell) / data.sell * 100);

      if (diffBuy > MAX_DIFF || diffSell > MAX_DIFF) {
        const msg =
          `⚠️ ${item.material}\n` +
          `Markt: ${data.buy}/${data.sell}\n` +
          `Dein Preis: ${item.buy}/${item.sell}`;

        console.log(msg);
        await sendDiscord(msg);
      } else {
        console.log(`✅ ${item.material} OK`);
      }
    } catch {
      console.log(`❌ Fehler bei ${item.material}`);
    }
  }
}

// alle 5 Minuten
cron.schedule("*/5 * * * *", checkPrices);

console.log("🚀 OPSucht Preisbot läuft 24/7");
