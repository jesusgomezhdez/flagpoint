import { cache } from 'fabric';
import { ANNOTATION_FONT_FAMILY, ANNOTATION_FONT_NAME } from './style';

/**
 * Espera a que la fuente de anotaciones (declarada con @font-face en el CSS
 * del editor) esté lista antes de crear textos. Fabric cachea el ancho de
 * cada carácter: si mide con la fuente de respaldo, el cursor y el ajuste de
 * líneas quedan desfasados, así que se limpia esa caché tras la carga.
 */
export async function loadAnnotationFont(): Promise<void> {
  try {
    await document.fonts.load(`400 32px ${ANNOTATION_FONT_NAME}`);
  } catch (err) {
    console.warn('[flagpoint] no se pudo cargar la fuente de anotaciones', err);
  }
  cache.clearFontCache(ANNOTATION_FONT_FAMILY);
}
