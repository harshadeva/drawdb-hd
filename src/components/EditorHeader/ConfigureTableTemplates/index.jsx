import { Button, Modal, Toast, Collapse, Input } from "@douyinfe/semi-ui";
import { IconDeleteStroked } from "@douyinfe/semi-icons";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Empty from "../../EditorSidePanel/Empty";
import TemplateFieldsEditor from "./components/TemplateFieldsEditor";
import { useDiagram } from "../../../hooks";
import {
  getTableTemplates,
  saveTableTemplates,
} from "../../../utils/tableTemplates";

export default function ConfigureTableTemplates({ open, onClose }) {
  const { t } = useTranslation();
  const { database } = useDiagram();
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

  const handleDeleteTemplate = (id) => {
    setTemplates((prev) => prev.filter((tpl) => tpl.id !== id));
  };

  const handleFieldsChange = (id, fields) => {
    setTemplates((prev) =>
      prev.map((tpl) => (tpl.id === id ? { ...tpl, fields } : tpl)),
    );
  };

  const handleSave = () => {
    for (const tpl of templates) {
      if (!tpl.name.trim()) {
        Toast.warning(t("template_name_required"));
        return;
      }
      for (const field of tpl.fields) {
        if (!field.name.trim() || !field.type.trim()) {
          Toast.warning(
            t("template_field_invalid", { templateName: tpl.name }),
          );
          return;
        }
        if (field.references && !field.references.table.trim()) {
          Toast.warning(
            t("template_fk_table_required", { templateName: tpl.name }),
          );
          return;
        }
      }
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
      size="large"
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
        <div className="max-h-[60vh] overflow-y-auto">
          <Collapse keepDOM={false} lazyRender accordion>
            {templates.map((tpl) => (
              <Collapse.Panel
                key={tpl.id}
                itemKey={tpl.id}
                header={
                  <div className="flex items-center gap-2 w-full pr-2">
                    <Input
                      value={tpl.name}
                      placeholder={t("name")}
                      validateStatus={
                        tpl.name.trim() === "" ? "error" : "default"
                      }
                      className="flex-1"
                      onClick={(e) => e.stopPropagation()}
                      onChange={(v) => handleRename(tpl.id, v)}
                    />
                    <span className="text-xs opacity-60 whitespace-nowrap">
                      {tpl.fields.length} {t("columns")}
                    </span>
                    <Button
                      icon={<IconDeleteStroked />}
                      type="danger"
                      theme="borderless"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTemplate(tpl.id);
                      }}
                    />
                  </div>
                }
              >
                <TemplateFieldsEditor
                  fields={tpl.fields}
                  database={database}
                  onChange={(fields) => handleFieldsChange(tpl.id, fields)}
                />
              </Collapse.Panel>
            ))}
          </Collapse>
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
