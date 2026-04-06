import { motion } from 'framer-motion';

export default function LogoLoader({ size = "md", text = "Loading...", className = "" }) {
  const sizeClasses = {
    sm: "w-5 h-5",
    md: "w-16 h-16",
    lg: "w-24 h-24"
  };

  const isSmall = size === "sm";

  return (
    <div className={`flex flex-col items-center justify-center gap-4 ${className}`}>
      <motion.div 
        className={`${sizeClasses[size]} relative flex items-center justify-center`}
        initial={{ rotate: 0 }}
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
      >
        {/* Abstract geometries */}
        <motion.div 
          className={`absolute inset-0 rounded-full border-solid border-blue-500/30 border-t-blue-500 ${isSmall ? 'border-2' : 'border-4'}`}
          animate={{ scale: [1, 1.15, 1], rotate: [0, 180, 360] }}
          transition={{ repeat: Infinity, duration: 1.2, type: "spring", stiffness: 150, bounce: 0.6 }}
        />
        <motion.div 
          className={`absolute ${isSmall ? 'inset-1 border-2' : 'inset-2 border-4'} rounded-full border-solid border-indigo-500/20 border-b-indigo-500`}
          animate={{ scale: [1, 0.8, 1], rotate: [360, 180, 0] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
        />
        {/* Center node */}
        <div className={`${isSmall ? 'w-1 h-1' : 'w-2 h-2'} rounded-full bg-blue-600 animate-ping absolute`} />
      </motion.div>
      
      {text && !isSmall && (
        <motion.span 
          initial={{ opacity: 0.4, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ repeat: Infinity, duration: 1, ease: "easeInOut", repeatType: "reverse" }}
          className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 drop-shadow-sm"
        >
          {text}
        </motion.span>
      )}
    </div>
  );
}
