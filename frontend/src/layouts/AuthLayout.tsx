import { Outlet } from "react-router-dom";

export function AuthLayout() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-transparent relative z-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 flex justify-center">
          <a href="/" className="inline-block">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Ruang Berbagi" className="h-12 w-auto object-contain drop-shadow-sm" />
              <div className="text-left">
                <p className="text-xl font-black text-emerald-950 tracking-tight leading-tight">
                  ruang <span className="text-emerald-600">berbagi</span>
                </p>
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-emerald-900/50">Amanah &amp; Transparan</p>
              </div>
            </div>
          </a>
        </div>
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-gray-100 p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
