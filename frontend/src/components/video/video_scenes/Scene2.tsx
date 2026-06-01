import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export function Scene2() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 200),
      setTimeout(() => setPhase(2), 600),
      setTimeout(() => setPhase(3), 1200),
      setTimeout(() => setPhase(4), 1800),
      setTimeout(() => setPhase(5), 3600),
    ];
    return () => timers.forEach((t) => clearTimeout(t));
  }, []);

  const exchanges = ['Binance', 'Bybit', 'KuCoin', 'OKX', 'Kraken', 'Coinbase'];

  return (
    <motion.div
      className="absolute inset-0 flex flex-col justify-center pl-[10vw]"
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '-100%', opacity: 0 }}
      transition={{ duration: 1, ease: [0.76, 0, 0.24, 1] }}
    >
      <motion.div
        className="absolute right-0 top-0 bottom-0 w-[50vw] bg-gradient-to-l from-[#161a1e] to-transparent z-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: phase >= 1 ? 1 : 0 }}
        transition={{ duration: 1 }}
      />

      <div className="relative z-10 w-[50vw]">
        <motion.div
          className="w-16 h-2 bg-[#0ecb81] mb-8"
          initial={{ scaleX: 0, originX: 0 }}
          animate={phase >= 1 ? { scaleX: 1 } : { scaleX: 0 }}
          transition={{ duration: 0.6, ease: 'circOut' }}
        />

        <motion.h2
          className="text-[4.5vw] font-black leading-tight text-white mb-6"
          initial={{ opacity: 0, y: 50 }}
          animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          CONNECT<br/>EVERYTHING.
        </motion.h2>

        <motion.p
          className="text-[1.8vw] text-[#848e9c] mb-12"
          initial={{ opacity: 0 }}
          animate={phase >= 3 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.6 }}
        >
          One interface. Infinite liquidity.
        </motion.p>

        <div className="grid grid-cols-2 gap-4">
          {exchanges.map((exchange, i) => (
            <motion.div
              key={exchange}
              className="bg-[#1e2329] border border-[#2b3139] rounded-xl px-6 py-4 flex items-center justify-between"
              initial={{ opacity: 0, x: -30, scale: 0.9 }}
              animate={phase >= 4 ? { opacity: 1, x: 0, scale: 1 } : { opacity: 0, x: -30, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25, delay: i * 0.1 }}
            >
              <span className="text-[1.5vw] font-bold text-[#eaecef]">{exchange}</span>
              <div className="w-3 h-3 rounded-full bg-[#0ecb81] shadow-[0_0_10px_#0ecb81]" />
            </motion.div>
          ))}
        </div>
      </div>

      <motion.div
        className="absolute right-[10vw] top-[30vh] w-[30vw]"
        initial={{ opacity: 0, scale: 0.5, rotateY: 90 }}
        animate={phase >= 3 ? { opacity: 1, scale: 1, rotateY: -10 } : { opacity: 0, scale: 0.5, rotateY: 90 }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        style={{ perspective: 1000 }}
      >
        <img
          src={`${import.meta.env.BASE_URL}images/chart-up.png`}
          alt="3D Chart"
          className="w-full object-contain"
        />
      </motion.div>
    </motion.div>
  );
}