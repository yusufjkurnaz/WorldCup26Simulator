// ui/tournamentReportUI.js

import { DIL_SOZLUGU, ulkeCevir } from '../modules/lang.js';
import { ayarlariYukle } from '../modules/storage.js';
import { bireyselOdulleriHesapla } from '../modules/awardsManager.js';

function getDil() {
    let ayarlar = ayarlariYukle();
    return ayarlar && ayarlar.dil ? ayarlar.dil : 'tr';
}

function metinGetir(anahtar) {
    let seciliDil = getDil();
    return DIL_SOZLUGU[seciliDil][anahtar] || DIL_SOZLUGU["tr"][anahtar] || anahtar;
}

export function HTMLTurnuvaRaporuOlustur(takimlarListesi, oyuncuIstatistikleri, sampiyonTakimIsmi) {
    let aktifTakimlar = takimlarListesi.filter(t => t.oynadigiMac > 0);
    let oduller = bireyselOdulleriHesapla(oyuncuIstatistikleri, takimlarListesi, sampiyonTakimIsmi);
    let { golKrali, asistKrali, mvp, gencMvp, altinEldiven } = oduller;

    if (!aktifTakimlar.length || !golKrali) {
        return `<div style="padding:40px; text-align:center; color:var(--text-muted); font-style:italic;">${metinGetir('henuzYok')}</div>`;
    }

    const formatOyuncuAdi = (p) => p ? (p.soyad ? `${p.ad.charAt(0)}. ${p.soyad}` : p.ad) : "---";

    aktifTakimlar.forEach(t => {
        t.bitiricilik = t.toplamSut > 0 ? ((t.atilanGol / t.toplamSut) * 100) : 0;
        t.macBasiYenilen = t.yenilenGol / t.oynadigiMac;
        t.macBasiFaul = t.faul / t.oynadigiMac;
    });

    let enKeskinler = [...aktifTakimlar].filter(t => t.atilanGol > 0).sort((a, b) => b.bitiricilik - a.bitiricilik);
    let enKeskin = enKeskinler.length > 0 ? enKeskinler[0] : { isim: "---", bitiricilik: 0 };
    let enKotuDefans = [...aktifTakimlar].sort((a, b) => b.macBasiYenilen - a.macBasiYenilen)[0];
    let enKasap = [...aktifTakimlar].sort((a, b) => {
        if (b.kirmiziKart !== a.kirmiziKart) return b.kirmiziKart - a.kirmiziKart;
        return b.macBasiFaul - a.macBasiFaul;
    })[0];

    let enSurpriz = [...aktifTakimlar].sort((a, b) => b.surprizPuani - a.surprizPuani)[0] || { isim: "---" };
    let enHayalKirikligi = [...aktifTakimlar].sort((a, b) => b.hayalKirikligiPuani - a.hayalKirikligiPuani)[0] || { isim: "---" };

    if (enSurpriz.surprizPuani === 0) enSurpriz = { isim: "---" };
    if (enHayalKirikligi.hayalKirikligiPuani === 0) enHayalKirikligi = { isim: "---" };

    const odulKartiOlustur = (trophyEmoji, odulAdi, oyuncu, istatistikMetni, renkClass) => `
        <div style="background: var(--bg-tertiary); border: 2px solid var(--border-color); border-radius: 10px; padding: 12px 8px; text-align: center; position: relative; box-shadow: 0 4px 10px rgba(0,0,0,0.15); display: flex; flex-direction: column; justify-content: space-between; min-height: 190px;">
            <div>
                <div style="font-size: 2rem; margin-bottom: 3px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">${trophyEmoji}</div>
                <div style="font-size: 0.75rem; font-weight: bold; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; line-height: 1.1;">${odulAdi}</div>
                <div style="font-size: 1.05rem; font-weight: bold; color: ${renkClass}; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${formatOyuncuAdi(oyuncu)}</div>
                <div style="font-size: 0.8rem; color: var(--text-main); font-weight: 500; margin-bottom: 8px;">${oyuncu ? ulkeCevir(oyuncu.takim) : ""}</div>
            </div>
            <div style="background: var(--bg-main); border-radius: 6px; padding: 4px; font-size: 0.8rem; font-weight: bold; color: var(--text-muted); border: 1px solid var(--border-color); margin-top: auto;">${istatistikMetni}</div>
        </div>
    `;

    return `
        <style>
            #istatistik-modal { max-width: 960px !important; width: 95% !important; }
            #modal-istatistik-listesi { max-height: 65vh !important; overflow-y: auto !important; overflow-x: hidden !important; padding-right: 5px; scrollbar-width: thin; }
            .rapor-grid-kart { background: var(--bg-tertiary); border: 1px solid var(--border-color); padding: 12px 15px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; box-sizing: border-box; width: 100%; }
            .rapor-kart-sol { display: flex; flex-direction: column; gap: 4px; overflow: hidden; }
            .rapor-kart-baslik { font-size: 0.8rem; font-weight: bold; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
            .rapor-kart-takim { font-size: 1.1rem; font-weight: bold; color: var(--text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .rapor-kart-sag { background: var(--bg-main); border: 1px solid var(--border-color); padding: 6px 12px; border-radius: 6px; font-weight: bold; font-size: 0.9rem; text-align: center; color: var(--text-muted); min-width: 80px; flex-shrink: 0; }
        </style>

        <div style="display:flex; flex-direction:column; gap:20px; width:100%; box-sizing: border-box; overflow-x: hidden;">
            
            <div>
                <h3 style="color: #ffb300; text-shadow: 0 0 10px rgba(255,179,0,0.2); text-align:center; margin-top:0; margin-bottom:12px; font-size:1.05rem; letter-spacing:1px;">⭐ TURNUVANIN BİREYSEL ENLERİ ⭐</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 10px; width: 100%;">
                    ${odulKartiOlustur("👑", metinGetir('turnuvaninMvp') || "TURNUVANIN EN İYİSİ", mvp, `${mvp ? mvp.ortalamaReyting : "0.0"} REYTİNG`, "var(--success-green)")}
                    ${odulKartiOlustur("✨", "EN İYİ GENÇ OYUNCU (U23)", gencMvp, `${gencMvp ? gencMvp.ortalamaReyting : "0.0"} REYTİNG`, "#9b59b6")}
                    ${odulKartiOlustur("🥇", metinGetir('altinAyakkabi') || "ALTIN AYAKKABI", golKrali, `${golKrali ? golKrali.gol : 0} GOL`, "var(--accent-red)")}
                    ${odulKartiOlustur("🎯", metinGetir('asistKraliUnvan') || "ASİST KRALI", asistKrali, `${asistKrali ? asistKrali.asist : 0} ASİST`, "var(--accent-blue)")}
                    ${odulKartiOlustur("🧤", metinGetir('altinEldivenUnvan') || "ALTIN ELDİVEN", altinEldiven, `${altinEldiven ? altinEldiven.cleanSheet : 0} MAÇ GOL YEMEDİ`, "#e67e22")}
                </div>
            </div>

            <div>
                <h3 style="color: var(--accent-blue); text-align:center; margin-bottom:12px; font-size:1.05rem; letter-spacing:1px;">📊 GLOBAL TURNUVA RAPORU 📊</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 10px; width: 100%;">
                    
                    <div class="rapor-grid-kart">
                        <div class="rapor-kart-sol">
                            <span class="rapor-kart-baslik">${metinGetir('keskinNisanci')}</span>
                            <span class="rapor-kart-takim">${ulkeCevir(enKeskin.isim)}</span>
                        </div>
                        <div class="rapor-kart-sag" style="color: var(--success-green);">%${enKeskin.bitiricilik.toFixed(1)} <br><span style="font-size:0.7rem; font-weight:normal;">${metinGetir('golOrani')}</span></div>
                    </div>

                    <div class="rapor-grid-kart">
                        <div class="rapor-kart-sol">
                            <span class="rapor-kart-baslik">${metinGetir('enKotuDefans')}</span>
                            <span class="rapor-kart-takim">${ulkeCevir(enKotuDefans.isim)}</span>
                        </div>
                        <div class="rapor-kart-sag" style="color: var(--accent-red);">${enKotuDefans.macBasiYenilen.toFixed(2)} <br><span style="font-size:0.7rem; font-weight:normal;">${metinGetir('ygMac')}</span></div>
                    </div>

                    <div class="rapor-grid-kart" style="border-left: 4px solid var(--success-green);">
                        <div class="rapor-kart-sol">
                            <span class="rapor-kart-baslik">${metinGetir('enBüyükSurpriz')}</span>
                            <span class="rapor-kart-takim" style="color: var(--success-green);">${ulkeCevir(enSurpriz.isim)}</span>
                        </div>
                        <div class="rapor-kart-sag">⭐ SURPRİZ</div>
                    </div>

                    <div class="rapor-grid-kart" style="border-left: 4px solid var(--accent-red);">
                        <div class="rapor-kart-sol">
                            <span class="rapor-kart-baslik">${metinGetir('hayalKirikligi')}</span>
                            <span class="rapor-kart-takim" style="color: var(--accent-red);">${ulkeCevir(enHayalKirikligi.isim)}</span>
                        </div>
                        <div class="rapor-kart-sag">❌ BEKLENTİ</div>
                    </div>

                    <div class="rapor-grid-kart" style="grid-column: 1 / -1; background: rgba(225, 29, 72, 0.04); border-color: rgba(225, 29, 72, 0.2);">
                        <div class="rapor-kart-sol">
                            <span class="rapor-kart-baslik" style="color:var(--accent-red); font-weight:bold;">🚨 ${metinGetir('enKasapTakim')}</span>
                            <span class="rapor-kart-takim">${ulkeCevir(enKasap.isim)}</span>
                        </div>
                        <div class="rapor-kart-sag" style="color: var(--accent-red); border-color: rgba(225, 29, 72, 0.3);">
                            ${enKasap.kirmiziKart} 🟥 &nbsp;|&nbsp; ${enKasap.macBasiFaul.toFixed(1)} <span style="font-size:0.75rem; font-weight:normal;">${metinGetir('faulMac')}</span>
                        </div>
                    </div>

                </div>
            </div>

        </div>
    `;
}