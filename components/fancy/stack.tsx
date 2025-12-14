"use client";

import dynamic from "next/dynamic";

function StackContent() {
  return (
    <>
      <style>{`
        * {
          border: 0;
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        :root {
          --hue: 0;
          --primary100: #ffffff;
          --primary300: #dc2626;
          --primary500: #991b1b;
          --trans-dur: 0.3s;
          font-size: clamp(1rem, 0.95rem + 0.25vw, 1.25rem);
          color-scheme: light dark;
        }

        .stack-wrapper {
          background: none !important;
          color: var(--primary100);
          font: 1em/1.5 sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          height: auto;
          width: 100%;
          padding: 0;
          margin: 0;
        }

        .stack {
          --stack-dur: 2s;
          --stack-delay: 0.05;
          --stack-spacing: 15%;

          overflow: hidden;
          position: relative;
          width: 7em;
          height: 18em;
        }

        .stack__card {
          aspect-ratio: 1;
          position: absolute;
          inset: 0;
          top: var(--stack-spacing);
          margin: auto;
          width: 70%;
          transform: rotateX(45deg) rotateZ(-45deg);
          transform-style: preserve-3d;
        }

        .stack__card::before {
          animation: card var(--stack-dur) ease-in-out infinite;
          background-color: var(--primary500);
          border-radius: 7.5%;
          box-shadow: -0.5em 0.5em 1.5em rgba(0,0,0,0.1);
          content: "";
          display: block;
          position: absolute;
          inset: 0;
        }

        .stack__card:nth-child(2) {
          top: 0;
        }

        .stack__card:nth-child(2)::before {
          animation-delay: calc(var(--stack-dur) * (-1 + var(--stack-delay)));
          background-color: var(--primary300);
        }

        .stack__card:nth-child(3) {
          top: calc(var(--stack-spacing) * -1);
        }

        .stack__card:nth-child(3)::before {
          animation-delay: calc(var(--stack-dur) * (-1 + var(--stack-delay) * 2));
          background-color: var(--primary100);
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 16 16' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M8 0L1.03553 6.96447C0.372492 7.62751 0 8.52678 0 9.46447V9.54584C0 11.4535 1.54648 13 3.45416 13C4.1361 13 4.80278 12.7981 5.37019 12.4199L7.125 11.25L6 15V16H10V15L8.875 11.25L10.6298 12.4199C11.1972 12.7981 11.8639 13 12.5458 13C14.4535 13 16 11.4535 16 9.54584V9.46447C16 8.52678 15.6275 7.62751 14.9645 6.96447L8 0Z' fill='rgba(0,0,0,0.9)'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: center;
          background-size: 45% 45%;
        }

        @keyframes card {
          0%, 100% {
            transform: translateZ(0);
            opacity: 1;
          }
          11% {
            opacity: 1;
            transform: translateZ(0.125em);
          }
          34% {
            opacity: 0;
            transform: translateZ(-12em);
          }
          48% {
            opacity: 0;
            transform: translateZ(12em);
          }
          57% {
            opacity: 1;
            transform: translateZ(0);
          }
          61% {
            transform: translateZ(-1.8em);
          }
          74% {
            transform: translateZ(0.6em);
          }
          87% {
            transform: translateZ(-0.2em);
          }
        }
      `}</style>

      <div className="stack-wrapper">
        <div className="stack">
          <div className="stack__card"></div>
          <div className="stack__card"></div>
          <div className="stack__card"></div>
        </div>
      </div>
    </>
  );
}

export default dynamic(() => Promise.resolve(StackContent), { ssr: false });
