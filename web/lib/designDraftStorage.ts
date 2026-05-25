export const DESIGN_DRAFT_STORAGE_KEY = 'stitchra-design-draft-v1';
export const DESIGN_DRAFT_ACTIVE_LOGO_IMAGE_KEY = 'active-logo';

const DESIGN_DRAFT_DB_NAME = 'stitchra-design-draft';
const DESIGN_DRAFT_DB_VERSION = 1;
const DESIGN_DRAFT_IMAGE_STORE = 'images';
const LOCAL_IMAGE_FALLBACK_PREFIX = `${DESIGN_DRAFT_STORAGE_KEY}:image:`;

export type DesignDraftStartMode = 'upload' | 'ai' | null;
export type DesignDraftLogoSource = 'uploaded' | 'aiGenerated' | null;

export type DesignDraftConcept = {
  id: string;
  filename: string;
  prompt: string;
  source?: string;
  imageKey: string;
  createdAt: number;
};

export type DesignDraftLogoAnalysisSummary = {
  colors_count: number;
  contrast_score: number;
  embroidery_ready: boolean;
  warnings: string[];
  recommendations: string[];
  dominant_colors?: Array<{
    hex: string;
    percentage: number;
  }>;
};

export type DesignDraftEstimateSummary = {
  stitches: number;
  colors: number;
  coverage: number;
  price_eur: number | null;
  manual_quote: boolean;
  pricing_tier: string;
  warnings: string[];
  recommendations: string[];
  width_mm: number;
  height_mm: number;
};

export type SavedDesignDraft = {
  draftVersion: 1;
  designStartMode: DesignDraftStartMode;
  shirtColor: 'black' | 'white';
  selectedSide: 'front' | 'back' | 'sleeves';
  selectedPlacement: string;
  placementMode: 'preset' | 'custom';
  customPlacement: {
    x: number;
    y: number;
    side: 'front' | 'back' | 'side';
    frame: number;
  } | null;
  logoPlacementConfig: {
    placement_zone: string;
    logo_position_x: number;
    logo_position_y: number;
    logo_width_mm: number;
    logo_height_mm: number;
    logo_scale: number;
    logo_offset_x: number;
    logo_offset_y: number;
    shirt_color: 'black' | 'white';
  };
  logoAspectRatio: number;
  ideaPrompt: string;
  aiStyleHints: string[];
  generatedConceptStatus: string | null;
  generatedConcepts: DesignDraftConcept[];
  selectedAiConceptId: string | null;
  activeAiConceptId: string | null;
  activeLogoSource: DesignDraftLogoSource;
  activeLogoFilename: string | null;
  activeLogoImageKey: string | null;
  logoAnalysisSummary: DesignDraftLogoAnalysisSummary | null;
  estimateSummary: DesignDraftEstimateSummary | null;
  designPreparation: {
    embroidery_prompt: string;
    recommended_style: string;
    max_colors: number;
    warnings: string[];
    recommendations: string[];
    machine_ready_score: number;
    simplified_description: string;
  } | null;
  lastSavedAt: number;
};

type DraftImageRecord = {
  key: string;
  blob: Blob;
  updatedAt: number;
};

function canUseBrowserStorage() {
  return typeof window !== 'undefined';
}

function openDraftDb() {
  return new Promise<IDBDatabase | null>((resolve) => {
    if (!canUseBrowserStorage() || !('indexedDB' in window)) {
      resolve(null);
      return;
    }

    const request = window.indexedDB.open(
      DESIGN_DRAFT_DB_NAME,
      DESIGN_DRAFT_DB_VERSION
    );

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(DESIGN_DRAFT_IMAGE_STORE)) {
        db.createObjectStore(DESIGN_DRAFT_IMAGE_STORE, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
    request.onblocked = () => resolve(null);
  });
}

function closeDb(db: IDBDatabase | null) {
  if (db) {
    db.close();
  }
}

export async function saveDesignDraft(draft: SavedDesignDraft) {
  if (!canUseBrowserStorage()) {
    return;
  }

  window.localStorage.setItem(
    DESIGN_DRAFT_STORAGE_KEY,
    JSON.stringify(draft)
  );
}

export async function loadDesignDraft() {
  if (!canUseBrowserStorage()) {
    return null;
  }

  const raw = window.localStorage.getItem(DESIGN_DRAFT_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<SavedDesignDraft>;

    return parsed.draftVersion === 1
      ? (parsed as SavedDesignDraft)
      : null;
  } catch {
    return null;
  }
}

export async function clearDesignDraft() {
  if (!canUseBrowserStorage()) {
    return;
  }

  window.localStorage.removeItem(DESIGN_DRAFT_STORAGE_KEY);
}

export async function saveDraftImage(key: string, blob: Blob) {
  if (!canUseBrowserStorage()) {
    return;
  }

  const db = await openDraftDb();

  if (!db) {
    try {
      window.localStorage.setItem(
        `${LOCAL_IMAGE_FALLBACK_PREFIX}${key}`,
        await blobToDataUrl(blob)
      );
    } catch {
      // Best-effort fallback only.
    }
    return;
  }

  await new Promise<void>((resolve) => {
    const transaction = db.transaction(DESIGN_DRAFT_IMAGE_STORE, 'readwrite');
    const store = transaction.objectStore(DESIGN_DRAFT_IMAGE_STORE);
    const record: DraftImageRecord = {
      key,
      blob,
      updatedAt: Date.now(),
    };

    store.put(record);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => resolve();
    transaction.onabort = () => resolve();
  });

  closeDb(db);
}

export async function loadDraftImage(key: string) {
  if (!canUseBrowserStorage()) {
    return null;
  }

  const db = await openDraftDb();

  if (!db) {
    const fallback = window.localStorage.getItem(
      `${LOCAL_IMAGE_FALLBACK_PREFIX}${key}`
    );

    return fallback ? dataUrlToBlob(fallback) : null;
  }

  const blob = await new Promise<Blob | null>((resolve) => {
    const transaction = db.transaction(DESIGN_DRAFT_IMAGE_STORE, 'readonly');
    const store = transaction.objectStore(DESIGN_DRAFT_IMAGE_STORE);
    const request = store.get(key);

    request.onsuccess = () => {
      const record = request.result as DraftImageRecord | undefined;
      resolve(record?.blob ?? null);
    };
    request.onerror = () => resolve(null);
  });

  closeDb(db);

  return blob;
}

export async function clearDraftImages() {
  if (!canUseBrowserStorage()) {
    return;
  }

  const db = await openDraftDb();

  if (db) {
    await new Promise<void>((resolve) => {
      const transaction = db.transaction(DESIGN_DRAFT_IMAGE_STORE, 'readwrite');
      const store = transaction.objectStore(DESIGN_DRAFT_IMAGE_STORE);

      store.clear();
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => resolve();
      transaction.onabort = () => resolve();
    });
    closeDb(db);
  }

  Object.keys(window.localStorage)
    .filter((key) => key.startsWith(LOCAL_IMAGE_FALLBACK_PREFIX))
    .forEach((key) => window.localStorage.removeItem(key));
}

export async function dataUrlToBlob(dataUrl: string) {
  const response = await fetch(dataUrl);
  return response.blob();
}

export function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
