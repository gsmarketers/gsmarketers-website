import React from 'react';
import { ButtonColorful } from './ui/button-colorful';
import { Ripple } from './ui/ripple';

const CTASection = () => {
  return (
    <section className="pb-16 pt-24 relative overflow-hidden bg-gradient-to-b from-black via-purple-900/10 to-blue-900/20">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-900/30 to-blue-900/20 opacity-50" />
      <Ripple 
        className="opacity-100" 
        mainCircleSize={400}
        mainCircleOpacity={0.2}
        numCircles={8}
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <h2 className="text-4xl md:text-5xl font-semibold mb-6">
          Your Next High-Paying Client is One Message Away
        </h2>
        <p className="text-xl text-white/80 mb-8">
          Let's fill your pipeline with ready-to-buy leads. Custom pricing tailored to your growth goals.
        </p>
        <ButtonColorful
          label="Get Started Now"
          onClick={() => window.location.href = '/contact'}
          className="h-12 px-8"
        />
      </div>
    </section>
  );
};

export default CTASection;