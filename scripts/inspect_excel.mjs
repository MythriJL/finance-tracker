import * as XLSX from 'xlsx';
import fs from 'fs';

const filepath = './resource/Acct Statement_7920_29112025_12.55.43.xls';
if (!fs.existsSync(filepath)) {
  console.error('File not found:', filepath);
  process.exit(1);
}
const buffer = fs.readFileSync(filepath);
const workbook = XLSX.read(buffer, { type: 'buffer' });
console.log('Sheets:', workbook.SheetNames);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const json = XLSX.utils.sheet_to_json(sheet, { defval: null });
const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
const headerRowIndex = rows.findIndex((r) => Array.isArray(r) && r.some((c) => typeof c === 'string' && /date/i.test(c)) && r.some((c) => typeof c === 'string' && /(narration|description|withdrawal|deposit|withdrawal amt|deposit amt|particulars)/i.test(c)));
const headerRow = headerRowIndex >= 0 ? rows[headerRowIndex] : rows[0] || [];
console.log('Header row index:', headerRowIndex);
console.log('Header row:', headerRow);
const dataRows = rows.slice(headerRowIndex + 1);
console.log('Data row count (after header):', dataRows.length);
console.log('\nParsed rows (date, narration, withdrawal, deposit, amount)');
dataRows.forEach((r, idx) => {
  const date = r[0];
  const narration = r[1];
  const withdrawal = r[4];
  const deposit = r[5];
  console.log(idx+1, date, '|', narration, '|', withdrawal, '|', deposit);
});

// Now try a mapping/detection like UploadBankStatement.tsx
const header = headerRow.map(h => String(h || '').trim());
const mapping = { date: '', description: '', debit: '', credit: '', amount: '', type: '' };
header.forEach((col, i) => {
  const lower = col.toLowerCase();
  if (/date/.test(lower) && !mapping.date) mapping.date = col;
  if (/description|narration|details|remarks|particulars/.test(lower) && !mapping.description) mapping.description = col;
  if (/\b(debit|withdrawal|out|dr)\b/.test(lower) && !mapping.debit) mapping.debit = col;
  if (/\b(credit|deposit|in|cr)\b/.test(lower) && !mapping.credit) mapping.credit = col;
  if (/(?:amount(?!ing)|\bamt\b|total|\bvalue\b(?!\s*dt))/i.test(lower) && !/bal|balance/.test(lower) && !mapping.amount) mapping.amount = col;
  if (/\b(dr|cr|cr\/dr|type|txn type|debit|credit|debitcredit)\b/.test(lower) && !mapping.type) mapping.type = col;
});
console.log('\nDetected mapping:', mapping);
// Build JSON data from rows
const jsonData = dataRows.map(r => {
  const obj = {};
  header.forEach((h, idx) => {
    obj[h] = r[idx];
  });
  return obj;
});
const parseTransactions = (rawData, mapping) => {
  return rawData
    .filter(row => {
      const date = row[mapping.date || header[0]];
      const desc = row[mapping.description || '__EMPTY'];
      const debit = parseFloat(String(row[mapping.debit || ''] || 0));
      const credit = parseFloat(String(row[mapping.credit || ''] || 0));
      const amountVal = mapping.amount ? parseFloat(String(row[mapping.amount] ?? 0)) : 0;
      return date && desc && (debit || credit || amountVal);
    })
    .map(row => {
      const dateRaw = row[mapping.date || header[0]];
      let date = new Date().toISOString().split('T')[0];
      if (typeof dateRaw === 'number') {
        const excelEpoch = new Date(1899, 11, 30);
        date = new Date(excelEpoch.getTime() + dateRaw * 86400000).toISOString().split('T')[0];
      } else if (typeof dateRaw === 'string') {
        const parts = dateRaw.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
        if (parts) {
          const [, day, month, yearRaw] = parts;
          let year = yearRaw;
          if (year.length === 2) year = parseInt(year) < 50 ? '20' + year : '19' + year;
          date = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
      }
      const description = String(row[mapping.description || '__EMPTY'] || 'Bank Transaction').substring(0, 200).trim();
      let debit = parseFloat(String(row[mapping.debit || ''] || 0));
      let credit = parseFloat(String(row[mapping.credit || ''] || 0));
      if ((!debit && !credit) && mapping.amount) {
        const rawAmount = String(row[mapping.amount] ?? '');
        const cleaned = rawAmount.replace(/\(/g, '-').replace(/\)/g, '').replace(/,/g, '').trim();
        const amountParsed = parseFloat(cleaned || '0');
        if (!isNaN(amountParsed)) {
          if (amountParsed < 0) {
            debit = Math.abs(amountParsed);
          } else {
            credit = amountParsed;
          }
        }
      }
      if (mapping.type) {
        const t = String(row[mapping.type] ?? '').toLowerCase();
        if (t.includes('dr') || t.includes('debit')) {
          credit = 0;
        } else if (t.includes('cr') || t.includes('credit')) {
          debit = 0;
        }
      }
      const type = credit > 0 ? 'income' : 'expense';
      const amount = credit > 0 ? credit : debit;
      return { date, description, amount, type };
    });
};

const parsed = parseTransactions(jsonData, mapping);
console.log('\nParsed transactions count:', parsed.length);
parsed.forEach((p, i) => {
  console.log(`\nParsed #${i + 1}:`, p);
  // Print the raw row that generated this transaction for debugging
  const rawRow = jsonData.find(r => {
    const dateRaw = r[mapping.date || header[0]];
    const desc = r[mapping.description || header[1]];
    const amountVal = parseFloat(String(r[mapping.debit || header[4]] || 0)) || parseFloat(String(r[mapping.credit || header[5]] || 0)) || parseFloat(String(r[mapping.amount || header[4]] || 0));
    const dateNormalized = (typeof dateRaw === 'string') ? dateRaw : String(dateRaw || '');
    const descStr = String(desc || '');
    return p.date.includes(dateNormalized.slice(0, 4)) && p.amount == amountVal || descStr && p.description && p.description.includes(descStr.substring(0, 6));
  });
  if (rawRow) console.log('  Raw row:', rawRow);
});
console.log('First 20 rows (keys):');
json.slice(0, 20).forEach((r, i) => {
  console.log('\nRow', i+1);
  Object.entries(r).forEach(([k, v]) => console.log(`  ${k}: ${v}`));
});
console.log('\nColumn names:', Object.keys(json[0] || {}).join(', '));
console.log('Number of rows:', json.length);
