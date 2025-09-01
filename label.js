const fs = require('fs');

// Read the input file
const tweets = JSON.parse(fs.readFileSync("tweets_bmri_label.json", "utf-8"));

const positive_keywords = [
    "bullish", "naik", "cuan", "untung", "positif", "akumulasi beli", "target harga naik", "rebound",
    "support kuat", "breakout", "dividen", "bagus", "bertumbuh", "laba naik", "penguatan", "rekor",
    "optimal", "berhasil", "berkembang", "meningkat", "profit", "kinerja baik", "rekomendasi beli",
    "all time high", "auto reject atas", "ara", "prospek cerah", "bagger", "fundamental kuat",
    "saham pilihan", "saham unggulan", "saham bagus", "melesat", "melambung", "top gainers",
    "volume meningkat", "momen bagus", "golden cross", "momentum naik", "indikator bagus",
    "buyback", "harga menarik", "positif outlook", "bisa terbang", "sinyal beli", "pemulihan", "oversold", 
    "peningkatan permintaan", "likuiditas tinggi",     "rights issue positif", "upgrade rekomendasi", 
    "kinerja ekspor", "pengumuman positif",     "merger akuisisi", "pemulihan ekonomi", "harga terkoreksi", 
    "beli di dip", "cuci gudang", "ipo sukses", "fundamental sehat", "rasio undervalue"
];

const negative_keywords = [
    "bearish", "turun", "rugi", "negatif", "distribusi jual", "target harga turun", "breakdown",
    "resisten gagal", "koreksi", "drop", "tergerus", "jelek", "bermasalah", "turunnya laba",
    "kinerja buruk", "pengurangan", "menurun", "masalah", "net sell",
    "auto reject bawah", "arb", "cut loss", "saham gorengan", "saham jelek", "nyangkut",
    "volume turun", "profit warning", "divestasi", "sentimen buruk", "panic sell", "overbought",
    "sinyal jual", "indikator jelek", "dihentikan sementara", "laporan keuangan jelek",
    "saham sampah", "trading halt", "krisis", "jual rugi", "harga longsor", "top losers",
    "kebangkrutan", "suspensi", "penipuan", "penurunan permintaan", "likuiditas rendah", 
    "downgrade rekomendasi", "utang menumpuk", "rugi operasional", "pembatalan dividen", 
    "penundaan proyek", "sanksi regulasi", "kecurangan akuntansi", "penjualan insider", 
    "gejolak pasar", "inflasi tinggi", "suku bunga naik", "macet", "dilusi saham", 
    "gelembung pecah", "rasio overvalue"
];


function classify_sentiment(text) {
    const text_lower = text.toLowerCase();
    if (positive_keywords.some(word => text_lower.includes(word))) {
        return 1;
    } else if (negative_keywords.some(word => text_lower.includes(word))) {
        return -1;
    } else {
        return 0;
    }
}

// Classify sentiment for each tweet
tweets.forEach(tweet => {
    tweet["sentiment"] = classify_sentiment(tweet["content"]);
});

// Write to output file
const output_file = "tweets_bmri_convert.json";
fs.writeFileSync(output_file, JSON.stringify(tweets, null, 2), "utf-8");

console.log(output_file);
