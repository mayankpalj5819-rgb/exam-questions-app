"use client";

import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface ConfettiProps {
  show: boolean;
}

interface Particle {
  id: number;
  left: number;
  delay: number;
  duration: number;
  size: number;
  color: string;
  shape: "rect" | "circle";
  rotationEnd: number;
}

const COLORS = [
  "bg-amber-400",
  "bg-amber-500",
  "bg-orange-400",
  "bg-orange-500",
  "bg-emerald-400",
  "bg-emerald-500",
  "bg-violet-400",
  "bg-violet-500",
  "bg-rose-400",
  "bg-rose-500",
];

function generateParticles(count: number): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.5,
      duration: 1.5 + Math.random() * 1.2,
      size: 6 + Math.random() * 6,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      shape: Math.random() > 0.5 ? "rect" : "circle",
      rotationEnd: (Math.random() - 0.5) * 720,
    });
  }
  return particles;
}

export function Confetti({ show }: ConfettiProps) {
  const particles = useMemo(() => generateParticles(40), []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="pointer-events-none fixed inset-0 z-[100] overflow-hidden"
        >
          {particles.map((p) => (
            <motion.div
              key={p.id}
              initial={{
                y: -20,
                x: `${p.left}vw`,
                rotate: 0,
                opacity: 1,
              }}
              animate={{
                y: "110vh",
                x: `${p.left + (Math.random() - 0.5) * 10}vw`,
                rotate: p.rotationEnd,
                opacity: [1, 1, 0],
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: p.duration,
                delay: p.delay,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
              className={`absolute top-0 ${p.color} ${
                p.shape === "rect" ? "rounded-sm" : "rounded-full"
              }`}
              style={{
                width: p.size,
                height: p.size * (p.shape === "rect" ? 0.6 : 1),
                left: `${p.left}%`,
              }}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}