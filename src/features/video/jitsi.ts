export type JitsiRoomRequest = {
  lessonId: string;
  title?: string;
};

export type JitsiRoom = {
  provider: "jitsi";
  roomUrl: string;
};

export function createJitsiRoom(request: JitsiRoomRequest): JitsiRoom {
  const titlePart = (request.title || "lesson")
    .toLowerCase()
    .replace(/[^a-z0-9а-яё]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 36);
  const roomName = `learnspace-${titlePart || "lesson"}-${request.lessonId}`.toLowerCase().replace(/[^a-z0-9-]/g, "-");
  const params = new URLSearchParams({
    "config.prejoinConfig.enabled": "false",
    "config.startWithAudioMuted": "false",
    "config.startWithVideoMuted": "false",
    "interfaceConfig.SHOW_JITSI_WATERMARK": "false"
  });

  return {
    provider: "jitsi",
    roomUrl: `https://meet.jit.si/${roomName}#${params.toString()}`
  };
}
