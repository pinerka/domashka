export const subjects = ["Английский", "Математика", "Product Design", "Программирование", "Физика", "IELTS"];

export const teachers = [
  {
    id: "t-1",
    name: "Анна Морозова",
    headline: "IELTS и разговорный английский для карьеры",
    rating: 4.96,
    reviews: 184,
    price: 3200,
    experience: "9 лет",
    subjects: ["Английский", "IELTS"],
    verified: true,
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80",
    bio: "Помогаю взрослым студентам уверенно проходить интервью, выступать на митингах и сдавать IELTS без хаоса в подготовке."
  },
  {
    id: "t-2",
    name: "Илья Соколов",
    headline: "Математика и олимпиадная подготовка",
    rating: 4.91,
    reviews: 97,
    price: 2800,
    experience: "7 лет",
    subjects: ["Математика", "Физика"],
    verified: true,
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80",
    bio: "Строю понятную систему: диагностика, карта пробелов, домашние задания и регулярный прогресс по темам."
  },
  {
    id: "t-3",
    name: "Мария Ли",
    headline: "UX/UI, портфолио и переход в продуктовый дизайн",
    rating: 4.98,
    reviews: 142,
    price: 4500,
    experience: "11 лет",
    subjects: ["Product Design"],
    verified: true,
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80",
    bio: "Менторю дизайнеров: исследование, структура кейсов, визуальная система, продуктовая аргументация и интервью."
  }
];

export const upcomingLessons = [
  { title: "IELTS Speaking: Part 2", teacher: "Анна Морозова", time: "Сегодня, 19:00", status: "confirmed" },
  { title: "Производные и графики", teacher: "Илья Соколов", time: "Завтра, 17:30", status: "confirmed" }
];

export const courses = [
  {
    id: "c-1",
    title: "Product Design Career Sprint",
    author: "Мария Ли",
    price: 12900,
    lessons: 28,
    cover: "https://images.unsplash.com/photo-1559028012-481c04fa702d?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "c-2",
    title: "IELTS Writing System",
    author: "Анна Морозова",
    price: 8900,
    lessons: 18,
    cover: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=900&q=80"
  }
];
