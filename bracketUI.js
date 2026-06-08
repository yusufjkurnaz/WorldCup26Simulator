// bracketUI.js

// YENİ: Dil ve Ülke Çeviri Sözlüğü Bağlantısı eklendi
import { DIL_SOZLUGU, ulkeCevir } from './lang.js';
import { ayarlariYukle } from './storage.js';

function getDil() {
    let ayarlar = ayarlariYukle();
    return ayarlar && ayarlar.dil ? ayarlar.dil : 'tr';
}
function metinGetir(anahtar) {
    let seciliDil = getDil();
    return DIL_SOZLUGU[seciliDil][anahtar] || DIL_SOZLUGU["tr"][anahtar] || anahtar;
}

export function HTMLGorselAgacOlustur(tumEslesmeler, oynananMaclarHafizasi, kullaniciTakimi = null, aktifTur = "son32") {
    
    // Her bir maç kutusunu çizen yardımcı fonksiyon
    function cizKutu(mac, ekstraSinif = "") {
        if (!mac) return "";
        
        let oynandi = oynananMaclarHafizasi[mac.id] ? true : false;
        let kilitli = (mac.evSahibi.includes("{") || mac.deplasman.includes("{")) && !oynandi;
        
        // YENİ: Takım isimleri veya "Belirsiz" metni dile göre çekiliyor
        let evSahibiAd = kilitli ? metinGetir("belirsiz") : ulkeCevir(mac.evSahibi);
        let deplasmanAd = kilitli ? metinGetir("belirsiz") : ulkeCevir(mac.deplasman);
        
        let skorE = oynandi ? oynananMaclarHafizasi[mac.id].skorE : "";
        let skorD = oynandi ? oynananMaclarHafizasi[mac.id].skorD : "";
        
        let kE = "", kD = ""; 
        let pTxt = ""; 
        
        if(oynandi) {
            let mData = oynananMaclarHafizasi[mac.id];
            if(mData.penalti) {
                pTxt = `<div class="bracket-match-id" style="color:var(--accent-red);">Pen: ${mData.penE}-${mData.penD}</div>`;
                if(mData.penE > mData.penD) { kE = "kazanan"; kD = "opacity:0.5;"; } else { kD = "kazanan"; kE = "opacity:0.5;"; }
            } else {
                if(mData.uzatma) {
                    let uztText = getDil() === 'en' ? 'AET' : (getDil() === 'de' ? 'n.V.' : 'Uzt');
                    pTxt = `<div class="bracket-match-id" style="color:var(--accent-blue);">${uztText}</div>`;
                }
                if(mData.skorE > mData.skorD) { kE = "kazanan"; kD = "opacity:0.5;"; } else { kD = "kazanan"; kE = "opacity:0.5;"; }
            }
        }

        let evSahibiStil = "";
        let deplasmanStil = "";
        
        if (ulkeCevir(kullaniciTakimi) === evSahibiAd && evSahibiAd !== metinGetir("belirsiz")) {
            evSahibiStil = "color: #ffb300; text-shadow: 0 0 8px rgba(255,179,0,0.6); font-weight: bold;";
        }
        if (ulkeCevir(kullaniciTakimi) === deplasmanAd && deplasmanAd !== metinGetir("belirsiz")) {
            deplasmanStil = "color: #ffb300; text-shadow: 0 0 8px rgba(255,179,0,0.6); font-weight: bold;";
        }

        let kilitStili = kilitli ? "kilitli" : "";
        
        return `
        <div class="bracket-match mac-oyna-btn ${kilitStili} ${ekstraSinif}" data-macid="${mac.id}" data-eleme="true">
            <div class="bracket-match-id">${mac.id} ${kilitli ? '🔒' : (oynandi ? '✅' : '▶️')}</div>
            <div class="bracket-team ${kE}" style="${kE ? '' : kE}">
                <span style="${evSahibiStil}">${evSahibiAd}</span>
                <span class="bracket-score">${skorE}</span>
            </div>
            <div class="bracket-team ${kD}" style="${kD ? '' : kD}">
                <span style="${deplasmanStil}">${deplasmanAd}</span>
                <span class="bracket-score">${skorD}</span>
            </div>
            ${pTxt}
        </div>
        `;
    }
    
    let gosterSon32 = (aktifTur === "son32");
    let gosterSon16 = (aktifTur === "son32" || aktifTur === "son16");
    let gosterCeyrek = (aktifTur === "son32" || aktifTur === "son16" || aktifTur === "ceyrekFinal");

    let L_R32_HTML = gosterSon32 ? `<div class="bracket-col">${tumEslesmeler.son32.slice(0, 8).map(m => cizKutu(m)).join('')}</div>` : "";
    let L_R16_HTML = gosterSon16 ? `<div class="bracket-col">${tumEslesmeler.son16.slice(0, 4).map(m => cizKutu(m)).join('')}</div>` : "";
    let L_QF_HTML  = gosterCeyrek ? `<div class="bracket-col">${tumEslesmeler.ceyrekFinal.slice(0, 2).map(m => cizKutu(m)).join('')}</div>` : "";
    let L_SF_HTML  = `<div class="bracket-col">${cizKutu(tumEslesmeler.yariFinal[0])}</div>`;

    let R_R32_HTML = gosterSon32 ? `<div class="bracket-col">${tumEslesmeler.son32.slice(8, 16).map(m => cizKutu(m)).join('')}</div>` : "";
    let R_R16_HTML = gosterSon16 ? `<div class="bracket-col">${tumEslesmeler.son16.slice(4, 8).map(m => cizKutu(m)).join('')}</div>` : "";
    let R_QF_HTML  = gosterCeyrek ? `<div class="bracket-col">${tumEslesmeler.ceyrekFinal.slice(2, 4).map(m => cizKutu(m)).join('')}</div>` : "";
    let R_SF_HTML  = `<div class="bracket-col">${cizKutu(tumEslesmeler.yariFinal[1])}</div>`;

    let THE_FINAL = tumEslesmeler.final[0];
    let BRONZE_MATCH = tumEslesmeler.ucunculuk[0];

    // YENİ: Arayüz metinleri ("FİNAL", "3.LÜK MAÇI") çok dilli yapıya uyarlandı
    return `
    <div class="bracket-wrapper">
        <div class="bracket-container">
            
            <div style="display: flex; flex: 3; justify-content: space-between; gap: 5px;">
                ${L_R32_HTML}
                ${L_R16_HTML}
                ${L_QF_HTML}
                ${L_SF_HTML}
            </div>

            <div class="bracket-col-center">
                <div style="width:100%;">
                    <div class="bracket-final-title">🏆 ${metinGetir('turFinal').toUpperCase()} 🏆</div>
                    ${cizKutu(THE_FINAL, "final-match")}
                </div>
                <div style="width:100%; margin-top: 50px;">
                    <div class="bracket-final-title" style="color:#cd7f32; font-size:1.2rem;">🥉 ${metinGetir('turUcunculuk').toUpperCase()} 🥉</div>
                    ${cizKutu(BRONZE_MATCH, "bronze-match")}
                </div>
            </div>

            <div style="display: flex; flex: 3; justify-content: space-between; gap: 5px; flex-direction: row-reverse;">
                ${R_R32_HTML}
                ${R_R16_HTML}
                ${R_QF_HTML}
                ${R_SF_HTML}
            </div>

        </div>
    </div>
    `;
}