import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Listens for Capacitor deep links (e.g. eloquencee://listen)
 * and routes inside the SPA. No-op on web (Capacitor not installed).
 */
export function DeepLinkHandler() {
  const navigate = useNavigate();

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    (async () => {
      try {
        // Dynamic import — Capacitor may not be available on web
        const mod = await import("@capacitor/app").catch(() => null);
        if (!mod) return;
        const { App } = mod;

        const routeFromUrl = (rawUrl?: string | null) => {
          if (!rawUrl) return;
          try {
            const url = new URL(rawUrl);
            const target = url.host || url.pathname.replace(/^\/+/, "");
            if (target === "listen") {
              navigate("/listen");
            }
          } catch (e) {
            console.warn("Bad deep link", rawUrl, e);
          }
        };

        const launch = await App.getLaunchUrl().catch(() => null);
        routeFromUrl(launch?.url);

        const handler = App.addListener("appUrlOpen", (event: { url: string }) => {
          routeFromUrl(event.url);
        });

        cleanup = () => {
          // listener handle is a Promise<PluginListenerHandle>
          Promise.resolve(handler).then((h) => h?.remove?.());
        };
      } catch (e) {
        console.warn("Capacitor App plugin unavailable", e);
      }
    })();

    return () => cleanup?.();
  }, [navigate]);

  return null;
}
