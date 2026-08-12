import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDocs,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../firebase';
import { DesignPreset } from '../types';
import { getFullPresetDatabase } from '../data/presets';

const DESIGNS_COLLECTION = 'designs';
const LEGACY_COLLECTION = 'design_presets';

/**
 * Uploads a base64 Data URL to Cloudinary/Storage via server endpoint
 * to convert heavy base64 strings into lightweight permanent CDN image URLs.
 */
async function uploadDataUrlToCloud(dataUrl: string, identifier: string): Promise<string> {
  // If it's already a web URL (http:// or https://), no need to upload
  if (!dataUrl || dataUrl.startsWith('http://') || dataUrl.startsWith('https://')) {
    return dataUrl;
  }

  try {
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        file: dataUrl,
        folder: 'spidey_jersey_png_assets',
        public_id: identifier.replace(/[^a-zA-Z0-9_-]/g, '_'),
      }),
    });

    const data = await res.json();
    if (res.ok && data.success && data.url) {
      return data.url;
    }
  } catch (err) {
    console.warn(`Failed to upload asset ${identifier} to cloud storage, keeping raw data:`, err);
  }

  return dataUrl;
}

/**
 * Sanitizes a DesignPreset prior to saving to Cloud Firestore by converting
 * heavy base64 PNG assets (letterAssets, numberAssets) to permanent Cloud CDN URLs.
 */
export async function preparePresetForCloud(preset: DesignPreset): Promise<DesignPreset> {
  const prepared: DesignPreset = { ...preset, updatedAt: new Date().toISOString() };

  // Convert numberAssets base64 images to CDN URLs
  if (preset.numberAssets && Object.keys(preset.numberAssets).length > 0) {
    const uploadedNumberAssets: Record<string, string> = {};
    for (const [digit, urlOrBase64] of Object.entries(preset.numberAssets)) {
      if (urlOrBase64) {
        const cdnUrl = await uploadDataUrlToCloud(
          urlOrBase64,
          `preset_${preset.code}_num_${digit}`
        );
        uploadedNumberAssets[digit] = cdnUrl;
      }
    }
    prepared.numberAssets = uploadedNumberAssets;
  }

  // Convert letterAssets base64 images to CDN URLs
  if (preset.letterAssets && Object.keys(preset.letterAssets).length > 0) {
    const uploadedLetterAssets: Record<string, string> = {};
    for (const [letter, urlOrBase64] of Object.entries(preset.letterAssets)) {
      if (urlOrBase64) {
        const cdnUrl = await uploadDataUrlToCloud(
          urlOrBase64,
          `preset_${preset.code}_let_${letter}`
        );
        uploadedLetterAssets[letter] = cdnUrl;
      }
    }
    prepared.letterAssets = uploadedLetterAssets;
  }

  // Convert customFontDataUrl if needed
  if (preset.customFontDataUrl && preset.customFontDataUrl.startsWith('data:')) {
    const fontCdnUrl = await uploadDataUrlToCloud(
      preset.customFontDataUrl,
      `preset_${preset.code}_font`
    );
    prepared.customFontDataUrl = fontCdnUrl;
  }

  return prepared;
}

/**
 * Saves a NEW design directly to the Firestore database collection named "designs" using addDoc().
 * Returns the auto-generated document ID from Firestore.
 */
export async function saveNewDesignToFirestore(preset: DesignPreset): Promise<string> {
  try {
    const cloudReady = await preparePresetForCloud(preset);
    // Remove local 'id' property so Firestore auto-generates document ID
    const { id, ...dataToSave } = cloudReady;
    const cleanData = JSON.parse(JSON.stringify({
      ...dataToSave,
      id: undefined,
      updatedAt: new Date().toISOString(),
    }));

    const docRef = await addDoc(collection(db, DESIGNS_COLLECTION), cleanData);
    console.log(`Successfully added new design ${preset.code} to Firestore 'designs' collection with ID: ${docRef.id}`);
    
    // Update local object with Firestore document ID
    await setDoc(doc(db, DESIGNS_COLLECTION, docRef.id), { id: docRef.id }, { merge: true });
    return docRef.id;
  } catch (err) {
    console.error(`Error adding new design to Firestore collection 'designs':`, err);
    throw err;
  }
}

/**
 * Updates an existing design in Cloud Firestore collection 'designs'.
 */
export async function updateDesignInFirestore(designId: string, preset: DesignPreset): Promise<void> {
  try {
    const cloudReady = await preparePresetForCloud(preset);
    const cleanData = JSON.parse(JSON.stringify({
      ...cloudReady,
      id: designId,
      updatedAt: new Date().toISOString(),
    }));

    await setDoc(doc(db, DESIGNS_COLLECTION, designId), cleanData, { merge: true });
    console.log(`Updated design ${preset.code} (${designId}) in Firestore 'designs' collection.`);
  } catch (err) {
    console.error(`Error updating design ${designId} in Firestore:`, err);
    throw err;
  }
}

/**
 * Saves or creates a preset in Cloud Firestore.
 * If new or client-generated ID, uses addDoc() on 'designs' collection.
 */
export async function savePresetToFirestore(preset: DesignPreset): Promise<string> {
  const isNew = !preset.id || preset.id.startsWith('preset-custom-') || preset.id.startsWith('preset-copy-') || preset.id.startsWith('new-');

  if (isNew) {
    return await saveNewDesignToFirestore(preset);
  } else {
    await updateDesignInFirestore(preset.id, preset);
    return preset.id;
  }
}

/**
 * Real-time listener using onSnapshot() to fetch all saved designs from Firestore.
 * Ensures any device or user visiting the web app receives real-time updates.
 */
export function subscribeToDesigns(onUpdate: (designs: DesignPreset[]) => void): () => void {
  const defaultPresets = getFullPresetDatabase();

  const unsubscribe = onSnapshot(
    collection(db, DESIGNS_COLLECTION),
    (snapshot) => {
      const presetMap = new Map<string, DesignPreset>();

      // 1. Initialize with built-in default presets
      defaultPresets.forEach((p) => presetMap.set(p.id, p));

      // 2. Override or append real-time documents from Firestore 'designs' collection
      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data() as Omit<DesignPreset, 'id'>;
        const firestoreDesign: DesignPreset = {
          ...data,
          id: docSnap.id,
        };

        // If a design with the same code exists in default presets, replace it
        if (firestoreDesign.code) {
          for (const [key, existing] of presetMap.entries()) {
            if (existing.code === firestoreDesign.code && key !== docSnap.id) {
              presetMap.delete(key);
            }
          }
        }
        presetMap.set(docSnap.id, firestoreDesign);
      });

      const designList = Array.from(presetMap.values());
      console.log(`Real-time onSnapshot update received: ${snapshot.size} custom designs loaded from Firestore 'designs'.`);
      onUpdate(designList);
    },
    (error) => {
      console.warn(`Firestore onSnapshot listener fallback (using local presets):`, error);
      onUpdate(defaultPresets);
    }
  );

  return unsubscribe;
}

/**
 * Synchronizes all local custom presets to Firestore 'designs' collection in batch.
 */
export async function syncAllPresetsToFirestore(presets: DesignPreset[]): Promise<number> {
  let count = 0;
  for (const preset of presets) {
    if (
      preset.numberAssets ||
      preset.letterAssets ||
      preset.customFontDataUrl ||
      preset.id.startsWith('preset-custom-') ||
      preset.id.startsWith('preset-copy-') ||
      preset.league === 'Custom'
    ) {
      await savePresetToFirestore(preset);
      count++;
    }
  }
  return count;
}

/**
 * Fetches all design presets stored in Cloud Firestore (one-time fetch fallback).
 */
export async function loadPresetsFromFirestore(): Promise<DesignPreset[]> {
  const defaultPresets = getFullPresetDatabase();
  const presetMap = new Map<string, DesignPreset>();

  defaultPresets.forEach((p) => presetMap.set(p.id, p));

  try {
    const snapshot = await getDocs(collection(db, DESIGNS_COLLECTION));
    snapshot.docs.forEach((docSnap) => {
      const cloudPreset = docSnap.data() as DesignPreset;
      if (cloudPreset && cloudPreset.code) {
        presetMap.set(docSnap.id, { ...cloudPreset, id: docSnap.id });
      }
    });
  } catch (err) {
    console.warn('Could not load designs from Firestore:', err);
  }

  return Array.from(presetMap.values());
}

/**
 * Deletes a design from Cloud Firestore collection 'designs'.
 */
export async function deletePresetFromFirestore(designId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, DESIGNS_COLLECTION, designId));
    // Also cleanup legacy collection if present
    try {
      await deleteDoc(doc(db, LEGACY_COLLECTION, designId));
    } catch (_) {}
    console.log(`Deleted design ${designId} from Cloud Firestore collection 'designs'.`);
  } catch (err) {
    console.error(`Error deleting design ${designId} from Firestore:`, err);
  }
}
