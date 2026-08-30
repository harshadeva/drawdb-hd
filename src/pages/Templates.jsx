import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Tabs, TabPane, Banner, Steps } from "@douyinfe/semi-ui";
import { IconDeleteStroked } from "@douyinfe/semi-icons";
import { db } from "../data/db";
import { useLiveQuery } from "dexie-react-hooks";
import Thumbnail from "../components/Thumbnail";
import Logo from "../components/Logo";
import BoardPreview from "../components/BoardPreview";

const forkBtn =
  "flex items-center gap-1.5 rounded-full border border-[#e9e0d4] bg-white px-3 py-1.5 text-sm font-semibold text-[#161422] transition-all duration-200 hover:border-[#ff6a3d]/50 hover:text-[#ff6a3d]";

export default function Templates() {
  const defaultTemplates = useLiveQuery(() =>
    db.templates.where({ custom: 0 }).toArray(),
  );

  const customTemplates = useLiveQuery(() =>
    db.templates.where({ custom: 1 }).toArray(),
  );

  const deleteTemplate = async (id) => {
    await db.templates.delete(id);
  };

  const forkTemplate = (id) => {
    window.open("/editor/templates/" + id, "_blank");
  };

  useEffect(() => {
    document.body.setAttribute("theme-mode", "light");
    document.title = "Templates · Dbraw";
  }, []);

  return (
    <div className="min-h-screen bg-[#fbf6f0] text-[#161422]">
      <div className="min-h-screen">
        <div className="flex items-center justify-between px-12 py-5 select-none xl:px-20 sm:px-6 sm:py-3">
          <div className="flex items-center gap-4">
            <Link to="/" aria-label="Dbraw home">
              <Logo size={38} />
            </Link>
            <span className="h-6 w-px bg-[#e9e0d4]" />
            <div className="text-xl font-bold sm:text-sm xl:text-xl">
              Templates
            </div>
          </div>
          <Link
            to="/editor"
            className="rounded-full bg-[#161422] px-5 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:bg-[#2a2740] sm:hidden"
          >
            Open the board
          </Link>
        </div>
        <hr className="border-[#e9e0d4]" />
        <div className="px-12 py-8 xl:px-20 sm:px-6">
          <div className="mb-4 w-full md:w-[75%] xl:w-[55%]">
            <div className="text-3xl font-extrabold tracking-tight sm:text-xl">
              Start from a schema that already works
            </div>
            <div className="mt-2 text-[15px] text-[#161422]/65">
              A shelf of ready-made entity-relationship diagrams. Fork one to get
              a running start, or borrow the parts you need.
            </div>
          </div>
          <Tabs>
            <TabPane
              tab={<span className="mx-2">Default templates</span>}
              itemKey="1"
            >
              <div className="my-6 grid grid-cols-2 gap-8 xl:grid-cols-3 sm:grid-cols-1">
                {defaultTemplates?.map((t, i) => (
                  <div
                    key={t.id}
                    className="overflow-hidden rounded-2xl border border-[#e9e0d4] bg-white transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_24px_50px_-30px_rgba(22,20,34,0.35)]"
                  >
                    <div className="h-48 bg-[#fbf6f0]">
                      <Thumbnail
                        diagram={t}
                        i={"1" + i}
                        zoom={0.3}
                        theme="light"
                      />
                    </div>
                    <div className="px-4 py-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-lg font-bold">{t.title}</div>
                        <button
                          className={forkBtn}
                          onClick={() => forkTemplate(t.templateId)}
                        >
                          <i className="fa-solid fa-code-fork" />
                          Fork
                        </button>
                      </div>
                      <div className="mt-1 text-sm text-[#161422]/65">
                        {t.description}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabPane>
            <TabPane
              tab={<span className="mx-2">Your templates</span>}
              itemKey="2"
            >
              {customTemplates?.length > 0 ? (
                <div className="my-6 grid grid-cols-2 gap-8 xl:grid-cols-3 sm:grid-cols-1">
                  {customTemplates?.map((c, i) => (
                    <div
                      key={c.id}
                      className="overflow-hidden rounded-2xl border border-[#e9e0d4] bg-white transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_24px_50px_-30px_rgba(22,20,34,0.35)]"
                    >
                      <div className="h-48 bg-[#fbf6f0]">
                        <Thumbnail diagram={c} i={"2" + i} zoom={0.3} />
                      </div>
                      <div className="w-full px-4 py-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-lg font-bold">{c.title}</div>
                          <button
                            className={forkBtn}
                            onClick={() => forkTemplate(c.templateId)}
                          >
                            <i className="fa-solid fa-code-fork" />
                            Fork
                          </button>
                        </div>
                        <button
                          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-full border border-[#e9e0d4] bg-white px-2 py-1.5 text-sm font-semibold text-rose-500 transition-all duration-200 hover:border-rose-300 hover:bg-rose-50"
                          onClick={() => deleteTemplate(c.id)}
                        >
                          <IconDeleteStroked />
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-5">
                  <Banner
                    fullMode={false}
                    type="info"
                    bordered
                    icon={null}
                    closeIcon={null}
                    description={<div>You have no saved templates yet.</div>}
                  />
                  <div className="my-4 grid grid-cols-5 place-content-center gap-6 sm:grid-cols-1">
                    <div className="col-span-3 rounded-xl border border-[#e9e0d4] bg-white p-3 sm:col-span-1">
                      <BoardPreview />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <div className="my-4 text-xl font-bold">
                        Save your own template
                      </div>
                      <Steps direction="vertical" style={{ margin: "12px" }}>
                        <Steps.Step
                          title="Draw a diagram"
                          description="Build the structure on the board"
                        />
                        <Steps.Step
                          title="Save as template"
                          description="Editor → File → Save as template"
                        />
                        <Steps.Step
                          title="Fork it later"
                          description="Reuse it as the base for new work"
                        />
                      </Steps>
                    </div>
                  </div>
                </div>
              )}
            </TabPane>
          </Tabs>
        </div>
      </div>
      <hr className="border-[#e9e0d4]" />
      <div className="py-5 text-center text-sm text-[#161422]/55">
        &copy; {new Date().getFullYear()} <strong className="text-[#161422]">Dbraw</strong> · Draw freely.
      </div>
    </div>
  );
}
