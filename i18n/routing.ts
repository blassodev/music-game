import { defineRouting } from "next-intl/routing";
import { createNavigation } from "next-intl/navigation";

export const routing = defineRouting({
  // Una lista de todos los idiomas soportados
  locales: ["en", "es"],

  // Usado cuando no hay coincidencia de idioma
  defaultLocale: "es",

  // El prefijo para las rutas localizadas
  pathnames: {
    "/": "/",
    "/admin": "/admin",
    "/player": "/player",
  },
});

// Funciones de navegación ligeras
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
