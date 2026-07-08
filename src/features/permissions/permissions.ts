export type UserRole = "student" | "teacher" | "course_author" | "admin";

export function hasRole(roles: UserRole[], role: UserRole) {
  return roles.includes(role);
}

export function canAccessLesson(roles: UserRole[], isParticipant: boolean) {
  return isParticipant || hasRole(roles, "admin");
}

export function canModerate(roles: UserRole[]) {
  return hasRole(roles, "admin");
}

export function canManageCourse(roles: UserRole[], isAuthor: boolean) {
  return isAuthor || hasRole(roles, "admin");
}
