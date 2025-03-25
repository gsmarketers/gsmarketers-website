import React from 'react';
import { Banknote as BanknoteOff, Target, Clock } from 'lucide-react';
import { AuthorCard } from './ui/author-card';

const WhyChooseUs = () => {
  return (
    <section className="py-24 bg-black/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="section-title">Why Agencies Trust GS Marketers</h2>
          <p className="section-subtitle">We deliver results. Period.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <AuthorCard
            backgroundImage="/MoneyWhy.jpg"
            icon={<BanknoteOff className="w-12 h-12 text-purple-400" />}
            duration={8}
            content={{
              title: "No Paid Ads Required",
              description: "We leverage proven strategic outreach methods to connect with your ideal clients without spending on ads."
            }}
          />
          <AuthorCard
            backgroundImage="/HighWhy.jpg"
            icon={<Target className="w-12 h-12 text-blue-400" />}
            duration={12}
            content={{
              title: "High-Intent Leads Only",
              description: "Our approach ensures you're only connected with qualified prospects who need your services."
            }}
          />
          <AuthorCard
            backgroundImage="/DoneWhy.jpg"
            icon={<Clock className="w-12 h-12 text-purple-400" />}
            duration={16}
            content={{
              title: "Done For You",
              description: "Focus on your business while we handle client acquisition. We manage everything from outreach to qualification."
            }}
          />
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;