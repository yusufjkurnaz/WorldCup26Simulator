// modules/tournamentManager.js

import { takimlar, gruplarListesi, resmiFikstur } from '../data/teams.js';

/**
 * Grup aşaması için dinamik fikstür kombinasyonları oluşturur.
 */
export function dinamikFiksturYarat() {
    resmiFikstur.length = 0; 
    let macID = 1;
    gruplarListesi.forEach(grupHarfi => {
        let gTakimlari = takimlar.filter(t => t.grup === grupHarfi).map(t => t.isim);
        resmiFikstur.push({ id: `M${macID++}`, macGunu: 1, grup: grupHarfi, tarih: "Dinamik", saat: "Oto", evSahibi: gTakimlari[0], deplasman: gTakimlari[1] });
        resmiFikstur.push({ id: `M${macID++}`, macGunu: 1, grup: grupHarfi, tarih: "Dinamik", saat: "Oto", evSahibi: gTakimlari[2], deplasman: gTakimlari[3] });
        resmiFikstur.push({ id: `M${macID++}`, macGunu: 2, grup: grupHarfi, tarih: "Dinamik", saat: "Oto", evSahibi: gTakimlari[0], deplasman: gTakimlari[2] });
        resmiFikstur.push({ id: `M${macID++}`, macGunu: 2, grup: grupHarfi, tarih: "Dinamik", saat: "Oto", evSahibi: gTakimlari[3], deplasman: gTakimlari[1] });
        resmiFikstur.push({ id: `M${macID++}`, macGunu: 3, grup: grupHarfi, tarih: "Dinamik", saat: "Oto", evSahibi: gTakimlari[1], deplasman: gTakimlari[2] });
        resmiFikstur.push({ id: `M${macID++}`, macGunu: 3, grup: grupHarfi, tarih: "Dinamik", saat: "Oto", evSahibi: gTakimlari[3], deplasman: gTakimlari[0] });
    });
}

/**
 * Grup aşaması bitiminde liderleri ve en iyi 3.'leri Son 32 turuna yerleştirir.
 */
export function eslesmeleriBelirle(tumUcunculer, elemeEslesmeleri) {
    let liderler = {}, ikinciler = {};
    gruplarListesi.forEach(grupHarfi => {
        let g = takimlar.filter(t => t.grup === grupHarfi).sort((a, b) => {
            if (b.puan !== a.puan) return b.puan - a.puan;
            if (b.averaj !== a.averaj) return b.averaj - a.averaj;
            return b.atilanGol - a.atilanGol;
        });
        liderler[grupHarfi] = g[0].isim;
        ikinciler[grupHarfi] = g[1].isim;
    });

    let eIU = tumUcunculer.slice(0, 8); 
    let havuz3 = eIU.map(t => t.isim);

    elemeEslesmeleri.son32.forEach(mac => {
        if (mac.evSahibi.startsWith("{") && mac.evSahibi.endsWith("}")) {
            let kod = mac.evSahibi.replace("{", "").replace("}", "");
            if (kod.startsWith("X3")) {
                if (havuz3.length > 0) mac.evSahibi = havuz3.shift(); 
            } else {
                let grup = kod.charAt(0);
                let derece = kod.charAt(1);
                if (derece === "1") mac.evSahibi = liderler[grup];
                else if (derece === "2") mac.evSahibi = ikinciler[grup];
            }
        }
        
        if (mac.deplasman.startsWith("{") && mac.deplasman.endsWith("}")) {
            let kod = mac.deplasman.replace("{", "").replace("}", "");
            if (kod.startsWith("X3")) {
                if (havuz3.length > 0) mac.deplasman = havuz3.shift(); 
            } else {
                let grup = kod.charAt(0);
                let derece = kod.charAt(1);
                if (derece === "1") mac.deplasman = liderler[grup];
                else if (derece === "2") mac.deplasman = ikinciler[grup];
            }
        }
    });
}

/**
 * Bir sonraki eleme aşamasının ismini döner.
 */
export function turaGoreSiradakiAsama(aktifTur) {
    if (aktifTur === "son32") return "son16";
    if (aktifTur === "son16") return "ceyrekFinal";
    if (aktifTur === "ceyrekFinal") return "yariFinal";
    if (aktifTur === "yariFinal") return "ucunculuk"; 
    if (aktifTur === "ucunculuk") return "final";    
    return null;
}

/**
 * Bütün grupların 3. sıradaki takımlarını toplar ve genel averaja göre sıralar.
 */
export function turnuvayiTamamla(oynananMaclar) {
    let toplamBitenGrupMaci = Object.keys(oynananMaclar).filter(id => id.startsWith("M")).length;
    if (toplamBitenGrupMaci < 72) return []; 

    let yeniUcunculer = [];
    gruplarListesi.forEach(grupHarfi => {
        let g = takimlar.filter(t => t.grup === grupHarfi).sort((a, b) => {
            if (b.puan !== a.puan) return b.puan - a.puan;
            if (b.averaj !== a.averaj) return b.averaj - a.averaj;
            return b.atilanGol - a.atilanGol;
        });
        yeniUcunculer.push(g[2]); 
    });
    
    yeniUcunculer.sort((a, b) => {
        if (b.puan !== a.puan) return b.puan - a.puan;
        if (b.averaj !== a.averaj) return b.averaj - a.averaj;
        return b.atilanGol - a.atilanGol;
    });
    
    return yeniUcunculer;
}