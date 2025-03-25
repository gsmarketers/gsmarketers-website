import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Hero as UIHero } from './ui/Hero';
import { ButtonColorful } from './ui/button-colorful';

const Hero = () => {
  const navigate = useNavigate();

  return (
    <UIHero
      title={
        <>
          Struggling to land clients?
          <span className="block bg-gradient-to-r from-white/90 to-white/70 bg-clip-text text-transparent">
            We deliver 5-10 high-paying leads—guaranteed.
          </span>
        </>
      }
      subtitle="Stop chasing prospects. Let us handle your client acquisition while you focus on what matters."
      action={
        <ButtonColorful
          label="Get 5-10 Clients Now"
          onClick={() => navigate('/contact')}
          variant="hero"
          className="h-14 px-10 text-lg font-semibold tracking-wide"
        />
      }
      titleClassName="font-extrabold text-3xl sm:text-4xl md:text-5xl lg:text-5xl"
      subtitleClassName="text-lg md:text-xl text-white/80 max-w-2xl mx-auto"
      actionsClassName="mt-12"
    />
  );
};

export default Hero;
