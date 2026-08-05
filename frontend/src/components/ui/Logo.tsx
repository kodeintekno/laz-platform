import { cn } from '@/lib/utils';

const sizeMap = {
  sm: { img: 'h-8 w-auto', text: 'text-lg', sub: 'text-[6px]' },
  md: { img: 'h-10 w-auto', text: 'text-xl', sub: 'text-[8px]' },
  lg: { img: 'h-14 w-auto', text: 'text-3xl', sub: 'text-[9px]' },
};

export default function Logo({ 
  className, 
  variant = 'dark',
  size = 'md' 
}: { 
  className?: string, 
  iconClassName?: string, 
  variant?: 'light' | 'dark',
  size?: 'sm' | 'md' | 'lg'
}) {
  const s = sizeMap[size];
  return (
    <div className={cn("flex items-center select-none gap-2.5", className)}>
      <img
        src="/logo.png"
        alt="Ruang Berbagi"
        className={cn(s.img, "object-contain drop-shadow-sm")}
      />
      <div className="flex flex-col -space-y-1">
        <span className={cn(
          "font-black tracking-tight",
          s.text,
          variant === 'dark' ? "text-emerald-950" : "text-white"
        )}>
          ruang <span className={cn(variant === 'dark' ? "text-emerald-600" : "text-emerald-300")}>berbagi</span>
        </span>
        <span className={cn(
          "font-bold uppercase tracking-[0.2em] opacity-50",
          s.sub,
          variant === 'dark' ? "text-emerald-900" : "text-emerald-100"
        )}>
          Amanah &amp; Transparan
        </span>
      </div>
    </div>
  );
}

