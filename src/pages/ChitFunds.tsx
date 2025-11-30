// src/pages/Home.tsx
import React, { useEffect, useState } from "react";
import styled from "styled-components";
import Sidebar from "../components/Sidebar";
import SummaryCard from "../components/SummaryCard";
import { colors, GlobalStyle } from "../styles/global";
import IncomeExpenseChart from "../components/IncomeExpenseChart";
import { auth, db } from "../firebase/config";
import { collection, query, getDocs } from "firebase/firestore";

const Container = styled.div`
  display: flex;
  min-height: 100vh;
`;

const Main = styled.main`
  flex: 1;
  padding: 20px;
  background-color: ${colors.lightPurple};
`;

const CardsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-top: 20px;
`;

const Section = styled.div`
  margin-top: 40px;
`;

interface Txn {
  amount: number;
  type: "income" | "expense";
  date: string;
  category: string; 
  // NEW: Optional field for Chit Fund details to read the dividend
  chitFund?: {
      beatAmount: number;
      dividendReceived: number;
      amountPaid: number;
  };
}

const Home: React.FC = () => {
  const [transactions, setTransactions] = useState<Txn[]>([]);
  const [loading, setLoading] = useState(true);

  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [totalChitFundPaid, setTotalChitFundPaid] = useState(0); 
  const [totalDividendReceived, setTotalDividendReceived] = useState(0); // NEW State for Profit

  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const transactionsCollectionRef = collection(db, "users", user.uid, "transactions");
      const q = query(transactionsCollectionRef);
      const snapshot = await getDocs(q);

      const list: Txn[] = [];
      let income = 0;
      let expense = 0;
      let chitFundPaid = 0; 
      let dividendReceivedSum = 0; // NEW Variable

      snapshot.forEach((doc) => {
        const data = doc.data();
        const txn: Txn = {
          amount: data.amount,
          type: data.type,
          date: data.date,
          category: data.category, 
          chitFund: data.chitFund, // Extract chitFund data if present
        };

        list.push(txn);

        if (txn.type === "income") income += txn.amount;
        if (txn.type === "expense") {
            expense += txn.amount;
            // Track Chit Funds Payments
            if (txn.category === "Chit Funds") {
                chitFundPaid += txn.amount;
                // NEW: Track Dividend Received (Profit)
                if (txn.chitFund && txn.chitFund.dividendReceived) {
                    dividendReceivedSum += txn.chitFund.dividendReceived;
                }
            }
        }
      });

      setTransactions(list);
      setTotalIncome(income);
      setTotalExpense(expense);
      setTotalChitFundPaid(chitFundPaid); 
      setTotalDividendReceived(dividendReceivedSum); // Set new state
      setLoading(false);
    };

    fetchData();
  }, []);

  // Build chart data grouped by date
  const chartData = Object.values(
    transactions.reduce((acc, txn) => {
      if (!acc[txn.date]) {
        acc[txn.date] = { date: txn.date, income: 0, expense: 0 };
      }
      if (txn.type === "income") acc[txn.date].income += txn.amount;
      if (txn.type === "expense") acc[txn.date].expense += txn.amount;
      return acc;
    }, {} as Record<string, { date: string; income: number; expense: number }>)
  );

  if (loading) return <div>Loading dashboard...</div>;

  return (
    <>
      <GlobalStyle />
      <Container>
        <Sidebar />
        <Main>
          <h1 style={{ color: colors.darkPurple }}>Dashboard</h1>
          <p>Here is your financial summary:</p>

          <CardsContainer>
            <SummaryCard
              title="Total Income"
              value={`₹${totalIncome.toLocaleString()}`}
              bgColor={colors.purple}
            />
            <SummaryCard
              title="Total Expense"
              value={`₹${totalExpense.toLocaleString()}`}
              bgColor={colors.orange}
            />
            <SummaryCard
              title="Total Chit Fund Net Paid" 
              value={`₹${totalChitFundPaid.toLocaleString()}`} 
              bgColor={colors.darkPurple}
            />
            {/* NEW: Chit Fund Profit Card */}
            <SummaryCard
              title="Chit Fund Profit (Total Dividend)" 
              value={`₹${totalDividendReceived.toLocaleString()}`} 
              bgColor={colors.purple}
            />
            <SummaryCard
              title="Net Balance"
              value={`₹${(totalIncome - totalExpense).toLocaleString()}`} 
              bgColor={colors.orange}
            />
          </CardsContainer>

          <Section>
            <IncomeExpenseChart data={chartData} />
          </Section>
          
          <Section>
            <h2 style={{ color: colors.darkPurple }}>Investment Tracking Note</h2>
            <p>Your transactions are now categorized as **'Investments'**, **'Investment Principal'**, and **'Investments Income'**. Use the **Transactions & Chit Funds** page to view the raw data. This allows you to track investments through categorization.</p>
          </Section>
        </Main>
      </Container>
    </>
  );
};

export default Home;