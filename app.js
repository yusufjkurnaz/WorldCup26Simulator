import { AYARLAR } from './config.js';
import { takimlar, gruplarListesi, resmiFikstur, turnuvaAgaci } from './data.js';
import { istatistikleriSifirla, maciIsle } from './engine.js';
import { HTMLFinalHaberiOlustur } from './newspaperUI.js'; 
import { DIL_SOZLUGU, ulkeCevir } from './lang.js'; 
import { 
    DOM, animasyonluYukle, HTMLPuanTablosuOlustur, HTMLGrupFiksturuOlustur, 
    HTMLElemeFiksturuOlustur, HTMLGorselAgacOlustur, HTMLIstatistikleriOlustur, 
    HTMLGazeteOlustur, HTMLMacDetayiOlustur, slotlariArayuzeCiz, 
    takimSecimGridiniCiz, istatistikleriEkranaBas 
} from './ui.js';
import { 
    oyunuKaydet, oyunuYukle, oyunuSifirla, ayarlariKaydet, ayarlariYukle, 
    tumSlotlariGetir, aktifOturumuKaydet, aktifOturumuYukle, aktifOturumuKapat 
} from './storage.js'; 

let aktifSlotId = null; 
let aktifTur = "A"; 
let globalMacGunu = 1;
let oynananMaclar = {}; 
let tumUcunculer = [];
let kullaniciTakimi = null;
let elemeEslesmeleri = {}; 
let oncekiEkran = DOM.viewMainMenu;
let simuleEdiliyor = false;

let mevcutAyarlar = ayarlariYukle();

function metinGetir(anahtar) {
    let seciliDil = mevcutAyarlar.dil || "tr";
    return DIL_SOZLUGU[seciliDil][anahtar] || DIL_SOZLUGU["tr"][anahtar] || anahtar;
}

function sayfayiCevir() {
    document.querySelectorAll('[data-lang]').forEach(el => {
        let anahtar = el.getAttribute('data-lang');
        if (DIL_SOZLUGU[mevcutAyarlar.dil || "tr"][anahtar]) {
            el.innerHTML = metinGetir(anahtar);
        }
    });
}

function loadingMetniDegistir(metin) {
    let el = document.getElementById("loading-metni");
    if(el) el.innerText = metin;
}

function durumuKaydet() {
    if (!aktifSlotId) return;
    const state = {
        aktifTur, globalMacGunu, oynananMaclar, tumUcunculer,
        kullaniciTakimi, elemeEslesmeleri, takimlar 
    };
    oyunuKaydet(aktifSlotId, state);
    anaMenuyuGuncelle(); 
}

function ekranDegistir(hedefEkran) {
    if (hedefEkran !== DOM.viewPrivacy && hedefEkran !== DOM.viewContact) {
        oncekiEkran = hedefEkran;
    }
    DOM.viewMainMenu.style.display = "none";
    DOM.viewGame.style.display = "none";
    DOM.viewPrivacy.style.display = "none";
    DOM.viewContact.style.display = "none"; 
    DOM.viewTeamSelect.style.display = "none";

    hedefEkran.style.display = "block";
}

function temayiUygula() {
    document.documentElement.setAttribute('data-theme', mevcutAyarlar.tema);
    DOM.btnTemaDegistir.innerText = mevcutAyarlar.tema === 'dark' ? '☀️' : '🌙';
    ayarlariKaydet(mevcutAyarlar);
}

DOM.btnTemaDegistir.addEventListener("click", () => {
    mevcutAyarlar.tema = mevcutAyarlar.tema === 'dark' ? 'light' : 'dark';
    temayiUygula();
});

function anaMenuyuGuncelle() {
    let slotlar = tumSlotlariGetir();
    
    [1, 2, 3].forEach(id => {
        const data = slotlar[id];
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

            icerikKutusu.innerHTML = `
                <div style="text-align: left; margin-top: 10px; margin-bottom: 20px; line-height: 1.5;">
                    <div style="font-weight: bold; color: var(--text-main);">${metinGetir('tabloTakim')}: <span style="color:#ffb300;">⭐ ${secilenTakim}</span></div>
                    <div style="font-size: 0.9rem; color: var(--text-muted); margin-top: 4px;">${metinGetir('turnuvaDurumu')}: ${durumMetni}</div>
                    <div style="font-size: 0.9rem; color: var(--accent-blue); font-weight: bold; margin-top: 4px;">${metinGetir('ilerleme')}: %${yuzde}</div>
                </div>
                <button class="btn-dev btn-slot-devam" data-slot="${id}">${metinGetir('devamEt')}</button>
                <button class="btn-slot-sil" data-slot="${id}">${metinGetir('kariyeriSil')}</button>
            `;
        }
    });
}

document.querySelector(".kayit-slotlari-alani").addEventListener("click", function(e) {
    if (simuleEdiliyor) return; 

    if (e.target.classList.contains("btn-slot-yeni")) {
        aktifSlotId = e.target.getAttribute("data-slot");
        kullaniciTakimi = null;
        takimSecimGridiniCiz(takimlar, gruplarListesi);
        DOM.seciliTakimPaneli.classList.add("gizli");
        ekranDegistir(DOM.viewTeamSelect);
    }
    else if (e.target.classList.contains("btn-slot-devam")) {
        aktifSlotId = e.target.getAttribute("data-slot");
        aktifOturumuKaydet(aktifSlotId); 
        oyunuHafizadanKur(aktifSlotId);
        ekranDegistir(DOM.viewGame);
        ekranGuncelle();
    }
    else if (e.target.classList.contains("btn-slot-sil")) {
        let silinecekId = e.target.getAttribute("data-slot");
        DOM.btnResetOnay.setAttribute("data-silinecekslot", silinecekId);
        DOM.modal.classList.add("goster");
    }
});

DOM.btnResetOnay.addEventListener("click", () => {
    let silinecekId = DOM.btnResetOnay.getAttribute("data-silinecekslot");
    if(silinecekId) {
        oyunuSifirla(silinecekId);
        if (aktifSlotId === silinecekId) aktifSlotId = null;
        anaMenuyuGuncelle();
    }
    DOM.modal.classList.remove("goster");
});

DOM.btnResetIptal.addEventListener("click", () => DOM.modal.classList.remove("goster"));

DOM.takimGridAlani.addEventListener("click", function(e) {
    let tiklananTakimDiv = e.target.closest(".takim-secenek"); 
    if (tiklananTakimDiv) {
        let secilenIsim = tiklananTakimDiv.getAttribute("data-takim");
        let secilenGrup = tiklananTakimDiv.getAttribute("data-grup");
        takimSecimGridiniCiz(takimlar, gruplarListesi, secilenIsim);
        DOM.secilenTakimIsim.innerText = ulkeCevir(secilenIsim);
        DOM.secilenTakimGrup.innerText = secilenGrup;
        DOM.seciliTakimPaneli.classList.remove("gizli");
        DOM.btnKariyeriBaslat.setAttribute("data-takim", secilenIsim);
        DOM.btnKariyeriBaslat.setAttribute("data-grup", secilenGrup);
    }
});

DOM.btnTeamSelectIptal.addEventListener("click", () => {
    aktifSlotId = null;
    ekranDegistir(DOM.viewMainMenu);
});

DOM.btnKariyeriBaslat.addEventListener("click", () => {
    let takim = DOM.btnKariyeriBaslat.getAttribute("data-takim");
    let grup = DOM.btnKariyeriBaslat.getAttribute("data-grup");
    if (takim && grup) yeniOyunBaslat(takim, grup);
});

function yeniOyunBaslat(secilenTakim, baslangicGrubu) {
    istatistikleriSifirla(takimlar);
    oynananMaclar = {}; tumUcunculer = []; globalMacGunu = 1; 
    aktifTur = baslangicGrubu; 
    kullaniciTakimi = secilenTakim; 
    elemeEslesmeleri = JSON.parse(JSON.stringify(turnuvaAgaci)); 
    DOM.celebrationContainer.classList.remove("kutlandi");
    
    DOM.grupSekmeleriAlani.classList.remove("gizli");
    DOM.elemeSekmeleriAlani.classList.add("gizli");
    DOM.btnGruplariGoster.innerText = metinGetir('grupGizle');

    aktifOturumuKaydet(aktifSlotId); 
    durumuKaydet(); 
    ekranDegistir(DOM.viewGame);
    ekranGuncelle();
}

function oyunuHafizadanKur(slotId) {
    const kayit = oyunuYukle(slotId);
    if (kayit) {
        aktifTur = kayit.aktifTur;
        globalMacGunu = kayit.globalMacGunu;
        oynananMaclar = kayit.oynananMaclar;
        kullaniciTakimi = kayit.kullaniciTakimi || null;
        elemeEslesmeleri = kayit.elemeEslesmeleri || JSON.parse(JSON.stringify(turnuvaAgaci));

        takimlar.forEach((t, index) => {
            Object.assign(t, kayit.takimlar[index]);
        });
        if (kayit.tumUcunculer && kayit.tumUcunculer.length > 0) {
            tumUcunculer = kayit.tumUcunculer.map(kayitliTakim => takimlar.find(t => t.isim === kayitliTakim.isim));
        }

        if (["son32", "son16", "ceyrekFinal", "yariFinal", "ucunculuk", "final"].includes(aktifTur)) {
            DOM.grupSekmeleriAlani.classList.add("gizli");
            DOM.elemeSekmeleriAlani.classList.remove("gizli");
            DOM.btnGruplariGoster.innerText = metinGetir('grupGoster');
            
            let gectigiTurlar = [];
            if(aktifTur === "son16") gectigiTurlar = ["son32"];
            if(aktifTur === "ceyrekFinal") gectigiTurlar = ["son32", "son16"];
            if(aktifTur === "yariFinal") gectigiTurlar = ["son32", "son16", "ceyrekFinal"];
            
            // DÜZELTME: Üçüncülük ve Final turlarının kilit geçiş yolları tamamen ayrıldı
            if(aktifTur === "ucunculuk") gectigiTurlar = ["son32", "son16", "ceyrekFinal", "yariFinal"];
            if(aktifTur === "final") gectigiTurlar = ["son32", "son16", "ceyrekFinal", "yariFinal", "ucunculuk"];
            
            gectigiTurlar.forEach(turIsmi => {
                let btn = document.querySelector(`.sekme-btn[data-tur="${turIsmi}"]`);
                if(btn) btn.classList.remove("kilitli");
            });

        } else {
            DOM.grupSekmeleriAlani.classList.remove("gizli");
            DOM.elemeSekmeleriAlani.classList.add("gizli");
            DOM.btnGruplariGoster.innerText = metinGetir('grupGizle');
        }
    } else {
        istatistikleriSifirla(takimlar); 
    }
}

DOM.btnGruplariGoster.addEventListener("click", () => {
    if (DOM.grupSekmeleriAlani.classList.contains("gizli")) {
        DOM.grupSekmeleriAlani.classList.remove("gizli");
        DOM.btnGruplariGoster.innerText = metinGetir('grupGizle');
    } else {
        DOM.grupSekmeleriAlani.classList.add("gizli");
        DOM.btnGruplariGoster.innerText = metinGetir('grupGoster');
    }
});

DOM.sekmeButonlari.forEach(btn => {
    btn.addEventListener("click", function() {
        if(this.classList.contains("kilitli") || simuleEdiliyor) return; 
        aktifTur = this.getAttribute("data-tur");
        durumuKaydet(); 
        ekranGuncelle();
    });
});

DOM.btnSon32Gec.addEventListener("click", () => {
    if (simuleEdiliyor) return;
    simuleEdiliyor = true;

    loadingMetniDegistir("...");
    animasyonluYukle(800, () => {
        eslesmeleriBelirle(); 
        aktifTur = "son32";
        
        DOM.elemeSekmeleriAlani.classList.remove("gizli");
        DOM.grupSekmeleriAlani.classList.add("gizli");
        DOM.btnGruplariGoster.innerText = metinGetir('grupGoster');
        
        simuleEdiliyor = false;
        durumuKaydet();
        ekranGuncelle();
    });
});

function eslesmeleriBelirle() {
    let liderler = {}, ikinciler = {};
    gruplarListesi.forEach(grupHarfi => {
        let g = takimlar.filter(t => t.grup === grupHarfi).sort((a, b) => {
            if (b.puan !== a.puan) return b.puan - a.puan;
            if (b.averaj !== a.averaj) return b.averaj - a.averaj;
            return b.atilanGol - a.atilanGol;
        });
        liderler[grupHarfi] = g[0].isim;
        ikinciler[grupHarfi] = g[1].isim;
    });

    let eIU = tumUcunculer.slice(0, 8); 
    let havuz3 = eIU.map(t => t.isim);

    elemeEslesmeleri.son32.forEach(mac => {
        if (mac.evSahibi.startsWith("{") && mac.evSahibi.endsWith("}")) {
            let kod = mac.evSahibi.replace("{", "").replace("}", "");
            if (kod.startsWith("X3")) {
                if (havuz3.length > 0) mac.evSahibi = havuz3.shift(); 
            } else {
                let grup = kod.charAt(0);
                let derece = kod.charAt(1);
                if (derece === "1") mac.evSahibi = liderler[grup];
                else if (derece === "2") mac.evSahibi = ikinciler[grup];
            }
        }
        
        if (mac.deplasman.startsWith("{") && mac.deplasman.endsWith("}")) {
            let kod = mac.deplasman.replace("{", "").replace("}", "");
            if (kod.startsWith("X3")) {
                if (havuz3.length > 0) mac.deplasman = havuz3.shift(); 
            } else {
                let grup = kod.charAt(0);
                let derece = kod.charAt(1);
                if (derece === "1") mac.deplasman = liderler[grup];
                else if (derece === "2") mac.deplasman = ikinciler[grup];
            }
        }
    });
}

function turaGoreSiradakiAsama() {
    if (aktifTur === "son32") return "son16";
    if (aktifTur === "son16") return "ceyrekFinal";
    if (aktifTur === "ceyrekFinal") return "yariFinal";
    if (aktifTur === "yariFinal") return "ucunculuk"; 
    if (aktifTur === "ucunculuk") return "final";     
    return null;
}

DOM.btnSonrakiTuraGec.addEventListener("click", () => {
    if (simuleEdiliyor) return;
    let siradakiTur = turaGoreSiradakiAsama();
    if (!siradakiTur) return;

    simuleEdiliyor = true;
    loadingMetniDegistir("...");
    animasyonluYukle(300, () => {
        aktifTur = siradakiTur;
        simuleEdiliyor = false;
        durumuKaydet();
        ekranGuncelle();

        if (aktifTur === "final") {
            let finalMaci = elemeEslesmeleri.final[0];
            let finalHaberi = HTMLFinalHaberiOlustur(finalMaci.evSahibi, finalMaci.deplasman);
            DOM.newspaperContent.innerHTML = finalHaberi;
            DOM.newspaperModal.classList.add("goster");
        }
    });
});

function kazananTakimBul(macId) {
    let macDurumu = oynananMaclar[macId];
    if(!macDurumu) return "Belirsiz";
    let macData = null;
    Object.keys(elemeEslesmeleri).forEach(tur => {
        let f = elemeEslesmeleri[tur].find(m => m.id === macId);
        if(f) macData = f;
    });
    if(!macData) return "Belirsiz";
    if (macDurumu.penalti) return macDurumu.penE > macDurumu.penD ? macData.evSahibi : macData.deplasman;
    return macDurumu.skorE > macDurumu.skorD ? macData.evSahibi : macData.deplasman;
}

function kaybedenTakimBul(macId) {
    let macDurumu = oynananMaclar[macId];
    if(!macDurumu) return "Belirsiz";
    let macData = null;
    Object.keys(elemeEslesmeleri).forEach(tur => {
        let f = elemeEslesmeleri[tur].find(m => m.id === macId);
        if(f) macData = f;
    });
    if(!macData) return "Belirsiz";
    if (macDurumu.penalti) return macDurumu.penE < macDurumu.penD ? macData.evSahibi : macData.deplasman;
    return macDurumu.skorE < macDurumu.skorD ? macData.evSahibi : macData.deplasman;
}

function eslesmeleriAnlikGuncelle() {
    let turlar = ["son16", "ceyrekFinal", "yariFinal", "ucunculuk", "final"];
    turlar.forEach(tur => {
        elemeEslesmeleri[tur].forEach(mac => {
            if (mac.evSahibi.includes("{K_")) {
                let refId = mac.evSahibi.replace("{K_", "").replace("}", "");
                let kazanan = kazananTakimBul(refId);
                if (kazanan !== "Belirsiz") mac.evSahibi = kazanan;
            }
            if (mac.deplasman.includes("{K_")) {
                let refId = mac.deplasman.replace("{K_", "").replace("}", "");
                let kazanan = kazananTakimBul(refId);
                if (kazanan !== "Belirsiz") mac.deplasman = kazanan;
            }
            if (mac.evSahibi.includes("{M_")) {
                let refId = mac.evSahibi.replace("{M_", "").replace("}", "");
                let kaybeden = kaybedenTakimBul(refId);
                if (kaybeden !== "Belirsiz") mac.evSahibi = kaybeden;
            }
            if (mac.deplasman.includes("{M_")) {
                let refId = mac.deplasman.replace("{M_", "").replace("}", "");
                let kaybeden = kaybedenTakimBul(refId);
                if (kaybeden !== "Belirsiz") mac.deplasman = kaybeden;
            }
        });
    });
}

function gazeteyiGoster(maclarListesi) {
    let html = HTMLGazeteOlustur(maclarListesi);
    if (html) {
        DOM.newspaperContent.innerHTML = html;
        DOM.newspaperModal.classList.add("goster");
    }
}

function kutlamayiBaslat(sampiyon) {
    DOM.celebrationContainer.innerHTML = `
        <div style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); z-index:9999; display:flex; flex-direction:column; align-items:center; justify-content:center; color:white; text-align:center;">
            <h1 style="font-size: 4rem; color: #ffb300; text-shadow: 0 0 20px #ffb300; margin-bottom: 20px; text-transform: uppercase;">${metinGetir('buyukFinal')}</h1>
            <h2 style="font-size: 3rem; margin-bottom: 30px;">${ulkeCevir(sampiyon).toUpperCase()}</h2>
            <p style="font-size: 5rem; margin:0; animation: pulse 1s infinite;">🎉 🎇 🎊</p>
            <button class="btn-kapat-kutlama btn-dev" style="margin-top:40px; background-color: var(--accent-blue);">${metinGetir('kapat')}</button>
        </div>
    `;
    DOM.celebrationContainer.classList.remove("gizli");
    DOM.celebrationContainer.classList.add("kutlandi");
}

document.addEventListener("click", (e) => {
    if(e.target.id === "btn-match-detail-kapat") DOM.matchDetailModal.classList.remove("goster");
    if(e.target === DOM.newspaperModal) DOM.newspaperModal.classList.remove("goster");
    if(e.target === DOM.matchDetailModal) DOM.matchDetailModal.classList.remove("goster");
    if(e.target.classList.contains("btn-kapat-kutlama")) DOM.celebrationContainer.classList.add("gizli");
});

DOM.macLoglariDiv.addEventListener("click", function(e) {
    if (simuleEdiliyor) return; 
    
    let hedefButon = e.target.closest(".mac-oyna-btn"); 
    if (hedefButon) {
        let macId = hedefButon.getAttribute("data-macid");
        let isEleme = hedefButon.getAttribute("data-eleme") === "true";
        
        if (isEleme && !oynananMaclar[macId]) {
            let macinTuru = Object.keys(elemeEslesmeleri).find(tur => elemeEslesmeleri[tur].some(m => m.id === macId));
            
            let gectigiTurlar = [];
            if(aktifTur === "son16") gectigiTurlar = ["son32"];
            if(aktifTur === "ceyrekFinal") gectigiTurlar = ["son32", "son16"];
            if(aktifTur === "yariFinal") gectigiTurlar = ["son32", "son16", "ceyrekFinal"];
            
            // DÜZELTME: Tıklama anındaki geçmiş turların doğrulaması da tamamen ayrıldı
            if(aktifTur === "ucunculuk") gectigiTurlar = ["son32", "son16", "ceyrekFinal", "yariFinal"];
            if(aktifTur === "final") gectigiTurlar = ["son32", "son16", "ceyrekFinal", "yariFinal", "ucunculuk"];
            
            if (macinTuru !== aktifTur && !gectigiTurlar.includes(macinTuru)) {
                let aktifSekmeIsim = document.querySelector('.sekme-btn.aktif').innerText;
                alert(`${aktifSekmeIsim} ${metinGetir('turUyarisi')}`);
                return;
            }
        }

        if (oynananMaclar[macId]) {
            let evSahibiAd = "", deplasmanAd = "";
            if (isEleme) {
                let macDataList = [ ...elemeEslesmeleri.son32, ...elemeEslesmeleri.son16, ...elemeEslesmeleri.ceyrekFinal, ...elemeEslesmeleri.yariFinal, ...elemeEslesmeleri.final, ...elemeEslesmeleri.ucunculuk ];
                let mac = macDataList.find(m => m.id === macId);
                evSahibiAd = ulkeCevir(mac.evSahibi);
                deplasmanAd = ulkeCevir(mac.deplasman);
            } else {
                let mac = resmiFikstur.find(m => m.id === macId);
                evSahibiAd = ulkeCevir(mac.evSahibi);
                deplasmanAd = ulkeCevir(mac.deplasman);
            }
            DOM.matchDetailContent.innerHTML = HTMLMacDetayiOlustur(oynananMaclar[macId], evSahibiAd, deplasmanAd);
            DOM.matchDetailModal.classList.add("goster");
            return; 
        }

        simuleEdiliyor = true; 
        loadingMetniDegistir("...");
        
        animasyonluYukle(300, () => {
            let evSahibi = null, deplasman = null;

            if (isEleme) {
                let macDataList = [
                    ...elemeEslesmeleri.son32, ...elemeEslesmeleri.son16, 
                    ...elemeEslesmeleri.ceyrekFinal, ...elemeEslesmeleri.yariFinal, 
                    ...elemeEslesmeleri.final, ...elemeEslesmeleri.ucunculuk
                ];
                let mac = macDataList.find(m => m.id === macId);
                evSahibi = takimlar.find(t => t.isim === mac.evSahibi);
                deplasman = takimlar.find(t => t.isim === mac.deplasman);
            } else {
                let mac = resmiFikstur.find(m => m.id === macId);
                evSahibi = takimlar.find(t => t.isim === mac.evSahibi);
                deplasman = takimlar.find(t => t.isim === mac.deplasman);
            }
            
            if(evSahibi && deplasman) {
                oynananMaclar[macId] = maciIsle(evSahibi, deplasman, isEleme);
                eslesmeleriAnlikGuncelle(); 
            }
            
            if(!isEleme) macGunuKontrolEt();
            
            simuleEdiliyor = false; 
            durumuKaydet();
            ekranGuncelle();
        });
    }
});

DOM.btnMacGunuTamamla.addEventListener("click", function() {
    if (simuleEdiliyor) return; 
    simuleEdiliyor = true; 

    loadingMetniDegistir("...");
    animasyonluYukle(800, () => {
        let isEleme = ["son32", "son16", "ceyrekFinal", "yariFinal", "ucunculuk", "final"].includes(aktifTur);
        let oynanacakMaclar = [];

        if (isEleme) {
            oynanacakMaclar = elemeEslesmeleri[aktifTur].filter(m => !oynananMaclar[m.id]);
        } else {
            oynanacakMaclar = resmiFikstur.filter(m => m.macGunu === globalMacGunu && !oynananMaclar[m.id]);
        }
        
        let oynananListesi = [];
        oynanacakMaclar.forEach(mac => {
            let evSahibi = takimlar.find(t => t.isim === mac.evSahibi);
            let deplasman = takimlar.find(t => t.isim === mac.deplasman);
            if(evSahibi && deplasman) {
                let sonuc = maciIsle(evSahibi, deplasman, isEleme);
                oynananMaclar[mac.id] = sonuc;
                oynananListesi.push({...mac, ...sonuc});
            }
        });

        if(isEleme) {
            eslesmeleriAnlikGuncelle();
            if (oynananListesi.length > 0 && aktifTur !== "final" && aktifTur !== "ucunculuk") {
                gazeteyiGoster(oynananListesi);
            }
        } else {
            macGunuKontrolEt();
        }
        
        simuleEdiliyor = false; 
        durumuKaydet();
        ekranGuncelle();
    });
});

function macGunuKontrolEt() {
    let buGununMaclari = resmiFikstur.filter(m => m.macGunu === globalMacGunu);
    let bitenMacSayisi = 0;
    let bugunBitenlerObjesi = [];
    
    buGununMaclari.forEach(m => {
        if (oynananMaclar[m.id]) {
            bitenMacSayisi++;
            bugunBitenlerObjesi.push({...m, ...oynananMaclar[m.id]});
        }
    });

    if (bitenMacSayisi === buGununMaclari.length && buGununMaclari.length > 0) {
        gazeteyiGoster(bugunBitenlerObjesi); 
        if (globalMacGunu < 3) {
            globalMacGunu++;
        } else {
            turnuvayiTamamla();
        }
    }
}

function turnuvayiTamamla() {
    let toplamBitenGrupMaci = Object.keys(oynananMaclar).filter(id => id.startsWith("M")).length;
    if (toplamBitenGrupMaci < 72) return; 

    tumUcunculer = [];
    gruplarListesi.forEach(grupHarfi => {
        let g = takimlar.filter(t => t.grup === grupHarfi).sort((a, b) => {
            if (b.puan !== a.puan) return b.puan - a.puan;
            if (b.averaj !== a.averaj) return b.averaj - a.averaj;
            return b.atilanGol - a.atilanGol;
        });
        tumUcunculer.push(g[2]); 
    });
    tumUcunculer.sort((a, b) => {
        if (b.puan !== a.puan) return b.puan - a.puan;
        if (b.averaj !== a.averaj) return b.averaj - a.averaj;
        return b.atilanGol - a.atilanGol;
    });
}

function ekranGuncelle() {
    DOM.sekmeButonlari.forEach(btn => {
        btn.classList.remove("aktif");
        if (btn.getAttribute("data-tur") === aktifTur) btn.classList.add("aktif");
    });

    let maclarKapsayici = document.getElementById('game-main-container');
    
    if(aktifTur === "final" && elemeEslesmeleri.final[0] && oynananMaclar[elemeEslesmeleri.final[0].id]) {
        DOM.btnIstatistikleriGoster.style.display = "inline-block";
    } else {
        DOM.btnIstatistikleriGoster.style.display = "none";
    }

    if (["A","B","C","D","E","F","G","H","I","J","K","L","3"].includes(aktifTur)) {
        
        maclarKapsayici.classList.remove("genis-ekran"); 

        gruplarListesi.forEach(grupHarfi => {
            let maclar = resmiFikstur.filter(m => m.grup === grupHarfi);
            let bittiMi = maclar.every(m => oynananMaclar[m.id]);
            let btn = document.querySelector(`.sekme-btn[data-tur="${grupHarfi}"]`);
            if (btn) {
                if (bittiMi) btn.classList.add("tamamlandi");
                else btn.classList.remove("tamamlandi");
            }
        });

        DOM.panelAksiyonlar.style.display = "flex";
        DOM.btnMacGunuTamamla.style.display = "inline-block";
        DOM.btnSonrakiTuraGec.style.display = "none";
        DOM.btnSon32Gec.style.display = "none";

        if (Object.keys(oynananMaclar).filter(id => id.startsWith("M")).length === 72) {
            DOM.sekmeUcunculer.style.display = "inline-block";
            DOM.sekmeUcunculer.classList.remove("kilitli");
            DOM.btnMacGunuTamamla.style.display = "none";
            DOM.btnSon32Gec.style.display = "inline-block";
            DOM.globalMacGunuMetni.innerText = metinGetir('grupAsamasiBitti');
        } else {
            DOM.sekmeUcunculer.style.display = "none";
            DOM.sekmeUcunculer.classList.add("kilitli");
            DOM.btnMacGunuTamamla.innerText = `${globalMacGunu}. ${metinGetir('macGunuTamamla')}`;
            DOM.globalMacGunuMetni.innerText = `${metinGetir('turnuvaDurumu')}: ${globalMacGunu}. ${metinGetir('durumGrup')}`;
        }

        document.getElementById("baslik-grup").innerText = aktifTur === "3" ? metinGetir('enIyiUcunculer') : `${metinGetir('grupMetni')} ${aktifTur}`;
        
        if (aktifTur === "3") {
            DOM.puanTablosuAlani.innerHTML = "";
            enIyiUcunculeriCizUI();
        } else {
            let g = takimlar.filter(t => t.grup === aktifTur).sort((a, b) => {
                if (b.puan !== a.puan) return b.puan - a.puan;
                if (b.averaj !== a.averaj) return b.averaj - a.averaj;
                return b.atilanGol - a.atilanGol;
            });
            let tumTurnuvaBittiMi = (Object.keys(oynananMaclar).filter(id => id.startsWith("M")).length === 72);
            DOM.puanTablosuAlani.innerHTML = HTMLPuanTablosuOlustur(g, tumTurnuvaBittiMi, tumUcunculer, kullaniciTakimi);
            let grupFiksturListesi = resmiFikstur.filter(m => m.grup === aktifTur);
            DOM.macLoglariDiv.innerHTML = HTMLGrupFiksturuOlustur(grupFiksturListesi, oynananMaclar, globalMacGunu, kullaniciTakimi);
        }
    } 
    else {
        maclarKapsayici.classList.add("genis-ekran"); 
        DOM.puanTablosuAlani.innerHTML = ""; 
        
        DOM.panelAksiyonlar.style.display = "flex";
        DOM.btnMacGunuTamamla.style.display = "inline-block";
        DOM.btnMacGunuTamamla.innerText = metinGetir('tumTuruOyna');
        DOM.btnSon32Gec.style.display = "none";
        DOM.btnSonrakiTuraGec.style.display = "none";

        document.querySelector(`.sekme-btn[data-tur="${aktifTur}"]`).classList.remove("kilitli");
        
        let buTurMaclari = elemeEslesmeleri[aktifTur];
        let tumuOynandiMi = buTurMaclari.every(m => oynananMaclar[m.id]);

        document.getElementById("baslik-grup").innerText = metinGetir('elemeAgaci');
        DOM.globalMacGunuMetni.innerText = `${document.querySelector(`.sekme-btn[data-tur="${aktifTur}"]`).innerText}`;
        
        DOM.macLoglariDiv.innerHTML = HTMLGorselAgacOlustur(elemeEslesmeleri, oynananMaclar, kullaniciTakimi, aktifTur);

        if (aktifTur === "final") {
            DOM.globalMacGunuMetni.innerText = metinGetir('buyukFinal');
            
            let finalOynandiMi = oynananMaclar[buTurMaclari[0].id];
            if (finalOynandiMi) {
                DOM.btnMacGunuTamamla.style.display = "none";
                let sampiyon = kazananTakimBul(buTurMaclari[0].id);
                DOM.globalMacGunuMetni.innerText = `${metinGetir('dunyaSampiyonu')}: ${ulkeCevir(sampiyon)}! 👑`;

                if(!DOM.celebrationContainer.classList.contains("kutlandi")) {
                    kutlamayiBaslat(sampiyon);
                }
            }
        } 
        else {
            if (tumuOynandiMi) {
                DOM.btnMacGunuTamamla.style.display = "none";
                DOM.btnSonrakiTuraGec.style.display = "inline-block";
                let siradaki = turaGoreSiradakiAsama();
                if(siradaki) document.querySelector(`.sekme-btn[data-tur="${siradaki}"]`).classList.remove("kilitli");
            }
        }
    }

    if(aktifSlotId) DOM.aktifKariyerBilgisi.innerText = `${metinGetir('aktifKariyer')} ${aktifSlotId} (${kullaniciTakimi ? ulkeCevir(kullaniciTakimi) : metinGetir('menajersiz')})`;
}

DOM.btnIstatistikleriGoster.addEventListener("click", () => {
    istatistikleriEkranaBas(takimlar);
    DOM.istatistikModal.classList.add("goster");
});
DOM.btnIstatistikKapat.addEventListener("click", () => DOM.istatistikModal.classList.remove("goster"));

function enIyiUcunculeriCizUI() {
    let tabloHTML = `<h3 style="color:var(--accent-blue); text-align:center; padding: 20px;">${metinGetir('enIyiUcuncuEtiket')}</h3>`;
    tabloHTML += `<table class="puan-tablosu"><thead><tr><th>${metinGetir('sira')}</th><th>${metinGetir('tabloTakim')}</th><th>${metinGetir('tabloP')}</th><th>${metinGetir('tabloAV')}</th><th>${metinGetir('tabloAG')}</th></tr></thead><tbody>`;
    tumUcunculer.forEach((t, i) => {
        let st = i < 8 ? "border-left: 5px solid var(--accent-blue);" : "";
        tabloHTML += `<tr><td style="${st}">${i+1}</td><td>${ulkeCevir(t.isim)}</td><td>${t.puan}</td><td>${t.averaj}</td><td>${t.atilanGol}</td></tr>`;
    });
    tabloHTML += `</tbody></table>`;
    DOM.macLoglariDiv.innerHTML = tabloHTML;
}

DOM.btnAnasayfaDon.addEventListener("click", () => {
    if (simuleEdiliyor) return;
    aktifOturumuKapat(); 
    ekranDegistir(DOM.viewMainMenu);
});

DOM.linkGizlilik.addEventListener("click", (e) => {
    e.preventDefault(); 
    ekranDegistir(DOM.viewPrivacy);
});
DOM.btnPrivacyKapat.addEventListener("click", () => {
    ekranDegistir(oncekiEkran); 
});

DOM.linkIletisim.addEventListener("click", (e) => {
    e.preventDefault();
    ekranDegistir(DOM.viewContact);
});
DOM.btnContactKapat.addEventListener("click", () => {
    ekranDegistir(oncekiEkran); 
});

DOM.iletisimFormu.addEventListener("submit", function(e) {
    e.preventDefault(); 
    if (!DOM.emailInput.value.includes('@')) {
        alert(metinGetir('hataEposta'));
        return;
    }

    const formData = new FormData(this);
    DOM.btnFormGonder.innerText = metinGetir('formGonderiliyor');
    DOM.btnFormGonder.disabled = true;

    fetch(this.action, {
        method: this.method,
        body: formData,
        headers: { 'Accept': 'application/json' }
    }).then(response => {
        if (response.ok) {
            DOM.iletisimFormu.reset(); 
            DOM.modalFormSuccess.classList.add("goster"); 
        } else {
            alert(metinGetir('hataGenel'));
        }
    }).catch(error => {
        alert(metinGetir('hataInternet'));
    }).finally(() => {
        DOM.btnFormGonder.innerText = metinGetir('formGonder');
        DOM.btnFormGonder.disabled = false;
    });
});

DOM.btnFormSuccessKapat.addEventListener("click", () => {
    DOM.modalFormSuccess.classList.remove("goster");
    ekranDegistir(oncekiEkran); 
});

function diliUygula() {
    if (!mevcutAyarlar.dil) mevcutAyarlar.dil = 'tr'; 
    DOM.dilButonlari.forEach(span => span.classList.remove("aktif"));
    let aktifDilSpan = document.getElementById(`lang-${mevcutAyarlar.dil}`);
    if (aktifDilSpan) aktifDilSpan.classList.add("aktif");
    
    sayfayiCevir(); 

    // Ekran güncellemeleri
    if(DOM.viewMainMenu.style.display !== "none") anaMenuyuGuncelle();
    if(DOM.viewGame.style.display !== "none") ekranGuncelle();
    
    // YENİ: Takım seçim ekranındayken anlık dil değişirse orayı da güncelle!
    if(DOM.viewTeamSelect.style.display !== "none") {
        // Eğer seçili bir takım varsa hafızadan çekiyoruz
        let secilenIsim = DOM.btnKariyeriBaslat.getAttribute("data-takim");
        
        // Grid'i (ülkeleri ve Grup yazılarını) yeni dile göre tekrar çiziyoruz
        takimSecimGridiniCiz(takimlar, gruplarListesi, secilenIsim);
        
        // Eğer o an bir takım seçiliyse, üstteki "Seçilen Ülke:" kısmını da yeni dile çeviriyoruz
        if (secilenIsim) {
            DOM.secilenTakimIsim.innerText = ulkeCevir(secilenIsim);
        }
    }
}

DOM.dilButonlari.forEach(span => {
    span.addEventListener("click", function() {
        if (simuleEdiliyor) return;
        mevcutAyarlar.dil = this.id.split("-")[1]; 
        ayarlariKaydet(mevcutAyarlar);
        diliUygula(); 
    });
});

temayiUygula();
diliUygula();
anaMenuyuGuncelle();

const kayitliOturumSlotId = aktifOturumuYukle();
if (kayitliOturumSlotId) {
    aktifSlotId = kayitliOturumSlotId;
    oyunuHafizadanKur(aktifSlotId);
    ekranDegistir(DOM.viewGame);
    ekranGuncelle();
} else {
    ekranDegistir(DOM.viewMainMenu);
}
// GLOBAL ZİYARETÇİ SAYACI (API)
// /up parametresi her ziyarette sayacı 1 artırır ve güncel rakamı döndürür
fetch('https://api.counterapi.dev/v1/wc26sim_yusufk_site/visits/up')
    .then(response => response.json())
    .then(data => {
        let sayacEl = document.getElementById('ziyaretci-sayisi');
        if (sayacEl && data.count) {
            sayacEl.innerText = data.count;
        }
    })
    .catch(err => {
        console.log("Sayaç verisi çekilemedi.");
        let sayacEl = document.getElementById('ziyaretci-sayisi');
        if (sayacEl) sayacEl.innerText = "Aktif";
    });
