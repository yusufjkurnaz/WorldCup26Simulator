// newspaperUI.js
import { ayarlariYukle } from './storage.js';
import { ulkeCevir } from './lang.js'; // YENİ: Ülke çeviri fonksiyonu eklendi

function getDil() {
    let ayarlar = ayarlariYukle();
    return ayarlar && ayarlar.dil ? ayarlar.dil : 'tr';
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

function haberUret(mac, dil) {
    // YENİ: Takım isimleri haber oluşturulmadan önce çevriliyor
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

    return { baslik, icerik, skorMetni };
}

export function HTMLGazeteOlustur(gunlukMaclar) {
    if (!gunlukMaclar || gunlukMaclar.length === 0) return ""; 
    
    let dil = getDil();
    let t_bulten = dil === 'en' ? "2026 World Cup Official Newsletter" : (dil === 'de' ? "Offizieller Newsletter der WM 2026" : "2026 Dünya Kupası Resmi Bülteni");

    let shuffled = [...gunlukMaclar].sort(() => 0.5 - Math.random());
    let m1 = haberUret(shuffled[0], dil);
    
    let html = `
        <div class="newspaper-header">
            <h1 class="newspaper-title">WC26 DAILY</h1>
            <span class="newspaper-date">${t_bulten} - ${Math.floor(Math.random() * 900) + 100}</span>
        </div>
        
        <div style="margin-bottom: ${shuffled.length > 1 ? '20px' : '0'}; ${shuffled.length > 1 ? 'border-bottom: 2px dashed #2c2c2c; padding-bottom: 15px;' : ''}">
            <h2 class="newspaper-headline" style="font-size: 2.2rem; margin-bottom:10px;">${m1.baslik}</h2>
            <p class="newspaper-body" style="font-size: 1.15rem; margin-bottom:15px;">${m1.icerik}</p>
            <div style="font-weight: 900; color: #e11d48; font-size: 1.4rem; text-align:center;">${m1.skorMetni}</div>
        </div>
    `;

    if (shuffled.length > 1) {
        let m2 = haberUret(shuffled[1], dil);
        let m3 = shuffled.length > 2 ? haberUret(shuffled[2], dil) : null;

        html += `<div style="display: flex; gap: 15px; text-align:left;">
            <div style="flex: 1;">
                <h3 style="font-size: 1.3rem; line-height:1.2; margin-bottom: 8px; font-weight:900;">${m2.baslik}</h3>
                <p style="font-size: 0.95rem; margin-bottom: 10px; line-height:1.4;">${m2.icerik}</p>
                <div style="font-weight: bold; color: #e11d48;">${m2.skorMetni}</div>
            </div>`;
            
        if (m3) {
            html += `<div style="flex: 1; border-left: 1px solid #ccc; padding-left: 15px;">
                <h3 style="font-size: 1.3rem; line-height:1.2; margin-bottom: 8px; font-weight:900;">${m3.baslik}</h3>
                <p style="font-size: 0.95rem; margin-bottom: 10px; line-height:1.4;">${m3.icerik}</p>
                <div style="font-weight: bold; color: #e11d48;">${m3.skorMetni}</div>
            </div>`;
        }
        html += `</div>`;
    }

    return html;
}

export function HTMLFinalHaberiOlustur(evSahibi, deplasman) {
    let dil = getDil();
    let baslik, icerik, t_bulten;
    
    // YENİ: Final maçının manşetindeki isimler de çevriliyor
    evSahibi = ulkeCevir(evSahibi);
    deplasman = ulkeCevir(deplasman);

    if (dil === 'en') {
        t_bulten = "GRAND FINAL SPECIAL EDITION";
        baslik = `THE WORLD IS WATCHING: ${evSahibi.toUpperCase()} vs ${deplasman.toUpperCase()}!`;
        icerik = `The breathtaking marathon of the last few months has come to an end. The moment billions have been waiting for is here. The teams stepping onto the pitch to lift the championship trophy are ready. Who will write history in this epic showdown?`;
    } else if (dil === 'de') {
        t_bulten = "GROSSES FINALE SONDERAUSGABE";
        baslik = `DIE WELT SCHAUT ZU: ${evSahibi.toUpperCase()} vs ${deplasman.toUpperCase()}!`;
        icerik = `Der atemberaubende Marathon der letzten Monate ist zu Ende. Der Moment, auf den Milliarden gewartet haben, ist da. Die Teams, die das Spielfeld betreten, um die Meisterschaftstrophäe in die Höhe zu heben, sind bereit. Wer wird in diesem epischen Showdown Geschichte schreiben?`;
    } else {
        t_bulten = "BÜYÜK FİNAL ÖZEL BASKISI";
        baslik = `DÜNYANIN GÖZÜ BU MAÇTA: ${evSahibi.toUpperCase()} vs ${deplasman.toUpperCase()}!`;
        icerik = `Günlerdir süren nefes kesici maratonun sonuna geldik. Milyarlarca insanın ekran başına kilitleneceği o büyük an çattı. Şampiyonluk kupasını havaya kaldırmak için sahaya çıkacak olan ${evSahibi} ve ${deplasman} tüm hazırlıklarını tamamladı. Bu destansı mücadelenin sonunda tarihi kim yazacak?`;
    }

    return `
        <div class="newspaper-header">
            <h1 class="newspaper-title">WC26 DAILY</h1>
            <span class="newspaper-date">${t_bulten}</span>
        </div>
        <h2 class="newspaper-headline">${baslik}</h2>
        <p class="newspaper-body">${icerik}</p>
        <div class="newspaper-footer" style="border-top: none;">
            <span style="font-size: 4rem;">🏆</span>
        </div>
    `;
}