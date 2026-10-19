// URL ekspor CSV langsung dari Google Sheets (Sheet: Jabatan, gid=1567798541)
const csvUrl = 'https://docs.google.com/spreadsheets/d/1g4GYx89S9pRe4214Z7DKAPoFP84fP4JyUjCzp-THIBM/export?format=csv&gid=1567798541';

async function loadAndRenderSpreadsheetData() {
    try {
        const response = await fetch(csvUrl);
        const csvData = await response.text();
        const lines = csvData.split('\n');

        let total = 0, kuptCount = 0, instrukturCount = 0, penyeliaCount = 0;
        let madya = 0, muda = 0, pertama = 0;

        const kuptNameEl = document.getElementById("so-kupt-name");
        const kuptNippEl = document.getElementById("so-kupt-nipp");
        const instrukturWrapper = document.getElementById("so-instruktur-wrapper");
        const penyeliaWrapper = document.getElementById("so-penyelia-wrapper");

        if (instrukturWrapper) instrukturWrapper.innerHTML = "";
        if (penyeliaWrapper) penyeliaWrapper.innerHTML = "";

        const listInstruktur = [];
        const listPenyelia = [];
        const listMasinis = [];

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            const columns = line.split(',');

            if (columns.length >= 4) {
                const nama = columns[1].replace(/"/g, '').trim();
                const nipp = columns[2].replace(/"/g, '').trim();
                const jabatan = columns[3].replace(/"/g, '').trim().toUpperCase();
                
                // Mengambil nilai Kolom Binaan (Kolom ke-5 / indeks 4 jika ada di spreadsheet)
                const binaan = columns[4] ? columns[4].replace(/"/g, '').trim().toUpperCase() : '';

                if (jabatan !== '') {
                    total++;
                    if (jabatan.includes("KUPT")) {
                        kuptCount++;
                        if (kuptNameEl) kuptNameEl.textContent = nama;
                        if (kuptNippEl) kuptNippEl.textContent = `NIPP. ${nipp}`;
                    } else if (jabatan.includes("INSTRUKTUR")) {
                        instrukturCount++;
                        listInstruktur.push({ nama, nipp, jabatan });
                    } else if (jabatan.includes("PENYELIA") && !jabatan.includes("INSTRUKTUR")) {
                        penyeliaCount++;
                        listPenyelia.push({ nama, nipp, jabatan });
                    } else if (jabatan.includes("MASINIS") || jabatan.includes("ASP")) {
                        if (jabatan.includes("MADYA")) madya++;
                        else if (jabatan.includes("MUDA")) muda++;
                        else if (jabatan.includes("PERTAMA")) pertama++;
                        
                        listMasinis.push({ nama, nipp, jabatan, binaan });
                    }
                }
            }
        }

        // 1. Render Penyelia Dinas (Kanan)
        if (penyeliaWrapper) {
            listPenyelia.forEach(p => {
                penyeliaWrapper.innerHTML += `
                    <div class="so-node-card card-penyelia-node">
                        <div class="so-role">PENYELIA DINAS</div>
                        <div class="so-name">${p.nama}</div>
                        <div class="so-nipp">NIPP. ${p.nipp}</div>
                    </div>
                `;
            });
        }

        // 2. Render Kolom Instruktur & Pembagian Masinis Berdasarkan Kolom Binaan
        if (instrukturWrapper && listInstruktur.length > 0) {
            // Buat kontainer/kolom untuk setiap Instruktur
            listInstruktur.forEach((ins, index) => {
                // Buat ID aman berbasis nama instruktur (misal: "grid-alwi-ratomi")
                const safeNameId = ins.nama.toLowerCase().replace(/[^a-z0-0]/g, '-');
                const colId = `grid-binaan-${safeNameId}`;

                instrukturWrapper.innerHTML += `
                    <div class="so-instruktur-column">
                        <div class="so-node-card card-instruktur-node">
                            <div class="so-role">PENYELIA INSTRUKTUR</div>
                            <div class="so-name">${ins.nama}</div>
                            <div class="so-nipp">NIPP. ${ins.nipp}</div>
                        </div>
                        <div class="line-v-center" style="height: 12px;"></div>
                        <div class="so-asp-grid" id="${colId}"></div>
                    </div>
                `;
            });

            // Masukkan kartu Masinis ke kolom Instruktur yang sesuai dengan kolom 'Binaan'
            listMasinis.forEach((m) => {
                let targetGrid = null;

                // Cari kontainer yang namanya cocok dengan nilai di kolom Binaan
                if (m.binaan) {
                    listInstruktur.forEach((ins) => {
                        if (ins.nama.toUpperCase().includes(m.binaan) || m.binaan.includes(ins.nama.toUpperCase())) {
                            const safeNameId = ins.nama.toLowerCase().replace(/[^a-z0-0]/g, '-');
                            targetGrid = document.getElementById(`grid-binaan-${safeNameId}`);
                        }
                    });
                }

                // Jika kolom binaan kosong atau tidak cocok, masukkan ke Instruktur pertama sebagai fallback
                if (!targetGrid) {
                    const defaultSafeNameId = listInstruktur[0].nama.toLowerCase().replace(/[^a-z0-0]/g, '-');
                    targetGrid = document.getElementById(`grid-binaan-${defaultSafeNameId}`);
                }

                if (targetGrid) {
                    targetGrid.innerHTML += `
                        <div class="card-asp">
                            <div class="so-role">${m.jabatan}</div>
                            <div class="so-name">${m.nama}</div>
                            <div class="so-nipp">NIPP. ${m.nipp}</div>
                        </div>
                    `;
                }
            });
        }

        // Update Statistik jika elemen tersedia
        if (document.getElementById("stat-total")) document.getElementById("stat-total").textContent = total;
        if (document.getElementById("stat-kupt")) document.getElementById("stat-kupt").textContent = kuptCount;
        if (document.getElementById("stat-instruktur")) document.getElementById("stat-instruktur").textContent = instrukturCount;
        if (document.getElementById("stat-penyelia")) document.getElementById("stat-penyelia").textContent = penyeliaCount;
        if (document.getElementById("stat-madya")) document.getElementById("stat-madya").textContent = madya;
        if (document.getElementById("stat-muda")) document.getElementById("stat-muda").textContent = muda;
        if (document.getElementById("stat-pertama")) document.getElementById("stat-pertama").textContent = pertama;

    } catch (error) {
        console.error('Gagal memuat data dari Spreadsheet Google:', error);
    }
}

document.addEventListener("DOMContentLoaded", loadAndRenderSpreadsheetData);
