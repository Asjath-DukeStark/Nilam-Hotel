export interface MenuBase {
  id: string;
  nameEn: string;
  nameTa: string;
  plainPrice?: number;        // For Meals bases
  sambalPrice?: number;       // For Meals bases
  currySurcharge?: number;    // For Meals bases
  price?: number;             // For Dhosai bases
}

export interface MenuProtein {
  id: string;
  nameEn: string;
  nameTa: string;
  extraPrice?: number;        // For Kottu flow proteins
}

export interface MenuSize {
  id: string;
  nameEn: string;
  nameTa: string;
  price?: number;
}

export interface MenuCurry {
  id: string;
  nameEn: string;
  nameTa: string;
  price: number;
}

export interface MenuPortion {
  id: string;
  nameEn: string;
  nameTa: string;
  price: number;
}

export interface MenuCategory {
  id: string;
  nameEn: string;
  nameTa: string;
  initial: string;
  type: 'kottu-flow' | 'dhosai-flow' | 'meals-flow' | 'gravy-flow' | 'fixed-item-flow';
  bases?: MenuBase[];
  proteins?: MenuProtein[];
  sizes?: MenuSize[];
  curries?: MenuCurry[];
  portions?: MenuPortion[];
}

export const DEFAULT_MENU_CATALOG: MenuCategory[] = [
  {
    id: "kottu",
    nameEn: "Kottu",
    nameTa: "கொத்து",
    initial: "K",
    type: "kottu-flow",
    bases: [
      { id: "idiyappam", nameEn: "Idiyappam", nameTa: "இடியாப்பம்" },
      { id: "rotti", nameEn: "Rotti", nameTa: "ரொட்டி" },
      { id: "mix", nameEn: "Mix", nameTa: "கலவை" }
    ],
    proteins: [
      { id: "chicken", nameEn: "Chicken", nameTa: "கோழி", extraPrice: 100 },
      { id: "beef", nameEn: "Beef", nameTa: "மாடு", extraPrice: 120 },
      { id: "egg", nameEn: "Egg", nameTa: "முட்டை", extraPrice: 50 }
    ],
    sizes: [
      { id: "normal", nameEn: "Normal", nameTa: "சாதாரண", price: 350 },
      { id: "full", nameEn: "Full", nameTa: "முழு", price: 500 }
    ]
  },
  {
    id: "dolphinKottu",
    nameEn: "Dolphin Kottu",
    nameTa: "டால்பின் கொத்து",
    initial: "DK",
    type: "kottu-flow",
    bases: [
      { id: "rotti", nameEn: "Rotti", nameTa: "ரொட்டி" }
    ],
    proteins: [
      { id: "chicken", nameEn: "Chicken", nameTa: "கோழி", extraPrice: 100 },
      { id: "beef", nameEn: "Beef", nameTa: "மாடு", extraPrice: 120 },
      { id: "egg", nameEn: "Egg", nameTa: "முட்டை", extraPrice: 50 }
    ],
    sizes: [
      { id: "normal", nameEn: "Normal", nameTa: "சாதாரண", price: 350 },
      { id: "full", nameEn: "Full", nameTa: "முழு", price: 500 }
    ]
  },
  {
    id: "rice",
    nameEn: "Rice",
    nameTa: "சோறு",
    initial: "R",
    type: "kottu-flow",
    bases: [],
    proteins: [
      { id: "chicken", nameEn: "Chicken", nameTa: "கோழி", extraPrice: 100 },
      { id: "beef", nameEn: "Beef", nameTa: "மாடு", extraPrice: 120 },
      { id: "egg", nameEn: "Egg", nameTa: "முட்டை", extraPrice: 50 }
    ],
    sizes: [
      { id: "normal", nameEn: "Normal", nameTa: "சாதாரண", price: 350 },
      { id: "full", nameEn: "Full", nameTa: "முழு", price: 500 }
    ]
  },
  {
    id: "dhosai",
    nameEn: "Dhosai",
    nameTa: "தோசை",
    initial: "D",
    type: "dhosai-flow",
    bases: [
      { id: "beef", nameEn: "Beef Dhosai", nameTa: "மாட்டிறைச்சி தோசை", price: 200 },
      { id: "extra", nameEn: "Extra Dhosai", nameTa: "கூடுதல் தோசை", price: 250 }
    ],
    proteins: [
      { id: "beef", nameEn: "Beef", nameTa: "மாடு" },
      { id: "chicken", nameEn: "Chicken", nameTa: "கோழி" },
      { id: "egg", nameEn: "Egg", nameTa: "முட்டை" }
    ]
  },
  {
    id: "meals",
    nameEn: "Meals",
    nameTa: "உணவு",
    initial: "M",
    type: "meals-flow",
    bases: [
      { 
        id: "idiyappam", 
        nameEn: "Idiyappam", 
        nameTa: "இடியாப்பம்", 
        plainPrice: 10, 
        sambalPrice: 12.50, 
        currySurcharge: 10 
      },
      { 
        id: "parata", 
        nameEn: "Parata", 
        nameTa: "பராட்டா", 
        plainPrice: 30, 
        sambalPrice: 33.33, 
        currySurcharge: 20 
      }
    ],
    curries: [
      { id: "nocurry", nameEn: "No Curry", nameTa: "கறி இல்லை", price: 0 },
      { id: "dhalcurry", nameEn: "Dhal Curry", nameTa: "பருப்பு கறி", price: 50 },
      { id: "eggcurry", nameEn: "Egg Curry", nameTa: "முட்டை கறி", price: 80 },
      { id: "fishcurry", nameEn: "Fish Curry", nameTa: "மீன் கறி", price: 120 },
      { id: "chickencurry", nameEn: "Chicken Curry", nameTa: "கோழி கறி", price: 150 },
      { id: "beefcurry", nameEn: "Beef Curry", nameTa: "மாட்டிறைச்சி கறி", price: 180 }
    ]
  },
  {
    id: "gravy",
    nameEn: "Gravy",
    nameTa: "கிரேவி",
    initial: "G",
    type: "gravy-flow",
    portions: [
      { id: "onePortion", nameEn: "1 Portion", nameTa: "1 பகுதி", price: 100 },
      { id: "halfPortion", nameEn: "Half Portion", nameTa: "அரை பகுதி", price: 50 }
    ]
  },
  {
    id: "shorties",
    nameEn: "Shorties",
    nameTa: "சிற்றுண்டி",
    initial: "S",
    type: "fixed-item-flow"
  },
  {
    id: "beverage",
    nameEn: "Beverage",
    nameTa: "குளிர்பானம்",
    initial: "B",
    type: "fixed-item-flow"
  },
  {
    id: "hot",
    nameEn: "Hot",
    nameTa: "சூடான பானம்",
    initial: "H",
    type: "fixed-item-flow"
  }
];
