import { cookies } from "next/headers";
import PocketBase from "pocketbase";
import type { UsersResponse } from "./types/pocketbase";

// Función para obtener una instancia de PocketBase configurada en el servidor
export function getServerPocketBase() {
  return new PocketBase(
    process.env.NEXT_PUBLIC_POCKETBASE_URL || "https://pb-musica.blassanto.me"
  );
}

// Función para verificar autenticación en el servidor
export async function getAuthenticatedUser(): Promise<UsersResponse | null> {
  try {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get("pb_auth");

    if (!authCookie) {
      return null;
    }

    const pb = getServerPocketBase();

    // Parsear el token de la cookie
    const authData = JSON.parse(authCookie.value);
    pb.authStore.save(authData.token, authData.model);

    // Verificar si el token es válido
    if (!pb.authStore.isValid) {
      return null;
    }

    // Intentar refrescar el token para verificar validez
    try {
      const authRefresh = await pb.collection("users").authRefresh();
      return authRefresh.record as UsersResponse;
    } catch (error) {
      console.error("Token inválido:", error);
      return null;
    }
  } catch (error) {
    console.error("Error verificando autenticación:", error);
    return null;
  }
}

// Función para verificar si una ruta requiere autenticación
export function requiresAuth(pathname: string): boolean {
  return pathname.startsWith("/admin");
}

// Función para obtener la URL de login
export function getLoginUrl(locale?: string): string {
  const baseUrl = locale ? `/${locale}` : "";
  return `${baseUrl}/admin-login`;
}
