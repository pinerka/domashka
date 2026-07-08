export type DailyRoomRequest = {
  lessonId: string;
  title?: string;
  startsAt: string;
  endsAt: string;
};

export type DailyRoom = {
  provider: "daily";
  roomUrl: string;
  token?: string;
};

export async function createDailyRoom(request: DailyRoomRequest): Promise<DailyRoom> {
  const roomName = `learnspace-${request.lessonId}`.toLowerCase().replace(/[^a-z0-9-]/g, "-");
  const requestedExpiration = Math.floor(new Date(request.endsAt).getTime() / 1000) + 60 * 60;
  const minimumExpiration = Math.floor(Date.now() / 1000) + 60 * 60 * 24;
  const expiration = Math.max(requestedExpiration, minimumExpiration);

  if (!process.env.DAILY_API_KEY) {
    return {
      provider: "daily",
      roomUrl: `https://example.daily.co/${roomName}`
    };
  }

  const apiUrl = process.env.DAILY_API_URL ?? "https://api.daily.co/v1";
  const response = await fetch(`${apiUrl}/rooms`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      name: roomName,
      privacy: "public",
      properties: {
        enable_chat: true,
        enable_screenshare: true,
        enable_prejoin_ui: false,
        start_video_off: false,
        start_audio_off: false,
        exp: expiration
      }
    })
  });

  if (!response.ok) {
    return {
      provider: "daily",
      roomUrl: `https://example.daily.co/${roomName}`
    };
  }

  const data = (await response.json()) as { url?: string };

  return {
    provider: "daily",
    roomUrl: data.url ?? `https://example.daily.co/${roomName}`
  };
}
