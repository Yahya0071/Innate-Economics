import type { Persona, PersonaId } from './types';

export const PERSONAS: Record<PersonaId, Persona> = {
  ibn_khaldun: {
    id: 'ibn_khaldun',
    name: 'ابن خلدون',
    title: 'فيلسوف العمران البشري والعدالة الاقتصادية',
    avatar: '📜',
    accentColor: 'text-amber-400',
    borderColor: 'border-amber-500/40',
    bgGradient: 'from-amber-500/15 via-amber-950/30 to-slate-900/80',
    perspectiveSummary:
      'يرى الاقتصاد كعمران بشري حي. العمل هو أصل كل قيمة، والعدل أساس الملك، والظلم والربا والإفراط في الضرائب مؤذن بخراب العمران.',
    greeting:
      'أهلاً بك يا طالب الحكمة. تذكّر: ما من ثروة في الأرض إلا وهي ثمرة عمل وصنعة وعمران متكافل، فكيف تصرف طاقتك اليوم؟',
  },
  adam_smith: {
    id: 'adam_smith',
    name: 'آدم سميث',
    title: 'رائد حرية الأسواق واليد الخفية',
    avatar: '⚖️',
    accentColor: 'text-cyan-400',
    borderColor: 'border-cyan-500/40',
    bgGradient: 'from-cyan-500/15 via-cyan-950/30 to-slate-900/80',
    perspectiveSummary:
      'يؤمن بأن السعي الحر للناس وراء مصالحهم يقود بنظام عفوي خفي إلى مصلحة المجتمع ككل، شريطة وجود منافسة شريفة تمنع الاحتكار.',
    greeting:
      'تحياتي! ليس من كرم الخباز أو الجزار ننتظر عشاءنا، بل من اهتمامهم بمصلحتهم الخاصة. راقب كيف تنسق الأسواق الرغبات دون حاجة لأمرٍ مركزي!',
  },
  keynes: {
    id: 'keynes',
    name: 'جون م. كينز',
    title: 'منظّر السيولة والإنقاذ والطلب الكلي',
    avatar: '🎩',
    accentColor: 'text-indigo-400',
    borderColor: 'border-indigo-500/40',
    bgGradient: 'from-indigo-500/15 via-indigo-950/30 to-slate-900/80',
    perspectiveSummary:
      'يحذر من مفارقة الادخار وجفاف السيولة. في الأزمات، ادخار الجميع يشل التداول ويجلب الركود، ولا بد من ضخ الدماء وتدوير النقد.',
    greeting:
      'مرحباً! في المدى البعيد، كلنا سنموت إن تجمدت الأسواق اليوم! انظر كيف يؤدي خوف الناس إلى تكديس النقد فتتوقف كل العجلات. السيولة هي الأكسجين!',
  },
  abu_fitra: {
    id: 'abu_fitra',
    name: 'أبو الفطرة',
    title: 'حكيم القرية (تبسيط بالفطرة والبداهة)',
    avatar: '🌾',
    accentColor: 'text-emerald-400',
    borderColor: 'border-emerald-500/40',
    bgGradient: 'from-emerald-500/15 via-emerald-950/30 to-slate-900/80',
    perspectiveSummary:
      'يشرح كل شيء بأمثلة الدكان، وسوق السمك، ورغيف الخبز دون أي مصطلح أكاديمي معقد. هدفه أن يفهم الصغير والكبير جوهر التجربة.',
    greeting:
      'يا هلا بك يا ولدي! دعك من التعقيدات والكتب الضخمة. الاقتصاد كله يشبه ما يحدث بينك وبين البقال كل صباح. اسألني وسأبسطها لك على بلاطة!',
  },
};

export const PERSONA_LIST: Persona[] = Object.values(PERSONAS);
