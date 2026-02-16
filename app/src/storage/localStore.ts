import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "ECHOLOG_ENTRIES_V1";

export async function loadEntries<T>(): Promise<T[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveEntries<T>(entries: T[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(entries));
}
