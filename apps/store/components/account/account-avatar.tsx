"use client";

import { useState } from "react";
import { UserRound } from "lucide-react";

export function AccountAvatar({ url }: { url?: string | null }) {
  const [broken, setBroken] = useState(false);
  if (!url || broken) {
    return <UserRound size={17} strokeWidth={1.8} />;
  }
  return (
    <img
      src={url}
      alt=""
      className="account-trigger-photo"
      referrerPolicy="no-referrer"
      onError={() => setBroken(true)}
    />
  );
}
