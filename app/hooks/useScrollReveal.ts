"use client";

import { useEffect } from "react";

const REVEAL_SELECTOR = "[data-reveal]";
const GROUP_SELECTOR = "[data-reveal-group]";

function isInViewport(element: Element) {
  const rect = element.getBoundingClientRect();
  return rect.bottom > 0 && rect.top < window.innerHeight && rect.right > 0 && rect.left < window.innerWidth;
}

function isElement(node: Node): node is Element {
  return node.nodeType === Node.ELEMENT_NODE;
}

export function useScrollReveal() {
  useEffect(() => {
    if (typeof window === "undefined" || !("IntersectionObserver" in window) || !("MutationObserver" in window)) return;

    const root = document.documentElement;
    const observed = new WeakSet<Element>();
    const intersectionObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("is-revealed");
        intersectionObserver.unobserve(entry.target);
      }
    }, { threshold: 0.05 });

    const setGroupOrder = (scope: ParentNode) => {
      const groups: Element[] = [];
      if (isElement(scope as Node) && (scope as Element).matches(GROUP_SELECTOR)) groups.push(scope as Element);
      if (isElement(scope as Node)) {
        const parentGroup = (scope as Element).parentElement?.closest(GROUP_SELECTOR);
        if (parentGroup && !groups.includes(parentGroup)) groups.push(parentGroup);
      }
      groups.push(...scope.querySelectorAll(GROUP_SELECTOR));
      for (const group of groups) {
        let index = 0;
        for (const child of Array.from(group.children)) {
          if (!child.matches(REVEAL_SELECTOR)) continue;
          if (child instanceof HTMLElement) child.style.setProperty("--reveal-i", String(Math.min(index, 7)));
          index += 1;
        }
      }
    };

    const register = (element: Element) => {
      if (element.classList.contains("is-revealed") || observed.has(element)) return;
      if (isInViewport(element)) {
        element.classList.add("is-revealed");
        return;
      }
      observed.add(element);
      intersectionObserver.observe(element);
    };

    const scan = (scope: ParentNode) => {
      setGroupOrder(scope);
      if (isElement(scope as Node) && (scope as Element).matches(REVEAL_SELECTOR)) register(scope as Element);
      for (const element of scope.querySelectorAll(REVEAL_SELECTOR)) register(element);
    };

    const mutationObserver = new MutationObserver((records) => {
      for (const record of records) {
        for (const node of Array.from(record.addedNodes)) {
          if (isElement(node)) scan(node as unknown as ParentNode);
        }
      }
    });

    root.classList.add("motion-ready");
    scan(document);
    mutationObserver.observe(root, { childList: true, subtree: true });

    return () => {
      mutationObserver.disconnect();
      intersectionObserver.disconnect();
      root.classList.remove("motion-ready");
    };
  }, []);
}
