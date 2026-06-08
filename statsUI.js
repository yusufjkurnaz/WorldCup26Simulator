// statsUI.js

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

export function HTMLIstatistikleriOlustur(takimlarListesi) {
    // Sadece turnuvada en az 1 maça çıkmış takımları filtrele
    let aktifTakimlar = takimlarListesi.filter(t => t.oynadigiMac > 0);
    if (aktifTakimlar.length === 0) return `<p style='text-align:center; color:var(--text-muted); width:100%;'>${metinGetir('henuzYok')}</p>`;

    // YENİ: Oransal değerleri anlık olarak hesapla
    aktifTakimlar.forEach(t => {
        // Şutların gole dönüşme yüzdesi (Bitiricilik Oranı)
        t.bitiricilik = t.toplamSut > 0 ? ((t.atilanGol / t.toplamSut) * 100) : 0;
        // Maç başına yenilen gol
        t.macBasiYenilen = t.yenilenGol / t.oynadigiMac;
        // Maç başına faul
        t.macBasiFaul = t.faul / t.oynadigiMac;
    });

    // Kategori 1: Keskin Nişancı (Gol atmış takımlar arasında şut/gol oranı en yüksek olan)
    let enKeskinler = [...aktifTakimlar].filter(t => t.atilanGol > 0).sort((a, b) => b.bitiricilik - a.bitiricilik);
    let enKeskin = enKeskinler.length > 0 ? enKeskinler[0] : { isim: metinGetir('henuzYok'), bitiricilik: 0 };

    // Kategori 2: Kevgir Savunma (Maç başına en çok gol yiyen)
    let enKotuDefans = [...aktifTakimlar].sort((a, b) => b.macBasiYenilen - a.macBasiYenilen)[0];

    // Kategori 3: Kasap Takım (Önce kırmızı kart sayısına, eşitse maç başı faule bakar)
    let enKasap = [...aktifTakimlar].sort((a, b) => {
        if (b.kirmiziKart !== a.kirmiziKart) return b.kirmiziKart - a.kirmiziKart;
        return b.macBasiFaul - a.macBasiFaul;
    })[0];

    // Kategori 4 & 5: Sürpriz ve Hayal Kırıklığı
    let enSurpriz = [...aktifTakimlar].sort((a, b) => b.surprizPuani - a.surprizPuani)[0] || { isim: metinGetir('henuzYok') };
    let enHayalKirikligi = [...aktifTakimlar].sort((a, b) => b.hayalKirikligiPuani - a.hayalKirikligiPuani)[0] || { isim: metinGetir('henuzYok') };

    if (enSurpriz.surprizPuani === 0) enSurpriz = { isim: metinGetir('henuzYok') };
    if (enHayalKirikligi.hayalKirikligiPuani === 0) enHayalKirikligi = { isim: metinGetir('henuzYok') };

    // YENİ: Çıktı üretilirken ülke isimleri ulkeCevir() fonksiyonundan geçiriliyor
    return `
        <div class="istatistik-kart">
            <span class="istatistik-baslik">${metinGetir('keskinNisanci')}</span>
            <span class="istatistik-deger">${ulkeCevir(enKeskin.isim)} <span style="font-size:0.9rem; color:var(--text-muted);">(%${enKeskin.bitiricilik.toFixed(1)} ${metinGetir('golOrani')})</span></span>
        </div>
        <div class="istatistik-kart">
            <span class="istatistik-baslik">${metinGetir('enKotuDefans')}</span>
            <span class="istatistik-deger">${ulkeCevir(enKotuDefans.isim)} <span style="font-size:0.9rem; color:var(--text-muted);">(${enKotuDefans.macBasiYenilen.toFixed(2)} ${metinGetir('ygMac')})</span></span>
        </div>
        <div class="istatistik-kart surpriz">
            <span class="istatistik-baslik">${metinGetir('enBüyükSurpriz')}</span>
            <span class="istatistik-deger">${ulkeCevir(enSurpriz.isim)}</span>
        </div>
        <div class="istatistik-kart hayalkirikligi">
            <span class="istatistik-baslik">${metinGetir('hayalKirikligi')}</span>
            <span class="istatistik-deger">${ulkeCevir(enHayalKirikligi.isim)}</span>
        </div>
        <div class="istatistik-kart agresif">
            <span class="istatistik-baslik">${metinGetir('enKasapTakim')}</span>
            <span class="istatistik-deger">${ulkeCevir(enKasap.isim)} <span style="font-size:0.9rem; color:var(--accent-red);">(${enKasap.kirmiziKart} 🟥, ${enKasap.macBasiFaul.toFixed(1)} ${metinGetir('faulMac')})</span></span>
        </div>
    `;
}