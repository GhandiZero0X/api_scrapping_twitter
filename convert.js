const fs = require("fs");
const { parse } = require("json2csv");

const inputFile = "tweets_bmri_convert.json";
const outputFile = "tweets_bmri.csv";

// Baca file JSON
let jsonData = JSON.parse(fs.readFileSync(inputFile, "utf-8"));

// Urutkan berdasarkan tanggal (ascending)
jsonData.sort((a, b) => new Date(a.date) - new Date(b.date));

// Tentukan kolom yang akan diekspor
const fields = ["date", "content", "sentiment"];
const opts = { fields };

// Konversi dan simpan ke file CSV
try {
  const csv = parse(jsonData, opts);
  fs.writeFileSync(outputFile, csv, "utf-8");
  console.log(`✅ Data berhasil dikonversi dan diurutkan ke ${outputFile}`);
} catch (err) {
  console.error("❌ Gagal mengonversi ke CSV:", err);
}
