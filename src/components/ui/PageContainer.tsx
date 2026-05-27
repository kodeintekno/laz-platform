import React from 'react';

export default function PageContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-full max-w-md bg-white rounded-xl shadow-soft border border-[#E5E7EB] p-8">
        {children}
      </div>
    </div>
  );
}
