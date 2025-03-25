import { cn } from "@/lib/utils"
import { BorderTrail } from "./border-trail";

interface AuthorCardProps {
  className?: string
  backgroundImage?: string
  icon: React.ReactNode
  duration?: number
  content: {
    title: string
    description: string
  }
}

export const AuthorCard = ({ 
  className,
  backgroundImage,
  icon,
  duration = 8,
  content
}: AuthorCardProps) => {
  return (
    <div className="w-full group/card">
      <div
        className={cn(
          "cursor-pointer overflow-hidden relative card h-[400px] rounded-3xl shadow-xl flex flex-col justify-between p-8 bg-cover bg-center",
          "transition-all duration-500 ease-out hover:transform hover:scale-[1.02] relative",
          "before:absolute before:inset-0 before:bg-gradient-to-b before:from-black/40 before:to-black/80 before:transition-opacity before:duration-300",
          "group-hover/card:before:opacity-90",
          className
        )}
        style={{ backgroundImage: `url(${backgroundImage})` }}
      >
        <BorderTrail
          className="bg-cyan-400/60"
          size={180}
          transition={{
            repeat: Infinity,
            duration,
            ease: 'linear'
          }}
        />
        <div className="relative z-10">
          <div className="mb-6 p-4 bg-white/5 rounded-full w-fit backdrop-blur-sm
                        ring-1 ring-white/10 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
            {icon}
          </div>
        </div>
        <div className="relative z-10">
          <h3 className="text-2xl font-semibold mb-3 text-white group-hover/card:text-white/90">
            {content.title}
          </h3>
          <p className="text-white/70 group-hover/card:text-white/80">
            {content.description}
          </p>
        </div>
      </div>
    </div>
  )
}