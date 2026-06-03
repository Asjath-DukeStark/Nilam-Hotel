export interface BillItem {
  id: string;
  categoryId: string;
  baseType?: string;    // Used for Dhosai Type (Beef | Extra) or Kottu Base
  subType?: string;     // Used for Dhosai Extra Sub-Type (Beef | Chicken | Egg)
  proteins: string[];
  sizeMode?: string;
  qty?: number;         // For Shorties, Beverages, Hot
  price: number;
}
