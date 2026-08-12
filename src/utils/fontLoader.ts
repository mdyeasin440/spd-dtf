/**
 * Dynamic Font Loader Utility for Canvas & DOM
 */

const loadedFontFamilies = new Set<string>([
  'Oswald',
  'Bebas Neue',
  'Anton',
  'Teko',
  'Jersey 15',
  'Montserrat',
  'Orbitron',
  'Rajdhani',
  'Graduate',
  'Rubik Mono One',
  'Fjalla One',
  'Arial',
  'Impact',
]);

export async function registerCustomFont(
  fontName: string,
  fontDataUrl: string
): Promise<string> {
  const sanitizedName = fontName.replace(/[^a-zA-Z0-9_-]/g, '_');
  if (loadedFontFamilies.has(sanitizedName)) {
    return sanitizedName;
  }

  try {
    const newFontFace = new FontFace(sanitizedName, `url(${fontDataUrl})`);
    const loadedFace = await newFontFace.load();
    document.fonts.add(loadedFace);
    loadedFontFamilies.add(sanitizedName);
    console.log(`Custom font registered: ${sanitizedName}`);
    return sanitizedName;
  } catch (err) {
    console.error(`Failed to register custom font ${sanitizedName}:`, err);
    return 'Oswald'; // fallback
  }
}

export function ensureFontAvailable(fontFamily: string): void {
  if (document.fonts && document.fonts.load) {
    document.fonts.load(`16px "${fontFamily}"`).catch((e) => {
      console.warn(`Font load check warning for ${fontFamily}:`, e);
    });
  }
}
