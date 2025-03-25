import React from 'react';
import Hero from '../components/Hero';
import WhyChooseUs from '../components/WhyChooseUs';
import Services from '../components/Services';
import Process from '../components/Process';
import CTASection from '../components/CTASection';
import About from '../components/About';

const HomePage = () => {
  return (
    <>
      <Hero />
      <WhyChooseUs />
      <Services />
      <Process />
      <About />
      <CTASection />
    </>
  );
};

export default HomePage;