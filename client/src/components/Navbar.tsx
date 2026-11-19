import Link from "next/link";
import Image from "next/image";
import Menu from "./Menu";
import SearchBar from "./SearchBar";
import NavIcons from "./NavIcons";
import NavLinks from "./NavLinks";

const Navbar = () => {
  return (
    <div className="h-20 px-4 md:px-8 lg:px-16 xl:pr-32 2xl:pr-64 relative">
      {/* MOBILE */}
      <div className="md:hidden h-full flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-xl font-semibold">
          <Image src="/logo.png" alt="" width={24} height={24} />
          Cartiva
        </Link>
        <div className="flex items-center gap-4">
          <NavIcons />
          <Menu />
        </div>
      </div>

      {/* BIGGER SCREEN */}
      <div className="hidden md:flex h-full items-center justify-between gap-8">
        {/* LEFT */}
        <div className="w-1/3 xl:w-1/2 flex items-center gap-8">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/logo.png" alt="" width={24} height={24} />
            <div className="text-2xl font-semibold">Cartiva</div>
          </Link>
          <div className="hidden xl:flex gap-6">
            <NavLinks />
          </div>
        </div>

        {/* RIGHT */}
        <div className="w-2/3 xl:w-1/2 flex items-center justify-end gap-4">
          <SearchBar />
          <NavIcons />
        </div>
      </div>
    </div>
  );
};

export default Navbar;