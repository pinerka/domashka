import { create } from "zustand";

type LessonRoomState = {
  panel: "chat" | "files" | "people";
  setPanel: (panel: LessonRoomState["panel"]) => void;
  isSaving: boolean;
  setSaving: (isSaving: boolean) => void;
};

export const useLessonRoomStore = create<LessonRoomState>((set) => ({
  panel: "chat",
  setPanel: (panel) => set({ panel }),
  isSaving: false,
  setSaving: (isSaving) => set({ isSaving })
}));
