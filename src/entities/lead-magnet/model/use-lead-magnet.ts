import { useEffect, useState } from 'react';
import { LeadMagnet } from './types';

export function useLeadMagnet() {
  const [leadMagnet, setLeadMagnet] = useState<LeadMagnet | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    fetch('/data/lead-magnet.json')
      .then((res) => res.json())
      .then((data) => {
        if (isMounted) {
          setLeadMagnet(data);
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

  return { leadMagnet, isLoading };
}
