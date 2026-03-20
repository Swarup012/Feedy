import React from "react";
import styled from "styled-components";

const LandingButton = ({ onClick }) => {
  return (
    <StyledWrapper>
      <div className="container-button" onClick={onClick}>
        <button type="button" />
      </div>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  .container-button {
    position: relative;
    padding: 0;
    width: 180px; 
    height: 55px;
    cursor: pointer;
    display: inline-block;
  }

  .container-button:active {
    transform: scale(0.95);
  }

  button {
    position: absolute;
    padding: 0;
    width: 180px;
    height: 55px;
    font-size: 16px; 
    border: 3px solid #2563eb;
    border-radius: 14px;
    background: transparent;
    font-weight: 900;
    transition: all 0.3s ease-in-out;
    cursor: pointer;
    top: 0;
    left: 0;
  }

  button:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
  }

  button::before {
    content: "";
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 180px;
    height: 55px;
    background-color: #3b82f6;
    border-radius: 14px;
    transition: all 0.3s ease-in-out;
    z-index: -1;
  }

  button:hover::before {
    background-color: #2563eb;
  }

  button::after {
    content: "Started Free";
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 180px;
    height: 55px;
    line-height: 55px;
    background-color: transparent;
    font-size: 16px;
    font-weight: 900;
    color: #ffffff;
    border: none;
    transition: all 0.3s ease-in-out;
    z-index: 2;
  }
`;

export default LandingButton;
