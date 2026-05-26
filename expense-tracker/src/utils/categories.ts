import type { TransactionCategory } from '../types';

const CATEGORY_RULES: Array<{ keywords: string[]; category: TransactionCategory }> = [
  // ─── תשלומי כרטיס אשראי בבנק (חיוב ישיר / דיירקט) ───
  {
    keywords: ['חיוב לכרטיס', 'חיוב כרטיס', 'כרטיס ויזה', 'כרטיס אשראי', 'visa', 'mastercard'],
    category: 'תשלומים_קבועים',
  },
  // ─── משכנתא והלוואות ───
  {
    keywords: ['משכנתא', 'משכ ', 'למשכ', 'הלוואה', 'החזר הלוואה', 'קרן', 'ריבית'],
    category: 'תשלומים_קבועים',
  },
  // ─── מזון ומכולת ───
  {
    keywords: ['שופרסל', 'רמי לוי', 'מגה', 'יינות ביתן', 'ויקטורי', 'אושר עד', 'חצי חינם',
      'מחסני השוק', 'קרפור', 'סופרמרקט', 'מינימרקט', 'grocery', 'סיטי מרקט', 'AM:PM',
      'מינישוק', 'קינג סטור'],
    category: 'מזון_מכולת',
  },
  // ─── מסעדות וקפה ───
  {
    keywords: ['מסעדה', 'פיצה', 'מקדונלד', 'בורגר', 'קפה', 'coffee', 'cafe', 'שווארמה',
      'פלאפל', 'סושי', 'restaurant', 'בית קפה', 'גוטה', 'ארומה', 'קפה קפה',
      'ביס', 'מאפה', 'hummus'],
    category: 'מסעדות_קפה',
  },
  // ─── דלק ורכב ───
  {
    keywords: ['דלק דרך', 'תחנת דלק', 'סונול', 'פז גז', 'פז דלק', 'delek', 'fuel',
      'petrol', 'מוסך', 'טסט', 'גרג\'', 'טנק', 'ten fuel', 'מנפה', 'oil'],
    category: 'דלק_רכב',
  },
  // ─── קניות ובגדים ───
  {
    keywords: ['זארה', 'h&m', 'castro', 'קסטרו', 'fox ', 'פוקס', 'מנגו', 'nike', 'adidas',
      'טרמינל x', 'factory 54', 'פרוגרס', 'renuar', 'hoodies', 'golf'],
    category: 'קניות_בגדים',
  },
  // ─── בריאות ורפואה ───
  {
    keywords: ['בית חולים', 'קופת חולים', 'מאוחדת', 'מכבי', 'לאומית בריאות',
      'תרופה', 'בית מרקחת', 'pharmacy', 'רופא', 'שיניים', 'אופטיקה', 'משקפיים',
      'super pharm', 'super-pharm'],
    category: 'בריאות_רפואה',
  },
  // ─── חינוך ───
  {
    keywords: ['בית ספר', 'שיעור', 'חוג', 'מכללה', 'אוניברסיטה', 'seminar', 'coursera',
      'udemy', 'גן ילדים', 'צהרון', 'כיתה'],
    category: 'חינוך',
  },
  // ─── בידור ───
  {
    keywords: ['yes ', 'hot ', 'netflix', 'spotify', 'apple music', 'hbo', 'disney',
      'amazon', 'gaming', 'steam', 'playstation', 'xbox', 'תיאטרון', 'קונצרט',
      'סינמה', 'סרט', 'בילוי', 'חופשה', 'מלון'],
    category: 'בידור',
  },
  // ─── תחבורה ───
  {
    keywords: ['אגד', 'דן ', 'רכבת', 'מטרו', 'גט טקסי', 'bolt', 'uber', 'waze',
      'חניה', 'אוטובוס', 'רב קו', 'gett'],
    category: 'תחבורה',
  },
  // ─── תשלומים קבועים (חשמל, מים, טלפון) ───
  {
    keywords: ['חברת חשמל', 'מים וביוב', 'גז', 'ארנונה', 'ועד בית', 'וועד בית', 'עיריה',
      'עירייה', 'חשמל', 'מים ', 'בזק', 'סלקום', 'פרטנר', 'הוט מובייל', 'hot mobile',
      'גלובוס', 'מע"מ', "מע''מ", 'מיסים', 'רשות המסים'],
    category: 'תשלומים_קבועים',
  },
  // ─── ביטוח ───
  {
    keywords: ['ביטוח', 'insurance', 'מגדל', 'הפניקס', 'הראל', 'מנורה', 'הכשרה', 'כלל ביטוח'],
    category: 'ביטוח',
  },
  // ─── שיפוצים ובית ───
  {
    keywords: ['איקאה', 'ikea', 'ace ', 'home center', 'הום סנטר', 'שיפוץ', 'נגר', 'אינסטלטור'],
    category: 'שיפוצים_בית',
  },
];

export const CATEGORY_LABELS: Record<TransactionCategory, string> = {
  מזון_מכולת: 'מזון ומכולת',
  מסעדות_קפה: 'מסעדות וקפה',
  דלק_רכב: 'דלק ורכב',
  קניות_בגדים: 'קניות ובגדים',
  בריאות_רפואה: 'בריאות ורפואה',
  חינוך: 'חינוך',
  בידור: 'בידור',
  תחבורה: 'תחבורה',
  תשלומים_קבועים: 'תשלומים קבועים',
  ביטוח: 'ביטוח',
  שיפוצים_בית: 'שיפוצים ובית',
  אחר: 'אחר',
};

export const CATEGORY_COLORS: Record<TransactionCategory, string> = {
  מזון_מכולת: '#4ade80',
  מסעדות_קפה: '#f97316',
  דלק_רכב: '#6366f1',
  קניות_בגדים: '#ec4899',
  בריאות_רפואה: '#ef4444',
  חינוך: '#8b5cf6',
  בידור: '#14b8a6',
  תחבורה: '#f59e0b',
  תשלומים_קבועים: '#64748b',
  ביטוח: '#0ea5e9',
  שיפוצים_בית: '#a78bfa',
  אחר: '#94a3b8',
};

export function detectCategory(description: string): TransactionCategory {
  const lower = description.toLowerCase();
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some(k => lower.includes(k.toLowerCase()))) {
      return rule.category;
    }
  }
  return 'אחר';
}

// Bank entries that look like credit card monthly payments → mark as direct debit
export function isLikelyCalPayment(description: string): boolean {
  const lower = description.toLowerCase();
  return ['חיוב לכרטיס', 'חיוב כרטיס', 'כרטיס ויזה', 'כרטיס אשראי'].some(k => lower.includes(k));
}
