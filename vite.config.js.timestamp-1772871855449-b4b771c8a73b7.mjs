// vite.config.js
import { defineConfig } from "file:///C:/Users/okey/Desktop/kinoflow/node_modules/vite/dist/node/index.js";
import vue from "file:///C:/Users/okey/Desktop/kinoflow/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import { fileURLToPath, URL } from "node:url";
var __vite_injected_original_import_meta_url = "file:///C:/Users/okey/Desktop/kinoflow/vite.config.js";
var vite_config_default = defineConfig({
  plugins: [vue()],
  base: "/kinoflow/",
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", __vite_injected_original_import_meta_url))
    }
  },
  server: {
    headers: {
      // Разрешаем embed iframe плееров (Alloha и другие)
      "Content-Security-Policy": [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://telegram.org https://oauth.telegram.org",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: blob: https: http:",
        "connect-src 'self' https: http:",
        // Главное — разрешаем iframe любых https доменов
        "frame-src 'self' https: http:"
      ].join("; ")
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxva2V5XFxcXERlc2t0b3BcXFxca2lub2Zsb3dcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXG9rZXlcXFxcRGVza3RvcFxcXFxraW5vZmxvd1xcXFx2aXRlLmNvbmZpZy5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvb2tleS9EZXNrdG9wL2tpbm9mbG93L3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSdcclxuaW1wb3J0IHZ1ZSBmcm9tICdAdml0ZWpzL3BsdWdpbi12dWUnXHJcbmltcG9ydCB7IGZpbGVVUkxUb1BhdGgsIFVSTCB9IGZyb20gJ25vZGU6dXJsJ1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcclxuICBwbHVnaW5zOiBbdnVlKCldLFxyXG4gIGJhc2U6ICcva2lub2Zsb3cvJyxcclxuICByZXNvbHZlOiB7XHJcbiAgICBhbGlhczoge1xyXG4gICAgICAnQCc6IGZpbGVVUkxUb1BhdGgobmV3IFVSTCgnLi9zcmMnLCBpbXBvcnQubWV0YS51cmwpKVxyXG4gICAgfVxyXG4gIH0sXHJcbiAgc2VydmVyOiB7XHJcbiAgICBoZWFkZXJzOiB7XHJcbiAgICAgIC8vIFx1MDQyMFx1MDQzMFx1MDQzN1x1MDQ0MFx1MDQzNVx1MDQ0OFx1MDQzMFx1MDQzNVx1MDQzQyBlbWJlZCBpZnJhbWUgXHUwNDNGXHUwNDNCXHUwNDM1XHUwNDM1XHUwNDQwXHUwNDNFXHUwNDMyIChBbGxvaGEgXHUwNDM4IFx1MDQzNFx1MDQ0MFx1MDQ0M1x1MDQzM1x1MDQzOFx1MDQzNSlcclxuICAgICAgJ0NvbnRlbnQtU2VjdXJpdHktUG9saWN5JzogW1xyXG4gICAgICAgIFwiZGVmYXVsdC1zcmMgJ3NlbGYnXCIsXHJcbiAgICAgICAgXCJzY3JpcHQtc3JjICdzZWxmJyAndW5zYWZlLWlubGluZScgJ3Vuc2FmZS1ldmFsJyBodHRwczovL3RlbGVncmFtLm9yZyBodHRwczovL29hdXRoLnRlbGVncmFtLm9yZ1wiLFxyXG4gICAgICAgIFwic3R5bGUtc3JjICdzZWxmJyAndW5zYWZlLWlubGluZScgaHR0cHM6Ly9mb250cy5nb29nbGVhcGlzLmNvbVwiLFxyXG4gICAgICAgIFwiZm9udC1zcmMgJ3NlbGYnIGh0dHBzOi8vZm9udHMuZ3N0YXRpYy5jb21cIixcclxuICAgICAgICBcImltZy1zcmMgJ3NlbGYnIGRhdGE6IGJsb2I6IGh0dHBzOiBodHRwOlwiLFxyXG4gICAgICAgIFwiY29ubmVjdC1zcmMgJ3NlbGYnIGh0dHBzOiBodHRwOlwiLFxyXG4gICAgICAgIC8vIFx1MDQxM1x1MDQzQlx1MDQzMFx1MDQzMlx1MDQzRFx1MDQzRVx1MDQzNSBcdTIwMTQgXHUwNDQwXHUwNDMwXHUwNDM3XHUwNDQwXHUwNDM1XHUwNDQ4XHUwNDMwXHUwNDM1XHUwNDNDIGlmcmFtZSBcdTA0M0JcdTA0NEVcdTA0MzFcdTA0NEJcdTA0NDUgaHR0cHMgXHUwNDM0XHUwNDNFXHUwNDNDXHUwNDM1XHUwNDNEXHUwNDNFXHUwNDMyXHJcbiAgICAgICAgXCJmcmFtZS1zcmMgJ3NlbGYnIGh0dHBzOiBodHRwOlwiLFxyXG4gICAgICBdLmpvaW4oJzsgJylcclxuICAgIH1cclxuICB9XHJcbn0pXHJcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBc1IsU0FBUyxvQkFBb0I7QUFDblQsT0FBTyxTQUFTO0FBQ2hCLFNBQVMsZUFBZSxXQUFXO0FBRjBJLElBQU0sMkNBQTJDO0FBSTlOLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVMsQ0FBQyxJQUFJLENBQUM7QUFBQSxFQUNmLE1BQU07QUFBQSxFQUNOLFNBQVM7QUFBQSxJQUNQLE9BQU87QUFBQSxNQUNMLEtBQUssY0FBYyxJQUFJLElBQUksU0FBUyx3Q0FBZSxDQUFDO0FBQUEsSUFDdEQ7QUFBQSxFQUNGO0FBQUEsRUFDQSxRQUFRO0FBQUEsSUFDTixTQUFTO0FBQUE7QUFBQSxNQUVQLDJCQUEyQjtBQUFBLFFBQ3pCO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQTtBQUFBLFFBRUE7QUFBQSxNQUNGLEVBQUUsS0FBSyxJQUFJO0FBQUEsSUFDYjtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
