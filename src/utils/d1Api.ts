/**
 * Spidey Jersey DTF Pro - Cloudflare D1 Database Client
 * Synchronizes design presets and orders between the client and Cloudflare D1 /api backend.
 */

import { DesignPreset, OrderItem } from '../types';
import { getFullPresetDatabase } from '../data/presets';

const LOCAL_STORAGE_KEY = 'spidey_jersey_presets_v2';

/**
 * Loads presets from local storage cache first, fallback to default presets database.
 */
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

/**
 * Saves current presets array to local storage cache.
 */
export function saveLocalPresets(presets: DesignPreset[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(presets));
  } catch (err) {
    console.warn('Failed to save presets to localStorage:', err);
  }
}

/**
 * Fetch all design presets from the Cloudflare D1 database via API.
 * Automatically merges cloud database presets with the built-in defaults so custom presets
 * from other browsers appear immediately without overwriting the defaults.
 */
export async function fetchPresetsFromD1(): Promise<DesignPreset[]> {
  try {
    const res = await fetch('/api/presets');
    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}`);
    }
    const data = await res.json();
    if (data.success && Array.isArray(data.presets)) {
      const defaultPresets = getFullPresetDatabase();
      const cloudPresets: DesignPreset[] = data.presets;

      const presetMap = new Map<string, DesignPreset>();
      // 1. Add all default presets
      for (const p of defaultPresets) {
        presetMap.set(p.code.toUpperCase(), p);
      }
      // 2. Overwrite / append cloud presets from D1 database
      for (const p of cloudPresets) {
        if (p && p.code) {
          presetMap.set(p.code.toUpperCase(), p);
        }
      }

      const merged = Array.from(presetMap.values());
      saveLocalPresets(merged);
      return merged;
    }
  } catch (err) {
    console.warn('Cloudflare D1 fetch error, falling back to cached presets:', err);
  }
  return getLocalPresets();
}

/**
 * Saves or updates a single design preset to Cloudflare D1 backend
 */
export async function savePresetToD1(
  preset: DesignPreset
): Promise<{ success: boolean; preset?: DesignPreset; error?: string }> {
  try {
    const res = await fetch('/api/presets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preset),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP error ${res.status}`);
    }

    const data = await res.json();
    return { success: true, preset: data.preset || preset };
  } catch (err: any) {
    console.warn('Cloudflare D1 save failed (local storage backup kept):', err);
    return { success: false, error: err.message || 'Failed to save preset to D1' };
  }
}

/**
 * Saves or updates design presets (plural) to Cloudflare D1 backend.
 * Accepts either an array of presets or a single preset object.
 */
export async function savePresetsToD1(
  presets: DesignPreset[] | DesignPreset
): Promise<{ success: boolean; error?: string }> {
  try {
    const isArray = Array.isArray(presets);
    const presetsArray = isArray ? presets : [presets];

    const res = await fetch('/api/presets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(isArray ? presetsArray : presetsArray[0]),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP error ${res.status}`);
    }

    // Also update local cache
    if (Array.isArray(presets)) {
      saveLocalPresets(presets);
    }

    return { success: true };
  } catch (err: any) {
    console.warn('Cloudflare D1 batch save error:', err);
    return { success: false, error: err.message || 'Failed to save presets to D1' };
  }
}

/**
 * Deletes a design preset from Cloudflare D1 backend
 */
export async function deletePresetFromD1(
  presetId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/presets/${encodeURIComponent(presetId)}`, {
      method: 'DELETE',
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP error ${res.status}`);
    }

    return { success: true };
  } catch (err: any) {
    console.warn('Cloudflare D1 delete failed (local storage updated):', err);
    return { success: false, error: err.message || 'Failed to delete preset from D1' };
  }
}

/**
 * Saves parsed orders to Cloudflare D1 backend
 */
export async function saveOrdersToD1(
  orders: OrderItem[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch('/api/orders/bulk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ orders }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP error ${res.status}`);
    }

    return { success: true };
  } catch (err: any) {
    console.warn('Cloudflare D1 orders sync warning:', err);
    return { success: false, error: err.message };
  }
}
