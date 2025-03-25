import { useNavigate } from 'react-router-dom';
import { cn } from "@/lib/utils";
import { ArrowUpRight } from "lucide-react";
import { BorderTrail } from "./border-trail";

interface ServiceCardProps {
    title: string;
    subtitle: string;
    image: string;
    badge?: {
        text: string;
        variant: "pink" | "indigo" | "orange";
    };
    href?: string;
}

export function ServiceCard({ 
    title,
    subtitle,
    image,
    badge,
    href = "/contact",
}: ServiceCardProps) {
    const navigate = useNavigate();

    return (
        <button onClick={() => navigate(href)} className="block w-full group cursor-pointer">
            <div
                className={cn(
                    "relative overflow-hidden rounded-2xl",
                   "bg-white/5",
                    "backdrop-blur-xl",
                    "border border-white/10",
                    "transition-all duration-300 relative",
                    "hover:bg-white/10"
                )}
            >
                <BorderTrail
                    className="bg-cyan-400/60"
                    size={240}
                    transition={{
                        repeat: Infinity,
                        duration: 8,
                        ease: 'linear',
                    }}
                />
                <div className="relative h-[320px] overflow-hidden">
                    <img
                        src={image}
                        alt={title}
                        className="absolute inset-0 h-full w-full object-cover"
                    />
                </div>

                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                {badge && (
                    <div className="absolute top-3 right-3">
                        <span className={cn(
                            "px-2.5 py-1 rounded-full text-xs font-medium",
                            "bg-white/10 text-white",
                            "backdrop-blur-md",
                            "border border-white/20"
                        )}>
                            {badge.text}
                        </span>
                    </div>
                )}

                <div className="absolute bottom-0 left-0 right-0 p-5">
                    <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1.5">
                            <h3 className="text-lg font-semibold text-white leading-snug text-left">
                                {title}
                            </h3>
                            <p className="text-sm text-zinc-300 line-clamp-2 text-left">
                                {subtitle}
                            </p>
                        </div>
                        <div className={cn(
                            "p-2 rounded-full",
                            "bg-white/10",
                            "backdrop-blur-md",
                            "group-hover:bg-white/20",
                            "transition-colors duration-300"
                        )}>
                            <ArrowUpRight className="w-4 h-4 text-white group-hover:-rotate-12 transition-transform duration-300" />
                        </div>
                    </div>
                </div>
            </div>
        </button>
    );
}
