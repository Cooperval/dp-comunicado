import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function useRouteLoading() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const location = useLocation();

  useEffect(() => {
    setLoading(true);
    setProgress(0);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + 10;
      });
    }, 50);

    const timeout = setTimeout(() => {
      setProgress(100);
      clearInterval(progressInterval);
      setTimeout(() => {
        setLoading(false);
        setProgress(0);
      }, 200);
    }, 300);

    return () => {
      clearTimeout(timeout);
      clearInterval(progressInterval);
    };
  }, [location.pathname]);

  return { loading, progress };
}
