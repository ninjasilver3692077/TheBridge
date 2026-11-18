import { useState } from "react";

export function useAdminModeration(reloadOverview) {
  const [removing, setRemoving] = useState(null);
  const [deletingMember, setDeletingMember] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [announcement, setAnnouncement] = useState("");

  const finish = (message) => {
    setAnnouncement(message);
    setReloadKey((key) => key + 1);
    reloadOverview();
  };

  const handleRemoved = () => {
    finish(`${removing.book.title} was removed.`);
    setRemoving(null);
  };

  const handleMemberDeleted = () => {
    finish(`${deletingMember.name} was deleted.`);
    setDeletingMember(null);
  };

  return {
    removing,
    deletingMember,
    reloadKey,
    announcement,
    setRemoving,
    setDeletingMember,
    handleRemoved,
    handleMemberDeleted,
  };
}
