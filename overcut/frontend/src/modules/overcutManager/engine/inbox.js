/**
 * The inbox (messages that may want an answer) and the news (what the paddock
 * is saying). Both hold a kind and parameters, never sentences: the interface
 * writes them in the player's language.
 */

export const addInbox = (career, item) => {
  career.serial.inbox += 1;
  const id = `msg-${career.serial.inbox}`;
  career.inbox.unshift({ id, year: career.year, round: career.round, read: false, ...item });
  if (career.inbox.length > 120) career.inbox.length = 120;
  if (item.stop) career.flags.stops = [...(career.flags.stops || []), { kind: item.kind, id }];
  return id;
};

export const addNews = (career, item) => {
  career.serial.news += 1;
  const id = `news-${career.serial.news}`;
  career.news.unshift({ id, year: career.year, round: career.round, ...item });
  if (career.news.length > 80) career.news.length = 80;
  return id;
};

export const markRead = (career, id) => {
  const item = career.inbox.find((entry) => entry.id === id);
  if (item) item.read = true;
  return career;
};

export const markAllRead = (career) => {
  career.inbox.forEach((item) => {
    item.read = true;
  });
  return career;
};

export const unreadCount = (career) => career.inbox.filter((item) => !item.read).length;
