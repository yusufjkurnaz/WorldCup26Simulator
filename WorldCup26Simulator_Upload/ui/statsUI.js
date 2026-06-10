// ui/statsUI.js (Bunu mevcut dosyanın içine yapıştır)

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

// Global Sekme Değiştirme Fonksiyonu
window.aktifIstatistikSekmesiniDegistir = function(sekmeAdi) {
    document.querySelectorAll('.canli-ist-icerik').forEach(el => {
        el.style.display = 'none';
        el.classList.remove('aktif');
    });
    document.querySelectorAll('.canli-ist-sekme-btn').forEach(el => {
        el.style.background = 'var(--bg-secondary)';
        el.style.color = 'var(--text-muted)';
        el.style.borderColor = 'var(--border-color)';
        el.classList.remove('aktif');
    });

    const hedefIcerik = document.getElementById(`canli-icerik-${sekmeAdi}`);
    // Butonu data-hedef ile seçiyoruz ki hata olmasın
    const hedefButon = document.querySelector(`.canli-ist-sekme-btn[data-hedef="${sekmeAdi}"]`);
    
    if (hedefIcerik) {
        if(sekmeAdi === 'kartlar') hedefIcerik.style.display = 'grid'; // Kartlar sekmesi Grid tasarımı
        else hedefIcerik.style.display = 'block';
        hedefIcerik.classList.add('aktif');
    }
    if (hedefButon) {
        hedefButon.style.background = 'var(--accent-blue)';
        hedefButon.style.color = '#ffffff';
        hedefButon.style.borderColor = 'var(--accent-blue)';
        hedefButon.classList.add('aktif');
    }
};

export function HTMLCanliIstatistiklerPaneliOlustur(oyuncuIstatistikleri) {
    let tumOyuncular = Object.values(oyuncuIstatistikleri || {}).filter(p => p.oynadigiMac > 0);
    
    if (tumOyuncular.length === 0) {
        return `<div style="padding:40px; text-align:center; color:var(--text-muted); font-style:italic;">${metinGetir('henuzYok')}</div>`;
    }

    const formatOyuncuAdi = (p) => p.soyad ? `${p.ad.charAt(0)}. ${p.soyad}` : p.ad;

    let topGol = [...tumOyuncular].sort((a, b) => b.gol - a.gol || b.ortalamaReyting - a.ortalamaReyting).slice(0, 10);
    let topAsist = [...tumOyuncular].sort((a, b) => b.asist - a.asist || b.ortalamaReyting - a.ortalamaReyting).slice(0, 10);
    let topReyting = [...tumOyuncular].filter(p => p.oynadigiMac >= 1).sort((a, b) => b.ortalamaReyting - a.ortalamaReyting).slice(0, 10);
    let topEldiven = [...tumOyuncular].filter(p => p.mevki === "KL").sort((a, b) => b.cleanSheet - a.cleanSheet).slice(0, 10);
    let topSari = [...tumOyuncular].filter(p => p.sariKart > 0).sort((a, b) => b.sariKart - a.sariKart).slice(0, 10);
    let topKirmizi = [...tumOyuncular].filter(p => p.kirmiziKart > 0).sort((a, b) => b.kirmiziKart - a.kirmiziKart).slice(0, 10);

    const satirOlustur = (sira, oyuncu, deger, ikon = "") => `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 8px; border-bottom:1px solid var(--bg-secondary); font-size:0.95rem;">
            <div style="display:flex; align-items:center; gap:10px;">
                <span style="font-weight:bold; color:var(--text-muted); width:20px;">${sira}.</span>
                <span style="background:var(--bg-tertiary); font-size:0.7rem; padding:2px 5px; border-radius:3px; font-weight:bold; color:var(--accent-blue);">${oyuncu.mevki}</span>
                <span style="color:var(--text-main); font-weight:500;">${formatOyuncuAdi(oyuncu)}</span>
                <span style="font-size:0.8rem; color:var(--text-muted);">(${ulkeCevir(oyuncu.takim)})</span>
            </div>
            <span style="font-weight:bold; font-size:1rem; display:flex; align-items:center; gap:4px;">${deger} ${ikon}</span>
        </div>
    `;

    return `
        <style>
            #istatistik-modal { max-width: 750px !important; width: 95% !important; }
            #modal-istatistik-listesi { max-height: 60vh !important; overflow-y: auto !important; padding-right: 5px; scrollbar-width: thin; }
            .canli-ist-sekme-btn { flex: 1; padding: 10px; font-weight: bold; border: 1px solid var(--border-color); border-radius: 6px; cursor: pointer; transition: all 0.2s ease; font-size: 0.85rem; text-transform: uppercase; background: var(--bg-secondary); color: var(--text-muted); }
            .canli-ist-sekme-btn.aktif { background: var(--accent-blue) !important; color: #fff !important; border-color: var(--accent-blue) !important; }
            .canli-ist-icerik { display: none; }
            .canli-ist-icerik.aktif { display: block; }
        </style>

        <div style="display:flex; flex-direction:column; gap:15px; width:100%;">
            
            <div style="display:flex; gap:8px; width:100%; border-bottom: 1px solid var(--border-color); padding-bottom: 10px;">
                <button class="canli-ist-sekme-btn aktif" data-hedef="gol" style="background:var(--accent-blue); color:#fff; border-color:var(--accent-blue);">⚽ GOL</button>
                <button class="canli-ist-sekme-btn" data-hedef="asist">🎯 ASİST</button>
                <button class="canli-ist-sekme-btn" data-hedef="reyting">⭐ REYTİNG</button>
                <button class="canli-ist-sekme-btn" data-hedef="eldiven">🧤 ELDİVEN</button>
                <button class="canli-ist-sekme-btn" data-hedef="kartlar">🟨🟥 KART</button>
            </div>

            <div id="modal-istatistik-listesi-icerik">
                <div id="canli-icerik-gol" class="canli-ist-icerik aktif">
                    <h4 style="color:var(--accent-red); margin-bottom:12px; border-bottom:2px solid var(--accent-red); padding-bottom:5px; font-size:1rem;">🏆 GOL KRALLIĞI (TOP 10)</h4>
                    ${topGol.length > 0 ? topGol.map((p, i) => satirOlustur(i + 1, p, p.gol, "⚽")).join('') : `<p style="text-align:center;">${metinGetir('henuzYok')}</p>`}
                </div>

                <div id="canli-icerik-asist" class="canli-ist-icerik">
                    <h4 style="color:var(--accent-blue); margin-bottom:12px; border-bottom:2px solid var(--accent-blue); padding-bottom:5px; font-size:1rem;">🎯 ASİST KRALLIĞI (TOP 10)</h4>
                    ${topAsist.length > 0 ? topAsist.map((p, i) => satirOlustur(i + 1, p, p.asist, "🎯")).join('') : `<p style="text-align:center;">${metinGetir('henuzYok')}</p>`}
                </div>

                <div id="canli-icerik-reyting" class="canli-ist-icerik">
                    <h4 style="color:var(--success-green); margin-bottom:12px; border-bottom:2px solid var(--success-green); padding-bottom:5px; font-size:1rem;">⭐ EN YÜKSEK ORTALAMA REYTİNG</h4>
                    ${topReyting.length > 0 ? topReyting.map((p, i) => satirOlustur(i + 1, p, p.ortalamaReyting, "⭐")).join('') : `<p style="text-align:center;">${metinGetir('henuzYok')}</p>`}
                </div>

                <div id="canli-icerik-eldiven" class="canli-ist-icerik">
                    <h4 style="color:#e67e22; margin-bottom:12px; border-bottom:2px solid #e67e22; padding-bottom:5px; font-size:1rem;">🧤 ALTIN ELDİVEN / MAÇTA GOL YEMEME</h4>
                    ${topEldiven.length > 0 ? topEldiven.map((p, i) => satirOlustur(i + 1, p, p.cleanSheet, "👕")).join('') : `<p style="text-align:center;">${metinGetir('henuzYok')}</p>`}
                </div>

                <div id="canli-icerik-kartlar" class="canli-ist-icerik" style="grid-template-columns: 1fr 1fr; gap:15px;">
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px;">
                        <div>
                            <h5 style="color:#ffb300; border-bottom:1px solid #ffb300; padding-bottom:4px;">🟨 EN ÇOK SARI KART</h5>
                            ${topSari.length > 0 ? topSari.map((p, i) => satirOlustur(i + 1, p, p.sariKart, "🟨")).join('') : `<p>Temiz.</p>`}
                        </div>
                        <div>
                            <h5 style="color:var(--accent-red); border-bottom:1px solid var(--accent-red); padding-bottom:4px;">🟥 EN ÇOK KIRMIZI KART</h5>
                            ${topKirmizi.length > 0 ? topKirmizi.map((p, i) => satirOlustur(i + 1, p, p.kirmiziKart, "🟥")).join('') : `<p>Temiz.</p>`}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

export function HTMLIstatistikleriOlustur(takimlarListesi) {
    return `<div style="display:none;"></div>`;
}