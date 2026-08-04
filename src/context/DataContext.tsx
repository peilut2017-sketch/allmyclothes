import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { supabase, STORAGE_BUCKET } from '../lib/supabase';
import { DEFAULT_CATEGORIES, DEFAULT_ITEM_TYPES } from '../lib/constants';
import { compressImage } from '../lib/image';
import type { Category, Child, HouseholdMember, Item, ItemInput, ItemType } from '../lib/types';
import { useAuth } from './AuthContext';

interface DataContextValue {
  loading: boolean;
  error: string | null;
  children: Child[];
  categories: Category[];
  itemTypes: ItemType[];
  items: Item[];
  imageUrls: Record<string, string>;
  inviteCode: string | null;
  members: HouseholdMember[];
  joinHousehold: (code: string) => Promise<boolean>;
  leaveHousehold: () => Promise<void>;
  reload: () => Promise<void>;
  addChild: (child: Omit<Child, 'id'>) => Promise<void>;
  updateChild: (id: string, child: Partial<Omit<Child, 'id'>>) => Promise<void>;
  deleteChild: (id: string) => Promise<void>;
  addCategory: (name: string) => Promise<Category | null>;
  renameCategory: (id: string, name: string) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  addItemType: (name: string) => Promise<ItemType | null>;
  renameItemType: (id: string, name: string) => Promise<void>;
  deleteItemType: (id: string) => Promise<void>;
  addItem: (input: ItemInput) => Promise<Item | null>;
  updateItem: (id: string, input: Partial<ItemInput>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  uploadImage: (file: File) => Promise<string | null>;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children: node }: { children: ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [childList, setChildList] = useState<Child[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [itemTypes, setItemTypes] = useState<ItemType[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [householdId, setHouseholdId] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [members, setMembers] = useState<HouseholdMember[]>([]);

  const resolveImageUrls = useCallback(async (paths: string[]) => {
    const unique = [...new Set(paths.filter(Boolean))];
    if (unique.length === 0) return;
    const { data } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrls(unique, 60 * 60 * 24 * 6);
    if (!data) return;
    setImageUrls((prev) => {
      const next = { ...prev };
      data.forEach((entry, i) => {
        if (entry.signedUrl) next[unique[i]] = entry.signedUrl;
      });
      return next;
    });
  }, []);

  const seedDefaults = useCallback(async (uid: string) => {
    const seedKey = `seeded:${uid}`;
    if (localStorage.getItem(seedKey)) return { cats: [], types: [] };
    localStorage.setItem(seedKey, '1');
    const [catRes, typeRes] = await Promise.all([
      supabase
        .from('categories')
        .insert(DEFAULT_CATEGORIES.map((name) => ({ user_id: uid, name })))
        .select(),
      supabase
        .from('item_types')
        .insert(DEFAULT_ITEM_TYPES.map((name) => ({ user_id: uid, name })))
        .select(),
    ]);
    return { cats: (catRes.data ?? []) as Category[], types: (typeRes.data ?? []) as ItemType[] };
  }, []);

  const reload = useCallback(async () => {
    if (!userId) return;
    setError(null);
    // ודא שקיים משק בית (חשוב לפני כל שאילתה – חוקי הגישה תלויים בו)
    const { data: hid, error: hidError } = await supabase.rpc('ensure_membership');
    if (hidError) {
      setError(hidError.message);
      setLoading(false);
      return;
    }
    setHouseholdId(hid as string);
    const [childRes, catRes, typeRes, itemRes, houseRes, memberRes] = await Promise.all([
      supabase.from('children').select('*').order('birth_date', { ascending: true }),
      supabase.from('categories').select('*').order('created_at', { ascending: true }),
      supabase.from('item_types').select('*').order('name', { ascending: true }),
      supabase.from('items').select('*').order('created_at', { ascending: false }),
      supabase.from('households').select('invite_code').single(),
      supabase.from('profiles').select('id, email').eq('household_id', hid as string),
    ]);
    setInviteCode(houseRes.data?.invite_code ?? null);
    setMembers((memberRes.data ?? []) as HouseholdMember[]);
    const firstError = childRes.error ?? catRes.error ?? typeRes.error ?? itemRes.error;
    if (firstError) {
      setError(firstError.message);
      setLoading(false);
      return;
    }
    let cats = (catRes.data ?? []) as Category[];
    let types = (typeRes.data ?? []) as ItemType[];
    if (cats.length === 0 && types.length === 0) {
      const seeded = await seedDefaults(userId);
      cats = seeded.cats.length ? seeded.cats : cats;
      types = seeded.types.length ? seeded.types : types;
    }
    setChildList((childRes.data ?? []) as Child[]);
    setCategories(cats);
    setItemTypes(types);
    const loadedItems = ((itemRes.data ?? []) as Item[]).map((i) => ({ ...i, images: i.images ?? [] }));
    setItems(loadedItems);
    setLoading(false);
    void resolveImageUrls(loadedItems.flatMap((i) => i.images));
  }, [userId, seedDefaults, resolveImageUrls]);

  useEffect(() => {
    if (userId) {
      setLoading(true);
      void reload();
    } else {
      setChildList([]);
      setCategories([]);
      setItemTypes([]);
      setItems([]);
      setImageUrls({});
      setHouseholdId(null);
      setInviteCode(null);
      setMembers([]);
    }
  }, [userId, reload]);

  // רענון בחזרה לאפליקציה – שומר על סנכרון בין שני הורים שמעדכנים במקביל
  useEffect(() => {
    if (!userId) return;
    let last = Date.now();
    const onVisible = () => {
      if (document.visibilityState === 'visible' && Date.now() - last > 30_000) {
        last = Date.now();
        void reload();
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [userId, reload]);

  const joinHousehold = useCallback(
    async (code: string) => {
      const { data, error: err } = await supabase.rpc('join_household', { code });
      if (err) throw new Error(err.message);
      if (data === true) await reload();
      return data === true;
    },
    [reload],
  );

  const leaveHousehold = useCallback(async () => {
    const { error: err } = await supabase.rpc('leave_household');
    if (err) throw new Error(err.message);
    await reload();
  }, [reload]);

  const addChild = useCallback(
    async (child: Omit<Child, 'id'>) => {
      if (!userId) return;
      const { data, error: err } = await supabase
        .from('children')
        .insert({ ...child, user_id: userId })
        .select()
        .single();
      if (err) throw new Error(err.message);
      setChildList((prev) => [...prev, data as Child]);
    },
    [userId],
  );

  const updateChild = useCallback(async (id: string, child: Partial<Omit<Child, 'id'>>) => {
    const { error: err } = await supabase.from('children').update(child).eq('id', id);
    if (err) throw new Error(err.message);
    setChildList((prev) => prev.map((c) => (c.id === id ? { ...c, ...child } : c)));
  }, []);

  const deleteChild = useCallback(async (id: string) => {
    const { error: err } = await supabase.from('children').delete().eq('id', id);
    if (err) throw new Error(err.message);
    setChildList((prev) => prev.filter((c) => c.id !== id));
    setItems((prev) => prev.map((i) => (i.child_id === id ? { ...i, child_id: null } : i)));
  }, []);

  const addNamed = useCallback(
    async (table: 'categories' | 'item_types', name: string) => {
      if (!userId) return null;
      const trimmed = name.trim();
      if (!trimmed) return null;
      const { data, error: err } = await supabase
        .from(table)
        .insert({ user_id: userId, name: trimmed })
        .select()
        .single();
      if (err) throw new Error(err.message);
      return data as Category;
    },
    [userId],
  );

  const addCategory = useCallback(
    async (name: string) => {
      const created = await addNamed('categories', name);
      if (created) setCategories((prev) => [...prev, created]);
      return created;
    },
    [addNamed],
  );

  const renameCategory = useCallback(async (id: string, name: string) => {
    const { error: err } = await supabase.from('categories').update({ name }).eq('id', id);
    if (err) throw new Error(err.message);
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, name } : c)));
  }, []);

  const deleteCategory = useCallback(async (id: string) => {
    const { error: err } = await supabase.from('categories').delete().eq('id', id);
    if (err) throw new Error(err.message);
    setCategories((prev) => prev.filter((c) => c.id !== id));
    setItems((prev) => prev.map((i) => (i.category_id === id ? { ...i, category_id: null } : i)));
  }, []);

  const addItemType = useCallback(
    async (name: string) => {
      const created = await addNamed('item_types', name);
      if (created) setItemTypes((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name, 'he')));
      return created;
    },
    [addNamed],
  );

  const renameItemType = useCallback(async (id: string, name: string) => {
    const { error: err } = await supabase.from('item_types').update({ name }).eq('id', id);
    if (err) throw new Error(err.message);
    setItemTypes((prev) => prev.map((t) => (t.id === id ? { ...t, name } : t)));
  }, []);

  const deleteItemType = useCallback(async (id: string) => {
    const { error: err } = await supabase.from('item_types').delete().eq('id', id);
    if (err) throw new Error(err.message);
    setItemTypes((prev) => prev.filter((t) => t.id !== id));
    setItems((prev) => prev.map((i) => (i.type_id === id ? { ...i, type_id: null } : i)));
  }, []);

  const addItem = useCallback(
    async (input: ItemInput) => {
      if (!userId) return null;
      const { data, error: err } = await supabase
        .from('items')
        .insert({ ...input, user_id: userId })
        .select()
        .single();
      if (err) throw new Error(err.message);
      const created = data as Item;
      setItems((prev) => [created, ...prev]);
      return created;
    },
    [userId],
  );

  const updateItem = useCallback(async (id: string, input: Partial<ItemInput>) => {
    const { error: err } = await supabase.from('items').update(input).eq('id', id);
    if (err) throw new Error(err.message);
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...input } : i)));
  }, []);

  const deleteItem = useCallback(
    async (id: string) => {
      const item = items.find((i) => i.id === id);
      const { error: err } = await supabase.from('items').delete().eq('id', id);
      if (err) throw new Error(err.message);
      setItems((prev) => prev.filter((i) => i.id !== id));
      if (item && item.images.length > 0) {
        void supabase.storage.from(STORAGE_BUCKET).remove(item.images);
      }
    },
    [items],
  );

  const uploadImage = useCallback(
    async (file: File) => {
      if (!userId) return null;
      const blob = await compressImage(file);
      const path = `${householdId ?? userId}/${crypto.randomUUID()}.jpg`;
      const { error: err } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(path, blob, { contentType: 'image/jpeg' });
      if (err) throw new Error(err.message);
      await resolveImageUrls([path]);
      return path;
    },
    [userId, householdId, resolveImageUrls],
  );

  const value = useMemo<DataContextValue>(
    () => ({
      loading,
      error,
      children: childList,
      categories,
      itemTypes,
      items,
      imageUrls,
      inviteCode,
      members,
      joinHousehold,
      leaveHousehold,
      reload,
      addChild,
      updateChild,
      deleteChild,
      addCategory,
      renameCategory,
      deleteCategory,
      addItemType,
      renameItemType,
      deleteItemType,
      addItem,
      updateItem,
      deleteItem,
      uploadImage,
    }),
    [
      loading, error, childList, categories, itemTypes, items, imageUrls, reload,
      inviteCode, members, joinHousehold, leaveHousehold,
      addChild, updateChild, deleteChild, addCategory, renameCategory, deleteCategory,
      addItemType, renameItemType, deleteItemType, addItem, updateItem, deleteItem, uploadImage,
    ],
  );

  return <DataContext.Provider value={value}>{node}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
