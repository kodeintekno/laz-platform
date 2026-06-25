import { HandHeart } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Logo({ 
  className, 
  iconClassName, 
  variant = 'dark',
  size = 'md' 
}: { 
  className?: string, 
  iconClassName?: string, 
  variant?: 'light' | 'dark',
  size?: 'sm' | 'md' | 'lg'
}) {
  return (
    <div className={cn("flex items-center select-none", size === 'sm' ? "gap-2" : "gap-2.5", className)}>
      <div className={cn(
        "relative rounded-2xl shadow-lg transition-transform hover:scale-105",
        size === 'sm' ? "p-1.5" : "p-2",
        variant === 'dark' ? "bg-emerald-600 shadow-emerald-900/10" : "bg-white shadow-none",
        size === 'lg' && "p-3 rounded-3xl"
      )}>
        <HandHeart className={cn(
          size === 'sm' ? "w-4 h-4" : size === 'lg' ? "w-8 h-8" : "w-6 h-6", 
          variant === 'dark' ? "text-white" : "text-emerald-600",
          iconClassName
        )} />
        <div className={cn(
          "absolute rounded-full border-2 border-white",
          size === 'sm' ? "-top-0.5 -right-0.5 w-2 h-2" : "-top-1 -right-1 w-3 h-3",
          variant === 'dark' ? "bg-emerald-400" : "bg-emerald-600"
        )} />
      </div>
      <div className="flex flex-col -space-y-1">
        <span className={cn(
          "font-black tracking-tight",
          size === 'sm' ? "text-lg" : size === 'lg' ? "text-3xl" : "text-xl",
          variant === 'dark' ? "text-emerald-950" : "text-white"
        )}>
          Ruang<span className="text-emerald-500">Berbagi</span>
        </span>
        <span className={cn(
          "font-bold uppercase tracking-[0.2em] opacity-50",
          size === 'sm' ? "text-[6px]" : "text-[8px]",
          variant === 'dark' ? "text-emerald-900" : "text-emerald-100"
        )}>
          Amanah & Transparan
        </span>
      </div>
    </div>
  );
}
