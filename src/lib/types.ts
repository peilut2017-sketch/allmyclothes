export type Season = 'winter' | 'summer' | 'mid' | 'all';
export type ItemStatus = 'active' | 'waiting' | 'to_buy' | 'outgrown' | 'given';

export interface Child {
  id: string;
  name: string;
  birth_date: string | null;
  color: string;
  emoji: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface ItemType {
  id: string;
  name: string;
}

export interface Item {
  id: string;
  name: string;
  description: string | null;
  child_id: string | null;
  category_id: string | null;
  type_id: string | null;
  size_label: string | null;
  season: Season;
  store: string | null;
  location: string | null;
  price: number | null;
  year: number | null;
  quantity: number;
  status: ItemStatus;
  condition: number | null;
  images: string[];
  created_at: string;
}

export interface ItemInput {
  name: string;
  description: string | null;
  child_id: string | null;
  category_id: string | null;
  type_id: string | null;
  size_label: string | null;
  season: Season;
  store: string | null;
  location: string | null;
  price: number | null;
  year: number | null;
  quantity: number;
  status: ItemStatus;
  condition: number | null;
  images: string[];
}

export interface HouseholdMember {
  id: string;
  email: string | null;
}
