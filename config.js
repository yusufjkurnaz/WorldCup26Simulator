// OYUN MOTORU VE ARAYÜZ AYARLARI (MAGIC NUMBERS)
export const AYARLAR = {
    TEMEL_GOL_SANSI: 0.20,
    GUC_FARKI_CARPANI: 0.015,
    MAX_GOL_SANSI: 0.60,
    MIN_GOL_SANSI: 0.05,
    YILDIZ_BONUSU: 0.05,
    MIN_POZISYON: 6,         
    RND_POZISYON_EK: 4,      
    
    // Animasyon Süreleri
    ANIMASYON_TEK_MAC: 500,  // Tek bir maç için hızlı bekleme süresi (ms)
    ANIMASYON_COKLU: 1500,   // Tüm maç gününü simüle ederken bekleme süresi (ms)

    // FORM VE MORAL SİSTEMİ AYARLARI
    MORAL_GALIBIYET: 0.05,
    MORAL_MAGLUBIYET: -0.05,
    MORAL_SURPRIZ_EK: 0.04,        
    MORAL_BERABERLIK_ZAYIF: 0.02,  
    MORAL_BERABERLIK_GUCLU: -0.02, 
    MORAL_MAX: 1.20,               
    MORAL_MIN: 0.80                
};