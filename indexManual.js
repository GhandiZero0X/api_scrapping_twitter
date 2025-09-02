const puppeteer = require("puppeteer");
const Sentiment = require("sentiment");
const fs = require("fs");

const sentiment = new Sentiment();
// bisa cari katakunci langsung di twitter pakek tools advance search
// https://twitter.com/search-advanced
const twitterURLs = [
  // Masukkan Kata Kunci yang Ingin Dicari dengan link search di X (Twitter)

  // Saham BMRI :
  // "https://x.com/search?q=BMRI%20lang%3Aid%20until%3A2018-12-31%20since%3A2018-01-01&src=typed_query&f=live", // sudah
  // "https://x.com/search?q=BMRI%20lang%3Aid%20until%3A2019-12-31%20since%3A2019-01-01&src=typed_query&f=live", // sudah
  // "https://x.com/search?q=BMRI%20lang%3Aid%20until%3A2020-12-31%20since%3A2020-01-01&src=typed_query&f=live", // kurang februari dan januari
  // "https://x.com/search?q=BMRI%20lang%3Aid%20until%3A2021-12-31%20since%3A2021-01-01&src=typed_query&f=live", // baru sampai oktober 19 
  // "https://x.com/search?q=BMRI%20lang%3Aid%20until%3A2022-12-31%20since%3A2022-01-01&src=typed_query&f=live", // baru sampai desember 7
  // "https://x.com/search?q=BMRI%20lang%3Aid%20until%3A2023-12-31%20since%3A2023-01-01&src=typed_query&f=live", // sudah
  // "https://x.com/search?q=BMRI%20lang%3Aid%20until%3A2024-12-31%20since%3A2024-01-01&src=typed_query&f=live" // baru sampai mei 12

  // Saham INDF :
  "https://x.com/search?q=%23INDF%20lang%3Aid%20until%3A2018-12-31%20since%3A2018-01-01&src=typed_query&f=top",
  "https://x.com/search?q=%23INDF%20lang%3Aid%20until%3A2018-12-31%20since%3A2018-01-01&src=typed_query&f=live",
  "https://x.com/search?q=%23INDF%20lang%3Aid%20until%3A2019-12-31%20since%3A2019-01-01&src=typed_query",
  "https://x.com/search?q=%23INDF%20lang%3Aid%20until%3A2019-12-31%20since%3A2019-01-01&src=typed_query&f=live",
  "https://x.com/search?q=%23INDF%20lang%3Aid%20until%3A2020-12-31%20since%3A2020-01-01&src=typed_query",
  "https://x.com/search?q=%23INDF%20lang%3Aid%20until%3A2020-12-31%20since%3A2020-01-01&src=typed_query&f=live",
  "https://x.com/search?q=%23INDF%20lang%3Aid%20until%3A2021-12-31%20since%3A2021-01-01&src=typed_query",
  "https://x.com/search?q=%23INDF%20lang%3Aid%20until%3A2021-12-31%20since%3A2021-01-01&src=typed_query&f=live",
  "https://x.com/search?q=%23INDF%20lang%3Aid%20until%3A2022-12-31%20since%3A2022-01-01&src=typed_query",
  "https://x.com/search?q=%23INDF%20lang%3Aid%20until%3A2022-12-31%20since%3A2022-01-01&src=typed_query&f=live",
  "https://x.com/search?q=%23INDF%20lang%3Aid%20until%3A2023-12-31%20since%3A2023-01-01&src=typed_query",
  "https://x.com/search?q=%23INDF%20lang%3Aid%20until%3A2023-12-31%20since%3A2023-01-01&src=typed_query&f=live",
  "https://x.com/search?q=%23INDF%20lang%3Aid%20until%3A2024-12-31%20since%3A2024-01-01&src=typed_query",
  "https://x.com/search?q=%23INDF%20lang%3Aid%20until%3A2024-12-31%20since%3A2024-01-01&src=typed_query&f=live"

  // Saham PANI

  // Saham ANTM

];

const SCRAPING_TIME = 3 * 60 * 60 * 1000; // 3 jam

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function safeGoto(page, url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
      return;
    } catch (err) {
      console.error(`❌ Gagal membuka ${url} (percobaan ${i + 1}):`, err.message);
      if (i === retries - 1) throw err;
      await delay(10000);
    }
  }
}

async function scrapeTweets() {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  // Bypass bot detection
  await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36");
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => false });
    Object.defineProperty(navigator, "languages", { get: () => ["id-ID", "id"] });
    Object.defineProperty(navigator, "plugins", { get: () => [1, 2, 3] });
  });

  const cookiesFile = "cookies_twitter.json";
  let loggedIn = false;

  if (fs.existsSync(cookiesFile)) {
    const cookies = JSON.parse(fs.readFileSync(cookiesFile, "utf-8"));
    await page.setCookie(...cookies);
    loggedIn = true;
  }

  try {
    await safeGoto(page, "https://x.com/login");

    if (!loggedIn) {
      console.log("🔐 Silakan login secara manual (35 detik)...");
      await delay(35000);
      const cookies = await page.cookies();
      fs.writeFileSync(cookiesFile, JSON.stringify(cookies, null, 2));
    }

    console.log("✅ Login berhasil, mulai scraping...");
    let tweets = new Set();

    if (fs.existsSync("tweets_bmri.json")) {
      const existing = JSON.parse(fs.readFileSync("tweets_bmri.json", "utf-8"));
      existing.forEach(t => tweets.add(JSON.stringify(t)));
    }

    const startTime = Date.now();

    for (const url of twitterURLs) {
      console.log(`🌐 Membuka URL: ${url}`);
      try {
        await safeGoto(page, url);

        let lastHeight = await page.evaluate(() => document.body.scrollHeight);
        let attempt = 0;

        while (Date.now() - startTime < SCRAPING_TIME) {
          const newTweets = await page.evaluate(() => {
            let data = [];
            document.querySelectorAll("article").forEach(tweet => {
              const content = tweet.querySelector("div[lang]")?.innerText || "No content";
              const dateEl = tweet.querySelector("time");
              const date = dateEl ? dateEl.getAttribute("datetime").split("T")[0] : null;
              if (date && content) data.push({ date, content });
            });
            return data;
          });

          newTweets.forEach(tweet => {
            if (!Array.from(tweets).some(t => JSON.parse(t).content === tweet.content)) {
              tweets.add(JSON.stringify(tweet));
            }
          });

          console.log(`📥 Jumlah tweet sementara: ${tweets.size}`);

          await page.evaluate(() => window.scrollBy({ top: window.innerHeight, behavior: "smooth" }));
          await delay(Math.floor(Math.random() * 3000) + 3000); // 3-6 detik

          let newHeight = await page.evaluate(() => document.body.scrollHeight);
          if (newHeight === lastHeight) {
            attempt++;
            if (attempt > 3) break;
          } else {
            attempt = 0;
            lastHeight = newHeight;
          }
        }
      } catch (err) {
        console.error(`⚠️ Error saat scraping URL: ${url}`, err.message);
      }
    }

    await browser.close();
    const tweetArray = Array.from(tweets).map(t => JSON.parse(t));
    fs.writeFileSync("tweets_bmri.json", JSON.stringify(tweetArray, null, 2));
    console.log(`✅ Selesai! Total tweet terkumpul: ${tweetArray.length}`);

  } catch (err) {
    console.error("🔥 Error fatal:", err);
    await browser.close();
  }
}

scrapeTweets();