import React from 'react';
import { motion } from 'framer-motion';
import { Linkedin, Instagram } from 'lucide-react';
import { ShimmerText } from '@/components/ui/shimmer-text';
import Particles from '@/components/ui/Particles';
import { GlowEffect } from '@/components/ui/glow-effect';

const socialLinks = [
  {
    name: "LinkedIn",
    href: 'https://www.linkedin.com/in/mrmtsenga/',
    icon: Linkedin,
    gradientStyle: {
      background: 'linear-gradient(-45deg, #0077B5, #00A0DC, #ffffff, #0077B5)',
      backgroundSize: '300% 300%',
      animation: 'linkedinGradient 12s ease infinite'
    },
    glowColors: ['#0077B5', '#0077B5']
  },
  {
    name: "Instagram",
    href: 'https://www.instagram.com/mrmtsenga/',
    icon: Instagram,
    gradientStyle: {
      background: 'linear-gradient(-45deg, #E4405F, #833AB4, #ffffff, #E4405F)',
      backgroundSize: '300% 300%',
      animation: 'instagramGradient 12s ease infinite'
    },
    glowColors: ['#833AB4', '#833AB4']
  },
  {
    name: "X/Twitter",
    href: 'https://x.com/MrMtsenga',
    icon: () => <img src="/X_Icon.svg" alt="X" className="w-6 h-6 invert" />,
    gradientStyle: {
      background: 'linear-gradient(-45deg, #1A1A1A, #333333, #ffffff, #1A1A1A)',
      backgroundSize: '300% 300%',
      animation: 'xGradient 12s ease infinite'
    },
    glowColors: ['#333333', '#333333']
  }
];

const ContactPage = () => {
  return (
    <div className="min-h-screen pt-32 pb-16">
      <div className="absolute inset-0 z-0">
        <Particles
          particleColors={['#E0FFFF', '#F0FFFF']}
          particleCount={150}
          particleSpread={10}
          speed={0.05}
          particleBaseSize={100}
          moveParticlesOnHover={false}
          alphaParticles={false}
          disableRotation={false}
        />
      </div>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16 relative z-10"
        >
          <ShimmerText className="text-4xl md:text-5xl font-semibold mb-6 contact-shimmer">
            Message Us & Start Closing Clients Today
          </ShimmerText>
          <p className="text-lg text-white/60">
            Choose your preferred platform to connect with us
          </p>
          <style jsx global>{`
            .contact-shimmer.shimmer-text {
              --shimmer-color-start: #f1f5f9;
              --shimmer-color-mid: #22d3ee;
            }
          `}</style>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-col md:flex-row gap-4 justify-center items-stretch relative z-10"
        >
          {socialLinks.map((social, index) => (
            <div key={social.name} className="relative flex-1 min-w-[250px]">
              <GlowEffect
                colors={social.glowColors}
                mode="breathe"
                blur="none"
                duration={4}
                scale={1.03}
              />
              <motion.a
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.1 * (index + 1) }}
                className={`
                  flex items-center justify-center gap-3
                  px-6 py-4 rounded-2xl
                  hover:scale-[1.03]
                  transition-all duration-300
                  group relative
                  backdrop-blur-sm
                  w-full
                  ring-1 ring-white/30
                  hover:ring-2 hover:ring-white/40
                  shadow-[0_0_15px_rgba(0,0,0,0.2)]
                  hover:shadow-[0_0_20px_rgba(0,0,0,0.3)]
                `}
                style={social.gradientStyle}
              >
                <social.icon className="w-6 h-6 text-white" />
                <span className="text-lg font-medium text-white group-hover:text-white/90 transition-colors">
                  Contact us on {social.name}
                </span>
              </motion.a>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default ContactPage;