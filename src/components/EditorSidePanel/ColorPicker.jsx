import { ColorPicker as SemiColorPicker, Tooltip } from "@douyinfe/semi-ui";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useColorPalette } from "../../hooks";

export function openColorTemplatesModal() {
  window.dispatchEvent(new Event("open-color-templates"));
}

export default function ColorPicker({
  value,
  colorId = null,
  readOnly,
  children,
  onChange,
  onColorPick,
  ...props
}) {
  const { t } = useTranslation();
  const { templates } = useColorPalette();
  const [pickedColor, setPickedColor] = useState(null);
  const [visible, setVisible] = useState(false);

  const commitColorPick = () => {
    if (pickedColor) onColorPick?.(pickedColor, null);
    setPickedColor(null);
  };

  const applyTemplate = (tpl) => {
    if (readOnly) return;
    onChange?.(tpl.value);
    onColorPick?.(tpl.value, tpl.id);
    setPickedColor(null);
    setVisible(false);
  };

  const topSlot = (
    <div className="px-3 pt-3 pb-1">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold opacity-70">
          {t("color_templates")}
        </span>
        <button
          type="button"
          className="text-xs text-[#ff6a3d] hover:underline"
          onClick={() => {
            setVisible(false);
            openColorTemplatesModal();
          }}
        >
          {t("manage_color_templates")}
        </button>
      </div>
      {templates.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 mb-1">
          {templates.map((tpl) => (
            <Tooltip key={tpl.id} content={tpl.name} position="top">
              <div
                role="button"
                tabIndex={0}
                aria-label={tpl.name}
                onClick={() => applyTemplate(tpl)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") applyTemplate(tpl);
                }}
                className={`h-5 w-5 rounded cursor-pointer border ${
                  colorId === tpl.id
                    ? "ring-2 ring-offset-1 ring-[#ff6a3d] border-transparent"
                    : "border-black/20"
                }`}
                style={{ backgroundColor: tpl.value }}
              />
            </Tooltip>
          ))}
        </div>
      ) : (
        <div className="text-xs opacity-50 mb-1">
          {t("no_color_templates")}
        </div>
      )}
    </div>
  );

  return (
    <div
      onPointerUp={commitColorPick}
      onBlur={commitColorPick}
      onMouseLeave={commitColorPick}
    >
      <SemiColorPicker
        {...props}
        usePopover
        popoverProps={{
          visible,
          onVisibleChange: setVisible,
          trigger: "click",
        }}
        topSlot={topSlot}
        value={SemiColorPicker.colorStringToValue(value)}
        onChange={({ hex: color }) => {
          if (readOnly) return;
          setPickedColor(color);
          onChange?.(color);
        }}
      >
        {children || (
          <div
            className="h-8 w-8 rounded-md"
            style={{ backgroundColor: value }}
          />
        )}
      </SemiColorPicker>
    </div>
  );
}
