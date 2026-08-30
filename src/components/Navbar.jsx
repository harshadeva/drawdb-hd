import { useState } from "react";
import { Link } from "react-router-dom";
import { SideSheet } from "@douyinfe/semi-ui";
import { IconMenu } from "@douyinfe/semi-icons";
import Logo from "./Logo";
import { socials } from "../data/socials";

const navLinkClass =
  "text-[15px] font-semibold text-[#161422]/70 transition-colors duration-200 hover:text-[#161422]";

export default function Navbar() {
  const [openMenu, setOpenMenu] = useState(false);

  const scrollToFeatures = () => {
    document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <div className="flex items-center justify-between px-10 py-4 sm:px-4">
        <Link to="/" aria-label="Dbraw home">
          <Logo size={38} />
        </Link>

        <div className="flex items-center gap-9 md:hidden">
          <button className={navLinkClass} onClick={scrollToFeatures}>
            Features
          </button>
          <Link to="/templates" className={navLinkClass}>
            Templates
          </Link>
          <a
            href={socials.docs}
            target="_blank"
            rel="noreferrer"
            className={navLinkClass}
          >
            Docs
          </a>
          <a
            href={socials.github}
            target="_blank"
            rel="noreferrer"
            className="text-xl text-[#161422]/60 transition-colors hover:text-[#161422]"
            title="GitHub"
          >
            <i className="bi bi-github" />
          </a>
          <Link
            to="/editor"
            className="rounded-full bg-[#161422] px-5 py-2.5 text-[15px] font-semibold text-white transition-all duration-300 hover:bg-[#2a2740]"
          >
            Open the board
          </Link>
        </div>

        <button
          onClick={() => setOpenMenu((prev) => !prev)}
          className="hidden h-[24px] text-[#161422] md:inline-block"
          aria-label="Menu"
        >
          <IconMenu size="extra-large" />
        </button>
      </div>
      <hr className="border-[#e9e0d4]" />

      <SideSheet
        title={<Logo size={34} />}
        visible={openMenu}
        onCancel={() => setOpenMenu(false)}
        width={window.innerWidth}
      >
        <button
          className="block w-full p-3 text-left text-base font-semibold hover:bg-[#fbf6f0]"
          onClick={() => {
            scrollToFeatures();
            setOpenMenu(false);
          }}
        >
          Features
        </button>
        <hr className="border-[#e9e0d4]" />
        <Link
          to="/templates"
          className="block p-3 text-base font-semibold hover:bg-[#fbf6f0]"
        >
          Templates
        </Link>
        <hr className="border-[#e9e0d4]" />
        <a
          href={socials.docs}
          target="_blank"
          rel="noreferrer"
          className="block p-3 text-base font-semibold hover:bg-[#fbf6f0]"
        >
          Docs
        </a>
        <hr className="border-[#e9e0d4]" />
        <Link
          to="/bug-report"
          className="block p-3 text-base font-semibold hover:bg-[#fbf6f0]"
        >
          Report a bug
        </Link>
        <hr className="border-[#e9e0d4]" />
        <Link
          to="/editor"
          className="mt-3 block rounded-full bg-[#ff6a3d] p-3 text-center text-base font-semibold text-white"
        >
          Open the board
        </Link>
      </SideSheet>
    </>
  );
}
