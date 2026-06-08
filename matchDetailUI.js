// matchDetailUI.js

// YENİ: Dil Desteği ve Ülke Çevirisi İçin Sözlük Bağlantısı
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

export function HTMLMacDetayiOlustur(macDurumu, evSahibiAd, deplasmanAd) {
    // engine.js dosyasından gelen gerçek verileri çekiyoruz
    const xGE = macDurumu.xGE ?? "0.00";
    const xGD = macDurumu.xGD ?? "0.00";
    
    const toplaOynamaE = macDurumu.toplaOynamaE ?? 50;
    const toplaOynamaD = macDurumu.toplaOynamaD ?? 50;

    const sutE = macDurumu.sutE ?? 0;
    const sutD = macDurumu.sutD ?? 0;

    const faulE = macDurumu.faulE ?? 0;
    const faulD = macDurumu.faulD ?? 0;

    // Kırmızı kartlar engine.js'den doğrudan geliyor
    const kirmiziE = macDurumu.kirmiziE ?? 0;
    const kirmiziD = macDurumu.kirmiziD ?? 0;

    // Sarı kartları faul oranına göre gerçekçi bir şekilde türetiyoruz
    const sariKartE = Math.floor(faulE / 4) + (Math.random() < 0.3 ? 1 : 0);
    const sariKartD = Math.floor(faulD / 4) + (Math.random() < 0.3 ? 1 : 0);

    // YENİ: Gelen takım isimlerini arayüze basmadan önce ne olur ne olmaz çeviriden geçiriyoruz
    const finalEvSahibi = ulkeCevir(evSahibiAd);
    const finalDeplasman = ulkeCevir(deplasmanAd);

    return `
        <div style="padding: 25px; text-align: center;">
            <h2 style="color: var(--accent-blue); margin-bottom: 15px; font-size: 1.5rem;">${metinGetir('macRaporuBaslik')}</h2>
            
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; padding-bottom: 15px; border-bottom: 1px solid var(--border-color);">
                <div style="flex: 1; text-align: right; font-size: 1.2rem; font-weight: bold;">${finalEvSahibi}</div>
                <div style="flex: 0.5; font-size: 2rem; color: var(--accent-red); font-weight: 900;">${macDurumu.skorE} - ${macDurumu.skorD}</div>
                <div style="flex: 1; text-align: left; font-size: 1.2rem; font-weight: bold;">${finalDeplasman}</div>
            </div>

            <div style="display: flex; flex-direction: column; gap: 15px; font-size: 1.1rem;">
                <div style="display: flex; justify-content: space-between;">
                    <span style="flex: 1; text-align: right; font-weight: bold;">%${toplaOynamaE}</span>
                    <span style="flex: 1; color: var(--text-muted); font-size: 0.9rem;">${metinGetir('toplaOynama')}</span>
                    <span style="flex: 1; text-align: left; font-weight: bold;">%${toplaOynamaD}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span style="flex: 1; text-align: right; font-weight: bold;">${xGE}</span>
                    <span style="flex: 1; color: var(--text-muted); font-size: 0.9rem;">${metinGetir('beklenenGol')}</span>
                    <span style="flex: 1; text-align: left; font-weight: bold;">${xGD}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span style="flex: 1; text-align: right; font-weight: bold;">${sutE}</span>
                    <span style="flex: 1; color: var(--text-muted); font-size: 0.9rem;">${metinGetir('toplamSut')}</span>
                    <span style="flex: 1; text-align: left; font-weight: bold;">${sutD}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span style="flex: 1; text-align: right; font-weight: bold;">${faulE}</span>
                    <span style="flex: 1; color: var(--text-muted); font-size: 0.9rem;">${metinGetir('faul')}</span>
                    <span style="flex: 1; text-align: left; font-weight: bold;">${faulD}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span style="flex: 1; text-align: right; font-weight: bold;">${sariKartE} <span style="font-size:0.8rem;">🟨</span></span>
                    <span style="flex: 1; color: var(--text-muted); font-size: 0.9rem;">${metinGetir('sariKartlar')}</span>
                    <span style="flex: 1; text-align: left; font-weight: bold;"><span style="font-size:0.8rem;">🟨</span> ${sariKartD}</span>
                </div>
                <div style="display: flex; justify-content: space-between; ${ (kirmiziE > 0 || kirmiziD > 0) ? 'background: rgba(225, 29, 72, 0.1); padding: 4px; border-radius: 4px;' : '' }">
                    <span style="flex: 1; text-align: right; font-weight: bold; ${kirmiziE > 0 ? 'color: var(--accent-red);' : ''}">${kirmiziE} <span style="font-size:0.8rem;">🟥</span></span>
                    <span style="flex: 1; color: var(--text-muted); font-size: 0.9rem;">${metinGetir('kirmiziKartlar')}</span>
                    <span style="flex: 1; text-align: left; font-weight: bold; ${kirmiziD > 0 ? 'color: var(--accent-red);' : ''}"><span style="font-size:0.8rem;">🟥</span> ${kirmiziD}</span>
                </div>
            </div>

            <button id="btn-match-detail-kapat" class="btn-kucuk" style="margin-top: 25px; width: 100%; padding: 12px; font-weight: bold;">${metinGetir('kapat')}</button>
        </div>
    `;
}