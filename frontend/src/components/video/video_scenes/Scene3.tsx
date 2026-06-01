import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export function Scene3() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 200),
      setTimeout(() => setPhase(2), 800),
      setTimeout(() => setPhase(3), 1500),
      setTimeout(() => setPhase(4), 3600),
    ];
    return () => timers.forEach((t) => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center"
      initial={{ scale: 1.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0, filter: 'blur(20px)' }}
      transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="text-center relative z-10 w-full max-w-[80vw]">
        <motion.div
          className="inline-block px-8 py-3 rounded-full border border-[#f0b90b]/30 bg-[#f0b90b]/10 mb-8 backdrop-blur-md"
          initial={{ opacity: 0, y: -20 }}
          animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <span className="text-[#f0b90b] text-[1.2vw] font-bold tracking-widest uppercase">Autonomous Bots</span>
        </motion.div>

        <motion.h2
          className="text-[7vw] font-black text-white leading-none tracking-tighter"
          initial={{ opacity: 0, scale: 0.9, rotateX: 20 }}
          animate={phase >= 2 ? { opacity: 1, scale: 1, rotateX: 0 } : { opacity: 0, scale: 0.9, rotateX: 20 }}
          transition={{ type: 'spring', stiffness: 200, damping: 30 }}
        >
          SLEEPS NEVER.<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#f0b90b] to-[#f6465d]">TRADES FOREVER.</span>
        </motion.h2>

        <div className="mt-16 flex justify-center gap-8">
          {[
            { label: 'Market Intelligence', val: 'REAL-TIME' },
            { label: 'Latency', val: '< 5ms' },
            { label: 'Uptime', val: '99.99%' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              className="bg-[#161a1e]/80 border border-[#2b3139] p-6 rounded-2xl min-w-[20vw] backdrop-blur-xl"
              initial={{ opacity: 0, y: 40 }}
              animate={phase >= 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
              transition={{ duration: 0.8, delay: i * 0.15, ease: 'circOut' }}
            >
              <div className="text-[#848e9c] text-[1.2vw] mb-2 uppercase font-semibold">{stat.label}</div>
              <div className="text-[#eaecef] text-[2.5vw] font-mono font-bold">{stat.val}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}