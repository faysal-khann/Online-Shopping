const KEY = "cartiva:recent";

export type RecentItem = { slug: string; name: string; image?: string; price: number };

export const getRecent = (): RecentItem[] => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
};

export const pushRecent = (item: RecentItem) => {
  try {
    const list = getRecent().filter((i) => i.slug !== item.slug);
    list.unshift(item);
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, 12)));
  } catch {
    /* storage unavailable */
  }
};

export const clearRecent = () => {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
};