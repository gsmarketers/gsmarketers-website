import React from 'react';
import { MessageSquare, Users, Trophy } from 'lucide-react';
import { ShimmerText } from './ui/shimmer-text';

const Process = () => {
  return (
    <section id="process" className="py-24 bg-black/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <ShimmerText className="text-4xl md:text-5xl font-semibold mb-6">
            Our 3-Step Process
          </ShimmerText>
          <p className="section-subtitle">A proven 3-step process that works every time.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: <MessageSquare className="w-10 h-10 text-purple-400" />,
              title: "Strategic Outreach",
              description: "We connect with the right clients through targeted DMs."
            },
            {
              icon: <Users className="w-10 h-10 text-blue-400" />,
              title: "Expert Engagement",
              description: "We handle the conversation until they're ready to book."
            },
            {
              icon: <Trophy className="w-10 h-10 text-purple-400" />,
              title: "Guaranteed Results",
              description: "Get 5+ clients or your money back. Simple."
            }
          ].map((step, index) => (
            <div key={index} className="relative">
              <div className="flex flex-col items-center">
                <div className="mb-6 p-4 bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-full backdrop-blur-sm
                              ring-1 ring-white/10 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                  {step.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-white/60 text-center">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Process;