"use client";

import { useMemo, useState } from "react";
import { Camera, GraduationCap, Save, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { updateRoleAction } from "@/features/auth/actions";
import { saveTeacherProfileAction } from "@/features/teachers/actions";

type Role = "student" | "teacher";

const roleCopy = {
  student: {
    label: "Ученик",
    description: "Можно искать преподавателей и записываться на уроки.",
    Icon: UserRound
  },
  teacher: {
    label: "Преподаватель",
    description: "Можно создавать уроки и вести публичный профиль.",
    Icon: GraduationCap
  }
};

function RoleCard({
  role,
  selectedRole,
  onSelect
}: {
  role: Role;
  selectedRole: Role;
  onSelect: (role: Role) => void;
}) {
  const isSelected = role === selectedRole;
  const Icon = roleCopy[role].Icon;

  return (
    <label
      className={`cursor-pointer rounded-[1rem] border p-5 transition ${
        isSelected
          ? "border-[#675cff] bg-[#f4f2ff] shadow-[0_14px_34px_rgba(103,92,255,0.16)]"
          : "border-[#deddf1] bg-white"
      }`}
    >
      <span className="flex items-start gap-4">
        <input
          className="mt-1 h-4 w-4 accent-[#675cff]"
          type="radio"
          name="role"
          value={role}
          checked={isSelected}
          onChange={() => onSelect(role)}
        />
        <span className={`flex h-11 w-11 items-center justify-center rounded-full ${isSelected ? "bg-[#675cff] text-white" : "bg-[#efedff] text-[#675cff]"}`}>
          <Icon className="h-5 w-5" />
        </span>
        <span>
          <span className="block text-lg font-black text-[#131525]">{roleCopy[role].label}</span>
          <span className="mt-1 block text-sm leading-6 text-slate-500">{roleCopy[role].description}</span>
        </span>
      </span>
    </label>
  );
}

function StudentFields() {
  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <label className="text-sm font-bold text-[#131525]" htmlFor="student_goal">
          Цель обучения
        </label>
        <Input id="student_goal" name="student_goal" placeholder="Например: подготовиться к IELTS или подтянуть математику" />
      </div>
      <div className="grid gap-2">
        <label className="text-sm font-bold text-[#131525]" htmlFor="student_level">
          Текущий уровень
        </label>
        <Input id="student_level" name="student_level" placeholder="Например: начинающий, B1, 8 класс" />
      </div>
      <div className="grid gap-2">
        <label className="text-sm font-bold text-[#131525]" htmlFor="student_notes">
          Комментарий для преподавателя
        </label>
        <Textarea id="student_notes" name="student_notes" placeholder="Что важно знать перед первым уроком" />
      </div>
    </div>
  );
}

function TeacherFields() {
  return (
    <form action={saveTeacherProfileAction} className="grid gap-4">
      <div className="grid gap-2">
        <label className="text-sm font-bold text-[#131525]" htmlFor="full_name">
          Имя
        </label>
        <Input id="full_name" name="full_name" placeholder="Как вас будут видеть ученики" />
      </div>
      <div className="grid gap-2">
        <label className="text-sm font-bold text-[#131525]" htmlFor="slug">
          Публичная ссылка
        </label>
        <Input id="slug" name="slug" placeholder="your-public-link" />
      </div>
      <div className="grid gap-2">
        <label className="text-sm font-bold text-[#131525]" htmlFor="headline">
          Заголовок профиля
        </label>
        <Input id="headline" name="headline" placeholder="Кратко о специализации" />
      </div>
      <div className="grid gap-2">
        <label className="text-sm font-bold text-[#131525]" htmlFor="description">
          Описание
        </label>
        <Textarea id="description" name="description" placeholder="Расскажите об опыте, формате занятий и результатах учеников" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="grid gap-2">
          <label className="text-sm font-bold text-[#131525]" htmlFor="hourly_rate">
            Цена за час
          </label>
          <Input id="hourly_rate" name="hourly_rate" type="number" placeholder="0" />
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-bold text-[#131525]" htmlFor="experience_years">
            Опыт, лет
          </label>
          <Input id="experience_years" name="experience_years" type="number" placeholder="0" />
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-bold text-[#131525]" htmlFor="timezone">
            Часовой пояс
          </label>
          <Input id="timezone" name="timezone" placeholder="Europe/Moscow" />
        </div>
      </div>
      <div className="grid gap-2">
        <label className="text-sm font-bold text-[#131525]" htmlFor="intro_video_url">
          Видео-визитка
        </label>
        <Input id="intro_video_url" name="intro_video_url" placeholder="https://..." />
      </div>
      <Button className="w-fit rounded-full bg-[#675cff] hover:bg-[#5b50f0]">
        <Save className="h-4 w-4" />
        Сохранить профиль
      </Button>
    </form>
  );
}

export function ProfileSettings({ initialRole }: { initialRole: Role }) {
  const [selectedRole, setSelectedRole] = useState<Role>(initialRole);
  const savedRole = initialRole;
  const ActiveIcon = useMemo(() => roleCopy[savedRole].Icon, [savedRole]);
  const hasUnsavedRole = selectedRole !== savedRole;

  return (
    <div className="mt-8 grid max-w-6xl gap-5 lg:grid-cols-[1fr_320px]">
      <div className="space-y-5">
        <Card className="rounded-[1.35rem] border-[#e3e4ef] shadow-[0_3px_10px_rgba(17,24,39,0.06)]">
          <CardHeader>
            <CardTitle className="text-2xl font-black">Основная информация</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-[#efedff] text-[#675cff]">
                <UserRound className="h-10 w-10" />
              </div>
              <div className="space-y-3">
                <p className="text-lg font-black text-[#131525]">Фото профиля</p>
                <p className="max-w-md text-sm leading-6 text-slate-500">Фото будет видно в профиле и карточках преподавателя.</p>
                <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border border-[#deddf1] bg-white px-4 text-sm font-bold text-[#131525]">
                  <Camera className="h-4 w-4" />
                  Загрузить фото
                  <input type="file" accept="image/*" className="sr-only" />
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[1.35rem] border-[#e3e4ef] shadow-[0_3px_10px_rgba(17,24,39,0.06)]">
          <CardHeader>
            <CardTitle className="text-2xl font-black">Роль пользователя</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={updateRoleAction} className="space-y-5">
              <div className="grid gap-3 md:grid-cols-2">
                <RoleCard role="student" selectedRole={selectedRole} onSelect={setSelectedRole} />
                <RoleCard role="teacher" selectedRole={selectedRole} onSelect={setSelectedRole} />
              </div>
              {hasUnsavedRole ? (
                <p className="rounded-xl bg-[#fff7df] px-4 py-3 text-sm font-semibold text-[#8a5a00]">
                  Роль выбрана, но еще не сохранена. Нажмите “Сохранить роль”.
                </p>
              ) : null}
              <Button className="rounded-full bg-[#675cff] hover:bg-[#5b50f0]">
                <Save className="h-4 w-4" />
                Сохранить роль
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="rounded-[1.35rem] border-[#e3e4ef] shadow-[0_3px_10px_rgba(17,24,39,0.06)]">
          <CardHeader>
            <CardTitle className="text-2xl font-black">
              {selectedRole === "teacher" ? "Профиль преподавателя" : "Профиль ученика"}
            </CardTitle>
          </CardHeader>
          <CardContent>{selectedRole === "teacher" ? <TeacherFields /> : <StudentFields />}</CardContent>
        </Card>
      </div>

      <Card className="h-fit rounded-[1.35rem] border-[#e3e4ef] bg-[#f4f2ff] shadow-[0_3px_10px_rgba(17,24,39,0.06)]">
        <CardHeader>
          <CardTitle className="text-xl font-black">Действующая роль</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#675cff] text-white">
              <ActiveIcon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-2xl font-black text-[#131525]">{roleCopy[savedRole].label}</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">Эта роль сохранена сейчас.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
