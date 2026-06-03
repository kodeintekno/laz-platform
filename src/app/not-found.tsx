"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { ArrowLeft } from "lucide-react";

export default function GlobalNotFound() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white p-6 text-center">
      <div className="w-full max-w-lg flex flex-col items-center">
        {/* Illustration */}
        <div className="relative w-64 h-64 sm:w-80 sm:h-80 mb-6">
          <Image
            src="/images/404-illustration.png"
            alt="404 Halaman Tidak Ditemukan"
            fill
            sizes="(max-width: 640px) 256px, 320px"
            className="object-contain"
            priority
          />
        </div>
        
        {/* Typography & Content */}
        <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-4 tracking-tight">
          Jalan Buntu
        </h2>
        <p className="text-gray-600 text-sm sm:text-base max-w-md mx-auto mb-10 leading-relaxed">
          Afwan, halaman yang Anda cari sepertinya tidak ada atau sudah dipindahkan. 
          Mari kembali ke jalan yang benar.
        </p>

        {/* Navigation */}
        <Button 
          size="lg" 
          intent="primary" 
          className="flex items-center gap-2 rounded-full px-8 shadow-md hover:shadow-lg transition-shadow"
          onClick={() => router.back()}
        >
          <ArrowLeft className="w-5 h-5" />
          Kembali ke Halaman Sebelumnya
        </Button>
      </div>
      
      {/* Footer text */}
      <p className="absolute bottom-6 text-xs text-muted">
        &copy; {new Date().getFullYear()} LAZ Platform
      </p>
    </div>
  );
}
