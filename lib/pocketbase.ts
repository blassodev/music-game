import PocketBase from "pocketbase";
import { TypedPocketBase } from "./types/pocketbase";

// Configuración del cliente PocketBase
const pb = new PocketBase(
  process.env.NEXT_PUBLIC_POCKETBASE_URL || "https://pb-musica.blassanto.me"
) as TypedPocketBase;

// Configurar auto-cancelación de requests para evitar errores de network
pb.autoCancellation(false);

// Configurar para que guarde el auth en cookies en lugar de localStorage
if (typeof window !== "undefined") {
  // En el cliente, configurar el almacenamiento personalizado
  pb.authStore.onChange(() => {
    // Guardar el estado de autenticación en una cookie
    if (pb.authStore.isValid) {
      const authData = {
        token: pb.authStore.token,
        model: pb.authStore.model,
      };
      document.cookie = `pb_auth=${JSON.stringify(authData)}; path=/; max-age=${
        7 * 24 * 60 * 60
      }; samesite=strict`;
    } else {
      // Limpiar la cookie
      document.cookie =
        "pb_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
  });

  // Cargar el estado de autenticación desde la cookie al inicializar
  const authCookie = document.cookie
    .split("; ")
    .find((row) => row.startsWith("pb_auth="));

  if (authCookie) {
    try {
      const authData = JSON.parse(authCookie.split("=")[1]);
      if (authData.token && authData.model) {
        pb.authStore.save(authData.token, authData.model);
      }
    } catch (error) {
      console.error("Error loading auth from cookie:", error);
    }
  }
}

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
  logout: () => {
    pb.authStore.clear();
    // Limpiar también del localStorage en el cliente
    if (typeof window !== "undefined") {
      localStorage.removeItem("pocketbase_auth");
    }
  },

  // Login con la tabla users
  login: async (email: string, password: string) => {
    try {
      const authData = await pb
        .collection("users")
        .authWithPassword(email, password);
      return authData;
    } catch (error) {
      console.error("Error en login:", error);
      throw error;
    }
  },

  // Login como admin (para desarrollo)
  loginAsAdmin: async (email: string, password: string) => {
    return await pb.admins.authWithPassword(email, password);
  },

  // Refrescar token de autenticación
  refresh: async () => {
    if (pb.authStore.isValid) {
      try {
        await pb.collection("users").authRefresh();
        return true;
      } catch (error) {
        console.error("Error refreshing auth:", error);
        pb.authStore.clear();
        return false;
      }
    }
    return false;
  },

  // Verificar si el usuario está autenticado y es válido
  checkAuth: async () => {
    if (!pb.authStore.isValid) {
      return false;
    }

    try {
      // Intentar refrescar el token para verificar validez
      await pb.collection("users").authRefresh();
      return true;
    } catch (error) {
      console.error("Token inválido:", error);
      pb.authStore.clear();
      return false;
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
