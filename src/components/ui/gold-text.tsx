import { cn } from "@/lib/utils";

interface GoldTextProps {
  children: React.ReactNode;
  className?: string;
}

export function GoldText({ children, className }: GoldTextProps) {
  return (
    <span className="relative inline-block">
      <span className={cn(
        "relative animate-metallic",
        className
      )}>
        {children}
      </span>
      <style jsx global>{`
        @keyframes metallic {
          0% { 
            color: #C0B283;
          }
          25% {
            color: #DCD0C0;
          }
          50% { 
            color: #F4F4F4;
          }
          75% {
            color: #DCD0C0;
          }
          100% {
            color: #C0B283;
          }
        }
        .animate-metallic {
          animation: metallic 8s linear infinite;
          text-shadow: 0 0 10px rgba(220, 208, 192, 0.3);
        }
      `}</style>
    </span>
  );
}