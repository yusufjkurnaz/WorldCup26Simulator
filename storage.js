// TARAYICI HAFIZASI YÖNETİMİ (LOCAL STORAGE & SESSION STORAGE)
const VERSION_KEY = "WC26SIM_VERSION";
const SETTINGS_KEY = "WC26SIM_AYARLAR"; 
const SESSION_KEY = "WC26SIM_OTURUM"; 
const CURRENT_VERSION = "v4.0"; // YAYIN SÜRÜMÜ: SessionStorage düzeltmesi için v4.0

// --- 1. OYUN İLERLEMESİ (3'LÜ SLOT SİSTEMİ) ---

// Yardımcı: Versiyonu denetler, eskiyse veya yoksa çöpleri temizler
function versiyonKontrol() {
    const kayitliVersiyon = localStorage.getItem(VERSION_KEY);
    if (!kayitliVersiyon || kayitliVersiyon !== CURRENT_VERSION) {
        [1, 2, 3].forEach(id => localStorage.removeItem(`WC26SIM_SLOT_${id}`));
        sessionStorage.removeItem(SESSION_KEY); // Yeni sistem sekme hafızası temizliği
        localStorage.removeItem(SESSION_KEY); // Eski sistemden kalan çöpleri temizle
        localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
    }
}

// Belirli bir slota kaydeder
export function oyunuKaydet(slotId, state) {
    versiyonKontrol();
    localStorage.setItem(`WC26SIM_SLOT_${slotId}`, JSON.stringify(state));
}

// Belirli bir slotu yükler
export function oyunuYukle(slotId) {
    versiyonKontrol();
    const kayit = localStorage.getItem(`WC26SIM_SLOT_${slotId}`);
    return kayit ? JSON.parse(kayit) : null;
}

// Belirli bir slotu tamamen siler
export function oyunuSifirla(slotId) {
    localStorage.removeItem(`WC26SIM_SLOT_${slotId}`);
    // Eğer silinen slot, şu an aktif olarak oynadığımız slotsa oturumu da kapat
    if (aktifOturumuYukle() === String(slotId)) {
        aktifOturumuKapat();
    }
}

// Ana menü için tüm slotların durumunu liste halinde getirir
export function tumSlotlariGetir() {
    versiyonKontrol();
    let slotlar = {};
    [1, 2, 3].forEach(id => {
        const data = localStorage.getItem(`WC26SIM_SLOT_${id}`);
        slotlar[id] = data ? JSON.parse(data) : null;
    });
    return slotlar; 
}

// --- 2. KULLANICI AYARLARI (Oyun sıfırlansa da KALICI kalır) ---
export function ayarlariKaydet(ayarlar) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(ayarlar));
}

export function ayarlariYukle() {
    const ayarlar = localStorage.getItem(SETTINGS_KEY);
    return ayarlar ? JSON.parse(ayarlar) : { tema: 'dark', dil: 'tr' };
}

// --- 3. YENİ v4.0: OTURUM YÖNETİMİ (SESSION STORAGE - GO LIVE & F5 ÇÖZÜMÜ) ---

// Hangi slota girildiğini hatırla (Artık SessionStorage kullanıyor)
export function aktifOturumuKaydet(slotId) {
    if (slotId) {
        sessionStorage.setItem(SESSION_KEY, slotId);
    }
}

// Sayfa yenilenirse en son hangi slottaydık bul
export function aktifOturumuYukle() {
    return sessionStorage.getItem(SESSION_KEY);
}

// Ana menüye dönünce oturumu kapat (Böylece sekme kapanınca veya Go Live denince temiz başlar)
export function aktifOturumuKapat() {
    sessionStorage.removeItem(SESSION_KEY);
}