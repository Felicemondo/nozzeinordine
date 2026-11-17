/* Nozze in Ordine: pagina /scadenze-matrimonio. Dalla data del matrimonio: settimane, giorni, fase in corso e data di ogni attività */
(function () {
  var box = document.querySelector("[data-scad]");
  if (!box) return;
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
  function iso(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  var fmt = new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "short", year: "numeric" });
  var today = new Date(); today = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  var soon = addDays(today, 30);
  var inp = document.getElementById("data-si"), msg = document.getElementById("cd-msg");
  inp.min = iso(today);

  function draw(w) {
    var days = Math.round((w - today) / 86400000);
    box.querySelector("[data-weeks]").textContent = String(Math.floor(days / 7));
    box.querySelector("[data-days]").textContent = String(days % 7);
    // fasi: 12, 9, 6, 3 mesi e una settimana prima
    var b = [addMonths(w, -12), addMonths(w, -9), addMonths(w, -6), addMonths(w, -3), addDays(w, -7)], cur = 0;
    while (cur < 5 && today > b[cur]) cur++;
    box.querySelectorAll("[data-phase]").forEach(function (el, i) {
      el.classList.toggle("now", i === cur);
      el.querySelector(".rows__value small").textContent = i < cur ? "Già passata" : i === cur ? "In corso" : "Più avanti";
    });
    document.querySelectorAll("[data-m]").forEach(function (el) {
      var due = addDays(addMonths(w, -+el.getAttribute("data-m")), -+el.getAttribute("data-d"));
      var late = due < today;
      el.querySelector("[data-when]").textContent = fmt.format(due);
      el.querySelector("[data-state]").textContent = late ? "Da recuperare" : due <= soon ? "Entro 30 giorni" : "";
      el.classList.toggle("late", late);
    });
  }
  function upd() {
    var v = parseDay(inp.value);
    if (!v) return;
    if (v <= today) { msg.textContent = "Questa data è già passata: sceglietene una futura."; return; }
    msg.textContent = "";
    draw(v);
    try { history.replaceState(null, "", "?data=" + iso(v)); } catch (e) {}
  }
  inp.addEventListener("change", upd);
  inp.addEventListener("input", upd);
  // link condivisibile: /scadenze-matrimonio?data=2027-06-12
  var q = /[?&]data=(\d{4}-\d{2}-\d{2})/.exec(location.search);
  if (q) { inp.value = q[1]; upd(); }
})();
