// @see https://css-tricks.com/debouncing-throttling-explained-examples/
interface ThrottleOptions {
  leading?: boolean;
  trailing?: boolean;
}

interface ThrottledFunction<T extends (...args: unknown[]) => unknown> {
  (...args: Parameters<T>): ReturnType<T>;
  cancel: () => void;
}

export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number,
  options: ThrottleOptions = {},
): ThrottledFunction<T> {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let previous = 0;

  const { leading = true, trailing = true } = options;

  function throttled(this: unknown, ...args: Parameters<T>): unknown {
    const now = Date.now();

    if (!previous && !leading) {
      previous = now;
    }

    const remaining = wait - (now - previous);

    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      previous = now;
      func.apply(this, args);
      return;
    }

    if (!timeout && trailing) {
      timeout = setTimeout(() => {
        previous = leading ? Date.now() : 0;
        timeout = null;
        func.apply(this, args);
      }, remaining);
    }
  }

  throttled.cancel = function (): void {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
    previous = 0;
  };

  return throttled as ThrottledFunction<T>;
}
