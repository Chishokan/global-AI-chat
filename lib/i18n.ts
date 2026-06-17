/**
 * i18n.ts — UIラベル・言語定義（クライアント/サーバー共用の純データ）。
 *
 * UIラベルの多言語は ja/en/vi/id を用意。ne/my は en にフォールバック（要・母語話者確認）。
 * チャット応答は7言語すべて対応（返答言語の指示は lib/prompts.ts の LANG_REPLY）。
 */
import { getFaqs, type FaqCategory, type Faq } from '@/lib/kb';

export type Lang = 'ja' | 'ja-easy' | 'en' | 'vi' | 'ne' | 'my' | 'id';
export type Region = 'sasebo' | 'saikai';

export const LANGS: { code: Lang; label: string }[] = [
  { code: 'ja', label: '日本語' },
  { code: 'ja-easy', label: 'やさしい日本語' },
  { code: 'en', label: 'English' },
  { code: 'vi', label: 'Tiếng Việt' },
  { code: 'ne', label: 'नेपाली' },
  { code: 'my', label: 'မြန်မာ' },
  { code: 'id', label: 'Bahasa Indonesia' },
];

export const REGIONS: { code: Region; label: string; short: string }[] = [
  { code: 'sasebo', label: '佐世保市', short: '佐世保' },
  { code: 'saikai', label: '西海市', short: '西海' },
];

export const regionName = (r: Region): string =>
  r === 'saikai' ? '西海市' : '佐世保市';

/** JPカテゴリ → UIラベルキー。 */
const CAT_LABEL_KEY: Record<FaqCategory, string> = {
  生活: 'life',
  手続き: 'proce',
  学習: 'study',
  その他: 'other',
};
export const categoryLabelKey = (c: FaqCategory): string => CAT_LABEL_KEY[c];

/** FAQ の質問を、指定言語のラベルで返す。 */
export function qLabel(faq: Faq, lang: Lang): string {
  if (lang === 'ja' || lang === 'ja-easy') return faq.question;
  const loc = faq.questionLoc || {};
  return loc[lang] || loc.en || faq.question;
}

/** FAQ をカテゴリ順にグルーピングして返す。 */
export function faqsByCategory(): { category: FaqCategory; items: Faq[] }[] {
  const cats: FaqCategory[] = ['生活', '手続き', '学習', 'その他'];
  return cats.map((category) => ({
    category,
    items: getFaqs().filter((f) => f.category === category),
  }));
}

type Dict = Record<string, string>;

export const T: Record<'ja' | 'en' | 'vi' | 'id' | 'ne' | 'my', Dict> = {
  ja: {
    chat: 'チャット', faq: 'しつもん', help: 'こまったとき', proc: 'てつづき', set: 'せってい',
    intro: '生活・仕事・手続きのことを、あなたの言葉で聞いてください。', ph: 'メッセージを入力…', staff: 'スタッフに相談する',
    faqTitle: 'よくあるしつもん', faqHint: '質問をタップすると、選んだ言語で答えます', helpTitle: 'こまったとき・緊急', emerg: '緊急の電話番号', med: '夜間・休日の医療', consult: '相談する',
    procTitle: 'てつづき・よてい', procSoon: '準備中：在留更新などの時期をお知らせする機能を予定しています。', setLang: '言語', setRegion: '地域', setAbout: 'このアプリは、会話の内容をよりよい支援のために記録することがあります。',
    life: '生活', proce: '手続き', study: '学習', other: 'その他', switched: '地域を切り替えました', staffMsg: 'スタッフにおつなぎします。確認して、できるだけ早くお返事します。（プロトタイプ）', errNet: '接続に失敗しました。',
    lblAmb: '救急・消防', lblPol: '警察', lblSea: '海の事故',
    medSasebo: '佐世保市立急病診療所（高砂町5-1／0956-25-3352）。月〜土 20:00〜23:00、日祝 10:00〜18:00。保険証を持参、支払いは現金のみ。',
    medSaikai: '西海市は休日に「在宅当番医」（日替わり）。受診の前に当番医へ電話で確認してください。当番医は西海市のHPで確認できます。',
    consultBody: 'FRESC（外国人在留支援センター）：0120-76-2029 / 外国人在留総合インフォメーション：0570-013904 / 長崎県外国人相談窓口（多言語）',
  },
  en: {
    chat: 'Chat', faq: 'FAQ', help: 'Help', proc: 'To-Do', set: 'Settings',
    intro: 'Ask about daily life, work, or procedures — in your language.', ph: 'Type a message…', staff: 'Talk to staff',
    faqTitle: 'Frequently asked', faqHint: 'Tap a question to get the answer in your language', helpTitle: 'Help & Emergency', emerg: 'Emergency numbers', med: 'Night / holiday medical care', consult: 'Get help',
    procTitle: 'Procedures & reminders', procSoon: 'Coming soon: reminders for residence renewal and other deadlines.', setLang: 'Language', setRegion: 'Area', setAbout: 'This app may record conversations to provide better support.',
    life: 'Daily life', proce: 'Procedures', study: 'Study', other: 'Other', switched: 'Area switched', staffMsg: 'Connecting you to staff. We will check and reply as soon as possible. (Prototype)', errNet: 'Connection failed.',
    lblAmb: 'Ambulance & Fire', lblPol: 'Police', lblSea: 'Sea accidents',
    medSasebo: 'Sasebo City Emergency Clinic (Takasago-cho 5-1 / 0956-25-3352). Mon–Sat 20:00–23:00; Sun & holidays 10:00–18:00. Bring your insurance card; cash only.',
    medSaikai: "In Saikai City, on-call doctors (different each day) handle holiday emergencies. Call the on-call clinic before visiting. Check today's on-call doctor on the Saikai City website.",
    consultBody: 'FRESC (Foreign Residents Support Center): 0120-76-2029 / Immigration Information Center: 0570-013904 / Nagasaki Pref. multilingual consultation desk',
  },
  vi: {
    chat: 'Trò chuyện', faq: 'Câu hỏi', help: 'Trợ giúp', proc: 'Thủ tục', set: 'Cài đặt',
    intro: 'Hãy hỏi về cuộc sống, công việc hoặc thủ tục bằng ngôn ngữ của bạn.', ph: 'Nhập tin nhắn…', staff: 'Nói chuyện với nhân viên',
    faqTitle: 'Câu hỏi thường gặp', faqHint: 'Chạm vào câu hỏi để nhận câu trả lời bằng ngôn ngữ của bạn', helpTitle: 'Trợ giúp & Khẩn cấp', emerg: 'Số điện thoại khẩn cấp', med: 'Y tế ban đêm / ngày lễ', consult: 'Nhận trợ giúp',
    procTitle: 'Thủ tục & nhắc nhở', procSoon: 'Sắp ra mắt: nhắc nhở gia hạn tư cách lưu trú và các thời hạn khác.', setLang: 'Ngôn ngữ', setRegion: 'Khu vực', setAbout: 'Ứng dụng có thể ghi lại cuộc trò chuyện để hỗ trợ tốt hơn.',
    life: 'Đời sống', proce: 'Thủ tục', study: 'Học tập', other: 'Khác', switched: 'Đã chuyển khu vực', staffMsg: 'Đang kết nối với nhân viên. Chúng tôi sẽ kiểm tra và trả lời sớm nhất có thể. (Bản thử nghiệm)', errNet: 'Kết nối thất bại.',
    lblAmb: 'Cấp cứu & Cứu hỏa', lblPol: 'Cảnh sát', lblSea: 'Tai nạn trên biển',
    medSasebo: 'Phòng khám cấp cứu TP Sasebo (Takasago-cho 5-1 / 0956-25-3352). T2–T7 20:00–23:00; CN & ngày lễ 10:00–18:00. Mang thẻ bảo hiểm; chỉ tiền mặt.',
    medSaikai: 'Tại TP Saikai, bác sĩ trực luân phiên (thay đổi mỗi ngày) khám vào ngày lễ. Hãy gọi điện trước khi đến. Xem bác sĩ trực hôm nay trên trang web TP Saikai.',
    consultBody: 'FRESC (Trung tâm hỗ trợ người nước ngoài): 0120-76-2029 / Trung tâm thông tin lưu trú: 0570-013904 / Quầy tư vấn đa ngôn ngữ tỉnh Nagasaki',
  },
  id: {
    chat: 'Obrolan', faq: 'Tanya Jawab', help: 'Bantuan', proc: 'Prosedur', set: 'Pengaturan',
    intro: 'Tanyakan tentang kehidupan, pekerjaan, atau prosedur dalam bahasa Anda.', ph: 'Ketik pesan…', staff: 'Hubungi staf',
    faqTitle: 'Pertanyaan umum', faqHint: 'Ketuk pertanyaan untuk mendapat jawaban dalam bahasa Anda', helpTitle: 'Bantuan & Darurat', emerg: 'Nomor darurat', med: 'Layanan medis malam / hari libur', consult: 'Minta bantuan',
    procTitle: 'Prosedur & pengingat', procSoon: 'Segera hadir: pengingat perpanjangan izin tinggal dan tenggat lainnya.', setLang: 'Bahasa', setRegion: 'Wilayah', setAbout: 'Aplikasi ini dapat merekam percakapan untuk dukungan yang lebih baik.',
    life: 'Kehidupan', proce: 'Prosedur', study: 'Belajar', other: 'Lainnya', switched: 'Wilayah diganti', staffMsg: 'Menghubungkan Anda ke staf. Kami akan memeriksa dan membalas secepatnya. (Prototipe)', errNet: 'Koneksi gagal.',
    lblAmb: 'Ambulans & Pemadam', lblPol: 'Polisi', lblSea: 'Kecelakaan laut',
    medSasebo: 'Klinik Darurat Kota Sasebo (Takasago-cho 5-1 / 0956-25-3352). Sen–Sab 20:00–23:00; Min & hari libur 10:00–18:00. Bawa kartu asuransi; hanya tunai.',
    medSaikai: 'Di Kota Saikai, dokter jaga (berbeda tiap hari) menangani keadaan darurat saat libur. Telepon klinik jaga sebelum datang. Cek dokter jaga hari ini di situs web Kota Saikai.',
    consultBody: 'FRESC (Pusat Dukungan Penduduk Asing): 0120-76-2029 / Pusat Informasi Imigrasi: 0570-013904 / Loket konsultasi multibahasa Prefektur Nagasaki',
  },
  ne: {
    chat: 'कुराकानी', faq: 'प्रश्नहरू', help: 'सहायता', proc: 'प्रक्रिया', set: 'सेटिङ',
    intro: 'जीवन, काम वा प्रक्रियाबारे आफ्नो भाषामा सोध्नुहोस्।', ph: 'सन्देश लेख्नुहोस्…', staff: 'कर्मचारीसँग कुरा गर्नुहोस्',
    faqTitle: 'प्रायः सोधिने प्रश्नहरू', faqHint: 'प्रश्नमा ट्याप गर्नुहोस्, तपाईंको भाषामा जवाफ आउँछ', helpTitle: 'सहायता र आपतकाल', emerg: 'आपतकालीन फोन नम्बर', med: 'राति/बिदाको चिकित्सा', consult: 'सहयोग लिनुहोस्',
    procTitle: 'प्रक्रिया र रिमाइन्डर', procSoon: 'चाँडै आउँदै: बसाइँ अनुमति नवीकरण लगायत म्याद सम्झाउने सुविधा।', setLang: 'भाषा', setRegion: 'क्षेत्र', setAbout: 'राम्रो सहयोगका लागि यो एपले कुराकानी रेकर्ड गर्न सक्छ।',
    life: 'जीवन', proce: 'प्रक्रिया', study: 'अध्ययन', other: 'अन्य', switched: 'क्षेत्र परिवर्तन भयो', staffMsg: 'कर्मचारीसँग जोड्दैछौं। जाँचेर सकेसम्म चाँडो जवाफ दिनेछौं। (प्रोटोटाइप)', errNet: 'जडान असफल भयो।',
    lblAmb: 'एम्बुलेन्स/अग्निशमन', lblPol: 'प्रहरी', lblSea: 'समुद्री दुर्घटना',
    medSasebo: 'सासेबो सिटी आकस्मिक क्लिनिक (Takasago-cho 5-1 / 0956-25-3352)। सोम–शनि 20:00–23:00; आइत/बिदा 10:00–18:00। बीमा कार्ड ल्याउनुहोस्; नगद मात्र।',
    medSaikai: 'साइकाई सिटीमा बिदाको दिन आकस्मिकका लागि पालैपालो डाक्टर (हरेक दिन फरक) हुन्छन्। जानुअघि फोन गर्नुहोस्। आजको डाक्टर साइकाई सिटीको वेबसाइटमा हेर्नुहोस्।',
    consultBody: 'FRESC (विदेशी निवासी सहायता केन्द्र): 0120-76-2029 / अध्यागमन सूचना केन्द्र: 0570-013904 / नागासाकी प्रिफेक्चर बहुभाषिक परामर्श डेस्क',
  },
  my: {
    chat: 'စကားပြော', faq: 'မေးခွန်းများ', help: 'အကူအညီ', proc: 'လုပ်ငန်းစဉ်', set: 'ဆက်တင်',
    intro: 'နေထိုင်မှု၊ အလုပ်၊ လုပ်ထုံးလုပ်နည်းများကို သင့်ဘာသာစကားဖြင့် မေးပါ။', ph: 'စာရိုက်ပါ…', staff: 'ဝန်ထမ်းနှင့် ဆက်သွယ်ပါ',
    faqTitle: 'မကြာခဏ မေးသော မေးခွန်းများ', faqHint: 'မေးခွန်းကို နှိပ်ပါ၊ သင့်ဘာသာဖြင့် ဖြေပါမည်', helpTitle: 'အကူအညီနှင့် အရေးပေါ်', emerg: 'အရေးပေါ် ဖုန်းနံပါတ်များ', med: 'ညဘက်/ရုံးပိတ်ရက် ဆေးကုသမှု', consult: 'အကူအညီ ရယူပါ',
    procTitle: 'လုပ်ငန်းစဉ်နှင့် သတိပေးချက်', procSoon: 'မကြာမီ: နေထိုင်ခွင့် သက်တမ်းတိုးခြင်းစသည့် သတိပေးချက်များ။', setLang: 'ဘာသာစကား', setRegion: 'ဒေသ', setAbout: 'ပိုမိုကောင်းမွန်သော ပံ့ပိုးမှုအတွက် ဤအက်ပ်သည် စကားဝိုင်းကို မှတ်တမ်းတင်နိုင်သည်။',
    life: 'နေ့စဉ်ဘဝ', proce: 'လုပ်ထုံးလုပ်နည်း', study: 'လေ့လာရေး', other: 'အခြား', switched: 'ဒေသ ပြောင်းပြီး', staffMsg: 'ဝန်ထမ်းနှင့် ချိတ်ဆက်ပေးနေပါသည်။ စစ်ဆေးပြီး အမြန်ဆုံး ပြန်ဖြေပါမည်။ (ပုံစံငယ်)', errNet: 'ချိတ်ဆက်မှု မအောင်မြင်ပါ။',
    lblAmb: 'အရေးပေါ်/မီးသတ်', lblPol: 'ရဲ', lblSea: 'ပင်လယ်ပြင် မတော်တဆမှု',
    medSasebo: 'Sasebo မြို့ အရေးပေါ်ဆေးခန်း (Takasago-cho 5-1 / 0956-25-3352)။ တနင်္လာ–စနေ 20:00–23:00; တနင်္ဂနွေ/ရုံးပိတ် 10:00–18:00။ အာမခံကတ် ယူဆောင်ပါ; ငွေသားသာ။',
    medSaikai: 'Saikai မြို့တွင် ရုံးပိတ်ရက် အရေးပေါ်အတွက် တာဝန်ကျဆရာဝန် (နေ့စဉ်ပြောင်း) ရှိသည်။ မလာမီ ဖုန်းခေါ်ပါ။ ယနေ့ ဆရာဝန်ကို Saikai မြို့ ဝက်ဘ်ဆိုက်တွင် ကြည့်ပါ။',
    consultBody: 'FRESC (နိုင်ငံခြားသား နေထိုင်မှု ပံ့ပိုးရေးစင်တာ): 0120-76-2029 / လူဝင်မှုကြီးကြပ်ရေး သတင်းစင်တာ: 0570-013904 / Nagasaki ခရိုင် ဘာသာစုံ တိုင်ပင်ရေးကောင်တာ',
  },
};

/** UIラベル取得。ja-easy は ja を使用。未定義キーは en→ja でフォールバック。 */
export function tr(lang: Lang, key: string): string {
  const base = lang === 'ja-easy' ? 'ja' : lang;
  const dict = T[base as keyof typeof T];
  return (dict && dict[key]) || T.en[key] || T.ja[key];
}
