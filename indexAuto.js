const puppeteer = require("puppeteer");
const Sentiment = require("sentiment");
const fs = require("fs");

const TWITTER_USERNAME = "kaidenDestroy";  // Ganti dengan username X (Twitter) kamu
const TWITTER_PASSWORD = "gandiganteng123";  // Ganti dengan password X (Twitter) kamu

const sentiment = new Sentiment();
// bisa cari katakunci langsung di twitter pakek tools advance search
// https://twitter.com/search-advanced
const twitterURLs = [
  // Masukkan Kata Kunci yang Ingin Dicari dengan link search di X (Twitter)
  // "https://x.com/search?q=sahamBBCA&src=typed_query&f=top",
  // "https://x.com/search?q=sahamBBCA&src=typed_query&f=live",
  // "https://x.com/search?q=BBCA&src=typed_query&f=top",
  // "https://x.com/search?q=BBCA&src=typed_query&f=live",
  // "https://x.com/search?q=Bank%20Central%20Asia%20tbk&src=typed_query&f=live",
  // "https://x.com/search?q=Bank%20Central%20Asia%20tbk&src=typed_query",
  // "https://x.com/search?q=BBCA%20cuan&src=typed_query&f=top",
  // "https://x.com/search?q=BBCA%20cuan&src=typed_query&f=live",
  // "https://x.com/search?q=BBCA%20turun&src=typed_query&f=live",
  // "https://x.com/search?q=BBCA%20bearish&src=typed_query&f=live",
  // "https://x.com/search?q=BBCA%20untung&src=typed_query&f=live",
  // "https://x.com/search?q=BBCA%20untung&src=typed_query",
  // "https://x.com/search?q=BBCA%20bearish&src=typed_query&f=live",
  // "https://x.com/search?q=BBCA%20profit&src=typed_query&f=top",
  // "https://x.com/search?q=BBCA%20profit&src=typed_query&f=live",
  // "https://x.com/search?q=BBCA%20turun&src=typed_query",
  // "https://x.com/search?q=BBCA%20untung&src=typed_query",
];

const SCRAPING_TIME = 120 * 60 * 1000; // berjalan sealama 120 menit
const cookiesFile = "cookies_twitter.json";

async function loginTwitter(page) {
  console.log("🔍 Membuka halaman login Twitter...");
  await page.goto("https://x.com/login", { waitUntil: "networkidle2" });

  try {
    console.log("✍️ Memasukkan username...");
    await page.waitForSelector('input[name="text"]', { visible: true });
    await page.type('input[name="text"]', TWITTER_USERNAME, { delay: 100 });
    await page.keyboard.press("Enter");
    await page.waitForTimeout(3000); 

    console.log("✍️ Memasukkan password...");
    await page.waitForSelector('input[name="password"]', { visible: true });
    await page.type('input[name="password"]', TWITTER_PASSWORD, { delay: 100 });
    await page.keyboard.press("Enter");
    await page.waitForTimeout(5000); 

    console.log("✅ Login berhasil, menyimpan cookies...");
    const cookies = await page.cookies();
    fs.writeFileSync(cookiesFile, JSON.stringify(cookies, null, 2));

  } catch (error) {
    console.error("❌ Login gagal, cek kembali kredensial atau perubahan UI Twitter.");
    process.exit(1);
  }
}

async function scrapeTweets() {
  const browser = await puppeteer.launch({ headless: false, defaultViewport: null });
  const page = await browser.newPage();
  let loggedIn = false;

  if (fs.existsSync(cookiesFile)) {
    const cookies = JSON.parse(fs.readFileSync(cookiesFile, "utf-8"));
    await page.setCookie(...cookies);
    console.log("🍪 Cookie dimuat, langsung masuk tanpa login!");
    loggedIn = true;
  }

  if (!loggedIn) {
    await loginTwitter(page);
  }

  console.log("✅ Mulai scraping...");
  let tweets = new Set();
  let existingTweets = [];

  if (fs.existsSync("tweets.json")) {
    existingTweets = JSON.parse(fs.readFileSync("tweets.json", "utf-8"));
    existingTweets.forEach((tweet) => tweets.add(JSON.stringify(tweet)));
    console.log(`📂 Data lama dimuat, total sebelumnya: ${existingTweets.length} tweet`);
  }

  const startTime = Date.now();

  for (const url of twitterURLs) {
    console.log(`🌐 Scraping dari URL: ${url}`);
    await page.goto(url, { waitUntil: "networkidle2" });

    let lastHeight = await page.evaluate(() => document.body.scrollHeight);
    let attempt = 0;

    while (Date.now() - startTime < SCRAPING_TIME) {
      console.log(`📊 Total tweet terkumpul: ${tweets.size}`);

      const newTweets = await page.evaluate(() => {
        let tweetData = [];
        document.querySelectorAll("article").forEach((tweet) => {
          const username = tweet.querySelector('a[href*="/"]')?.innerText || "Unknown";
          const content = tweet.querySelector("div[lang]")?.innerText || "No content";
          const dateElement = tweet.querySelector("time");
          const date = dateElement ? dateElement.getAttribute("datetime") : null;
          const likes = tweet.querySelector('[data-testid="like"]')?.innerText || "0";
          const retweets = tweet.querySelector('[data-testid="retweet"]')?.innerText || "0";

          tweetData.push({
            date,
            username,
            content,
            likes: parseInt(likes.replace(/\D/g, "")) || 0,
            retweets: parseInt(retweets.replace(/\D/g, "")) || 0,
          });
        });
        return tweetData;
      });

      newTweets.forEach((tweet) => {
        if (!Array.from(tweets).some((t) => JSON.parse(t).content === tweet.content)) {
          tweet.sentiment = sentiment.analyze(tweet.content).score;
          tweets.add(JSON.stringify(tweet));
        }
      });

      await page.evaluate(() => window.scrollBy(0, window.innerHeight));
      await new Promise(resolve => setTimeout(resolve, 3000));

      let newHeight = await page.evaluate(() => document.body.scrollHeight);
      if (newHeight === lastHeight) {
        attempt++;
        if (attempt > 3) break;
      } else {
        attempt = 0;
      }
      lastHeight = newHeight;
    }
  }

  console.log(`✅ Scraping selesai! Total tweet sekarang: ${tweets.size}`);
  await browser.close();

  const tweetArray = Array.from(tweets).map((t) => JSON.parse(t));
  fs.writeFileSync("tweets.json", JSON.stringify(tweetArray, null, 2));
  console.log("📁 Data terbaru ditambahkan ke tweets.json");
}

scrapeTweets().catch(console.error);