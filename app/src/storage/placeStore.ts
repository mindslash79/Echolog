import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'ECHOLOG_PLACE_MAP_V1';

export async function loadPlaceMap(): Promise<Record<string, string>> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

export async function savePlaceMap(map: Record<string, string>): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(map));
}
