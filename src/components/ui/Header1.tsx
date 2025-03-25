import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useLocation } from 'react-router-dom';

const navigationItems = [
  {
    title: "Home",
    href: "/",
  },
  {
    title: "About",
    href: "/#about",
  },
  {
    title: "Services",
    href: "/#services",
  },
  {
    title: "Blog",
    href: "/blog",
  },
];

function Header1() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setOpen] = useState(false);

  const handleNavigation = (href: string) => {
    if (href.startsWith('/#')) {
      const elementId = href.substring(2);
      if (location.pathname !== '/') {
        navigate('/', { state: { scrollTo: elementId } });
      } else {
        const element = document.getElementById(elementId);
        element?.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      navigate(href);
    }
    setOpen(false);
  };
  
  return (
    <header className="w-full z-50 fixed top-6 left-0">
      <div className="container relative mx-auto">
        <nav className="mx-auto max-w-3xl bg-black/40 backdrop-blur-xl border border-white/5 rounded-full px-6 py-3 flex items-center justify-between relative">
          {/* Logo */}
          <Link to="/" className="flex items-center md:flex-none flex-1 justify-center md:justify-start translate-x-4 md:translate-x-0">
            <img src="/Resized_GSM.svg" alt="GS Marketers" className="h-16 md:h-20 -my-8 md:-my-16" />
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            {navigationItems.map((item) => (
              <button
                key={item.title}
                onClick={() => handleNavigation(item.href)}
                className="relative text-white/70 hover:text-white transition-colors px-3 py-2 group"
              >
                {item.title}
                <span className="absolute inset-x-3 bottom-1 h-px bg-cyan-400/50 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
              </button>
            ))}
            <Button
              variant="outline"
              className="rounded-full ml-4 px-6 border-white/20 
                       bg-gradient-to-r from-cyan-500/10 to-cyan-400/5
                       hover:from-cyan-500/20 hover:to-cyan-400/10
                       hover:border-cyan-400/30 transition-all duration-300"
              onClick={() => navigate('/contact')}
            >
              Contact
            </Button>
          </div>
          
          {/* Mobile Menu Button */}
          <div className="md:hidden flex-none">
            <Button
              variant="ghost"
              className="p-2"
              onClick={() => setOpen(!isOpen)}
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </nav>
        
        {/* Mobile Menu */}
        {isOpen && (
          <div className="absolute top-full mt-2 inset-x-4 md:hidden rounded-3xl overflow-hidden">
            <div className="bg-black/95 backdrop-blur-xl border border-white/5 rounded-3xl p-4 shadow-lg">
              {navigationItems.map((item) => (
                <a
                  key={item.title}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavigation(item.href);
                  }}
                  className="block py-2 text-white/70 hover:text-white transition-colors"
                >
                  {item.title}
                </a>
              ))}
              <Button
                variant="outline"
                className="w-full rounded-full mt-4 px-6
                         bg-gradient-to-r from-cyan-500/10 to-cyan-400/5
                         hover:from-cyan-500/20 hover:to-cyan-400/10
                         hover:border-cyan-400/30 transition-all duration-300"
                onClick={() => {
                  navigate('/contact');
                  setOpen(false);
                }}
              >
                Contact
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export { Header1 };