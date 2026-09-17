import LayoutContextProvider from "../context/LayoutContext";
import TransformContextProvider from "../context/TransformContext";
import TablesContextProvider from "../context/DiagramContext";
import UndoRedoContextProvider from "../context/UndoRedoContext";
import SelectContextProvider from "../context/SelectContext";
import SearchContextProvider from "../context/SearchContext";
import GroupFocusContextProvider from "../context/GroupFocusContext";
import AreasContextProvider from "../context/AreasContext";
import NotesContextProvider from "../context/NotesContext";
import TypesContextProvider from "../context/TypesContext";
import SettingsContextProvider from "../context/SettingsContext";
import SaveStateContextProvider from "../context/SaveStateContext";
import EnumsContextProvider from "../context/EnumsContext";
import ColorPaletteContextProvider from "../context/ColorPaletteContext";
import GroupsContextProvider from "../context/GroupsContext";
import WorkSpace from "../components/Workspace";
import { useThemedPage } from "../hooks";

export default function Editor() {
  useThemedPage();

  return (
    <SettingsContextProvider>
      <LayoutContextProvider>
        <TransformContextProvider>
          <UndoRedoContextProvider>
            <SelectContextProvider>
              <SearchContextProvider>
                <GroupFocusContextProvider>
                  <AreasContextProvider>
                    <NotesContextProvider>
                      <TypesContextProvider>
                        <EnumsContextProvider>
                          <TablesContextProvider>
                            <SaveStateContextProvider>
                              <ColorPaletteContextProvider>
                                <GroupsContextProvider>
                                  <WorkSpace />
                                </GroupsContextProvider>
                              </ColorPaletteContextProvider>
                            </SaveStateContextProvider>
                          </TablesContextProvider>
                        </EnumsContextProvider>
                      </TypesContextProvider>
                    </NotesContextProvider>
                  </AreasContextProvider>
                </GroupFocusContextProvider>
              </SearchContextProvider>
            </SelectContextProvider>
          </UndoRedoContextProvider>
        </TransformContextProvider>
      </LayoutContextProvider>
    </SettingsContextProvider>
  );
}
