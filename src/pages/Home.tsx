// src/pages/Home.tsx
import React, { useEffect, useState } from "react";
import styled from "styled-components";
import Sidebar from "../components/Sidebar";
import SummaryCard from "../components/SummaryCard";
import { colors, GlobalStyle } from "../styles/global";
import IncomeExpenseChart from "../components/IncomeExpenseChart";
import { auth, db } from "../firebase/config";
import { collection, query, where, getDocs } from "firebase/firestore";

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
}

const Home: React.FC = () => {
  const [transactions, setTransactions] = useState<Txn[]>([]);
  const [loading, setLoading] = useState(true);

  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      // Assuming collection is: transactions (root)
      const transactionsCollectionRef = collection(db, "users", user.uid, "transactions");
      console.log("Fetching transactions for user:", user.uid);
      const q = query(transactionsCollectionRef);
      console.log("Constructed query:", q);
      const snapshot = await getDocs(q);

      const list: Txn[] = [];
      let income = 0;
      
      let expense = 0;

      snapshot.forEach((doc) => {
        console.log("Fetched transaction:", doc.id, doc.data());
        const data = doc.data();
        const txn: Txn = {
          amount: data.amount,
          type: data.type,
          date: data.date,
        };

        list.push(txn);

        if (txn.type === "income") income += txn.amount;
        if (txn.type === "expense") expense += txn.amount;
      });

      setTransactions(list);
      setTotalIncome(income);
      setTotalExpense(expense);
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
              value={`₹${totalIncome}`}
              bgColor={colors.purple}
            />
            <SummaryCard
              title="Total Expense"
              value={`₹${totalExpense}`}
              bgColor={colors.orange}
            />
            <SummaryCard
              title="Chit Fund"
              value={`₹0`} // update when you have rules
              bgColor={colors.darkPurple}
            />
          </CardsContainer>

          <Section>
            <IncomeExpenseChart data={chartData} />
          </Section>
        </Main>
      </Container>
    </>
  );
};

export default Home;
