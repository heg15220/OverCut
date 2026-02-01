// frontend/src/modules/debate/ws/debateWsClient.js
import { Client } from "@stomp/stompjs";
import { getServiceToken } from "../../../backend/appFetch";

function buildWsUrl() {
  const proto = window.location.protocol === "https:" ? "wss" : "ws";
  const token = getServiceToken();
  const base = `${proto}://${window.location.host}/overcutdebate/ws/debate`;
  return token ? `${base}?st=${encodeURIComponent(token)}` : base;
}

export function createDebateWsClient({
  roomId,
  onMessage,
  onConnect,
  onError,
}) {
  const token = getServiceToken();
  const brokerURL = buildWsUrl();

  const client = new Client({
    brokerURL: buildWsUrl(),
    connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
    reconnectDelay: 2000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    debug: () => {},
  });

  client.onConnect = () => {
    const sub = client.subscribe(`/topic/rooms/${roomId}`, (frame) => {
      try {
        const body = JSON.parse(frame.body);
        onMessage?.(body);
      } catch (e) {
        // ignore
      }
    });

    onConnect?.({ sub });
  };

  client.onStompError = (frame) => onError?.(frame);
  client.onWebSocketError = (evt) => onError?.(evt);

  client.activate();

  return {
    sendMessage: (text) => {
      const cleaned = (text || "").trim();
      if (!cleaned) return;

      client.publish({
        destination: `/app/rooms/${roomId}/message`,
        body: JSON.stringify({ text: cleaned }),
      });
    },
    disconnect: async () => {
      try {
        await client.deactivate();
      } catch (e) {}
    },
  };
}
