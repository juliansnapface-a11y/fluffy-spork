'use client';

import dynamic from 'next/dynamic';

// All state lives in localStorage, so the app renders only in the browser.
const InnerCircleApp = dynamic(() => import('./InnerCircleApp'), { ssr: false });

export function ClientApp() {
  return <InnerCircleApp />;
}
