// modules/tacticsInit.js

// Kadroları tuttuğun dosyayı import ediyoruz (Eğer dosya adın farklıysa burayı güncelle)
import { kadrolar } from '../data/squads.js'; 

/**
 * Yeni bir kariyer oluşturulduğunda veya C moduna girildiğinde çalışır.
 * 48 takımın tamamı için mevkilerine ve reytinglerine göre
 * otomatik bir İlk 11, Yedekler, Diziliş ve Oyun Anlayışı belirler.
 */
export function baslangicTaktikleriniAyarla(takimlarListesi) {
    takimlarListesi.forEach(takim => {
        // Eğer daha önce atama yapılmışsa (kayıtlı oyundan geliyorsa) bu takımı atla
        if (takim.ilk11 && takim.ilk11.length === 11) return;

        // Kadro veritabanından ülkenin oyuncularını çek
        let ulkeKadrosu = kadrolar[takim.isim];
        if (!ulkeKadrosu || ulkeKadrosu.length === 0) {
            console.warn(`${takim.isim} için kadro verisi bulunamadı!`);
            return;
        }

        // Oyuncuları reytinge (gen) göre yüksekten düşüğe sırala
        let siraliKadro = [...ulkeKadrosu].sort((a, b) => b.gen - a.gen);

        // --- 1. TAKTİK VE DİZİLİŞ ATAMASI ---
        // 4.5 ve 5 yıldızlı büyük takımlar Ofansif 4-3-3 başlasın, diğerleri Dengeli 4-2-3-1
        if (takim.yildiz >= 4.5) {
            takim.dizilis = "4-3-3";
            takim.anlayis = "Ofansif";
        } else {
            takim.dizilis = "4-2-3-1";
            takim.anlayis = "Dengeli";
        }

        let ilk11 = [];
        let secilenIDler = new Set();

        // Akıllı Seçim Algoritması: Belirtilen mevkilerdeki en iyi N oyuncuyu bulur
        const oyuncuSec = (istenenMevkiler, adet) => {
            let secilenler = [];
            for (let p of siraliKadro) {
                if (secilenler.length >= adet) break;
                if (!secilenIDler.has(p.id) && istenenMevkiler.includes(p.mevki)) {
                    secilenler.push(p);
                    secilenIDler.add(p.id);
                }
            }
            return secilenler;
        };

        // --- 2. AKILLI MEVKİ YERLEŞTİRMESİ ---
        
        // KALECİ (1 Adet)
        let kaleciler = oyuncuSec(["KL"], 1);
        
        // DEFANS HATTI (4 Adet)
        let stoperler = oyuncuSec(["STP"], 2);
        let sagBek = oyuncuSec(["SĞB"], 1);
        let solBek = oyuncuSec(["SLB"], 1);
        // Eğer sağ/sol bek eksiği varsa (Veride yoksa), en iyi defansif oyuncuyu joker olarak kaydır
        if(sagBek.length === 0) sagBek = oyuncuSec(["STP", "SLB", "OS"], 1);
        if(solBek.length === 0) solBek = oyuncuSec(["STP", "SĞB", "OS"], 1);

        // ORTA SAHA HATTI
        let ortaSahalar = oyuncuSec(["OS"], takim.dizilis === "4-3-3" ? 3 : 2);

        // HÜCUM VE KANAT HATTI
        let kanatlarSag = oyuncuSec(["SĞK", "SNT", "OS"], 1); // Gerçek sağ açık yoksa Forveti veya OS'yi sağa koy
        let kanatlarSol = oyuncuSec(["SLK", "SNT", "OS"], 1); 
        let forvetler = oyuncuSec(["SNT", "SĞK", "SLK"], takim.dizilis === "4-2-3-1" ? 2 : 1); // 4-2-3-1 için Forvet arkası jokerli

        // Seçilenleri 11 kişilik diziye bas (Diziliş sırasıyla: KL, DEF, OS, FORVET)
        ilk11.push(...kaleciler, ...sagBek, ...stoperler, ...solBek, ...ortaSahalar, ...kanatlarSag, ...kanatlarSol, ...forvetler);

        // KORUMA MEKANİZMASI: Herhangi bir sebeple 11 kişi tamamlanamadıysa, kalan en yüksek GEN'li oyuncuları doldur
        if (ilk11.length < 11) {
            let eksikSayisi = 11 - ilk11.length;
            let tamamlayicilar = oyuncuSec(["KL", "STP", "SĞB", "SLB", "OS", "SLK", "SĞK", "SNT"], eksikSayisi);
            ilk11.push(...tamamlayicilar);
        }

        // --- 3. VERİLERİ TAKIMA YAZMA ---
        // Sadece ID kodlarını tutuyoruz ki veri şişmesin
        takim.ilk11 = ilk11.map(p => p.id);
        takim.yedekler = siraliKadro.filter(p => !secilenIDler.has(p.id)).map(p => p.id);
    });
}