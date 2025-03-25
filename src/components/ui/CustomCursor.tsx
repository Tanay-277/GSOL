"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface CustomCursorProps {
  color?: string; // Color of the cursor
  glow?: boolean; // Whether to show glow or not
  size?: number; // Size of the cursor
  duration?: number; // Duration of the cursor animation
}

const CustomCursor: React.FC<CustomCursorProps> = ({
  color = "#f53b57", // Default color
  glow = true, // Default glow
  size = 20, // Default size
  duration = 0.5, // Default duration
}) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      requestAnimationFrame(() => {
        setMousePosition({
          x: e.clientX,
          y: e.clientY,
        });
        setIsVisible(true); // Show cursor when moving
      });
    };

    const handleMouseLeave = () => {
      setIsVisible(false); // Hide cursor when mouse leaves
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  const cursorVariants = {
    default: {
      x: mousePosition.x - size / 2, // Adjust for cursor size
      y: mousePosition.y - size / 2,
      transition: {
        duration: duration,
      },
    },
  };

  return (
    isVisible && ( // Render only if visible
      <motion.div
        className={`pointer-events-none absolute left-0 top-0 z-50 rounded-full ${
          glow ? "glow" : ""
        }`}
        variants={cursorVariants}
        animate="default"
        style={{
          width: size,
          height: size,
          backgroundColor: color,
          boxShadow: glow ? `0 0 20px ${color}, 0 0 60px ${color}` : "none", // Apply glow if enabled
        }}
      />
    )
  );
};

export default CustomCursor;
