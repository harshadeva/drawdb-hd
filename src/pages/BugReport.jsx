import { useEffect, useState, useCallback, useRef } from "react";
import { Banner, Button, Input, Upload, Toast, Spin } from "@douyinfe/semi-ui";
import { IconGithubLogo, IconPaperclip } from "@douyinfe/semi-icons";
import RichEditor from "../components/LexicalEditor/RichEditor";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { editorConfig } from "../data/editorConfig";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $generateHtmlFromNodes } from "@lexical/html";
import { CLEAR_EDITOR_COMMAND } from "lexical";
import { Link } from "react-router-dom";
import Logo from "../components/Logo";
import { socials } from "../data/socials";
import { send } from "../api/email";
import { useThemedPage } from "../hooks";

function Form({ theme }) {
  const [editor] = useLexicalComposerContext();
  const [data, setData] = useState({
    title: "",
    attachments: [],
  });
  const [loading, setLoading] = useState(false);
  const uploadRef = useRef();

  const resetForm = () => {
    setData({
      title: "",
      attachments: [],
    });
    setLoading(false);

    if (uploadRef.current) {
      uploadRef.current.clear();
    }
  };

  const onFileChange = (fileList) => {
    const attachments = [];

    const processFile = (index) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        const dataUri = event.target.result;
        attachments.push({ path: dataUri, filename: fileList[index].name });
      };

      reader.readAsDataURL(fileList[index].fileInstance);
    };

    fileList.forEach((_, i) => processFile(i));

    setData((prev) => ({
      ...prev,
      attachments: attachments,
    }));
  };

  const onSubmit = useCallback(() => {
    setLoading(true);
    editor.update(() => {
      const sendMail = async () => {
        try {
          await send(
            `[BUG REPORT]: ${data.title}`,
            $generateHtmlFromNodes(editor),
            data.attachments,
          );
          Toast.success("Thanks — bug reported!");
          editor.dispatchCommand(CLEAR_EDITOR_COMMAND, null);
          resetForm();
        } catch {
          Toast.error("Oops! Something went wrong.");
          setLoading(false);
        }
      };
      sendMail();
    });
  }, [editor, data]);

  return (
    <div className="card-theme mt-6 rounded-2xl border border-color p-5">
      <Input
        placeholder="Title"
        value={data.title}
        onChange={(v) => setData((prev) => ({ ...prev, title: v }))}
      />
      <RichEditor theme={theme} placeholder="Describe the bug" />
      <Upload
        action="#"
        ref={uploadRef}
        onChange={(info) => onFileChange(info.fileList)}
        beforeUpload={({ file }) => {
          return {
            autoRemove: false,
            fileInstance: file.fileInstance,
            status: "success",
            shouldUpload: false,
          };
        }}
        draggable={true}
        dragMainText="Click to upload the file or drag and drop the file here"
        dragSubText="Upload up to 3 images"
        accept="image/*"
        limit={3}
      />
      <div className="flex items-center justify-end pt-4">
        <div className="flex items-center">
          <Button
            onClick={onSubmit}
            theme="solid"
            style={{
              padding: "16px 28px",
              borderRadius: "9999px",
              backgroundColor: "#ff6a3d",
              color: "white",
              fontWeight: 600,
            }}
            disabled={loading || data.title === "" || !data.title}
          >
            Send report
          </Button>
          <div className={loading ? "ms-2" : "hidden"}>
            <Spin />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BugReport() {
  const theme = localStorage.getItem("theme") || "light";

  useEffect(() => {
    document.title = "Report a bug · Dbraw";
    document.body.setAttribute("class", "theme");
  }, []);

  useThemedPage();

  const divider = theme === "dark" ? "border-zinc-700" : "border-[#e9e0d4]";

  return (
    <div className={theme === "dark" ? "" : "bg-[#fbf6f0] min-h-screen"}>
      <div className="flex items-center justify-between px-20 py-5 sm:px-6 sm:py-3">
        <div className="flex items-center gap-4">
          <Link to="/" aria-label="Dbraw home">
            <Logo size={36} dark={theme === "dark"} />
          </Link>
          <span className={`h-6 w-px ${theme === "dark" ? "bg-zinc-700" : "bg-[#e9e0d4]"}`} />
          <div className="text-lg font-bold sm:text-sm">Report a bug</div>
        </div>
      </div>
      <hr className={`${divider} my-1`} />
      <div className="mx-20 my-6 grid grid-cols-12 gap-8 sm:mx-6">
        <div className="col-span-4 md:col-span-12 lg:col-span-4">
          <div className="card-theme rounded-2xl border border-color p-6">
            {[
              ["Describe the bug", "A clear, concise description of what went wrong."],
              ["Steps to reproduce", "The exact steps that lead to the bug."],
              ["Expected behaviour", "What you expected to see versus what you saw."],
              ["Browser and device", "Where you ran into it."],
              ["Screenshots", "Add any images that help."],
            ].map(([title, body]) => (
              <div key={title} className="mt-3 first:mt-0">
                <div className="flex items-center">
                  <IconPaperclip />
                  <div className="ms-1 font-bold">{title}</div>
                </div>
                <div className="mt-1 text-sm opacity-75">{body}</div>
              </div>
            ))}
            <div className="my-3 flex items-center justify-center">
              <hr className={`${divider} grow`} />
              <div className="m-2 text-sm font-semibold">or</div>
              <hr className={`${divider} grow`} />
            </div>
            <Button
              block
              icon={<IconGithubLogo />}
              style={{
                backgroundColor: "#161422",
                color: "white",
                borderRadius: "9999px",
                fontWeight: 600,
              }}
              onClick={() => {
                window.open(`${socials.github}/issues`, "_self");
              }}
            >
              Open a GitHub issue
            </Button>
          </div>
        </div>
        <div className="col-span-8 md:col-span-12 lg:col-span-8">
          <Banner
            fullMode={false}
            type="info"
            icon={null}
            closeIcon={null}
            description={
              <div>
                Found something broken? Tell us about it. Every report makes
                Dbraw a little sturdier for the next person.
              </div>
            }
          />
          <LexicalComposer initialConfig={editorConfig}>
            <Form theme={theme} />
          </LexicalComposer>
        </div>
      </div>
      <hr className={`${divider} my-1`} />
      <div className="py-5 text-center text-sm opacity-70">
        &copy; {new Date().getFullYear()} <strong>Dbraw</strong> · Draw freely.
      </div>
    </div>
  );
}
