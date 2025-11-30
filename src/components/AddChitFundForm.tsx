// src/components/AddChitFundForm.tsx
import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { colors } from "../styles/global";
import { auth, db } from "../firebase/config";
import { collection, addDoc } from "firebase/firestore";

interface AddChitFundFormProps {
  onTransactionAdded?: () => void;
}

const Card = styled.div`
  background-color: ${colors.white};
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
  margin-bottom: 20px;
`;

const Form = styled.form`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  margin-top: 15px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

const Label = styled.label`
  margin-bottom: 5px;
  font-weight: 600;
  color: ${colors.darkPurple};
`;

const Input = styled.input`
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 1rem;
`;

const FullWidthGroup = styled(FormGroup)`
  grid-column: 1 / -1;
`;

const Button = styled.button`
  background-color: ${colors.orange};
  color: ${colors.white};
  border: none;
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  margin-top: 10px;
  transition: background-color 0.2s;

  &:hover {
    background-color: ${colors.purple};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

// --- CHIT FUND CONSTANT ---
const MONTHLY_BEAT_AMOUNT = 50000;
const CHIT_FUND_CATEGORY = "Chit Funds";
// --------------------------

const AddChitFundForm: React.FC<AddChitFundFormProps> = ({ onTransactionAdded }) => {
  const [description, setDescription] = useState(`MSIL Chit Fund Payment - ${new Date().toLocaleString('default', { month: 'short', year: 'numeric' })}`);
  const [dividendReceived, setDividendReceived] = useState<number | string>("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [netAmountPaid, setNetAmountPaid] = useState<number | string>(MONTHLY_BEAT_AMOUNT);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Calculate net amount paid whenever dividendReceived changes
  useEffect(() => {
      const dividend = parseFloat(String(dividendReceived || 0));
      const net = MONTHLY_BEAT_AMOUNT - dividend;
      setNetAmountPaid(net > 0 ? net.toFixed(2) : 0);
  }, [dividendReceived]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !netAmountPaid) {
      setMessage("Please sign in and enter a valid dividend amount.");
      return;
    }

    setLoading(true);
    setMessage(null);

    const numericAmount = parseFloat(String(netAmountPaid));
    const numericDividend = parseFloat(String(dividendReceived || 0));

    if (isNaN(numericAmount) || numericAmount < 0 || isNaN(numericDividend) || numericDividend < 0) {
        setMessage("Invalid amounts.");
        setLoading(false);
        return;
    }

    const transactionData = {
        date,
        description,
        amount: numericAmount, // This is the net expense
        type: "expense",
        category: CHIT_FUND_CATEGORY,
        source: "Manual Chit Fund Entry",
        createdAt: new Date(),
        chitFund: {
            beatAmount: MONTHLY_BEAT_AMOUNT, 
            dividendReceived: numericDividend,
            amountPaid: numericAmount, 
        }
    };

    try {
      const transactionsRef = collection(db, "users", auth.currentUser.uid, "transactions");
      await addDoc(transactionsRef, transactionData);
      setMessage("Chit Fund Payment added successfully! Saved to Firebase.");
      // Reset form 
      setDescription(`MSIL Chit Fund Payment - ${new Date().toLocaleString('default', { month: 'short', year: 'numeric' })}`);
      setDividendReceived("");
      setNetAmountPaid(MONTHLY_BEAT_AMOUNT);
      if (onTransactionAdded) onTransactionAdded();
    } catch (error) {
      console.error("Error adding Chit Fund transaction:", error);
      setMessage("Failed to add transaction. See console for details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <h3>Record Chit Fund Payment (MSIL 25L)</h3>
      <Form onSubmit={handleSubmit}>
        <FormGroup>
          <Label htmlFor="date">Date of Payment</Label>
          <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </FormGroup>
        
        <FormGroup>
            <Label htmlFor="beatAmount">Fixed Monthly Payment (Beat Amount)</Label>
            <Input 
                id="beatAmount" 
                type="text" 
                value={`₹${MONTHLY_BEAT_AMOUNT.toLocaleString()}`} 
                disabled 
            />
        </FormGroup>
        
        <FullWidthGroup>
          <Label htmlFor="description">Description (max 200 chars)</Label>
          <Input id="description" type="text" value={description} onChange={(e) => setDescription(e.target.value.substring(0, 200))} required />
        </FullWidthGroup>
        
        <FormGroup>
          <Label htmlFor="dividendReceived">Dividend Received</Label>
          <Input id="dividendReceived" type="number" step="0.01" value={dividendReceived} placeholder="Enter dividend amount" onChange={(e) => setDividendReceived(e.target.value)} required />
        </FormGroup>
        
        <FormGroup>
          <Label htmlFor="amount">Net Amount Paid (Payment - Dividend)</Label>
          <Input id="amount" type="text" value={`₹${Number(netAmountPaid).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} disabled />
        </FormGroup>
        
        <FullWidthGroup>
            <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Record Payment"}</Button>
            {message && <p style={{ color: message.includes("success") ? "green" : "red", marginTop: 10 }}>{message}</p>}
        </FullWidthGroup>
      </Form>
    </Card>
  );
};

export default AddChitFundForm;