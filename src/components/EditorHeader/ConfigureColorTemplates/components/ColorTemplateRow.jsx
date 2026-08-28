import { Button, Input, ColorPicker as SemiColorPicker } from "@douyinfe/semi-ui";
import { IconDeleteStroked } from "@douyinfe/semi-icons";
import { useTranslation } from "react-i18next";

export default function ColorTemplateRow({ template, onChange, onDelete }) {
  const { t } = useTranslation();

  return (
    <div className="flex gap-2 items-center mb-2">
      <SemiColorPicker
        alpha={false}
        usePopover
        value={SemiColorPicker.colorStringToValue(template.value)}
        onChange={({ hex }) => onChange({ value: hex })}
      >
        <div
          className="h-8 w-8 rounded-md border border-black/20 shrink-0 cursor-pointer"
          style={{ backgroundColor: template.value }}
        />
      </SemiColorPicker>
      <Input
        value={template.name}
        placeholder={t("color_name")}
        validateStatus={template.name.trim() === "" ? "error" : "default"}
        className="flex-1"
        onChange={(v) => onChange({ name: v })}
      />
      <Button
        icon={<IconDeleteStroked />}
        type="danger"
        theme="borderless"
        onClick={onDelete}
      />
    </div>
  );
}
