import React from 'react';

export default function PageContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="w-full max-w-md bg-surface rounded-xl shadow-soft p-8">
        {children}
      </div>
    </div>
  );
}
