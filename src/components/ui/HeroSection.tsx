import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function HeroSection() {
  return (
    <section className="bg-gradient-to-r from-[#0F3D2E] to-[#16A34A] text-white py-20 px-4 md:px-8 lg:px-12">
      <div className="max-w-7xl mx-auto flex flex-col-reverse md:flex-row items-center gap-12">
        <div className="md:w-1/2 space-y-6">
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">
            Setiap Rupiah Anda, Menjadi Harapan Baru
          </h1>
          <p className="text-lg md:text-xl text-[#D1FAE5]">
            Salurkan zakat, infaq, dan sedekah Anda dengan mudah, aman, dan transparan.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <Link
              href="/programs"
              className="inline-block bg-[#16A34A] hover:bg-[#15803D] text-white font-medium py-3 px-8 rounded-xl transition"
            >
              Mulai Berzakat Sekarang
            </Link>
            <Link
              href="/about"
              className="inline-block bg-[#D1FAE5] hover:bg-[#C2F5D9] text-[#0F3D2E] font-medium py-3 px-8 rounded-xl transition"
            >
              Lihat Program
            </Link>
          </div>
        </div>
        <div className="md:w-1/2 flex justify-center items-center">
          <Image
            src="/images/hero_section.png"
            alt="Group of diverse people in modest Islamic clothing together"
            width={500}
            height={350}
            className="rounded-xl shadow-sm"
          />
        </div>
      </div>
    </section>
  );
}
