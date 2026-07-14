import { createClient } from '@sanity/client';

export const client = createClient({
  projectId: import.meta.env.PUBLIC_SANITY_PROJECT_ID,
  dataset: import.meta.env.PUBLIC_SANITY_DATASET,
  useCdn: false, // Ponemos false para que el gym vea los cambios de videos e imágenes de inmediato sin caché
  apiVersion: '2026-07-14', // Fecha de hoy para usar la API más actualizada
});