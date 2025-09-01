import fs from "fs";

// Nama file sumber dan file tujuan
const inputFileName = "tweets_bmri.json";
const outputFileName = "tweets_bmri_label.json";

// Cek apakah file input ada
if (!fs.existsSync(inputFileName)) {
  console.error(`❌ File ${inputFileName} tidak ditemukan.`);
  process.exit(1);
}

// Baca data JSON dari file input
let data = JSON.parse(fs.readFileSync(inputFileName, "utf-8"));

// Tambahkan kolom sentiment jika belum ada
data = data.map(tweet => {
  if (!tweet.hasOwnProperty("sentiment")) {
    return { ...tweet, sentiment: "" }; // default kosong
  }
  return tweet;
});

// Simpan hasil ke file output
fs.writeFileSync(outputFileName, JSON.stringify(data, null, 2), "utf-8");

console.log(`✅ File baru dengan kolom 'sentiment' berhasil disimpan ke ${outputFileName}`);
