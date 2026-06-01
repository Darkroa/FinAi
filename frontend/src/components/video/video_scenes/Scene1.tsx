import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export function Scene1() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 200),
      setTimeout(() => setPhase(2), 800),
      setTimeout(() => setPhase(3), 1600),
      setTimeout(() => setPhase(4), 3200),
    ];
    return () => timers.forEach((t) => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center"
      initial={{ clipPath: 'circle(0% at 50% 50%)' }}
      animate={{ clipPath: 'circle(150% at 50% 50%)' }}
      exit={{ clipPath: 'circle(0% at 50% 50%)', opacity: 0 }}
      transition={{ duration: 1.5, ease: [0.76, 0, 0.24, 1] }}
    >
      <div className="relative z-10 flex flex-col items-center text-center">
        <motion.div
          className="mb-6 flex items-center gap-4"
          initial={{ opacity: 0, y: 30 }}
          animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <div className="w-12 h-12 bg-[#f0b90b] rounded-lg shadow-[0_0_30px_rgba(240,185,11,0.5)] flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L22 7L12 12L2 7L12 2Z" fill="#0b0e11" />
              <path d="M2 17L12 22L22 17" stroke="#0b0e11" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="#0b0e11" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="text-[3vw] font-black text-white tracking-widest uppercase">FIN<span className="text-[#f0b90b]">AI</span></span>
        </motion.div>

        <h1 className="text-[6vw] font-black leading-[1.1] tracking-tighter text-[#eaecef]">
          {'TRADE'.split('').map((char, i) => (
            <motion.span
              key={i}
              className="inline-block"
              initial={{ opacity: 0, y: 100, rotateX: -90 }}
              animate={phase >= 2 ? { opacity: 1, y: 0, rotateX: 0 } : { opacity: 0, y: 100, rotateX: -90 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20, delay: i * 0.05 }}
            >
              {char}
            </motion.span>
          ))}
          <br />
          {'SMARTER'.split('').map((char, i) => (
            <motion.span
              key={i}
              className="inline-block text-[#0ecb81]"
              initial={{ opacity: 0, y: 100, rotateX: -90 }}
              animate={phase >= 2 ? { opacity: 1, y: 0, rotateX: 0 } : { opacity: 0, y: 100, rotateX: -90 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.3 + i * 0.05 }}
            >
              {char}
            </motion.span>
          ))}
        </h1>

        <motion.p
          className="mt-8 text-[1.8vw] text-[#848e9c] max-w-[60vw] font-mono"
          initial={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
          animate={phase >= 3 ? { opacity: 1, scale: 1, filter: 'blur(0px)' } : { opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          AI-powered execution across 6 major exchanges.
        </motion.p>
      </div>
    </motion.div>
  );
}