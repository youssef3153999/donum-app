import React from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
} from 'react-native';
import { colors, radii, spacing } from '@/lib/theme';
import { t, type Lang } from '@/lib/i18n';

export type LegalKind = 'privacy' | 'terms';

type Props = {
  visible: boolean;
  kind: LegalKind;
  lang: Lang;
  onClose: () => void;
};

/**
 * Read-only screen showing Privacy Policy or Terms of Service in the user's
 * language. Required by Google Play and most app-store policies.
 *
 * Content is embedded so the user can read offline. Update PRIVACY_TEXT and
 * TERMS_TEXT below to change the wording; this is also the master copy that
 * should be mirrored on the public website.
 */
export default function LegalScreen({ visible, kind, lang, onClose }: Props) {
  const isAr = lang === 'ar';
  const title = t(lang, kind === 'privacy' ? 'privacy_policy' : 'terms_of_service');
  const body =
    kind === 'privacy' ? PRIVACY_TEXT[lang] : TERMS_TEXT[lang];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={s.root}>
        <View style={s.header}>
          <Pressable onPress={onClose} hitSlop={12}>
            <Text style={s.close}>✕</Text>
          </Pressable>
          <Text style={s.title}>{title}</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text
            style={[s.body, { textAlign: isAr ? 'right' : 'left' }]}
          >
            {body}
          </Text>
          <Text style={s.footer}>
            {t(lang, 'last_updated')}: 2026-05-26
          </Text>
        </ScrollView>
      </View>
    </Modal>
  );
}

// -- CONTENT ----------------------------------------------------------------
// Keep concise and reviewable. Long enough to be compliant, short enough
// that users actually read it. Mirror this on the public website at
// /privacy and /terms.

const PRIVACY_TEXT: Record<Lang, string> = {
  ar: `سياسة الخصوصية - دونم

١. ما البيانات التي نجمعها
- البريد الإلكتروني وكلمة المرور للتسجيل
- رقم الهاتف عند نشر إعلان
- صور الأراضي التي ترفعها
- إحداثيات الأراضي التي ترسمها على الخريطة
- إحصائيات الاستخدام (عدد المشاهدات لإعلاناتك)

٢. لماذا نجمعها
- إنشاء حسابك وتسجيل دخولك
- عرض إعلاناتك للمشترين
- التواصل بينك وبين المهتمّين
- تحسين خدمة التطبيق

٣. مع من نشاركها
- لا نبيع بياناتك لأي طرف ثالث
- نستخدم Supabase لتخزين البيانات (مزوّد قواعد بيانات معتمد)
- نستخدم Google Maps لعرض الخريطة (يخضع لسياسة جوجل)

٤. حقوقك
- يمكنك حذف حسابك في أي وقت من شاشة "حسابي"
- يمكنك تعديل أو حذف أي إعلان لك
- لطلب نسخة من بياناتك، تواصل معنا

٥. الأمان
- كل البيانات مشفّرة أثناء النقل (HTTPS)
- كلمات المرور مُشفّرة في قاعدة البيانات
- نستخدم سياسات صارمة لمنع الوصول غير المصرّح به

٦. التعديل
- قد نحدّث هذه السياسة. التحديثات تُعرض في التطبيق.

للتواصل: عبر صفحة "حسابي" → زر التواصل`,

  en: `Privacy Policy - Donum

1. What we collect
- Email and password for sign-up
- Phone number when you publish a listing
- Photos of plots you upload
- Coordinates of plots you draw on the map
- Usage stats (view counts on your listings)

2. Why we collect it
- Create your account and sign you in
- Display your listings to buyers
- Connect you with interested parties
- Improve the service

3. Who we share with
- We do NOT sell your data to third parties
- We use Supabase to store data (trusted database provider)
- We use Google Maps for the map (subject to Google's policy)

4. Your rights
- Delete your account anytime from the Account screen
- Edit or delete any of your listings
- Contact us for a copy of your data

5. Security
- All data encrypted in transit (HTTPS)
- Passwords hashed in the database
- Strict policies prevent unauthorized access

6. Changes
- We may update this policy. Updates appear in the app.

Contact: via the Account screen → contact button`,

  de: `Datenschutzerklärung - Donum

1. Welche Daten wir sammeln
- E-Mail und Passwort für die Registrierung
- Telefonnummer beim Veröffentlichen eines Inserats
- Hochgeladene Grundstücksfotos
- Auf der Karte gezeichnete Grundstückskoordinaten
- Nutzungsstatistiken (Aufrufzahlen Ihrer Inserate)

2. Warum wir sie sammeln
- Konto erstellen und anmelden
- Ihre Inserate Käufern zeigen
- Sie mit Interessenten verbinden
- Den Dienst verbessern

3. Mit wem wir sie teilen
- Wir verkaufen Ihre Daten NICHT an Dritte
- Wir nutzen Supabase zur Datenspeicherung (vertrauenswürdiger Anbieter)
- Wir nutzen Google Maps (Google-Richtlinie gilt)

4. Ihre Rechte
- Sie können Ihr Konto jederzeit löschen (Konto-Bildschirm)
- Sie können jedes Ihrer Inserate bearbeiten oder löschen
- Für eine Kopie Ihrer Daten kontaktieren Sie uns

5. Sicherheit
- Alle Daten verschlüsselt übertragen (HTTPS)
- Passwörter in der Datenbank gehasht
- Strenge Richtlinien gegen unbefugten Zugriff

6. Änderungen
- Wir können diese Richtlinie aktualisieren. Updates erscheinen in der App.

Kontakt: Konto-Bildschirm → Kontakt-Button`,
};

const TERMS_TEXT: Record<Lang, string> = {
  ar: `شروط الاستخدام - دونم

١. قبول الشروط
باستخدامك التطبيق، أنت توافق على هذه الشروط.

٢. الحساب
- يجب أن تكون فوق ١٨ سنة
- أنت مسؤول عن سرية كلمة المرور
- لا تُنشئ حسابات وهمية أو متعدّدة

٣. الإعلانات
- يجب أن تكون مالكاً للأرض أو وكيلاً قانونياً لها
- المعلومات يجب أن تكون صحيحة (السعر، المساحة، الموقع، الصور)
- يُمنع نشر إعلانات مكرّرة أو احتيالية
- نحتفظ بحقّ رفض أو حذف أي إعلان

٤. الصور
- يجب أن تكون صوراً حقيقية للأرض (لا صور مسروقة)
- يجب أن تملك حقوق الصور التي ترفعها
- يُمنع رفع صور إباحية أو عنيفة أو مُسيئة

٥. التعاملات
- دونم منصّة عرض فقط، ليس وسيطاً
- نحن غير مسؤولين عن نزاعات البيع
- ننصح بإتمام البيع عبر كاتب العدل وبالأوراق الرسمية

٦. شارة "بائع موثّق"
- التوثيق يدوي بناءً على هويتك ورقم هاتفك
- الشارة لا تضمن صدق كل ما يقوله البائع
- المشتري يبقى مسؤولاً عن التحقّق من الأرض

٧. الإنهاء
- يمكنك حذف حسابك في أي وقت
- نستطيع تعليق أو حذف حسابك إذا خرقت الشروط

٨. المسؤولية
- التطبيق "كما هو" - لا ضمانات صريحة
- نحاول الحفاظ على دقّة البيانات لكن لا نضمنها

٩. القانون المُطبَّق
هذه الشروط تخضع للقوانين السورية.`,

  en: `Terms of Service - Donum

1. Acceptance
By using the app you agree to these terms.

2. Account
- You must be 18 or older
- You are responsible for keeping your password safe
- No fake or duplicate accounts

3. Listings
- You must own the land or be a legal agent for it
- All information must be accurate (price, area, location, photos)
- No duplicate or fraudulent listings
- We may reject or remove any listing

4. Photos
- Must be real photos of the land (no stolen images)
- You must own the rights to photos you upload
- No pornographic, violent, or offensive content

5. Transactions
- Donum is a listing platform only, not a broker
- We are not responsible for sale disputes
- We recommend completing sales through a notary with official documents

6. "Verified Seller" badge
- Verification is manual based on ID and phone
- The badge does not guarantee every claim by the seller
- Buyers remain responsible for verifying the land

7. Termination
- You can delete your account anytime
- We can suspend or delete your account if you violate these terms

8. Liability
- The app is "as is" - no express warranties
- We try to keep data accurate but do not guarantee it

9. Governing law
These terms are governed by Syrian law.`,

  de: `Nutzungsbedingungen - Donum

1. Annahme
Mit der Nutzung der App stimmen Sie diesen Bedingungen zu.

2. Konto
- Sie müssen mindestens 18 Jahre alt sein
- Sie sind für die Sicherheit Ihres Passworts verantwortlich
- Keine gefälschten oder doppelten Konten

3. Inserate
- Sie müssen Eigentümer des Grundstücks sein oder ein rechtmäßiger Vertreter
- Alle Angaben müssen korrekt sein (Preis, Fläche, Lage, Fotos)
- Keine doppelten oder betrügerischen Inserate
- Wir können jedes Inserat ablehnen oder entfernen

4. Fotos
- Müssen echte Fotos des Grundstücks sein (keine gestohlenen Bilder)
- Sie müssen die Rechte an hochgeladenen Fotos besitzen
- Keine pornografischen, gewalttätigen oder beleidigenden Inhalte

5. Transaktionen
- Donum ist nur eine Inserate-Plattform, kein Makler
- Wir sind nicht verantwortlich für Verkaufsstreitigkeiten
- Wir empfehlen den Verkaufsabschluss über einen Notar mit offiziellen Dokumenten

6. Abzeichen "Verifizierter Verkäufer"
- Verifizierung erfolgt manuell anhand Ausweis und Telefon
- Das Abzeichen garantiert nicht jede Aussage des Verkäufers
- Käufer bleiben für die Überprüfung des Grundstücks verantwortlich

7. Beendigung
- Sie können Ihr Konto jederzeit löschen
- Wir können Ihr Konto bei Verstoß gegen diese Bedingungen sperren oder löschen

8. Haftung
- Die App wird "wie besehen" bereitgestellt - keine ausdrücklichen Garantien
- Wir bemühen uns um genaue Daten, garantieren sie aber nicht

9. Anwendbares Recht
Diese Bedingungen unterliegen syrischem Recht.`,
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { color: colors.text, fontSize: 17, fontWeight: '700' },
  close: { color: colors.muted, fontSize: 22, padding: 4 },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing.xxl },
  body: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 22,
  },
  footer: {
    color: colors.muted,
    fontSize: 11,
    marginTop: spacing.lg,
    fontStyle: 'italic',
  },
});
