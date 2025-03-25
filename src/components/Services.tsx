import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ServiceCard } from './ui/service-card';
import { GoldText } from './ui/gold-text';
import { ButtonColorful } from './ui/button-colorful';

const Services = () => {
  const navigate = useNavigate();

  return (
    <section id="services" className="py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="section-title">Turn Your DMs into <GoldText>Dollars</GoldText></h2>
          <p className="section-subtitle">Proven strategies that convert conversations into high-ticket clients.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <ServiceCard
            title="LinkedIn Lead Generation"
            subtitle="Connect with decision-makers who need your services now."
            image="/LinkedInTurn.jpg"
            badge={{ text: "Most Popular - Easier To Convert Prospects", variant: "indigo" }}
          />
          <ServiceCard
            title="Instagram Client Outreach"
            subtitle="Turn followers into high-ticket clients with our proven DM strategy."
            image="/InstagramTurn.jpg"
            badge={{ text: "Highest ROI Clients", variant: "pink" }}
          />
          <ServiceCard
            title="Twitter/X Engagement"
            subtitle="Leverage real-time conversations to land premium clients."
            image="/XLogoServices_01.jpg"
            badge={{ text: "Trending - Deeper Connections with Leads", variant: "orange" }}
          />
        </div>

        <div className="flex justify-center mt-16">
          <ButtonColorful
            label="Start Landing Clients Today"
            onClick={() => navigate('/contact')}
            className="h-12 px-8"
          />
        </div>
      </div>
    </section>
  );
};

export default Services;
