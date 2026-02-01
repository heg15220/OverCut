// src/modules/debate/hooks/useAutoScroll.js
import { useEffect, useRef } from "react";

export function useAutoScroll(deps = []) {
  const ref = useRef(null);
  const shouldStickRef = useRef(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onScroll = () => {
      const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
      shouldStickRef.current = nearBottom;
    };

    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (shouldStickRef.current) el.scrollTop = el.scrollHeight;
  }, deps);

  return ref;
}
