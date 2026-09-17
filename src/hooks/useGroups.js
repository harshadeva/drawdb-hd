import { useContext } from "react";
import { GroupsContext } from "../context/GroupsContext";

export default function useGroups() {
  return useContext(GroupsContext);
}
