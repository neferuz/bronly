'use client';

import { useEffect } from 'react';

export default function TelegramInit() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const tg = (window as any).Telegram?.WebApp;
      if (tg) {
        if (typeof tg.ready === 'function') {
          try { tg.ready(); } catch(e) {}
        }
        if (typeof tg.expand === 'function') {
          try { tg.expand(); } catch(e) {}
        }
        if (typeof tg.enableClosingConfirmation === 'function') {
          try { tg.enableClosingConfirmation(); } catch(e) {}
        }
        if (typeof tg.disableVerticalSwipes === 'function') {
          try { tg.disableVerticalSwipes(); } catch(e) {}
        }
      }
    }
  }, []);

  return null;
}
