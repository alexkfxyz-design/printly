/**
 * Comprime una imagen en el navegador (canvas) para guardarla en Firestore.
 * Firestore admite documentos de hasta 1 MB, así que las imágenes se reducen
 * a `max` px por lado y se guardan como data URL WEBP (o JPEG si el navegador no soporta WEBP).
 */
export function compressImage(file, max = 900, quality = 0.78) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type?.startsWith('image/')) return reject(new Error('Sube una imagen JPG, PNG o WEBP.'));
    const fr = new FileReader();
    fr.onerror = () => reject(new Error('No pudimos leer el archivo.'));
    fr.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('No pudimos leer esa imagen.'));
      img.onload = () => {
        const s = Math.min(1, max / Math.max(img.width, img.height));
        const cv = document.createElement('canvas');
        cv.width = Math.max(1, Math.round(img.width * s));
        cv.height = Math.max(1, Math.round(img.height * s));
        cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
        let data = cv.toDataURL('image/webp', quality);
        if (!data.startsWith('data:image/webp')) data = cv.toDataURL('image/jpeg', quality);
        resolve({ data, width: img.width, height: img.height, name: file.name });
      };
      img.src = fr.result;
    };
    fr.readAsDataURL(file);
  });
}

export const approxBytes = (obj) => new Blob([JSON.stringify(obj)]).size;
