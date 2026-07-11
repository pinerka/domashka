"use client";

import { useState } from "react";
import { Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteAccountAction } from "@/features/auth/actions";

export function DeleteAccount({ error }: { error?: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section className="mt-10 max-w-6xl rounded-[1.35rem] border border-red-200 bg-white p-6 shadow-[0_3px_10px_rgba(17,24,39,0.06)]">
      <h2 className="text-xl font-black text-[#131525]">Удаление аккаунта</h2>
      <p className="mt-2 max-w-2xl leading-6 text-slate-500">
        Аккаунт, данные входа, профиль и связанные данные будут удалены без возможности восстановления.
      </p>
      {error ? <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 font-medium text-red-700">Не удалось удалить аккаунт: {error}</p> : null}
      <Button type="button" variant="outline" onClick={() => setIsOpen(true)} className="mt-5 rounded-full border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700">
        <Trash2 className="h-4 w-4" />
        Удалить аккаунт
      </Button>

      {isOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#121424]/40 px-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="delete-account-title">
          <div className="relative w-full max-w-md rounded-[1.5rem] bg-white p-8 text-center shadow-2xl">
            <button type="button" onClick={() => setIsOpen(false)} className="absolute right-5 top-5 rounded-full p-1 text-slate-400 hover:bg-slate-100" aria-label="Закрыть">
              <X className="h-5 w-5" />
            </button>
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600"><Trash2 className="h-6 w-6" /></span>
            <h2 id="delete-account-title" className="mt-5 text-2xl font-black text-[#121424]">Вы хотите удалить аккаунт?</h2>
            <p className="mt-3 leading-6 text-slate-500">Это действие нельзя отменить. Для следующего входа потребуется зарегистрироваться заново.</p>
            <div className="mt-7 grid grid-cols-2 gap-3">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)} className="rounded-full">Нет</Button>
              <form action={deleteAccountAction}>
                <Button className="w-full rounded-full bg-red-600 hover:bg-red-700">Да, удалить</Button>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
