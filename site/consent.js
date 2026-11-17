/* Nozze in Ordine: consenso ai cookie e strumenti di misura (GA4, Microsoft Clarity, Meta Pixel).
   Gli ID stanno in /tracking.js (generato da build.mjs). Senza ID non succede nulla: niente banner, niente script.
   Regole: nessuno strumento parte prima del consenso; "Rifiuta" è grande quanto "Accetta"; la scelta dura 6 mesi
   e si cambia dal link "Preferenze cookie" nel piè di pagina. GA4 usa Consent Mode v2, negato di partenza. */
(function () {
  var T = window.NIO_TRACKING || {};
  var hasStats = !!(T.ga4 || T.clarity), hasAds = !!T.pixel;
  window.nioTrack = function () {};
  if (!hasStats && !hasAds) return;

  var KEY = "nio-consent-v1", MAX = 182 * 864e5;
  var read = function () { try { var c = JSON.parse(localStorage.getItem(KEY) || "null"); return c && Date.now() - c.t < MAX ? c : null; } catch (e) { return null; } };
  var save = function (stats, ads) { var c = { stats: !!stats, ads: !!ads, t: Date.now() }; try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) {} return c; };
  var add = function (src, attrs) { var s = document.createElement("script"); s.async = true; s.src = src; if (attrs) Object.keys(attrs).forEach(function (k) { s.setAttribute(k, attrs[k]); }); document.head.appendChild(s); };

  // Google: Consent Mode v2, tutto negato finché non c'è una scelta
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  gtag("consent", "default", { ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied", analytics_storage: "denied", wait_for_update: 500 });

  var loaded = {};
  function apply(c) {
    if (T.ga4) gtag("consent", "update", { analytics_storage: c.stats ? "granted" : "denied", ad_storage: c.ads ? "granted" : "denied", ad_user_data: c.ads ? "granted" : "denied", ad_personalization: c.ads ? "granted" : "denied" });
    if (c.stats && T.ga4 && !loaded.ga4) { loaded.ga4 = 1; add("https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(T.ga4)); gtag("js", new Date()); gtag("config", T.ga4, { anonymize_ip: true }); }
    if (c.stats && T.clarity && !loaded.clarity) {
      loaded.clarity = 1;
      window.clarity = window.clarity || function () { (window.clarity.q = window.clarity.q || []).push(arguments); };
      add("https://www.clarity.ms/tag/" + encodeURIComponent(T.clarity));
      window.clarity("consent");
    }
    if (c.ads && T.pixel && !loaded.pixel) {
      loaded.pixel = 1;
      var f = window.fbq = function () { f.callMethod ? f.callMethod.apply(f, arguments) : f.queue.push(arguments); };
      if (!window._fbq) window._fbq = f; f.push = f; f.loaded = true; f.version = "2.0"; f.queue = [];
      add("https://connect.facebook.net/en_US/fbevents.js");
      fbq("init", T.pixel); fbq("track", "PageView");
    }
  }
  // Eventi di conversione (es. registrazione): partono solo verso gli strumenti consentiti
  window.nioTrack = function (name, params) {
    var c = read(); if (!c) return;
    if (c.stats && T.ga4 && window.gtag) gtag("event", name, params || {});
    if (c.ads && T.pixel && window.fbq) fbq("track", name === "sign_up" ? "CompleteRegistration" : name, params || {});
  };

  var css = ".nio-cc{position:fixed;left:16px;right:16px;bottom:16px;z-index:9999;max-width:560px;margin-left:auto;background:#fffdfa;color:#2b2a24;border:1px solid #d8cdbb;border-radius:14px;padding:18px;box-shadow:0 10px 30px rgba(43,42,36,.18);font:15px/1.5 'DM Sans',Arial,sans-serif}" +
    ".nio-cc h2{font:600 16px/1.3 'DM Sans',Arial,sans-serif;margin:0 0 6px}.nio-cc p{margin:0 0 12px;color:#5a5650;font-size:14px}.nio-cc a{color:#386070}" +
    ".nio-cc .r{display:flex;flex-wrap:wrap;gap:8px}.nio-cc button{flex:1 1 140px;min-height:44px;padding:8px 14px;border-radius:2px;font:600 14px 'DM Sans',Arial,sans-serif;cursor:pointer;border:1px solid #a85339;background:#fffdfa;color:#a85339}" +
    ".nio-cc button.p{background:#a85339;color:#fffdfa}.nio-cc button.l{flex:0 0 auto;border:0;background:none;color:#386070;text-decoration:underline;padding:8px 4px}" +
    ".nio-cc label{display:flex;gap:10px;align-items:flex-start;margin:0 0 10px;font-size:14px}.nio-cc label input{margin-top:3px;width:18px;height:18px;accent-color:#a85339}.nio-cc label small{display:block;color:#5a5650}" +
    "@media (max-width:640px){.nio-cc{left:8px;right:8px;bottom:8px;padding:14px}}";

  function banner(prefill) {
    if (document.querySelector(".nio-cc")) return;
    var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
    var box = document.createElement("div"); box.className = "nio-cc"; box.setAttribute("role", "dialog"); box.setAttribute("aria-labelledby", "nio-cc-h");
    var opts = (hasStats ? '<label><input type="checkbox" id="nio-cc-s"' + (prefill && prefill.stats ? " checked" : "") + '><span>Statistiche<small>Capire come viene usato il sito (' + [T.ga4 ? "Google Analytics" : "", T.clarity ? "Microsoft Clarity" : ""].filter(Boolean).join(", ") + ').</small></span></label>' : "") +
      (hasAds ? '<label><input type="checkbox" id="nio-cc-a"' + (prefill && prefill.ads ? " checked" : "") + '><span>Marketing<small>Misurare le campagne su Facebook e Instagram (Meta Pixel).</small></span></label>' : "");
    box.innerHTML = '<h2 id="nio-cc-h">Cookie e misurazioni</h2><p>Usiamo strumenti di terze parti per misurare le visite' + (hasAds ? " e le campagne pubblicitarie" : "") +
      ' solo se acconsenti. I cookie tecnici, necessari al funzionamento, sono sempre attivi. <a href="/cookie">Informativa cookie</a>.</p>' +
      '<div class="nio-cc-o" hidden>' + opts + '</div><div class="r"><button type="button" data-a="no">Rifiuta</button><button type="button" class="p" data-a="yes">Accetta</button><button type="button" class="l" data-a="custom">Scegli</button></div>';
    document.body.appendChild(box);
    var o = box.querySelector(".nio-cc-o");
    if (prefill) { o.hidden = false; box.querySelector('[data-a="custom"]').textContent = "Salva le scelte"; }
    box.addEventListener("click", function (e) {
      var a = e.target.getAttribute && e.target.getAttribute("data-a"); if (!a) return;
      var c;
      if (a === "yes") c = save(true, true);
      else if (a === "no") c = save(false, false);
      else if (o.hidden) { o.hidden = false; e.target.textContent = "Salva le scelte"; return; }
      else { var s = box.querySelector("#nio-cc-s"), d = box.querySelector("#nio-cc-a"); c = save(s && s.checked, d && d.checked); }
      box.remove(); apply(c);
      if (prefill && (prefill.stats && !c.stats || prefill.ads && !c.ads)) location.reload();
    });
    var first = box.querySelector("button"); if (first) first.focus({ preventScroll: true });
  }
  window.nioConsent = function () { banner(read() || { stats: false, ads: false }); };
  document.addEventListener("click", function (e) { var l = e.target.closest && e.target.closest("[data-cookie-prefs]"); if (l) { e.preventDefault(); window.nioConsent(); } });

  var c = read();
  if (c) apply(c);
  else if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { banner(null); });
  else banner(null);
})();
