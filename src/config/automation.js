const axios = require("axios");
const moment = require("moment-timezone");
const Rate = require("../models/rates");

const BYBIT_URL = "https://www.bybitglobal.com/x-api/fiat/otc/item/online";
const NOSH_URL = "https://api.nosh.ng/v2/wallets/rates";
const COINGECKO_BTC_URL =
  "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd";

const TOLERANCE_PERCENT = 0.01;
const UPDATE_INTERVAL = 60000;

const TELEGRAM_BOT_TOKEN = "8045314803:AAHpC2xXAxj47dggjS1rmfnOd7fIiNMAzKE";
const TELEGRAM_CHAT_ID = "8502587734";

let engine_state = {};
let sell_vw_history = [];

let btc_last_price = null;
let ngn_last_rate = null;
let last_report_minute = null;

let btc_flash_active = false;
let btc_flash_start_time = null;
let btc_flash_reference_price = null;
let btc_flash_lowest_price = null;
let btc_last_flash_alert_minute = 0;

/* FLASH PUMP */
let btc_pump_active = false;
let btc_pump_start_time = null;
let btc_pump_reference_price = null;
let btc_pump_highest_price = null;
let btc_last_pump_alert_minute = 0;

async function sendTelegram(message) {
  try {
    await axios.post(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
      },
    );
  } catch {}
}

async function fetchBybit(side) {
  const payload = {
    userId: "",
    tokenId: "USDT",
    currencyId: "NGN",
    payment: [],
    side: String(side),
    size: "20",
    page: "1",
    amount: "",
    vaMaker: true,
    bulkMaker: true,
    canTrade: true,
    verificationFilter: 0,
    sortType: "OVERALL_RANKING",
    paymentPeriod: [],
    itemRegion: 1,
  };

  const res = await axios.post(BYBIT_URL, payload);
  return res.data.result.items.map((x) => parseFloat(x.price));
}

async function fetchBybitBTCCluster() {
  const payload = {
    userId: "",
    tokenId: "BTC",
    currencyId: "NGN",

    side: "0", // SELL

    page: 1,
    size: 20,

    amount: "",

    // ✅ STRICT FILTERS
    payment: ["Bank Transfer"],
    verificationFilter: 1, // Verified only
    vaMaker: true,
    bulkMaker: true,
    canTrade: true,

    sortType: "OVERALL_RANKING",
    itemRegion: 1,
  };

  const res = await axios.post(
    "https://www.bybitglobal.com/x-api/fiat/otc/item/online",
    payload,
    {
      headers: {
        "Content-Type": "application/json;charset=UTF-8",
        Accept: "application/json",
        Origin: "https://www.bybit.com",
        Referer: "https://www.bybit.com/",
      },
    },
  );

  const items = res.data?.result?.items || [];

  if (!items.length) {
    console.log("No BTC ads returned");
    return { low: 0, high: 0, vw: 0, count: 0 };
  }

  // 🔎 HARD FILTER AGAIN IN JS (VERY IMPORTANT)
  const filteredAds = items.filter(
    (ad) =>
      ad.payments?.some((p) =>
        p.paymentMethod?.toLowerCase().includes("bank"),
      ) && ad.makerStatus === 1, // Verified advertiser
  );

  if (!filteredAds.length) {
    console.log("No BTC ads after strict filtering");
    return { low: 0, high: 0, vw: 0, count: 0 };
  }

  const prices = filteredAds.map((x) => parseFloat(x.price));

  const btcUSD = await fetchBTC();
  if (!btcUSD) return { low: 0, high: 0, vw: 0, count: 0 };

  // 🔥 TIGHTER tolerance (0.5%)
  const med = median(prices);
  const tol = med * 0.005;

  const cluster = prices.filter((p) => Math.abs(p - med) <= tol);

  if (!cluster.length) {
    return { low: 0, high: 0, vw: 0, count: 0 };
  }

  const usd_ngn_rates = cluster.map((p) => p / btcUSD);

  // 🔥 Get trusted reference rate
  const realUsdNgn = await fetchRealUsdNgn();

  if (!realUsdNgn || isNaN(realUsdNgn)) {
    console.log("Invalid realUsdNgn reference rate");
    return { low: 0, high: 0, vw: 0, count: 0 };
  }

  // 🔥 Remove anything 3% away from real USD rate
  const finalCluster = usd_ngn_rates.filter(
    (r) => Math.abs(r - realUsdNgn) <= realUsdNgn * 0.03,
  );

  if (!finalCluster.length) {
    console.log("All BTC ads removed by protection layer");
    return { low: 0, high: 0, vw: 0, count: 0 };
  }

  // ✅ Return cleaned result
  return {
    low: Number(Math.min(...finalCluster).toFixed(2)),
    high: Number(Math.max(...finalCluster).toFixed(2)),
    vw: Number(
      (finalCluster.reduce((a, b) => a + b, 0) / finalCluster.length).toFixed(
        2,
      ),
    ),
    count: finalCluster.length,
  };
}

async function fetchBTC() {
  const res = await axios.get(COINGECKO_BTC_URL);
  return parseFloat(res.data.bitcoin.usd);
}

async function fetchUSDTNGN() {
  try {
    const res = await axios.get(
      "https://api.coingecko.com/api/v3/simple/price",
      { params: { ids: "tether", vs_currencies: "ngn" } },
    );
    return res.data.tether.ngn;
  } catch {
    return null;
  }
}

async function fetchNosh(amount) {
  const payload = {
    cryptoValue: "",
    dollarValue: String(amount),
    network: "BTC",
  };

  const res = await axios.post(NOSH_URL, payload);
  return Math.round(res.data.NGNAmount / amount);
}

/* ==============================
   JEROID FETCHERS
============================== */

async function fetchJeroidRates(pairCode) {
  const url = `https://platform.jeroid.co/api/v2/currency/trade/crypto:cross_pair_rates/${pairCode}`;

  try {
    const res = await axios.get(url, {
      headers: {
        accept: "application/json",
        referer: "https://www.jeroid.co/",
      },
    });

    const data = res.data.response || {};

    return {
      buy: parseFloat(data.usd_buy?.rate) || 0,
      sell: parseFloat(data.usd_sell?.rate) || 0,
      market: parseFloat(data.usd_market?.rate) || 0,
    };
  } catch (err) {
    console.log(`Jeroid fetch error for ${pairCode}:`, err.message);
    return { buy: 0, sell: 0, market: 0 };
  }
}
/* ==============================
   UTILITIES
============================== */

function median(arr) {
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

function cluster(prices) {
  const med = median(prices);
  const tol = med * TOLERANCE_PERCENT;
  const filtered = prices.filter((p) => Math.abs(p - med) <= tol);

  return {
    low: Number(Math.min(...filtered).toFixed(2)),
    high: Number(Math.max(...filtered).toFixed(2)),
    vw: Number(
      (filtered.reduce((a, b) => a + b, 0) / filtered.length).toFixed(2),
    ),
    count: filtered.length,
  };
}

function jamestownRate(base, amount, side = "buy") {
  let rate = side === "sell" ? base - 30 : base + 30;
  if (amount < 100) rate -= 10;
  else if (amount > 1000) rate += 5;
  return Math.round(rate);
}

function shouldSendReport(now) {
  const targets = ["07:00", "12:00", "16:00", "20:00", "00:00"];
  return targets.includes(now.format("HH:mm"));
}

function buildReport(state = {}) {
  const safe = (v, d = 0) => (v !== undefined && v !== null ? v : d);

  const f2 = (v) => (typeof v === "number" ? v.toFixed(2) : v || 0);

  return `
📊 JAMESTOWN RATE UPDATE

🕒 UTC: ${safe(state.timestamp, "N/A")}
━━━━━━━━━━━━━━━━━━
💰 Jamestown SELL
<100: ${safe(state.jamestown_sell?.under_100)}
100-1000: ${safe(state.jamestown_sell?.["100_to_1000"])}
>1000: ${safe(state.jamestown_sell?.over_1000)}
 
📉 SELL CLUSTER
VW: ${f2(state.sell_cluster?.vw)}
Low: ${f2(state.sell_cluster?.low)}
High: ${f2(state.sell_cluster?.high)}
 
NOSH
Min: ${safe(state.nosh_min)}
Max: ${safe(state.nosh_max)}

🏦 JEROID BTC
Buy: ${f2(state.jeroid?.btc?.buy)}
Sell: ${f2(state.jeroid?.btc?.sell)}

🏦 JEROID USDT (TRC20)
Buy: ${f2(state.jeroid?.usdt_trc20?.buy)}
Sell: ${f2(state.jeroid?.usdt_trc20?.sell)}

📉 24H SELL VW Change: ${f2(state.sell_vw_change_24h)}
━━━━━━━━━━━━━━━━━━
📈 BUY CLUSTER
High: ${f2(state.buy_cluster?.high)}
VW Spread: ${f2(state.vw_spread)}

💼 Jamestown BUY
<100: ${safe(state.jamestown_buy?.under_100)}
100-1000: ${safe(state.jamestown_buy?.["100_to_1000"])}
>1000: ${safe(state.jamestown_buy?.over_1000)}
━━━━━━━━━━━━━━━━━━
🌍 MARKET
BTC/USD: $${f2(state.btc_usd)}
NGN/USD: ${f2(state.ngn_usd)}
━━━━━━━━━━━━━━━━━━
₿ BYBIT BTC → USD/NGN
Low: ${f2(state.bybit_btc_usdngn_cluster?.low)}
High: ${f2(state.bybit_btc_usdngn_cluster?.high)}
VW: ${f2(state.bybit_btc_usdngn_cluster?.vw)}
`;
}

/* ==============================
   ENGINE LOOP
============================== */

async function engineLoop() {
  let ngn_cumulative_drop = 0;
  let first_run_done = false;

  while (true) {
    try {
      const now = moment().tz("Africa/Lagos");
      const nowStr = now.format("YYYY-MM-DD HH:mm:ss [WAT]");

      const buy_cluster = cluster(await fetchBybit(1));
      const sell_cluster = cluster(await fetchBybit(0));

      const buy_vw = buy_cluster.vw;
      const sell_vw = sell_cluster.vw;
      const vw_spread = Number((buy_vw - sell_vw).toFixed(2));

      /* 24H TRACKING */
      sell_vw_history.push({ time: now.clone(), value: sell_vw });
      const cutoff = moment().subtract(24, "hours");
      sell_vw_history = sell_vw_history.filter((x) => x.time.isAfter(cutoff));

      let sell_vw_change_24h = 0;
      if (sell_vw_history.length > 0)
        sell_vw_change_24h = Number(
          (sell_vw - sell_vw_history[0].value).toFixed(2),
        );

      /* Jamestown */
      const jamestown_buy = {
        under_100: jamestownRate(sell_vw, 50, "buy"),
        "100_to_1000": jamestownRate(sell_vw, 500, "buy"),
        over_1000: jamestownRate(sell_vw, 5000, "buy"),
      };

      const jamestown_sell = {
        under_100: jamestownRate(sell_vw, 50, "sell"),
        "100_to_1000": jamestownRate(sell_vw, 500, "sell"),
        over_1000: jamestownRate(sell_vw, 5000, "sell"),
      };

      const btc_price = await fetchBTC();
      const usdt_ngn = (await fetchUSDTNGN()) || engine_state.ngn_usd;
      const nosh_min = await fetchNosh(1);
      const nosh_max = await fetchNosh(50000);

      /* FLASH DROP */
      if (btc_last_price) {
        const minute_drop_pct =
          ((btc_last_price - btc_price) / btc_last_price) * 100;

        if (minute_drop_pct >= 0.5 && !btc_flash_active) {
          btc_flash_active = true;
          btc_flash_start_time = now.clone();
          btc_flash_reference_price = btc_last_price;
          btc_flash_lowest_price = btc_price;
          btc_last_flash_alert_minute = 0;

          await sendTelegram(
            `🚨 BTC FLASH DROP STARTED\nStart: $${btc_flash_reference_price}\nCurrent: $${btc_price}\n1-min drop: ${minute_drop_pct.toFixed(
              2,
            )}%\nUTC: ${nowStr}`,
          );
        }
      }

      if (btc_flash_active) {
        if (btc_price < btc_flash_lowest_price)
          btc_flash_lowest_price = btc_price;

        const minutes_running = now.diff(btc_flash_start_time, "minutes");

        const total_drop_pct =
          ((btc_flash_reference_price - btc_flash_lowest_price) /
            btc_flash_reference_price) *
          100;

        if (
          minutes_running >= 5 &&
          minutes_running % 5 === 0 &&
          minutes_running !== btc_last_flash_alert_minute
        ) {
          await sendTelegram(
            `📉 BTC CASCADE DROP CONTINUING\nDuration: ${minutes_running} mins\nStart: $${btc_flash_reference_price}\nLowest: $${btc_flash_lowest_price}\nTotal Drop: ${total_drop_pct.toFixed(
              2,
            )}%\nUTC: ${nowStr}`,
          );
          btc_last_flash_alert_minute = minutes_running;
        }

        const recovery_pct =
          ((btc_price - btc_flash_lowest_price) / btc_flash_lowest_price) * 100;

        if (recovery_pct >= 0.3) {
          await sendTelegram(
            `✅ BTC RECOVERY DETECTED\nLowest: $${btc_flash_lowest_price}\nCurrent: $${btc_price}\nUTC: ${nowStr}`,
          );
          btc_flash_active = false;
        }
      }

      /* FLASH PUMP */
      if (btc_last_price) {
        const minute_pump_pct =
          ((btc_price - btc_last_price) / btc_last_price) * 100;

        if (minute_pump_pct >= 0.5 && !btc_pump_active) {
          btc_pump_active = true;
          btc_pump_start_time = now.clone();
          btc_pump_reference_price = btc_last_price;
          btc_pump_highest_price = btc_price;
          btc_last_pump_alert_minute = 0;

          await sendTelegram(
            `🚀 BTC FLASH PUMP STARTED\nStart: $${btc_pump_reference_price}\nCurrent: $${btc_price}\n1-min pump: ${minute_pump_pct.toFixed(
              2,
            )}%\nUTC: ${nowStr}`,
          );
        }
      }

      if (btc_pump_active) {
        if (btc_price > btc_pump_highest_price)
          btc_pump_highest_price = btc_price;

        const minutes_running = now.diff(btc_pump_start_time, "minutes");

        const total_pump_pct =
          ((btc_pump_highest_price - btc_pump_reference_price) /
            btc_pump_reference_price) *
          100;

        if (
          minutes_running >= 5 &&
          minutes_running % 5 === 0 &&
          minutes_running !== btc_last_pump_alert_minute
        ) {
          await sendTelegram(
            `📈 BTC RALLY CONTINUING\nDuration: ${minutes_running} mins\nStart: $${btc_pump_reference_price}\nHighest: $${btc_pump_highest_price}\nTotal Pump: ${total_pump_pct.toFixed(
              2,
            )}%\nUTC: ${nowStr}`,
          );
          btc_last_pump_alert_minute = minutes_running;
        }

        const retrace_pct =
          ((btc_pump_highest_price - btc_price) / btc_pump_highest_price) * 100;

        if (retrace_pct >= 0.3) {
          await sendTelegram(
            `⚠ BTC PUMP RETRACE DETECTED\nHighest: $${btc_pump_highest_price}\nCurrent: $${btc_price}\nUTC: ${nowStr}`,
          );
          btc_pump_active = false;
        }
      }

      btc_last_price = btc_price;

      /* ==============================
      JEROID RATES
      ============================== */

      const jeroid_btc = await fetchJeroidRates("BTC_BTC");
      const jeroid_usdt = await fetchJeroidRates("USDT_TRC20");
      const bybit_btc_usdngn_cluster = await fetchBybitBTCCluster();

      /* NGN DROP */
      if (ngn_last_rate) {
        const drop_ngn = ngn_last_rate - sell_vw;
        if (drop_ngn >= 2) {
          ngn_cumulative_drop += drop_ngn;
          await sendTelegram(
            `⚠ NGN DROP ALERT | Cumulative drop: ${ngn_cumulative_drop.toFixed(
              2,
            )} NGN | Current Sell VW: ${sell_vw} UTC: ${nowStr}`,
          );
        } else {
          ngn_cumulative_drop = 0;
        }
      }
      ngn_last_rate = sell_vw;

      /* UPDATE STATE */
      engine_state = {
        timestamp: nowStr,
        buy_cluster,
        sell_cluster,
        vw_spread,
        sell_vw_change_24h,
        jamestown_buy,
        jamestown_sell,
        nosh_min,
        nosh_max,
        btc_usd: btc_price,
        ngn_usd: usdt_ngn,
        btc_flash_active,
        btc_flash_lowest_price,
        btc_flash_reference_price,
        btc_pump_active,
        btc_pump_highest_price,
        btc_pump_reference_price,
        jeroid: {
          btc: jeroid_btc,
          usdt_trc20: jeroid_usdt,
        },

        bybit_btc_usdngn_cluster,
      };

      if (engine_state?.jamestown_buy?.over_1000) {
        const query = {
          type: "crypto",
          rate: { $ne: engine_state.jamestown_buy.over_1000 },
        };
        await Rate.updateMany(query, {
          rate: engine_state.jamestown_buy.over_1000,
        });
      }

      if (engine_state?.jamestown_sell?.over_1000) {
        const query = {
          type: "sell-crypto",
          rate: { $ne: engine_state.jamestown_sell.over_1000 },
        };
        await Rate.updateMany(query, {
          rate: engine_state.jamestown_sell.over_1000,
        });
      }

      console.log(engine_state, "ENG STATE");

      /* FIRST RUN */
      if (!first_run_done) {
        await sendTelegram(buildReport(engine_state));
        first_run_done = true;
      }

      /* SCHEDULED REPORT */
      if (shouldSendReport(now) && last_report_minute !== now.minute()) {
        await sendTelegram(buildReport(engine_state));
        last_report_minute = now.minute();
      }
    } catch (e) {
      console.log("Engine error:", e.message);
    }

    await new Promise((r) => setTimeout(r, UPDATE_INTERVAL));
  }
}

engineLoop();