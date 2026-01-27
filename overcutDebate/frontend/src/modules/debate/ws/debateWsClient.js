// frontend/src/modules/debate/ws/debateWsClient.js
import { Client } from "@stomp/stompjs";
import { getServiceToken } from "../../../backend/appFetch";

export function createDebateWsClient({
  wsBaseUrl = "ws://localhost:8084/overcutdebate/ws/debate",
  roomId,
  onMessage,
  onConnect,
  onError,
}) {
  const token = getServiceToken();

  const client = new Client({
    brokerURL: wsBaseUrl,
    connectHeaders: {
      Authorization: token ? `Bearer ${token}` : "",
    },
    reconnectDelay: 2000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    debug: () => {},
  });

  client.onConnect = () => {
    const sub = client.subscribe(`/topic/rooms/${roomId}`, (frame) => {
      try {
        const body = JSON.parse(frame.body);
        if (onMessage) onMessage(body);
      } catch (e) {
        // ignore
      }
    });

    if (onConnect) onConnect({ sub });
  };

  client.onStompError = (frame) => {
    if (onError) onError(frame);
  };

  client.onWebSocketError = (evt) => {
    if (onError) onError(evt);
  };

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
    disconnect: () => {
      try {
        client.deactivate();
      } catch (e) {}
    },
  };
}
