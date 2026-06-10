// modules/engine.js

import { AYARLAR } from './config.js';
import { kadrolar } from '../data/squads.js';

export function istatistikleriSifirla(takimlarListesi) {
    takimlarListesi.forEach(t => {
        t.oynadigiMac = 0; t.galibiyet = 0; t.beraberlik = 0; t.maglubiyet = 0;
        t.atilanGol = 0; t.yenilenGol = 0; t.averaj = 0; t.puan = 0;
        t.moral = 1.0; 
        
        t.faul = 0; 
        t.surprizPuani = 0; 
        t.hayalKirikligiPuani = 0;
        
        t.toplamSut = 0;
        t.kirmiziKart = 0;

        if (!t.dizilis) t.dizilis = "4-2-3-1";
        if (!t.anlayis) t.anlayis = "Dengeli";
    });
}

function taktikselGucleRaporu(takim) {
    const dizilis = takim.dizilis || "4-4-2";
    const anlayis = takim.anlayis || "Dengeli";

    let fHucum = 1.0, fOrta = 1.0, fSavunma = 1.0;
    if (dizilis === "4-3-3") { fHucum = 1.08; fOrta = 0.98; fSavunma = 0.94; }
    else if (dizilis === "4-2-3-1") { fHucum = 1.02; fOrta = 1.05; fSavunma = 0.96; }
    else if (dizilis === "3-5-2") { fHucum = 0.96; fOrta = 1.10; fSavunma = 0.95; }
    else if (dizilis === "5-3-2") { fHucum = 0.88; fOrta = 0.95; fSavunma = 1.14; }

    let mHucum = 1.0, mOrta = 1.0, mSavunma = 1.0;
    if (anlayis === "Ofansif") { mHucum = 1.12; mOrta = 1.00; mSavunma = 0.86; }
    else if (anlayis === "Defansif") { mHucum = 0.84; mOrta = 0.98; mSavunma = 1.16; }

    let hucum = takim.hucum * fHucum * mHucum * takim.moral;
    let ortaSaha = takim.ortaSaha * fOrta * mOrta * takim.moral;
    let savunma = takim.savunma * fSavunma * mSavunma * takim.moral;

    const KILIT_ESIK = 86;
    if (hucum > KILIT_ESIK) hucum = KILIT_ESIK + (hucum - KILIT_ESIK) * 0.20;
    if (ortaSaha > KILIT_ESIK) ortaSaha = KILIT_ESIK + (ortaSaha - KILIT_ESIK) * 0.20;
    if (savunma > KILIT_ESIK) savunma = KILIT_ESIK + (savunma - KILIT_ESIK) * 0.20;

    return { hucum, ortaSaha, savunma };
}

function getAktifKadro(takim, dakika, degisiklikler) {
    if (!takim.ilk11) return [];
    
    let aktifIDs = [...takim.ilk11];
    
    if (degisiklikler && degisiklikler.length > 0) {
        degisiklikler.forEach(sub => {
            if (sub.dakika <= dakika) {
                aktifIDs = aktifIDs.filter(id => id !== sub.cikan.id);
                aktifIDs.push(sub.giren.id);
            }
        });
    }
    
    let fullKadro = kadrolar[takim.isim];
    if (!fullKadro) return [];
    
    return aktifIDs.map(id => fullKadro.find(p => p.id === id)).filter(Boolean);
}

function getGolYaraticilari(aktifKadro) {
    if(!aktifKadro || aktifKadro.length === 0) return { golcu: null, asist: null };

    let hucumcular = aktifKadro.filter(p => ["SNT", "SLK", "SĞK", "OS"].includes(p.mevki));
    if(hucumcular.length === 0) hucumcular = aktifKadro; 
    
    let golcu = hucumcular[Math.floor(Math.random() * hucumcular.length)];
    
    let asist = null;
    if (Math.random() > 0.35) {
        let pasorler = aktifKadro.filter(p => p.id !== golcu.id && ["OS", "SLK", "SĞK", "SĞB", "SLB"].includes(p.mevki));
        if(pasorler.length === 0) pasorler = aktifKadro.filter(p => p.id !== golcu.id);
        if(pasorler.length > 0) asist = pasorler[Math.floor(Math.random() * pasorler.length)];
    }
    
    return { golcu: golcu, asist: asist };
}

function rastgeleOyuncuSec(aktifKadro) {
    if(!aktifKadro || aktifKadro.length === 0) return null;
    return aktifKadro[Math.floor(Math.random() * aktifKadro.length)];
}

function degisiklikleriPlanla(takim) {
    let subs = [];
    if (!takim.ilk11 || !takim.yedekler || takim.yedekler.length === 0) return subs;

    let ydkIDs = [...takim.yedekler]; 
    let ilkIDs = [...takim.ilk11];
    
    let numSubs = Math.floor(Math.random() * 4) + 2; 
    let fullKadro = kadrolar[takim.isim];

    for(let i=0; i<numSubs; i++) {
        if(ydkIDs.length === 0 || ilkIDs.length === 0) break;
        
        let cikanId = ilkIDs.splice(Math.floor(Math.random() * ilkIDs.length), 1)[0];
        let girenId = ydkIDs.splice(Math.floor(Math.random() * ydkIDs.length), 1)[0];
        
        ilkIDs.push(girenId);
        let dakika = Math.floor(Math.random() * 40) + 48; 
        
        let cikanObj = fullKadro.find(x => x.id === cikanId);
        let girenObj = fullKadro.find(x => x.id === girenId);
        
        if(cikanObj && girenObj) {
            subs.push({ tur: "DEGISIKLIK", takim: takim.isim, cikan: cikanObj, giren: girenObj, dakika: dakika });
        }
    }
    return subs;
}

function macOyna(takimA, takimB, pozisyonSayisi) {
    let golA = 0; let golB = 0;
    let sutA = 0; let sutB = 0;
    let xgA = 0; let xgB = 0;
    let olaylar = []; 

    let subsA = degisiklikleriPlanla(takimA);
    let subsB = degisiklikleriPlanla(takimB);
    olaylar.push(...subsA, ...subsB);

    const tGucA = taktikselGucleRaporu(takimA);
    const tGucB = taktikselGucleRaporu(takimB);
    const yildizFarkiAB = takimA.yildiz - takimB.yildiz;

    for (let i = 0; i < pozisyonSayisi; i++) {
        // DENGELENDİ: Üstel etki 1.15'ten 1.08'e düşürüldü.
        const yetenekEtkisiA = tGucA.ortaSaha * Math.pow(1.08, yildizFarkiAB);
        const yetenekEtkisiB = tGucB.ortaSaha * Math.pow(1.08, -yildizFarkiAB);
        
        const toplamAura = Math.max(1, yetenekEtkisiA + yetenekEtkisiB);
        const aTopaSahipOlmaSansi = yetenekEtkisiA / toplamAura;
        
        let atakYapan = (Math.random() < aTopaSahipOlmaSansi) ? takimA : takimB;
        let savunan = (atakYapan === takimA) ? takimB : takimA;

        const gA = (atakYapan === takimA) ? tGucA : tGucB;
        const gB = (savunan === takimA) ? tGucA : tGucB;
        const yildizFarkiAtak = atakYapan.yildiz - savunan.yildiz;

        // DENGELENDİ: Fark açma katsayıları yarı yarıya azaltıldı.
        const hucumGucu = gA.hucum * (1 + (Math.max(0, yildizFarkiAtak) * 0.03));
        const savunmaGucu = gB.savunma * (1 + (Math.max(0, -yildizFarkiAtak) * 0.03));
        const gucFarki = hucumGucu - savunmaGucu;

        let golSansi = AYARLAR.TEMEL_GOL_SANSI + (gucFarki * (AYARLAR.GUC_FARKI_CARPANI * 1.1)) + (yildizFarkiAtak * 0.03);
        if (golSansi > AYARLAR.MAX_GOL_SANSI) golSansi = AYARLAR.MAX_GOL_SANSI;
        if (golSansi < AYARLAR.MIN_GOL_SANSI) golSansi = AYARLAR.MIN_GOL_SANSI;

        let sutCekmeIhtimali = 0.65 + (yildizFarkiAtak * 0.04);
        sutCekmeIhtimali = Math.max(0.35, Math.min(0.85, sutCekmeIhtimali));
        
        let dakika = Math.floor(Math.random() * 90) + 1;

        if (Math.random() < 0.04) {
            olaylar.push({ tur: "VAR_IPTAL", takim: atakYapan.isim, dakika: dakika });
        }

        if (atakYapan === takimA) {
            xgA += golSansi;
            if (Math.random() < sutCekmeIhtimali) sutA++;
            if (Math.random() < golSansi) {
                golA++;
                if (golA > sutA) sutA = golA; 
                let aktifKadroA = getAktifKadro(takimA, dakika, subsA);
                let detay = getGolYaraticilari(aktifKadroA);
                if(detay.golcu) olaylar.push({ tur: "GOL", takim: takimA.isim, dakika: dakika, golcu: detay.golcu, asist: detay.asist });
            }
        } else {
            xgB += golSansi;
            if (Math.random() < sutCekmeIhtimali) sutB++;
            if (Math.random() < golSansi) {
                golB++;
                if (golB > sutB) sutB = golB;
                let aktifKadroB = getAktifKadro(takimB, dakika, subsB);
                let detay = getGolYaraticilari(aktifKadroB);
                if(detay.golcu) olaylar.push({ tur: "GOL", takim: takimB.isim, dakika: dakika, golcu: detay.golcu, asist: detay.asist });
            }
        }
    }
    
    olaylar.sort((a, b) => a.dakika - b.dakika);

    return { 
        skorA: golA, skorB: golB, 
        sutA: sutA, sutB: sutB, 
        xgA: parseFloat(xgA.toFixed(2)), xgD: parseFloat(xgB.toFixed(2)),
        olaylar: olaylar, subsA: subsA, subsB: subsB
    };
}

function moralGuncelle(evSahibi, deplasman, skorE, skorD) {
    let farkYildiz = evSahibi.yildiz - deplasman.yildiz;

    if (skorE > skorD) { 
        evSahibi.moral += AYARLAR.MORAL_GALIBIYET;
        deplasman.moral += AYARLAR.MORAL_MAGLUBIYET;
        if (farkYildiz < 0) evSahibi.moral += AYARLAR.MORAL_SURPRIZ_EK; 
    } 
    else if (skorD > skorE) { 
        deplasman.moral += AYARLAR.MORAL_GALIBIYET;
        evSahibi.moral += AYARLAR.MORAL_MAGLUBIYET;
        if (farkYildiz > 0) deplasman.moral += AYARLAR.MORAL_SURPRIZ_EK; 
    } 
    else { 
        if (farkYildiz < 0) { 
            evSahibi.moral += AYARLAR.MORAL_BERABERLIK_ZAYIF;
            deplasman.moral += AYARLAR.MORAL_BERABERLIK_GUCLU;
        } else if (farkYildiz > 0) { 
            deplasman.moral += AYARLAR.MORAL_BERABERLIK_ZAYIF;
            evSahibi.moral += AYARLAR.MORAL_BERABERLIK_GUCLU;
        }
    }

    evSahibi.moral = parseFloat(Math.max(AYARLAR.MORAL_MIN, Math.min(AYARLAR.MORAL_MAX, evSahibi.moral)).toFixed(2));
    deplasman.moral = parseFloat(Math.max(AYARLAR.MORAL_MIN, Math.min(AYARLAR.MORAL_MAX, deplasman.moral)).toFixed(2));
}

export function maciIsle(evSahibi, deplasman, isElemeTuru = false) {
    let pozisyonSayisi = Math.floor(Math.random() * AYARLAR.RND_POZISYON_EK) + AYARLAR.MIN_POZISYON; 
    
    // DENGELENDİ: Pozisyon çarpanı 4'ten 2'ye düşürüldü. Maçlar çılgın atarak 8-1 bitmeyecek.
    let yildizFarkiMutlak = Math.abs(evSahibi.yildiz - deplasman.yildiz);
    if (yildizFarkiMutlak >= 1.0) {
        pozisyonSayisi += Math.floor(yildizFarkiMutlak * 2); 
    }

    let sonuc = macOyna(evSahibi, deplasman, pozisyonSayisi);
    
    let uzatmaOynandi = false;
    let penaltiOynandi = false;
    let penaltiE = 0;
    let penaltiD = 0;

    let totalSutE = sonuc.sutA;
    let totalSutD = sonuc.sutB;
    let totalXGE = sonuc.xgA;
    let totalXGD = sonuc.xgD;
    let macOlaylari = sonuc.olaylar; 

    if (isElemeTuru && sonuc.skorA === sonuc.skorB) {
        uzatmaOynandi = true;
        let uzatmaPozisyon = Math.max(1, Math.floor(pozisyonSayisi / 3));
        let uzatmaSonuc = macOyna(evSahibi, deplasman, uzatmaPozisyon);
        
        sonuc.skorA += uzatmaSonuc.skorA;
        sonuc.skorB += uzatmaSonuc.skorB;
        totalSutE += uzatmaSonuc.sutA;
        totalSutD += uzatmaSonuc.sutB;
        totalXGE += uzatmaSonuc.xgA;
        totalXGD += uzatmaSonuc.xgD;
        
        uzatmaSonuc.olaylar.forEach(o => { o.dakika += 90; macOlaylari.push(o); });
        sonuc.subsA.push(...uzatmaSonuc.subsA);
        sonuc.subsB.push(...uzatmaSonuc.subsB);

        if (sonuc.skorA === sonuc.skorB) {
            penaltiOynandi = true;
            while (true) { 
                let sansE = 0.70 + (evSahibi.hucum / 2500); 
                let sansD = 0.70 + (deplasman.hucum / 2500);
                let atisE = 0, atisD = 0;
                
                for(let p = 0; p < 5; p++) {
                    if(Math.random() < sansE) atisE++;
                    if(Math.random() < sansD) atisD++;
                }
                
                penaltiE = atisE;
                penaltiD = atisD;
                if (penaltiE !== penaltiD) break; 
                
                while (penaltiE === penaltiD) {
                    if(Math.random() < sansE) penaltiE++;
                    if(Math.random() < sansD) penaltiD++;
                }
                break;
            }
        }
    }

    let faulE = Math.floor(Math.random() * 12) + 5; 
    let faulD = Math.floor(Math.random() * 12) + 5;
    
    let sariE = Math.floor((faulE / 4) + (Math.random() * 2)); 
    let sariD = Math.floor((faulD / 4) + (Math.random() * 2)); 
    
    for(let i=0; i<sariE; i++) {
        let d = Math.floor(Math.random() * 90) + 1;
        let aktifA = getAktifKadro(evSahibi, d, sonuc.subsA);
        let p = rastgeleOyuncuSec(aktifA);
        if(p) macOlaylari.push({ tur: "SARI_KART", takim: evSahibi.isim, oyuncu: p, dakika: d });
    }
    for(let i=0; i<sariD; i++) {
        let d = Math.floor(Math.random() * 90) + 1;
        let aktifB = getAktifKadro(deplasman, d, sonuc.subsB);
        let p = rastgeleOyuncuSec(aktifB);
        if(p) macOlaylari.push({ tur: "SARI_KART", takim: deplasman.isim, oyuncu: p, dakika: d });
    }

    let kirmiziE = (Math.random() < (faulE * 0.008)) ? 1 : 0;
    let kirmiziD = (Math.random() < (faulD * 0.008)) ? 1 : 0;
    
    if(kirmiziE > 0) {
        let d = Math.floor(Math.random() * 90) + 1;
        let aktifA = getAktifKadro(evSahibi, d, sonuc.subsA);
        let p = rastgeleOyuncuSec(aktifA);
        if(p) macOlaylari.push({ tur: "KIRMIZI_KART", takim: evSahibi.isim, oyuncu: p, dakika: d });
    }
    if(kirmiziD > 0) {
        let d = Math.floor(Math.random() * 90) + 1;
        let aktifB = getAktifKadro(deplasman, d, sonuc.subsB);
        let p = rastgeleOyuncuSec(aktifB);
        if(p) macOlaylari.push({ tur: "KIRMIZI_KART", takim: deplasman.isim, oyuncu: p, dakika: d });
    }
    
    if (Math.random() < 0.04) {
        let sanssizTakim = Math.random() < 0.5 ? evSahibi : deplasman;
        let d = Math.floor(Math.random() * 90) + 1;
        let aktif = getAktifKadro(sanssizTakim, d, sanssizTakim === evSahibi ? sonuc.subsA : sonuc.subsB);
        let sanssizOyuncu = rastgeleOyuncuSec(aktif);
        let derece = Math.random() < 0.70 ? "Hafif" : "Ağır";
        if(sanssizOyuncu) {
            macOlaylari.push({ tur: "SAKATLIK", takim: sanssizTakim.isim, oyuncu: sanssizOyuncu, derece: derece, dakika: d });
        }
    }

    macOlaylari.sort((a, b) => a.dakika - b.dakika);

    evSahibi.faul += faulE;
    deplasman.faul += faulD;
    evSahibi.toplamSut += totalSutE;
    deplasman.toplamSut += totalSutD;
    evSahibi.kirmiziKart += kirmiziE;
    deplasman.kirmiziKart += kirmiziD;

    let oynayanlarE = [...new Set([...(evSahibi.ilk11 || []), ...sonuc.subsA.map(s => s.giren.id)])];
    let oynayanlarD = [...new Set([...(deplasman.ilk11 || []), ...sonuc.subsB.map(s => s.giren.id)])];
    let reytingler = {};

    [...oynayanlarE, ...oynayanlarD].forEach(id => {
        reytingler[id] = 5.8 + (Math.random() * 1.4); 
    });

    macOlaylari.forEach(o => {
        if(o.tur === "GOL" && o.golcu) reytingler[o.golcu.id] += 1.3;
        if(o.tur === "GOL" && o.asist) reytingler[o.asist.id] += 0.8;
        if(o.tur === "SARI_KART" || o.tur === "IKINCI_SARI") reytingler[o.oyuncu.id] -= 0.6;
        if(o.tur === "KIRMIZI_KART") reytingler[o.oyuncu.id] -= 1.8;
    });

    if(sonuc.skorB === 0) oynayanlarE.forEach(id => { let p = kadrolar[evSahibi.isim].find(x=>x.id===id); if(p && ["KL","STP","SĞB","SLB"].includes(p.mevki)) reytingler[id]+=1.2; });
    if(sonuc.skorA === 0) oynayanlarD.forEach(id => { let p = kadrolar[deplasman.isim].find(x=>x.id===id); if(p && ["KL","STP","SĞB","SLB"].includes(p.mevki)) reytingler[id]+=1.2; });

    for(let id in reytingler) {
        reytingler[id] = parseFloat(Math.max(3.0, Math.min(10.0, reytingler[id])).toFixed(1));
    }

    const tGucE = taktikselGucleRaporu(evSahibi);
    const tGucD = taktikselGucleRaporu(deplasman);
    const yildizFarkiTotal = evSahibi.yildiz - deplasman.yildiz;
    
    // DENGELENDİ: Topla oynama marjları da %76 - %24 aralığına çekildi. 
    const gucE_mod = tGucE.ortaSaha * Math.pow(1.08, yildizFarkiTotal);
    const gucD_mod = tGucD.ortaSaha * Math.pow(1.08, -yildizFarkiTotal);
    
    let possessionE = Math.round((gucE_mod / Math.max(1, gucE_mod + gucD_mod)) * 100);
    possessionE += Math.floor(Math.random() * 5) - 2;
    if (possessionE > 76) possessionE = 76;
    if (possessionE < 24) possessionE = 24;
    let possessionD = 100 - possessionE;

    let gucE = evSahibi.hucum + evSahibi.ortaSaha + evSahibi.savunma;
    let gucD = deplasman.hucum + deplasman.ortaSaha + deplasman.savunma;
    let gucFarkiTotal = gucE - gucD; 
    let kazanan = null;
    
    if (penaltiOynandi) {
        kazanan = (penaltiE > penaltiD) ? "E" : "D";
    } else {
        if (sonuc.skorA > sonuc.skorB) kazanan = "E";
        else if (sonuc.skorA < sonuc.skorB) kazanan = "D";
    }

    if (!isElemeTuru) {
        evSahibi.oynadigiMac++; deplasman.oynadigiMac++;
        evSahibi.atilanGol += sonuc.skorA; evSahibi.yenilenGol += sonuc.skorB;
        deplasman.atilanGol += sonuc.skorB; deplasman.yenilenGol += sonuc.skorA;

        if (kazanan === "E") {
            evSahibi.galibiyet++; evSahibi.puan += 3; deplasman.maglubiyet++;
        } else if (kazanan === "D") {
            deplasman.galibiyet++; deplasman.puan += 3; evSahibi.maglubiyet++;
        } else {
            evSahibi.beraberlik++; deplasman.beraberlik++; evSahibi.puan += 1; deplasman.puan += 1;
        }
        evSahibi.averaj = evSahibi.atilanGol - evSahibi.yenilenGol;
        deplasman.averaj = deplasman.atilanGol - deplasman.yenilenGol;
    }

    if (kazanan === "E" && gucFarkiTotal < -15) {
        evSahibi.surprizPuani += Math.abs(gucFarkiTotal);
        if (isElemeTuru) deplasman.hayalKirikligiPuani += Math.abs(gucFarkiTotal) * 2; 
    } 
    else if (kazanan === "D" && gucFarkiTotal > 15) {
        deplasman.surprizPuani += gucFarkiTotal;
        if (isElemeTuru) evSahibi.hayalKirikligiPuani += gucFarkiTotal * 2;
    }

    moralGuncelle(evSahibi, deplasman, sonuc.skorA, sonuc.skorB);

    return { 
        isimE: evSahibi.isim, 
        isimD: deplasman.isim, 
        skorE: sonuc.skorA, 
        skorD: sonuc.skorB, 
        uzatma: uzatmaOynandi, 
        penalti: penaltiOynandi, 
        penE: penaltiE, 
        penD: penaltiD,
        faulE: faulE,
        faulD: faulD,
        sutE: totalSutE,
        sutD: totalSutD,
        xGE: parseFloat(totalXGE.toFixed(2)),
        xGD: parseFloat(totalXGD.toFixed(2)),
        toplaOynamaE: possessionE,
        toplaOynamaD: possessionD,
        kirmiziE: kirmiziE,
        kirmiziD: kirmiziD,
        olaylar: macOlaylari,
        oynayanlarE: oynayanlarE,
        oynayanlarD: oynayanlarD,
        reytingler: reytingler
    };
}