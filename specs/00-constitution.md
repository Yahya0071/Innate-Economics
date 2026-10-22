# Project Constitution: Innate Economics Platform (منصة الاقتصاد الفطري)

## 1. Pedagogical & Narrative Rules (STRICT)
- **Zero Academic Jargon First:** Never introduce economic terms (e.g., "Marginal Utility", "Inflation", "Opportunity Cost") in headings, intros, or UI labels before the user experiences the mechanic.
- **Dilemma-Driven UI:** Every interactive module MUST begin with an actionable human choice under resource constraints, followed by an immediate visual consequence.
- **The Four-Loop Rule (قاعدة الحلقات الأربع):**
  1. **الاصطدام بالمأزق (The Micro-Dilemma):** قرار فوري بموارد محدودة وبدون تنظير مسبق.
  2. **الارتداد النظامي (Systemic Consequence):** إدراك العواقب الفورية وغير المتوقعة للسلوك الفردي.
  3. **العبث الحر (Sandbox Manipulation):** حرية التجريب وتغيير المعطيات لاكتشاف توازنات النظام وحدوده الطبيعية.
  4. **البصيرة الصامتة (The Crystallization):** بلورة الحكمة بلغة الحياة اليومية، مع إمكانية إضافة إشارة هامشية للمصطلح الأكاديمي المقابل.
- **Arabic-First & Tactile:** All user-facing copy must be in natural, lucid, non-academic Arabic. Use concrete metaphors (bread, hours, fatigue, trust, wells).

## 2. Architectural Invariants
- **Pure Simulation Core (`src/engine/`):**
  - Must be written in strict, pure TypeScript with ZERO DOM/React imports.
  - All simulations must be deterministic given a state and user input parameters.
  - Every engine module must have a corresponding Vitest suite in `tests/engine/` verifying boundary conditions and mathematical invariants (e.g., conservation of resources, concavity of utility, price non-negativity).
- **Reactive Story Components (`src/components/`):**
  - Text blocks in MDX should react dynamically to the current state of the simulation store (e.g., showing different narrative feedback depending on whether the user bankrupted the village or achieved equilibrium).
  - Tactile, rich visual feedback using Canvas 2D/SVG and smooth spring physics / micro-animations.
