import { motion, AnimatePresence } from 'framer-motion';
import { useVideoPlayer } from '@/lib/video/hooks';
import { Scene1 } from './video_scenes/Scene1';
import { Scene2 } from './video_scenes/Scene2';
import { Scene3 } from './video_scenes/Scene3';
import { Scene4 } from './video_scenes/Scene4';
import { Scene5 } from './video_scenes/Scene5';

const SCENE_DURATIONS = {
  intro: 4000,
  features: 4500,
  platform: 4500,
  intelligence: 4000,
  outro: 4500,
};

// FinAi brand colors
// Background: #0b0e11
// Surface: #161a1e
// Gold/Yellow accent: #f0b90b
// Green (profit): #0ecb81

const bgShapes = [
  { x: '45vw', y: '40vh', scale: 2.5, opacity: 0.2 },
  { x: '10vw', y: '15vh', scale: 1.2, opacity: 0.15 },
  { x: '75vw', y: '60vh', scale: 1.8, opacity: 0.25 },
  { x: '20vw', y: '75vh', scale: 1, opacity: 0.2 },
  { x: '50vw', y: '50vh', scale: 3, opacity: 0.15 },
];

export default function VideoTemplate() {
  const { currentScene } = useVideoPlayer({ durations: SCENE_DURATIONS });

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#0b0e11] font-display">
      {/* Persistent Background Video */}
      <video
        className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-screen"
        src={`${import.meta.env.BASE_URL}videos/bg-network.mp4`}
        autoPlay
        muted
        loop
        playsInline
      />

      {/* Persistent Animated Gradient Background Layer */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute w-[800px] h-[800px] rounded-full blur-[100px]"
          style={{ background: 'radial-gradient(circle, #f0b90b 0%, transparent 60%)' }}
          animate={bgShapes[currentScene]}
          transition={{ duration: 2, ease: [0.22, 1, 0.36, 1] }}
        />
        <motion.div
          className="absolute w-[600px] h-[600px] rounded-full blur-[80px]"
          style={{ background: 'radial-gradient(circle, #0ecb81 0%, transparent 70%)' }}
          animate={{
            x: ['80vw', '20vw', '60vw', '10vw', '80vw'][currentScene],
            y: ['20vh', '70vh', '10vh', '50vh', '30vh'][currentScene],
            scale: [1, 1.5, 0.8, 1.2, 1][currentScene],
            opacity: [0.1, 0.15, 0.1, 0.2, 0.1][currentScene],
          }}
          transition={{ duration: 2, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>

      {/* Grid Pattern overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDQwIEwgNDAgNDAgTCA0MCAwIiBmaWxsPSJub25lIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4wMykiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-50" />

      {/* Persistent Midground Lines */}
      <motion.div
        className="absolute h-[2px] bg-[#f0b90b]"
        animate={{
          left: ['-10%', '10%', '50%', '30%', '0%'][currentScene],
          width: ['0%', '40%', '20%', '80%', '100%'][currentScene],
          top: ['40%', '80%', '20%', '60%', '50%'][currentScene],
          opacity: [0, 0.6, 0.4, 0.8, 1][currentScene],
        }}
        transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
      />
      <motion.div
        className="absolute w-[2px] bg-[#0ecb81]"
        animate={{
          top: ['-10%', '0%', '20%', '0%', '0%'][currentScene],
          height: ['0%', '100%', '60%', '100%', '0%'][currentScene],
          left: ['80%', '20%', '70%', '40%', '50%'][currentScene],
          opacity: [0, 0.3, 0.5, 0.2, 0][currentScene],
        }}
        transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
      />

      <AnimatePresence mode="popLayout">
        {currentScene === 0 && <Scene1 key="intro" />}
        {currentScene === 1 && <Scene2 key="features" />}
        {currentScene === 2 && <Scene3 key="platform" />}
        {currentScene === 3 && <Scene4 key="intelligence" />}
        {currentScene === 4 && <Scene5 key="outro" />}
      </AnimatePresence>
    </div>
  );
}