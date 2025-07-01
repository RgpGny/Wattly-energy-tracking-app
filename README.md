# ⚡ Wattly - Enerji Takip Uygulaması

<div align="center">

![Wattly Logo](https://img.shields.io/badge/Wattly-Energy%20Tracking-blue?style=for-the-badge&logo=lightning-bolt)
![React Native](https://img.shields.io/badge/React%20Native-0.79.4-blue?style=for-the-badge&logo=react)
![Expo](https://img.shields.io/badge/Expo-53.0.15-black?style=for-the-badge&logo=expo)
![Firebase](https://img.shields.io/badge/Firebase-11.0.2-orange?style=for-the-badge&logo=firebase)

**Modern ve kullanıcı dostu enerji tüketimi takip uygulaması** 🔋

[Özellikler](#-özellikler) • [Teknolojiler](#-teknolojiler) • [Kurulum](#-kurulum) • [Kullanım](#-kullanım) • [Ekran Görüntüleri](#-ekran-görüntüleri) • [Katkıda Bulunma](#-katkıda-bulunma)

</div>

---

## 📱 Uygulama Hakkında

Wattly, kullanıcıların günlük enerji tüketimlerini takip etmelerini, cihazlarını yönetmelerini ve enerji tasarrufu hedefleri belirlemelerini sağlayan kapsamlı bir mobil uygulamadır. Modern UI/UX tasarımı, gerçek zamanlı analitikler ve sosyal özelliklerle donatılmıştır.

### 🎯 Ana Hedefler
- 📊 **Enerji Tüketimi Takibi**: Günlük, haftalık, aylık ve yıllık tüketim analizleri
- 💰 **Maliyet Hesaplama**: Enerji faturalarınızı tahmin edin
- 🌱 **Çevre Dostu**: CO2 emisyonlarınızı takip edin
- 🎯 **Hedef Belirleme**: Enerji tasarrufu hedefleri oluşturun
- 👥 **Sosyal Özellikler**: Arkadaşlarınızla karşılaştırın ve paylaşın

---

## ✨ Özellikler

### 🔐 Kullanıcı Yönetimi
- ✅ **Kayıt ve Giriş**: Güvenli Firebase Authentication
- 👤 **Profil Yönetimi**: Kişisel bilgileri düzenleme
- 🔒 **Şifre Değiştirme**: Güvenli şifre güncelleme
- 🔄 **Otomatik Giriş**: Kalıcı oturum yönetimi

### 📱 Ana Ekranlar
- 🏠 **Ana Sayfa**: Genel istatistikler ve hızlı erişim
- 📊 **Dashboard**: Detaylı analitikler ve grafikler
- 📋 **Cihaz Listesi**: Tüm cihazlarınızı görüntüleyin
- ➕ **Cihaz Ekleme**: Yeni cihaz ekleme ve düzenleme
- 🎯 **Hedefler**: Enerji tasarrufu hedefleri
- 👥 **Topluluk**: Diğer kullanıcılarla etkileşim
- 💬 **Sohbet**: Arkadaşlarınızla mesajlaşın

### 📈 Analitik Özellikler
- 📊 **Gerçek Zamanlı Grafikler**: LineChart ile görsel analizler
- 📅 **Zaman Aralığı Seçimi**: Günlük, haftalık, aylık, yıllık
- 💡 **Cihaz Tipi Analizi**: Isıtma/Soğutma, Elektronik, Aydınlatma, Beyaz Eşya
- 💰 **Maliyet Hesaplama**: Otomatik fatura tahmini
- 🌍 **CO2 Takibi**: Çevresel etki analizi
- 📈 **Trend Analizi**: Tüketim eğilimleri

### 🔔 Bildirimler
- ⏰ **Günlük Hatırlatmalar**: Kullanım takibi
- ⚠️ **Yüksek Tüketim Uyarıları**: Limit aşımı bildirimleri
- 🎯 **Hedef Hatırlatmaları**: Hedef takibi
- 📱 **Push Notifications**: Expo Notifications entegrasyonu

### 🎨 UI/UX Özellikleri
- 🌈 **Modern Tasarım**: Material Design 3
- ✨ **Animasyonlar**: Moti ve Reanimated ile akıcı geçişler
- 🎭 **Gradient Efektler**: LinearGradient ile görsel zenginlik
- 🌟 **Haptic Feedback**: Dokunsal geri bildirim
- 🎨 **Tema Desteği**: Karanlık/Aydınlık tema
- 📱 **Responsive Tasarım**: Tüm ekran boyutlarına uyum

---

## 🛠️ Teknolojiler

### 📱 Frontend
- **React Native** `0.79.4` - Cross-platform mobil geliştirme
- **Expo** `53.0.15` - Geliştirme platformu ve araçları
- **React** `19.0.0` - UI kütüphanesi

### 🎨 UI/UX Kütüphaneleri
- **React Native Paper** `5.12.5` - Material Design bileşenleri
- **Moti** `0.29.0` - Animasyon kütüphanesi
- **React Native Reanimated** `3.17.4` - Performanslı animasyonlar
- **Lottie React Native** `7.2.2` - Vektör animasyonları
- **React Native Shadow 2** `7.1.1` - Gölge efektleri
- **Expo Linear Gradient** `14.0.1` - Gradient efektler

### 📊 Veri Görselleştirme
- **React Native Chart Kit** `6.12.0` - Grafik bileşenleri
- **Victory Native** `36.6.8` - İstatistik grafikleri
- **React Native SVG** `15.11.2` - SVG desteği

### 🔥 Backend & Veritabanı
- **Firebase** `11.0.2` - Backend servisleri
- **Firebase Admin** `13.0.2` - Sunucu tarafı yönetim
- **Firebase Functions** `6.2.0` - Cloud Functions

### 🔐 Kimlik Doğrulama
- **Firebase Authentication** - Kullanıcı yönetimi
- **AsyncStorage** `2.1.2` - Yerel veri saklama

### 🧭 Navigasyon
- **React Navigation** `7.0.6` - Sayfa geçişleri
- **React Navigation Stack** `7.0.0` - Stack navigasyon
- **React Navigation Drawer** `7.0.11` - Drawer navigasyon

### 📅 Yardımcı Kütüphaneler
- **Date-fns** `4.1.0` - Tarih işlemleri
- **Axios** `1.7.7` - HTTP istekleri
- **Expo Haptics** `14.0.0` - Dokunsal geri bildirim
- **Expo Notifications** `0.31.3` - Bildirim yönetimi

---

## 🚀 Kurulum

### Ön Gereksinimler
- Node.js (v16 veya üzeri)
- npm veya yarn
- Expo CLI
- Android Studio (Android geliştirme için)
- Xcode (iOS geliştirme için)

### 1. Projeyi Klonlayın
```bash
git clone https://github.com/RgpGny/Wattly-energy-tracking-app.git
cd Wattly-energy-tracking-app
```

### 2. Bağımlılıkları Yükleyin
```bash
npm install
# veya
yarn install
```

### 3. Firebase Yapılandırması
1. Firebase Console'da yeni bir proje oluşturun
2. `.env` dosyası oluşturun ve Firebase bilgilerinizi ekleyin:
```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
EXPO_PUBLIC_FIREBASE_DATABASE_URL=your_database_url
```

### 4. Uygulamayı Başlatın
```bash
# Expo CLI ile
expo start

# veya npm ile
npm start
```

### 5. Platform Seçimi
- **Android**: `a` tuşuna basın veya `npm run android`
- **iOS**: `i` tuşuna basın veya `npm run ios`
- **Web**: `w` tuşuna basın veya `npm run web`

---

## 📖 Kullanım

### 🏠 Ana Sayfa
- Günlük enerji tüketimi istatistikleri
- Hızlı erişim menüleri
- Bildirim sayıları
- Trend göstergeleri

### 📊 Dashboard
- Zaman aralığı seçimi (Günlük/Haftalık/Aylık/Yıllık)
- Detaylı grafik analizleri
- Cihaz tipi bazında tüketim
- Maliyet ve CO2 hesaplamaları

### 📋 Cihaz Yönetimi
- Cihaz ekleme ve düzenleme
- Güç tüketimi ve kullanım süresi
- Cihaz kategorileri
- Günlük kullanım takibi

### 🎯 Hedef Belirleme
- Enerji tasarrufu hedefleri
- İlerleme takibi
- Hatırlatmalar
- Başarı kutlamaları

### 👥 Sosyal Özellikler
- Arkadaş ekleme
- Mesajlaşma
- Topluluk paylaşımları
- Karşılaştırma tabloları

---

## 📱 Ekran Görüntüleri

<div align="center">

| Ana Sayfa | Dashboard | Cihaz Listesi |
|-----------|-----------|---------------|
| ![Ana Sayfa](assets/screenshots/home.png) | ![Dashboard](assets/screenshots/dashboard.png) | ![Cihaz Listesi](assets/screenshots/devices.png) |

| Giriş | Profil | Hedefler |
|-------|--------|----------|
| ![Giriş](assets/screenshots/login.png) | ![Profil](assets/screenshots/profile.png) | ![Hedefler](assets/screenshots/goals.png) |

</div>

---

## 🏗️ Proje Yapısı

```
Wattly-energy-tracking-app/
├── src/
│   ├── components/          # Yeniden kullanılabilir bileşenler
│   ├── screens/            # Uygulama ekranları
│   ├── services/           # API ve Firebase servisleri
│   ├── context/            # React Context
│   ├── utils/              # Yardımcı fonksiyonlar
│   ├── assets/             # Resimler ve animasyonlar
│   ├── style/              # Stil dosyaları
│   └── firebaseConfig.js   # Firebase yapılandırması
├── assets/                 # Expo assets
├── .env                    # Çevresel değişkenler
├── .gitignore             # Git ignore dosyası
└── README.md              # Bu dosya
```

---

## 🔧 Geliştirme

### Kod Stili
- ESLint ve Prettier kullanılıyor
- Component-based mimari
- Functional components ve hooks
- TypeScript desteği (gelecek sürümlerde)

### Test
```bash
# Testleri çalıştır
npm test

# Coverage raporu
npm run test:coverage
```

### Build
```bash
# Android APK
expo build:android

# iOS IPA
expo build:ios

# Web build
expo build:web
```

---

## 🤝 Katkıda Bulunma

1. Bu repository'yi fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

### Katkı Rehberi
- Kod standartlarına uyun
- Test yazın
- README'yi güncelleyin
- Commit mesajlarını açıklayıcı yazın

---

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına bakın.

---

## 👨‍💻 Geliştirici

**Ragıp Günay**

- GitHub: [@RgpGny](https://github.com/RgpGny)
- LinkedIn: [Ragıp Günay](https://linkedin.com/in/ragipgunay)

---

## 🙏 Teşekkürler

- [Expo](https://expo.dev/) - Harika geliştirme platformu
- [Firebase](https://firebase.google.com/) - Güçlü backend servisleri
- [React Native](https://reactnative.dev/) - Cross-platform geliştirme
- [React Navigation](https://reactnavigation.org/) - Navigasyon çözümü
- [React Native Paper](https://callstack.github.io/react-native-paper/) - UI bileşenleri

---

<div align="center">

⭐ Bu projeyi beğendiyseniz yıldız vermeyi unutmayın!

[GitHub'da Görüntüle](https://github.com/RgpGny/Wattly-energy-tracking-app)

</div> 