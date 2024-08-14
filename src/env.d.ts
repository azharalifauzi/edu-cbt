/// <reference types="astro/client" />
/// <reference types="vite-plugin-svgr/client" />

declare namespace App {
  interface Locals extends Record<string, any> {
    user: import('./server/services/user').User
  }
}
