/** Compresse une image dans le navigateur (max 800px, JPEG 0.72). */
export async function compressImage(blob: Blob, max = 800, quality = 0.72): Promise<string> {
  const bmp = await createImageBitmap(blob);
  const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * scale), h = Math.round(bmp.height * scale);
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  c.getContext("2d")!.drawImage(bmp, 0, 0, w, h);
  bmp.close();
  return c.toDataURL("image/jpeg", quality);
}
/** Couleur moyenne approximative du centre de l'image → nom de couleur proche. */
export async function guessColor(dataUrl: string): Promise<string> {
  const img = new Image(); img.src = dataUrl; await img.decode();
  const c = document.createElement("canvas"); c.width = 20; c.height = 20;
  const ctx = c.getContext("2d")!; ctx.drawImage(img, img.width * 0.3, img.height * 0.3, img.width * 0.4, img.height * 0.4, 0, 0, 20, 20);
  const d = ctx.getImageData(0, 0, 20, 20).data; let r = 0, g = 0, b = 0;
  for (let i = 0; i < d.length; i += 4) { r += d[i]!; g += d[i + 1]!; b += d[i + 2]!; }
  const n = d.length / 4; return nearestColor(r / n, g / n, b / n);
}
const REF: [string, number, number, number][] = [
  ["noir", 25, 25, 25], ["blanc", 240, 240, 240], ["crème", 240, 230, 210], ["beige", 210, 190, 160], ["camel", 190, 140, 90],
  ["marron", 110, 70, 45], ["gris", 140, 140, 140], ["bleu marine", 30, 40, 80], ["bleu", 50, 90, 180], ["bleu ciel", 150, 190, 230],
  ["vert", 50, 140, 70], ["kaki", 120, 115, 70], ["jaune", 235, 210, 60], ["orange", 230, 130, 40], ["terracotta", 190, 90, 60],
  ["rouge", 200, 40, 40], ["bordeaux", 110, 25, 40], ["rose", 235, 160, 180], ["violet", 120, 60, 150], ["lavande", 180, 160, 220], ["denim", 80, 105, 140],
];
function nearestColor(r: number, g: number, b: number) {
  let best = "gris", bd = Infinity;
  for (const [n, R, G, B] of REF) { const dd = (r - R) ** 2 + (g - G) ** 2 + (b - B) ** 2; if (dd < bd) { bd = dd; best = n; } }
  return best;
}
