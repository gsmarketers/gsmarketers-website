import React from 'react';
import { Instagram, Linkedin, Mail, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const Footer = () => {
  const socialLinks = [
    {
      icon: <Linkedin className="w-6 h-6" />,
      href: "https://www.linkedin.com/company/gsmarketers/",
      label: "LinkedIn"
    },
    {
      icon: <Instagram className="w-6 h-6" />,
      href: "https://www.instagram.com/gsmarketers/",
      label: "Instagram"
    },
    {
      icon: <img src="/X_Icon.svg" alt="X" className="w-6 h-6 invert" />,
      href: "https://x.com/i/user/1902193630158450688",
      label: "X"
    }
  ];

  return (
    <footer className="relative py-8 overflow-hidden bg-gradient-to-b from-transparent via-blue-900/5 to-true-black">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/50 to-black/90 backdrop-blur-sm transition-opacity duration-500" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="flex flex-col gap-6">
          {/* Top Section */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Logo */}
            <div className="flex items-center">
              <img src="/Resized_GSM.svg" alt="GS Marketers" className="h-12" />
            </div>
            {/* Social Links */}
            <div className="flex flex-col items-center md:items-end gap-2">
              <p className="text-white/60 text-sm">See us on</p>
              <div className="flex items-center gap-6">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/70 hover:text-white transition-all duration-300 p-2 hover:bg-white/5 rounded-full hover:shadow-[0_0_10px_rgba(255,255,255,0.1)]"
                    aria-label={social.label}
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Separator Line */}
          <div className="w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          {/* Bottom Section */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-2">
            {/* Copyright */}
            <div className="text-white/60 text-sm">
              © {new Date().getFullYear()} GS Marketers. All rights reserved.
            </div>

            {/* Email Links */}
            <div className="flex flex-col items-center md:items-end gap-2">
              {[
                { email: 'contact@gsmarketers.com', icon: Mail, label: 'Contact Email' },
                { email: 'dzunisani@gsmarketers.com', icon: User, label: 'Personal Email' }
              ].map(({ email, icon: Icon }) => (
                <a
                  key={email}
                  href={`mailto:${email}`}
                  aria-label={`Send email to ${email}`}
                  className="flex items-center gap-2 text-white/80 hover:text-white transition-all duration-300 hover:translate-x-1"
                >
                  <Icon className={cn(
                    "w-5 h-5 text-cyan-400/80 hover:text-cyan-300 transition-colors",
                    "stroke-[1.5px]"
                  )} />
                  <span>{email}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;