import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../services/auth.js";

export function useAccountMenu(containerRef) {
  const navigate = useNavigate();
  const [activeDialog, setActiveDialog] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const closeOnOutsidePress = (event) => {
      if (!containerRef.current?.contains(event.target)) setMenuOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsidePress);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePress);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [containerRef, menuOpen]);

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    navigate("/", { replace: true });
  };

  const handlePasswordUpdated = (message) => {
    setActiveDialog(null);
    setStatusMessage(message);
  };

  const handleAccountDeleted = () => {
    setActiveDialog(null);
    navigate("/login", { replace: true });
  };

  const openDialog = (dialog) => {
    setStatusMessage("");
    setMenuOpen(false);
    setActiveDialog(dialog);
  };

  return {
    menuOpen,
    toggleMenu: () => setMenuOpen((open) => !open),
    activeDialog,
    closeDialog: () => setActiveDialog(null),
    statusMessage,
    openDialog,
    handleLogout,
    handlePasswordUpdated,
    handleAccountDeleted,
  };
}
