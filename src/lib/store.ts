export const STORE = {
  name: "Oma's Store",
  tagline: "Fresh groceries & household essentials, delivered to your door in Enugu.",
  whatsapp: "2349065869280",
  phone: "+2349065869280",
  adminEmail: "Chiomaegbo27@gmail.com",
  bank: {
    accountName: "Chioma Egbo",
    accountNumber: "8140933257",
    bankName: "Opay",
  },
  address: "No 3 Ubakulu Street, Ekulu West GRA, Enugu",
};

export type Zone = "A" | "B" | "C";

export const ZONES: Record<Zone, { label: string; fee: number }> = {
  A: { label: "Zone A — within 2 km of GRA Ekulu (e.g. Independence Layout, Ogui)", fee: 500 },
  B: { label: "Zone B — 2 to 5 km (e.g. New Haven, Coal Camp, Asata)", fee: 1000 },
  C: { label: "Zone C — 5 to 10 km (e.g. Achara Layout, Abakpa, Trans-Ekulu)", fee: 1500 },
};

export const formatNGN = (n: number) =>
  "₦" + n.toLocaleString("en-NG", { maximumFractionDigits: 0 });
