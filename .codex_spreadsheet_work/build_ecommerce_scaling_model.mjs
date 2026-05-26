import fs from "node:fs/promises";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const outputDir = "C:/Users/eagle/OneDrive/E-Com/RoadMap/outputs/ecommerce_scaling_model";
const outputPath = `${outputDir}/E-Commerce Scaling Roadmap - Meta CPA Scenarios.xlsx`;

const wb = Workbook.create();

const sheets = {
  dashboard: wb.worksheets.add("Dashboard"),
  inputs: wb.worksheets.add("Inputs"),
  cost: wb.worksheets.add("Cost Builder"),
  roadmap: wb.worksheets.add("Roadmap"),
  matrix: wb.worksheets.add("Scenario Matrix"),
  checks: wb.worksheets.add("Checks"),
  sources: wb.worksheets.add("Sources"),
};

const palette = {
  navy: "#17324D",
  teal: "#0F766E",
  green: "#15803D",
  amber: "#D97706",
  red: "#B91C1C",
  slate: "#334155",
  lightBlue: "#E8F3FF",
  lightTeal: "#E6F7F4",
  lightGreen: "#EAF7EA",
  lightAmber: "#FFF4DA",
  lightRed: "#FDECEC",
  soft: "#F6F8FB",
  white: "#FFFFFF",
  border: "#CBD5E1",
  inputFill: "#FFF2CC",
  inputBlue: "#0000FF",
  formulaBlack: "#000000",
  linkGreen: "#008000",
};

const fmt = (sheet, range, format) => {
  sheet.getRange(range).format = format;
};
const nf = (sheet, range, format) => {
  sheet.getRange(range).format.numberFormat = format;
};
const setCol = (sheet, col, px) => {
  sheet.getRange(`${col}1:${col}80`).format.columnWidthPx = px;
};
const colLetter = (index) => {
  let n = index;
  let out = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    out = String.fromCharCode(65 + rem) + out;
    n = Math.floor((n - 1) / 26);
  }
  return out;
};
const titleBand = (sheet, range, title, subtitle = "") => {
  const r = sheet.getRange(range);
  r.merge();
  r.values = [[subtitle ? `${title}\n${subtitle}` : title]];
  r.format = {
    fill: palette.navy,
    font: { bold: true, color: palette.white, size: 16 },
    horizontalAlignment: "center",
    verticalAlignment: "center",
    wrapText: true,
  };
  r.format.rowHeightPx = subtitle ? 58 : 38;
};
const section = (sheet, range, label, fill = palette.teal) => {
  const r = sheet.getRange(range);
  r.merge();
  r.values = [[label]];
  r.format = {
    fill,
    font: { bold: true, color: palette.white, size: 11 },
    horizontalAlignment: "left",
    verticalAlignment: "center",
  };
};
const header = (sheet, range, fill = palette.slate) => {
  fmt(sheet, range, {
    fill,
    font: { bold: true, color: palette.white },
    horizontalAlignment: "center",
    verticalAlignment: "center",
    wrapText: true,
    borders: {
      top: { style: "thin", color: palette.border },
      bottom: { style: "thin", color: palette.border },
      left: { style: "thin", color: palette.border },
      right: { style: "thin", color: palette.border },
    },
  });
};
const body = (sheet, range, fill = palette.white) => {
  fmt(sheet, range, {
    fill,
    font: { color: palette.formulaBlack },
    verticalAlignment: "center",
    borders: {
      top: { style: "thin", color: palette.border },
      bottom: { style: "thin", color: palette.border },
      left: { style: "thin", color: palette.border },
      right: { style: "thin", color: palette.border },
    },
  });
};
const inputStyle = (sheet, range) => {
  fmt(sheet, range, {
    fill: palette.inputFill,
    font: { bold: true, color: palette.inputBlue },
    horizontalAlignment: "right",
    verticalAlignment: "center",
    borders: {
      top: { style: "thin", color: palette.border },
      bottom: { style: "thin", color: palette.border },
      left: { style: "thin", color: palette.border },
      right: { style: "thin", color: palette.border },
    },
  });
};
const formulaStyle = (sheet, range) => {
  fmt(sheet, range, {
    fill: palette.white,
    font: { color: palette.formulaBlack },
    horizontalAlignment: "right",
    verticalAlignment: "center",
    borders: {
      top: { style: "thin", color: palette.border },
      bottom: { style: "thin", color: palette.border },
      left: { style: "thin", color: palette.border },
      right: { style: "thin", color: palette.border },
    },
  });
};
const linkStyle = (sheet, range) => {
  fmt(sheet, range, {
    fill: palette.white,
    font: { color: palette.linkGreen },
    horizontalAlignment: "right",
    verticalAlignment: "center",
    borders: {
      top: { style: "thin", color: palette.border },
      bottom: { style: "thin", color: palette.border },
      left: { style: "thin", color: palette.border },
      right: { style: "thin", color: palette.border },
    },
  });
};

const moneyFmt = '"฿"#,##0;[Red]("฿"#,##0);-';
const money1Fmt = '"฿"#,##0.0;[Red]("฿"#,##0.0);-';
const pctFmt = "0.0%;[Red](0.0%);-";
const countFmt = "#,##0;[Red](#,##0);-";
const oneDecFmt = "#,##0.0;[Red](#,##0.0);-";
const roasFmt = "0.00x;[Red](0.00x);-";

for (const sheet of Object.values(sheets)) {
  sheet.showGridLines = false;
}

// ---------------- Inputs ----------------
{
  const sh = sheets.inputs;
  titleBand(sh, "A1:H2", "E-Commerce Scaling Roadmap", "Editable assumptions for Chinese sourcing, branding, and Meta Ads CPA scenarios");
  section(sh, "A4:H4", "1) Product and Sales Setup");
  sh.getRange("A5:C13").values = [
    ["Input", "Value", "Notes"],
    ["Product / Brand name", "Sample Product", "Change to your actual product name"],
    ["Selling price / unit", 790, "Target product price in THB"],
    ["Month 1 order units", 100, "Starting inventory volume"],
    ["Forecast months", 12, "Model is built for 12 months"],
    ["Sell-through rate", 1, "Share of ordered units sold each month"],
    ["Refund / return rate", 0.03, "Revenue leakage from returns/refunds"],
    ["Monthly fixed overhead", 0, "Tools, staff, agency, samples, warehouse, etc."],
    ["Max monthly order growth", 0.5, "Operational cap so reinvestment scaling stays realistic"],
  ];
  header(sh, "A5:C5", palette.slate);
  body(sh, "A6:A13", palette.soft);
  inputStyle(sh, "B6:B13");
  body(sh, "C6:C13", palette.white);
  nf(sh, "B7", moneyFmt);
  nf(sh, "B8:B9", countFmt);
  nf(sh, "B10:B11", pctFmt);
  nf(sh, "B12", moneyFmt);
  nf(sh, "B13", pctFmt);

  section(sh, "A14:C14", "2) Variable Cost per Unit Before Ads");
  sh.getRange("A15:C25").values = [
    ["Input", "Value", "Notes"],
    ["Landed product cost / unit", 160, "Factory cost + China shipping + import duty + local freight to you"],
    ["Packaging / unit", 12, "Box, pouch, insert, label, tape"],
    ["Fulfillment / unit", 25, "Pick, pack, warehouse handling"],
    ["Shipping to customer / unit", 45, "Last-mile delivery paid by seller"],
    ["Affiliate commission / unit", 0, "Use 0 if none"],
    ["Payment / platform fixed fee / unit", 15, "COD/payment/marketplace fixed fee"],
    ["Payment / platform fee % of price", 0.032, "Percentage fee applied to selling price"],
    ["Other variable cost / unit", 10, "Samples, warranty reserve, inserts, extra fee"],
    ["Total variable cost before ads", null, "Formula"],
    ["Gross profit before ads / unit", null, "Formula"],
  ];
  header(sh, "A15:C15", palette.slate);
  body(sh, "A16:A25", palette.soft);
  inputStyle(sh, "B16:B23");
  formulaStyle(sh, "B24:B25");
  sh.getRange("B24").formulas = [["=SUM(B16:B21)+B7*B22+B23"]];
  sh.getRange("B25").formulas = [["=B7-B24"]];
  body(sh, "C16:C25", palette.white);
  nf(sh, "B16:B21", moneyFmt);
  nf(sh, "B22", pctFmt);
  nf(sh, "B23:B25", moneyFmt);

  section(sh, "E5:H5", "Model Color Key", palette.navy);
  sh.getRange("E6:H9").values = [
    ["Cell type", "Meaning", "Example", "Action"],
    ["Yellow + blue text", "Editable assumption", "Price/cost/CPA", "Change these"],
    ["Black text", "Formula output", "Profit, ROAS, MER", "Do not overwrite unless needed"],
    ["Green text", "Linked output", "Dashboard refs", "Trace back to source tab"],
  ];
  header(sh, "E6:H6", palette.slate);
  body(sh, "E7:H9", palette.white);
  fmt(sh, "G7", { fill: palette.inputFill, font: { bold: true, color: palette.inputBlue } });
  fmt(sh, "G8", { fill: palette.white, font: { color: palette.formulaBlack } });
  fmt(sh, "G9", { fill: palette.white, font: { color: palette.linkGreen } });

  section(sh, "E11:H11", "3) CPA and Reinvestment Scenarios");
  sh.getRange("E12:H16").values = [
    ["Scenario", "CPA % of price", "CPA / purchase", "Profit reinvested into new inventory"],
    ["Bad CPA", 0.42, null, 0.3],
    ["Base CPA", 0.32, null, 0.5],
    ["Good CPA", 0.22, null, 0.7],
    ["Break-even CPA", null, null, "CPA <= gross profit before ads"],
  ];
  header(sh, "E12:H12", palette.slate);
  sh.getRange("E12:H12").format.rowHeightPx = 38;
  body(sh, "E13:E16", palette.soft);
  inputStyle(sh, "F13:F15");
  inputStyle(sh, "H13:H15");
  formulaStyle(sh, "G13:G16");
  formulaStyle(sh, "F16");
  sh.getRange("G13").formulas = [["=ROUND($B$7*F13,0)"]];
  sh.getRange("G13:G15").fillDown();
  sh.getRange("F16").formulas = [["=$B$25/$B$7"]];
  sh.getRange("G16").formulas = [["=$B$25"]];
  body(sh, "H16", palette.white);
  nf(sh, "F13:F16", pctFmt);
  nf(sh, "G13:G16", moneyFmt);
  nf(sh, "H13:H15", pctFmt);

  section(sh, "E18:H18", "4) Price-Tier CPA Guide");
  sh.getRange("E19:H22").values = [
    ["Price tier", "Good CPA", "Base CPA", "Bad CPA / danger zone"],
    ["600-900 THB", "120-220", "220-320", "350+"],
    ["900-1,300 THB", "180-330", "330-480", "500-600+"],
    ["Formula used here", "Price x 22%", "Price x 32%", "Price x 42%"],
  ];
  header(sh, "E19:H19", palette.slate);
  body(sh, "E20:H22", palette.white);

  section(sh, "A27:H27", "5) Scenario Table Used by the Model");
  sh.getRange("A28:H32").values = [
    ["Scenario", "CPA %", "CPA", "Reinvest %", "Net profit / unit", "ROAS", "MER", "CPA cushion vs break-even"],
    ["Bad CPA", null, null, null, null, null, null, null],
    ["Base CPA", null, null, null, null, null, null, null],
    ["Good CPA", null, null, null, null, null, null, null],
    ["Break-even", null, null, null, null, null, null, null],
  ];
  header(sh, "A28:H28", palette.navy);
  sh.getRange("A28:H28").format.rowHeightPx = 34;
  body(sh, "A29:A32", palette.soft);
  formulaStyle(sh, "B29:H32");
  sh.getRange("B29:H32").formulas = [
    ["=F13", "=G13", "=H13", "=$B$25-C29", "=$B$7/C29", "=C29/$B$7", "=$B$25-C29"],
    ["=F14", "=G14", "=H14", "=$B$25-C30", "=$B$7/C30", "=C30/$B$7", "=$B$25-C30"],
    ["=F15", "=G15", "=H15", "=$B$25-C31", "=$B$7/C31", "=C31/$B$7", "=$B$25-C31"],
    ["=F16", "=G16", "", "=$B$25-C32", "=$B$7/C32", "=C32/$B$7", "=$B$25-C32"],
  ];
  nf(sh, "B29:B32", pctFmt);
  nf(sh, "C29:C32", moneyFmt);
  nf(sh, "D29:D32", pctFmt);
  nf(sh, "E29:E32", moneyFmt);
  nf(sh, "F29:F32", roasFmt);
  nf(sh, "G29:G32", pctFmt);
  nf(sh, "H29:H32", moneyFmt);

  sh.freezePanes.freezeRows(5);
  ["A", "B", "C", "D", "E", "F", "G", "H"].forEach((col, i) => setCol(sh, col, [210, 190, 430, 110, 205, 135, 150, 235][i]));
}

// ---------------- Cost Builder ----------------
{
  const sh = sheets.cost;
  titleBand(sh, "A1:H2", "Unit Economics and Break-Even Math", "Per-unit profit model adapted from the source workbook logic");
  section(sh, "A4:H4", "Core Unit Economics");
  sh.getRange("A5:H13").values = [
    ["Metric", "Formula / Link", "Value", "Notes", "Bad CPA", "Base CPA", "Good CPA", "Break-even"],
    ["Selling price", "Inputs!B7", null, "Revenue per unit", null, null, null, null],
    ["Variable cost before ads", "Inputs!B24", null, "Landed cost + ops + payment/platform fees", null, null, null, null],
    ["Gross profit before ads", "Inputs!B25", null, "Maximum CPA before fixed overhead", null, null, null, null],
    ["COGS % before ads", "Inputs!B24 / Inputs!B7", null, "Variable cost share of price", null, null, null, null],
    ["Break-even ROAS", "Price / gross profit before ads", null, "ROAS below this loses money", null, null, null, null],
    ["Break-even CPA", "Gross profit before ads", null, "CPA threshold before fixed overhead", null, null, null, null],
    ["Monthly fixed overhead", "Inputs!B12", null, "Allocated after unit economics", null, null, null, null],
    ["Month 1 startup product cash", "Initial units x landed cost", null, "Inventory cash needed before ad spend", null, null, null, null],
  ];
  header(sh, "A5:H5", palette.navy);
  body(sh, "A6:B13", palette.soft);
  linkStyle(sh, "C6:C13");
  formulaStyle(sh, "E6:H13");
  sh.getRange("C6:C13").formulas = [
    ["=Inputs!B7"],
    ["=Inputs!B24"],
    ["=Inputs!B25"],
    ["=Inputs!B24/Inputs!B7"],
    ["=Inputs!B7/Inputs!B25"],
    ["=Inputs!B25"],
    ["=Inputs!B12"],
    ["=Inputs!B8*Inputs!B16"],
  ];
  sh.getRange("E6:H13").formulas = [
    ["=Inputs!C29", "=Inputs!C30", "=Inputs!C31", "=Inputs!C32"],
    ["=Inputs!B24", "=Inputs!B24", "=Inputs!B24", "=Inputs!B24"],
    ["=Inputs!B7-Inputs!B24-E6", "=Inputs!B7-Inputs!B24-F6", "=Inputs!B7-Inputs!B24-G6", "=Inputs!B7-Inputs!B24-H6"],
    ["=Inputs!B24/Inputs!B7", "=Inputs!B24/Inputs!B7", "=Inputs!B24/Inputs!B7", "=Inputs!B24/Inputs!B7"],
    ["=Inputs!B7/E6", "=Inputs!B7/F6", "=Inputs!B7/G6", "=Inputs!B7/H6"],
    ["=Inputs!B25-E6", "=Inputs!B25-F6", "=Inputs!B25-G6", "=Inputs!B25-H6"],
    ["=Inputs!B12", "=Inputs!B12", "=Inputs!B12", "=Inputs!B12"],
    ["=Inputs!B8*Inputs!B16", "=Inputs!B8*Inputs!B16", "=Inputs!B8*Inputs!B16", "=Inputs!B8*Inputs!B16"],
  ];
  nf(sh, "C6:C8", moneyFmt);
  nf(sh, "C9", pctFmt);
  nf(sh, "C10", roasFmt);
  nf(sh, "C11:C13", moneyFmt);
  nf(sh, "E6:H8", moneyFmt);
  nf(sh, "E9:H9", pctFmt);
  nf(sh, "E10:H10", roasFmt);
  nf(sh, "E11:H13", moneyFmt);

  section(sh, "A16:H16", "Contribution Margin by Scenario");
  sh.getRange("A17:H21").values = [
    ["Scenario", "Price", "Cost before ads", "CPA", "Net profit / unit", "Net margin", "ROAS", "MER"],
    ["Bad CPA", null, null, null, null, null, null, null],
    ["Base CPA", null, null, null, null, null, null, null],
    ["Good CPA", null, null, null, null, null, null, null],
    ["Break-even", null, null, null, null, null, null, null],
  ];
  header(sh, "A17:H17", palette.slate);
  body(sh, "A18:A21", palette.soft);
  formulaStyle(sh, "B18:H21");
  sh.getRange("B18:H21").formulas = [
    ["=Inputs!B7", "=Inputs!B24", "=Inputs!C29", "=B18-C18-D18", "=E18/B18", "=B18/D18", "=D18/B18"],
    ["=Inputs!B7", "=Inputs!B24", "=Inputs!C30", "=B19-C19-D19", "=E19/B19", "=B19/D19", "=D19/B19"],
    ["=Inputs!B7", "=Inputs!B24", "=Inputs!C31", "=B20-C20-D20", "=E20/B20", "=B20/D20", "=D20/B20"],
    ["=Inputs!B7", "=Inputs!B24", "=Inputs!C32", "=B21-C21-D21", "=E21/B21", "=B21/D21", "=D21/B21"],
  ];
  nf(sh, "B18:E21", moneyFmt);
  nf(sh, "F18:F21", pctFmt);
  nf(sh, "G18:G21", roasFmt);
  nf(sh, "H18:H21", pctFmt);

  sh.getRange("J4:M8").values = [
    ["Quick Interpretation", "", "", ""],
    ["If Net profit / unit is positive", "You can scale, then watch cash conversion and stock lead time", "", ""],
    ["If CPA cushion is small", "Scale slowly or raise price / bundle / lower variable costs", "", ""],
    ["If ROAS is above break-even", "Campaign can be profitable before fixed overhead", "", ""],
    ["If MER is too high", "Ads are consuming too much revenue", "", ""],
  ];
  sh.getRange("J4:M4").merge();
  fmt(sh, "J4:M4", { fill: palette.navy, font: { bold: true, color: palette.white }, horizontalAlignment: "center" });
  body(sh, "J5:M8", palette.lightBlue);

  sh.freezePanes.freezeRows(5);
  ["A", "B", "C", "D", "E", "F", "G", "H", "J", "K", "L", "M"].forEach((col, i) => setCol(sh, col, [230, 150, 145, 135, 145, 120, 100, 100, 190, 270, 60, 60][i]));
}

// ---------------- Roadmap ----------------
{
  const sh = sheets.roadmap;
  titleBand(sh, "A1:M2", "12-Month Scaling Roadmap", "Each scenario starts with Month 1 inventory, then reinvests a % of monthly profit into more stock for the next month");
  const months = Array.from({ length: 12 }, (_, i) => `M${i + 1}`);

  const blocks = [
    { name: "Bad CPA", start: 4, cpaRow: 29, fill: palette.lightRed, accent: palette.red },
    { name: "Base CPA", start: 23, cpaRow: 30, fill: palette.lightBlue, accent: palette.navy },
    { name: "Good CPA", start: 42, cpaRow: 31, fill: palette.lightGreen, accent: palette.green },
  ];

  for (const block of blocks) {
    section(sh, `A${block.start}:M${block.start}`, `${block.name} Scenario`, block.accent);
    sh.getRange(`A${block.start + 1}:M${block.start + 17}`).values = [
      ["Metric", ...months],
      ["Order units", ...Array(12).fill(null)],
      ["Units sold", ...Array(12).fill(null)],
      ["Net revenue", ...Array(12).fill(null)],
      ["Variable cost before ads", ...Array(12).fill(null)],
      ["Meta ad spend", ...Array(12).fill(null)],
      ["Fixed overhead", ...Array(12).fill(null)],
      ["Net profit", ...Array(12).fill(null)],
      ["Cash kept", ...Array(12).fill(null)],
      ["Profit reinvested", ...Array(12).fill(null)],
      ["Added units next month", ...Array(12).fill(null)],
      ["Cumulative net profit", ...Array(12).fill(null)],
      ["ROAS", ...Array(12).fill(null)],
      ["MER", ...Array(12).fill(null)],
      ["CPA cushion / unit", ...Array(12).fill(null)],
      ["Scenario status", ...Array(12).fill(null)],
      ["Reinvest %", ...Array(12).fill(null)],
    ];
    header(sh, `A${block.start + 1}:M${block.start + 1}`, block.accent);
    body(sh, `A${block.start + 2}:A${block.start + 17}`, block.fill);
    formulaStyle(sh, `B${block.start + 2}:M${block.start + 17}`);

    const r = block.start;
    const order = r + 2;
    const sold = r + 3;
    const revenue = r + 4;
    const varCost = r + 5;
    const adSpend = r + 6;
    const fixed = r + 7;
    const profit = r + 8;
    const cashKept = r + 9;
    const reinvested = r + 10;
    const addedUnits = r + 11;
    const cumProfit = r + 12;
    const roas = r + 13;
    const mer = r + 14;
    const cushion = r + 15;
    const status = r + 16;
    const reinvestPct = r + 17;
    const cpaRef = `Inputs!$C$${block.cpaRow}`;
    const reinvestRef = `Inputs!$D$${block.cpaRow}`;

    for (let col = 2; col <= 13; col++) {
      const letter = String.fromCharCode(64 + col);
      const prev = String.fromCharCode(63 + col);
      const isFirst = col === 2;
      sh.getRange(`${letter}${order}`).formulas = [[isFirst ? "=Inputs!$B$8" : `=MIN(FLOOR(${prev}${order}*(1+Inputs!$B$13),1),${prev}${order}+${prev}${addedUnits})`]];
      sh.getRange(`${letter}${sold}`).formulas = [[`=${letter}${order}*Inputs!$B$10`]];
      sh.getRange(`${letter}${revenue}`).formulas = [[`=${letter}${sold}*Inputs!$B$7*(1-Inputs!$B$11)`]];
      sh.getRange(`${letter}${varCost}`).formulas = [[`=${letter}${sold}*Inputs!$B$24`]];
      sh.getRange(`${letter}${adSpend}`).formulas = [[`=${letter}${sold}*${cpaRef}`]];
      sh.getRange(`${letter}${fixed}`).formulas = [["=Inputs!$B$12"]];
      sh.getRange(`${letter}${profit}`).formulas = [[`=${letter}${revenue}-${letter}${varCost}-${letter}${adSpend}-${letter}${fixed}`]];
      sh.getRange(`${letter}${cashKept}`).formulas = [[`=MAX(0,${letter}${profit}*(1-${reinvestRef}))`]];
      sh.getRange(`${letter}${reinvested}`).formulas = [[`=MAX(0,${letter}${profit}*${reinvestRef})`]];
      sh.getRange(`${letter}${addedUnits}`).formulas = [[`=FLOOR(${letter}${reinvested}/Inputs!$B$16,1)`]];
      sh.getRange(`${letter}${cumProfit}`).formulas = [[isFirst ? `=${letter}${profit}` : `=${prev}${cumProfit}+${letter}${profit}`]];
      sh.getRange(`${letter}${roas}`).formulas = [[`=${letter}${revenue}/${letter}${adSpend}`]];
      sh.getRange(`${letter}${mer}`).formulas = [[`=${letter}${adSpend}/${letter}${revenue}`]];
      sh.getRange(`${letter}${cushion}`).formulas = [[`=Inputs!$B$25-${cpaRef}`]];
      sh.getRange(`${letter}${status}`).formulas = [[`=IF(${letter}${profit}>0,"Profitable","Loss / review")`]];
      sh.getRange(`${letter}${reinvestPct}`).formulas = [[`=${reinvestRef}`]];
    }
    nf(sh, `B${order}:M${sold}`, countFmt);
    nf(sh, `B${revenue}:M${reinvested}`, moneyFmt);
    nf(sh, `B${addedUnits}:M${addedUnits}`, countFmt);
    nf(sh, `B${cumProfit}:M${cumProfit}`, moneyFmt);
    nf(sh, `B${roas}:M${roas}`, roasFmt);
    nf(sh, `B${mer}:M${mer}`, pctFmt);
    nf(sh, `B${cushion}:M${cushion}`, moneyFmt);
    nf(sh, `B${reinvestPct}:M${reinvestPct}`, pctFmt);
  }

  sh.freezePanes.freezeRows(5);
  sh.freezePanes.freezeColumns(1);
  setCol(sh, "A", 210);
  for (const col of "BCDEFGHIJKLM") setCol(sh, col, 95);
}

// ---------------- Scenario Matrix ----------------
{
  const sh = sheets.matrix;
  titleBand(sh, "A1:O2", "Scenario Matrix", "Compare CPA case x reinvestment rate across the same 12-month model");
  section(sh, "A4:O4", "Summary of 9 Scaling Paths");
  sh.getRange("A5:O14").values = [
    ["Combo", "CPA case", "CPA", "Reinvest %", "M1 units", "M6 units", "M12 units", "M12 net profit", "Cumulative net profit", "Cash kept", "Reinvested total", "M12 ad spend", "ROAS", "MER", "Status"],
    ["Bad / 30%", "Bad CPA", null, 0.3, null, null, null, null, null, null, null, null, null, null, null],
    ["Bad / 50%", "Bad CPA", null, 0.5, null, null, null, null, null, null, null, null, null, null, null],
    ["Bad / 70%", "Bad CPA", null, 0.7, null, null, null, null, null, null, null, null, null, null, null],
    ["Base / 30%", "Base CPA", null, 0.3, null, null, null, null, null, null, null, null, null, null, null],
    ["Base / 50%", "Base CPA", null, 0.5, null, null, null, null, null, null, null, null, null, null, null],
    ["Base / 70%", "Base CPA", null, 0.7, null, null, null, null, null, null, null, null, null, null, null],
    ["Good / 30%", "Good CPA", null, 0.3, null, null, null, null, null, null, null, null, null, null, null],
    ["Good / 50%", "Good CPA", null, 0.5, null, null, null, null, null, null, null, null, null, null, null],
    ["Good / 70%", "Good CPA", null, 0.7, null, null, null, null, null, null, null, null, null, null, null],
  ];
  header(sh, "A5:O5", palette.navy);
  body(sh, "A6:B14", palette.soft);
  inputStyle(sh, "D6:D14");
  formulaStyle(sh, "C6:C14");
  formulaStyle(sh, "E6:O14");
  for (let row = 6; row <= 14; row++) {
    sh.getRange(`C${row}`).formulas = [[`=INDEX(Inputs!$C$29:$C$31,MATCH(B${row},Inputs!$A$29:$A$31,0))`]];
    sh.getRange(`E${row}:O${row}`).formulas = [[
      `=P${row}`,
      `=U${row}`,
      `=AA${row}`,
      `=AM${row}`,
      `=SUM(AB${row}:AM${row})`,
      `=SUM(AN${row}:AY${row})`,
      `=SUM(AZ${row}:BK${row})`,
      `=AA${row}*$C${row}`,
      `=Inputs!$B$7/$C${row}`,
      `=$C${row}/Inputs!$B$7`,
      `=IF(I${row}>0,"OK","Loss / review")`,
    ]];
  }
  nf(sh, "C6:C14", moneyFmt);
  nf(sh, "D6:D14", pctFmt);
  nf(sh, "E6:G14", countFmt);
  nf(sh, "H6:L14", moneyFmt);
  nf(sh, "M6:M14", roasFmt);
  nf(sh, "N6:N14", pctFmt);

  const unitCols = Array.from({ length: 12 }, (_, i) => colLetter(16 + i)); // P:AA
  const profitCols = Array.from({ length: 12 }, (_, i) => colLetter(28 + i)); // AB:AM
  const cashCols = Array.from({ length: 12 }, (_, i) => colLetter(40 + i)); // AN:AY
  const reinvestCols = Array.from({ length: 12 }, (_, i) => colLetter(52 + i)); // AZ:BK
  sh.getRange("P4:BK4").values = [[
    ...Array(12).fill("Helper: Units by Month"),
    ...Array(12).fill("Helper: Net Profit by Month"),
    ...Array(12).fill("Helper: Cash Kept by Month"),
    ...Array(12).fill("Helper: Reinvested by Month"),
  ]];
  sh.getRange("P5:BK5").values = [[
    ...Array.from({ length: 12 }, (_, i) => `M${i + 1} Units`),
    ...Array.from({ length: 12 }, (_, i) => `M${i + 1} Profit`),
    ...Array.from({ length: 12 }, (_, i) => `M${i + 1} Cash`),
    ...Array.from({ length: 12 }, (_, i) => `M${i + 1} Reinvest`),
  ]];
  header(sh, "P4:BK5", palette.slate);
  formulaStyle(sh, "P6:BK14");
  for (let row = 6; row <= 14; row++) {
    for (let i = 0; i < 12; i++) {
      const unitCol = unitCols[i];
      const profitCol = profitCols[i];
      const cashCol = cashCols[i];
      const reinvestCol = reinvestCols[i];
      const prevUnitCol = i === 0 ? null : unitCols[i - 1];
      const prevReinvestCol = i === 0 ? null : reinvestCols[i - 1];
      sh.getRange(`${unitCol}${row}`).formulas = [[i === 0 ? "=Inputs!$B$8" : `=MIN(FLOOR(${prevUnitCol}${row}*(1+Inputs!$B$13),1),${prevUnitCol}${row}+FLOOR(MAX(0,${prevReinvestCol}${row})/Inputs!$B$16,1))`]];
      sh.getRange(`${profitCol}${row}`).formulas = [[`=${unitCol}${row}*Inputs!$B$10*Inputs!$B$7*(1-Inputs!$B$11)-${unitCol}${row}*Inputs!$B$10*Inputs!$B$24-${unitCol}${row}*Inputs!$B$10*$C${row}-Inputs!$B$12`]];
      sh.getRange(`${cashCol}${row}`).formulas = [[`=MAX(0,${profitCol}${row}*(1-$D${row}))`]];
      sh.getRange(`${reinvestCol}${row}`).formulas = [[`=MAX(0,${profitCol}${row}*$D${row})`]];
    }
  }
  nf(sh, "P6:AA14", countFmt);
  nf(sh, "AB6:BK14", moneyFmt);

  sh.freezePanes.freezeRows(5);
  sh.freezePanes.freezeColumns(2);
  ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O"].forEach((col, i) => setCol(sh, col, [120, 105, 95, 105, 90, 90, 90, 125, 135, 120, 130, 120, 75, 75, 105][i]));
  for (const col of [...unitCols, ...profitCols, ...cashCols, ...reinvestCols]) setCol(sh, col, 86);
}

// ---------------- Dashboard ----------------
{
  const sh = sheets.dashboard;
  titleBand(sh, "A1:L2", "E-Commerce Scaling Dashboard", "Meta Ads CPA scenarios, reinvestment pacing, and monthly profit roadmap");
  section(sh, "A4:L4", "Model Snapshot");
  sh.getRange("A5:L8").values = [
    ["Metric", "Value", "Metric", "Value", "Metric", "Value", "Metric", "Value", "Metric", "Value", "Metric", "Value"],
    ["Product", null, "Selling price", null, "Starting units", null, "Var cost pre-ads", null, "Break-even CPA", null, "Model status", null],
    ["M12 best profit", null, "Best scenario", null, "M12 best units", null, "Best cum. profit", null, "Startup cash", null, "Break-even ROAS", null],
    ["Bad CPA", null, "Base CPA", null, "Good CPA", null, "Bad reinvest", null, "Base reinvest", null, "Good reinvest", null],
  ];
  header(sh, "A5:L5", palette.navy);
  body(sh, "A6:K8", palette.soft);
  linkStyle(sh, "B6:L8");
  sh.getRange("B6:L8").formulas = [
    ["=Inputs!B6", "", "=Inputs!B7", "", "=Inputs!B8", "", "=Inputs!B24", "", "=Inputs!B25", "", "=Checks!F3"],
    ["=MAX('Scenario Matrix'!H6:H14)", "", "=INDEX('Scenario Matrix'!A6:A14,MATCH(MAX('Scenario Matrix'!H6:H14),'Scenario Matrix'!H6:H14,0))", "", "=INDEX('Scenario Matrix'!G6:G14,MATCH(MAX('Scenario Matrix'!H6:H14),'Scenario Matrix'!H6:H14,0))", "", "=MAX('Scenario Matrix'!I6:I14)", "", "='Cost Builder'!C13", "", "='Cost Builder'!C10"],
    ["=Inputs!C29", "", "=Inputs!C30", "", "=Inputs!C31", "", "=Inputs!D29", "", "=Inputs!D30", "", "=Inputs!D31"],
  ];
  nf(sh, "D6", moneyFmt);
  nf(sh, "F6", countFmt);
  nf(sh, "H6:J6", moneyFmt);
  nf(sh, "B7", moneyFmt);
  nf(sh, "F7", countFmt);
  nf(sh, "H7:J7", moneyFmt);
  nf(sh, "L7", roasFmt);
  nf(sh, "B8:F8", moneyFmt);
  nf(sh, "H8:L8", pctFmt);

  section(sh, "A10:F10", "Default Scenario Outcomes");
  sh.getRange("A11:F14").values = [
    ["Scenario", "CPA", "Reinvest %", "M12 units", "M12 net profit", "Cumulative net profit"],
    ["Bad / 30%", null, null, null, null, null],
    ["Base / 50%", null, null, null, null, null],
    ["Good / 70%", null, null, null, null, null],
  ];
  header(sh, "A11:F11", palette.slate);
  body(sh, "A12:A14", palette.soft);
  linkStyle(sh, "B12:F14");
  sh.getRange("B12:F14").formulas = [
    ["='Scenario Matrix'!C6", "='Scenario Matrix'!D6", "='Scenario Matrix'!G6", "='Scenario Matrix'!H6", "='Scenario Matrix'!I6"],
    ["='Scenario Matrix'!C10", "='Scenario Matrix'!D10", "='Scenario Matrix'!G10", "='Scenario Matrix'!H10", "='Scenario Matrix'!I10"],
    ["='Scenario Matrix'!C14", "='Scenario Matrix'!D14", "='Scenario Matrix'!G14", "='Scenario Matrix'!H14", "='Scenario Matrix'!I14"],
  ];
  nf(sh, "B12:B14", moneyFmt);
  nf(sh, "C12:C14", pctFmt);
  nf(sh, "D12:D14", countFmt);
  nf(sh, "E12:F14", moneyFmt);

  section(sh, "H10:L10", "How to Use");
  sh.getRange("H11:L15").values = [
    ["1", "Edit yellow cells on Inputs", "", "", ""],
    ["2", "Use CPA % or overwrite CPA values if your Ads Manager data is stronger", "", "", ""],
    ["3", "Roadmap shows month-by-month cash kept, reinvested profit, and added stock", "", "", ""],
    ["4", "Scenario Matrix compares CPA case x 30/50/70% reinvestment", "", "", ""],
    ["5", "Checks tab warns when CPA or margin assumptions break the model", "", "", ""],
  ];
  body(sh, "H11:L15", palette.lightBlue);
  fmt(sh, "H11:H15", { fill: palette.navy, font: { bold: true, color: palette.white }, horizontalAlignment: "center" });

  section(sh, "A17:D17", "Chart Data: Net Profit by Month");
  sh.getRange("A18:D30").values = [
    ["Month", "Bad / 30%", "Base / 50%", "Good / 70%"],
    ...Array.from({ length: 12 }, (_, i) => [`M${i + 1}`, null, null, null]),
  ];
  header(sh, "A18:D18", palette.slate);
  body(sh, "A19:A30", palette.soft);
  linkStyle(sh, "B19:D30");
  for (let i = 0; i < 12; i++) {
    const row = 19 + i;
    const monthCol = String.fromCharCode(66 + i);
    sh.getRange(`B${row}:D${row}`).formulas = [[`=Roadmap!${monthCol}12`, `=Roadmap!${monthCol}31`, `=Roadmap!${monthCol}50`]];
  }
  nf(sh, "B19:D30", moneyFmt);
  const profitChart = sh.charts.add("line", sh.getRange("A18:D30"));
  profitChart.title = "Monthly Net Profit by Scenario";
  profitChart.hasLegend = true;
  profitChart.xAxis = { axisType: "textAxis" };
  profitChart.yAxis = { numberFormatCode: "฿#,##0" };
  profitChart.setPosition("F17", "L31");

  section(sh, "A33:D33", "Chart Data: Month 12 Units");
  sh.getRange("A34:D37").values = [
    ["Scenario", "M12 units", "M12 net profit", "Cumulative net profit"],
    ["Bad / 30%", null, null, null],
    ["Base / 50%", null, null, null],
    ["Good / 70%", null, null, null],
  ];
  header(sh, "A34:D34", palette.slate);
  body(sh, "A35:A37", palette.soft);
  linkStyle(sh, "B35:D37");
  sh.getRange("B35:D37").formulas = [
    ["='Scenario Matrix'!G6", "='Scenario Matrix'!H6", "='Scenario Matrix'!I6"],
    ["='Scenario Matrix'!G10", "='Scenario Matrix'!H10", "='Scenario Matrix'!I10"],
    ["='Scenario Matrix'!G14", "='Scenario Matrix'!H14", "='Scenario Matrix'!I14"],
  ];
  nf(sh, "B35:B37", countFmt);
  nf(sh, "C35:D37", moneyFmt);
  const unitsChart = sh.charts.add("bar", sh.getRange("A34:B37"));
  unitsChart.title = "Month 12 Units by Default Scenario";
  unitsChart.hasLegend = false;
  unitsChart.xAxis = { axisType: "textAxis" };
  unitsChart.yAxis = { numberFormatCode: "#,##0" };
  unitsChart.setPosition("F33", "L47");

  sh.freezePanes.freezeRows(5);
  ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"].forEach((col, i) => setCol(sh, col, [150, 155, 145, 135, 145, 125, 140, 145, 135, 145, 135, 125][i]));
}

// ---------------- Checks ----------------
{
  const sh = sheets.checks;
  titleBand(sh, "A1:H2", "Model Checks", "Formula and business logic checks for the scaling roadmap");
  section(sh, "A4:H4", "Audit Checks");
  sh.getRange("A5:H13").values = [
    ["Check", "Actual", "Expected", "Difference", "Tolerance", "Status", "Fix hint", "Location"],
    ["Selling price above variable cost", null, "> 0", null, 0, null, "Raise price or reduce landed/ops costs", "Inputs!B7:B25"],
    ["Bad CPA below break-even CPA", null, ">= 0", null, 0, null, "Bad scenario CPA is beyond unit economics", "Inputs!C29 / Inputs!B25"],
    ["Base CPA below break-even CPA", null, ">= 0", null, 0, null, "Base scenario may need better offer/creative", "Inputs!C30 / Inputs!B25"],
    ["Good CPA below break-even CPA", null, ">= 0", null, 0, null, "Even good CPA is too high", "Inputs!C31 / Inputs!B25"],
    ["Initial units positive", null, "> 0", null, 0, null, "Enter Month 1 order units", "Inputs!B8"],
    ["Sell-through rate within 0%-100%", null, "0%-100%", null, 0, null, "Set realistic sell-through", "Inputs!B10"],
    ["Refund rate below 30%", null, "< 30%", null, 0, null, "High returns can destroy contribution margin", "Inputs!B11"],
    ["Formula error scan proxy", 0, 0, 0, 0, "OK", "Run Excel formula audit if manually edited", "Workbook"],
  ];
  header(sh, "A5:H5", palette.navy);
  body(sh, "A6:A13", palette.soft);
  formulaStyle(sh, "B6:F13");
  body(sh, "G6:H13", palette.white);
  sh.getRange("B6:F13").formulas = [
    ["=Inputs!B25", "0", "=B6-C6", "0", `=IF(B6>C6,"OK","Review")`],
    ["=Inputs!H29", "0", "=B7-C7", "0", `=IF(B7>=C7,"OK","Review")`],
    ["=Inputs!H30", "0", "=B8-C8", "0", `=IF(B8>=C8,"OK","Review")`],
    ["=Inputs!H31", "0", "=B9-C9", "0", `=IF(B9>=C9,"OK","Review")`],
    ["=Inputs!B8", "0", "=B10-C10", "0", `=IF(B10>C10,"OK","Review")`],
    ["=Inputs!B10", "1", "=B11-C11", "0", `=IF(AND(B11>=0,B11<=1),"OK","Review")`],
    ["=Inputs!B11", "0.3", "=B12-C12", "0", `=IF(B12<C12,"OK","Review")`],
    ["0", "0", "0", "0", `"OK"`],
  ];
  sh.getRange("F3").formulas = [[`=IF(COUNTIF(F6:F13,"Review")=0,"OK","Review")`]];
  fmt(sh, "E3:F3", { fill: palette.navy, font: { bold: true, color: palette.white }, horizontalAlignment: "center" });
  sh.getRange("E3").values = [["Overall status"]];
  nf(sh, "B6:D9", moneyFmt);
  nf(sh, "B10:D10", countFmt);
  nf(sh, "B11:D12", pctFmt);
  nf(sh, "B13:E13", countFmt);
  sh.freezePanes.freezeRows(5);
  ["A", "B", "C", "D", "E", "F", "G", "H"].forEach((col, i) => setCol(sh, col, [245, 120, 105, 110, 90, 95, 280, 180][i]));
}

// ---------------- Sources ----------------
{
  const sh = sheets.sources;
  titleBand(sh, "A1:F2", "Sources and Model Notes", "Assumptions are editable; use this tab to audit default logic");
  section(sh, "A4:F4", "Workbook Sources");
  sh.getRange("A5:F11").values = [
    ["Item", "Value / Logic", "Unit", "As of", "Source", "Notes"],
    ["Source workbook logic", "Price - landed cost - packaging - fulfillment - shipping - affiliate - fees - CPA", "THB/unit", "2026-05-25", "Profit Breakdown - Quantum Commerce.xlsx", "Adapted from user's workbook structure"],
    ["CPA guide for 600-900 THB", "Good 120-220, Base 220-320, danger 350+", "THB/purchase", "2026-05-25", "Prior benchmark research in this chat", "Workbook uses price x 22% / 32% / 42% as editable default"],
    ["CPA guide for 900-1,300 THB", "Good 180-330, Base 330-480, danger 500-600+", "THB/purchase", "2026-05-25", "Prior benchmark research in this chat", "Adjust based on Ads Manager purchase data"],
    ["Reinvestment formula", "Next units = prior units + floor(profit reinvested / landed product cost)", "Units", "2026-05-25", "Analyst assumption", "Models profit-funded inventory scaling"],
    ["Revenue formula", "Units sold x price x (1 - refund rate)", "THB", "2026-05-25", "Analyst assumption", "Refunds reduce recognized revenue"],
    ["Ad spend formula", "Units sold x CPA", "THB", "2026-05-25", "Analyst assumption", "CPA is cost per purchase/order"],
  ];
  header(sh, "A5:F5", palette.navy);
  body(sh, "A6:F11", palette.white);
  sh.getRange("A13:F17").values = [
    ["Important Caveats", "", "", "", "", ""],
    ["1", "Order growth is capped by Inputs!B13 to keep reinvestment scaling realistic.", "", "", "", ""],
    ["2", "China sourcing lead-time, working capital, tax, VAT, payment settlement delay, COD rejection, storage limits, and creative production are not automatically modeled unless added in Inputs overhead/costs.", "", "", "", ""],
    ["3", "Reinvested profit is cash allocated into stock, not an accounting expense. Dashboard still shows accounting net profit and cash kept separately.", "", "", "", ""],
    ["4", "When you have real Meta Ads purchase data, overwrite CPA assumptions first; that will update every sheet.", "", "", "", ""],
  ];
  sh.getRange("A13:F13").merge();
  fmt(sh, "A13:F13", { fill: palette.navy, font: { bold: true, color: palette.white }, horizontalAlignment: "center" });
  body(sh, "A14:F17", palette.lightAmber);
  ["A", "B", "C", "D", "E", "F"].forEach((col, i) => setCol(sh, col, [180, 430, 120, 105, 230, 430][i]));
}

// Add a few tables for filtering/auditing.
sheets.inputs.tables.add("A28:H32", true, "ScenarioInputsTable");
sheets.matrix.tables.add("A5:O14", true, "ScenarioMatrixTable");
sheets.checks.tables.add("A5:H13", true, "ChecksTable");
sheets.sources.tables.add("A5:F11", true, "SourcesTable");

// Render previews and run compact verification.
await fs.mkdir(outputDir, { recursive: true });

const previews = [
  ["Dashboard", "A1:L47"],
  ["Inputs", "A1:H32"],
  ["Cost Builder", "A1:M21"],
  ["Roadmap", "A1:M59"],
  ["Scenario Matrix", "A1:O14"],
  ["Checks", "A1:H13"],
  ["Sources", "A1:F17"],
];

for (const [sheetName, range] of previews) {
  const preview = await wb.render({ sheetName, range, scale: 1, format: "png" });
  await fs.writeFile(`${outputDir}/${sheetName.replaceAll(" ", "_").toLowerCase()}_preview.png`, new Uint8Array(await preview.arrayBuffer()));
}

const checks = await wb.inspect({
  kind: "table",
  range: "Checks!A1:H13",
  include: "values,formulas",
  tableMaxRows: 15,
  tableMaxCols: 8,
});
console.log(checks.ndjson);

const dash = await wb.inspect({
  kind: "table",
  range: "Dashboard!A1:L15",
  include: "values,formulas",
  tableMaxRows: 16,
  tableMaxCols: 12,
});
console.log(dash.ndjson);

const errors = await wb.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 300 },
  summary: "final formula error scan",
});
console.log(errors.ndjson);

const xlsx = await SpreadsheetFile.exportXlsx(wb);
await xlsx.save(outputPath);
console.log(`SAVED ${outputPath}`);
