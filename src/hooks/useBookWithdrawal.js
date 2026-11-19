import { useState } from "react";

export function useBookWithdrawal(reload) {
  const [withdrawing, setWithdrawing] = useState(null);
  const [announcement, setAnnouncement] = useState("");

  const handleWithdrawn = () => {
    setAnnouncement(`${withdrawing.title} is available to publish again.`);
    setWithdrawing(null);
    reload();
  };

  return {
    withdrawing,
    announcement,
    setWithdrawing,
    handleWithdrawn,
    handleConflict: reload,
  };
}
