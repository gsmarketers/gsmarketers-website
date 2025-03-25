import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowUpRight } from "lucide-react";

interface ButtonColorfulProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    label?: string;
    variant?: "default" | "hero";
}

export function ButtonColorful({
    className,
    label = "Explore Components",
    variant = "default",
    ...props
}: ButtonColorfulProps) {
    return (
        <Button
            className={cn(
                "relative h-10 px-4 overflow-hidden",
               "bg-white/5 rounded-2xl",
                "transition-all duration-200",
                "group",
                className
            )}
            {...props}
        >
            {/* Gradient background effect */}
            <div
                className={cn(
                    "absolute inset-0",
                    variant === "hero"
                      ? "bg-gradient-to-r from-cyan-400 via-cyan-300 to-cyan-200"
                      : "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500",
                    variant === "hero"
                      ? "opacity-60 group-hover:opacity-90"
                      : "opacity-20 group-hover:opacity-80",
                    "blur transition-opacity duration-500"
                )}
            />

            {/* Content */}
            <div className="relative flex items-center justify-center gap-2">
                <span className="text-white">{label}</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-white/90" />
            </div>
        </Button>
    );
}