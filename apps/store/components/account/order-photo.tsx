"use client";

import { useRef } from "react";
import Image from "next/image";

export function OrderPhoto({ src, alt }: { src: string; alt: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const open = () => dialogRef.current?.showModal();
  const close = () => dialogRef.current?.close();

  return (
    <>
      <button
        type="button"
        className="order-photo-trigger"
        onClick={open}
        aria-label={`Enlarge ${alt}`}
      >
        <Image src={src} alt={alt} width={240} height={160} />
      </button>
      <dialog
        ref={dialogRef}
        className="order-photo-dialog"
        aria-label={alt}
        onClick={(event) => {
          const box = event.currentTarget.getBoundingClientRect();
          const outside =
            event.clientX < box.left ||
            event.clientX > box.right ||
            event.clientY < box.top ||
            event.clientY > box.bottom;
          if (outside) close();
        }}
        onCancel={close}
      >
        <form method="dialog">
          <button type="submit" className="order-photo-close">
            Close
          </button>
        </form>
        <button
          type="button"
          className="order-photo-full"
          onClick={close}
          aria-label="Close enlarged photo"
        >
          <Image src={src} alt={alt} width={1600} height={1067} sizes="92vw" />
        </button>
      </dialog>
    </>
  );
}
