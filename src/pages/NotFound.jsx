import { useEffect } from "react";
import { Link } from "react-router-dom";
import Logo from "../components/Logo";
import { socials } from "../data/socials";

export default function NotFound() {
  useEffect(() => {
    document.body.setAttribute("theme-mode", "light");
    document.title = "Lost the thread · Dbraw";
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-[#fbf6f0] text-[#161422]">
      <div className="px-10 py-4 sm:px-4">
        <Link to="/" aria-label="Dbraw home">
          <Logo size={38} />
        </Link>
      </div>
      <hr className="border-[#e9e0d4]" />

      <div className="flex flex-1 items-center justify-center px-6 py-20">
        <div className="max-w-lg text-center">
          <div className="text-[80px] font-extrabold leading-none tracking-tight text-[#ff6a3d]">
            404
          </div>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight">
            This row doesn&apos;t exist
          </h1>
          <p className="mt-3 text-[15px] text-[#161422]/65">
            The page you were after isn&apos;t on the board. Head back to a blank
            canvas, or check the docs if you were looking for something specific.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link
              to="/editor"
              className="inline-flex items-center gap-2 rounded-full bg-[#ff6a3d] px-7 py-3 font-semibold text-white shadow-[0_14px_34px_-12px_rgba(255,106,61,0.7)] transition-all duration-300 hover:bg-[#e8532a] hover:-translate-y-0.5"
            >
              Open the board <i className="bi bi-arrow-right" />
            </Link>
            <a
              href={socials.docs}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border-2 border-[#161422]/15 bg-white px-7 py-3 font-semibold text-[#161422] transition-all duration-300 hover:border-[#161422]/40"
            >
              Read the docs
            </a>
          </div>
          <div className="mt-6 text-sm text-[#161422]/50">
            Still stuck?{" "}
            <a
              className="font-semibold text-[#ff6a3d] hover:underline"
              href="mailto:drawdb@outlook.com"
            >
              Send us an email
            </a>
            .
          </div>
        </div>
      </div>
    </div>
  );
}
