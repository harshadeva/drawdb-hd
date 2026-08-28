import { Button } from "@douyinfe/semi-ui";
import { IconPlus } from "@douyinfe/semi-icons";
import { useTranslation } from "react-i18next";
import TemplateFieldRow from "./TemplateFieldRow";

const blankField = () => ({
  name: "",
  type: "",
  default: "",
  check: "",
  primary: false,
  unique: false,
  unsigned: false,
  notNull: false,
  increment: false,
  comment: "",
});

export default function TemplateFieldsEditor({ fields, database, onChange }) {
  const { t } = useTranslation();

  const updateField = (index, patch) => {
    onChange(fields.map((f, i) => (i === index ? { ...f, ...patch } : f)));
  };

  const deleteField = (index) => {
    onChange(fields.filter((_, i) => i !== index));
  };

  const addField = () => {
    onChange([...fields, blankField()]);
  };

  return (
    <div className="pb-1">
      {fields.map((field, i) => (
        <TemplateFieldRow
          key={i}
          field={field}
          database={database}
          onChange={(patch) => updateField(i, patch)}
          onDelete={() => deleteField(i)}
        />
      ))}
      <Button block icon={<IconPlus />} onClick={addField}>
        {t("add_field")}
      </Button>
    </div>
  );
}
