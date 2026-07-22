"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp } from "lucide-react";

export function BackToTop() {
  const [visible, setVisible] = useState(false);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);
  const scrollDirection = useRef<"up" | "down">("down");

  const updatePosition = useCallback(() => {
    const currentScrollY = window.scrollY;

    // Detect scroll direction
    if (currentScrollY > lastScrollY.current) {
      scrollDirection.current = "down";
    } else {
      scrollDirection.current = "up";
    }
    lastScrollY.current = currentScrollY;

    // Show button when scrolled 400px+ and scrolling down
    const shouldShow = currentScrollY > 400 && scrollDirection.current === "down";
    setVisible(shouldShow);

    ticking.current = false;
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", () => {
      if (!ticking.current) {
        window.requestAnimationFrame(updatePosition);
        ticking.current = true;
      }
    }, { passive: true });

    return () => {
      window.removeEventListener("scroll", updatePosition);
    };
  }, [updatePosition]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 10 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-40 sm:bottom-6 sm:right-6 bottom-4 right-4 sm:w-11 sm:h-11 w-9 h-9 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/30 hover:from-amber-600 hover:to-orange-700 active:scale-95 transition-shadow duration-200 flex items-center justify-center group"
          aria-label="Back to top"
        >
          <ArrowUp className="h-4 w-4 sm:h-[18px] sm:w-[18px] group-hover:-translate-y-0.5 transition-transform duration-200" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}