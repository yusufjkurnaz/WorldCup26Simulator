// ui/newspaperUI.js

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

function turkceTamlamaEki(isim) {
    if(!isim) return "";
    const unluler = "aıeiouöüAIEİOÖUÜ";
    let sonUnlu = "a";
    let sonHarf = isim.slice(-1);
    for (let i = isim.length - 1; i >= 0; i--) {
        if (unluler.includes(isim[i])) {
            sonUnlu = isim[i].toLowerCase();
            if(sonUnlu === 'i' || sonUnlu === 'İ') sonUnlu = 'i';
            if(sonUnlu === 'ı' || sonUnlu === 'I') sonUnlu = 'ı';
            break;
        }
    }
    let ek = "";
    if (unluler.includes(sonHarf)) ek += "n"; 
    if (sonUnlu === 'a' || sonUnlu === 'ı') ek += "ın";
    else if (sonUnlu === 'e' || sonUnlu === 'i') ek += "in";
    else if (sonUnlu === 'o' || sonUnlu === 'u') ek += "un";
    else if (sonUnlu === 'ö' || sonUnlu === 'ü') ek += "ün";
    return isim + "'" + ek;
}

function turkceIHalEki(isim) {
    if(!isim) return "";
    const unluler = "aıeiouöüAIEİOÖUÜ";
    let sonUnlu = "a";
    let sonHarf = isim.slice(-1);
    for (let i = isim.length - 1; i >= 0; i--) {
        if (unluler.includes(isim[i])) {
            sonUnlu = isim[i].toLowerCase();
            if(sonUnlu === 'i' || sonUnlu === 'İ') sonUnlu = 'i';
            if(sonUnlu === 'ı' || sonUnlu === 'I') sonUnlu = 'ı';
            break;
        }
    }
    let ek = "";
    if (unluler.includes(sonHarf)) ek += "y"; 
    if (sonUnlu === 'a' || sonUnlu === 'ı') ek += "ı";
    else if (sonUnlu === 'e' || sonUnlu === 'i') ek += "i";
    else if (sonUnlu === 'o' || sonUnlu === 'u') ek += "u";
    else if (sonUnlu === 'ö' || sonUnlu === 'ü') ek += "ü";
    return isim + "'" + ek;
}

export function gunlukHaberUret(mac) {
    let dil = getDil();
    let e = ulkeCevir(mac.evSahibi);
    let d = ulkeCevir(mac.deplasman);
    let sE = mac.skorE;
    let sD = mac.skorD;

    let kazanan = sE > sD ? e : (sD > sE ? d : "Beraberlik");
    let kaybeden = sE > sD ? d : e;
    
    if (mac.penalti) {
        kazanan = mac.penE > mac.penD ? e : d;
        kaybeden = mac.penE > mac.penD ? d : e;
    }

    let basliklar = [];
    let icerikler = [];

    if (dil === 'en') {
        if (mac.penalti) {
            basliklar = [`VICTORY ON PENALTIES FOR ${kazanan.toUpperCase()}!`, `HEARTBREAK IN SHOOTOUT!`, `${kazanan.toUpperCase()} ADVANCES!`];
            icerikler = [`After a breathtaking draw, ${kazanan} managed to eliminate ${kaybeden} in a tense penalty shootout.`, `${kaybeden} fans are devastated! ${kazanan} kept their nerves during the penalties and continues their journey.`];
        } else if (kazanan === "Beraberlik") {
            if (sE === 0) {
                basliklar = ["SILENT NIGHT!", "DEFENSES STOOD TALL", "NO GOALS SCORED"];
                icerikler = [`The highly anticipated match between ${e} and ${d} ended in a 0-0 draw. Both teams played very defensively.`];
            } else {
                basliklar = ["NO WINNER IN GOAL FEST!", "A FOOTBALL FEAST!", `UNFORGETTABLE ${sE}-${sD} MATCH`];
                icerikler = [`In a match full of attacks and ${sE + sD} goals, ${e} and ${d} couldn't break the tie. The fans enjoyed a true football feast.`];
            }
        } else {
            let fark = Math.abs(sE - sD);
            if (fark >= 3) {
                basliklar = [`${kazanan.toUpperCase()} DESTROYED THEM!`, `HISTORIC DIFFERENCE: ${Math.max(sE, sD)}-${Math.min(sE, sD)}`, `NIGHTMARE FOR ${kaybeden.toUpperCase()}!`];
                icerikler = [`Playing like true title contenders, ${kazanan} put on a show against ${kaybeden}. They left the pitch with a ruthless victory.`, `Huge shock for ${kaybeden}! Morale hit rock bottom after this heavy defeat, while ${kazanan} fans celebrate.`];
            } else if (fark === 1) {
                basliklar = [`${kazanan.toUpperCase()} WINS TIGHT CLASH`, "NARROW VICTORY", `BREATHTAKING MATCH GOES TO ${kazanan.toUpperCase()}!`];
                icerikler = [`In a fiercely contested match, ${kazanan} secured a golden victory against ${kaybeden} by a single goal.`, `A great tactical battle ended with ${kazanan} smiling. Despite their efforts, ${kaybeden} couldn't turn the match around.`];
            } else {
                basliklar = [`${kazanan.toUpperCase()} MAKES NO MISTAKES`, `COMFORTABLE WIN`, `${kazanan.toUpperCase()} MARCHES ON!`];
                icerikler = [`Leaving the pitch with a solid score, ${kazanan} put their opponent ${kaybeden} in a tough spot. They delivered the expected performance.`];
            }
        }
    } else if (dil === 'de') {
        if (mac.penalti) {
            basliklar = [`ELFMETER-SIEG FÜR ${kazanan.toUpperCase()}!`, `HERZSCHMERZ IM SHOOTOUT!`, `${kazanan.toUpperCase()} KOMMT WEITER!`];
            icerikler = [`Nach einem atemberaubenden Unentschieden konnte ${kazanan} ${kaybeden} im spannenden Elfmeterschießen eliminieren.`, `Die Fans von ${kaybeden} sind am Boden zerstört! ${kazanan} behielt im Elfmeterschießen die Nerven und setzt seine Reise fort.`];
        } else if (kazanan === "Beraberlik") {
            if (sE === 0) {
                basliklar = ["STILLE NACHT!", "ABWEHRREIHEN STANDEN FEST", "KEINE TORE"];
                icerikler = [`Das mit Spannung erwartete Spiel zwischen ${e} und ${d} endete mit einem 0:0-Unentschieden. Beide Teams spielten sehr defensiv.`];
            } else {
                basliklar = ["KEIN SIEGER IM TOREFEST!", "EIN FUSSBALLFEST!", `UNVERGESSLICHES ${sE}:${sD} SPIEL`];
                icerikler = [`In einem Spiel voller Angriffe und ${sE + sD} Toren konnten ${e} und ${d} den Gleichstand nicht brechen. Die Fans genossen ein wahres Fußballfest.`];
            }
        } else {
            let fark = Math.abs(sE - sD);
            if (fark >= 3) {
                basliklar = [`${kazanan.toUpperCase()} ZERSTÖRTE SIE!`, `HISTORISCHER UNTERSCHIED: ${Math.max(sE, sD)}-${Math.min(sE, sD)}`, `ALBTRAUM FÜR ${kaybeden.toUpperCase()}!`];
                icerikler = [`${kazanan} spielte wie ein wahrer Titelanwärter und zeigte gegen ${kaybeden} eine Show. Sie verließen den Platz mit einem rücksichtslosen Sieg.`, `Großer Schock für ${kaybeden}! Die Moral ist nach dieser schweren Niederlage am Tiefpunkt, während die Fans von ${kazanan} feiern.`];
            } else if (fark === 1) {
                basliklar = [`${kazanan.toUpperCase()} GEWINNT KNAPPES DUELL`, "KNAPPER SIEG", `ATEMBERAUBENDES SPIEL GEHT AN ${kazanan.toUpperCase()}!`];
                icerikler = [`In einem hart umkämpften Spiel sicherte sich ${kazanan} mit einem einzigen Tor einen goldenen Sieg gegen ${kaybeden}.`, `Eine großartige taktische Schlacht endete mit dem Lächeln von ${kazanan}. Trotz all ihrer Bemühungen konnte ${kaybeden} das Spiel nicht drehen.`];
            } else {
                basliklar = [`${kazanan.toUpperCase()} MACHT KEINE FEHLER`, `SOUVERÄNER SIEG`, `${kazanan.toUpperCase()} MARSCHIERT WEITER!`];
                icerikler = [`Mit einem soliden Ergebnis verließ ${kazanan} den Platz und brachte den Gegner ${kaybeden} in eine schwierige Lage. Sie lieferten die erwartete Leistung.`];
            }
        }
    } else {
        if (mac.penalti) {
            basliklar = [`BEYAZ NOKTADA ZAFER ${turkceTamlamaEki(kazanan).toUpperCase()}!`, `PENALTILARDA KALP DAYANMADI!`, `${kazanan.toUpperCase()} İPİ GÖĞÜSLEDİ!`];
            icerikler = [`Normal süresi ve uzatmaları berabere biten nefes kesen mücadelede, seri penaltı atışları sonucunda ${kazanan} rakibi ${turkceIHalEki(kaybeden)} saf dışı bırakmayı başardı.`, `${turkceTamlamaEki(kaybeden)} taraftarları yıkıldı! Penaltı atışlarında sinirlerine hakim olan ve hata yapmayan ${kazanan}, turnuvadaki yürüyüşüne devam ediyor.`];
        } else if (kazanan === "Beraberlik") {
            if (sE === 0) {
                basliklar = ["SESSİZ GECE!", "SAVUNMALAR GEÇİT VERMEDİ", "GOL SESİ ÇIKMADI"];
                icerikler = [`Futbolseverlerin büyük heyecanla beklediği ${e} - ${d} karşılaşmasında taraflar sahadan 0-0'lık eşitlikle ayrıldı. İki takım da katı savunma anlayışından taviz vermedi.`];
            } else {
                basliklar = ["GOLLÜ DÜELLODA KAZANAN YOK!", "TAM BİR FUTBOL ŞÖLENİ!", `${sE}-${sD}'LİK UNUTULMAZ MAÇ`];
                icerikler = [`Karşılıklı ataklara ve tam ${sE + sD} gole sahne olan maçta ${e} ile ${d} yenişemedi. Tribünler ve ekran başındakiler harika bir futbol ziyafeti izledi.`];
            }
        } else {
            let fark = Math.abs(sE - sD);
            if (fark >= 3) {
                basliklar = [`${kazanan.toUpperCase()} SAHADAN SİLDİ!`, `TARİHİ FARK: ${Math.max(sE, sD)}-${Math.min(sE, sD)}`, `${kaybeden.toUpperCase()} İÇİN KABUS GİBİ GECE!`];
                icerikler = [`Şampiyonluğun güçlü adaylarından biri gibi oynayan ${kazanan}, rakibi ${kaybeden} karşısında adeta şov yaptı. Sahadan acımasız bir farkla ayrılan ekip gövde gösterisi yaptı.`, `${kaybeden} cephesinde büyük şok! Kimsenin beklemediği bu ağır mağlubiyet sonrası takımda moraller sıfıra inerken, ${turkceTamlamaEki(kazanan)} taraftarları bayram ediyor.`];
            } else if (fark === 1) {
                basliklar = [`ZORLU SINAVDA GÜLEN TARAF ${kazanan.toUpperCase()}`, "TEK FARKLI ZAFER", `NEFES KESEN MAÇ ${turkceTamlamaEki(kazanan).toUpperCase()}!`];
                icerikler = [`Kıran kırana geçen mücadelede ${kazanan}, ${kaybeden} karşısında tek farklı galibiyetle altın değerinde bir zafer elde etti. Son dakikalar adeta kalp krizine neden oldu.`, `Müthiş bir taktik savaşına sahne olan maçta gülen taraf ${kazanan} oldu. ${kaybeden} son ana kadar çabalasa da maçı çevirmeye gücü yetmedi.`];
            } else {
                basliklar = [`${kazanan.toUpperCase()} HATA YAPMADI`, `RAHAT BİR GALİBİYET`, `${kazanan.toUpperCase()} DOLUDİZGİN!`];
                icerikler = [`Net bir skorla sahadan ayrılan ${kazanan}, rakibi ${turkceIHalEki(kaybeden)} turnuvada zor duruma soktu. Beklenen performansı sahaya yansıtan ekip taraftarlarını mutlu etti.`];
            }
        }
    }

    let baslik = basliklar[Math.floor(Math.random() * basliklar.length)];
    let icerik = icerikler[Math.floor(Math.random() * icerikler.length)];
    let skorMetni = mac.penalti ? `${e} ${sE} - ${sD} ${d} (Pen: ${mac.penE}-${mac.penD})` : `${e} ${sE} - ${sD} ${d}`;

    return { baslik, icerik, skorMetni, isOzel: false };
}

export function acilisHaberiUret() {
    let dil = getDil();
    let baslik = dil === 'en' ? "THE WORLD CUP BEGINS!" : (dil === 'de' ? "DIE WELTMEISTERSCHAFT BEGINNT!" : "DÜNYA KUPASI BAŞLIYOR!");
    let icerik = dil === 'en' ? "The wait is over. The biggest tournament on the planet kicks off today. All 48 teams have completed their preparations. Expect surprises, tears, and unforgettable moments." : (dil === 'de' ? "Das Warten hat ein Ende. Das größte Turnier des Planeten beginnt heute. Alle 48 Teams haben ihre Vorbereitungen abgeschlossen. Erwarten Sie Überraschungen, Tränen und unvergessliche Momente." : "Bekleyiş sona erdi. Dünyanın en büyük turnuvası bugün start alıyor. Katılan 48 takım da son taktik antrenmanlarını tamamladı. Şok edici sürprizler, gözyaşları ve unutulmaz anlara hazır olun.");
    return { baslik, icerik, skorMetni: "", isOzel: true };
}

export function finalHaberiUret(evSahibi, deplasman) {
    let dil = getDil();
    evSahibi = ulkeCevir(evSahibi);
    deplasman = ulkeCevir(deplasman);

    let baslik = dil === 'en' ? `THE WORLD IS WATCHING: ${evSahibi.toUpperCase()} vs ${deplasman.toUpperCase()}!` : (dil === 'de' ? `DIE WELT SCHAUT ZU: ${evSahibi.toUpperCase()} vs ${deplasman.toUpperCase()}!` : `DÜNYANIN GÖZÜ BU MAÇTA: ${evSahibi.toUpperCase()} vs ${deplasman.toUpperCase()}!`);
    let icerik = dil === 'en' ? "The breathtaking marathon has come to an end. The moment billions have been waiting for is here. Who will write history in this epic showdown?" : (dil === 'de' ? "Der atemberaubende Marathon ist zu Ende. Der Moment, auf den Milliarden gewartet haben, ist da. Wer wird in diesem epischen Showdown Geschichte schreiben?" : `Günlerdir süren nefes kesici maratonun sonuna geldik. Milyarlarca insanın ekran başına kilitleneceği o büyük an çattı. Bu destansı mücadelenin sonunda tarihi kim yazacak?`);
    let kupaMetni = dil === 'en' ? "GRAND FINAL 🏆" : (dil === 'de' ? "GROSSES FINALE 🏆" : "BÜYÜK FİNAL 🏆");
    
    return { baslik, icerik, skorMetni: kupaMetni, isOzel: true };
}

export function HTMLHaberArsiviCiz(haberlerListesi) {
    if (!haberlerListesi || haberlerListesi.length === 0) {
        return `<div style="padding:40px; text-align:center; color:#555; font-style:italic;">Henüz bir haber bulunmuyor.</div>`;
    }

    let flashHaber = haberlerListesi[0];
    let gecmisHaberler = haberlerListesi.slice(1);

    let html = `
        <style>
            .newspaper-wrapper {
                background-color: #f4f1ea;
                color: #111;
                font-family: "Georgia", "Times New Roman", serif;
                padding: 20px;
                border: 1px solid #ccc;
                border-radius: 4px;
            }
            .haber-container { 
                background: transparent; 
                border-top: 4px solid #111;
                border-bottom: 2px solid #111;
                margin-bottom: 25px; 
                padding: 15px 0;
            }
            .haber-baslik { 
                font-weight: 900; 
                font-size: 1.8rem; 
                color: #111; 
                text-transform: uppercase;
                margin-bottom: 12px;
                line-height: 1.2;
                text-align: center;
            }
            .haber-icerik { 
                font-size: 1.1rem; 
                color: #333; 
                line-height: 1.6; 
                text-align: justify;
                padding: 0 10px;
            }
            .haber-skor { 
                margin-top: 15px; 
                font-weight: bold; 
                color: #000; 
                font-size: 1.3rem; 
                text-align: center;
                border-top: 1px dashed #999;
                padding-top: 10px;
            }
            
            .gecmis-baslik { 
                margin-top: 20px; 
                margin-bottom: 15px; 
                color: #111; 
                font-weight: 900; 
                font-size: 1.4rem; 
                border-bottom: 3px double #111; 
                padding-bottom: 5px; 
                text-transform: uppercase;
                text-align: center;
            }
            .gecmis-liste { 
                display: grid; 
                grid-template-columns: 1fr 1fr; 
                gap: 20px; 
            }
            .gecmis-item { 
                border-right: 1px solid #ccc; 
                padding-right: 15px; 
            }
            .gecmis-item:nth-child(even) {
                border-right: none;
                padding-right: 0;
                padding-left: 5px;
            }
            .gecmis-item h4 { 
                margin: 0 0 8px 0; 
                font-size: 1.1rem; 
                color: #111; 
                text-transform: uppercase;
                line-height: 1.2;
            }
            .gecmis-item p { 
                margin: 0 0 10px 0; 
                font-size: 0.95rem; 
                color: #444; 
                line-height: 1.4;
                text-align: justify;
            }
            .gecmis-item span { 
                font-size: 0.9rem; 
                font-weight: bold; 
                color: #000; 
                background: #eee;
                padding: 3px 8px;
                border: 1px solid #ccc;
            }
            
            @media (max-width: 600px) {
                .gecmis-liste { grid-template-columns: 1fr; }
                .gecmis-item { border-right: none; padding-right: 0; border-bottom: 1px dashed #ccc; padding-bottom: 15px; }
            }
        </style>

        <div class="newspaper-wrapper">
            <div style="margin-bottom: 15px; display: flex; align-items: center; justify-content: center;">
                <span style="background: #111; color: white; padding: 4px 10px; font-size: 0.85rem; font-weight: bold; letter-spacing: 1px;">${metinGetir('flasManset')}</span>
            </div>
            
            <div class="haber-container">
                <div class="haber-baslik">${flashHaber.baslik}</div>
                <div class="haber-icerik">
                    ${flashHaber.icerik}
                </div>
                ${flashHaber.skorMetni ? `<div class="haber-skor">${flashHaber.skorMetni}</div>` : ''}
            </div>
    `;

    if (gecmisHaberler.length > 0) {
        html += `
            <div class="gecmis-baslik">${metinGetir('gecmisHaberler')}</div>
            <div class="gecmis-liste">
        `;
        gecmisHaberler.forEach(h => {
            html += `
                <div class="gecmis-item">
                    <h4>${h.baslik}</h4>
                    <p>${h.icerik}</p>
                    ${h.skorMetni ? `<span>${h.skorMetni}</span>` : ''}
                </div>
            `;
        });
        html += `</div>`;
    }

    html += `</div>`;
    return html;
}

export function HTMLGazeteOlustur(maclarListesi) { return ""; }
export function HTMLFinalHaberiOlustur(evSahibi, deplasman) { return ""; }
