# Modello di budget del matrimonio (Nozze in Ordine): stesse voci della dashboard, nessuna cifra precompilata.
# Uso: python3 tools/budget-xlsx.py site/download/budget-matrimonio.xlsx   (serve openpyxl). Le voci CATS sono quelle di site/app/ui.js.
import sys
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.formatting.rule import FormulaRule

out = sys.argv[1]
INK, BORD, TERRA, LINE, SOFT, CREAM = "25241F", "702F43", "9B4A32", "D9D2C5", "F5F0E7", "FBF8F2"
EUR = '#,##0.00 "€";-#,##0.00 "€";"–"'
DATE = "DD/MM/YYYY"
thin = Side(style="thin", color=LINE)
F = "DM Sans"

def font(**k):
    return Font(name=F, color=k.pop("color", INK), **k)

CATS = ["Location e ricevimento", "Catering", "Fotografo e video", "Abiti e accessori", "Fiori e allestimenti",
        "Musica e intrattenimento", "Partecipazioni e stampa", "Bomboniere", "Trasporti", "Rito e documenti",
        "Viaggio di nozze", "Altre spese"]
EXTRA = 8  # righe libere

wb = Workbook()
ws = wb.active
ws.title = "Budget"
ws.sheet_view.showGridLines = False
widths = {"A": 28, "B": 22, "C": 14, "D": 16, "E": 13, "F": 14, "G": 14, "H": 14, "I": 14, "J": 32}
for c, w in widths.items():
    ws.column_dimensions[c].width = w

ws["A1"] = "Budget del matrimonio"
ws["A1"].font = Font(name="DM Serif Display", size=22, color=BORD)
ws["A2"] = "Scrivete le cifre nelle celle bianche: totali e cifre da pagare si calcolano da soli. Modello gratuito di nozzeinordine.com"
ws["A2"].font = font(size=10, color="6B675E")

# riepilogo
first, last = 10, 10 + len(CATS) + EXTRA - 1
summary = [
    ("Budget complessivo", None, "Quanto volete spendere in tutto"),
    ("Totale previsto", f"=SUMPRODUCT((D{first}:D{last}>0)*D{first}:D{last}+(D{first}:D{last}=0)*C{first}:C{last})", "Preventivo scelto, o la cifra prevista se non c'è ancora"),
    ("Margine", "=IF(B4=\"\",\"\",B4-B5)", "Budget meno totale previsto: se è negativo state sforando"),
    ("Già pagato", f"=SUM(H{first}:H{last})", ""),
    ("Da pagare", f"=SUM(I{first}:I{last})", ""),
]
for i, (label, formula, note) in enumerate(summary):
    r = 4 + i
    ws.cell(r, 1, label).font = font(bold=True)
    c = ws.cell(r, 2, formula)
    c.number_format = EUR
    c.font = font(bold=True, color=BORD if i == 0 else INK)
    c.border = Border(bottom=thin)
    if i == 0:
        c.fill = PatternFill("solid", fgColor="FFFFFF")
        c.border = Border(top=thin, bottom=thin, left=thin, right=thin)
    else:
        c.fill = PatternFill("solid", fgColor=SOFT)
    ws.cell(r, 3, note).font = font(size=9, color="6B675E")
ws.conditional_formatting.add("B6", FormulaRule(formula=["AND(ISNUMBER(B6),B6<0)"], font=Font(name=F, bold=True, color=TERRA)))

# tabella delle voci
heads = ["Voce", "Fornitore", "Previsto", "Preventivo scelto", "Acconto", "Acconto entro", "Saldo entro", "Già pagato", "Da pagare", "Note"]
hr = first - 1
for j, h in enumerate(heads, 1):
    c = ws.cell(hr, j, h)
    c.font = font(bold=True, color="FFFFFF", size=10)
    c.fill = PatternFill("solid", fgColor=BORD)
    c.alignment = Alignment(vertical="center", wrap_text=True)
ws.row_dimensions[hr].height = 30

rows = CATS + [""] * EXTRA
for i, name in enumerate(rows):
    r = first + i
    ws.cell(r, 1, name or None)
    ws.cell(r, 9, f'=IF(AND(C{r}="",D{r}=""),"",MAX(0,IF(D{r}>0,D{r},C{r}+0)-(H{r}+0)))')
    for j in range(1, 11):
        c = ws.cell(r, j)
        c.font = font(size=10, bold=(j == 1))
        c.border = Border(bottom=thin)
        c.alignment = Alignment(vertical="center")
        if j in (3, 4, 5, 8, 9):
            c.number_format = EUR
        if j in (6, 7):
            c.number_format = DATE
        if j == 9:
            c.fill = PatternFill("solid", fgColor=SOFT)
    ws.row_dimensions[r].height = 22

tr = last + 1
ws.cell(tr, 1, "Totale").font = font(bold=True)
for j, col in ((3, "C"), (4, "D"), (5, "E"), (8, "H"), (9, "I")):
    c = ws.cell(tr, j, f"=SUM({col}{first}:{col}{last})")
    c.number_format = EUR
    c.font = font(bold=True)
for j in range(1, 11):
    ws.cell(tr, j).border = Border(top=Side(style="medium", color=BORD))

# scadenze vicine o passate in evidenza (acconto/saldo non ancora coperti)
for col in ("F", "G"):
    rng = f"{col}{first}:{col}{last}"
    ws.conditional_formatting.add(rng, FormulaRule(formula=[f'AND(ISNUMBER({col}{first}),{col}{first}<TODAY(),I{first}>0)'], font=Font(name=F, bold=True, color=TERRA)))

dv = DataValidation(type="decimal", operator="greaterThanOrEqual", formula1="0", allow_blank=True,
                    error="Scrivete una cifra in euro, senza testo.", errorTitle="Solo numeri")
ws.add_data_validation(dv)
for col in "CDEH":
    dv.add(f"{col}{first}:{col}{last}")
dv.add("B4")
dvd = DataValidation(type="date", operator="greaterThan", formula1="36526", allow_blank=True,
                     error="Scrivete una data, per esempio 15/03/2027.", errorTitle="Solo date")
ws.add_data_validation(dvd)
dvd.add(f"F{first}:G{last}")

ws.freeze_panes = ws.cell(first, 2)
ws.print_options.horizontalCentered = True
ws.page_setup.orientation = "landscape"
ws.page_setup.fitToWidth = 1
ws.sheet_properties.pageSetUpPr.fitToPage = True

# foglio 2: costi a persona (catering, bomboniere, menù bambini)
pp = wb.create_sheet("Costi a persona")
pp.sheet_view.showGridLines = False
for c, w in {"A": 28, "B": 16, "C": 12, "D": 16, "E": 12, "F": 16}.items():
    pp.column_dimensions[c].width = w
pp["A1"] = "Costi a persona"
pp["A1"].font = Font(name="DM Serif Display", size=22, color=BORD)
pp["A2"] = "Per le voci pagate a persona: il totale si aggiorna quando cambia il numero degli invitati. Riportatelo poi nel foglio Budget."
pp["A2"].font = font(size=10, color="6B675E")
ph = ["Voce", "Costo adulto", "Adulti", "Costo bambino", "Bambini", "Totale"]
for j, h in enumerate(ph, 1):
    c = pp.cell(4, j, h)
    c.font = font(bold=True, color="FFFFFF", size=10)
    c.fill = PatternFill("solid", fgColor=BORD)
for i, name in enumerate(["Catering", "Bomboniere", "Torta", "", "", ""]):
    r = 5 + i
    pp.cell(r, 1, name or None)
    pp.cell(r, 6, f'=IF(AND(B{r}="",D{r}=""),"",(B{r}+0)*(C{r}+0)+(D{r}+0)*(E{r}+0))')
    for j in range(1, 7):
        c = pp.cell(r, j)
        c.font = font(size=10, bold=(j == 1))
        c.border = Border(bottom=thin)
        if j in (2, 4, 6):
            c.number_format = EUR
        if j == 6:
            c.fill = PatternFill("solid", fgColor=SOFT)
    pp.row_dimensions[r].height = 22

wb.properties.title = "Budget del matrimonio"
wb.properties.creator = "Nozze in Ordine"
wb.save(out)
print("ok", out)
