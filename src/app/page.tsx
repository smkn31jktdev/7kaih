"use client";

import Navbar from "./components/navbar";
import Hero from "./components/hero";
import { motion } from "motion/react";

const HomePage = () => {
  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Navbar />
      <Hero />
    </motion.main>
  );
};

export default HomePage;
