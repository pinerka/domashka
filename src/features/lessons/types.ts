export type PlannedLesson = {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string;
  roomUrl: string;
  teacherName: string;
  studentName: string;
};

export function encodeLessonParams(lesson: PlannedLesson) {
  return new URLSearchParams({
    title: lesson.title,
    startsAt: lesson.startsAt,
    endsAt: lesson.endsAt,
    roomUrl: lesson.roomUrl,
    teacherName: lesson.teacherName,
    studentName: lesson.studentName
  }).toString();
}
