// src/components/SummaryCard.tsx
import React from "react";
import styled from "styled-components";
import { colors } from "../styles/global";

interface SummaryCardProps {
  title: string;
  value: string | number;
  bgColor?: string;
}

const Card = styled.div<{ bgColor?: string }>`
  background-color: ${(props) => props.bgColor || colors.white};
  color: ${colors.white};
  padding: 20px;
  border-radius: 12px;
  min-width: 180px;
  /* FIX: Removed 'flex: 1;' and 'margin: 10px;' to allow the parent grid (CardsContainer) to control layout and spacing for proper alignment. */
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
`;

const Title = styled.div`
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 10px;
`;

const Value = styled.div`
  font-size: 24px;
  font-weight: bold;
`;

const SummaryCard: React.FC<SummaryCardProps> = ({ title, value, bgColor }) => {
  return (
    <Card bgColor={bgColor}>
      <Title>{title}</Title>
      <Value>{value}</Value>
    </Card>
  );
};

export default SummaryCard;