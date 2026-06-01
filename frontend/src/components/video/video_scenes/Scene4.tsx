import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export function Scene4() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 200),
      setTimeout(() => setPhase(2), 600),
      setTimeout(() => setPhase(3), 1000),
      setTimeout(() => setPhase(4), 3200),
    ];
    return () => timers.forEach((t) => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-between px-[10vw]"
      initial={{ opacity: 0, rotateY: -90 }}
      animate={{ opacity: 1, rotateY: 0 }}
      exit={{ opacity: 0, rotateY: 90 }}
      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
      style={{ perspective: 2000 }}
    >
      <div className="w-[45vw] z-10">
        <motion.h2
          className="text-[5vw] font-black text-white leading-tight mb-6"
          initial={{ opacity: 0, x: -50 }}
          animate={phase >= 1 ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          THE ENGINE<br/>OF WEALTH.
        </motion.h2>

        <ul className="space-y-6">
          {[
            'P2P Wallet Transfers',
            'Full Platform Admin Control',
            'Instant Notifications',
          ].map((item, i) => (
            <motion.li
              key={item}
              className="flex items-center gap-4 text-[2vw] text-[#848e9c] font-medium"
              initial={{ opacity: 0, x: -20 }}
              animate={phase >= 2 ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
              transition={{ delay: i * 0.15, duration: 0.6 }}
            >
              <div className="w-8 h-8 rounded bg-[#1e2329] border border-[#2b3139] flex items-center justify-center">
                <div className="w-3 h-3 bg-[#f0b90b] rounded-sm" />
              </div>
              {item}
            </motion.li>
          ))}
        </ul>
      </div>

      <motion.div
        className="w-[40vw] relative"
        initial={{ opacity: 0, scale: 0.8, rotateZ: 10 }}
        animate={phase >= 3 ? { opacity: 1, scale: 1, rotateZ: 0 } : { opacity: 0, scale: 0.8, rotateZ: 10 }}
        transition={{ type: 'spring', stiffness: 150, damping: 25 }}
      >
        <div className="absolute inset-0 bg-[#f0b90b] rounded-full blur-[120px] opacity-20" />
        <img
          src={`${import.meta.env.BASE_URL}images/ai-core.png`}
          alt="AI Core"
          className="w-full object-contain relative z-10 drop-shadow-[0_20px_50px_rgba(240,185,11,0.3)]"
          style={{ animation: 'float 6s ease-in-out infinite' }}
        />
        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
          }
        `}</style>
      </motion.div>
    </motion.div>
  );
}