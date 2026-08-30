import { useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Logo from "../components/Logo";
import BoardPreview from "../components/BoardPreview";
import mysql_icon from "../assets/mysql.png";
import postgres_icon from "../assets/postgres.png";
import sqlite_icon from "../assets/sqlite.png";
import mariadb_icon from "../assets/mariadb.png";
import sql_server_icon from "../assets/sql-server.png";
import FadeIn from "../animations/FadeIn";
import { languages } from "../i18n/i18n";
import { socials } from "../data/socials";

const primaryBtn =
  "inline-flex items-center justify-center gap-2 rounded-full bg-[#ff6a3d] px-7 py-3.5 font-semibold text-white shadow-[0_14px_34px_-12px_rgba(255,106,61,0.7)] transition-all duration-300 hover:bg-[#e8532a] hover:-translate-y-0.5";
const ghostBtn =
  "inline-flex items-center justify-center gap-2 rounded-full border-2 border-[#161422]/15 bg-white px-7 py-3.5 font-semibold text-[#161422] transition-all duration-300 hover:border-[#161422]/40";

export default function LandingPage() {
  useEffect(() => {
    document.body.setAttribute("theme-mode", "light");
    document.title = "Dbraw — draw your database, row by row";
  }, []);

  return (
    <div className="bg-[#fbf6f0] text-[#161422]">
      <div className="flex flex-col min-h-screen">
        <div className="bg-[#161422] py-2 text-center text-[13px] font-medium tracking-wide text-white/90">
          Dbraw is free while it&apos;s young — grab it before we grow up.{" "}
          <Link
            to="/editor"
            className="font-semibold text-[#ff8a3d] hover:underline"
          >
            Open the board →
          </Link>
        </div>

        <FadeIn duration={0.6}>
          <Navbar />
        </FadeIn>

        {/* Hero */}
        <div className="relative mx-3 mb-3 flex flex-1 items-center overflow-hidden rounded-[28px] border border-[#e9e0d4] bg-white bg-dots md:mx-0">
          <div className="mx-auto grid w-full max-w-6xl grid-cols-2 items-center gap-12 px-12 py-14 lg:grid-cols-1 lg:gap-10 md:px-6 md:py-10">
            <FadeIn duration={0.75}>
              <div>
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#ff6a3d]/25 bg-[#ff6a3d]/10 px-3 py-1 text-xs font-semibold text-[#c9451f]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#ff6a3d]" />
                  DB + draw + your new bro
                </div>
                <h1 className="text-[46px] font-extrabold leading-[1.05] tracking-tight md:text-[34px]">
                  Draw your database,{" "}
                  <span className="bg-gradient-to-r from-[#ff6a3d] via-[#ff5e3a] to-[#7a5cff] bg-clip-text text-transparent">
                    row by row
                  </span>
                  .
                </h1>
                <p className="mt-4 max-w-xl text-lg font-medium text-[#161422]/70 md:text-base">
                  Dbraw is the friendly drawing board for database schemas. Drag
                  out tables, snap relationships together, and walk away with
                  clean SQL. No account, no setup, no fuss.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link to="/editor" className={primaryBtn}>
                    Start drawing <i className="bi bi-arrow-right" />
                  </Link>
                  <button
                    className={ghostBtn}
                    onClick={() =>
                      document
                        .getElementById("board")
                        .scrollIntoView({ behavior: "smooth" })
                    }
                  >
                    See how it works
                  </button>
                </div>
                <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-medium text-[#161422]/55">
                  <span>
                    <i className="bi bi-check-circle-fill me-1.5 text-[#ff6a3d]" />
                    Runs in your browser
                  </span>
                  <span>
                    <i className="bi bi-check-circle-fill me-1.5 text-[#ff6a3d]" />
                    Exports real SQL
                  </span>
                  <span>
                    <i className="bi bi-check-circle-fill me-1.5 text-[#ff6a3d]" />
                    Yours to keep
                  </span>
                </div>
              </div>
            </FadeIn>

            <FadeIn duration={0.95}>
              <div className="rounded-[22px] border border-[#e9e0d4] bg-white p-2.5 shadow-[0_40px_90px_-45px_rgba(22,20,34,0.5)] lg:mx-auto lg:max-w-xl">
                <BoardPreview />
              </div>
            </FadeIn>
          </div>
        </div>
      </div>

      {/* Philosophy band */}
      <section id="board" className="bg-[#161422] px-10 py-20 text-white md:px-6">
        <FadeIn duration={0.8}>
          <div className="mx-auto max-w-5xl">
            <div className="text-sm font-bold uppercase tracking-[0.2em] text-[#ff8a3d]">
              It&apos;s a board, not a form
            </div>
            <h2 className="mt-3 max-w-2xl text-[34px] font-extrabold leading-tight tracking-tight md:text-2xl">
              Think with your hands
            </h2>
            <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-white/65">
              Most schema tools make you fill in dialogs. Dbraw gives you a
              canvas — push tables around like sticky notes, draw a line to make
              a relationship, and watch the SQL keep itself in sync.
            </p>
            <div className="mt-10 grid grid-cols-3 gap-8 md:grid-cols-1 md:gap-6">
              {boardPoints.map((p, i) => (
                <div key={i}>
                  <i className={`bi ${p.icon} text-2xl text-[#ff8a3d]`} />
                  <div className="mt-3 font-bold">{p.title}</div>
                  <p className="mt-1.5 text-sm leading-relaxed text-white/55">
                    {p.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>
      </section>

      {/* Three moves */}
      <section className="px-10 py-24 md:px-6 md:py-16">
        <FadeIn duration={0.8}>
          <div className="mx-auto max-w-5xl">
            <div className="text-sm font-bold uppercase tracking-[0.2em] text-[#ff6a3d]">
              Three moves
            </div>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight md:text-2xl">
              Blank board to shippable schema
            </h2>
          </div>
          <div className="mx-auto mt-12 grid max-w-5xl grid-cols-3 gap-6 md:grid-cols-1">
            {steps.map((s, i) => (
              <div
                key={i}
                className="rounded-2xl border border-[#e9e0d4] bg-white p-7"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#161422] text-sm font-extrabold text-white">
                    {i + 1}
                  </div>
                  <i className={`bi ${s.icon} text-xl text-[#ff6a3d]`} />
                </div>
                <div className="mt-4 text-lg font-bold">{s.title}</div>
                <p className="mt-2 text-[15px] leading-relaxed text-[#161422]/65">
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </FadeIn>
      </section>

      {/* Features */}
      <section
        id="features"
        className="border-y border-[#e9e0d4] bg-white px-10 py-24 md:px-6 md:py-16"
      >
        <FadeIn duration={0.9}>
          <div className="mx-auto max-w-5xl">
            <div className="text-sm font-bold uppercase tracking-[0.2em] text-[#ff6a3d]">
              The toolbox
            </div>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight md:text-2xl">
              Sharp tools, no clutter
            </h2>
          </div>
          <div className="mx-auto mt-12 grid max-w-5xl grid-cols-3 gap-5 md:grid-cols-2 sm:grid-cols-1">
            {features.map((f, i) => (
              <div
                key={i}
                className="group rounded-2xl border border-[#e9e0d4] bg-[#fbf6f0] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[#ff6a3d]/40 hover:shadow-[0_24px_50px_-30px_rgba(255,106,61,0.6)]"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ff6a3d]/12 text-[#ff6a3d]">
                  <i className={`bi ${f.icon} text-xl`} />
                </div>
                <div className="mt-4 font-bold">{f.title}</div>
                <p className="mt-1.5 text-sm leading-relaxed text-[#161422]/65">
                  {f.body}
                </p>
              </div>
            ))}
          </div>
          <div className="mx-auto mt-6 max-w-5xl text-sm text-[#161422]/45">
            Also in the box: keyboard shortcuts · presentation mode · dark theme ·
            autosave · {languages.length} languages.
          </div>
        </FadeIn>
      </section>

      {/* Databases strip */}
      <section className="px-10 py-12 md:px-6">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-10 gap-y-6 md:justify-center md:text-center">
          <div className="text-[15px] font-semibold text-[#161422]/70 md:w-full">
            Generates real SQL for
          </div>
          <div className="flex flex-wrap items-center gap-x-10 gap-y-5 md:justify-center">
            {dbs.map((s, i) => (
              <img
                key={i}
                src={s.icon}
                alt={s.name}
                style={{ height: s.height }}
                className="opacity-55 grayscale transition-all duration-300 hover:opacity-100 hover:grayscale-0"
              />
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-[#e9e0d4] px-10 py-24 md:px-6 md:py-16">
        <div className="mx-auto grid max-w-5xl grid-cols-[0.8fr_1.2fr] gap-12 md:grid-cols-1">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight md:text-2xl">
              Good questions
            </h2>
            <p className="mt-3 text-[15px] text-[#161422]/60">
              Still curious? The board is the fastest answer.
            </p>
            <Link to="/editor" className={`${primaryBtn} mt-5`}>
              Try Dbraw
            </Link>
          </div>
          <div className="divide-y divide-[#e9e0d4] border-y border-[#e9e0d4]">
            {faqs.map((q, i) => (
              <div key={i} className="py-5">
                <div className="font-bold">{q.q}</div>
                <p className="mt-1.5 text-[15px] leading-relaxed text-[#161422]/65">
                  {q.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-20">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-[28px] bg-[#161422] px-10 py-16 text-center text-white md:px-6">
          <Logo size={44} markOnly className="mb-6" />
          <h2 className="text-3xl font-extrabold tracking-tight md:text-2xl">
            Your schema is waiting to be drawn
          </h2>
          <p className="mx-auto mt-3 max-w-md text-white/60">
            Open a blank board and watch the whole thing take shape in a couple
            of minutes.
          </p>
          <Link to="/editor" className={`${primaryBtn} mt-7`}>
            Open the board <i className="bi bi-arrow-right" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#161422] text-white/70">
        <div className="bg-[#ff6a3d] px-4 py-2 text-center text-[12px] font-semibold text-white">
          Heads up: your diagrams live in this browser. Back them up (File →
          Export) before clearing browsing data.
        </div>
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-6 px-10 py-10 md:px-6">
          <Logo size={30} dark />
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium">
            <Link to="/editor" className="hover:text-white">
              Editor
            </Link>
            <Link to="/templates" className="hover:text-white">
              Templates
            </Link>
            <a
              href={socials.docs}
              className="hover:text-white"
              target="_blank"
              rel="noreferrer"
            >
              Docs
            </a>
            <Link to="/bug-report" className="hover:text-white">
              Report a bug
            </Link>
            <a
              href={socials.github}
              className="hover:text-white"
              target="_blank"
              rel="noreferrer"
            >
              <i className="bi bi-github me-1" />
              GitHub
            </a>
          </div>
        </div>
        <div className="border-t border-white/10 px-10 py-5 text-center text-xs text-white/45 md:px-6">
          &copy; {new Date().getFullYear()} Dbraw · Open source · Draw freely.
        </div>
      </footer>
    </div>
  );
}

const dbs = [
  { icon: mysql_icon, name: "MySQL", height: 34 },
  { icon: postgres_icon, name: "PostgreSQL", height: 26 },
  { icon: sqlite_icon, name: "SQLite", height: 30 },
  { icon: mariadb_icon, name: "MariaDB", height: 30 },
  { icon: sql_server_icon, name: "SQL Server", height: 30 },
];

const boardPoints = [
  {
    icon: "bi-bounding-box",
    title: "Group it up",
    body: "Wrap tables in subject areas, or a database boundary that moves as one piece.",
  },
  {
    icon: "bi-grid-3x3",
    title: "Stays tidy",
    body: "Everything snaps to a grid, so the board keeps its shape as the schema grows.",
  },
  {
    icon: "bi-arrow-counterclockwise",
    title: "Undo the canvas",
    body: "Step back through the whole board — not just the last field you touched.",
  },
];

const steps = [
  {
    icon: "bi-table",
    title: "Draw the tables",
    body: "Drop tables onto the board and type your columns. Areas and notes keep big schemas tidy.",
  },
  {
    icon: "bi-bezier2",
    title: "Connect the rows",
    body: "Drag from one field to another to form a relationship. Dbraw sorts out keys and cardinality.",
  },
  {
    icon: "bi-filetype-sql",
    title: "Export the SQL",
    body: "Take a dialect-aware DDL script, a JSON snapshot, or an image — whatever the next step needs.",
  },
];

const features = [
  {
    icon: "bi-box-arrow-up-right",
    title: "Export anywhere",
    body: "DDL for your database, JSON for your repo, or a crisp image for the deck.",
  },
  {
    icon: "bi-arrow-repeat",
    title: "Reverse engineer",
    body: "Already have a schema? Paste a DDL script and Dbraw draws the diagram.",
  },
  {
    icon: "bi-layers",
    title: "Version & migrate",
    body: "Snapshot a diagram over time and generate the migration scripts between versions.",
  },
  {
    icon: "bi-grid-1x2",
    title: "Templates",
    body: "Start from a ready-made schema, or save your own boilerplate to reuse later.",
  },
  {
    icon: "bi-shield-check",
    title: "Issue detection",
    body: "Dbraw flags the mistakes that would quietly break your generated scripts.",
  },
  {
    icon: "bi-diagram-3",
    title: "Object-relational",
    body: "Custom types and JSON schemas for databases that go past flat tables.",
  },
];

const faqs = [
  {
    q: "Do I need an account?",
    a: "No. Dbraw opens straight to a board and saves to your browser. Sign-in is never in the way.",
  },
  {
    q: "Where do my diagrams live?",
    a: "On your machine, in this browser. Export to JSON any time you want a portable copy or a backup.",
  },
  {
    q: "Which databases are supported?",
    a: "MySQL, PostgreSQL, SQLite, MariaDB and SQL Server, each with dialect-aware SQL generation.",
  },
  {
    q: "Is it really free?",
    a: "Yes. Dbraw is open source and free to use. Draw as much as you like.",
  },
];
