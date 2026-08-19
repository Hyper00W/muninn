"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import type { ProcessingStage } from "@/lib/types";

interface MuninnStatueProps {
  isProcessing?: boolean;
  processingStage?: ProcessingStage;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: { container: "w-16 h-16", image: 64 },
  md: { container: "w-48 h-48", image: 192 },
  lg: { container: "w-72 h-72", image: 288 },
};

export function MuninnStatue({
  isProcessing = false,
  processingStage = "idle",
  size = "md",
  className = "",
}: MuninnStatueProps) {
  const prefersReducedMotion = useReducedMotion();
  const dims = sizeMap[size];

  const shouldAnimate = isProcessing && !prefersReducedMotion;

  return (
    <div className={`relative ${dims.container} ${className}`}>
      {/* Halo ring */}
      <motion.div
        className="absolute inset-0 rounded-full border border-white/[0.08]"
        animate={
          shouldAnimate
            ? {
                scale: [1, 1.04, 1],
                opacity: [0.4, 0.7, 0.4],
                rotate: [0, 180, 360],
              }
            : { scale: 1, opacity: 0.3, rotate: 0 }
        }
        transition={{
          duration: 8,
          repeat: shouldAnimate ? Infinity : 0,
          ease: "linear",
        }}
      />

      {/* Outer glow pulse */}
      <motion.div
        className="absolute inset-[-8px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)",
        }}
        animate={
          shouldAnimate
            ? { opacity: [0.3, 0.6, 0.3], scale: [0.95, 1.05, 0.95] }
            : { opacity: 0.2, scale: 1 }
        }
        transition={{
          duration: 4,
          repeat: shouldAnimate ? Infinity : 0,
          ease: "easeInOut",
        }}
      />

      {/* Statue image with breathing motion */}
      <motion.div
        className="relative z-10 h-full w-full overflow-hidden rounded-full"
        animate={
          shouldAnimate
            ? { y: [0, -4, 0], scale: [1, 1.01, 1] }
            : { y: 0, scale: 1 }
        }
        transition={{
          duration: 5,
          repeat: shouldAnimate ? Infinity : 0,
          ease: "easeInOut",
        }}
      >
        <Image
          src="/images/muninn-statue.png"
          alt="MUNINN intelligence presence"
          width={dims.image}
          height={dims.image}
          className="h-full w-full object-cover object-top grayscale brightness-90 contrast-110"
          priority={size === "lg"}
        />

        {/* Scan line sweep during processing */}
        {shouldAnimate && (
          <motion.div
            className="pointer-events-none absolute inset-x-0 h-8 bg-gradient-to-b from-transparent via-white/10 to-transparent"
            animate={{ top: ["-10%", "110%"] }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
              repeatDelay: 1,
            }}
          />
        )}
      </motion.div>

      {/* Processing stage indicator dot */}
      {isProcessing && (
        <motion.div
          className="absolute -bottom-1 left-1/2 z-20 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-white"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          aria-hidden
        />
      )}

      <span className="sr-only">
        {isProcessing
          ? `MUNINN is processing: ${processingStage}`
          : "MUNINN idle"}
      </span>
    </div>
  );
}
