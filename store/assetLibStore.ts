import { create } from 'zustand';
import {
  putCustomAsset,
  deleteCustomAsset,
  listCustomAssets,
  type CustomAssetMeta,
} from '@/lib/assetStorage';

interface AssetLibState {
  customs: CustomAssetMeta[];
  // id → načtený obrázek (sdílený mezi panelem i plátnem)
  images: Record<string, HTMLImageElement>;
  loaded: boolean;

  loadAll: () => Promise<void>;
  importFile: (file: File) => Promise<string | null>;
  removeCustom: (id: string) => Promise<void>;
}

function fileToImage(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

export const useAssetLibStore = create<AssetLibState>((set, get) => ({
  customs: [],
  images: {},
  loaded: false,

  loadAll: async () => {
    if (get().loaded) return;
    try {
      const entries = await listCustomAssets();
      const images: Record<string, HTMLImageElement> = {};
      const customs: CustomAssetMeta[] = [];
      for (const { meta, blob } of entries) {
        try {
          images[meta.id] = await fileToImage(blob);
          customs.push(meta);
        } catch {
          /* poškozený asset přeskočíme */
        }
      }
      set({ customs, images, loaded: true });
    } catch {
      set({ loaded: true });
    }
  },

  importFile: async (file) => {
    if (!file.type.startsWith('image/')) return null;
    try {
      const img = await fileToImage(file);
      const id = `usr:${crypto.randomUUID()}`;
      const meta: CustomAssetMeta = {
        id,
        name: file.name.replace(/\.[^.]+$/, ''),
        width: img.naturalWidth || 128,
        height: img.naturalHeight || 128,
      };
      await putCustomAsset(meta, file);
      set((s) => ({ customs: [meta, ...s.customs], images: { ...s.images, [id]: img } }));
      return id;
    } catch {
      return null;
    }
  },

  removeCustom: async (id) => {
    await deleteCustomAsset(id);
    set((s) => {
      const images = { ...s.images };
      delete images[id];
      return { customs: s.customs.filter((c) => c.id !== id), images };
    });
  },
}));
