import { NextRequest } from 'next/server';
import emitter from '@/lib/sse-emitter';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function GET(req: NextRequest) {
  const enc = new TextEncoder();
  let off: (() => void) | undefined;

  const stream = new ReadableStream({
    start(ctrl) {
      const handler = () => {
        try { ctrl.enqueue(enc.encode('event: new-photo\ndata: {}\n\n')); } catch { off?.(); }
      };
      emitter.on('new-photo', handler);

      const ping = setInterval(() => {
        try { ctrl.enqueue(enc.encode(': ping\n\n')); } catch { clearInterval(ping); }
      }, 25_000);

      off = () => {
        emitter.off('new-photo', handler);
        clearInterval(ping);
      };

      req.signal.addEventListener('abort', () => {
        off?.();
        try { ctrl.close(); } catch {}
      });
    },
    cancel() { off?.(); },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
