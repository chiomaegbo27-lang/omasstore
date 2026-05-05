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


export const formatNGN = (n: number) =>
  "₦" + n.toLocaleString("en-NG", { maximumFractionDigits: 0 });
