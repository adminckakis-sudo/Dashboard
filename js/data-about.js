// URL ekspor CSV dengan ID Sheet (gid=1567798541)
const csvUrl = 'https://docs.google.com/spreadsheets/d/1g4GYx89S9pRe4214Z7DKAPoFP84fP4JyUjCzp-THIBM/export?format=csv&gid=1567798541';

async function loadAndCalculateStats() {
    try {
        const response = await fetch(csvUrl);
        const csvData = await response.text();
        
        const lines = csvData.split('\n');

        let total = 0;
        let kupt = 0;
        let instruktur = 0;
        let penyelia = 0;
        let madya = 0;
        let muda = 0;
        let pertama = 0;

        // Iterasi dari baris ke-1 (melewati header NO, NAMA, NIPP, Jabatan)
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const columns = line.split(',');

            if (columns.length >= 4) {
                const jabatan = columns[3].replace(/"/g, '').trim().toUpperCase();

                if (jabatan !== '') {
                    total++; // Menghitung total personel aktif

                    if (jabatan.includes("KUPT")) {
                        kupt++;
                    } else if (jabatan === "PENYELIA INSTRUKTUR") {
                        instruktur++;
                    } else if (jabatan === "PENYELIA DINAS") {
                        penyelia++;
                    } else if (jabatan === "MASINIS MADYA") {
                        madya++;
                    } else if (jabatan === "MASINIS MUDA") {
                        muda++;
                    } else if (jabatan === "MASINIS PERTAMA") {
                        pertama++;
                    }
                }
            }
        }

        // Memasukkan hasil ke HTML berdasarkan ID
        if (document.getElementById("stat-total")) document.getElementById("stat-total").textContent = total;
        if (document.getElementById("stat-kupt")) document.getElementById("stat-kupt").textContent = kupt;
        if (document.getElementById("stat-instruktur")) document.getElementById("stat-instruktur").textContent = instruktur;
        if (document.getElementById("stat-penyelia")) document.getElementById("stat-penyelia").textContent = penyelia;
        if (document.getElementById("stat-madya")) document.getElementById("stat-madya").textContent = madya;
        if (document.getElementById("stat-muda")) document.getElementById("stat-muda").textContent = muda;
        if (document.getElementById("stat-pertama")) document.getElementById("stat-pertama").textContent = pertama;

    } catch (error) {
        console.error('Gagal memproses data dari Google Sheets:', error);
    }
}

document.addEventListener("DOMContentLoaded", loadAndCalculateStats);
