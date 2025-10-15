import PocketBase from "pocketbase";
import { TypedPocketBase } from "./types/pocketbase";

// Configuración del cliente PocketBase
const pb = new PocketBase(
  process.env.NEXT_PUBLIC_POCKETBASE_URL || "https://pb-musica.blassanto.me"
) as TypedPocketBase;

// Configurar auto-cancelación de requests para evitar errores de network
pb.autoCancellation(false);

// Configurar idioma si es necesario
pb.collection("_health");

export default pb;

// Helper para autenticación
export const auth = {
  // Verificar si hay un usuario autenticado
  isValid: () => pb.authStore.isValid,

  // Obtener el usuario actual
  user: () => pb.authStore.model,

  // Cerrar sesión
  logout: () => pb.authStore.clear(),

  // Login como admin (para desarrollo)
  loginAsAdmin: async (email: string, password: string) => {
    return await pb.admins.authWithPassword(email, password);
  },

  // Refrescar token de autenticación
  refresh: async () => {
    if (pb.authStore.isValid) {
      try {
        await pb.collection("users").authRefresh();
      } catch (error) {
        console.error("Error refreshing auth:", error);
        pb.authStore.clear();
      }
    }
  },
};

// Helper para manejar errores de PocketBase
export const handlePocketBaseError = (error: unknown) => {
  if (error && typeof error === "object" && "response" in error) {
    const pocketBaseError = error as { response?: { data?: unknown } };
    if (pocketBaseError.response?.data) {
      return pocketBaseError.response.data;
    }
  }

  if (error instanceof Error) {
    return { message: error.message };
  }

  return { message: "Error desconocido" };
};

// Helper para subir archivos
export const uploadFile = async (
  collection: string,
  recordId: string,
  field: string,
  file: File
) => {
  const formData = new FormData();
  formData.append(field, file);

  return await pb.collection(collection).update(recordId, formData);
};
