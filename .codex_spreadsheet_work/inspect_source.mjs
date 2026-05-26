import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const sourcePath = "C:/Users/eagle/OneDrive/E-Com/RoadMap/Profit Breakdown - Quantum Commerce.xlsx";
const input = await FileBlob.load(sourcePath);
const workbook = await SpreadsheetFile.importXlsx(input);

const overview = await workbook.inspect({
  kind: "workbook,sheet,table,formula",
  maxChars: 12000,
  tableMaxRows: 8,
  tableMaxCols: 10,
  tableMaxCellChars: 80,
  options: { maxResults: 120 },
});

console.log(overview.ndjson);
