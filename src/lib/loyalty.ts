// Loyalty points: purchases ₦6,000+ only
// Formula: divide total by ₦5,000 → result × 1,000 pts
// Remainder ≥ ₦1,000 gets 100 pts per ₦1,000
// Examples: ₦6,000 = 1,000 + 100 = 1,100 pts
//           ₦10,000 = 2,000 pts
//           ₦15,000 = 3,000 pts
//           ₦11,000 = 2,000 + 100 = 2,100 pts

export function calculatePointsEarned(totalSpent: number): number {
  if (totalSpent < 6000) return 0;
  const fullBlocks = Math.floor(totalSpent / 5000);
  const remainder = totalSpent - fullBlocks * 5000;
  const blockPoints = fullBlocks * 1000;
  const remainderPoints = Math.floor(remainder / 1000) * 100;
  return blockPoints + remainderPoints;
}

export const LOYALTY_TIERS = [
  { min: 6000, points: 1100, label: "₦6,000 = 1,100 pts" },
  { min: 10000, points: 2000, label: "₦10,000 = 2,000 pts" },
  { min: 15000, points: 3000, label: "₦15,000 = 3,000 pts" },
  { min: 20000, points: 4000, label: "₦20,000 = 4,000 pts" },
  { min: 25000, points: 5000, label: "₦25,000 = 5,000 pts" },
];

// 1 point = ₦1
export const POINTS_TO_NAIRA = 1;

export function pointsToNaira(points: number): number {
  return points * POINTS_TO_NAIRA;
}
