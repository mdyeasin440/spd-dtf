import { DesignPreset, OrderItem } from '../types';
import { getFullPresetDatabase } from '../data/presets';

const LOCAL_STORAGE_KEY = 'spidey_jersey_presets_v2';

export function getLocalPresets(): DesignPreset[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.warn(err);
  }
  return getFullPresetDatabase();
}

export function saveLocalPresets(presets: DesignPreset[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(presets));
  } catch (err) {
    console.warn(err);
  }
}

export async function fetchPresetsFromD1(): Promise<DesignPreset[]> {
  try {
    const res = await fetch('/api/presets');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.success && Array.isArray(data.presets)) {
      const defaultPresets = getFullPresetDatabase();
      const presetMap = new Map<string, DesignPreset>();
      for (const p of defaultPresets) presetMap.set(p.code.toUpperCase(), p);
      for (const p of data.presets) if (p?.code) presetMap.set(p.code.toUpperCase(), p);
      const merged = Array.from(presetMap.values());
      saveLocalPresets(merged);
      return merged;
    }
  } catch (err) {
    console.warn('D1 fetch fallback:', err);
  }
  return getLocalPresets();
}

export async function savePresetToD1(preset: DesignPreset) {
  try {
    const res = await fetch('/api/presets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(preset),
    });
    const data = await res.json();
    return { success: res.ok, preset: data.preset || preset };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function savePresetsToD1(presets: DesignPreset[] | DesignPreset) {
  try {
    const isArray = Array.isArray(presets);
    const res = await fetch('/api/presets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(presets),
    });
    if (isArray) saveLocalPresets(presets);
    return { success: res.ok };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deletePresetFromD1(presetId: string) {
  try {
    const res = await fetch(`/api/presets/${encodeURIComponent(presetId)}`, {
      method: 'DELETE',
    });
    return { success: res.ok };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function saveOrdersToD1(orders: OrderItem[]) {
  try {
    const res = await fetch('/api/orders/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orders }),
    });
    return { success: res.ok };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
