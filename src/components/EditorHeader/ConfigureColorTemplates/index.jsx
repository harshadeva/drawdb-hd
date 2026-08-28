import { Button, Modal, Toast } from "@douyinfe/semi-ui";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { nanoid } from "nanoid";
import Empty from "../../EditorSidePanel/Empty";
import ColorTemplateRow from "./components/ColorTemplateRow";
import { defaultBlue } from "../../../data/constants";
import { useColorPalette } from "../../../hooks";

const normalizeHex = (hex) =>
  typeof hex === "string" && /^#[0-9a-fA-F]{6}/.test(hex)
    ? hex.slice(0, 7).toLowerCase()
    : defaultBlue;

export default function ConfigureColorTemplates({ open, onClose }) {
  const { t } = useTranslation();
  const { templates: savedTemplates, setTemplates: persistTemplates } =
    useColorPalette();
  const [templates, setTemplates] = useState([]);

  useEffect(() => {
    if (!open) return;
    setTemplates(savedTemplates.map((tpl) => ({ ...tpl })));
  }, [open, savedTemplates]);

  const handleAdd = () => {
    setTemplates((prev) => [
      ...prev,
      { id: nanoid(), name: `color_${prev.length + 1}`, value: defaultBlue },
    ]);
  };

  const handleChange = (id, patch) => {
    setTemplates((prev) =>
      prev.map((tpl) => (tpl.id === id ? { ...tpl, ...patch } : tpl)),
    );
  };

  const handleDelete = (id) => {
    setTemplates((prev) => prev.filter((tpl) => tpl.id !== id));
  };

  const handleSave = () => {
    const seen = new Set();
    for (const tpl of templates) {
      const name = tpl.name.trim();
      if (!name) {
        Toast.warning(t("color_template_name_required"));
        return;
      }
      if (seen.has(name.toLowerCase())) {
        Toast.warning(t("color_template_name_duplicate", { name }));
        return;
      }
      seen.add(name.toLowerCase());
    }
    persistTemplates(
      templates.map((tpl) => ({
        id: tpl.id,
        name: tpl.name.trim(),
        value: normalizeHex(tpl.value),
      })),
    );
    Toast.success(t("saved"));
    onClose();
  };

  const handleClose = () => {
    setTemplates([]);
    onClose();
  };

  return (
    <Modal
      title={t("configure_color_templates")}
      centered
      size="medium"
      visible={open}
      onCancel={handleClose}
      footer={
        <div
          className={`flex items-center ${
            templates.length === 0 ? "justify-end" : "justify-between"
          }`}
        >
          {templates.length > 0 && (
            <Button onClick={handleAdd} className="m-0!">
              {t("add_color")}
            </Button>
          )}
          <div>
            <Button onClick={handleClose} type="tertiary">
              {t("close")}
            </Button>
            <Button theme="solid" onClick={handleSave}>
              {t("save")}
            </Button>
          </div>
        </div>
      }
    >
      <p className="opacity-80 mb-5">{t("color_templates_description")}</p>

      {templates.length > 0 ? (
        <div className="max-h-[60vh] overflow-y-auto pe-1">
          {templates.map((tpl) => (
            <ColorTemplateRow
              key={tpl.id}
              template={tpl}
              onChange={(patch) => handleChange(tpl.id, patch)}
              onDelete={() => handleDelete(tpl.id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center">
          <Empty />
          <div className="text-md font-semibold">
            {t("no_color_templates")}
          </div>
          <div className="opacity-70 text-sm mt-1">
            {t("no_color_templates_text")}
          </div>
          <Button theme="solid" className="mt-5" onClick={handleAdd}>
            {t("add_color")}
          </Button>
        </div>
      )}
    </Modal>
  );
}
