import { DesignPreset, OrderItem } from '../types';
import { getFullPresetDatabase } from '../data/presets';

const LOCAL_STORAGE_KEY = 'spidey_jersey_presets_v2';

export function getLocalPresets(): DesignPreset[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to read presets from localStorage:', err);
  }
  return getFullPresetDatabase();
}

export function saveLocalPresets(presets: DesignPreset[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(presets));
  } catch (err) {
    console.warn('Failed to save presets to localStorage:', err);
  }
}

export async function fetchPresetsFromD1(): Promise<DesignPreset[]> {
  try {
    const res = await fetch('/api/presets');
    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}`);
    }
    const data = await res.json();
    let rawPresets = [];
    if (Array.isArray(data)) {
      rawPresets = data;
    } else if (data.results && Array.isArray(data.results)) {
      rawPresets = data.results;
    }

    if (rawPresets.length > 0) {
      const parsedPresets = rawPresets.map((row: any) => {
        try {
          if (typeof row.preset_data === 'string') {
            return JSON.parse(row.preset_data);
          }
          return row.preset_data || row;
        } catch (e) {
          return null;
        }
      }).filter(Boolean);

      if (parsedPresets.length > 0) {
        saveLocalPresets(parsedPresets);
        return parsedPresets;
      }
    }
  } catch (err) {
    console.warn('Cloudflare D1 fetch error:', err);
  }
  return getLocalPresets();
}

export async function savePresetToD1(preset: DesignPreset): Promise<any> {
  try {
    const res = await fetch('/api/presets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        design_code: preset.code,
        preset_data: preset
      }),
    });
    return await res.json();
  } catch (err) {
    return { success: false };
  }
}

export async function deletePresetFromD1(presetId: string): Promise<any> {
  try {
    const res = await fetch(`/api/presets/${encodeURIComponent(presetId)}`, {
      method: 'DELETE',
    });
    return await res.json();
  } catch (err) {
    return { success: false };
  }
}

export async function saveOrdersToD1(orders: OrderItem[]): Promise<any> {
  try {
    const res = await fetch('/api/orders/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orders }),
    });
    return await res.json();
  } catch (err) {
    return { success: false };
  }
}
