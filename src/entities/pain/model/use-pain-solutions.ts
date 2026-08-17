import { useEffect, useState } from 'react';
import { PainSolution } from './types';

export function usePainSolutions(selectedPainSlug?: string) {
  const [solutions, setSolutions] = useState<PainSolution[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    fetch('/data/pain-solutions.json')
      .then((res) => res.json())
      .then((data: PainSolution[]) => {
        if (isMounted) {
          if (selectedPainSlug) {
            setSolutions(data.filter((s) => s.painSlug === selectedPainSlug));
          } else {
            setSolutions(data);
          }
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedPainSlug]);

  return { solutions, isLoading };
}
