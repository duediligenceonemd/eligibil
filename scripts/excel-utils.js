'use strict';

const ExcelJS = require('exceljs');

function cellToValue(cell) {
  const value = cell.value;
  if (value === undefined || value === null) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value !== 'object') return value;
  if (value.text) return value.text;
  if (value.hyperlink) return value.hyperlink;
  if (value.result !== undefined && value.result !== null) return value.result;
  if (Array.isArray(value.richText)) {
    return value.richText.map((part) => part.text || '').join('');
  }
  return String(value);
}

async function readWorkbookRows(filePath) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  const sheets = workbook.worksheets.map((worksheet) => {
    const rows = [];
    worksheet.eachRow({ includeEmpty: true }, (row) => {
      const values = [];
      for (let index = 1; index <= worksheet.columnCount; index += 1) {
        values.push(cellToValue(row.getCell(index)));
      }
      rows.push(values);
    });
    return { name: worksheet.name, rows };
  });

  return {
    sheetNames: sheets.map((sheet) => sheet.name),
    sheets,
    getRows(sheetName) {
      return sheets.find((sheet) => sheet.name === sheetName)?.rows || [];
    },
  };
}

module.exports = { readWorkbookRows };
