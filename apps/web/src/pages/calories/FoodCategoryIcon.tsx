import type { FoodProductCategory } from '@veles/db/seed/food-products';
import {
  AppleIcon,
  BeanIcon,
  BeefIcon,
  CakeSliceIcon,
  CarrotIcon,
  CoffeeIcon,
  CookingPotIcon,
  CroissantIcon,
  CupSodaIcon,
  DropletIcon,
  DrumstickIcon,
  DumbbellIcon,
  EggIcon,
  FishIcon,
  type LucideIcon,
  MilkIcon,
  NutIcon,
  PizzaIcon,
  PopcornIcon,
  ShellIcon,
  UtensilsIcon,
  WheatIcon,
  WineIcon,
} from 'lucide-react';

const categoryIcons: Record<FoodProductCategory, LucideIcon> = {
  vegetable: CarrotIcon,
  fruit: AppleIcon,
  grain: WheatIcon,
  bread: CroissantIcon,
  legume: BeanIcon,
  meat: BeefIcon,
  poultry: DrumstickIcon,
  fish: FishIcon,
  seafood: ShellIcon,
  dairy: MilkIcon,
  egg: EggIcon,
  nut: NutIcon,
  oil: DropletIcon,
  condiment: CookingPotIcon,
  sweet: CakeSliceIcon,
  snack: PopcornIcon,
  supplement: DumbbellIcon,
  meal: PizzaIcon,
  drink: CupSodaIcon,
  hotDrink: CoffeeIcon,
  alcohol: WineIcon,
};

/** Placeholder for a food without a photo; seeded products show their category. */
export function FoodCategoryIcon({ category }: { category: FoodProductCategory | null }) {
  const Icon = category ? categoryIcons[category] : UtensilsIcon;
  return <Icon aria-hidden='true' />;
}
