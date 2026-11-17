/* Nozze in Ordine: calcolo di settimane, giorni e fase in corso sulla data del matrimonio (pagina coppie) */
(function () {
  /* ---------- la data del sì: settimane, giorni e fase in corso, sul giorno scelto ---------- */
  var STATUS = { past: "Già passata", now: "In corso", next: "Da avviare" };
  function addMonths(d, n) {
    var x = new Date(d.getFullYear(), d.getMonth() + n, d.getDate());
    if (x.getDate() !== d.getDate()) x = new Date(d.getFullYear(), d.getMonth() + n + 1, 0);
    return x;
  }
  function addDays(d, n) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); }
  function parseDay(v) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v || "");
    return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
  }
  var today = new Date(); today = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  // Sei fasi (la scheda corta ne mostra cinque: la quinta e la sesta coincidono con "Settimana")
  function phaseIndex(w) {
    var b = [addMonths(w, -12), addMonths(w, -9), addMonths(w, -6), addMonths(w, -3), addDays(w, -7), w];
    var i = 0;
    while (i < 5 && today > b[i]) i++;
    return i;
  }
  function draw(box, w) {
    var days = Math.max(0, Math.round((w - today) / 86400000));
    var wk = box.querySelector("[data-weeks]"), dd = box.querySelector("[data-days]");
    if (wk) wk.textContent = String(Math.floor(days / 7));
    if (dd) dd.textContent = String(days % 7);
    var steps = box.querySelectorAll("[data-step]"), cur = phaseIndex(w);
    if (steps.length === 5 && cur >= 4) cur = 4;
    steps.forEach(function (el, i) {
      var st = i < cur ? "past" : i === cur ? "now" : "next";
      el.classList.toggle("now", st === "now");
      el.classList.toggle("past", st === "past");
      var s = el.querySelector(".rows__value small"); if (s) s.textContent = STATUS[st];
    });
  }
  document.querySelectorAll("[data-wedding]").forEach(function (box) {
    var w = parseDay(box.getAttribute("data-wedding"));
    var inp = box.querySelector("#data-si"), msg = box.querySelector("#cd-msg");
    if (inp) {
      inp.min = today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, "0") + "-" + String(today.getDate()).padStart(2, "0");
      var upd = function () {
        var v = parseDay(inp.value);
        if (!v) return;
        if (v < today) { msg.textContent = "Questa data è già passata: scegline una futura."; return; }
        msg.textContent = "";
        draw(box, v);
      };
      inp.addEventListener("input", upd); inp.addEventListener("change", upd);
    }
    if (w) draw(box, w);
  });

})();
