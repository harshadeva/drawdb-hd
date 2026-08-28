import { Input, Button, Select, Popover } from "@douyinfe/semi-ui";
import {
  IconDeleteStroked,
  IconKeyStroked,
  IconChainStroked,
} from "@douyinfe/semi-icons";
import { useTranslation } from "react-i18next";
import { nanoid } from "nanoid";
import { Cardinality, Constraint } from "../../../../data/constants";
import { dbToTypes } from "../../../../data/datatypes";
import { getCustomTypesForDb } from "../../../../utils/customTypes";

function FkPopoverContent({ field, onChange }) {
  const { t } = useTranslation();
  const references = field.references;

  if (!references) {
    return (
      <div className="popover-theme p-1 w-[260px]">
        <Button
          block
          icon={<IconChainStroked />}
          onClick={() =>
            onChange({
              references: {
                table: "",
                field: "",
                cardinality: Cardinality.MANY_TO_ONE,
                updateConstraint: Constraint.NONE,
                deleteConstraint: Constraint.NONE,
                fkGroup: nanoid(),
              },
            })
          }
        >
          {t("add_foreign_key")}
        </Button>
      </div>
    );
  }

  const update = (patch) => onChange({ references: { ...references, ...patch } });

  return (
    <div className="popover-theme p-1 w-[260px]">
      <div className="font-semibold mb-2">{t("foreign_key")}</div>
      <Input
        value={references.table}
        placeholder={t("referenced_table")}
        className="mb-2"
        onChange={(v) => update({ table: v })}
      />
      <Input
        value={references.field || ""}
        placeholder={t("referenced_column_optional")}
        className="mb-2"
        onChange={(v) => update({ field: v })}
      />
      <Select
        className="w-full mb-2"
        optionList={Object.values(Cardinality).map((v) => ({
          label: t(v),
          value: v,
        }))}
        value={references.cardinality}
        onChange={(v) => update({ cardinality: v })}
      />
      <div className="grid grid-cols-2 gap-2 mb-2">
        <Select
          optionList={Object.values(Constraint).map((v) => ({
            label: v,
            value: v,
          }))}
          value={references.updateConstraint}
          onChange={(v) => update({ updateConstraint: v })}
        />
        <Select
          optionList={Object.values(Constraint).map((v) => ({
            label: v,
            value: v,
          }))}
          value={references.deleteConstraint}
          onChange={(v) => update({ deleteConstraint: v })}
        />
      </div>
      <Button
        block
        type="danger"
        theme="borderless"
        onClick={() => onChange({ references: undefined })}
      >
        {t("remove_foreign_key")}
      </Button>
    </div>
  );
}

export default function TemplateFieldRow({ field, database, onChange, onDelete }) {
  const { t } = useTranslation();

  const typeOptions = [
    ...Object.keys(dbToTypes[database] ?? {}).map((value) => ({
      label: value,
      value,
    })),
    ...Object.keys(getCustomTypesForDb(database)).map((value) => ({
      label: value,
      value,
    })),
  ];

  return (
    <div className="flex gap-2 items-center mb-2">
      <Input
        value={field.name}
        placeholder={t("name")}
        validateStatus={field.name.trim() === "" ? "error" : "default"}
        className="flex-1 min-w-20"
        onChange={(v) => onChange({ name: v })}
      />
      <Select
        className="w-32"
        filter
        allowCreate
        optionList={typeOptions}
        value={field.type}
        validateStatus={field.type.trim() === "" ? "error" : "default"}
        placeholder={t("type")}
        onChange={(v) => onChange({ type: v })}
      />
      <Button
        title={t("primary")}
        theme={field.primary ? "solid" : "light"}
        type={field.primary ? "primary" : "tertiary"}
        icon={<IconKeyStroked size="small" />}
        onClick={() => onChange({ primary: !field.primary })}
      />
      <Button
        title={t("nullable")}
        type={field.notNull ? "tertiary" : "primary"}
        theme={field.notNull ? "light" : "solid"}
        onClick={() => onChange({ notNull: !field.notNull })}
      >
        ?
      </Button>
      <Popover
        trigger="click"
        position="left"
        showArrow
        content={<FkPopoverContent field={field} onChange={onChange} />}
      >
        <Button
          title={t("foreign_key")}
          theme={field.references ? "solid" : "light"}
          type={field.references ? "primary" : "tertiary"}
          icon={<IconChainStroked size="small" />}
        />
      </Popover>
      <Button
        icon={<IconDeleteStroked size="small" />}
        type="danger"
        theme="borderless"
        onClick={onDelete}
      />
    </div>
  );
}
