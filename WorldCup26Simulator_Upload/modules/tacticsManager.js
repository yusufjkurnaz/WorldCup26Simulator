// modules/tacticsManager.js

import { takimlar } from '../data/teams.js';
import { kadrolar } from '../data/squads.js';
import { oyuncuOynayabilirMi, oyuncuIstatistikleri } from './statsManager.js';

/**
 * Belirtilen takımın İlk 11'ini, Yedeklerini ve detaylı özelliklerini getirir.
 * Arayüz (UI) bu fonksiyonla beslenir.
 */
export function getTakimData(takimIsmi) {
    let takim = takimlar.find(t => t.isim === takimIsmi);
    let kadro = kadrolar[takimIsmi];
    if (!takim || !kadro) return null;

    // Sadece ID'leri tuttuğumuz dizileri, gerçek oyuncu objelerine çeviriyoruz
    let ilk11Obj = (takim.ilk11 || []).map(id => kadro.find(p => p.id === id)).filter(Boolean);
    let yedeklerObj = (takim.yedekler || []).map(id => kadro.find(p => p.id === id)).filter(Boolean);

    return { takim, ilk11: ilk11Obj, yedekler: yedeklerObj };
}

/**
 * Kullanıcı diziliş (4-3-3 vb.) veya anlayış (Ofansif vb.) değiştirdiğinde çalışır.
 */
export function taktikGuncelle(takimIsmi, dizilis, anlayis) {
    let takim = takimlar.find(t => t.isim === takimIsmi);
    if (takim) {
        takim.dizilis = dizilis;
        takim.anlayis = anlayis;
    }
}

/**
 * Sürükle bırak ile oyuncu değiştirildiğinde çalışır.
 * Çıkan oyuncuyu yedeğe, giren oyuncuyu İlk 11'e yazar.
 */
export function oyuncuDegistir(takimIsmi, cikanId, girenId) {
    let takim = takimlar.find(t => t.isim === takimIsmi);
    if (!takim) return { basarili: false, mesaj: "Takım bulunamadı!" };

    // Sağlık ve Ceza Kontrolü (Disiplin Kurulu'na soruluyor)
    if (!oyuncuOynayabilirMi(girenId)) {
        let stat = oyuncuIstatistikleri[girenId];
        let sebep = stat && stat.sakatlikDurumu > 0 ? "Sakat" : "Cezalı";
        return { basarili: false, mesaj: `Bu oyuncu ${sebep} olduğu için İlk 11'e alınamaz!` };
    }

    let cikanIndex = takim.ilk11.indexOf(cikanId);
    let girenIndex = takim.yedekler.indexOf(girenId);

    if (cikanIndex > -1 && girenIndex > -1) {
        // ID'leri takas et (Swap)
        takim.ilk11[cikanIndex] = girenId;
        takim.yedekler[girenIndex] = cikanId;
        
        // Kadro değişti, takımın yeni gücünü hesapla!
        gucHesaplaVeGuncelle(takimIsmi);
        return { basarili: true };
    }
    
    return { basarili: false, mesaj: "Değişim için oyuncular eşleşmedi." };
}

/**
 * Sahadaki 11 oyuncunun Reytinglerine (GEN) bakarak
 * Takımın saf Hücum, Orta Saha ve Savunma gücünü yeniden belirler.
 */
export function gucHesaplaVeGuncelle(takimIsmi) {
    let data = getTakimData(takimIsmi);
    if (!data) return;

    let hucumTop = 0, hucumSay = 0;
    let ortaTop = 0, ortaSay = 0;
    let savTop = 0, savSay = 0;
    let totalGen = 0;

    data.ilk11.forEach(p => {
        totalGen += p.gen;
        if (["SNT", "SLK", "SĞK"].includes(p.mevki)) { 
            hucumTop += p.gen; hucumSay++; 
        }
        else if (["OS"].includes(p.mevki)) { 
            ortaTop += p.gen; ortaSay++; 
        }
        else if (["STP", "SĞB", "SLB", "KL"].includes(p.mevki)) { 
            savTop += p.gen; savSay++; 
        }
    });

    // Eğer kullanıcı fantastik bir şey yapıp hiç forvet koymazsa, takımın genel ortalamasını al
    let hucumOrt = hucumSay > 0 ? (hucumTop / hucumSay) : (totalGen / 11);
    let ortaOrt = ortaSay > 0 ? (ortaTop / ortaSay) : (totalGen / 11);
    let savOrt = savSay > 0 ? (savTop / savSay) : (totalGen / 11);

    // Ana veritabanındaki takım güçlerini anlık olarak güncelle (Engine.js bunları kullanacak)
    data.takim.hucum = Math.round(hucumOrt);
    data.takim.ortaSaha = Math.round(ortaOrt);
    data.takim.savunma = Math.round(savOrt);

    // Dinamik Yıldız Güncellemesi
    let ortGen = totalGen / 11;
    let yildiz = 3.0;
    if (ortGen >= 85) yildiz = 5.0;
    else if (ortGen >= 81) yildiz = 4.5;
    else if (ortGen >= 77) yildiz = 4.0;
    else if (ortGen >= 73) yildiz = 3.5;
    else if (ortGen >= 69) yildiz = 3.0;
    else if (ortGen >= 64) yildiz = 2.5;
    else yildiz = 2.0;

    data.takim.yildiz = yildiz;
}

/**
 * Maçlar başlamadan önce eksik kart/ceza durumunda takım 11'e çıkamazsa 
 * otomatik yedeklerden sağlam oyuncu atayan güvenlik sistemi.
 */
export function cezaliOyunculariYedekleDegistir(takimIsmi) {
    let data = getTakimData(takimIsmi);
    if (!data) return;

    let sorunluOyuncular = data.ilk11.filter(p => !oyuncuOynayabilirMi(p.id));
    
    sorunluOyuncular.forEach(sorunlu => {
        // Aynı mevkide oynayabilen sağlam bir yedek bul
        let saglamYedek = data.yedekler.find(y => y.mevki === sorunlu.mevki && oyuncuOynayabilirMi(y.id));
        
        // Eğer aynı mevkiden bulamazsa herhangi bir sağlam yedek al
        if (!saglamYedek) {
            saglamYedek = data.yedekler.find(y => oyuncuOynayabilirMi(y.id));
        }

        if (saglamYedek) {
            oyuncuDegistir(takimIsmi, sorunlu.id, saglamYedek.id);
            console.log(`OTOMATİK DEĞİŞİKLİK: ${takimIsmi} takımında cezalı/sakat olan ${sorunlu.soyad} yerine ${saglamYedek.soyad} İlk 11'e alındı.`);
        }
    });
}