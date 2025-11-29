// src/components/IncomeExpenseChart.tsx
import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import styled from "styled-components";
import { colors } from "../styles/global";

interface ChartData {
  date: string;
  income: number;
  expense: number;
}

interface IncomeExpenseChartProps {
  data: ChartData[];
}

const ChartContainer = styled.div`
  width: 100%;
  height: 300px;
  background-color: ${colors.white};
  border-radius: 12px;
  padding: 20px;
  margin-top: 20px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);

  @media (max-width: 600px) {
    height: 220px;
    padding: 8px;
    margin-top: 10px;
    border-radius: 8px;
  }
`;

const IncomeExpenseChart: React.FC<IncomeExpenseChartProps> = ({ data }) => {
  return (
    <ChartContainer>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid stroke="#f5f5f5" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="income" stroke={colors.purple} />
          <Line type="monotone" dataKey="expense" stroke={colors.orange} />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

export default IncomeExpenseChart;
