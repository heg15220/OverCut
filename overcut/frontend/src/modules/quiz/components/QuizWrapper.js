import React from 'react';
import Quiz from './Quiz';
import QuizMobile from './QuizMobile';

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(() => {
    const ua = navigator.userAgent || '';
    return /Mobi|Android|iPhone|iPad|iPod/i.test(ua) || window.innerWidth < 768;
  });

  useEffect(() => {
    const handler = () => {
      const ua = navigator.userAgent || '';
      setIsMobile(/Mobi|Android|iPhone|iPad|iPod/i.test(ua) || window.innerWidth < 768);
    };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return isMobile;
};



const QuizWrapper = () => {
  const isMobile = useIsMobile();
  return isMobile ? <QuizMobile /> : <Quiz />;
};

export default QuizWrapper;
