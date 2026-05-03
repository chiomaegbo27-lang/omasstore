// Loyalty points calculation based on Nigerian market tiers
export function calculatePointsEarned(totalSpent: number): number {
  if (totalSpent >= 5000) return Math.floor(totalSpent / 1000) * 200;
  if (totalSpent >= 4000) return Math.floor(totalSpent / 1000) * 125;
  if (totalSpent >= 3000) return Math.floor(totalSpent / 1000) * 83;
  if (totalSpent >= 2000) return Math.floor(totalSpent / 1000) * 75;
  if (totalSpent >= 1000) return Math.floor(totalSpent / 1000) * 100;
  return 0;
}

// Tier breakdown for display
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
