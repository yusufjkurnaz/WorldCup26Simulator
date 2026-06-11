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
    const dil = getDil();

    const formatOyuncuAdi = (p) => {
        if (!p) return "";
        return p.soyad ? `${p.ad.charAt(0)}. ${p.soyad}` : p.ad;
    };

    // --- ORTA SÜTUN: ZAMAN TÜNELİ (TIMELINE) ---
    let timelineHTML = "";
    if (macDurumu.olaylar && macDurumu.olaylar.length > 0) {
        timelineHTML += `
            <div class="timeline-box" style="max-height: 200px; overflow-y: auto; position: relative; padding: 10px 5px; border: 1px dashed var(--border-color); border-radius: 8px; background: var(--bg-main); scrollbar-width: thin;">
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
                    detayMetni += ` <span style="font-size: 0.75rem; color: var(--text-muted); display: block;">(${formatOyuncuAdi(olay.asist)})</span>`;
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
                let varText = dil === 'en' ? "Goal Cancelled" : (dil === 'de' ? "Tor Annulliert" : "Gol İptal");
                detayMetni = `<span style="color: var(--text-muted); text-decoration: line-through; font-size: 0.8rem;">${varText}</span>`;
            } else if (olay.tur === "DEGISIKLIK") {
                ikon = "🔄"; 
                detayMetni = `<div style="font-size: 0.8rem; color: var(--success-green);">▲ ${formatOyuncuAdi(olay.giren)}</div><div style="font-size: 0.75rem; color: var(--accent-red);">▼ ${formatOyuncuAdi(olay.cikan)}</div>`;
            }

            timelineHTML += `
                <div style="display: grid; grid-template-columns: 1fr 40px 1fr; align-items: center; margin-bottom: 8px; position: relative; z-index: 2; width: 100%;">
                    <div style="text-align: right; padding-right: 8px;">${isEvSahibi ? detayMetni : ""}</div>
                    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
                        <div style="background: var(--bg-secondary); border-radius: 10px; padding: 0px 4px; font-size: 0.65rem; font-weight: bold; color: var(--accent-blue); border: 1px solid var(--border-color); margin-bottom: 1px;">${olay.dakika}'</div>
                        <div style="font-size: 0.85rem;">${ikon}</div>
                    </div>
                    <div style="text-align: left; padding-left: 8px;">${!isEvSahibi ? detayMetni : ""}</div>
                </div>
            `;
        });
        timelineHTML += `</div>`;
    } else {
        let noEventText = dil === 'en' ? "(No major events)" : (dil === 'de' ? "(Keine Ereignisse)" : "(Önemli bir olay yaşanmadı)");
        timelineHTML = `<div style="margin: 10px 0; text-align: center; color: var(--text-muted); font-style: italic; font-size: 0.85rem;">${noEventText}</div>`;
    }

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
                <div style="display:flex; justify-content: space-between; padding: 4px 2px; border-bottom: 1px solid var(--bg-secondary); font-size: 0.8rem;">
                    <span><span style="color:var(--text-muted); font-size:0.65rem; margin-right:4px; font-weight: bold;">${p.mevki}</span>${formatOyuncuAdi(p)}</span>
                    <span style="font-weight: bold; color: ${ratingColor}; background: rgba(0,0,0,0.15); padding: 1px 4px; border-radius: 4px; font-size: 0.75rem;">${rating}</span>
                </div>
            `;
        });
        return html;
    };

    let ratingLabel = dil === 'en' ? "RATINGS" : (dil === 'de' ? "BEWERTUNGEN" : "REYTİNGLER");

    return `
        <style> 
            /* SİHİRLİ KOD BURADA: overflow-y: auto ve max-height !important */
            #match-detail-content { 
                max-width: 980px !important; 
                width: 95% !important; 
                max-height: 85vh !important; /* Ekranın %85'inden uzun olamaz */
                overflow-y: auto !important; /* Kutu taşıyorsa KENDİ İÇİNDE kaydırılabilir olsun */
                overflow-x: hidden !important;
                background: var(--bg-main); 
                border-radius: 12px; 
                box-shadow: 0 10px 30px rgba(0,0,0,0.5); 
                scrollbar-width: thin;
            } 
            
            .match-report-grid {
                display: grid;
                grid-template-columns: 220px 1fr 220px;
                gap: 12px;
                text-align: left;
                box-sizing: border-box;
            }
            
            @media screen and (max-width: 768px) {
                .match-detail-main-wrapper {
                    padding: 10px !important;
                }
                .match-detail-header {
                    flex-direction: column !important;
                    gap: 5px !important;
                    padding: 10px !important;
                    margin-bottom: 10px !important;
                }
                .match-detail-header div {
                    text-align: center !important;
                    font-size: 1rem !important;
                }
                .match-detail-score {
                    font-size: 1.6rem !important;
                    letter-spacing: 1px !important;
                }
                .match-report-grid {
                    display: flex !important;
                    flex-direction: column !important;
                    gap: 10px !important;
                }
                .center-report-box {
                    order: 1 !important;
                    width: 100% !important;
                }
                .ratings-box-home {
                    order: 2 !important;
                    max-height: 220px !important;
                }
                .ratings-box-away {
                    order: 3 !important;
                    max-height: 220px !important;
                }
                .timeline-box {
                    max-height: 180px !important;
                }
            }
        </style>
        
        <div class="match-detail-main-wrapper" style="padding: 15px; text-align: center; box-sizing: border-box; max-width: 100%;">
            
            <div class="match-detail-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; background: var(--bg-tertiary); padding: 12px 20px; border-radius: 8px; border: 1px solid var(--border-color);">
                <div style="flex: 1; text-align: right; font-size: 1.2rem; font-weight: bold; color: var(--text-main); text-transform: uppercase;">${finalEvSahibi}</div>
                <div class="match-detail-score" style="flex: 0.4; font-size: 2.2rem; color: var(--accent-red); font-weight: 900; letter-spacing: 2px; text-shadow: 0 2px 4px rgba(0,0,0,0.3); text-align: center; margin: 0 10px;">${macDurumu.skorE} - ${macDurumu.skorD}</div>
                <div style="flex: 1; text-align: left; font-size: 1.2rem; font-weight: bold; color: var(--text-main); text-transform: uppercase;">${finalDeplasman}</div>
            </div>

            <div class="match-report-grid">
                
                <div class="ratings-box-home" style="background: var(--bg-tertiary); padding: 10px; border-radius: 8px; border: 1px solid var(--border-color); max-height: 400px; overflow-y: auto; scrollbar-width: thin;">
                    <h5 style="text-align: center; color: var(--accent-blue); margin-top: 0; margin-bottom: 10px; border-bottom: 1px solid var(--border-color); padding-bottom: 4px; font-size: 0.8rem; letter-spacing: 0.5px;">${finalEvSahibi.toUpperCase()} ${ratingLabel}</h5>
                    ${kadroCiz(macDurumu.oynayanlarE, macDurumu.isimE)}
                </div>

                <div class="center-report-box" style="display: flex; flex-direction: column; gap: 10px; justify-content: flex-start; overflow: hidden;">
                    
                    <div>
                        ${timelineHTML}
                    </div>
                    
                    <div style="background: var(--bg-tertiary); padding: 10px; border-radius: 8px; border: 1px solid var(--border-color); display: flex; flex-direction: column; gap: 6px;">
                        <div style="display: flex; justify-content: space-between; font-size: 0.85rem;">
                            <span style="font-weight: bold;">%${toplaOynamaE}</span>
                            <span style="color: var(--text-muted); font-size: 0.75rem;">${metinGetir('toplaOynama')}</span>
                            <span style="font-weight: bold;">%${toplaOynamaD}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; font-size: 0.85rem;">
                            <span style="font-weight: bold;">${xGE}</span>
                            <span style="color: var(--text-muted); font-size: 0.75rem;">${metinGetir('beklenenGol')}</span>
                            <span style="font-weight: bold;">${xGD}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; font-size: 0.85rem;">
                            <span style="font-weight: bold;">${sutE}</span>
                            <span style="color: var(--text-muted); font-size: 0.75rem;">${metinGetir('toplamSut')}</span>
                            <span style="font-weight: bold;">${sutD}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; font-size: 0.85rem;">
                            <span style="font-weight: bold;">${faulE}</span>
                            <span style="color: var(--text-muted); font-size: 0.75rem;">${metinGetir('faul')}</span>
                            <span style="font-weight: bold;">${faulD}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; font-size: 0.85rem;">
                            <span style="font-weight: bold;">${sariE} 🟨</span>
                            <span style="color: var(--text-muted); font-size: 0.75rem;">${metinGetir('sariKartlar')}</span>
                            <span style="font-weight: bold;">🟨 ${sariD}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; font-size: 0.85rem;">
                            <span style="font-weight: bold;">${kirmiziE} 🟥</span>
                            <span style="color: var(--text-muted); font-size: 0.75rem;">${metinGetir('kirmiziKartlar')}</span>
                            <span style="font-weight: bold;">🟥 ${kirmiziD}</span>
                        </div>
                    </div>
                </div>

                <div class="ratings-box-away" style="background: var(--bg-tertiary); padding: 10px; border-radius: 8px; border: 1px solid var(--border-color); max-height: 400px; overflow-y: auto; scrollbar-width: thin;">
                    <h5 style="text-align: center; color: var(--accent-blue); margin-top: 0; margin-bottom: 10px; border-bottom: 1px solid var(--border-color); padding-bottom: 4px; font-size: 0.8rem; letter-spacing: 0.5px;">${finalDeplasman.toUpperCase()} ${ratingLabel}</h5>
                    ${kadroCiz(macDurumu.oynayanlarD, macDurumu.isimD)}
                </div>

            </div>

            <button id="btn-match-detail-kapat" class="btn-kucuk" style="margin-top: 15px; width: 100%; padding: 10px; font-weight: bold; font-size: 0.95rem;">${metinGetir('kapat')}</button>
        </div>
    `;
}
