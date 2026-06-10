// ui/ui.js (MODÜLER KAVŞAK DOSYASI)

import { HTMLGorselAgacOlustur } from './bracketUI.js';
import { HTMLIstatistikleriOlustur } from './statsUI.js';
import { HTMLGazeteOlustur } from './newspaperUI.js';
import { HTMLMacDetayiOlustur } from './matchDetailUI.js';

import { DIL_SOZLUGU, ulkeCevir } from '../modules/lang.js';
import { ayarlariYukle } from '../modules/storage.js';

function getDil() {
    let ayarlar = ayarlariYukle();
    return ayarlar && ayarlar.dil ? ayarlar.dil : 'tr';
}
function metinGetir(anahtar) {
    let seciliDil = getDil();
    return DIL_SOZLUGU[seciliDil][anahtar] || DIL_SOZLUGU["tr"][anahtar] || anahtar;
}

export const DOM = {
    globalMacGunuMetni: document.getElementById("global-mac-gunu"),
    btnMacGunuTamamla: document.getElementById("btn-macgunu-tamamla"),
    btnSon32Gec: document.getElementById("btn-son-32-gec"),
    panelAksiyonlar: document.getElementById("panel-aksiyonlar"),
    macLoglariDiv: document.getElementById("mac-loglari"),
    puanTablosuAlani: document.getElementById("puan-tablosu-alani"),
    macIcerikAlani: document.getElementById("mac-icerik-alani"),
    loadingEkrani: document.getElementById("loading-ekrani"),
    sekmeButonlari: document.querySelectorAll(".sekme-btn"),
    sekmeUcunculer: document.getElementById("sekme-ucunculer"),
    
    btnGruplariGoster: document.getElementById("btn-gruplari-goster"),
    grupSekmeleriAlani: document.getElementById("sekmeler-alani"),
    elemeSekmeleriAlani: document.getElementById("eleme-sekmeleri-alani"),
    btnSonrakiTuraGec: document.getElementById("btn-sonraki-tura-gec"),
    btnIstatistikleriGoster: document.getElementById("btn-istatistikleri-goster"),
    istatistikModal: document.getElementById("istatistik-modal"),
    istatistikListesi: document.getElementById("modal-istatistik-listesi"),
    btnIstatistikKapat: document.getElementById("btn-istatistik-kapat"),
    
    modal: document.getElementById("reset-modal"),
    btnResetOnay: document.getElementById("btn-reset-onay"),
    btnResetIptal: document.getElementById("btn-reset-iptal"),

    viewMainMenu: document.getElementById("view-main-menu"),
    viewGame: document.getElementById("view-game"),
    viewPrivacy: document.getElementById("view-privacy"),
    viewContact: document.getElementById("view-contact"), 
    viewTeamSelect: document.getElementById("view-team-select"), 
    
    viewModeSelect: document.getElementById("view-mode-select"),
    viewTactics: document.getElementById("view-tactics"),
    btnModA: document.getElementById("btn-mod-a"),
    btnModB: document.getElementById("btn-mod-b"),
    btnModC: document.getElementById("btn-mod-c"),
    btnTaktikEkraniAc: document.getElementById("btn-taktik-ekrani-ac"),
    btnTaktikKapat: document.getElementById("btn-taktik-kapat"),

    btnAnasayfaDon: document.getElementById("btn-anasayfa-don"),
    btnTemaDegistir: document.getElementById("btn-tema-degistir"),
    dilButonlari: document.querySelectorAll(".dil-secenekleri span"), 

    slotIcerik1: document.getElementById("slot-1-icerik"),
    slotIcerik2: document.getElementById("slot-2-icerik"),
    slotIcerik3: document.getElementById("slot-3-icerik"),
    slotIcerik4: document.getElementById("slot-4-icerik"),
    slotIcerik5: document.getElementById("slot-5-icerik"),

    seciliTakimPaneli: document.getElementById("secili-takim-paneli"),
    secilenTakimIsim: document.getElementById("secilen-takim-isim"),
    secilenTakimGrup: document.getElementById("secilen-takim-grup"),
    btnKariyeriBaslat: document.getElementById("btn-kariyeri-baslat"),
    takimGridAlani: document.getElementById("takim-grid-alani"),
    btnTeamSelectIptal: document.getElementById("btn-team-select-iptal"),
    aktifKariyerBilgisi: document.getElementById("aktif-kariyer-bilgisi"),

    linkGizlilik: document.getElementById("link-gizlilik"),
    btnPrivacyKapat: document.getElementById("btn-privacy-kapat"),
    linkIletisim: document.getElementById("link-iletisim"), 
    btnContactKapat: document.getElementById("btn-contact-kapat"), 
    iletisimFormu: document.getElementById("iletisim-formu"),
    btnFormGonder: document.getElementById("btn-form-gonder"),
    emailInput: document.getElementById("email"),
    modalFormSuccess: document.getElementById("form-success-modal"),
    btnFormSuccessKapat: document.getElementById("btn-form-success-kapat"),

    matchDetailModal: document.getElementById("match-detail-modal"),
    matchDetailContent: document.getElementById("match-detail-content"),
    newspaperModal: document.getElementById("newspaper-modal"),
    newspaperContent: document.getElementById("newspaper-content"),
    celebrationContainer: document.getElementById("celebration-container"),

    btnHaberlerEkraniAc: document.getElementById("btn-haberler-ekrani-ac"),
    btnNewspaperKapat: document.getElementById("btn-newspaper-kapat")
};

export { HTMLGorselAgacOlustur, HTMLIstatistikleriOlustur, HTMLGazeteOlustur, HTMLMacDetayiOlustur };

export function istatistikleriEkranaBas(takimlarListesi) {
    DOM.istatistikListesi.innerHTML = HTMLIstatistikleriOlustur(takimlarListesi);
}

export function animasyonluYukle(sure, callback) {
    DOM.loadingEkrani.style.display = "flex";
    DOM.macIcerikAlani.style.opacity = "0.2";
    let guvenliSure = (typeof sure === 'number') ? sure : 600;
    setTimeout(() => {
        DOM.loadingEkrani.style.display = "none";
        DOM.macIcerikAlani.style.opacity = "1";
        callback(); 
    }, guvenliSure);
}

export function slotlariArayuzeCiz(slotlarData) {
    [1, 2, 3, 4, 5].forEach(id => {
        const data = slotlarData[id];
        const icerikKutusu = DOM[`slotIcerik${id}`];
        if (!icerikKutusu) return;

        if (data === null) {
            icerikKutusu.innerHTML = `
                <p style="color: var(--text-muted); font-style: italic; margin-top: 15px; margin-bottom: 25px;">${metinGetir('bosSlot')}</p>
                <button class="btn-dev btn-slot-yeni" data-slot="${id}">${metinGetir('yeniKariyerAç')}</button>
            `;
        } else {
            let bitenMacSayisi = Object.keys(data.oynananMaclar || {}).length;
            let yuzde = Math.floor((bitenMacSayisi / 104) * 100); 
            let durumMetni = "";
            if(data.aktifTur === "final" && bitenMacSayisi === 104) durumMetni = metinGetir('durumSampiyon');
            else if(data.aktifTur === "son32") durumMetni = metinGetir('durumSon32');
            else if(data.aktifTur === "son16") durumMetni = metinGetir('durumSon16');
            else if(data.aktifTur === "ceyrekFinal") durumMetni = metinGetir('durumCeyrek');
            else if(data.aktifTur === "yariFinal") durumMetni = metinGetir('durumYari');
            else durumMetni = `${data.globalMacGunu || 1}. ${metinGetir('durumGrup')}`;
            
            let secilenTakim = data.kullaniciTakimi ? ulkeCevir(data.kullaniciTakimi) : metinGetir('menajersiz');
            let modMetni = data.secilenOyunModu === 'c' ? "Taktik Modu" : (data.secilenOyunModu === 'b' ? "Özel Gruplar" : "Hızlı Simüle");

            icerikKutusu.innerHTML = `
                <div style="text-align: left; margin-top: 10px; margin-bottom: 20px; line-height: 1.5;">
                    <div style="font-weight: bold; color: var(--text-main);">${metinGetir('tabloTakim')}: <span style="color:#ffb300;">⭐ ${secilenTakim}</span></div>
                    <div style="font-size: 0.9rem; color: var(--text-muted); margin-top: 4px;">Mod: ${modMetni}</div>
                    <div style="font-size: 0.9rem; color: var(--text-muted); margin-top: 4px;">${metinGetir('turnuvaDurumu')}: ${durumMetni}</div>
                    <div style="font-size: 0.9rem; color: var(--accent-blue); font-weight: bold; margin-top: 4px;">${metinGetir('ilerleme')}: %${yuzde}</div>
                </div>
                <button class="btn-dev btn-slot-devam" data-slot="${id}">${metinGetir('devamEt')}</button>
                <button class="btn-slot-sil" data-slot="${id}">${metinGetir('kariyeriSil')}</button>
            `;
        }
    });
}

export function takimSecimGridiniCiz(takimlarListesi, gruplarListesi, seciliTakimIsmi = null) {
    let gridHTML = "";
    gruplarListesi.forEach(grupHarfi => {
        let grupTakimlari = takimlarListesi.filter(t => t.grup === grupHarfi);
        gridHTML += `<div class="grup-kart"><div class="grup-kart-baslik">${metinGetir('grupMetni')} ${grupHarfi}</div>`;
        grupTakimlari.forEach(t => {
            let seciliSinif = (seciliTakimIsmi === t.isim) ? "secili" : "";
            let favoriYildizi = (seciliTakimIsmi === t.isim) ? "<span style='color:#ffb300; font-weight:bold;'>⭐</span>" : "";
            let yildizGorsel = "⭐".repeat(t.yildiz || 3);

            gridHTML += `
                <div class="takim-secenek ${seciliSinif}" data-takim="${t.isim}" data-grup="${grupHarfi}">
                    <span>${ulkeCevir(t.isim)} ${favoriYildizi}</span>
                    <div class="takim-tooltip">
                        <div class="tooltip-yildiz">${yildizGorsel}</div>
                        <div class="tooltip-stat">${metinGetir('hucum')}: <span>${t.hucum}</span></div>
                        <div class="tooltip-stat">${metinGetir('ortaSaha')}: <span>${t.ortaSaha}</span></div>
                        <div class="tooltip-stat">${metinGetir('savunma')}: <span>${t.savunma}</span></div>
                    </div>
                </div>
            `;
        });
        gridHTML += `</div>`; 
    });
    DOM.takimGridAlani.innerHTML = gridHTML;
}

export function HTMLPuanTablosuOlustur(takimlarDizisi, tumGrupBittiMi, tumUcunculerListesi, kullaniciTakimi = null) {
    let tabloHTML = `
        <div style="text-align: right; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 5px;">
            [<span style="color:var(--success-green);">▲ ${metinGetir('formda')}</span>] 
            [<span style="color:var(--text-muted);">■ ${metinGetir('stabil')}</span>] 
            [<span style="color:var(--accent-red);">▼ ${metinGetir('formsuz')}</span>]
        </div>
        <table class="puan-tablosu" style="margin-bottom: 25px;">
            <thead>
                <tr>
                    <th style="text-align: left;">${metinGetir('tabloTakim')}</th>
                    <th>${metinGetir('tabloO')}</th><th>${metinGetir('tabloG')}</th><th>${metinGetir('tabloB')}</th><th>${metinGetir('tabloM')}</th><th>${metinGetir('tabloAG')}</th><th>${metinGetir('tabloYG')}</th><th>${metinGetir('tabloAV')}</th><th>${metinGetir('tabloP')}</th>
                </tr>
            </thead>
            <tbody>
    `;

    // SİLİNEN DÖNGÜ GERİ GELDİ
    takimlarDizisi.forEach(t => {
        let ekstraSinif = (tumGrupBittiMi && tumUcunculerListesi.slice(0, 8).includes(t)) ? "en-iyi-ucuncu" : "";
        let moralGorsel = "";
        if (t.moral > 1.0) moralGorsel = `<span style="color:var(--success-green); font-size:0.9rem; margin-left:8px;" title="${metinGetir('formda')}">▲</span>`;
        else if (t.moral < 1.0) moralGorsel = `<span style="color:var(--accent-red); font-size:0.9rem; margin-left:8px;" title="${metinGetir('formsuz')}">▼</span>`;
        else moralGorsel = `<span style="color:var(--text-muted); font-size:0.9rem; margin-left:8px;" title="${metinGetir('stabil')}">■</span>`;

        let kendiTakimStili = (kullaniciTakimi === t.isim) ? "color: #ffb300; font-weight: 900;" : "";
        let isimEki = (kullaniciTakimi === t.isim) ? " ⭐" : "";

        tabloHTML += `
            <tr class="${ekstraSinif}">
                <td style="text-align: left; font-weight: bold; ${kendiTakimStili}">${ulkeCevir(t.isim)}${isimEki} ${moralGorsel}</td>
                <td>${t.oynadigiMac}</td><td>${t.galibiyet}</td><td>${t.beraberlik}</td><td>${t.maglubiyet}</td>
                <td>${t.atilanGol}</td><td>${t.yenilenGol}</td><td>${t.averaj}</td>
                <td style="font-weight: bold; color: var(--accent-red);">${t.puan}</td>
            </tr>
        `;
    });

    tabloHTML += `</tbody></table>`;
    return tabloHTML;
}

export function HTMLGrupFiksturuOlustur(grupFikstur, oynananMaclarHafizasi, globalMacGunu, kullaniciTakimi = null) {
    let html = '';
    [1, 2, 3].forEach(gun => {
        let gunMaclari = grupFikstur.filter(m => m.macGunu === gun);
        if(gunMaclari.length > 0) {
            html += `<h4 style="color: var(--accent-blue); margin: 15px 0 10px 0;">${gun}. ${metinGetir('durumGrup')}</h4>`;
            gunMaclari.forEach(m => {
                let durumSinif = ""; 
                let skorAlan = ""; 
                let aksiyonAlan = "";
                let kendiMacSiniri = (kullaniciTakimi === m.evSahibi || kullaniciTakimi === m.deplasman) ? "border-left: 5px solid #ffb300; background-color: rgba(255,179,0,0.03);" : "";
                
                let rowTiklanabilirlik = "";
                let rowCursor = "";

                if (oynananMaclarHafizasi[m.id]) {
                    durumSinif = "oynandi"; // YAZIM HATASI DÜZELTİLDİ
                    rowTiklanabilirlik = "mac-oyna-btn"; 
                    rowCursor = "cursor: pointer;";
                    
                    skorAlan = `<div class="skor-kutusu"><span class="skor-ana">${oynananMaclarHafizasi[m.id].skorE} - ${oynananMaclarHafizasi[m.id].skorD}</span></div>`;
                    aksiyonAlan = `<button class="btn-kucuk" style="padding: 4px 10px; font-size: 1rem; border: none; background: transparent;" title="${metinGetir('macRaporuBaslik')}">📊</button>`;
                } else if (gun > globalMacGunu) {
                    durumSinif = "kilitli";
                    skorAlan = `<div class="skor-kutusu" style="opacity: 0.3; font-weight: normal;"><span class="skor-ana">&nbsp;v&nbsp;</span></div>`;
                    aksiyonAlan = `<span class="kilit-ikon" title="${gun}. ${metinGetir('durumGrup')} henüz başlamadı.">🔒</span>`;
                } else {
                    skorAlan = `<div class="skor-kutusu" style="opacity: 0.5; font-weight: normal;"><span class="skor-ana">&nbsp;v&nbsp;</span></div>`;
                    aksiyonAlan = `<button class="btn-oyna mac-oyna-btn" data-macid="${m.id}" data-eleme="false">${metinGetir('macOynaButon')}</button>`;
                }

                html += `
                <div class="mac-satiri ${durumSinif} ${rowTiklanabilirlik}" data-macid="${m.id}" data-eleme="false" style="${kendiMacSiniri} ${rowCursor}">
                    <div class="mac-detay">
                        <div class="takim-sol" style="${kullaniciTakimi === m.evSahibi ? 'color:#ffb300; font-weight:bold;' : ''}">${ulkeCevir(m.evSahibi)}</div>
                        <div class="skor-alan">${skorAlan}</div>
                        <div class="takim-sag" style="${kullaniciTakimi === m.deplasman ? 'color:#ffb300; font-weight:bold;' : ''}">${ulkeCevir(m.deplasman)}</div>
                    </div>
                    <div class="mac-aksiyon">${aksiyonAlan}</div>
                </div>`;
            });
        }
    });
    return html;
}

export function HTMLElemeFiksturuOlustur(elemeMaclari, oynananMaclarHafizasi, kullaniciTakimi = null) {
    let html = '';
    
    elemeMaclari.forEach(m => {
        let durumSinif = "";
        let skorAlan = "";
        let aksiyonAlan = "";

        if (m.evSahibi.includes("{") || m.deplasman.includes("{")) {
            durumSinif = "kilitli";
            skorAlan = `<div class="skor-kutusu" style="opacity: 0.3; font-weight: normal;"><span class="skor-ana">?</span></div>`;
            aksiyonAlan = `<span class="kilit-ikon" title="Önceki turların tamamlanması bekleniyor.">🔒</span>`;
            
            html += `
            <div class="mac-satiri ${durumSinif}">
                <div class="mac-detay">
                    <div class="takim-sol" style="color:var(--text-muted); font-style:italic;">${metinGetir('belirsiz')}</div>
                    <div class="skor-alan">${skorAlan}</div>
                    <div class="takim-sag" style="color:var(--text-muted); font-style:italic;">${metinGetir('belirsiz')}</div>
                </div>
                <div class="mac-aksiyon">${aksiyonAlan}</div>
            </div>`;
        } 
        else {
            let kendiMacSiniri = (kullaniciTakimi === m.evSahibi || kullaniciTakimi === m.deplasman) ? "border-left: 5px solid #ffb300; background-color: rgba(255,179,0,0.03);" : "";
            
            if (oynananMaclarHafizasi[m.id]) {
                let macSonucu = oynananMaclarHafizasi[m.id];
                durumSinif = "oynandi";
                
                let skorHTML = `<span class="skor-ana">${macSonucu.skorE} - ${macSonucu.skorD}</span>`;
                
                if (macSonucu.penalti) {
                    skorHTML += `<span class="skor-ekstra">(Pen: ${macSonucu.penE}-${macSonucu.penD})</span>`;
                } else if (macSonucu.uzatma) {
                    skorHTML += `<span class="skor-ekstra">(Uzt)</span>`;
                }

                skorAlan = `<div class="skor-kutusu">${skorHTML}</div>`;
            } else {
                skorAlan = `<div class="skor-kutusu" style="opacity: 0.5; font-weight: normal;"><span class="skor-ana">&nbsp;v&nbsp;</span></div>`;
                aksiyonAlan = `<button class="btn-oyna mac-oyna-btn" data-macid="${m.id}" data-eleme="true">${metinGetir('macOynaButon')}</button>`;
            }

            html += `
            <div class="mac-satiri ${durumSinif}" style="${kendiMacSiniri}">
                <div class="mac-detay">
                    <div class="takim-sol" style="${kullaniciTakimi === m.evSahibi ? 'color:#ffb300; font-weight:bold;' : ''}">${ulkeCevir(m.evSahibi)}</div>
                    <div class="skor-alan">${skorAlan}</div>
                    <div class="takim-sag" style="${kullaniciTakimi === m.deplasman ? 'color:#ffb300; font-weight:bold;' : ''}">${ulkeCevir(m.deplasman)}</div>
                </div>
                <div class="mac-aksiyon">${aksiyonAlan}</div>
            </div>`;
        }
    });

    return html;
}