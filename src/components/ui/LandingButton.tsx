import React from "react";
import styled from "styled-components";

const LandingButton = ({ onClick }) => {
  return (
    <StyledWrapper>
      <div className="container-button" onClick={onClick}>
        <div className="hover bt-1" />
        <div className="hover bt-2" />
        <div className="hover bt-3" />
        <div className="hover bt-4" />
        <div className="hover bt-5" />
        <div className="hover bt-6" />
        <button type="button" />
      </div>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  .container-button {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    grid-template-rows: 1fr 1fr;
    grid-template-areas:
      "bt-1 bt-2 bt-3"
      "bt-4 bt-5 bt-6";
    position: relative;
    perspective: 800px;
    padding: 0;
    /* --- SIZE UPDATED --- */
    width: 220px; 
    height: 75px;
    /* -------------------- */
    transition: all 0.3s ease-in-out;
  }

  .container-button:active {
    transform: scale(0.95);
  }

  .hover {
    position: absolute;
    width: 100%;
    height: 100%;
    z-index: 200;
    cursor: pointer; /* Ensures the hand icon appears */
  }

  .bt-1 { grid-area: bt-1; }
  .bt-2 { grid-area: bt-2; }
  .bt-3 { grid-area: bt-3; }
  .bt-4 { grid-area: bt-4; }
  .bt-5 { grid-area: bt-5; }
  .bt-6 { grid-area: bt-6; }

  .bt-1:hover ~ button {
    transform: rotateX(15deg) rotateY(-15deg);
    box-shadow: -2px -2px #1e3a8a88;
  }

  .bt-1:hover ~ button::after {
    animation: shake 0.5s ease-in-out 0.3s;
    text-shadow: -2px -2px #1e3a8a88;
  }

  .bt-3:hover ~ button {
    transform: rotateX(15deg) rotateY(15deg);
    box-shadow: 2px -2px #1e3a8a88;
  }

  .bt-3:hover ~ button::after {
    animation: shake 0.5s ease-in-out 0.3s;
    text-shadow: 2px -2px #1e3a8a88;
  }

  .bt-4:hover ~ button {
    transform: rotateX(-15deg) rotateY(-15deg);
    box-shadow: -2px 2px #1e3a8a88;
  }

  .bt-4:hover ~ button::after {
    animation: shake 0.5s ease-in-out 0.3s;
    text-shadow: -2px 2px #1e3a8a88;
  }

  .bt-6:hover ~ button {
    transform: rotateX(-15deg) rotateY(15deg);
    box-shadow: 2px 2px #1e3a8a88;
  }

  .bt-6:hover ~ button::after {
    animation: shake 0.5s ease-in-out 0.3s;
    text-shadow: 2px 2px #1e3a8a88;
  }

  .hover:hover ~ button::before {
    background: transparent;
  }

  .hover:hover ~ button::after {
    content: "Sign-Up";
    top: -150%;
    transform: translate(-50%, 0);
    font-size: 40px; /* Slightly larger on hover */
    color: #93c5fd;
  }

  button {
    position: absolute;
    padding: 0;
    /* --- SIZE UPDATED --- */
    width: 220px;
    height: 75px;
    font-size: 22px; 
    border: 4px solid #2563eb; /* Slightly thicker border */
    border-radius: 18px;
    /* -------------------- */
    background: transparent;
    font-weight: 900;
    transition: all 0.3s ease-in-out;
  }

  button::before {
    content: "";
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    /* --- SIZE UPDATED --- */
    width: 220px;
    height: 75px;
    background-color: #3b82f6;
    border-radius: 18px;
    /* -------------------- */
    transition: all 0.3s ease-in-out;
    z-index: -1;
  }

  button::after {
    content: "Started Free";
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    /* --- SIZE UPDATED --- */
    width: 220px;
    height: 75px;
    line-height: 75px;
    /* -------------------- */
    background-color: transparent;
    font-size: 20px; /* Text size */
    font-weight: 900;
    color: #ffffff;
    border: none;
    transition: all 0.3s ease-in-out;
    z-index: 2;
  }

  @keyframes shake {
    0% { left: 45%; }
    25% { left: 54%; }
    50% { left: 48%; }
    75% { left: 52%; }
    100% { left: 50%; }
  }
`;

export default LandingButton;
