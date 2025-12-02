import { useEffect, useState } from 'react';

export function useChat(userId: string) {
  const [messages, setMessages] = useState([]);
  return { messages };
}