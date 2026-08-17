import { useEffect, useState } from 'react';
import { Pain } from './types';

export function usePains() {
  const [pains, setPains] = useState<Pain[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    fetch('/data/pains.json')
      .then((res) => res.json())
      .then((data) => {
        if (isMounted) {
          setPains(data);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return { pains, isLoading };
}
