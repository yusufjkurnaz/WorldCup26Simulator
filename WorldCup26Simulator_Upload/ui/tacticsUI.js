// ui/tacticsUI.js

import { getTakimData, taktikGuncelle, oyuncuDegistir, gucHesaplaVeGuncelle } from '../modules/tacticsManager.js';
import { oyuncuIstatistikleri } from '../modules/statsManager.js';

export function taktikEkraniCiz(takimIsmi) {
    let data = getTakimData(takimIsmi);
    if(!data) return;

    const dizilisSelect = document.getElementById('select-dizilis');
    const anlayisSelect = document.getElementById('select-anlayis');
    
    // Taktik verilerini form elemanlarına yansıt
    dizilisSelect.value = data.takim.dizilis || "4-2-3-1";
    anlayisSelect.value = data.takim.anlayis || "Dengeli";

    // Select (Açılır Menü) Değişim Eventleri
    dizilisSelect.onchange = (e) => {
        taktikGuncelle(takimIsmi, e.target.value, anlayisSelect.value);
        gucHesaplaVeGuncelle(takimIsmi);
        taktikArayuzuGuncelle(takimIsmi);
    };
    
    anlayisSelect.onchange = (e) => {
        taktikGuncelle(takimIsmi, dizilisSelect.value, e.target.value);
        gucHesaplaVeGuncelle(takimIsmi);
        taktikArayuzuGuncelle(takimIsmi);
    };

    // Ekranı render et
    taktikArayuzuGuncelle(takimIsmi);
}

function taktikArayuzuGuncelle(takimIsmi) {
    let data = getTakimData(takimIsmi);
    if(!data) return;

    // Takımın Güncel Güçlerini Ekrana Bas
    document.getElementById('taktik-guc-hucum').innerText = data.takim.hucum;
    document.getElementById('taktik-guc-orta').innerText = data.takim.ortaSaha;
    document.getElementById('taktik-guc-sav').innerText = data.takim.savunma;

    const kadroAlani = document.getElementById('kadro-listesi-alani');
    
    // Kadro Arayüzü İskeleti (İlk 11 ve Yedekler iki ayrı kutu)
    kadroAlani.innerHTML = `
        <div style="display:flex; gap: 15px; height: 100%;">
            <div style="flex: 1; border: 2px solid var(--accent-blue); padding: 10px; border-radius: 5px; background: rgba(74, 144, 226, 0.05);">
                <h4 style="color: var(--accent-blue); margin-bottom: 15px; text-align: center; border-bottom: 1px dashed var(--accent-blue); padding-bottom: 5px;">SAHADAKİ 11</h4>
                <div id="ilk-11-kutu" style="display: flex; flex-direction: column; gap: 6px;"></div>
            </div>
            <div style="flex: 1; border: 2px solid var(--border-color); padding: 10px; border-radius: 5px; background: var(--bg-main);">
                <h4 style="color: var(--text-muted); margin-bottom: 15px; text-align: center; border-bottom: 1px dashed var(--border-color); padding-bottom: 5px;">YEDEKLER</h4>
                <div id="yedekler-kutu" style="display: flex; flex-direction: column; gap: 6px;"></div>
            </div>
        </div>
    `;

    const ilk11Kutu = document.getElementById('ilk-11-kutu');
    const yedeklerKutu = document.getElementById('yedekler-kutu');

    // Sürükle Bırak (Drag & Drop) ile Oyuncu Çizici Fonksiyon
    const oyuncuCiz = (p, container, isIlk11) => {
        let stat = oyuncuIstatistikleri[p.id];
        let durumIkonu = "";
        let opasite = "1";
        
        // Disiplin & Sağlık Kontrolü
        if(stat) {
            if(stat.cezaDurumu > 0) { durumIkonu = "🟥"; opasite = "0.6"; }
            else if(stat.sakatlikDurumu > 0) { durumIkonu = "🚑"; opasite = "0.6"; }
        }

        let div = document.createElement('div');
        // 'cg-team-item' classını kullanarak custom-groups ile aynı hover/animasyon efektini yakalıyoruz
        div.className = `cg-team-item`; 
        div.style.opacity = opasite;
        div.style.padding = "6px 10px";
        div.draggable = true;
        
        let bgColor = isIlk11 ? "var(--bg-main)" : "var(--bg-tertiary)";
        div.style.backgroundColor = bgColor;

        div.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-weight: bold; width: 35px; text-align: center; background: var(--bg-secondary); border-radius: 3px; font-size: 0.8rem; padding: 2px;">${p.mevki}</span>
                <span>${p.ad.charAt(0)}. ${p.soyad} ${durumIkonu}</span>
            </div>
            <span style="font-weight: bold; color: #ffb300; font-size: 0.95rem;">${p.gen}</span>
        `;

        // Sürükleme Başlangıcı
        div.addEventListener('dragstart', e => {
            e.dataTransfer.setData('text/plain', p.id);
            setTimeout(() => div.classList.add('dragging'), 0);
        });
        div.addEventListener('dragend', () => div.classList.remove('dragging'));

        // Üzerine Bırakılma (Swap / Takas) Animasyonları
        div.addEventListener('dragover', e => {
            e.preventDefault();
            div.style.border = "1px dashed var(--accent-red)";
        });
        div.addEventListener('dragleave', e => {
            div.style.border = "1px solid var(--border-color)";
        });
        
        // Değişiklik Anı (Drop)
        div.addEventListener('drop', e => {
            e.preventDefault();
            div.style.border = "1px solid var(--border-color)";
            
            const kaynakId = e.dataTransfer.getData('text/plain');
            const hedefId = p.id;
            
            if (kaynakId !== hedefId) {
                let sonuc = { basarili: false, mesaj: "Bir hata oluştu." };

                const isKaynakIlk11 = data.ilk11.some(x => x.id === kaynakId);
                const isHedefIlk11 = data.ilk11.some(x => x.id === hedefId);

                // 1. İlk 11'den -> Yedeğe sürükleme
                if (isKaynakIlk11 && !isHedefIlk11) {
                    sonuc = oyuncuDegistir(takimIsmi, kaynakId, hedefId);
                } 
                // 2. Yedekten -> İlk 11'e sürükleme
                else if (!isKaynakIlk11 && isHedefIlk11) {
                    sonuc = oyuncuDegistir(takimIsmi, hedefId, kaynakId);
                } 
                // 3. İlk 11 içinde yer değiştirme (Görsel sıralama)
                else if (isKaynakIlk11 && isHedefIlk11) {
                    const kIdx = data.takim.ilk11.indexOf(kaynakId);
                    const hIdx = data.takim.ilk11.indexOf(hedefId);
                    let temp = data.takim.ilk11[kIdx];
                    data.takim.ilk11[kIdx] = data.takim.ilk11[hIdx];
                    data.takim.ilk11[hIdx] = temp;
                    sonuc = { basarili: true };
                } 
                // 4. Yedekler içinde yer değiştirme (Görsel sıralama)
                else {
                    const kIdx = data.takim.yedekler.indexOf(kaynakId);
                    const hIdx = data.takim.yedekler.indexOf(hedefId);
                    let temp = data.takim.yedekler[kIdx];
                    data.takim.yedekler[kIdx] = data.takim.yedekler[hIdx];
                    data.takim.yedekler[hIdx] = temp;
                    sonuc = { basarili: true };
                }

                if (!sonuc.basarili) {
                    alert(sonuc.mesaj); // Sakat veya cezalı oyuncu uyarısı
                } else {
                    taktikArayuzuGuncelle(takimIsmi); // Ekranı yenile
                }
            }
        });

        container.appendChild(div);
    };

    // Oyuncuları Kutuya Doldur
    data.ilk11.forEach(p => oyuncuCiz(p, ilk11Kutu, true));
    data.yedekler.forEach(p => oyuncuCiz(p, yedeklerKutu, false));
}