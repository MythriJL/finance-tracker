// src/components/UploadBankStatement.tsx
import React, { useState, type ChangeEvent, useEffect, useCallback } from "react";
import type { User } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import styled from "styled-components";
import { colors } from "../styles/global";
import * as XLSX from "xlsx";
import { getFirestore, collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { auth } from "../firebase/config";

const Content = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 0; /* inner layout will use parent spacing */
  width: 100%;
`;

const Card = styled.div`
  background-color: ${colors.white};
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
  margin-bottom: 20px;
`;

interface UploadProps { onUploadComplete?: () => void }

const Button = styled.button<{ bg?: string }>`
  background-color: ${(props) => props.bg || colors.purple};
  color: ${colors.white};
  border: none;
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
  margin-right: 12px;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${(props) => props.bg ? "#ff8c42" : "#5a2fa5"};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;


const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 12px;

  th, td {
    padding: 8px;
    border: 1px solid #ddd;
    text-align: left;
  }
  
  td:nth-child(5) {
      width: 150px; /* Give the Category select field enough room */
  }

  th {
    background-color: ${colors.purple};
    color: ${colors.white};
  }
`;

const Select = styled.select`
    padding: 6px;
    border-radius: 4px;
    border: 1px solid #ccc;
    width: 100%;
    box-sizing: border-box;
`;

interface Transaction {
  date: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  source: string;
}

// --- CATEGORY CONSTANTS ---
// ADDED 'Investment Principal'
const INCOME_CATEGORIES = ["Salary", "Investments Income", "Transfers", "Interest", "Rental Income", "Other Income", "Investment Principal"];
// ADDED 'Chit Funds' and 'Investment Principal'
const EXPENSE_CATEGORIES = ["Food & Dining", "Shopping", "Utilities", "Housing/Rent", "Automotive/Fuel", "Transfers", "Cash Withdrawal", "Taxes", "Insurance/Medical", "Investments", "Chit Funds", "Investment Principal", "Other Expenses"];

const ALL_CATEGORIES = {
    income: INCOME_CATEGORIES,
    expense: EXPENSE_CATEGORIES,
};
// -------------------------

/**
 * Categorizes a transaction based on its description and type.
 * @param description The transaction description.
 * @param type "income" or "expense".
 * @returns The determined category string.
 */
const categorizeTransaction = (description: string, type: "income" | "expense"): string => {
  const desc = description.toLowerCase();

  if (type === "income") {
    // NEW: FD Redemption (Principal Return) logic
    if (/(auto_redeem|princl|fd credit|fixed deposit|maturity)/.test(desc) && !/(interest)/.test(desc)) return "Investment Principal";
    if (/(interest|int|fd)/.test(desc)) return "Interest"; // Catches INTEREST CREDIT
    if (/(salary|sal|payroll|credit|employer|wages)/.test(desc)) return "Salary";
    if (/(rent|rental)/.test(desc)) return "Rental Income";
    if (/(transfer|imps|neft|rtgs|p2p|paytm|gpay|upi|phonepe|a\/c transfer)/.test(desc)) return "Transfers";
    return "Other Income";
  } else { // type === "expense"
    // NEW: FD Creation (Principal Outflow) logic
    if (/(fd through|fixed deposit|invest|purchase)/.test(desc) && /fd/i.test(desc)) return "Investment Principal";
    
    // MSIL (Chit Funds) logic
    if (/\bmsil\b|chit fund/i.test(desc)) return "Chit Funds"; 

    if (/(rent|emi|loan|mortgage|home)/.test(desc)) return "Housing/Rent";
    if (/(fuel|petrol|gas|esso|shell|hpcl|bpcl|oil)/.test(desc)) return "Automotive/Fuel";
    if (/(swiggy|zomato|ubereats|kfc|mcd|cafe|restaurant|food|dining)/.test(desc)) return "Food & Dining";
    if (/(amazon|flipkart|myntra|shop|online purchase|e-com|starbucks|subscriptions|netflix|spotify)/.test(desc)) return "Shopping";
    if (/(electricity|water|utility|internet|mobile|phone|bill|jio|airtel|gas bill)/.test(desc)) return "Utilities";
    if (/(atm|cash|withdrawal)/.test(desc)) return "Cash Withdrawal";
    if (/(transfer|imps|neft|rtgs|p2p|paytm|gpay|upi|phonepe|a\/c transfer)/.test(desc)) return "Transfers";
    if (/(tax|gst|tds|itax)/.test(desc)) return "Taxes";
    if (/(insurance|lic|health care|hospital|medical)/.test(desc)) return "Insurance/Medical";
    if (/(sip|mutual fund|investment|equity|elss)/.test(desc)) return "Investments";
    return "Other Expenses";
  }
};


const UploadBankStatement: React.FC<UploadProps> = ({ onUploadComplete }) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [parsedData, setParsedData] = useState<Transaction[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(auth.currentUser);

  const db = getFirestore();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u: User | null) => setCurrentUser(u));
    return () => unsub();
  }, []);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] || null);
    setParsedData([]);
    setShowPreview(false);
    setMessage("");
  };
  
  // Handler for category change in the preview table
  const handleCategoryChange = useCallback((index: number, newCategory: string) => {
    setParsedData(prevData => {
        const newData = [...prevData];
        if (newData[index]) {
            newData[index] = { ...newData[index], category: newCategory };
        }
        return newData;
    });
  }, []);


  // Helper: parse ArrayBuffer to transactions
  const parseArrayBufferToTransactions = (buffer: ArrayBuffer) => {
    const workbook = XLSX.read(new Uint8Array(buffer), { type: "array" });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    // Create rows with header detection: header is the first row with 'Date' and 'Narration' or 'Withdrawal/Deposit'
    const rows = XLSX.utils.sheet_to_json<(string | number | null)[]>(worksheet, { header: 1, defval: null });
    const headerIdx = rows.findIndex((r) => Array.isArray(r) && r.some((c) => typeof c === "string" && /date/i.test(c)) && r.some((c) => typeof c === "string" && /(narration|description|withdrawal|deposit|withdrawal amt|deposit amt|particulars)/i.test(c)));
    const headerRow = headerIdx >= 0 ? rows[headerIdx] : (rows[0] || []);
    const headers = headerRow.map((h: unknown) => String(h || "").trim()).filter(Boolean);

    // Build JSON from rows using headerRow, stopping at obvious footer markers
    const stopPatterns = [/statement summary/i, /end of statement/i, /opening balance/i, /registered office/i, /generated on/i, /page no\./i];
    const jsonData: Record<string, unknown>[] = [];
    const dataRows = (rows.slice(headerIdx + 1) || []);
    for (const row of dataRows) {
      // If any cell matches a stop pattern, stop reading further rows
      const containsStop = row.some((cell) => typeof cell === 'string' && stopPatterns.some((p) => p.test(cell)));
      if (containsStop) break;
      const obj: Record<string, unknown> = {};
      headers.forEach((h, idx) => {
        if (!h) return;
        obj[h] = row[idx];
      });
      if (Object.keys(obj).length > 0) jsonData.push(obj);
    }
    // Debug log to help troubleshooting mapping/cells
    // (mapping is declared below; show mapping sample after building it)

    // Detect columns
    const mapping: Record<string, string> = { date: "", description: "", debit: "", credit: "", amount: "", type: "" };
    headers.forEach((col) => {
      const lower = col.toLowerCase();
      if (/date/.test(lower) && !mapping.date) mapping.date = col;
      if (/(description|narration|details|remarks|particulars)/.test(lower) && !mapping.description) mapping.description = col;
      if (/\b(debit|withdrawal|out|dr)\b/.test(lower) && !mapping.debit) mapping.debit = col;
      if (/\b(credit|deposit|in|cr)\b/.test(lower) && !mapping.credit) mapping.credit = col;
      if (/(?:amount(?!ing)|\bamt\b|total|\bvalue\b(?!\s*dt))/i.test(lower) && !/bal|balance/.test(lower) && !mapping.amount) mapping.amount = col;
      if (/\b(dr|cr|cr\/dr|type|txn type|debit|credit|debitcredit)\b/.test(lower) && !mapping.type) mapping.type = col;
    });

    // Ignore patterns for footers/headers
    const ignorePatterns = [/(generated\s*on|statement summary|opening balance|end of statement|registered office|cust id|page no|requesting branch code)/i, /^\*{2,}/, /^(---|\*{4,})$/];

    const nowYear = new Date().getFullYear();
    const minYear = 1900;
    const maxYear = nowYear + 2;

    // Debug the mapping and sample JSON rows
    console.debug('parseArrayBufferToTransactions: headerIdx=', headerIdx, 'headers=', headers);
    console.debug('parseArrayBufferToTransactions: mapping=', mapping);
    console.debug('parseArrayBufferToTransactions: jsonData rows sample=', jsonData.slice(0, 6));

    const transactions: Transaction[] = jsonData
      .filter((row) => {
        const dateRaw = row[mapping.date || headers[0]];
        const desc = String(row[mapping.description || headers[1]] || "");
        // If any cell in the row matches an ignore pattern, skip it
        const rowValues = headers.map(h => row[h]);
        if (rowValues.some((val) => typeof val === 'string' && ignorePatterns.some((p) => p.test(val)))) return false;
        if (ignorePatterns.some((p) => p.test(desc))) return false;
        const debit = parseFloat(String(row[mapping.debit || ""] || 0));
        const credit = parseFloat(String(row[mapping.credit || ""] || 0));
        const amountVal = mapping.amount ? parseFloat(String(row[mapping.amount] ?? 0)) : 0;
        const amountUsed = (!isNaN(debit) && debit) || (!isNaN(credit) && credit) || (!isNaN(amountVal) && amountVal) || 0;
        const dateStr = typeof dateRaw === "string" ? dateRaw : String(dateRaw || "");
        const hasDate = /\d{1,2}\/\d{1,2}\/\d{2,4}/.test(dateStr) || /\d{1,2}-[A-Za-z]{3}-\d{4}/.test(dateStr) || (dateRaw instanceof Date);
        // const amountUsed was computed above; convert to number
        // const amountUsed = (debit || credit || (!isNaN(amountVal) && amountVal !== 0));
        // sanitize description — if it is the default placeholder, reject unless amount is significant
        const descLower = desc.toLowerCase();
        if (/^(bank transaction|bank statement|statement of accounts|page no\.|generated on:)/i.test(descLower)) {
          // allow if it is a significant amount and has a valid date
          if (!(hasDate && amountUsed && amountUsed > 100)) return false;
        }
        // Reject dates that are obviously wrong (result of numeric value parsing wrongly treated as date)
        if (hasDate && typeof dateRaw !== 'string' && typeof dateRaw === 'number') {
          // the date numeric should be an Excel serial; convert and check the resulting year
          const excelEpoch = new Date(1899, 11, 30);
          const maybeDate = new Date(excelEpoch.getTime() + (dateRaw as number) * 86400000);
          const year = maybeDate.getUTCFullYear();
          if (year < minYear || year > maxYear) return false;
        }
        // final acceptance
        return (hasDate && amountUsed) || amountUsed;
      })
      .map((row) => {
        const dateRaw = row[mapping.date || headers[0]];
        let date = new Date().toISOString().split("T")[0];
        if (typeof dateRaw === "number") {
          const excelEpoch = new Date(1899, 11, 30);
          date = new Date(excelEpoch.getTime() + dateRaw * 86400000).toISOString().split("T")[0];
        } else if (typeof dateRaw === "string") {
          const parts = dateRaw.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
          if (parts) {
            const [, day, month, yearRaw] = parts;
            let year = yearRaw;
            if (year.length === 2) year = parseInt(year) < 50 ? "20" + year : "19" + year;
            date = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
          } else {
            // Try Date parser fallback (handles '29-Nov-2025 12:55')
            const parsed = new Date(dateRaw);
            if (!isNaN(parsed.getTime())) date = parsed.toISOString().split("T")[0];
          }
        }
        const description = String(row[mapping.description || headers[1]] || "Bank Transaction").substring(0, 200).trim();
        let debit = parseFloat(String(row[mapping.debit || ""] || 0));
        let credit = parseFloat(String(row[mapping.credit || ""] || 0));
        if ((!debit && !credit) && mapping.amount) {
          const rawAmount = String(row[mapping.amount] ?? "");
          const cleaned = rawAmount.replace(/\(/g, "-").replace(/\)/g, "").replace(/,/g, "").trim();
          const amountParsed = parseFloat(cleaned || "0");
          if (!isNaN(amountParsed)) {
            if (amountParsed < 0) debit = Math.abs(amountParsed); else credit = amountParsed;
          }
        }
        if (mapping.type) {
          const t = String(row[mapping.type] ?? "").toLowerCase();
          if (t.includes("dr") || t.includes("debit")) { credit = 0; } else if (t.includes("cr") || t.includes("credit")) { debit = 0; }
        }
        const type: "income" | "expense" = credit > 0 ? "income" : "expense";
        const amount = credit > 0 ? credit : debit;
        
        // --- CATEGORIZATION LOGIC ADDED HERE ---
        const category = categorizeTransaction(description, type);
        // --- END CATEGORIZATION LOGIC ---

        return { date, description, amount, type, category, source: "Bank Statement" }; 
      })
      .filter((t) => t.amount > 0);

    return transactions;
  };

  const parseFile = () => {
    if (!file) return setMessage("Select a file");
    setLoading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const buffer = e.target?.result as ArrayBuffer;
      try {
        const transactions = parseArrayBufferToTransactions(buffer);
        // Count how many source JSON rows were filtered out for debug
        // (we currently don't expose jsonData from helper, so we'll just output parsed count)
        if (!transactions.length) {
          setMessage("No transactions parsed. Check file format.");
          setParsedData([]);
          setShowPreview(false);
        } else {
          setParsedData(transactions);
          setShowPreview(true);
          setMessage(`Parsed ${transactions.length} transactions. Review and confirm to upload.`);
        }
      } catch (error) {
        console.error(error);
        setMessage("Error parsing file: " + (error as Error).message);
      } finally {
        setLoading(false);
      }
    };
    reader.onerror = () => { setMessage("Error reading file"); setLoading(false); };
    reader.readAsArrayBuffer(file);
  };

  // Removed sample resource loader: file loading should be handled explicitly via the file input.


  const uploadTransactions = async () => {
    if (!currentUser) return setMessage("User not authenticated. Sign In to upload.");
    setLoading(true);
    const userId = currentUser!.uid;
    const transactionsRef = collection(db, "users", userId, "transactions");

    let success = 0, skipped = 0;
    for (const t of parsedData) {
      // NOTE: For simple bank statement upload, we don't need the complex chit fund fields, 
      // but we will keep the data structure consistent for now.
      const q = query(transactionsRef, where("date", "==", t.date), where("description", "==", t.description), where("amount", "==", t.amount));
      const existing = await getDocs(q);
      if (existing.empty) {
        await addDoc(transactionsRef, { ...t, createdAt: new Date() });
        success++;
      } else skipped++;
    }

    setMessage(`Upload complete! Added: ${success}, Skipped: ${skipped}`);
    setParsedData([]);
    setShowPreview(false);
    setFile(null);
    setLoading(false);
    if (onUploadComplete) onUploadComplete();
  };

  return (
    <>
      <Content>
          <h1 style={{ color: colors.darkPurple }}>Upload Bank Statement</h1>
          <Card>
            <input type="file" accept=".xls,.xlsx" onChange={handleFileChange} disabled={loading} />
                    <div style={{ marginTop: 12 }}>
                      <Button onClick={parseFile} disabled={!file || loading}>{loading ? "Processing..." : "Parse File"}</Button>
                      {!currentUser && (
                        <Button bg={colors.darkPurple} onClick={() => (window.location.href = '/login')} style={{ marginLeft: 8 }}>
                          Sign in to Upload
                        </Button>
                      )}
              {showPreview && parsedData.length > 0 && (
                <Button bg={colors.orange} onClick={uploadTransactions} disabled={loading || !currentUser}>
                  {loading ? "Uploading..." : "Confirm & Upload"}
                </Button>
              )}
            </div>
            {message && <p style={{ marginTop: 12, color: message.includes("Error") ? "red" : "green" }}>{message}</p>}
          </Card>

          {showPreview && parsedData.length > 0 && (
            <Card>
              <h3>Review and Edit Categories ({parsedData.length} transactions)</h3>
              <Table>
                <thead>
                  <tr><th>Date</th><th>Description</th><th>Amount</th><th>Type</th><th>Category</th></tr>
                </thead>
                <tbody>
                  {parsedData.slice(0, 20).map((t, i) => (
                    <tr key={i}>
                      <td>{t.date}</td>
                      <td>{t.description}</td>
                      <td>₹{t.amount.toFixed(2)}</td>
                      <td>{t.type}</td>
                      <td>
                          {/* Interactive Category Selection */}
                          <Select 
                              value={t.category} 
                              onChange={(e) => handleCategoryChange(i, e.target.value)}
                          >
                              {ALL_CATEGORIES[t.type].map(cat => (
                                  <option key={cat} value={cat}>{cat}</option>
                              ))}
                          </Select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              {parsedData.length > 20 && <div>... and {parsedData.length - 20} more transactions</div>}
            </Card>
          )}
      </Content>
    </>
  );
};

export default UploadBankStatement;