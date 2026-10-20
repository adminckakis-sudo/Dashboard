// URL ekspor CSV langsung dari Google Sheets (Sheet: Jabatan, gid=1567798541)
const csvUrl = 'https://docs.google.com/spreadsheets/d/1g4GYx89S9pRe4214Z7DKAPoFP84fP4JyUjCzp-THIBM/export?format=csv&gid=1567798541';

// Helper penentu jalur relatif folder assets sesuai lokasi halaman
function getBasePath() {
    const path = window.location.pathname;
    // Jika halaman dibuka dari dalam subfolder (seperti /personel/ atau /cuti/)
    if (path.includes('/personel/') || path.includes('/cuti/')) {
        return '../assets/struktur-organisasi/';
    }
    // Jika dibuka dari root utama (index.html)
    return 'assets/struktur-organisasi/';
}

// Helper mengubah nama menjadi format nama_file (lowercase & underscore)
function formatFileName(nama) {
    if (!nama) return 'personel';
    return nama
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '_');
}

// Penanganan error bertingkat jika foto tidak ditemukan / case-sensitivity
window.handleAvatarLoadError = function(img, nama, cleanNipp) {
    const base = getBasePath();
    if (!img.dataset.caseAttempt) {
        img.dataset.caseAttempt = 'upper';
        // Coba ekstensi kapital .PNG (seperti pada 56853.PNG)
        img.src = `${base}${cleanNipp}.PNG`;
    } else if (img.dataset.caseAttempt === 'upper') {
        img.dataset.caseAttempt = 'done';
        img.src = `${base}default.jpg`;
    }
};

// Fungsi pembuat elemen tag <img> dengan pendeteksian nipp.png
function renderAvatar(nama, nipp, extraClass = '') {
    const cleanNipp = nipp ? String(nipp).trim() : '00000';
    const safeNama = (nama || '').replace(/"/g, '&quot;');
    const basePath = getBasePath();

    const primarySrc = `${basePath}${cleanNipp}.png`;

    return `
        <div class="so-avatar-wrapper" data-nama="${safeNama}" data-nipp="${cleanNipp}">
            <img src="${primarySrc}" 
                 alt="${safeNama}" 
                 class="so-avatar ${extraClass}"
                 onerror="handleAvatarLoadError(this, '${safeNama.replace(/'/g, "\\'")}', '${cleanNipp}')">
        </div>
    `;
}

async function loadAndRenderSpreadsheetData() {
    try {
        const response = await fetch(csvUrl);
        const csvData = await response.text();
        const lines = csvData.split('\n');

        let total = 0, kuptCount = 0, instrukturCount = 0, penyeliaCount = 0;
        let madya = 0, muda = 0, pertama = 0;

        const kuptCardEl = document.querySelector(".card-kupt-node");
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
                const binaan = columns[4] ? columns[4].replace(/"/g, '').trim().toUpperCase() : '';

                if (jabatan !== '') {
                    total++;
                    if (jabatan.includes("KUPT")) {
                        kuptCount++;
                        if (kuptCardEl) {
                            kuptCardEl.innerHTML = `
                                ${renderAvatar(nama, nipp)}
                                <div class="so-role">KUPT CREW KA KELAS C KISARAN</div>
                                <div class="so-name" id="so-kupt-name">${nama}</div>
                                <div class="so-nipp" id="so-kupt-nipp">NIPP. ${nipp}</div>
                            `;
                        } else {
                            if (kuptNameEl) kuptNameEl.textContent = nama;
                            if (kuptNippEl) kuptNippEl.textContent = `NIPP. ${nipp}`;
                        }
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
                        ${renderAvatar(p.nama, p.nipp)}
                        <div class="so-info">
                            <div class="so-role">PENYELIA DINAS</div>
                            <div class="so-name">${p.nama}</div>
                            <div class="so-nipp">NIPP. ${p.nipp}</div>
                        </div>
                    </div>
                `;
            });
        }

        // 2. Render Kolom Instruktur dengan PEMBUNGKUS BINAAN (binaan-container)
        if (instrukturWrapper && listInstruktur.length > 0) {
            listInstruktur.forEach((ins) => {
                const safeNameId = ins.nama.toLowerCase().replace(/[^a-z0-9]/g, '-');
                const colId = `grid-binaan-${safeNameId}`;

                instrukturWrapper.innerHTML += `
                    <div class="so-instruktur-column">
                        <div class="so-node-card card-instruktur-node">
                            ${renderAvatar(ins.nama, ins.nipp)}
                            <div class="so-info">
                                <div class="so-role">PENYELIA INSTRUKTUR</div>
                                <div class="so-name">${ins.nama}</div>
                                <div class="so-nipp">NIPP. ${ins.nipp}</div>
                            </div>
                        </div>

                        <div class="line-v-center" style="height: 16px;"></div>

                        <div class="binaan-container">
                            <div class="binaan-header">BINAAN</div>
                            <div class="so-asp-grid" id="${colId}"></div>
                        </div>
                    </div>
                `;
            });

            // Masukkan kartu Masinis ke dalam grid yang dibungkus kotak
            listMasinis.forEach((m) => {
                let targetGrid = null;

                if (m.binaan) {
                    listInstruktur.forEach((ins) => {
                        if (ins.nama.toUpperCase().includes(m.binaan) || m.binaan.includes(ins.nama.toUpperCase())) {
                            const safeNameId = ins.nama.toLowerCase().replace(/[^a-z0-9]/g, '-');
                            targetGrid = document.getElementById(`grid-binaan-${safeNameId}`);
                        }
                    });
                }

                if (!targetGrid) {
                    const defaultSafeNameId = listInstruktur[0].nama.toLowerCase().replace(/[^a-z0-9]/g, '-');
                    targetGrid = document.getElementById(`grid-binaan-${defaultSafeNameId}`);
                }

                if (targetGrid) {
                    targetGrid.innerHTML += `
                        <div class="card-asp">
                            ${renderAvatar(m.nama, m.nipp)}
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
