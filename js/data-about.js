// URL ekspor CSV langsung dari Google Sheets (Sheet: Database, gid=1567798541)
const csvUrl = 'https://docs.google.com/spreadsheets/d/1g4GYx89S9pRe4214Z7DKAPoFP84fP4JyUjCzp-THIBM/export?format=csv&gid=1567798541';

// Helper penentu jalur relatif folder assets sesuai lokasi halaman
function getBasePath() {
    const path = window.location.pathname;
    if (path.includes('/personel/') || path.includes('/cuti/') || path.includes('/sertifikasi/')) {
        return '../assets/struktur-organisasi/';
    }
    return 'assets/struktur-organisasi/';
}

// Penanganan error bertingkat jika foto tidak ditemukan
window.handleAvatarLoadError = function(img, nama, cleanNipp) {
    const base = getBasePath();
    const nippBersih = String(cleanNipp).replace(/\D/g, '').trim();

    if (!img.dataset.caseAttempt) {
        img.dataset.caseAttempt = 'upper';
        img.src = `${base}${nippBersih}.PNG`;
    } else if (img.dataset.caseAttempt === 'upper') {
        img.dataset.caseAttempt = 'jpg';
        img.src = `${base}${nippBersih}.jpg`;
    } else if (img.dataset.caseAttempt === 'jpg') {
        img.dataset.caseAttempt = 'done';
        img.src = `${base}default.jpg`;
    }
};

// Fungsi pembuat elemen tag <img> dengan pembersihan NIPP menyeluruh
function renderAvatar(nama, nipp, extraClass = '') {
    const cleanNipp = nipp ? String(nipp).replace(/\D/g, '').trim() : '00000';
    const safeNama = (nama || '').replace(/"/g, '&quot;');
    const basePath = getBasePath();

    return `
        <div class="so-avatar-wrapper" data-nama="${safeNama}" data-nipp="${cleanNipp}">
            <img src="${basePath}${cleanNipp}.png" 
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

            // Parser CSV Regex agar koma di dalam teks ("Tempat, Tanggal Lahir") tidak memecah kolom
            const columns = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);

            if (columns.length >= 5) {
                const nama = columns[1] ? columns[1].replace(/"/g, '').trim() : '';
                const nipp = columns[2] ? columns[2].replace(/"/g, '').trim() : '';
                const jabatan = columns[4] ? columns[4].replace(/"/g, '').trim().toUpperCase() : ''; // Kolom E (Jabatan)
                const binaan = columns[7] ? columns[7].replace(/"/g, '').trim().toUpperCase() : '';   // Kolom H (Binaan)

                const nippClean = nipp.replace(/\D/g, '');

                if (nippClean !== '' && nippClean.length >= 4) {
                    total++;
                    if (jabatan.includes("KUPT")) {
                        kuptCount++;
                        if (kuptCardEl) {
                            kuptCardEl.innerHTML = `
                                ${renderAvatar(nama, nippClean)}
                                <div class="so-role">KUPT CREW KA KELAS C KISARAN</div>
                                <div class="so-name" id="so-kupt-name">${nama}</div>
                                <div class="so-nipp" id="so-kupt-nipp">NIPP. ${nippClean}</div>
                            `;
                        } else {
                            if (kuptNameEl) kuptNameEl.textContent = nama;
                            if (kuptNippEl) kuptNippEl.textContent = `NIPP. ${nippClean}`;
                        }
                    } else if (jabatan.includes("INSTRUKTUR")) {
                        instrukturCount++;
                        listInstruktur.push({ nama, nipp: nippClean, jabatan });
                    } else if (jabatan.includes("PENYELIA") && !jabatan.includes("INSTRUKTUR")) {
                        penyeliaCount++;
                        listPenyelia.push({ nama, nipp: nippClean, jabatan });
                    } else if (jabatan.includes("MASINIS") || jabatan.includes("ASP")) {
                        if (jabatan.includes("MADYA")) madya++;
                        else if (jabatan.includes("MUDA")) muda++;
                        else if (jabatan.includes("PERTAMA")) pertama++;
                        
                        listMasinis.push({ nama, nipp: nippClean, jabatan, binaan });
                    }
                }
            }
        }

        // 1. Render Penyelia Dinas
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

        // 2. Render Kolom Instruktur dan Binaan
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

        // Update Elemen Statistik
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

