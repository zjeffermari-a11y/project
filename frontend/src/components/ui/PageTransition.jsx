import { motion } from 'framer-motion';

const pageVariants = {
  initial: { opacity: 0, scale: 0.95, y: 15 },
  animate: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: { type: "spring", stiffness: 350, damping: 20, bounce: 0.5, mass: 0.8 }
  },
  exit: { 
    opacity: 0, 
    scale: 1.02, 
    y: -10,
    transition: { ease: "easeInOut", duration: 0.2 }
  }
};

export default function PageTransition({ children, className = "min-h-full w-full" }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={className}
    >
      {children}
    </motion.div>
  );
}
