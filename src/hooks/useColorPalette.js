import { useContext } from "react";
import { ColorPaletteContext } from "../context/ColorPaletteContext";

export default function useColorPalette() {
  return useContext(ColorPaletteContext) ?? { templates: [], resolve: (d) => d?.color };
}
