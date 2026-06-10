// modules/awardsManager.js

import { kadrolar } from '../data/squads.js';

/**
 * Şampiyon takım, bitiricilik ve yaş gibi özel filtrelerle bireysel ödülleri belirler.
 */
export function bireyselOdulleriHesapla(oyuncuIstatistikleri, takimlarListesi, sampiyonTakimIsmi) {
    let tumOyuncular = Object.values(oyuncuIstatistikleri || {}).filter(p => p.oynadigiMac > 0);
    if (tumOyuncular.length === 0) return { golKrali: null, asistKrali: null, mvp: null, gencMvp: null, altinEldiven: null };

    // Takımların şut istatistiklerini haritala (Altın ayakkabı eşitliği için)
    let takimSutVerileri = {};
    takimlarListesi.forEach(t => { takimSutVerileri[t.isim] = { gol: t.atilanGol, sut: t.toplamSut }; });

    // YAŞLARI BULMAK İÇİN SQUADS VERİTABANINA BAKIYORUZ
    tumOyuncular.forEach(p => {
        let kadro = kadrolar[p.takim];
        if (kadro) {
            let orijinalOyuncu = kadro.find(o => o.id === p.id);
            p.yas = orijinalOyuncu ? orijinalOyuncu.yas : 25; // Bulamazsa varsayılan
        }
    });

    // 1. ALTIN AYAKKABI (Eşitlikte: 1. Şampiyon mu? 2. Takımının Şut/Gol Yüzdesi yüksek mi?)
    let golKrali = [...tumOyuncular].sort((a, b) => {
        if (b.gol !== a.gol) return b.gol - a.gol;
        
        let aSampiyon = (a.takim === sampiyonTakimIsmi) ? 1 : 0;
        let bSampiyon = (b.takim === sampiyonTakimIsmi) ? 1 : 0;
        if (aSampiyon !== bSampiyon) return bSampiyon - aSampiyon;

        let aYuzde = takimSutVerileri[a.takim].sut > 0 ? (takimSutVerileri[a.takim].gol / takimSutVerileri[a.takim].sut) : 0;
        let bYuzde = takimSutVerileri[b.takim].sut > 0 ? (takimSutVerileri[b.takim].gol / takimSutVerileri[b.takim].sut) : 0;
        return bYuzde - aYuzde;
    })[0];

    // 2. ASİST KRALI
    let asistKrali = [...tumOyuncular].sort((a, b) => {
        if (b.asist !== a.asist) return b.asist - a.asist;
        return b.ortalamaReyting - a.ortalamaReyting;
    })[0];

    // 3. TURNUVANIN EN İYİ OYUNCUSU (MVP) (Min 3 maç, en yüksek reyting)
    let mvpAdaylari = tumOyuncular.filter(p => p.oynadigiMac >= 3);
    if(mvpAdaylari.length === 0) mvpAdaylari = tumOyuncular;
    let mvp = mvpAdaylari.sort((a, b) => b.ortalamaReyting - a.ortalamaReyting)[0];

    // 4. EN İYİ GENÇ OYUNCU (U23 - Yaşı 23 ve altı olan, en yüksek reytingli)
    let gencAdaylar = tumOyuncular.filter(p => p.yas <= 23 && p.oynadigiMac >= 2);
    if(gencAdaylar.length === 0) gencAdaylar = tumOyuncular.filter(p => p.yas <= 23); // Maç sınırını esnet
    let gencMvp = gencAdaylar.sort((a, b) => b.ortalamaReyting - a.ortalamaReyting)[0] || null;

    // 5. ALTIN ELDİVEN (Eşitlikte: 1. Şampiyon mu? 2. Daha az maç başı gol yiyen)
    let kaleciler = tumOyuncular.filter(p => p.mevki === "KL");
    let altinEldiven = kaleciler.sort((a, b) => {
        if (b.cleanSheet !== a.cleanSheet) return b.cleanSheet - a.cleanSheet;
        
        let aSampiyon = (a.takim === sampiyonTakimIsmi) ? 1 : 0;
        let bSampiyon = (b.takim === sampiyonTakimIsmi) ? 1 : 0;
        if (aSampiyon !== bSampiyon) return bSampiyon - aSampiyon;

        let aTakim = takimlarListesi.find(t => t.isim === a.takim);
        let bTakim = takimlarListesi.find(t => t.isim === b.takim);
        
        let aYenilenOran = aTakim ? (aTakim.yenilenGol / aTakim.oynadigiMac) : 99;
        let bYenilenOran = bTakim ? (bTakim.yenilenGol / bTakim.oynadigiMac) : 99;
        return aYenilenOran - bYenilenOran; // Az yiyen üste
    })[0];

    return { golKrali, asistKrali, mvp, gencMvp, altinEldiven };
}