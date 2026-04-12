"use client";

import { useState } from "react";
import type { ShoppingItem } from "@/components/shopping-list/types";

interface ModalState {
  showModal: boolean;
  editingItem?: ShoppingItem;
}

export interface UndoToast {
  item: ShoppingItem;
  timeoutId: NodeJS.Timeout;
}

export function useShoppingListUI() {
  const [searchQuery, setSearchQuery] = useState("");
  const [modalState, setModalState] = useState<ModalState>({ showModal: false, editingItem: undefined });
  const [undoToasts, setUndoToasts] = useState<UndoToast[]>([]);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  return {
    searchQuery,
    setSearchQuery,
    modalState,
    setModalState,
    undoToasts,
    setUndoToasts,
    activeFilter,
    setActiveFilter,
  };
}
