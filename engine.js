import { AYARLAR } from './config.js';

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
    });
}

function macOyna(takimA, takimB, pozisyonSayisi) {
    let golA = 0; let golB = 0;
    let sutA = 0; let sutB = 0;
    let xgA = 0; let xgB = 0;
    
    // Takımlar arasındaki saf yetenek (Yıldız) farkı
    const yildizFarkiAB = takimA.yildiz - takimB.yildiz;

    for (let i = 0; i < pozisyonSayisi; i++) {
        // YENİ v1.0: Atak belirlemede Yetenek Baskınlığı çarpanı (Büyük takım orta sahayı domine eder)
        const yetenekEtkisiA = takimA.ortaSaha * takimA.moral * (1 + (yildizFarkiAB * 0.12));
        const yetenekEtkisiB = takimB.ortaSaha * takimB.moral * (1 - (yildizFarkiAB * 0.12));
        
        const toplamAura = yetenekEtkisiA + yetenekEtkisiB;
        const aTopaSahipOlmaSansi = yetenekEtkisiA / toplamAura;
        
        let atakYapan = (Math.random() < aTopaSahipOlmaSansi) ? takimA : takimB;
        let savunan = (atakYapan === takimA) ? takimB : takimA;

        const efektifHucum = atakYapan.hucum * atakYapan.moral;
        const efektifSavunma = savunan.savunma * savunan.moral;
        
        const gucFarki = efektifHucum - efektifSavunma;
        const yildizFarkiAtak = atakYapan.yildiz - savunan.yildiz;

        // YENİ v1.0: Gol şansında saf yetenek ağırlığı artırıldı, zayıf takımların gol bulması zorlaştırıldı
        let golSansi = AYARLAR.TEMEL_GOL_SANSI + (gucFarki * AYARLAR.GUC_FARKI_CARPANI) + (yildizFarkiAtak * 0.035);

        if (golSansi > AYARLAR.MAX_GOL_SANSI) golSansi = AYARLAR.MAX_GOL_SANSI;
        if (golSansi < AYARLAR.MIN_GOL_SANSI) golSansi = AYARLAR.MIN_GOL_SANSI;

        // Pozisyonun şuta dönüşme olasılığı güçlü savunmalara karşı düşer (Nerf)
        let sutCekmeIhtimali = 0.65 + (yildizFarkiAtak * 0.05);
        sutCekmeIhtimali = Math.max(0.30, Math.min(0.85, sutCekmeIhtimali));

        if (atakYapan === takimA) {
            xgA += golSansi;
            if (Math.random() < sutCekmeIhtimali) sutA++;
            if (Math.random() < golSansi) {
                golA++;
                if (golA > sutA) sutA = golA; 
            }
        } else {
            xgB += golSansi;
            if (Math.random() < sutCekmeIhtimali) sutB++;
            if (Math.random() < golSansi) {
                golB++;
                if (golB > sutB) sutB = golB;
            }
        }
    }
    return { 
        skorA: golA, skorB: golB, 
        sutA: sutA, sutB: sutB, 
        xgA: parseFloat(xgA.toFixed(2)), xgD: parseFloat(xgB.toFixed(2)) 
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
    const pozisyonSayisi = Math.floor(Math.random() * AYARLAR.RND_POZISYON_EK) + AYARLAR.MIN_POZISYON; 
    let sonuc = macOyna(evSahibi, deplasman, pozisyonSayisi);
    
    let uzatmaOynandi = false;
    let penaltiOynandi = false;
    let penaltiE = 0;
    let penaltiD = 0;

    let totalSutE = sonuc.sutA;
    let totalSutD = sonuc.sutB;
    let totalXGE = sonuc.xgA;
    let totalXGD = sonuc.xgD;

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
    
    let kirmiziE = (Math.random() < (faulE * 0.008)) ? 1 : 0;
    let kirmiziD = (Math.random() < (faulD * 0.008)) ? 1 : 0;

    evSahibi.faul += faulE;
    deplasman.faul += faulD;
    evSahibi.toplamSut += totalSutE;
    deplasman.toplamSut += totalSutD;
    evSahibi.kirmiziKart += kirmiziE;
    deplasman.kirmiziKart += kirmiziD;

    // YENİ v1.0: Topla oynama istatistiği de yetenek farkına göre ezici hale getirildi
    const yildizFarkiTotal = evSahibi.yildiz - deplasman.yildiz;
    const gucE_mod = (evSahibi.ortaSaha * evSahibi.moral) * (1 + (yildizFarkiTotal * 0.10));
    const gucD_mod = (deplasman.ortaSaha * deplasman.moral) * (1 - (yildizFarkiTotal * 0.10));
    
    let possessionE = Math.round((gucE_mod / (gucE_mod + gucD_mod)) * 100);
    possessionE += Math.floor(Math.random() * 5) - 2;
    if (possessionE > 78) possessionE = 78;
    if (possessionE < 22) possessionE = 22;
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
        kirmiziD: kirmiziD
    };
}