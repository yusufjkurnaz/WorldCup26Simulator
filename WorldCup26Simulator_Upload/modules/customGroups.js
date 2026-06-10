// modules/customGroups.js

import { takimlar, gruplarListesi } from '../data/teams.js';
import { ulkeCevir, DIL_SOZLUGU } from './lang.js';
import { ayarlariYukle } from './storage.js';

export let cgHavuz = [];
export let cgGruplar = {};

// Hızlı Çeviri Yardımcısı
function getYerelMetin(anahtar) {
    let ayarlar = ayarlariYukle();
    let dil = ayarlar && ayarlar.dil ? ayarlar.dil : 'tr';
    return DIL_SOZLUGU[dil][anahtar] || DIL_SOZLUGU['tr'][anahtar] || anahtar;
}

// Sistemi sıfırlar ve başlatır
export function initCustomGroups() {
    cgHavuz = [...takimlar].sort((a, b) => b.yildiz - a.yildiz); // Yıldıza göre sıralı havuz
    cgGruplar = {};
    gruplarListesi.forEach(g => cgGruplar[g] = []);
    renderCustomGroups();
}

// Havuzdan veya bir gruptan takımı alır, hedefe yerleştirir
function takimiTasi(takimIsmi, hedefGrup) {
    let takimObj = null;

    // Havuzda ara
    let havuzIndex = cgHavuz.findIndex(t => t.isim === takimIsmi);
    if (havuzIndex > -1) {
        takimObj = cgHavuz.splice(havuzIndex, 1)[0];
    } else {
        // Gruplarda ara
        for (let g of gruplarListesi) {
            let gIndex = cgGruplar[g].findIndex(t => t.isim === takimIsmi);
            if (gIndex > -1) {
                takimObj = cgGruplar[g].splice(gIndex, 1)[0];
                break;
            }
        }
    }

    if (!takimObj) return;

    if (hedefGrup === 'havuz') {
        cgHavuz.push(takimObj);
        cgHavuz.sort((a, b) => b.yildiz - a.yildiz); // Havuza döneni geri sırala
    } else {
        if (cgGruplar[hedefGrup].length < 4) {
            cgGruplar[hedefGrup].push(takimObj);
        } else {
            // Eğer grup doluysa takımı geri havuza at
            cgHavuz.push(takimObj); 
        }
    }
    
    renderCustomGroups();
}

// "Tıkla-Doldur" Algoritması: A'dan başla, ilk boş (<4) gruba at
export function takimaTiklandi(takimIsmi, bulunduguYer) {
    if (bulunduguYer === 'havuz') {
        let ilkBosGrup = gruplarListesi.find(g => cgGruplar[g].length < 4);
        if (ilkBosGrup) takimiTasi(takimIsmi, ilkBosGrup);
    } else {
        // Gruptaki takıma tıklandıysa havuza geri gönder
        takimiTasi(takimIsmi, 'havuz');
    }
}

// Yapay Zeka Karıştırma (Shuffle)
export function gruplariKaristir() {
    let tumTakimlar = [...cgHavuz];
    for (let g of gruplarListesi) {
        tumTakimlar.push(...cgGruplar[g]);
        cgGruplar[g] = [];
    }
    
    // Rastgele karıştır
    tumTakimlar.sort(() => Math.random() - 0.5);

    let index = 0;
    for (let g of gruplarListesi) {
        for (let i = 0; i < 4; i++) {
            if(tumTakimlar[index]) {
                cgGruplar[g].push(tumTakimlar[index]);
                index++;
            }
        }
    }
    cgHavuz = [];
    renderCustomGroups();
}

// Ana Veritabanına (teams.js -> takimlar) uygula
export function gruplariKaydetVeUygula() {
    for (let g of gruplarListesi) {
        cgGruplar[g].forEach(t => {
            let gercekTakim = takimlar.find(anaTakim => anaTakim.isim === t.isim);
            if (gercekTakim) gercekTakim.grup = g; // Ana verideki grubunu ez!
        });
    }
}

// DOM'u Çizme ve Sürükle-Bırak Eventleri
export function renderCustomGroups() {
    const poolDOM = document.getElementById("cg-pool-list");
    const gridDOM = document.getElementById("cg-groups-grid");
    const countDOM = document.getElementById("cg-pool-count");
    const btnOnayla = document.getElementById("btn-cg-onayla");

    countDOM.innerText = cgHavuz.length;

    // KRİTİK: Dil sözlüğünden "Grup" kelimesini çek
    const grupMetni = getYerelMetin('grupMetni');

    // Havuzu Çiz
    poolDOM.innerHTML = "";
    cgHavuz.forEach(t => {
        let el = document.createElement("div");
        el.className = "cg-team-item";
        el.draggable = true;
        el.innerHTML = `<span>${ulkeCevir(t.isim)}</span> <span class="cg-team-gen">⭐${t.yildiz} | ${t.hucum + t.ortaSaha + t.savunma}</span>`;
        
        // Sürükleme Başladı
        el.addEventListener("dragstart", (e) => {
            e.dataTransfer.setData("text/plain", t.isim);
            setTimeout(() => el.classList.add("dragging"), 0);
        });
        el.addEventListener("dragend", () => el.classList.remove("dragging"));
        
        // Tıklama
        el.addEventListener("click", () => takimaTiklandi(t.isim, 'havuz'));
        
        poolDOM.appendChild(el);
    });

    // Grupları Çiz
    gridDOM.innerHTML = "";
    let tumGruplarDoluMu = true;

    gruplarListesi.forEach(grupHarfi => {
        let takimlar = cgGruplar[grupHarfi];
        if (takimlar.length < 4) tumGruplarDoluMu = false;
        let doluSinif = takimlar.length === 4 ? "dolu" : "";

        let box = document.createElement("div");
        box.className = `cg-group-box ${doluSinif}`;
        box.innerHTML = `<div class="cg-group-header">${grupMetni} ${grupHarfi} (${takimlar.length}/4)</div>`;

        takimlar.forEach(t => {
            let el = document.createElement("div");
            el.className = "cg-team-item";
            el.draggable = true;
            el.innerHTML = `<span>${ulkeCevir(t.isim)}</span>`;
            
            el.addEventListener("dragstart", (e) => {
                e.dataTransfer.setData("text/plain", t.isim);
                setTimeout(() => el.classList.add("dragging"), 0);
            });
            el.addEventListener("dragend", () => el.classList.remove("dragging"));
            el.addEventListener("click", () => takimaTiklandi(t.isim, grupHarfi));

            box.appendChild(el);
        });

        // Drop Eventleri
        box.addEventListener("dragover", (e) => {
            e.preventDefault();
            if (takimlar.length < 4) box.classList.add("drag-over");
        });
        box.addEventListener("dragleave", () => box.classList.remove("drag-over"));
        box.addEventListener("drop", (e) => {
            e.preventDefault();
            box.classList.remove("drag-over");
            let tIsim = e.dataTransfer.getData("text/plain");
            if (takimlar.length < 4) takimiTasi(tIsim, grupHarfi);
        });

        gridDOM.appendChild(box);
    });

    // Onayla butonunu havuz boşsa ve gruplar tamsa aktifleştir
    btnOnayla.disabled = !tumGruplarDoluMu;
}