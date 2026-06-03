// Tiered loyalty rewards
// ₦1,000 = 100 pts | ₦2,000 = 150 | ₦3,000 = 250 | ₦4,000 = 500
// Every full ₦5,000 = 1,000 pts; remainder applies the tier table above.
// Examples: ₦12,000 → 2×1,000 + ₦2,000 tier (150) = 2,150 pts.
//           ₦7,000  → 1×1,000 + ₦2,000 tier (150) = 1,150 pts.
//           ₦3,000  → 250 pts.

const REMAINDER_TIERS: Record<number, number> = {
  1: 100,
  2: 150,
  3: 250,
  4: 500,
};

export function calculatePointsEarned(totalSpent: number): number {
  if (totalSpent < 1000) return 0;
  const fullBlocks = Math.floor(totalSpent / 5000);
  const remainderNaira = totalSpent - fullBlocks * 5000;
  const remainderBlocks = Math.floor(remainderNaira / 1000); // 0..4
  const remainderPts = REMAINDER_TIERS[remainderBlocks] ?? 0;
  return fullBlocks * 1000 + remainderPts;
}

export const LOYALTY_TIERS = [
  { min: 1000, points: 100, label: "₦1,000 = 100 pts" },
  { min: 2000, points: 150, label: "₦2,000 = 150 pts" },
  { min: 3000, points: 250, label: "₦3,000 = 250 pts" },
  { min: 4000, points: 500, label: "₦4,000 = 500 pts" },
  { min: 5000, points: 1000, label: "₦5,000 = 1,000 pts" },
];

// 1 point = ₦1
export const POINTS_TO_NAIRA = 1;

export function pointsToNaira(points: number): number {
  return points * POINTS_TO_NAIRA;
}
