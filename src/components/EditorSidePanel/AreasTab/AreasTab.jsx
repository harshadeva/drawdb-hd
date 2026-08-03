import { Button, ButtonGroup } from "@douyinfe/semi-ui";
import { IconPlus } from "@douyinfe/semi-icons";
import Empty from "../Empty";
import { useAreas, useLayout } from "../../../hooks";
import { AreaSubtype } from "../../../data/constants";
import SearchBar from "./SearchBar";
import AreaInfo from "./AreaDetails";
import { useTranslation } from "react-i18next";

export default function AreasTab() {
  const { areas, addArea } = useAreas();
  const { layout } = useLayout();
  const { t } = useTranslation();

  return (
    <div>
      <div className="flex gap-2">
        <SearchBar />
        <div>
          <ButtonGroup disabled={layout.readOnly}>
            <Button
              icon={<IconPlus />}
              onClick={() => addArea()}
              disabled={layout.readOnly}
            >
              {t("add_area")}
            </Button>
            <Button
              icon={<IconPlus />}
              onClick={() => addArea(null, true, AreaSubtype.BOUNDARY)}
              disabled={layout.readOnly}
            >
              {t("add_boundary")}
            </Button>
          </ButtonGroup>
        </div>
      </div>
      {areas.length <= 0 ? (
        <Empty
          title={t("no_subject_areas")}
          text={t("no_subject_areas_text")}
        />
      ) : (
        <div className="p-2">
          {areas.map((a, i) => (
            <AreaInfo data={a} key={"area_" + i} i={i} />
          ))}
        </div>
      )}
    </div>
  );
}
