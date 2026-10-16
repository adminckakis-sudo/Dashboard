// ==========================================================================
// DASHBOARD REKAPITULASI UPT CREW KA KELAS C KISARAN
// Modul Logika Data & Interaktivitas Antarmuka
// ==========================================================================

// 1. JAM & TANGGAL REAL-TIME
function updateWaktu() {
    const sekarang = new Date();
    const namaHari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const namaBulan = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    const hari = namaHari[sekarang.getDay()];
    const tanggal = sekarang.getDate();
    const bulan = namaBulan[sekarang.getMonth()];
    const tahun = sekarang.getFullYear();

    const jam = String(sekarang.getHours()).padStart(2, '0');
    const menit = String(sekarang.getMinutes()).padStart(2, '0');
    const detik = String(sekarang.getSeconds()).padStart(2, '0');

    const elHari = document.getElementById('hari-ini');
    const elTanggal = document.getElementById('tanggal-ini');
    const elJam = document.getElementById('jam-ini');

    if (elHari) elHari.textContent = `${hari}, `;
    if (elTanggal) elTanggal.textContent = `${tanggal} ${bulan} ${tahun}`;
    if (elJam) elJam.textContent = `${jam}:${menit}:${detik} WIB`;
}

updateWaktu();
setInterval(updateWaktu, 1000);


// 2. KONFIGURASI SPREADSHEET & GID
const SPREADSHEET_ID = '1YtPTLxgEEJCjfzk-7zo4wIbkfPfj0w4z';
const SPREADSHEET_PEGAWAI_ID = '1g4GYx89S9pRe4214Z7DKAPoFP84fP4JyUjCzp-THIBM';
const GID_DATABASE_PEGAWAI = '0';

const GID_BULAN = {
    0: "1242932146",
    1: "1807944811",
    2: "1971502885",
    3: "1073914471",
    4: "1624305738",
    5: "1818192292",
    6: "1781048451",
    7: "226813322",
    8: "354712743",
    9: "641851831",
    10: "1976865235",
    11: "492242964"
};

const NAMA_BULAN_LENGKAP = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const NAMA_BULAN_PENDEK = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

let cacheDataPegawai = [];


// 3. INTEGRASI DATA DASHBOARD HARIAN (INDEX.HTML)
async function muatDataDashboard() {
    try {
        const bulanIndex = new Date().getMonth();
        const targetGid = GID_BULAN[bulanIndex] || "641851831";
        const tanggalHariIni = new Date().getDate();
        const namaBulanStr = NAMA_BULAN_LENGKAP[bulanIndex];

        const SHEET_CSV_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${targetGid}`;

        const response = await fetch(SHEET_CSV_URL);
        const dataText = await response.text();
        const barisData = dataText.split('\n');

        let totalAsp = 0;
        let madya = 0;
        let muda = 0;
        let pertama = 0;

        let listCutiHariIni = [];
        let listSakitHariIni = [];
        let listItmbHariIni = [];
        let listTmsHarian = [];
        let listMangkirHarian = [];

        cacheDataPegawai = [];
        let processedNipps = new Set();

        barisData.forEach(baris => {
            const kolom = baris.split(',').map(k => k.trim());

            if (kolom.length >= 4) {
                const nama = kolom[1] || '';
                const potensiNipp = kolom[2];
                const jabatan = kolom[3] ? kolom[3].toUpperCase() : '';
                const keteranganAsli = kolom[kolom.length - 1] && kolom[kolom.length - 1] !== '-' ? kolom[kolom.length - 1] : '';

                if (potensiNipp && !isNaN(potensiNipp) && potensiNipp.length >= 4 && !processedNipps.has(potensiNipp)) {
                    processedNipps.add(potensiNipp);

                    // Pengelompokan Tingkat Jabatan ASP
                    if (jabatan.includes('MADYA')) {
                        madya++;
                        totalAsp++;
                    } else if (jabatan.includes('MUDA')) {
                        muda++;
                        totalAsp++;
                    } else if (jabatan.includes('PERTAMA')) {
                        pertama++;
                        totalAsp++;
                    }

                    const dataPegawaiObj = {
                        nama,
                        nipp: potensiNipp,
                        jabatan,
                        keterangan: keteranganAsli,
                        rowData: kolom
                    };
                    cacheDataPegawai.push(dataPegawaiObj);

                    // Verifikasi Presensi Tanggal Hari Ini
                    const indeksKolomHariIni = 3 + tanggalHariIni;
                    if (kolom[indeksKolomHariIni]) {
                        const statusHariIni = kolom[indeksKolomHariIni].toUpperCase();

                        if (statusHariIni === 'CT') listCutiHariIni.push(dataPegawaiObj);
                        if (statusHariIni === 'CSK') listSakitHariIni.push(dataPegawaiObj);
                        if (statusHariIni === 'ITMB' || statusHariIni === 'SPKA' || statusHariIni === 'CP') listItmbHariIni.push(dataPegawaiObj);
                        if (statusHariIni === 'TMS') listTmsHarian.push(dataPegawaiObj);
                        if (statusHariIni === 'M') listMangkirHarian.push(dataPegawaiObj);
                    }
                }
            }
        });

        // Hitung Pegawai Hadir Hari Ini (tidak berhalangan)
        let listHadir = [];
        cacheDataPegawai.forEach(pegawai => {
            const isBerhalangan = [
                ...listCutiHariIni,
                ...listSakitHariIni,
                ...listItmbHariIni,
                ...listTmsHarian,
                ...listMangkirHarian
            ].some(p => p.nipp === pegawai.nipp);

            if (!isBerhalangan) {
                listHadir.push(pegawai);
            }
        });

        // Injeksi Nilai ke Elemen Dashboard
        const elValAsp = document.getElementById('val-asp');
        if (elValAsp) elValAsp.textContent = totalAsp;

        const elValMadya = document.getElementById('val-madya');
        if (elValMadya) elValMadya.textContent = madya;

        const elValMuda = document.getElementById('val-muda');
        if (elValMuda) elValMuda.textContent = muda;

        const elValPertama = document.getElementById('val-pertama');
        if (elValPertama) elValPertama.textContent = pertama;

        const elValCuti = document.getElementById('val-cuti');
        if (elValCuti) elValCuti.textContent = listCutiHariIni.length;

        const elValSakit = document.getElementById('val-sakit');
        if (elValSakit) elValSakit.textContent = listSakitHariIni.length;

        const elValItmb = document.getElementById('val-itmb');
        if (elValItmb) elValItmb.textContent = listItmbHariIni.length;

        const elValTms = document.getElementById('val-tms');
        if (elValTms) elValTms.textContent = listTmsHarian.length;

        const elValMangkir = document.getElementById('val-mangkir');
        if (elValMangkir) elValMangkir.textContent = listMangkirHarian.length;

        const elValHadir = document.getElementById('val-hadir');
        if (elValHadir) elValHadir.textContent = listHadir.length;

        // Hubungkan Trigger Pop-up Modal untuk Kartu
        setupModalTrigger('tabel-crew', 'Seluruh Personel ASP UPT Kisaran', cacheDataPegawai);
        setupModalTrigger('tabel-hadir', 'Daftar Pegawai Hadir Hari Ini', listHadir);
        setupModalTrigger('tabel-cuti', 'Daftar Pegawai Cuti Tahunan (CT) Hari Ini', listCutiHariIni);
        setupModalTrigger('tabel-sakit', 'Daftar Pegawai Sakit (CSK) Hari Ini', listSakitHariIni);
        setupModalTrigger('tabel-itmb', 'Daftar Pegawai Cuti Penting (ITMB/CP) Hari Ini', listItmbHariIni);
        setupModalTrigger('tabel-tms', 'Daftar Pegawai Tidak Memenuhi Syarat (TMS) Hari Ini', listTmsHarian);
        setupModalTrigger('tabel-mangkir', 'Daftar Pegawai Mangkir Hari Ini', listMangkirHarian);

        console.log(`Data operasional bulan ${namaBulanStr} berhasil sinkron.`);

    } catch (error) {
        console.error("Gagal sinkronisasi data dengan Google Spreadsheet:", error);
    }
}


// 4. REKAPITULASI LAPORAN PER BULAN (REKAP-BULANAN.HTML)
let cacheRekapBulanan = [];

async function muatRekapBulanan(bulanIdx) {
    const targetGid = GID_BULAN[bulanIdx];
    const namaBulanStr = NAMA_BULAN_LENGKAP[bulanIdx];

    const containerHasil = document.getElementById('hasil-rekap-bulanan');
    const tbodyRekap = document.getElementById('tabel-rekap-bulanan-body');
    const labelCount = document.getElementById('label-jumlah-rekap');

    if (containerHasil) containerHasil.style.display = 'block';
    if (tbodyRekap) {
        tbodyRekap.innerHTML = `<tr><td colspan="10" class="cell-center" style="padding: 24px; color: var(--text-muted);">Menghubungkan dan memuat rekapitulasi ${namaBulanStr}...</td></tr>`;
    }

    try {
        const SHEET_CSV_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${targetGid}`;
        const response = await fetch(SHEET_CSV_URL);
        const dataText = await response.text();
        const barisData = dataText.split('\n');

        cacheRekapBulanan = [];
        let processedNipps = new Set();

        let sumCuti = 0;
        let sumSakit = 0;
        let sumTms = 0;
        let sumMangkir = 0;
        let totalHariMasukSemua = 0;

        barisData.forEach(baris => {
            const kolom = baris.split(',').map(k => k.trim());
            if (kolom.length >= 4) {
                const nama = kolom[1] || '';
                const potensiNipp = kolom[2];
                const jabatan = kolom[3] ? kolom[3].toUpperCase() : '';

                if (potensiNipp && !isNaN(potensiNipp) && potensiNipp.length >= 4 && !processedNipps.has(potensiNipp)) {
                    processedNipps.add(potensiNipp);

                    let cutiPegawai = 0;
                    let sakitPegawai = 0;
                    let pentingPegawai = 0;
                    let tmsPegawai = 0;
                    let mangkirPegawai = 0;
                    let hadirPegawai = 0;

                    for (let i = 4; i <= 34; i++) {
                        if (kolom[i]) {
                            const val = kolom[i].toUpperCase();
                            if (val === 'CT') cutiPegawai++;
                            else if (val === 'CSK') sakitPegawai++;
                            else if (val === 'ITMB' || val === 'SPKA' || val === 'CP') pentingPegawai++;
                            else if (val === 'TMS') tmsPegawai++;
                            else if (val === 'M') mangkirPegawai++;
                            else if (val === 'H' || val === 'V' || val === 'OK') hadirPegawai++;
                        }
                    }

                    if (hadirPegawai === 0) {
                        hadirPegawai = Math.max(0, 30 - (cutiPegawai + sakitPegawai + pentingPegawai + tmsPegawai + mangkirPegawai));
                    }

                    sumCuti += cutiPegawai;
                    sumSakit += sakitPegawai;
                    sumTms += tmsPegawai;
                    sumMangkir += mangkirPegawai;
                    totalHariMasukSemua += hadirPegawai;

                    cacheRekapBulanan.push({
                        nama,
                        nipp: potensiNipp,
                        jabatan,
                        hadir: hadirPegawai,
                        cuti: cutiPegawai,
                        sakit: sakitPegawai,
                        penting: pentingPegawai,
                        tms: tmsPegawai,
                        mangkir: mangkirPegawai
                    });
                }
            }
        });

        const totalPegawai = cacheRekapBulanan.length;
        const elTotalPegawai = document.getElementById('sum-total-pegawai');
        const elTotalCuti = document.getElementById('sum-total-cuti');
        const elTotalSakit = document.getElementById('sum-total-sakit');

        if (elTotalPegawai) elTotalPegawai.textContent = totalPegawai;
        if (elTotalCuti) elTotalCuti.textContent = sumCuti;
        if (elTotalSakit) elTotalSakit.textContent = sumSakit;

        const elSumTms = document.getElementById('sum-total-tms');
        if (elSumTms) elSumTms.textContent = sumTms;

        const elSumMangkir = document.getElementById('sum-total-mangkir');
        if (elSumMangkir) elSumMangkir.textContent = sumMangkir;

        const rataRataHadir = totalPegawai > 0 ? ((totalHariMasukSemua / (totalPegawai * 25)) * 100).toFixed(1) : 0;
        const elRataHadir = document.getElementById('sum-rata-hadir');
        if (elRataHadir) elRataHadir.textContent = `${rataRataHadir > 100 ? 100 : rataRataHadir}%`;

        if (labelCount) {
            labelCount.textContent = `Menampilkan ${totalPegawai} personel periode ${namaBulanStr}`;
        }

        renderTabelRekapBulanan(cacheRekapBulanan);

    } catch (error) {
        console.error("Gagal memuat rekap bulanan:", error);
        if (tbodyRekap) {
            tbodyRekap.innerHTML = `<tr><td colspan="10" class="cell-center" style="padding: 24px; color: var(--status-mangkir);">Gagal memuat berkas rekapitulasi bulan ${namaBulanStr}. Silakan periksa jaringan Anda.</td></tr>`;
        }
    }
}

function renderTabelRekapBulanan(dataList) {
    const tbodyRekap = document.getElementById('tabel-rekap-bulanan-body');
    if (!tbodyRekap) return;
    tbodyRekap.innerHTML = '';

    if (dataList.length === 0) {
        tbodyRekap.innerHTML = `<tr><td colspan="10" class="cell-center" style="padding: 24px; color: var(--text-muted);">Tidak ada personel yang cocok dengan pencarian.</td></tr>`;
        return;
    }

    dataList.forEach((pegawai, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="cell-center">${index + 1}</td>
            <td style="font-weight: 600; color: var(--text-primary);">${pegawai.nama}</td>
            <td class="cell-center" style="font-variant-numeric: tabular-nums;">${pegawai.nipp}</td>
            <td>${pegawai.jabatan}</td>
            <td class="cell-center val-nonzero-hadir">${pegawai.hadir}</td>
            <td class="cell-center">${pegawai.cuti}</td>
            <td class="cell-center">${pegawai.sakit}</td>
            <td class="cell-center">${pegawai.penting}</td>
            <td class="cell-center ${pegawai.tms > 0 ? 'val-nonzero-tms' : ''}">${pegawai.tms}</td>
            <td class="cell-center ${pegawai.mangkir > 0 ? 'val-nonzero-mangkir' : ''}">${pegawai.mangkir}</td>
        `;
        tbodyRekap.appendChild(row);
    });
}

// Event Listener Tombol Tampilkan Bulan
const btnTampilkanBulan = document.getElementById('btn-tampilkan-bulan');
if (btnTampilkanBulan) {
    btnTampilkanBulan.addEventListener('click', function() {
        const selectBulan = document.getElementById('select-pilih-bulan');
        if (selectBulan) {
            muatRekapBulanan(parseInt(selectBulan.value, 10));
        }
    });
}

// Event Listener Pencarian pada Tabel Bulanan
const inputCariBulan = document.getElementById('input-cari-bulan');
if (inputCariBulan) {
    inputCariBulan.addEventListener('input', function(e) {
        const keyword = e.target.value.toLowerCase().trim();
        const filtered = cacheRekapBulanan.filter(p =>
            p.nama.toLowerCase().includes(keyword) || p.nipp.toLowerCase().includes(keyword)
        );
        renderTabelRekapBulanan(filtered);

        const labelCount = document.getElementById('label-jumlah-rekap');
        if (labelCount) {
            labelCount.textContent = `Menampilkan ${filtered.length} dari ${cacheRekapBulanan.length} personel`;
        }
    });
}

// Event Listener Ekspor CSV Rekapitulasi Bulanan
// Event Listener Unduh PDF Rekapitulasi Bulanan (Membuka Situs/Tab Baru)
const btnEksporPdf = document.getElementById('btn-ekspor-pdf');
if (btnEksporPdf) {
    btnEksporPdf.addEventListener('click', function(e) {
        if (cacheRekapBulanan.length === 0) {
            e.preventDefault();
            alert("Belum ada data rekapitulasi yang dimuat. Silakan klik 'Tampilkan Data' terlebih dahulu.");
            return;
        }

        const selectBulan = document.getElementById('select-pilih-bulan');
        const bulanIndex = selectBulan ? selectBulan.value : '0';
        const namaBulanStr = selectBulan ? selectBulan.selectedOptions[0].text : 'Bulan';

        // Mengarahkan ke halaman/situs pengaturan ekspor PDF baru dengan membawa parameter bulan
        // Anda bisa mengganti URL di bawah dengan halaman tujuan pengaturan PDF Anda (misal: cetak-pdf.html?bulan=...)
        this.href = `cetak-pdf.html?bulan=${bulanIndex}&nama_bulan=${encodeURIComponent(namaBulanStr)}`;
    });
}


// 5. MODAL POP-UP DETAIL (HARIAN & REKAM JEJAK)
let currentModalData = [];

function renderModalRows(dataList) {
    const modalTableBody = document.getElementById('modal-table-body');
    const modalCountInfo = document.getElementById('modal-count-info');
    if (!modalTableBody) return;
    modalTableBody.innerHTML = '';

    if (dataList.length === 0) {
        modalTableBody.innerHTML = `<tr><td colspan="5" class="cell-center" style="padding: 24px; color: var(--text-muted);">Tidak ada personel yang sesuai dalam kategori ini.</td></tr>`;
        if (modalCountInfo) modalCountInfo.textContent = '0 personel ditemukan';
        return;
    }

    dataList.forEach((pegawai, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="cell-center">${index + 1}</td>
            <td style="font-weight: 600; color: var(--text-primary);">${pegawai.nama}</td>
            <td class="cell-center" style="font-variant-numeric: tabular-nums;">${pegawai.nipp}</td>
            <td>${pegawai.jabatan}</td>
            <td>${pegawai.keterangan || '-'}</td>
        `;
        modalTableBody.appendChild(tr);
    });

    if (modalCountInfo) {
        modalCountInfo.textContent = `Menampilkan ${dataList.length} personel`;
    }
}

function setupModalTrigger(selectorId, judulModal, dataList) {
    const card = document.querySelector(`a[href="#${selectorId}"]`);
    const modal = document.getElementById('modal-detail');
    const modalTitle = document.getElementById('modal-title');
    const searchInput = document.getElementById('modal-search-input');

    if (card && modal) {
        card.addEventListener('click', function(e) {
            e.preventDefault();
            currentModalData = dataList || [];
            if (modalTitle) modalTitle.textContent = judulModal;

            if (searchInput) {
                searchInput.value = '';
            }

            const modalTableHead = document.querySelector('.modal-data-table thead');
            if (modalTableHead) {
                modalTableHead.innerHTML = `
                    <tr>
                        <th scope="col" class="cell-center">No</th>
                        <th scope="col">Nama</th>
                        <th scope="col" class="cell-center">NIPP</th>
                        <th scope="col">Jabatan</th>
                        <th scope="col">Keterangan</th>
                    </tr>
                `;
            }

            const modalSearchWrapper = document.querySelector('.modal-search-wrapper');
            if (modalSearchWrapper) {
                modalSearchWrapper.style.display = 'block';
            }

            renderModalRows(currentModalData);
            modal.style.display = 'flex';

            setTimeout(() => {
                if (searchInput) searchInput.focus();
            }, 100);
        });
    }
}

function closeModal() {
    const modal = document.getElementById('modal-detail');
    if (modal) modal.style.display = 'none';
}

const closeBtn = document.getElementById('modal-close');
if (closeBtn) closeBtn.addEventListener('click', closeModal);

const closeActionBtn = document.getElementById('modal-close-action');
if (closeActionBtn) closeActionBtn.addEventListener('click', closeModal);

window.addEventListener('click', function(event) {
    const modal = document.getElementById('modal-detail');
    if (event.target === modal) {
        closeModal();
    }
});

window.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeModal();
    }
});

const modalSearchInput = document.getElementById('modal-search-input');
if (modalSearchInput) {
    modalSearchInput.addEventListener('input', function(e) {
        const q = e.target.value.toLowerCase().trim();
        const filtered = currentModalData.filter(p =>
            p.nama.toLowerCase().includes(q) ||
            p.nipp.toLowerCase().includes(q) ||
            p.jabatan.toLowerCase().includes(q)
        );
        renderModalRows(filtered);
    });
}


// 6. FITUR PENCARIAN GLOBAL & REKAM JEJAK 1 TAHUN PENUH
async function ambilDataSeluruhTahun(targetNipp) {
    let rekamJejakTahun = {
        nama: '',
        nipp: targetNipp,
        jabatan: '',
        bulanData: []
    };

    // Eksekusi paralel 12 bulan dengan Promise.all agar respon cepat
    const fetchPromises = Object.keys(GID_BULAN).map(async (bulanIdxStr) => {
        const bulanIdx = parseInt(bulanIdxStr, 10);
        const gid = GID_BULAN[bulanIdx];
        if (!gid) return null;

        try {
            const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${gid}`;
            const res = await fetch(url);
            const text = await res.text();
            const rows = text.split('\n');

            for (let baris of rows) {
                const kolom = baris.split(',').map(k => k.trim());
                if (kolom.length >= 4) {
                    const nipp = kolom[2];
                    if (nipp === targetNipp) {
                        let cuti = 0, sakit = 0, penting = 0, tms = 0, mangkir = 0;

                        for (let i = 4; i <= 34; i++) {
                            if (kolom[i]) {
                                const val = kolom[i].toUpperCase();
                                if (val === 'CT') cuti++;
                                else if (val === 'CSK') sakit++;
                                else if (val === 'ITMB' || val === 'SPKA' || val === 'CP') penting++;
                                else if (val === 'TMS') tms++;
                                else if (val === 'M') mangkir++;
                            }
                        }

                        return {
                            bulanIdx,
                            bulan: NAMA_BULAN_LENGKAP[bulanIdx],
                            nama: kolom[1] || '',
                            jabatan: kolom[3] ? kolom[3].toUpperCase() : '',
                            cuti, sakit, penting, tms, mangkir
                        };
                    }
                }
            }
        } catch (err) {
            console.error(`Gagal memuat rekam jejak bulan index ${bulanIdx}:`, err);
        }
        return null;
    });

    const hasilList = await Promise.all(fetchPromises);
    hasilList.filter(Boolean).sort((a, b) => a.bulanIdx - b.bulanIdx).forEach(item => {
        if (!rekamJejakTahun.nama && item.nama) {
            rekamJejakTahun.nama = item.nama;
            rekamJejakTahun.jabatan = item.jabatan;
        }
        rekamJejakTahun.bulanData.push({
            bulan: item.bulan,
            cuti: item.cuti,
            sakit: item.sakit,
            penting: item.penting,
            tms: item.tms,
            mangkir: item.mangkir
        });
    });

    return rekamJejakTahun;
}

const globalSearchInput = document.getElementById('global-search-input');
const globalSearchResults = document.getElementById('global-search-results');

if (globalSearchInput && globalSearchResults) {
    globalSearchInput.addEventListener('input', function(e) {
        const keyword = e.target.value.toLowerCase().trim();

        if (keyword.length < 2) {
            globalSearchResults.style.display = 'none';
            globalSearchResults.innerHTML = '';
            return;
        }

        const matches = cacheDataPegawai.filter(p =>
            p.nama.toLowerCase().includes(keyword) || p.nipp.toLowerCase().includes(keyword)
        );

        if (matches.length === 0) {
            globalSearchResults.style.display = 'block';
            globalSearchResults.innerHTML = `<div class="search-dropdown-item"><span class="item-meta">Pegawai tidak ditemukan dalam data aktif</span></div>`;
            return;
        }

        globalSearchResults.style.display = 'block';
        globalSearchResults.innerHTML = matches.map(p => `
            <div class="search-dropdown-item" data-nipp="${p.nipp}">
                <span class="item-name">${p.nama}</span>
                <span class="item-meta">NIPP: ${p.nipp} | ${p.jabatan || 'ASP'}</span>
            </div>
        `).join('');
    });

    globalSearchResults.addEventListener('click', async function(e) {
        const item = e.target.closest('.search-dropdown-item');
        if (!item) return;

        const nipp = item.getAttribute('data-nipp');
        if (!nipp) return;

        globalSearchInput.value = '';
        globalSearchResults.style.display = 'none';

        const modal = document.getElementById('modal-detail');
        const modalTitle = document.getElementById('modal-title');
        const modalTableBody = document.getElementById('modal-table-body');
        const modalCountInfo = document.getElementById('modal-count-info');
        const modalSearchWrapper = document.querySelector('.modal-search-wrapper');

        if (modalTitle) modalTitle.textContent = `Rekam Jejak Kehadiran 1 Tahun`;
        if (modalSearchWrapper) modalSearchWrapper.style.display = 'none';
        if (modalTableBody) modalTableBody.innerHTML = `<tr><td colspan="6" class="cell-center" style="padding: 24px; color: var(--text-muted);">Memuat rekam jejak 1 tahun penuh...</td></tr>`;
        if (modal) modal.style.display = 'flex';

        const dataTahun = await ambilDataSeluruhTahun(nipp);

        if (modalTitle) modalTitle.textContent = `Rekam Jejak: ${dataTahun.nama || 'Pegawai'} (${dataTahun.nipp})`;

        if (dataTahun.bulanData.length === 0) {
            if (modalTableBody) modalTableBody.innerHTML = `<tr><td colspan="6" class="cell-center" style="padding: 24px; color: var(--text-muted);">Tidak ada data catatan ditemukan untuk NIPP ini.</td></tr>`;
            if (modalCountInfo) modalCountInfo.textContent = '0 bulan tercatat';
            return;
        }

        const modalTableHead = document.querySelector('.modal-data-table thead');
        if (modalTableHead) {
            modalTableHead.innerHTML = `
                <tr>
                    <th scope="col" class="cell-center">Bulan</th>
                    <th scope="col" class="cell-center">Cuti (CT)</th>
                    <th scope="col" class="cell-center">Sakit (CSK)</th>
                    <th scope="col" class="cell-center">Cuti Penting</th>
                    <th scope="col" class="cell-center col-tms">TMS</th>
                    <th scope="col" class="cell-center col-mangkir">Mangkir</th>
                </tr>
            `;
        }

        if (modalTableBody) {
            modalTableBody.innerHTML = dataTahun.bulanData.map(b => `
                <tr>
                    <td style="font-weight: 600; color: var(--text-primary);">${b.bulan}</td>
                    <td class="cell-center">${b.cuti}</td>
                    <td class="cell-center">${b.sakit}</td>
                    <td class="cell-center">${b.penting}</td>
                    <td class="cell-center ${b.tms > 0 ? 'val-nonzero-tms' : ''}">${b.tms}</td>
                    <td class="cell-center ${b.mangkir > 0 ? 'val-nonzero-mangkir' : ''}">${b.mangkir}</td>
                </tr>
            `).join('');
        }

        if (modalCountInfo) {
            modalCountInfo.textContent = `Menampilkan akumulasi catatan ${dataTahun.bulanData.length} bulan`;
        }
    });

    document.addEventListener('click', function(e) {
        if (!e.target.closest('.global-search-container')) {
            globalSearchResults.style.display = 'none';
        }
    });
}


// 7. STATISTIK TREN CUTI TAHUNAN (DIAGRAM GARIS SVG)
async function muatTrenCutiTahunan() {
    const svgChart = document.getElementById('tren-line-chart');
    if (!svgChart) return;

    const elTotalCutiTahun = document.getElementById('val-total-cuti-tahun');
    const elRataCutiBulan = document.getElementById('val-rata-cuti-bulan');
    const elPuncakCuti = document.getElementById('val-puncak-cuti');

    const fetchPromises = Object.keys(GID_BULAN).map(async (bulanIdxStr) => {
        const bulanIdx = parseInt(bulanIdxStr, 10);
        const gid = GID_BULAN[bulanIdx];
        let cutiBulanIni = 0;

        if (gid) {
            try {
                const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${gid}`;
                const res = await fetch(url);
                if (res.ok) {
                    const text = await res.text();
                    const rows = text.split('\n');
                    let processedNipps = new Set();

                    rows.forEach(baris => {
                        const kolom = baris.split(',').map(k => k.trim());
                        if (kolom.length >= 4) {
                            const potensiNipp = kolom[2];
                            if (potensiNipp && !isNaN(potensiNipp) && potensiNipp.length >= 4 && !processedNipps.has(potensiNipp)) {
                                processedNipps.add(potensiNipp);

                                for (let i = 4; i <= 34; i++) {
                                    if (kolom[i]) {
                                        const val = kolom[i].toUpperCase();
                                        if (val === 'CT') cutiBulanIni++;
                                    }
                                }
                            }
                        }
                    });
                }
            } catch (err) {
                console.warn(`Gagal memuat tren cuti bulan index ${bulanIdx}:`, err);
            }
        }

        return {
            index: bulanIdx,
            bulan: NAMA_BULAN_PENDEK[bulanIdx],
            namaLengkap: NAMA_BULAN_LENGKAP[bulanIdx],
            cuti: cutiBulanIni
        };
    });

    try {
        const dataPerBulanUnsorted = await Promise.all(fetchPromises);
        const dataPerBulan = dataPerBulanUnsorted.sort((a, b) => a.index - b.index);

        const totalKeseluruhanCuti = dataPerBulan.reduce((sum, item) => sum + item.cuti, 0);
        const maxCuti = Math.max(...dataPerBulan.map(d => d.cuti), 5);
        const rataRata = (totalKeseluruhanCuti / 12).toFixed(1);

        let bulanPuncak = dataPerBulan[0];
        dataPerBulan.forEach(d => {
            if (d.cuti > bulanPuncak.cuti) bulanPuncak = d;
        });

        if (elTotalCutiTahun) elTotalCutiTahun.textContent = totalKeseluruhanCuti;
        if (elRataCutiBulan) elRataCutiBulan.textContent = rataRata;
        if (elPuncakCuti) {
            elPuncakCuti.textContent = totalKeseluruhanCuti > 0 ? `${bulanPuncak.namaLengkap} (${bulanPuncak.cuti} Hari)` : 'Belum ada data';
        }

        const svgWidth = 840;
        const svgHeight = 260;
        const paddingTop = 35;
        const paddingBottom = 45;
        const paddingX = 50;
        const usableWidth = svgWidth - (paddingX * 2);
        const usableHeight = svgHeight - paddingTop - paddingBottom;

        const points = dataPerBulan.map((item, idx) => {
            const x = paddingX + (idx * (usableWidth / 11));
            const y = paddingTop + usableHeight - ((item.cuti / maxCuti) * usableHeight);
            return { x, y, ...item };
        });

        const pointsString = points.map(p => `${p.x},${p.y}`).join(' ');
        const firstX = points[0].x;
        const lastX = points[points.length - 1].x;
        const bottomY = paddingTop + usableHeight;
        const areaString = `${firstX},${bottomY} ${pointsString} ${lastX},${bottomY}`;

        let svgContent = `
            <line x1="${paddingX}" y1="${paddingTop}" x2="${svgWidth - paddingX}" y2="${paddingTop}" class="chart-grid-line" />
            <line x1="${paddingX}" y1="${paddingTop + (usableHeight / 2)}" x2="${svgWidth - paddingX}" y2="${paddingTop + (usableHeight / 2)}" class="chart-grid-line" />
            <line x1="${paddingX}" y1="${bottomY}" x2="${svgWidth - paddingX}" y2="${bottomY}" class="chart-grid-line" />

            <polygon points="${areaString}" class="chart-area" />
            <polyline points="${pointsString}" class="chart-line" />
        `;

        points.forEach(p => {
            svgContent += `
                <circle cx="${p.x}" cy="${p.y}" r="4.5" class="chart-dot">
                    <title>${p.namaLengkap}: ${p.cuti} hari cuti</title>
                </circle>
                <text x="${p.x}" y="${p.y - 12}" class="chart-text-value">${p.cuti}</text>
                <text x="${p.x}" y="${svgHeight - 15}" class="chart-text-month">${p.bulan}</text>
            `;
        });

        svgChart.innerHTML = svgContent;

    } catch (error) {
        console.error("Gagal merender diagram garis:", error);
    }
}


// 8. MODUL MONITORING SISA CUTI BERBASIS DATABASE PEGAWAI (SISA-CUTI.HTML)
function hitungMasaKerja(tanggalMulaiStr) {
    if (!tanggalMulaiStr) return 0;
    const parts = tanggalMulaiStr.trim().split('/');
    if (parts.length !== 3) return 0;

    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);

    const tglMulai = new Date(year, month, day);
    const sekarang = new Date();

    let selisihTahun = sekarang.getFullYear() - tglMulai.getFullYear();
    const m = sekarang.getMonth() - tglMulai.getMonth();
    if (m < 0 || (m === 0 && sekarang.getDate() < tglMulai.getDate())) {
        selisihTahun--;
    }
    return Math.max(0, selisihTahun);
}

function hitungHakCutiTahunan(masaKerja) {
    if (masaKerja <= 10) return 12;
    if (masaKerja <= 15) return 13;
    if (masaKerja <= 20) return 14;
    if (masaKerja <= 25) return 15;
    return 16;
}

async function muatDataSisaCuti() {
    const tbody = document.getElementById('tabel-sisa-cuti-body');
    const labelCount = document.getElementById('label-jumlah-cuti');
    if (!tbody) return;

    let petaPegawai = {};

    try {
        const urlDb = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_PEGAWAI_ID}/export?format=csv&gid=${GID_DATABASE_PEGAWAI}`;
        const resDb = await fetch(urlDb);
        if (!resDb.ok) throw new Error("Gagal mengambil berkas database pegawai.");

        const textDb = await resDb.text();
        const rowsDb = textDb.split('\n');

        rowsDb.forEach(baris => {
            const kolom = baris.split(',').map(k => k.trim());
            if (kolom.length >= 4) {
                const namaDb = kolom[1] || '';
                const nippDb = kolom[2];
                const mulaiBekerja = kolom[3] || '';

                if (nippDb && !isNaN(nippDb) && nippDb.length >= 4) {
                    const masaKerja = hitungMasaKerja(mulaiBekerja);
                    const hakCuti = hitungHakCutiTahunan(masaKerja);

                    petaPegawai[nippDb] = {
                        nama: namaDb,
                        nipp: nippDb,
                        mulaiBekerja,
                        masaKerja,
                        hakCuti,
                        riwayatCuti: []
                    };
                }
            }
        });

        // Eksekusi paralel 12 bulan untuk mengakumulasi cuti
        const fetchPromises = Object.keys(GID_BULAN).map(async (bulanIdxStr) => {
            const bulanIdx = parseInt(bulanIdxStr, 10);
            const gid = GID_BULAN[bulanIdx];
            if (!gid) return;

            try {
                const urlCuti = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${gid}`;
                const resCuti = await fetch(urlCuti);
                if (!resCuti.ok) return;
                const textCuti = await resCuti.text();
                const rowsCuti = textCuti.split('\n');

                rowsCuti.forEach(barisCuti => {
                    const kolomCuti = barisCuti.split(',').map(k => k.trim());
                    if (kolomCuti.length >= 4) {
                        const nippCuti = kolomCuti[2];
                        const namaCuti = kolomCuti[1] || '';

                        if (nippCuti && petaPegawai[nippCuti]) {
                            if (namaCuti && petaPegawai[nippCuti].nama !== namaCuti) {
                                petaPegawai[nippCuti].nama = namaCuti;
                            }

                            for (let i = 4; i <= 34; i++) {
                                if (kolomCuti[i]) {
                                    const val = kolomCuti[i].toUpperCase();
                                    if (val === 'CT') {
                                        petaPegawai[nippCuti].riwayatCuti.push(`${i - 3} ${NAMA_BULAN_PENDEK[bulanIdx]}`);
                                    }
                                }
                            }
                        }
                    }
                });
            } catch (err) {
                console.warn(`Gagal memuat rekap cuti bulan index ${bulanIdx}:`, err);
            }
        });

        await Promise.all(fetchPromises);

        let dataFinal = Object.values(petaPegawai).map(pegawai => {
            const cutiTerpakai = pegawai.riwayatCuti.length;
            const sisaCuti = Math.max(0, pegawai.hakCuti - cutiTerpakai);
            return {
                ...pegawai,
                cutiTerpakai,
                sisaCuti,
                riwayatStr: pegawai.riwayatCuti.length > 0 ? pegawai.riwayatCuti.join(', ') : '-'
            };
        });

        window.cacheSisaCuti = dataFinal;
        renderTabelSisaCuti(dataFinal);
        if (labelCount) labelCount.textContent = `Menampilkan ${dataFinal.length} personel`;

    } catch (error) {
        console.error("Gagal memproses data sisa cuti:", error);
        tbody.innerHTML = `<tr><td colspan="9" class="cell-center" style="padding: 30px; color: var(--status-mangkir);">Gagal memuat database pegawai. Periksa kembali ID Spreadsheet dan GID database Anda.</td></tr>`;
    }
}

function renderTabelSisaCuti(dataList) {
    const tbody = document.getElementById('tabel-sisa-cuti-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (dataList.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" class="cell-center" style="padding: 30px; color: var(--text-muted);">Tidak ada data pegawai ditemukan.</td></tr>`;
        return;
    }

    dataList.forEach((p, idx) => {
        let warnaSisa = 'var(--status-hadir)';
        let bgSisa = 'var(--status-hadir-bg)';

        if (p.sisaCuti === 0) {
            warnaSisa = 'var(--status-mangkir)';
            bgSisa = 'var(--status-mangkir-bg)';
        } else if (p.sisaCuti >= 1 && p.sisaCuti <= 5) {
            warnaSisa = 'var(--status-sakit)';
            bgSisa = 'var(--status-sakit-bg)';
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="cell-center">${idx + 1}</td>
            <td style="font-weight: 600; color: var(--text-primary);">${p.nama}</td>
            <td class="cell-center" style="font-variant-numeric: tabular-nums;">${p.nipp}</td>
            <td class="cell-center" style="font-weight: 700;">${p.hakCuti} Hari</td>
            <td class="cell-center" style="color: var(--status-cuti); font-weight: 700;">${p.cutiTerpakai} Hari</td>
            <td class="cell-center">
                <span style="display: inline-block; padding: 3px 10px; border-radius: var(--radius-sm); font-weight: 800; color: ${warnaSisa}; background-color: ${bgSisa};">
                    ${p.sisaCuti} Hari
                </span>
            </td>
            <td style="font-size: 0.8rem; color: var(--text-muted); max-width: 320px; white-space: normal;">${p.riwayatStr}</td>
        `;
        tbody.appendChild(tr);
    });
}

// Pencarian Real-time pada Halaman Sisa Cuti
const inputCariSisaCuti = document.getElementById('input-cari-sisa-cuti');
if (inputCariSisaCuti) {
    inputCariSisaCuti.addEventListener('input', function(e) {
        const keyword = e.target.value.toLowerCase().trim();
        const filtered = (window.cacheSisaCuti || []).filter(p =>
            p.nama.toLowerCase().includes(keyword) || p.nipp.toLowerCase().includes(keyword)
        );
        renderTabelSisaCuti(filtered);
        const labelCount = document.getElementById('label-jumlah-cuti');
        if (labelCount) {
            labelCount.textContent = `Menampilkan ${filtered.length} dari ${(window.cacheSisaCuti || []).length} personel`;
        }
    });
}

// Ekspor CSV Sisa Cuti Pegawai
const btnEksporSisaCuti = document.getElementById('btn-ekspor-sisa-cuti');
if (btnEksporSisaCuti) {
    btnEksporSisaCuti.addEventListener('click', function() {
        const dataList = window.cacheSisaCuti || [];
        if (dataList.length === 0) {
            alert("Belum ada data sisa cuti yang selesai dimuat.");
            return;
        }

        let csvContent = "data:text/csv;charset=utf-8,No,Nama Pegawai,NIPP,Mulai Bekerja,Masa Kerja (Tahun),Hak Cuti (Hari),Cuti Terpakai (Hari),Sisa Cuti (Hari),Detail Pengambilan Cuti\r\n";

        dataList.forEach((p, idx) => {
            let row = [
                idx + 1,
                `"${p.nama}"`,
                `"${p.nipp}"`,
                `"${p.mulaiBekerja || '-'}"`,
                p.masaKerja,
                p.hakCuti,
                p.cutiTerpakai,
                p.sisaCuti,
                `"${p.riwayatStr}"`
            ];
            csvContent += row.join(",") + "\r\n";
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Monitoring_Sisa_Cuti_UPT_Kisaran_${new Date().getFullYear()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
}


// 9. INISIALISASI OTOMATIS SAAT HALAMAN DIMUAT (ROUTER SEDERHANA)
window.addEventListener('DOMContentLoaded', () => {
    // 1. Inisialisasi Dashboard Utama (index.html)
    if (document.getElementById('val-asp')) {
        muatDataDashboard();
    }
    if (document.getElementById('tren-line-chart')) {
        muatTrenCutiTahunan();
    }

    // 2. Inisialisasi Halaman Rekapitulasi Bulanan (rekap-bulanan.html)
    const selectBulan = document.getElementById('select-pilih-bulan');
    if (selectBulan && document.getElementById('tabel-rekap-bulanan')) {
        const bulanSekarang = new Date().getMonth();
        selectBulan.value = bulanSekarang;
        muatRekapBulanan(bulanSekarang);
    }

    // 3. Inisialisasi Halaman Monitoring Sisa Cuti (sisa-cuti.html)
    if (document.getElementById('tabel-sisa-cuti')) {
        muatDataSisaCuti();
    }
});

// ==========================================================================
// 10. INTEGRASI KHUSUS HALAMAN CETAK PDF (CETAK-PDF.HTML)
// ==========================================================================
async function muatDataCetakPDF(bulanIdx) {
    const tbodyCetak = document.getElementById('tabel-cetak-body');
    if (!tbodyCetak) return;

    const targetGid = GID_BULAN[bulanIdx] || "641851831";
    const SHEET_CSV_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${targetGid}`;

    try {
        const response = await fetch(SHEET_CSV_URL);
        const dataText = await response.text();
        const barisData = dataText.split('\n');

        let dataCetakList = [];
        let processedNipps = new Set();

        barisData.forEach(baris => {
            const kolom = baris.split(',').map(k => k.trim());
            if (kolom.length >= 4) {
                const nama = kolom[1] || '';
                const potensiNipp = kolom[2];
                const jabatan = kolom[3] ? kolom[3].toUpperCase() : '';

                if (potensiNipp && !isNaN(potensiNipp) && potensiNipp.length >= 4 && !processedNipps.has(potensiNipp)) {
                    processedNipps.add(potensiNipp);

                    let cuti = 0, sakit = 0, penting = 0, tms = 0, mangkir = 0, hadir = 0;

                    for (let i = 4; i <= 34; i++) {
                        if (kolom[i]) {
                            const val = kolom[i].toUpperCase();
                            if (val === 'CT') cuti++;
                            else if (val === 'CSK') sakit++;
                            else if (val === 'ITMB' || val === 'SPKA' || val === 'CP') penting++;
                            else if (val === 'TMS') tms++;
                            else if (val === 'M') mangkir++;
                            else if (val === 'H' || val === 'V' || val === 'OK') hadir++;
                        }
                    }

                    if (hadir === 0) {
                        hadir = Math.max(0, 30 - (cuti + sakit + penting + tms + mangkir));
                    }

                    dataCetakList.push({
                        nama,
                        nipp: potensiNipp,
                        jabatan,
                        hadir,
                        cuti,
                        sakit,
                        penting,
                        tms,
                        mangkir
                    });
                }
            }
        });

        tbodyCetak.innerHTML = '';

        if (dataCetakList.length === 0) {
            tbodyCetak.innerHTML = `<tr><td colspan="10" style="text-align: center; padding: 20px;">Tidak ada data ditemukan untuk bulan ini.</td></tr>`;
            return;
        }

        dataCetakList.forEach((pegawai, index) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="text-align: center;">${index + 1}</td>
                <td><strong>${pegawai.nama}</strong></td>
                <td style="text-align: center;">${pegawai.nipp}</td>
                <td>${pegawai.jabatan}</td>
                <td style="text-align: center;">${pegawai.hadir}</td>
                <td style="text-align: center;">${pegawai.cuti}</td>
                <td style="text-align: center;">${pegawai.sakit}</td>
                <td style="text-align: center;">${pegawai.penting}</td>
                <td style="text-align: center;">${pegawai.tms}</td>
                <td style="text-align: center;">${pegawai.mangkir}</td>
            `;
            tbodyCetak.appendChild(tr);
        });

    } catch (error) {
        console.error("Gagal memuat data untuk halaman cetak:", error);
        tbodyCetak.innerHTML = `<tr><td colspan="10" style="text-align: center; color: red; padding: 20px;">Gagal mengambil data dari Google Sheets. Silakan coba lagi.</td></tr>`;
    }
}

// ==========================================================================
// Fungsi Line Chart
// ==========================================================================
function renderTrenCutiChart(dataBulan) {
    const svg = document.getElementById("tren-line-chart");
    if (!svg) return;

    // Lebar & Tinggi Canvas SVG
    const width = 840;
    const height = 240;
    const padding = 40;

    // Cari Nilai Maksimum untuk Skala Grafik
    const maxVal = Math.max(...dataBulan, 10);
    
    // Hitung Koordinat Titik X & Y
    const points = dataBulan.map((val, idx) => {
        const x = padding + (idx * ((width - padding * 2) / 11));
        const y = (height - padding) - ((val / maxVal) * (height - padding * 2));
        return { x, y, val };
    });

    // Buat String Path untuk Garis Tren
    const linePath = points.reduce((acc, pt, idx) => {
        return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
    }, "");

    // Buat String Path untuk Area Transparan di Bawah Garis
    const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

    const daftarBulanStr = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

    // Render Elemen HTML SVG
    svg.innerHTML = `
        <!-- Area Biru Transparan di Bawah Garis -->
        <path d="${areaPath}" class="chart-area" />
        
        <!-- Garis Utama Tren Cuti -->
        <path d="${linePath}" class="chart-line" />
        
        <!-- Titik & Teks Nilai -->
        ${points.map((pt, i) => `
            <g class="chart-point-group">
                <circle cx="${pt.x}" cy="${pt.y}" r="4.5" class="chart-dot" />
                <text x="${pt.x}" y="${pt.y - 10}" class="chart-text-value">${pt.val}</text>
                <text x="${pt.x}" y="${height - 10}" class="chart-text-month">${daftarBulanStr[i]}</text>
            </g>
        `).join('')}
    `;
}