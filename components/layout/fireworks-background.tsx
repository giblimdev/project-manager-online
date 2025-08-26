// components/fireworks-background.tsx
'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface Firework {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  speed: number;
}

// Couleurs plus vives et variées
const colors = [
  '#ff0000', '#ff4000', '#ff8000', '#ffbf00', '#ffff00', 
  '#bfff00', '#80ff00', '#40ff00', '#00ff00', '#00ff40',
  '#00ff80', '#00ffbf', '#00ffff', '#00bfff', '#0080ff',
  '#0040ff', '#0000ff', '#4000ff', '#8000ff', '#bf00ff',
  '#ff00ff', '#ff00bf', '#ff0080', '#ff0040', '#ff0000',
  '#ff3366', '#ff33cc', '#cc33ff', '#6633ff', '#3366ff',
  '#33ccff', '#33ffff', '#33ffcc', '#33ff66', '#66ff33',
  '#ccff33', '#ffff33', '#ffcc33', '#ff6633'
];

export default function FireworksBackground() {
  const [fireworks, setFireworks] = useState<Firework[]>([]);

  useEffect(() => {
    const createFirework = () => {
      const x = 10 + Math.random() * 80; // Éviter les bords
      const y = 10 + Math.random() * 60;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = 3 + Math.random() * 4;
      const speed = 0.8 + Math.random() * 0.7;
      
      const newFirework: Firework = {
        id: Date.now(),
        x,
        y,
        color,
        size,
        speed
      };

      setFireworks(prev => [...prev, newFirework]);

      // Supprimer le feu d'artifice après l'animation
      setTimeout(() => {
        setFireworks(prev => prev.filter(fw => fw.id !== newFirework.id));
      }, 4000);
    };

    // Démarrer avec quelques feux d'artifice
    for (let i = 0; i < 5; i++) {
      setTimeout(createFirework, i * 600);
    }

    // Intervalle plus fréquent pour plus de feux d'artifice
    const interval = setInterval(createFirework, 1000 + Math.random() * 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {fireworks.map((firework) => (
        <Firework key={firework.id} firework={firework} />
      ))}
    </div>
  );
}

function Firework({ firework }: { firework: Firework }) {
  const particles = Array.from({ length: 50 }, (_, i) => i);
  const angleIncrement = (Math.PI * 2) / particles.length;

  return (
    <div 
      className="absolute"
      style={{
        left: `${firework.x}%`,
        top: `${firework.y}%`,
      }}
    >
      {particles.map((_, index) => {
        const angle = angleIncrement * index;
        const distance = 40 + Math.random() * 30;
        const size = 2 + Math.random() * 2;
        const duration = 1.5 + Math.random() * 1.5;
        
        return (
          <motion.div
            key={index}
            className="absolute rounded-full"
            style={{
              backgroundColor: firework.color,
              width: `${size}px`,
              height: `${size}px`,
              boxShadow: `0 0 8px 2px ${firework.color}`,
            }}
            initial={{ 
              opacity: 0, 
              scale: 0,
              x: 0,
              y: 0
            }}
            animate={{ 
              opacity: [0, 1, 0.8, 0],
              scale: [0, 1, 0.8, 0],
              x: Math.cos(angle) * distance,
              y: Math.sin(angle) * distance
            }}
            transition={{ 
              duration: duration,
              ease: "easeOut"
            }}
          />
        );
      })}
      
      {/* Effet de lumière centrale plus prononcé */}
      <motion.div
        className="absolute rounded-full"
        style={{
          backgroundColor: firework.color,
          width: `${firework.size * 15}px`,
          height: `${firework.size * 15}px`,
          left: `-${firework.size * 7.5}px`,
          top: `-${firework.size * 7.5}px`,
          boxShadow: `0 0 30px 10px ${firework.color}`,
          filter: 'blur(4px)'
        }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: [0, 0.9, 0], scale: [0, 1, 0] }}
        transition={{ duration: 1.5 }}
      />
      
      {/* Traînée de particules secondaires */}
      {Array.from({ length: 15 }, (_, i) => (
        <motion.div
          key={`trail-${i}`}
          className="absolute rounded-full"
          style={{
            backgroundColor: firework.color,
            width: `${1 + Math.random() * 2}px`,
            height: `${1 + Math.random() * 2}px`,
            filter: 'blur(1px)'
          }}
          initial={{ 
            opacity: 0, 
            scale: 0,
            x: 0,
            y: 0
          }}
          animate={{ 
            opacity: [0, 0.7, 0],
            scale: [0, 1, 0],
            x: (Math.random() - 0.5) * 60,
            y: (Math.random() - 0.5) * 60
          }}
          transition={{ 
            duration: 2 + Math.random(),
            ease: "easeOut"
          }}
        />
      ))}
    </div>
  );
}