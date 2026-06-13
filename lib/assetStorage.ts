// Úložiště vlastních (nahraných) assetů v IndexedDB. Bity obrázků se ukládají
// lokálně jako Blob → žádný cloud, uživatel platí nic.
import localforage from 'localforage';

export interface CustomAssetMeta {
  id: string; // 'usr:<uuid>'
  name: string;
  width: number;
  height: number;
}

const blobs = localforage.createInstance({ name: 'cartographer', storeName: 'assetBlobs' });
const metaStore = localforage.createInstance({ name: 'cartographer', storeName: 'assetMeta' });

export async function putCustomAsset(meta: CustomAssetMeta, blob: Blob): Promise<void> {
  await blobs.setItem(meta.id, blob);
  await metaStore.setItem(meta.id, meta);
}

export async function deleteCustomAsset(id: string): Promise<void> {
  await blobs.removeItem(id);
  await metaStore.removeItem(id);
}

export async function listCustomAssets(): Promise<{ meta: CustomAssetMeta; blob: Blob }[]> {
  const out: { meta: CustomAssetMeta; blob: Blob }[] = [];
  const ids = await metaStore.keys();
  for (const id of ids) {
    const meta = await metaStore.getItem<CustomAssetMeta>(id);
    const blob = await blobs.getItem<Blob>(id);
    if (meta && blob) out.push({ meta, blob });
  }
  return out;
}
