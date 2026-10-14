import '@fontsource/heebo/400.css';
import '@fontsource/heebo/500.css';
import '@fontsource/heebo/600.css';
import '@fontsource/heebo/700.css';
import '@fontsource/heebo/800.css';
import '@fontsource/heebo/900.css';
import { useEffect, useState } from 'react';
import { continueRender, delayRender } from 'remotion';

/** ממתין לטעינת כל משקלי Heebo לפני צילום פריים – מונע הבהוב פונט */
export function useFonts() {
  const [handle] = useState(() => delayRender('Loading Heebo'));
  useEffect(() => {
    const weights = [400, 500, 600, 700, 800, 900];
    Promise.all(weights.map((w) => document.fonts.load(`${w} 40px Heebo`, 'אבג 123')))
      .then(() => document.fonts.ready)
      .then(() => continueRender(handle))
      .catch(() => continueRender(handle));
  }, [handle]);
}
