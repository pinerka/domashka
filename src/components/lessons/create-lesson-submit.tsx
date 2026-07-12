"use client";

import { useFormStatus } from "react-dom";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CreateLessonSubmit({ disabled }: { disabled?: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button disabled={disabled || pending} className="h-14 rounded-2xl bg-[#675cff] px-8 text-base font-black shadow-[0_14px_30px_rgba(103,92,255,0.28)] hover:bg-[#5b50f0] disabled:cursor-not-allowed disabled:opacity-60">
      <Sparkles className="h-5 w-5" />
      {pending ? "Создаём урок…" : "Создать и пригласить"}
    </Button>
  );
}
