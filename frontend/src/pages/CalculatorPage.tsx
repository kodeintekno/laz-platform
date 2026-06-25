import React from 'react';
import ZakatCalculator from '@/components/ui/ZakatCalculator';
import { useNavigate } from 'react-router-dom';

export function CalculatorPage() {
  const navigate = useNavigate();
  return (
    <div className="bg-[#f8faf9] min-h-screen py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <ZakatCalculator onProceedToDonate={(amount) => navigate(`/donate/zakat-maal?amount=${amount}`)} />
      </div>
    </div>
  );
}
