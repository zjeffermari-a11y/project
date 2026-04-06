import { AnimatePresence, motion } from 'framer-motion';
import logoutVideo from '../../assets/logout.mp4';

export default function LogoutOverlay({ isOpen, userName = "User" }) {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div 
                    initial={{ opacity: 0, backdropFilter: "blur(0px)" }} 
                    animate={{ opacity: 1, backdropFilter: "blur(8px)" }} 
                    exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0 z-[999] bg-slate-900/60 flex items-center justify-center"
                >
                    <motion.div 
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className="bg-white p-12 rounded-[2rem] shadow-2xl flex flex-col items-center border border-slate-100 max-w-md w-full mx-4 text-center relative overflow-hidden"
                    >
                        <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
                        <div className="w-48 mb-6 rounded-2xl overflow-hidden flex items-center justify-center relative">
                            <video 
                                src={logoutVideo} 
                                autoPlay 
                                loop 
                                muted 
                                playsInline 
                                className="w-full h-auto object-contain"
                            />
                        </div>
                        <h2 className="text-xl font-black text-slate-800 tracking-tight mb-2">Goodbye, {userName}!</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Securely logging out of the system...</p>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
