import { useEffect, useRef } from 'react';

export function useRevealOnScroll<T extends HTMLElement>(threshold = 0.1) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).style.opacity = '1';
            (entry.target as HTMLElement).style.transform = 'translateY(0)';
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold }
    );

    const children = el.querySelectorAll('[data-reveal]');
    children.forEach((child, i) => {
      const htmlChild = child as HTMLElement;
      htmlChild.style.opacity = '0';
      htmlChild.style.transform = 'translateY(20px)';
      htmlChild.style.transition = `opacity 0.4s ease-out ${i * 60}ms, transform 0.4s ease-out ${i * 60}ms`;
      observer.observe(child);
    });

    return () => observer.disconnect();
  }, [threshold]);

  return ref;
}
