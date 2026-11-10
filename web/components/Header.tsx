import Link from "next/link";
import { BookOpen } from "lucide-react";
import ReaderLink from "@/components/ReaderLink";
import SignOutButton from "@/components/SignOutButton";
import TabBar from "@/components/TabBar";
import type { Tab } from "@/lib/reader/tabs";

const logo = "flex items-center gap-2 font-serif text-lg font-semibold text-tprimary hover:text-accent";
const mark = <><BookOpen className="size-5 text-accent" /> Chapterly</>;

/** In the app shell (`tab` given): logo + the tab bar, switching views offline. On server-rendered pages
 * (novel management): logo + sign out. */
export default function Header({ tab }: { tab?: Tab }) {
  return (
    <header className="mb-4 flex items-center gap-4">
      {tab
        ? <><ReaderLink href="/" className={logo}>{mark}</ReaderLink><TabBar tab={tab} /></>
        : <><Link href="/" className={logo}>{mark}</Link><span className="ml-auto"><SignOutButton /></span></>}
    </header>
  );
}
