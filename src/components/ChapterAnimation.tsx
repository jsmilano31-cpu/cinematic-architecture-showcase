"use client";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(useGSAP, ScrollTrigger);
export default function ChapterAnimation() {
  useGSAP(() => {
    const page = document.getElementById("main");
    if (!page) return;
    const media = gsap.matchMedia();
    media.add(
      "(min-width: 1024px) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
      () => {
        page.classList.add("motion-ready");
        page.querySelectorAll("[data-reveal]").forEach((group) =>
          gsap.from(group.children, {
            y: 20,
            duration: 0.65,
            stagger: 0.1,
            ease: "power3.out",
            scrollTrigger: { trigger: group, start: "top 95%", once: true },
          }),
        );
        page
          .querySelectorAll(
            ".interiors .image-button,.material-grid article,.finale-copy",
          )
          .forEach((el) =>
            gsap.from(el, {
              y: 16,
              duration: 0.65,
              ease: "power2.out",
              scrollTrigger: { trigger: el, start: "top 95%", once: true },
            }),
          );
        const image = page.querySelector(".exterior-grid img");
        if (image)
          gsap.fromTo(
            image,
            { scale: 1.045 },
            {
              scale: 1,
              scrollTrigger: {
                trigger: image,
                start: "top bottom",
                end: "bottom center",
                scrub: 0.6,
              },
            },
          );
        const observer = new ResizeObserver(() => ScrollTrigger.refresh());
        observer.observe(page);
        return () => {
          observer.disconnect();
          page.classList.remove("motion-ready");
        };
      },
    );
    return () => media.revert();
  });
  return null;
}
