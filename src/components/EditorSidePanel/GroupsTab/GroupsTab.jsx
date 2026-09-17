import { Button, Switch } from "@douyinfe/semi-ui";
import { IconPlus } from "@douyinfe/semi-icons";
import Empty from "../Empty";
import { useGroups, useLayout, useSettings } from "../../../hooks";
import GroupInfo from "./GroupInfo";
import { useTranslation } from "react-i18next";

export default function GroupsTab() {
  const { groups, addGroup } = useGroups();
  const { layout } = useLayout();
  const { settings, setSettings } = useSettings();
  const { t } = useTranslation();

  return (
    <div>
      <div className="flex gap-2">
        <Button
          icon={<IconPlus />}
          onClick={() => addGroup()}
          disabled={layout.readOnly}
          block
        >
          {t("add_group")}
        </Button>
      </div>
      <div className="flex items-center justify-between mt-2 px-1">
        <span className="text-xs opacity-70">{t("show_group_chips")}</span>
        <Switch
          checked={settings.showGroupChips}
          onChange={(checked) =>
            setSettings((prev) => ({ ...prev, showGroupChips: checked }))
          }
          size="small"
        />
      </div>
      <div className="flex items-center justify-between mt-2 px-1">
        <span className="text-xs opacity-70">
          {t("dim_group_connections")}
        </span>
        <Switch
          checked={settings.dimGroupConnections}
          onChange={(checked) =>
            setSettings((prev) => ({ ...prev, dimGroupConnections: checked }))
          }
          size="small"
        />
      </div>
      {groups.length <= 0 ? (
        <Empty title={t("no_groups")} text={t("no_groups_text")} />
      ) : (
        <div className="p-2">
          {groups.map((g) => (
            <GroupInfo data={g} key={g.id} />
          ))}
        </div>
      )}
    </div>
  );
}
