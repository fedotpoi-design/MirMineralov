export type MineralCategory =
  | 'Все'
  | 'Кварцы и друзы'
  | 'Малахит и медьсодержащие'
  | 'Полевые шпаты и лабрадорит'
  | 'Редкие самоцветы Сибири'
  | 'Лазурит и содалит'
  | 'Агаты, яшма и халцедон'
  | 'Бериллы и гранаты';

export type MineralForm =
  | 'Все формы'
  | 'Друза / Щётка'
  | 'Кристалл природный'
  | 'Срез / Плитка'
  | 'Кабошон'
  | 'Шар коллекционный'
  | 'Галтовка / Образец';

export interface MineralItem {
  id: string;
  livemasterId: string;
  title: string;
  mobileTitle: string;
  subtitle: string;
  category: Exclude<MineralCategory, 'Все'>;
  form: Exclude<MineralForm, 'Все формы'>;
  priceRub: number;
  oldPriceRub?: number;
  weightGrams: number;
  dimensionsMm: string;
  origin: string;
  mobileOrigin: string;
  chemicalFormula: string;
  mohsHardness: string;
  crystalSystem: string;
  density: string;
  luster: string;
  inStock: number;
  rating: number;
  reviewsCount: number;
  livemasterUrl: string;
  imageUrl?: string;
  visualPreset:
    | 'amethyst'
    | 'malachite'
    | 'labradorite'
    | 'charoite'
    | 'smoky_quartz'
    | 'lapis'
    | 'fluorite'
    | 'aquamarine'
    | 'agate'
    | 'garnet'
    | 'tigers_eye'
    | 'rose_quartz';
  shortDescription: string;
  mobileDescription: string;
  geologicalDescription: string;
  lithotherapyProperties: string[];
  mobileProperties: string[];
  zodiacSigns: string[];
  chakra: string;
}

export interface CartItem {
  mineral: MineralItem;
  quantity: number;
}

export interface LivemasterSyncResponse {
  sourceUrl: string;
  shopName: string;
  shopRating: number;
  reviewsTotal: number;
  subscribersCount: number;
  location: string;
  syncedAt: string;
  liveScrapedCount: number;
  syncMode: 'live-dom' | 'hybrid-catalog';
  items: MineralItem[];
}
