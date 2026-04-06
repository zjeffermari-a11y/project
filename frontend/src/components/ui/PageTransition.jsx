import { motion } from 'framer-motion';

const pageVariants = {
  initial: { opacity: 0, filter: 'blur(4px)' },
  animate: { 
    opacity: 1, 
    filter: 'blur(0px)',
    transition: { duration: 0.4, ease: "easeOut" }
  },
  exit: { 
    opacity: 0, 
    filter: 'blur(4px)',
    transition: { duration: 0.3, ease: "easeIn" }
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
