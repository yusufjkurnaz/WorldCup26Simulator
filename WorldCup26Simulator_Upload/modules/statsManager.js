// modules/statsManager.js

import { kadrolar } from '../data/squads.js';

export let oyuncuIstatistikleri = {};

export function istatistikleriBaslat() {
    oyuncuIstatistikleri = {};
    for (const ulke in kadrolar) {
        kadrolar[ulke].forEach(oyuncu => {
            oyuncuIstatistikleri[oyuncu.id] = {
                id: oyuncu.id, ad: oyuncu.ad, soyad: oyuncu.soyad,
                takim: ulke, mevki: oyuncu.mevki,
                gol: 0, asist: 0, sariKart: 0, kirmiziKart: 0,
                cleanSheet: 0, oynadigiMac: 0, cezaDurumu: 0, sakatlikDurumu: 0,
                toplamReyting: 0.0, // Yeni: Ortalama hesaplamak için
                ortalamaReyting: 0.0 // Yeni: Liderlik tablosu için
            };
        });
    }
}

export function mactanSonraIstatistikleriGuncelle(evSahibiIsim, deplasmanIsim, skorE, skorD, macOlaylari, reytingler, oynayanlar) {
    if (Object.keys(oyuncuIstatistikleri).length === 0) istatistikleriBaslat();

    let mactakiKartlar = {}; 
    let yeniCezalilar = [];

    // Oynayanların maç sayısını ve reytinglerini ekle
    oynayanlar.forEach(pid => {
        let stat = oyuncuIstatistikleri[pid];
        if(stat) {
            stat.oynadigiMac++;
            if(reytingler[pid]) stat.toplamReyting += reytingler[pid];
            stat.ortalamaReyting = parseFloat((stat.toplamReyting / stat.oynadigiMac).toFixed(2));
        }
    });

    if (macOlaylari) {
        macOlaylari.forEach(olay => {
            if (olay.tur === "GOL") {
                if (olay.golcu && oyuncuIstatistikleri[olay.golcu.id]) oyuncuIstatistikleri[olay.golcu.id].gol++;
                if (olay.asist && oyuncuIstatistikleri[olay.asist.id]) oyuncuIstatistikleri[olay.asist.id].asist++;
            }
            else if (olay.tur === "SARI_KART" || olay.tur === "IKINCI_SARI") {
                let pid = olay.oyuncu.id;
                if(oyuncuIstatistikleri[pid]) {
                    mactakiKartlar[pid] = (mactakiKartlar[pid] || 0) + 1;
                    oyuncuIstatistikleri[pid].sariKart++;

                    if (mactakiKartlar[pid] === 2) {
                        oyuncuIstatistikleri[pid].kirmiziKart++;
                        oyuncuIstatistikleri[pid].cezaDurumu += 1; 
                        oyuncuIstatistikleri[pid].sariKart -= 2; 
                        yeniCezalilar.push(pid);
                        olay.tur = "IKINCI_SARI"; 
                    }
                }
            }
            else if (olay.tur === "KIRMIZI_KART") {
                let pid = olay.oyuncu.id;
                if(oyuncuIstatistikleri[pid]) {
                    oyuncuIstatistikleri[pid].kirmiziKart++;
                    oyuncuIstatistikleri[pid].cezaDurumu += 1; 
                    yeniCezalilar.push(pid);
                }
            }
            else if (olay.tur === "SAKATLIK") {
                if(oyuncuIstatistikleri[olay.oyuncu.id]) {
                    oyuncuIstatistikleri[olay.oyuncu.id].sakatlikDurumu = (olay.derece === "Ağır") ? 99 : Math.floor(Math.random() * 3) + 1;
                }
            }
        });
    }

    for (let pid in mactakiKartlar) {
        let stat = oyuncuIstatistikleri[pid];
        if (stat && mactakiKartlar[pid] < 2 && stat.sariKart > 0 && stat.sariKart % 2 === 0) {
             stat.cezaDurumu += 1;
             yeniCezalilar.push(pid);
        }
    }

    if (skorD === 0 && kadrolar[evSahibiIsim]) { 
        kadrolar[evSahibiIsim].filter(p => p.mevki === 'KL' && oynayanlar.includes(p.id)).forEach(p => { if(oyuncuIstatistikleri[p.id]) oyuncuIstatistikleri[p.id].cleanSheet++; });
    }
    if (skorE === 0 && kadrolar[deplasmanIsim]) { 
        kadrolar[deplasmanIsim].filter(p => p.mevki === 'KL' && oynayanlar.includes(p.id)).forEach(p => { if(oyuncuIstatistikleri[p.id]) oyuncuIstatistikleri[p.id].cleanSheet++; });
    }

    return yeniCezalilar; // Yeni cezalıları geri dön ki hemen affetmeyelim
}

export function ceyrekFinalSonrasiKartlariSifirla() {
    for (let pid in oyuncuIstatistikleri) {
        oyuncuIstatistikleri[pid].sariKart = 0;
    }
}

// BUG DÜZELTİLDİ: Sadece maçta hiç OYNAMAMIŞ ve O MAÇTA CEZA YEMEMİŞ adamların cezası düşer!
export function mactanSonraCezalariDus(takimIsmi, oynayanlar, yeniCezalilar) {
    if (!kadrolar[takimIsmi]) return;
    kadrolar[takimIsmi].forEach(oyuncu => {
        let stat = oyuncuIstatistikleri[oyuncu.id];
        if (stat) {
            // Eğer oyuncu bu maç oynamadıysa VE bu maçın içinde yeni bir ceza yememişse cezasını/sakatlığını çekmiş sayılır
            if (!oynayanlar.includes(oyuncu.id) && !yeniCezalilar.includes(oyuncu.id)) {
                if (stat.cezaDurumu > 0) stat.cezaDurumu--;
                if (stat.sakatlikDurumu > 0 && stat.sakatlikDurumu !== 99) stat.sakatlikDurumu--;
            }
        }
    });
}

export function oyuncuOynayabilirMi(playerId) {
    let stat = oyuncuIstatistikleri[playerId];
    if (!stat) return true;
    return stat.cezaDurumu === 0 && stat.sakatlikDurumu === 0;
}