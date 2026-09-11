function checkCache(worker) {
  return new Promise(resolve => {
    if (!worker) { resolve(false); return; }
    const channel = new MessageChannel();
    const finish = ready => { clearTimeout(timeout); channel.port1.close(); resolve(ready); };
    const timeout = setTimeout(() => finish(false), 5000);
    channel.port1.onmessage = event => finish(event.data?.ready === true);
    try { worker.postMessage({ type: 'CHECK_OFFLINE' }, [channel.port2]); }
    catch { finish(false); }
  });
}

export function setupOffline(notify) {
  if (!window.isSecureContext || !('serviceWorker' in navigator)) {
    notify('unavailable');
    return () => {};
  }
  let registration;
  let updating = false;

  async function refresh() {
    if (!registration) return;
    if (registration.waiting && await checkCache(registration.waiting)) {
      notify('updating');
    } else if (registration.active) {
      notify(await checkCache(registration.active) ? 'ready' : 'unavailable');
    }
  }

  function watch(worker) {
    if (!worker) return;
    worker.addEventListener('statechange', () => {
      if (worker.state === 'installed' || worker.state === 'activated') void refresh();
      if (worker.state === 'redundant') {
        if (registration?.active) void refresh();
        else notify('unavailable');
      }
    });
  }

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (updating) window.location.reload();
    else void refresh();
  });

  navigator.serviceWorker.register('./sw.js', { scope: './', updateViaCache: 'none' }).then(async result => {
    registration = result;
    registration.addEventListener('updatefound', () => watch(registration.installing));
    watch(registration.installing);
    await refresh();
  }).catch(() => notify('unavailable'));

  return () => {
    if (registration?.waiting) {
      updating = true;
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  };
}
