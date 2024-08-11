/// <reference types="astro/client" />
declare namespace App {
  interface Locals extends Record<string, any> {
    user: import('./server/services/user').User
  }
}
