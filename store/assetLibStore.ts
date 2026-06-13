import { create } from 'zustand';
import {
  putCustomAsset,
  deleteCustomAsset,
  listCustomAssets,
  type CustomAssetMeta,
} from '@/lib/assetStorage';
import { useDocumentStore } from './documentStore';

interface AssetLibState {
  customs: CustomAssetMeta[];
  // id → načtený obrázek (sdílený mezi panelem i plátnem)
  images: Record<string, HTMLImageElement>;
  // id → object URL (kvůli pozdějšímu uvolnění)
  urls: Record<string, string>;
  loaded: boolean;
  loading: boolean;

  loadAll: () => Promise<void>;
  importFile: (file: File) => Promise<string | null>;
  removeCustom: (id: string) => Promise<void>;
}

function fileToImage(blob: Blob): Promise<{ img: HTMLImageElement; url: string }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => resolve({ img, url });
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
  urls: {},
  loaded: false,
  loading: false,

  loadAll: async () => {
    if (get().loaded || get().loading) return; // ochrana proti dvojímu načtení (StrictMode)
    set({ loading: true });
    try {
      const entries = await listCustomAssets();
      const images: Record<string, HTMLImageElement> = {};
      const urls: Record<string, string> = {};
      const customs: CustomAssetMeta[] = [];
      for (const { meta, blob } of entries) {
        try {
          const { img, url } = await fileToImage(blob);
          images[meta.id] = img;
          urls[meta.id] = url;
          customs.push(meta);
        } catch {
          /* poškozený asset přeskočíme */
        }
      }
      set({ customs, images, urls, loaded: true, loading: false });
    } catch {
      set({ loaded: true, loading: false });
    }
  },

  importFile: async (file) => {
    if (!file.type.startsWith('image/')) return null;
    try {
      const { img, url } = await fileToImage(file);
      const id = `usr:${crypto.randomUUID()}`;
      const meta: CustomAssetMeta = {
        id,
        name: file.name.replace(/\.[^.]+$/, ''),
        width: img.naturalWidth || 128,
        height: img.naturalHeight || 128,
      };
      await putCustomAsset(meta, file);
      set((s) => ({
        customs: [meta, ...s.customs],
        images: { ...s.images, [id]: img },
        urls: { ...s.urls, [id]: url },
      }));
      return id;
    } catch {
      return null;
    }
  },

  removeCustom: async (id) => {
    await deleteCustomAsset(id);
    const url = get().urls[id];
    if (url) URL.revokeObjectURL(url);
    set((s) => {
      const images = { ...s.images };
      const urls = { ...s.urls };
      delete images[id];
      delete urls[id];
      return { customs: s.customs.filter((c) => c.id !== id), images, urls };
    });
    // Odstraň osiřelé instance z mapy, ať na plátně nezůstanou „neviditelné" prvky
    useDocumentStore.getState().removeByAssetId(id);
  },
}));
