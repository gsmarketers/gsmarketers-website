import { cn } from "@/lib/utils";

interface ShimmerTextProps {
  children: React.ReactNode;
  className?: string;
}

export function ShimmerText({ children, className }: ShimmerTextProps) {
  return (
    <div className="relative overflow-hidden">
      <h2 className={cn(
        "shimmer-text",
        className
      )}>
        {children}
      </h2>
      <style jsx global>{`
        .shimmer-text {
          --shimmer-color-start: #f1f5f9;
          --shimmer-color-mid: #9333EA;
          background: linear-gradient(
            90deg,
            var(--shimmer-color-start) 0%,
            var(--shimmer-color-start) 40%,
            var(--shimmer-color-mid) 50%,
            var(--shimmer-color-start) 60%,
            var(--shimmer-color-start) 100%
          );
          background-size: 200% 100%;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: shimmer 10s infinite linear;
        }

        @keyframes shimmer {
          0% { background-position: 100% 0; }
          100% { background-position: -100% 0; }
        }
      `}</style>
    </div>
  );
}