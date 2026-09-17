import { useContext } from "react";
import { GroupFocusContext } from "../context/GroupFocusContext";

export default function useGroupFocus() {
  return useContext(GroupFocusContext);
}
