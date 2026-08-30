import { Tooltip } from "@douyinfe/semi-ui";
import { useTranslation } from "react-i18next";
import { Cardinality } from "../../data/constants";

const options = [
  { value: Cardinality.ONE_TO_ONE, label: "1:1" },
  { value: Cardinality.ONE_TO_MANY, label: "1:N" },
  { value: Cardinality.MANY_TO_ONE, label: "N:1" },
];

export default function RelationshipToolbar({ mode, onSelect, disabled }) {
  const { t } = useTranslation();

  return (
    <div className="popover-theme flex rounded-lg items-center overflow-hidden shadow-md">
      <Tooltip content={t("relationship_tool")}>
        <div className="px-2 py-2 flex items-center text-zinc-400">
          <i className="bi bi-diagram-2" />
        </div>
      </Tooltip>
      {options.map((opt) => (
        <Tooltip key={opt.value} content={t(opt.value)}>
          <button
            disabled={disabled}
            aria-pressed={mode === opt.value}
            onClick={() => onSelect(mode === opt.value ? null : opt.value)}
            className={`px-3 py-2 font-semibold text-sm border-l border-color disabled:opacity-40 ${
              mode === opt.value ? "bg-[#ff6a3d] text-white" : ""
            }`}
          >
            {opt.label}
          </button>
        </Tooltip>
      ))}
    </div>
  );
}
