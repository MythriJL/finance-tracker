// src/components/TransactionTable.tsx
import React from "react";
import styled from "styled-components";
import { colors } from "../styles/global";
import { FaTrash } from "react-icons/fa";

export interface Transaction {
  id: string; // Crucial for deletion
  date: string;
  description: string;
  category: string;
  type: "income" | "expense";
  amount: number;
}

interface TransactionTableProps {
  transactions: Transaction[];
  title: string;
  onDelete: (id: string) => void; // New prop for delete functionality
}

const TableContainer = styled.div`
  background-color: ${colors.white};
  border-radius: 12px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  padding: 20px;
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 12px;

  th, td {
    padding: 12px;
    border-bottom: 1px solid #eee;
    text-align: left;
    white-space: nowrap; 
  }

  th {
    background-color: ${colors.lightPurple};
    color: ${colors.darkPurple};
    font-weight: 600;
  }
  
  tbody tr:hover {
    background-color: #f9f9f9;
  }
`;

const Amount = styled.td<{ type: "income" | "expense" }>`
  color: ${(props) => (props.type === "income" ? "green" : colors.orange)};
  font-weight: 600;
`;

const DeleteButton = styled.button`
    background: none;
    border: none;
    color: ${colors.orange};
    cursor: pointer;
    font-size: 1.1rem;
    padding: 5px;
    transition: color 0.2s;
    
    &:hover {
        color: ${colors.darkPurple};
    }
`;

const TransactionTable: React.FC<TransactionTableProps> = ({ transactions, title, onDelete }) => {
  return (
    <TableContainer>
      <h3>{title} ({transactions.length} entries)</h3>
      <Table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Description</th>
            <th>Category</th>
            <th>Type</th>
            <th>Amount</th>
            <th>Actions</th> {/* NEW COLUMN */}
          </tr>
        </thead>
        <tbody>
          {transactions.map((t) => (
            <tr key={t.id}>
              <td>{t.date}</td>
              <td>{t.description}</td>
              <td>{t.category}</td>
              <td>{t.type.charAt(0).toUpperCase() + t.type.slice(1)}</td>
              <Amount type={t.type}>
                {t.type === 'expense' ? '-' : ''}₹{t.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Amount>
              <td>
                <DeleteButton onClick={() => onDelete(t.id)} title="Delete Transaction">
                    <FaTrash />
                </DeleteButton>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      {transactions.length === 0 && <p style={{marginTop: '20px', textAlign: 'center'}}>No Chit Fund payments recorded yet.</p>}
    </TableContainer>
  );
};

export default TransactionTable;