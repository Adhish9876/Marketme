"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

const CYCLES_PER_LETTER = 2;
const SHUFFLE_TIME = 50;
const CHARS = "!@#$%^&*():{};|,.<>/?";

export default function EncryptButton({ href, children, className = "" }) {
  const intervalRef = useRef(null);
  const TARGET_TEXT = children;
  const [text, setText] = useState(TARGET_TEXT);

  const scramble = () => {
    let pos = 0;

    intervalRef.current = setInterval(() => {
      const scrambled = TARGET_TEXT.split("").map((char, index) => {
        if (pos / CYCLES_PER_LETTER > index) return char;

        return CHARS[Math.floor(Math.random() * CHARS.length)];
      }).join("");

      setText(scrambled);
      pos++;

      if (pos >= TARGET_TEXT.length * CYCLES_PER_LETTER) stopScramble();
    }, SHUFFLE_TIME);
  };

  const stopScramble = () => {
    clearInterval(intervalRef.current);
    setText(TARGET_TEXT);
  };

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.97 }}
      className={`inline-block ${className}`}
      onMouseEnter={scramble}
      onMouseLeave={stopScramble}
    >
      <Link
        href={href}
        className="relative block overflow-hidden rounded border border-gray-700 px-4 py-1.5 text-sm text-gray-300 font-mono uppercase"
      >
        {/* Text */}
        <span className="relative z-10">{text}</span>

        {/* Gradient Sweep */}
        <motion.span
          initial={{ y: "100%" }}
          animate={{ y: "-100%" }}
          transition={{
            repeat: Infinity,
            repeatType: "mirror",
            duration: 1,
            ease: "linear",
          }}
          className="absolute inset-0 z-0 scale-125 bg-gradient-to-t 
                     from-indigo-400/0 from-40% 
                     via-indigo-400/100 
                     to-indigo-400/0 to-60% 
                     opacity-0 transition-opacity duration-300
                     group-hover:opacity-100 pointer-events-none"
        />
      </Link>
    </motion.div>
  );
}
