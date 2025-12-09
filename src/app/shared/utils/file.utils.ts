/**
 * Convierte un archivo a Base64
 * @param file Archivo a convertir
 * @returns Promise con el string Base64 (sin el prefijo data:)
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      const result = reader.result as string;
      // Remover el prefijo "data:mime/type;base64," si existe
      const base64 = result.split(',')[1] || result;
      resolve(base64);
    };
    
    reader.onerror = (error) => {
      reject(error);
    };
    
    reader.readAsDataURL(file);
  });
}

/**
 * Convierte Base64 a Blob
 * @param base64 String en Base64
 * @param mimeType Tipo MIME del archivo
 * @returns Blob del archivo
 */
export function base64ToBlob(base64: string, mimeType: string): Blob {
  // Decodificar el Base64
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

/**
 * Descarga un archivo desde Base64
 * @param base64 String en Base64
 * @param filename Nombre del archivo
 * @param mimeType Tipo MIME del archivo
 */
export function downloadFileFromBase64(base64: string, filename: string, mimeType: string): void {
  const blob = base64ToBlob(base64, mimeType);
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  
  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Descarga un archivo desde un Blob
 * @param blob Blob del archivo
 * @param filename Nombre del archivo
 */
export function downloadFileFromBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  
  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
