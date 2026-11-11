import { useEffect, useState } from 'react';

import { imagery as imageryService } from '@/services';

type Imagery = Awaited<ReturnType<typeof imageryService.getImagery>>;

/** Satellite imagery once a provider has answered; null until then, or when none works. */
export function useImagery(): Imagery {
  const [imagery, setImagery] = useState<Imagery>(null);
  useEffect(() => {
    let live = true;
    void imageryService.getImagery().then((value) => {
      if (live) setImagery(value);
    });
    return () => {
      live = false;
    };
  }, []);
  return imagery;
}
