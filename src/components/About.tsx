import React from 'react';
import { ShimmerText } from './ui/shimmer-text';
import { AnimatedTestimonials } from './ui/animated-testimonials';
import { ArrowLeft, ArrowRight } from 'lucide-react';

const testimonials = [
  {
    quote: "GS Marketers isn't just another lead generation agency—we're part of Gulf Stream Agencies Group, a powerhouse of digital growth experts.",
    name: "Who We Are",
    designation: "Lead Generation and Digital Marketing Agency",
    src: "/AboutUs.jpg"
  },
  {
    quote: "Helping content creation and AI agencies land 5-10 high-paying clients in just 30 days—without ads, cold calls, or wasted time. We use precision-targeted outreach to connect you with clients ready to invest.",
    name: "Our Mission",
    designation: "Help people like you scale",
    src: "/Mission.jpeg"
  },
  {
    quote: "Meet Dzunisani Mtsenga—entrepreneur, digital marketer, and the strategist behind GS Marketers. His expertise in B2B marketing and direct outreach has helped agencies scale faster, smarter, and without the usual guesswork.",
    name: "The Mind Behind It All",
    designation: "Dzunisani Mtsenga, Founder at GS Marketers",
    src: "/Dzunisani_Mtsenga.jpeg"
  }
];

const About = () => {
  return (
    <section id="about" className="py-24 relative z-0 bg-gradient-to-b from-transparent to-black/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <ShimmerText className="text-4xl md:text-5xl font-semibold mb-6">
            About Us
          </ShimmerText>
        </div>

        <AnimatedTestimonials 
          testimonials={testimonials}
          className="mb-16"
        />

        <div className="text-center">
          <ShimmerText className="text-xl md:text-2xl italic">
            Growth shouldn't be complicated. We make it simple—and effective.
          </ShimmerText>
        </div>
      </div>
    </section>
  );
};

export default About;