import { Outlet } from "react-router-dom";

export function AuthLayout() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-transparent relative z-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 flex justify-center">
          <a href="/" className="inline-block">
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
              </div>
              <div>
                <span className="text-xl font-black text-emerald-950 tracking-tight">Ruang<span className="text-emerald-500">Berbagi</span></span>
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
