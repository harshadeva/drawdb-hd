import { Input, Button, Tag } from "@douyinfe/semi-ui";
import { IconDeleteStroked } from "@douyinfe/semi-icons";

export default function TemplateRow({ template, onRename, onDelete }) {
  return (
    <tr className="border-b border-[var(--semi-color-border)] last:border-b-0">
      <td className="py-2 pr-3 align-middle w-48">
        <Input
          value={template.name}
          onChange={(v) => onRename(template.id, v)}
        />
      </td>
      <td className="py-2 pr-3 align-middle">
        <div className="flex flex-wrap gap-1">
          {template.fields.map((field, i) => (
            <Tag key={i} size="small">
              {field.name}: {field.type}
            </Tag>
          ))}
        </div>
      </td>
      <td className="py-2 align-middle w-[1%] whitespace-nowrap">
        <Button
          icon={<IconDeleteStroked />}
          type="danger"
          size="large"
          onClick={() => onDelete(template.id)}
        />
      </td>
    </tr>
  );
}
