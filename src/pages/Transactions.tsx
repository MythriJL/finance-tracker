// src/pages/Transactions.tsx
import React, { useEffect, useState, useCallback } from "react";
import styled from "styled-components";
import Sidebar from "../components/Sidebar";
import AddChitFundForm from "../components/AddChitFundForm"; 
import TransactionTable, { Transaction } from "../components/TransactionTable";
import SummaryCard from "../components/SummaryCard"; 
import { colors, GlobalStyle } from "../styles/global";
import { auth, db } from "../firebase/config";
import { collection, query, where, getDocs, doc, deleteDoc } from "firebase/firestore"; 

const TOTAL_CHIT_VALUE = 2500000;
const FIXED_MONTHLY_PAYMENT = 50000;
const TOTAL_MONTHS = TOTAL_CHIT_VALUE / FIXED_MONTHLY_PAYMENT; // 50 Months

const Container = styled.div`
  display: flex;
  min-height: 100vh;
`;

const Main = styled.main`
  flex: 1;
  padding: 20px;
  background-color: ${colors.lightPurple};
`;

const SectionTitle = styled.h2`
  color: ${colors.darkPurple};
  margin-bottom: 20px;
`;

// UPDATED STYLING: Changed from grid to flex with nowrap for single-line display
const CardsContainer = styled.div`
  display: flex;
  flex-wrap: nowrap; /* Forces all cards onto one line */
  gap: 20px;
  overflow-x: auto; /* Allows horizontal scrolling if the screen is too narrow */
  margin-top: 20px;
  margin-bottom: 20px;
  padding-bottom: 10px; /* Ensure space for scrollbar visibility */
`;

// Details container remains the same, ensuring good spacing
const ChitFundDetails = styled.div`
  display: flex;
  flex-wrap: wrap; 
  gap: 20px 30px; 
  margin-bottom: 30px;
  font-size: 1.1rem;
  color: ${colors.darkPurple};
  
  & > div {
    white-space: nowrap; 
    font-weight: 600;
  }
`;

interface ChitFundSummary {
  name: string;
  totalValue: number;
  monthlyPayment: number; 
  totalMonths: number; 
  paymentsMade: number; 
  paymentsRemaining: number; 
  totalCapitalContributed: number; 
  lastDividend: number; 
}

const initialChitFund: ChitFundSummary = {
  name: "MSIL 25L - 50M", 
  totalValue: TOTAL_CHIT_VALUE, 
  monthlyPayment: FIXED_MONTHLY_PAYMENT, 
  totalMonths: TOTAL_MONTHS,
  paymentsMade: 0,
  paymentsRemaining: TOTAL_MONTHS,
  totalCapitalContributed: 0,
  lastDividend: 0, 
};

const TransactionsPage: React.FC = () => {
  const [chitFundTransactions, setChitFundTransactions] = useState<Transaction[]>([]); 
  const [loading, setLoading] = useState(true);
  const [totalDividendReceived, setTotalDividendReceived] = useState(0); 
  const [deleteMessage, setDeleteMessage] = useState<string | null>(null);

  const [fund, setFund] = useState(initialChitFund);

  const fetchData = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    let dividendSum = 0; 
    let paymentsCount = 0;

    try {
        const transactionsCollectionRef = collection(db, "users", user.uid, "transactions");
        const q = query(transactionsCollectionRef, where("category", "==", "Chit Funds")); 
        const snapshot = await getDocs(q);

        const list: Transaction[] = snapshot.docs.map(doc => {
            const data = doc.data();
            paymentsCount++; 
            
            if (data.chitFund) {
                const dividend = data.chitFund.dividendReceived || 0;
                dividendSum += dividend; 
            }
            
            return {
                id: doc.id, 
                amount: data.amount,
                type: data.type,
                date: data.date,
                description: data.description,
                category: data.category,
                chitFund: data.chitFund
            } as Transaction;
        });
        
        list.sort((a, b) => b.date.localeCompare(a.date));

        const mostRecentDividend = list.find(t => (t as any).chitFund?.dividendReceived > 0);
        const lastDividend = mostRecentDividend ? (mostRecentDividend as any).chitFund.dividendReceived : 0;
        
        const paymentsRemaining = TOTAL_MONTHS - paymentsCount;
        const totalCapitalContributed = paymentsCount * FIXED_MONTHLY_PAYMENT;

        setChitFundTransactions(list);
        setTotalDividendReceived(dividendSum);
        setFund(prev => ({ 
            ...prev, 
            lastDividend: lastDividend,
            paymentsMade: paymentsCount,
            paymentsRemaining: paymentsRemaining > 0 ? paymentsRemaining : 0,
            totalCapitalContributed: totalCapitalContributed,
        })); 

    } catch (error) {
        console.error("Error fetching Chit Fund transactions:", error);
        setDeleteMessage("Failed to load data.");
    } finally {
        setLoading(false);
    }
  }, []);
  
  const handleDeleteTransaction = useCallback(async (id: string) => {
    const user = auth.currentUser;
    if (!user) {
        setDeleteMessage("Authentication required to delete transactions.");
        return;
    }
    
    if (!window.confirm("Are you sure you want to delete this Chit Fund payment? This action cannot be undone.")) {
        return;
    }

    setLoading(true);
    setDeleteMessage(null);

    try {
        const transactionRef = doc(db, "users", user.uid, "transactions", id);
        await deleteDoc(transactionRef);
        setDeleteMessage("Transaction deleted successfully!");
        fetchData(); 
    } catch (error) {
        console.error("Error deleting transaction:", error);
        setDeleteMessage("Failed to delete transaction. Please try again.");
    } finally {
        setLoading(false);
    }
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) return <div>Loading Chit Fund data...</div>;

  return (
    <>
      <GlobalStyle />
      <Container>
        <Sidebar />
        <Main>
          <SectionTitle>MSIL Chit Funds Manager ({fund.name})</SectionTitle> 
          
          {/* FIXED: Removed ** symbols from the values */}
          <ChitFundDetails>
            <div>Target Value: ₹{fund.totalValue.toLocaleString()}</div>
            <div>Fixed Monthly Payment: ₹{fund.monthlyPayment.toLocaleString()}</div>
            <div>Total Months: {fund.totalMonths}</div>
          </ChitFundDetails>
          
          {/* UPDATED: CardsContainer is now flex/nowrap */}
          <CardsContainer>
            <SummaryCard
              title={`Payments Completed`}
              value={fund.paymentsMade}
              bgColor={colors.purple}
            />
            <SummaryCard
              title="Months Remaining" 
              value={fund.paymentsRemaining}
              bgColor={colors.darkPurple}
            />
            <SummaryCard
              title="Total Capital Contributed"
              value={`₹${fund.totalCapitalContributed.toLocaleString()}`}
              bgColor={colors.orange} 
            />
            <SummaryCard
              title="Total Profit (Dividend Received)"
              value={`₹${totalDividendReceived.toLocaleString()}`}
              bgColor={colors.purple} 
            />
            <SummaryCard
              title="Last Dividend Received"
              value={`₹${fund.lastDividend.toLocaleString()}`}
              bgColor={colors.darkPurple} 
            />
          </CardsContainer>
          
          <SectionTitle style={{ marginTop: 40 }}>Record New Payment</SectionTitle>
          <AddChitFundForm onTransactionAdded={fetchData} />
          {deleteMessage && <p style={{ color: deleteMessage.includes("success") ? "green" : "red", marginTop: 10 }}>{deleteMessage}</p>}

          <SectionTitle style={{ marginTop: 40 }}>Chit Fund Payment History</SectionTitle>
          <TransactionTable 
            transactions={chitFundTransactions} 
            title="Historical Chit Fund Payments" 
            onDelete={handleDeleteTransaction}
          />
          
        </Main>
      </Container>
    </>
  );
};

export default TransactionsPage;