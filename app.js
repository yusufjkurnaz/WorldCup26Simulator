// app.js 

import { AYARLAR } from './modules/config.js';
import { takimlar, gruplarListesi, resmiFikstur, turnuvaAgaci } from './data/teams.js'; 
import { istatistikleriSifirla, maciIsle } from './modules/engine.js';
import { DIL_SOZLUGU, ulkeCevir } from './modules/lang.js'; 
import { 
    DOM, animasyonluYukle, HTMLPuanTablosuOlustur, HTMLGrupFiksturuOlustur, 
    HTMLElemeFiksturuOlustur, HTMLGorselAgacOlustur, HTMLMacDetayiOlustur, 
    slotlariArayuzeCiz, takimSecimGridiniCiz
} from './ui/ui.js';
import { 
    oyunuKaydet, oyunuYukle, oyunuSifirla, ayarlariKaydet, ayarlariYukle, 
    tumSlotlariGetir, aktifOturumuKaydet, aktifOturumuYukle, aktifOturumuKapat 
} from './modules/storage.js';
import { initCustomGroups, gruplariKaristir, gruplariKaydetVeUygula, renderCustomGroups } from './modules/customGroups.js';

// C MODU, İSTATİSTİK VE YENİ TURNUVA MÜHENDİSLİĞİ BAĞLANTILARI
import { baslangicTaktikleriniAyarla } from './modules/tacticsInit.js';
import { taktikEkraniCiz } from './ui/tacticsUI.js';
import { 
    oyuncuIstatistikleri, istatistikleriBaslat, mactanSonraIstatistikleriGuncelle, 
    mactanSonraCezalariDus, ceyrekFinalSonrasiKartlariSifirla 
} from './modules/statsManager.js';
import { cezaliOyunculariYedekleDegistir } from './modules/tacticsManager.js';
import { dinamikFiksturYarat, eslesmeleriBelirle, turaGoreSiradakiAsama, turnuvayiTamamla } from './modules/tournamentManager.js';

// İSTATİSTİK VE RAPOR ARAYÜZLERİ
import { HTMLCanliIstatistiklerPaneliOlustur } from './ui/statsUI.js';
import { HTMLTurnuvaRaporuOlustur } from './ui/tournamentReportUI.js';

// YENİ: HABERLER ARAYÜZÜ BAĞLANTILARI
import { acilisHaberiUret, finalHaberiUret, HTMLHaberArsiviCiz, gunlukHaberUret } from './ui/newspaperUI.js';

const orjinalTakimlar = JSON.parse(JSON.stringify(takimlar));
const orjinalFiksturListesi = JSON.parse(JSON.stringify(resmiFikstur));

let aktifSlotId = null; 
let secilenOyunModu = null; 
let aktifTur = "A"; 
let globalMacGunu = 1;
let oynananMaclar = {}; 
let tumUcunculer = [];
let kullaniciTakimi = null;
let elemeEslesmeleri = {}; 
let oncekiEkran = DOM.viewMainMenu;
let simuleEdiliyor = false;

// YENİ: HABER HAVUZU (Arşiv)
let turnuvaHaberleri = []; 

let mevcutAyarlar = ayarlariYukle();

function orjinalAyarlaraDon() {
    takimlar.forEach((t, i) => {
        t.grup = orjinalTakimlar[i].grup;
        delete t.ilk11;
        delete t.yedekler;
    });
    resmiFikstur.length = 0;
    resmiFikstur.push(...JSON.parse(JSON.stringify(orjinalFiksturListesi)));
}

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
        kullaniciTakimi, secilenOyunModu, elemeEslesmeleri, takimlar,
        aktifFikstur: resmiFikstur,
        oyuncuIstatistikleri: oyuncuIstatistikleri,
        turnuvaHaberleri: turnuvaHaberleri // Haberi kaydet
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
    
    let vMode = document.getElementById("view-mode-select");
    if(vMode) vMode.style.display = "none"; 
    
    let vCg = document.getElementById("view-custom-groups");
    if(vCg) vCg.style.display = "none";
    
    let vTac = document.getElementById("view-tactics");
    if(vTac) vTac.style.display = "none";

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
    
    [1, 2, 3, 4, 5].forEach(id => {
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
            let modMetni = data.secilenOyunModu === 'c' ? metinGetir('modTaktiksel') : (data.secilenOyunModu === 'b' ? metinGetir('modOzelGruplar') : metinGetir('modHizliSimule'));

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

document.querySelector(".kayit-slotlari-alani").addEventListener("click", function(e) {
    if (simuleEdiliyor) return; 

    if (e.target.classList.contains("btn-slot-yeni")) {
        aktifSlotId = e.target.getAttribute("data-slot");
        kullaniciTakimi = null;
        secilenOyunModu = null;
        
        let vMode = document.getElementById("view-mode-select");
        if(vMode) {
            ekranDegistir(vMode);
        } else {
            secilenOyunModu = 'a';
            orjinalAyarlaraDon();
            takimSecimGridiniCiz(takimlar, gruplarListesi);
            DOM.seciliTakimPaneli.classList.add("gizli");
            ekranDegistir(DOM.viewTeamSelect);
        }
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

document.addEventListener("click", (e) => {
    if (e.target.closest("#btn-team-select-iptal") || e.target.closest("#btn-mode-select-iptal")) {
        aktifSlotId = null;
        ekranDegistir(DOM.viewMainMenu);
    }
    else if (e.target.closest("#btn-mod-a")) {
        secilenOyunModu = 'a';
        orjinalAyarlaraDon();
        takimSecimGridiniCiz(takimlar, gruplarListesi);
        DOM.seciliTakimPaneli.classList.add("gizli");
        ekranDegistir(DOM.viewTeamSelect);
    }
    else if (e.target.closest("#btn-mod-b")) {
        secilenOyunModu = 'b';
        orjinalAyarlaraDon();
        initCustomGroups();
        ekranDegistir(document.getElementById("view-custom-groups"));
    }
    else if (e.target.closest("#btn-mod-c")) {
        secilenOyunModu = 'c';
        orjinalAyarlaraDon();
        takimSecimGridiniCiz(takimlar, gruplarListesi);
        DOM.seciliTakimPaneli.classList.add("gizli");
        ekranDegistir(DOM.viewTeamSelect);
    }
    else if (e.target.closest("#btn-cg-sifirla")) {
        initCustomGroups();
    }
    else if (e.target.closest("#btn-cg-karistir")) {
        gruplariKaristir();
    }
    else if (e.target.closest("#btn-cg-onayla")) {
        document.getElementById("cg-mode-modal").classList.add("goster");
    }
    else if (e.target.closest("#btn-cg-modal-iptal")) {
        document.getElementById("cg-mode-modal").classList.remove("goster");
    }
    else if (e.target.closest("#btn-cg-to-a")) {
        secilenOyunModu = 'a';
        gruplariKaydetVeUygula(); 
        dinamikFiksturYarat(); 
        document.getElementById("cg-mode-modal").classList.remove("goster");
        takimSecimGridiniCiz(takimlar, gruplarListesi);
        DOM.seciliTakimPaneli.classList.add("gizli");
        ekranDegistir(DOM.viewTeamSelect);
    }
    else if (e.target.closest("#btn-cg-to-c")) {
        secilenOyunModu = 'c';
        gruplariKaydetVeUygula();
        dinamikFiksturYarat(); 
        document.getElementById("cg-mode-modal").classList.remove("goster");
        takimSecimGridiniCiz(takimlar, gruplarListesi);
        DOM.seciliTakimPaneli.classList.add("gizli");
        ekranDegistir(DOM.viewTeamSelect);
    }
});

DOM.btnKariyeriBaslat.addEventListener("click", () => {
    let takim = DOM.btnKariyeriBaslat.getAttribute("data-takim");
    let grup = DOM.btnKariyeriBaslat.getAttribute("data-grup");
    if (takim && grup) yeniOyunBaslat(takim, grup);
});

const btnTaktikAc = document.getElementById('btn-taktik-ekrani-ac');
const viewTactics = document.getElementById('view-tactics');
const btnTaktikKapat = document.getElementById('btn-taktik-kapat');

if(btnTaktikAc) {
    btnTaktikAc.addEventListener('click', () => {
        if(kullaniciTakimi) {
            taktikEkraniCiz(kullaniciTakimi);
            viewTactics.style.display = "block";
            viewTactics.style.position = "fixed";
            viewTactics.style.top = "0";
            viewTactics.style.left = "0";
            viewTactics.style.width = "100%";
            viewTactics.style.height = "100%";
            viewTactics.style.backgroundColor = "rgba(0,0,0,0.85)";
            viewTactics.style.zIndex = "999";
            viewTactics.style.overflowY = "auto";
        }
    });
}

if(btnTaktikKapat) {
    btnTaktikKapat.addEventListener('click', () => viewTactics.style.display = "none");
}

function yeniOyunBaslat(secilenTakim, baslangicGrubu) {
    istatistikleriSifirla(takimlar);
    istatistikleriBaslat(); 
    baslangicTaktikleriniAyarla(takimlar); 
    
    oynananMaclar = {}; tumUcunculer = []; globalMacGunu = 1; 
    aktifTur = baslangicGrubu; 
    kullaniciTakimi = secilenTakim; 
    elemeEslesmeleri = JSON.parse(JSON.stringify(turnuvaAgaci)); 
    DOM.celebrationContainer.classList.remove("kutlandi");
    
    // YENİ: Yeni kariyer açıldığında haber havuzu sıfırlanır ve açılış haberi eklenir.
    turnuvaHaberleri = [acilisHaberiUret()];

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
        secilenOyunModu = kayit.secilenOyunModu || 'a';
        elemeEslesmeleri = kayit.elemeEslesmeleri || JSON.parse(JSON.stringify(turnuvaAgaci));
        
        // YENİ: Kaydedilmiş haber arşivini geri yükle
        turnuvaHaberleri = kayit.turnuvaHaberleri || [];

        takimlar.forEach((t, index) => {
            Object.assign(t, kayit.takimlar[index]);
        });
        
        if (kayit.aktifFikstur && kayit.aktifFikstur.length > 0) {
            resmiFikstur.length = 0;
            resmiFikstur.push(...kayit.aktifFikstur);
        }

        if (kayit.oyuncuIstatistikleri) {
            Object.keys(oyuncuIstatistikleri).forEach(k => delete oyuncuIstatistikleri[k]);
            Object.assign(oyuncuIstatistikleri, kayit.oyuncuIstatistikleri);
        }

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
        try {
            eslesmeleriBelirle(tumUcunculer, elemeEslesmeleri); 
            aktifTur = "son32";
            DOM.elemeSekmeleriAlani.classList.remove("gizli");
            DOM.grupSekmeleriAlani.classList.add("gizli");
            DOM.btnGruplariGoster.innerText = metinGetir('grupGoster');
        } catch(e) {
            console.error(e);
        } finally {
            simuleEdiliyor = false;
            durumuKaydet();
            ekranGuncelle();
        }
    });
});

DOM.btnSonrakiTuraGec.addEventListener("click", () => {
    if (simuleEdiliyor) return;
    let siradakiTur = turaGoreSiradakiAsama(aktifTur);
    if (!siradakiTur) return;

    simuleEdiliyor = true;
    loadingMetniDegistir("...");
    animasyonluYukle(300, () => {
        try {
            aktifTur = siradakiTur;
            if (aktifTur === "yariFinal") {
                ceyrekFinalSonrasiKartlariSifirla();
            }
        } catch(e) {
            console.error(e);
        } finally {
            simuleEdiliyor = false;
            durumuKaydet();
            ekranGuncelle();
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
    if(e.target === DOM.matchDetailModal) DOM.matchDetailModal.classList.remove("goster");
    if(e.target.classList.contains("btn-kapat-kutlama")) DOM.celebrationContainer.classList.add("gizli");
    
    // YENİ: Haberler kapatma butonu
    if(e.target.id === "btn-newspaper-kapat" || e.target === DOM.newspaperModal) {
        DOM.newspaperModal.classList.remove("goster");
    }

    let sekmeBtn = e.target.closest(".canli-ist-sekme-btn");
    if (sekmeBtn) {
        let hedef = sekmeBtn.getAttribute("data-hedef");
        if(hedef && typeof window.aktifIstatistikSekmesiniDegistir === "function") {
            window.aktifIstatistikSekmesiniDegistir(hedef);
        }
    }

    if (e.target.id === "btn-eski-canli-ist-don") {
        let istContainer = document.getElementById("modal-istatistik-listesi");
        if(istContainer) {
            istContainer.innerHTML = HTMLCanliIstatistiklerPaneliOlustur(oyuncuIstatistikleri);
        }
    }
});

// YENİ: Haberler Ekranını Açma Dinleyicisi
if(DOM.btnHaberlerEkraniAc) {
    DOM.btnHaberlerEkraniAc.addEventListener("click", () => {
        DOM.newspaperContent.innerHTML = HTMLHaberArsiviCiz(turnuvaHaberleri);
        DOM.newspaperModal.classList.add("goster");
    });
}

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
            try {
                let evSahibi = null, deplasman = null, macObjesi = null;
                if (isEleme) {
                    let macDataList = [
                        ...elemeEslesmeleri.son32, ...elemeEslesmeleri.son16, 
                        ...elemeEslesmeleri.ceyrekFinal, ...elemeEslesmeleri.yariFinal, 
                        ...elemeEslesmeleri.final, ...elemeEslesmeleri.ucunculuk
                    ];
                    macObjesi = macDataList.find(m => m.id === macId);
                    evSahibi = takimlar.find(t => t.isim === macObjesi.evSahibi);
                    deplasman = takimlar.find(t => t.isim === macObjesi.deplasman);
                } else {
                    macObjesi = resmiFikstur.find(m => m.id === macId);
                    evSahibi = takimlar.find(t => t.isim === macObjesi.evSahibi);
                    deplasman = takimlar.find(t => t.isim === macObjesi.deplasman);
                }
                
                if(evSahibi && deplasman) {
                    cezaliOyunculariYedekleDegistir(evSahibi.isim);
                    cezaliOyunculariYedekleDegistir(deplasman.isim);

                    let sonuc = maciIsle(evSahibi, deplasman, isEleme);
                    oynananMaclar[macId] = sonuc;

                    let tumOynayanlar = [...sonuc.oynayanlarE, ...sonuc.oynayanlarD];
                    let yeniCezalilar = mactanSonraIstatistikleriGuncelle(evSahibi.isim, deplasman.isim, sonuc.skorE, sonuc.skorD, sonuc.olaylar, sonuc.reytingler, tumOynayanlar);
                    
                    mactanSonraCezalariDus(evSahibi.isim, sonuc.oynayanlarE, yeniCezalilar);
                    mactanSonraCezalariDus(deplasman.isim, sonuc.oynayanlarD, yeniCezalilar);

                    eslesmeleriAnlikGuncelle(); 

                    // YENİ: Eleme maçları tek tek oynandığında haberi anında arşive ekle
                    if(isEleme && aktifTur !== "final" && aktifTur !== "ucunculuk") {
                        turnuvaHaberleri.unshift(gunlukHaberUret({...macObjesi, ...sonuc}));
                    }
                }
                if(!isEleme) macGunuKontrolEt();
            } catch(err) {
                console.error("Maç Hatası:", err);
            } finally {
                simuleEdiliyor = false; 
                durumuKaydet();
                ekranGuncelle();
            }
        });
    }
});

DOM.btnMacGunuTamamla.addEventListener("click", function() {
    if (simuleEdiliyor) return; 
    simuleEdiliyor = true; 
    loadingMetniDegistir("...");
    animasyonluYukle(800, () => {
        try {
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
                    cezaliOyunculariYedekleDegistir(evSahibi.isim);
                    cezaliOyunculariYedekleDegistir(deplasman.isim);

                    let sonuc = maciIsle(evSahibi, deplasman, isEleme);
                    oynananMaclar[mac.id] = sonuc;
                    oynananListesi.push({...mac, ...sonuc});

                    let tumOynayanlar = [...sonuc.oynayanlarE, ...sonuc.oynayanlarD];
                    let yeniCezalilar = mactanSonraIstatistikleriGuncelle(evSahibi.isim, deplasman.isim, sonuc.skorE, sonuc.skorD, sonuc.olaylar, sonuc.reytingler, tumOynayanlar);
                    
                    mactanSonraCezalariDus(evSahibi.isim, sonuc.oynayanlarE, yeniCezalilar);
                    mactanSonraCezalariDus(deplasman.isim, sonuc.oynayanlarD, yeniCezalilar);
                }
            });

            if(isEleme) {
                eslesmeleriAnlikGuncelle();
                // YENİ: Eleme turu toptan tamamlandığında içinden rastgele en fazla 3 maçı manşet yap (Spam önleyici)
                if (oynananListesi.length > 0 && aktifTur !== "final" && aktifTur !== "ucunculuk") {
                    let shuffled = [...oynananListesi].sort(() => 0.5 - Math.random());
                    let secilenAdet = Math.min(3, shuffled.length);
                    for(let i=0; i<secilenAdet; i++) {
                        turnuvaHaberleri.unshift(gunlukHaberUret(shuffled[i]));
                    }
                }
            } else {
                macGunuKontrolEt();
            }
        } catch(err) {
            console.error("Gün Hatası:", err);
        } finally {
            simuleEdiliyor = false; 
            durumuKaydet();
            ekranGuncelle();
        }
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
        // YENİ: Grup günleri bittiğinde gazeteyi patlatmak yerine rastgele 2 maçı Haber Havuzuna atar.
        let shuffled = [...bugunBitenlerObjesi].sort(() => 0.5 - Math.random());
        let secilenAdet = Math.min(2, shuffled.length);
        for(let i=0; i<secilenAdet; i++) {
            turnuvaHaberleri.unshift(gunlukHaberUret(shuffled[i]));
        }

        if (globalMacGunu < 3) {
            globalMacGunu++;
        } else {
            tumUcunculer = turnuvayiTamamla(oynananMaclar);
        }
    }
}

function ekranGuncelle() {
    DOM.sekmeButonlari.forEach(btn => {
        btn.classList.remove("aktif");
        if (btn.getAttribute("data-tur") === aktifTur) btn.classList.add("aktif");
    });

    let maclarKapsayici = document.getElementById('game-main-container');
    
    let isFinalFinished = false;
    let finalOynandiMi = false;
    if(aktifTur === "final" && elemeEslesmeleri.final && elemeEslesmeleri.final[0]) {
        finalOynandiMi = oynananMaclar[elemeEslesmeleri.final[0].id];
        if(finalOynandiMi) isFinalFinished = true;
    }

    if(isFinalFinished) {
       DOM.btnIstatistikleriGoster.innerHTML = metinGetir('turnuvaRaporu');
        DOM.btnIstatistikleriGoster.style.display = "inline-block";
    } else {
        DOM.btnIstatistikleriGoster.innerHTML = metinGetir('canliIstatistikler');
        DOM.btnIstatistikleriGoster.style.display = "inline-block";
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
            if (finalOynandiMi) {
                DOM.btnMacGunuTamamla.style.display = "none";
                let sampiyon = kazananTakimBul(buTurMaclari[0].id);
                DOM.globalMacGunuMetni.innerText = `${metinGetir('dunyaSampiyonu')}: ${ulkeCevir(sampiyon)}! 👑`;
                
                // YENİ: Final Haberini Arşive Gönder
                if (!turnuvaHaberleri.some(h => h.isOzel && h.skorMetni === "BÜYÜK FİNAL 🏆")) {
                    turnuvaHaberleri.unshift(finalHaberiUret(buTurMaclari[0].evSahibi, buTurMaclari[0].deplasman));
                    durumuKaydet(); // Arşivi finalle mühürle
                }

                if(!DOM.celebrationContainer.classList.contains("kutlandi")) {
                    kutlamayiBaslat(sampiyon);
                }
            }
        } 
        else {
            if (tumuOynandiMi) {
                DOM.btnMacGunuTamamla.style.display = "none";
                DOM.btnSonrakiTuraGec.style.display = "inline-block";
                let siradaki = turaGoreSiradakiAsama(aktifTur);
                if(siradaki) document.querySelector(`.sekme-btn[data-tur="${siradaki}"]`).classList.remove("kilitli");
            }
        }
    }

    const btnTaktikAcKontrol = document.getElementById('btn-taktik-ekrani-ac');
    if (btnTaktikAcKontrol) {
        if (secilenOyunModu === 'c' && kullaniciTakimi) {
            btnTaktikAcKontrol.style.display = "inline-block";
        } else {
            btnTaktikAcKontrol.style.display = "none";
        }
    }
    if(aktifSlotId) DOM.aktifKariyerBilgisi.innerText = `${metinGetir('aktifKariyer')} ${aktifSlotId} (${kullaniciTakimi ? ulkeCevir(kullaniciTakimi) : metinGetir('menajersiz')})`;
}

DOM.btnIstatistikleriGoster.addEventListener("click", () => {
    let finalMaci = elemeEslesmeleri.final && elemeEslesmeleri.final[0] ? elemeEslesmeleri.final[0] : null;
    let isFinalBitti = aktifTur === "final" && finalMaci && oynananMaclar[finalMaci.id];

    let istContainer = document.getElementById("modal-istatistik-listesi");
    if(istContainer) {
        if(isFinalBitti) {
            let sampiyon = kazananTakimBul(finalMaci.id);
            istContainer.innerHTML = HTMLTurnuvaRaporuOlustur(takimlar, oyuncuIstatistikleri, sampiyon) + 
            `<button id="btn-eski-canli-ist-don" class="btn-dev" style="margin-top: 15px; width: 100%; font-size: 0.9rem; background: var(--bg-secondary); color: var(--text-main);">${metinGetir('sezonunIstatistiklerineDon')}</button>`;
        } else {
            istContainer.innerHTML = HTMLCanliIstatistiklerPaneliOlustur(oyuncuIstatistikleri);
        }
    }
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
DOM.btnPrivacyKapat.addEventListener("click", () => ekranDegistir(oncekiEkran));

DOM.linkIletisim.addEventListener("click", (e) => {
    e.preventDefault();
    ekranDegistir(DOM.viewContact);
});
DOM.btnContactKapat.addEventListener("click", () => ekranDegistir(oncekiEkran));

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

    if(DOM.viewMainMenu.style.display !== "none") anaMenuyuGuncelle();
    if(DOM.viewGame.style.display !== "none") ekranGuncelle();
    if(DOM.viewTeamSelect.style.display !== "none") {
        let secilenIsim = DOM.btnKariyeriBaslat.getAttribute("data-takim");
        takimSecimGridiniCiz(takimlar, gruplarListesi, secilenIsim);
        if (secilenIsim) DOM.secilenTakimIsim.innerText = ulkeCevir(secilenIsim);
    }
    let vCg = document.getElementById("view-custom-groups");
    if(vCg && vCg.style.display !== "none") renderCustomGroups();
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

const kayitliOtumSlotId = aktifOturumuYukle();
if (kayitliOtumSlotId) {
    aktifSlotId = kayitliOtumSlotId;
    oyunuHafizadanKur(aktifSlotId);
    ekranDegistir(DOM.viewGame);
    ekranGuncelle();
} else {
    ekranDegistir(DOM.viewMainMenu);
}

fetch('https://api.counterapi.dev/v1/wc26sim_yusufk_site/visits/up')
    .then(response => response.json())
    .then(data => {
        let sayacEl = document.getElementById('ziyaretci-sayisi');
        if (sayacEl && data.count) sayacEl.innerText = data.count;
    })
    .catch(err => {
        let sayacEl = document.getElementById('ziyaretci-sayisi');
        if (sayacEl) sayacEl.innerText = "Aktif";
    });
