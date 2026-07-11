"use client";

import { useRouter } from "next/navigation";
import { CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function InvitationNotice({ message }: { message?: string }) {
  const router = useRouter();

  if (!message) {
    return null;
  }

  function close() {
    router.replace("/teacher/students");
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#121424]/35 px-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Результат приглашения">
      <div className="relative w-full max-w-md rounded-[1.5rem] bg-white p-8 text-center shadow-2xl">
        <button type="button" onClick={close} className="absolute right-5 top-5 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Закрыть">
          <X className="h-5 w-5" />
        </button>
        <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500" />
        <h2 className="mt-5 text-2xl font-black text-[#121424]">Приглашение отправлено</h2>
        <p className="mt-3 leading-6 text-slate-500">{message}</p>
        <Button onClick={close} className="mt-6 w-full rounded-full bg-[#675cff] hover:bg-[#5b50f0]">
          Готово
        </Button>
      </div>
    </div>
  );
}
