// src/components/Sidebar.tsx
import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import styled, { css } from "styled-components";
import { FaHome, FaUpload, FaBars } from "react-icons/fa";
import { colors } from "../styles/global";

// ----------------------------
// Prevent DOM errors here
// ----------------------------
const SidebarContainer = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== "collapsed"
})<{ collapsed: boolean }>`
  width: ${(props) => (props.collapsed ? "70px" : "220px")};
  background-color: ${colors.darkPurple};
  color: ${colors.white};
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
  min-height: 100vh;
  position: relative;

  @media (max-width: 600px) {
    width: ${(props) => (props.collapsed ? "56px" : "160px")};
    min-width: 0;
    align-items: flex-start;
    justify-content: flex-start;
  }
`;


const ToggleButton = styled.button`
  background: none;
  border: none;
  color: ${colors.orange};
  font-size: 1.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 10px 20px;   // <-- same as NavItem
  width: 100%;
  border-radius: 6px;

  &:focus,
  &:active {
    outline: none;
  }
  &:hover {
    opacity: 0.8;
    background-color: ${colors.purple};
  }
`;



// ----------------------------
// FIX: block collapsed from DOM
// ----------------------------
const NavItem = styled(NavLink).withConfig({
  shouldForwardProp: (prop) => prop !== "collapsed"
})<{ collapsed: boolean }>`
  color: ${colors.white};
  text-decoration: none;
  display: flex;
  align-items: center;
  padding: 10px 20px;
  border-radius: 6px;
  margin-bottom: 10px;
  font-size: 1rem;
  transition: all 0.2s ease;

  &.active {
    background-color: ${colors.purple};
    font-weight: bold;
  }

  &:hover {
    background-color: ${colors.purple};
  }

  svg {
    margin-right: ${(props) => (props.collapsed ? "0" : "10px")};
    font-size: 1.2rem;
    min-width: 20px;
    text-align: center;
  }

  span {
    white-space: nowrap;
    overflow: hidden;
    transition: opacity 0.2s ease;
    ${(props) =>
      props.collapsed &&
      css`
        display: none;
      `}
  }

  @media (max-width: 600px) {
    padding: 8px 8px;
    font-size: 0.95rem;
    margin-bottom: 6px;
    border-radius: 4px;
  }
`;


const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(true);

  return (
    <SidebarContainer collapsed={collapsed}>
      <ToggleButton onClick={() => setCollapsed(!collapsed)}>
        <FaBars />
      </ToggleButton>

      <NavItem to="/" end collapsed={collapsed}>
        <FaHome />
        <span>Dashboard</span>
      </NavItem>

      <NavItem to="/upload" collapsed={collapsed}>
        <FaUpload />
        <span>Upload</span>
      </NavItem>
    </SidebarContainer>
  );
};

export default Sidebar;
