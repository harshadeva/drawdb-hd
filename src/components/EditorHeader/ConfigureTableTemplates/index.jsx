import { Button, Modal, Toast } from "@douyinfe/semi-ui";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Empty from "../../EditorSidePanel/Empty";
import TemplateRow from "./components/TemplateRow";
import { getTableTemplates, saveTableTemplates } from "../../../utils/tableTemplates";

export default function ConfigureTableTemplates({ open, onClose }) {
  const { t } = useTranslation();
  const [templates, setTemplates] = useState([]);

  useEffect(() => {
    if (!open) return;
    setTemplates(getTableTemplates());
  }, [open]);

  const handleRename = (id, name) => {
    setTemplates((prev) =>
      prev.map((tpl) => (tpl.id === id ? { ...tpl, name } : tpl)),
    );
  };

  const handleDelete = (id) => {
    setTemplates((prev) => prev.filter((tpl) => tpl.id !== id));
  };

  const handleSave = () => {
    const invalid = templates.find((tpl) => !tpl.name.trim());
    if (invalid) {
      Toast.warning(t("template_name_required"));
      return;
    }
    saveTableTemplates(templates);
    Toast.success(t("saved"));
    onClose();
  };

  const handleClose = () => {
    setTemplates([]);
    onClose();
  };

  return (
    <Modal
      title={t("configure_table_templates")}
      centered
      size="medium"
      visible={open}
      onCancel={handleClose}
      footer={
        <div className="flex items-center justify-end">
          <Button onClick={handleClose} type="tertiary">
            {t("close")}
          </Button>
          <Button theme="solid" onClick={handleSave}>
            {t("save")}
          </Button>
        </div>
      }
    >
      <p className="opacity-80 mb-5">{t("table_templates_description")}</p>

      {templates.length > 0 ? (
        <div className="max-h-96 overflow-y-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="text-left text-[var(--semi-color-text-2)]">
                <th className="font-medium align-bottom">{t("name")}</th>
                <th className="font-medium align-bottom">{t("columns")}</th>
                <th aria-label={t("delete")} />
              </tr>
            </thead>
            <tbody>
              {templates.map((tpl) => (
                <TemplateRow
                  key={tpl.id}
                  template={tpl}
                  onRename={handleRename}
                  onDelete={handleDelete}
                />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center">
          <Empty />
          <div className="text-md font-semibold">
            {t("no_table_templates")}
          </div>
          <div className="opacity-70 text-sm mt-1">
            {t("no_table_templates_text")}
          </div>
        </div>
      )}
    </Modal>
  );
}
