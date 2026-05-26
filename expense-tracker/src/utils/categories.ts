import type { TransactionCategory } from '../types';

const CATEGORY_RULES: Array<{ keywords: string[]; category: TransactionCategory }> = [
  {
    keywords: ['שופרסל', 'רמי לוי', 'מגה', 'יינות ביתן', 'ויקטורי', 'אושר עד', 'חצי חינם', 'מחסני השוק', 'קרפור', 'סופרמרקט', 'מינימרקט', 'grocery'],
    category: 'מזון_מכולת',
  },
  {
    keywords: ['מסעדה', 'פיצה', 'מקדונלד', 'בורגר', 'קפה', 'coffee', 'cafe', 'שווארמה', 'פלאפל', 'סושי', 'restaurant', 'אוכל', 'בית קפה', 'גוצ\'י', 'כוסברה', 'אנדרומדה', 'גוטה'],
    category: 'מסעדות_קפה',
  },
  {
    keywords: ['דלק', 'סונול', 'פז', 'אל', 'gil', 'fuel', 'petrol', 'garage', 'מוסך', 'ten', 'מנפה', 'delek'],
    category: 'דלק_רכב',
  },
  {
    keywords: ['זארה', 'h&m', 'Castro', 'קסטרו', 'FOX', 'פוקס', 'מנגו', 'mango', 'nike', 'adidas', 'בגד', 'נעל', 'טרמינל x', 'factory 54', 'פרוגרס'],
    category: 'קניות_בגדים',
  },
  {
    keywords: ['בית חולים', 'קופת חולים', 'מאוחדת', 'כללית', 'לאומית', 'מכבי', 'תרופה', 'בית מרקחת', 'pharmacy', 'doctor', 'clinic', 'רופא', 'שן', 'אופטיקה', 'משקפיים'],
    category: 'בריאות_רפואה',
  },
  {
    keywords: ['קאנל', 'khan academy', 'coursera', 'udemy', 'ספר', 'book', 'גן', 'בית ספר', 'שיעור', 'חוג', 'מכללה', 'אוניברסיטה', 'seminar', 'workshop'],
    category: 'חינוך',
  },
  {
    keywords: ['סינמה', 'yes', 'hot', 'netflix', 'spotify', 'apple music', 'hbo', 'disney', 'אמזון', 'amazon', 'gaming', 'steam', 'playstation', 'xbox', 'בילוי', 'תיאטרון', 'קונצרט'],
    category: 'בידור',
  },
  {
    keywords: ['אגד', 'דן', 'רכבת', 'מטרו', 'taxi', 'גט', 'get', 'bolt', 'uber', 'waze', 'parking', 'חניה', 'אוטובוס'],
    category: 'תחבורה',
  },
  {
    keywords: ['חשמל', 'מים', 'גז', 'ארנונה', 'וועד בית', 'ביוב', 'עיריה', 'עירייה', 'electricity', 'water', 'internet', 'סלקום', 'פרטנר', 'הוט מובייל', 'בזק'],
    category: 'תשלומים_קבועים',
  },
  {
    keywords: ['ביטוח', 'insurance', 'מגדל', 'הפניקס', 'הראל', 'כלל', 'מנורה', 'הכשרה'],
    category: 'ביטוח',
  },
  {
    keywords: ['איקאה', 'ikea', 'אייס', 'ace', 'home center', 'הום סנטר', 'כלי עבודה', 'צבע', 'שיפוץ', 'אינסטלטור', 'חשמלאי', 'נגר'],
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
