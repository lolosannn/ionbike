"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { nav } from "@/config/store";
import logo from "@/assets/logo-ion.png";
import { useCart } from "@/components/cart/CartProvider";
import { CartIcon, CloseIcon, MenuIcon, SearchIcon } from "@/components/icons";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { count } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className="header">
      <div className="container">
        <Link href="/" className="logo" aria-label="IonBikeStore, inicio">
          <img src={logo.src} width={logo.width} height={logo.height} alt="" />
        </Link>

        <nav id="menu-principal" aria-label="Principal" className={`nav${menuOpen ? " open" : ""}`}>
          <ul>
            {nav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} aria-current={isActive(item.href) ? "page" : undefined}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <form
          role="search"
          className={`search${searchOpen ? " open" : ""}`}
          onSubmit={(e) => {
            e.preventDefault();
            const q = String(new FormData(e.currentTarget).get("q") ?? "").trim();
            router.push(`/buscar?q=${encodeURIComponent(q)}`);
          }}
        >
          <label htmlFor="buscar" className="sr-only">Buscar productos</label>
          <input id="buscar" name="q" type="search" placeholder="Buscar productos" />
          <button type="submit" aria-label="Buscar"><SearchIcon /></button>
        </form>

        <div className="header-actions">
          <button
            type="button"
            className="icon-btn search-toggle"
            aria-label="Abrir buscador"
            aria-expanded={searchOpen}
            onClick={() => setSearchOpen((v) => !v)}
          >
            <SearchIcon size={22} />
          </button>
          <Link href="/carrito" className="icon-btn" aria-label={`Carrito, ${count} productos`}>
            <CartIcon />
            <span className="cart-badge" aria-hidden="true">{count}</span>
          </Link>
          <button
            type="button"
            className="icon-btn menu-toggle"
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={menuOpen}
            aria-controls="menu-principal"
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>
    </header>
  );
}
