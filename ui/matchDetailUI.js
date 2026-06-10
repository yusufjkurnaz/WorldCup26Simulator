// ui/matchDetailUI.js

import { DIL_SOZLUGU, ulkeCevir } from '../modules/lang.js';
import { ayarlariYukle } from '../modules/storage.js';
import { kadrolar } from '../data/squads.js'; 

function getDil() {
    let ayarlar = ayarlariYukle();
    return ayarlar && ayarlar.dil ? ayarlar.dil : 'tr';
}

function metinGetir(anahtar) {
    let seciliDil = getDil();
    return DIL_SOZLUGU[seciliDil][anahtar] || DIL_SOZLUGU["tr"][anahtar] || anahtar;
}

export function HTMLMacDetayiOlustur(macDurumu, evSahibiAd, deplasmanAd) {
    const xGE = macDurumu.xGE ?? "0.00";
    const xGD = macDurumu.xGD ?? "0.00";
    const toplaOynamaE = macDurumu.toplaOynamaE ?? 50;
    const toplaOynamaD = macDurumu.toplaOynamaD ?? 50;
    const sutE = macDurumu.sutE ?? 0;
    const sutD = macDurumu.sutD ?? 0;
    const faulE = macDurumu.faulE ?? 0;
    const faulD = macDurumu.faulD ?? 0;

    let kirmiziE = macDurumu.kirmiziE ?? 0; 
    let kirmiziD = macDurumu.kirmiziD ?? 0;
    let sariE = 0; let sariD = 0;
    
    if (macDurumu.olaylar) {
        macDurumu.olaylar.forEach(o => {
            if(o.tur === "SARI_KART") {
                if(o.takim === macDurumu.isimE) sariE++; else sariD++;
            }
            else if(o.tur === "KIRMIZI_KART" || o.tur === "IKINCI_SARI") {
                if(o.takim === macDurumu.isimE) kirmiziE++; else kirmiziD++;
            }
        });
    }

    const finalEvSahibi = ulkeCevir(evSahibiAd);
    const finalDeplasman = ulkeCevir(deplasmanAd);

    const formatOyuncuAdi = (p) => {
        if (!p) return "";
        return p.soyad ? `${p.ad.charAt(0)}. ${p.soyad}` : p.ad;
    };

    // --- ORTA SÜTUN: ZAMAN TÜNELİ (TIMELINE) ---
    let timelineHTML = "";
    if (macDurumu.olaylar && macDurumu.olaylar.length > 0) {
        timelineHTML += `
            <div style="max-height: 240px; overflow-y: auto; position: relative; padding: 10px 5px; border: 1px dashed var(--border-color); border-radius: 8px; background: var(--bg-main); scrollbar-width: thin;">
                <div style="position: absolute; top: 0; bottom: 0; left: 50%; width: 2px; background: var(--border-color); transform: translateX(-50%); z-index: 1;"></div>
        `;
        
        macDurumu.olaylar.forEach(olay => {
            let isEvSahibi = olay.takim === macDurumu.isimE;
            let ikon = "";
            let detayMetni = "";

            if (olay.tur === "GOL") {
                ikon = "⚽";
                detayMetni = `<span style="font-weight: bold; color: var(--text-main); font-size: 0.85rem;">${formatOyuncuAdi(olay.golcu)}</span>`;
                if (olay.asist) {
                    detayMetni += ` <span style="font-size: 0.75rem; color: var(--text-muted); block">(${formatOyuncuAdi(olay.asist)})</span>`;
                }
            } else if (olay.tur === "SARI_KART") {
                ikon = "🟨";
                detayMetni = `<span style="color: var(--text-main); font-size: 0.85rem;">${formatOyuncuAdi(olay.oyuncu)}</span>`;
            } else if (olay.tur === "IKINCI_SARI") {
                ikon = "🟨🟥";
                detayMetni = `<span style="color: var(--accent-red); font-weight: bold; font-size: 0.85rem;">${formatOyuncuAdi(olay.oyuncu)}</span>`;
            } else if (olay.tur === "KIRMIZI_KART") {
                ikon = "🟥";
                detayMetni = `<span style="color: var(--accent-red); font-weight: bold; font-size: 0.85rem;">${formatOyuncuAdi(olay.oyuncu)}</span>`;
            } else if (olay.tur === "SAKATLIK") {
                ikon = "🚑";
                detayMetni = `<span style="color: #e67e22; font-weight: bold; font-size: 0.85rem;">${formatOyuncuAdi(olay.oyuncu)}</span>`;
            } else if (olay.tur === "VAR_IPTAL") {
                ikon = "📺";
                detayMetni = `<span style="color: var(--text-muted); text-decoration: line-through; font-size: 0.8rem;">Gol İptal</span>`;
            } else if (olay.tur === "DEGISIKLIK") {
                ikon = "🔄"; 
                detayMetni = `<div style="font-size: 0.8rem; color: var(--success-green);">▲ ${formatOyuncuAdi(olay.giren)}</div><div style="font-size: 0.75rem; color: var(--accent-red);">▼ ${formatOyuncuAdi(olay.cikan)}</div>`;
            }

            timelineHTML += `
                <div style="display: grid; grid-template-columns: 1fr 50px 1fr; align-items: center; margin-bottom: 10px; position: relative; z-index: 2; width: 100%;">
                    <div style="text-align: right; padding-right: 8px;">${isEvSahibi ? detayMetni : ""}</div>
                    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
                        <div style="background: var(--bg-secondary); border-radius: 10px; padding: 0px 4px; font-size: 0.7rem; font-weight: bold; color: var(--accent-blue); border: 1px solid var(--border-color); margin-bottom: 1px;">${olay.dakika}'</div>
                        <div style="font-size: 0.95rem;">${ikon}</div>
                    </div>
                    <div style="text-align: left; padding-left: 8px;">${!isEvSahibi ? detayMetni : ""}</div>
                </div>
            `;
        });
        timelineHTML += `</div>`;
    } else {
        timelineHTML = `<div style="margin: 20px 0; color: var(--text-muted); font-style: italic; font-size: 0.9rem;">(Maçta kayda değer önemli bir olay yaşanmadı)</div>`;
    }

    // --- SOL VE SAĞ SÜTUNLAR: REYTİNG ÇİZİCİSİ ---
    const kadroCiz = (oynayanlarArr, takimId) => {
        if(!oynayanlarArr || !macDurumu.reytingler) return "";
        let html = "";
        let fullKadro = kadrolar[takimId];
        if(!fullKadro) return "";

        oynayanlarArr.forEach(pid => {
            let p = fullKadro.find(x => x.id === pid);
            if(!p) return;
            let rating = macDurumu.reytingler[pid] || 6.0;
            let ratingColor = rating >= 8.0 ? "var(--success-green)" : (rating <= 5.0 ? "var(--accent-red)" : "var(--accent-blue)");
            html += `
                <div style="display:flex; justify-content: space-between; padding: 5px 4px; border-bottom: 1px solid var(--bg-secondary); font-size: 0.85rem;">
                    <span><span style="color:var(--text-muted); font-size:0.7rem; margin-right:5px; font-weight: bold;">${p.mevki}</span>${formatOyuncuAdi(p)}</span>
                    <span style="font-weight: bold; color: ${ratingColor}; background: rgba(0,0,0,0.15); padding: 1px 5px; border-radius: 4px; font-size: 0.8rem;">${rating}</span>
                </div>
            `;
        });
        return html;
    };

    return `
        <style> 
            #match-detail-content { max-width: 980px !important; width: 95% !important; background: var(--bg-main); border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); } 
        </style>
        
        <div style="padding: 20px; text-align: center;">
            
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; background: var(--bg-tertiary); padding: 15px 25px; border-radius: 10px; border: 1px solid var(--border-color);">
                <div style="flex: 1; text-align: right; font-size: 1.4rem; font-weight: bold; color: var(--text-main); text-transform: uppercase;">${finalEvSahibi}</div>
                <div style="flex: 0.4; font-size: 2.5rem; color: var(--accent-red); font-weight: 900; letter-spacing: 3px; text-shadow: 0 2px 4px rgba(0,0,0,0.3); text-align: center;">${macDurumu.skorE} - ${macDurumu.skorD}</div>
                <div style="flex: 1; text-align: left; font-size: 1.4rem; font-weight: bold; color: var(--text-main); text-transform: uppercase;">${finalDeplasman}</div>
            </div>

            <div style="display: grid; grid-template-columns: 250px 1fr 250px; gap: 15px; text-align: left;">
                
                <div style="background: var(--bg-tertiary); padding: 12px; border-radius: 8px; border: 1px solid var(--border-color); max-height: 440px; overflow-y: auto; scrollbar-width: thin;">
                    <h5 style="text-align: center; color: var(--accent-blue); margin-top: 0; margin-bottom: 12px; border-bottom: 1px solid var(--border-color); padding-bottom: 6px; font-size: 0.85rem; letter-spacing: 0.5px;">${finalEvSahibi.toUpperCase()} REYTİNGLER</h5>
                    ${kadroCiz(macDurumu.oynayanlarE, macDurumu.isimE)}
                </div>

                <div style="display: flex; flex-direction: column; gap: 15px; justify-content: space-between;">
                    
                    <div>
                        ${timelineHTML}
                    </div>
                    
                    <div style="background: var(--bg-tertiary); padding: 12px; border-radius: 8px; border: 1px solid var(--border-color); display: flex; flex-direction: column; gap: 8px;">
                        <div style="display: flex; justify-content: space-between; font-size: 0.9rem;">
                            <span style="font-weight: bold;">%${toplaOynamaE}</span>
                            <span style="color: var(--text-muted); font-size: 0.8rem;">Topla Oynama</span>
                            <span style="font-weight: bold;">%${toplaOynamaD}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; font-size: 0.9rem;">
                            <span style="font-weight: bold;">${xGE}</span>
                            <span style="color: var(--text-muted); font-size: 0.8rem;">Beklenen Gol (xG)</span>
                            <span style="font-weight: bold;">${xGD}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; font-size: 0.9rem;">
                            <span style="font-weight: bold;">${sutE}</span>
                            <span style="color: var(--text-muted); font-size: 0.8rem;">Toplam Şut</span>
                            <span style="font-weight: bold;">${sutD}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; font-size: 0.9rem;">
                            <span style="font-weight: bold;">${faulE}</span>
                            <span style="color: var(--text-muted); font-size: 0.8rem;">Faul</span>
                            <span style="font-weight: bold;">${faulD}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; font-size: 0.9rem;">
                            <span style="font-weight: bold;">${sariE} 🟨</span>
                            <span style="color: var(--text-muted); font-size: 0.8rem;">Sarı Kartlar</span>
                            <span style="font-weight: bold;">🟨 ${sariD}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; font-size: 0.9rem;">
                            <span style="font-weight: bold;">${kirmiziE} 🟥</span>
                            <span style="color: var(--text-muted); font-size: 0.8rem;">Kırmızı Kartlar</span>
                            <span style="font-weight: bold;">🟥 ${kirmiziD}</span>
                        </div>
                    </div>
                </div>

                <div style="background: var(--bg-tertiary); padding: 12px; border-radius: 8px; border: 1px solid var(--border-color); max-height: 440px; overflow-y: auto; scrollbar-width: thin;">
                    <h5 style="text-align: center; color: var(--accent-blue); margin-top: 0; margin-bottom: 12px; border-bottom: 1px solid var(--border-color); padding-bottom: 6px; font-size: 0.85rem; letter-spacing: 0.5px;">${finalDeplasman.toUpperCase()} REYTİNGLER</h5>
                    ${kadroCiz(macDurumu.oynayanlarD, macDurumu.isimD)}
                </div>

            </div>

            <button id="btn-match-detail-kapat" class="btn-kucuk" style="margin-top: 15px; width: 100%; padding: 10px; font-weight: bold; font-size: 0.95rem;">${metinGetir('kapat')}</button>
        </div>
    `;
}