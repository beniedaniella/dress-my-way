/** Enregistre le service worker uniquement sur l'app publiée (jamais en aperçu). */
export function registerSW() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  const h = window.location.hostname.toLowerCase();
  const first = h.split(".")[0] ?? "";
  const lovableHost = /\.(lovable\.app|gpt-eng\.com|gptengineer\.run)$/.test(h);
  const refused =
    !import.meta.env.PROD ||
    window.self !== window.top ||
    (lovableHost && /^(?:id-preview|preview)(?:-[a-z0-9]+)?--.+$/.test(first)) ||
    (lovableHost && /^project--.+-dev$/.test(first)) ||
    /(^|\.)lovableproject(-dev)?\.com$/.test(h) ||
    /(^|\.)beta\.lovable\.dev$/.test(h) ||
    new URLSearchParams(window.location.search).get("sw") === "off";
  if (refused) {
    void navigator.serviceWorker.getRegistrations().then((rs) =>
      rs.forEach((r) => { if (r.active?.scriptURL.endsWith("/sw.js")) void r.unregister(); }));
    return;
  }
  void navigator.serviceWorker.register("/sw.js", { scope: "/" });
}
