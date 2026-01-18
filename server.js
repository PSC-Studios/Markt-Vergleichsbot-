import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import cron from "node-cron";


const app = express();
app.use(cors());


const MAX_DIFF = 20;
const ITEMS = [
{ material: "DIAMOND", buy: 120, sell: 150 },
{ material: "IRON_INGOT", buy: 35, sell: 55 },
{ material: "GOLD_INGOT", buy: 80, sell: 110 }
];


let latestData = [];
const DISCORD_WEBHOOK = "HIER_DEINE_DISCORD_WEBHOOK_URL";


async function sendDiscord(msg) {
if (!DISCORD_WEBHOOK.startsWith("http")) return;
await fetch(DISCORD_WEBHOOK, {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({ content: msg })
});
}


async function updatePrices() {
const results = [];
for (const item of ITEMS) {
try {
const res = await fetch(`https://api.opsucht.net/market/price/${item.material}`);
const data = await res.json();


const diffBuy = Math.abs((item.buy - data.buy) / data.buy * 100);
const diffSell = Math.abs((item.sell - data.sell) / data.sell * 100);
const diff = Math.max(diffBuy, diffSell);
const status = diff > MAX_DIFF ? "warn" : "ok";


if (status === "warn") {
await sendDiscord(`⚠️ ${item.material} Abweichung ${diff.toFixed(1)}%\nMarkt: ${data.buy}/${data.sell}\nDein Preis: ${item.buy}/${item.sell}`);
}


results.push({
material: item.material,
yourBuy: item.buy,
yourSell: item.sell,
marketBuy: data.buy,
marketSell: data.sell,
diff: diff.toFixed(1),
status
});


} catch {
results.push({
material: item.material,
yourBuy: item.buy,
yourSell: item.sell,
marketBuy: "Fehler",
marketSell: "Fehler",
diff: "Fehler",
status: "error"
});
}
}
latestData = results;
console.log("🔄 Preise aktualisiert");
}


cron.schedule("*/5 * * * *", updatePrices);
updatePrices();


app.get("/api/items", (req, res) => {
res.json(latestData);
});


app.listen(3000, () => console.log("Server läuft auf http://localhost:3000"));