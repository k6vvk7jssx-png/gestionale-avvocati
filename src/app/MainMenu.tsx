"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton, useUser } from "@clerk/nextjs";

export default function MainMenu() {
    const pathname = usePathname();
    const { user } = useUser();

    // Helper per verificare se un path è attivo
    const isActive = (path: string) => pathname === path;

    return (
        <>
            {/* MOBILE BOTTOM NAVIGATION (< md) */}
            <nav className="bottom-nav md:hidden">
                <Link href="/dashboard" className={`nav-item ${isActive('/dashboard') ? 'active-nav-safe' : ''}`}>
                    <span className="nav-icon" style={{
                        transform: isActive('/dashboard') ? 'scale(1.2) translateY(-2px)' : 'none',
                        color: isActive('/dashboard') ? '#ffcc00' : 'inherit',
                        transition: 'all 0.2s ease',
                        textShadow: isActive('/dashboard') ? '0 0 15px rgba(255, 204, 0, 0.6)' : 'none'
                    }}>📊</span>
                    <span className="nav-text" style={{
                        color: isActive('/dashboard') ? '#ffcc00' : 'inherit',
                        fontWeight: isActive('/dashboard') ? 'bold' : 'normal'
                    }}>Dashboard</span>
                </Link>

                <Link href="/scanner" className="nav-item">
                    <span
                        className="nav-icon"
                        style={{
                            background: isActive('/scanner') ? '#ffcc00' : 'var(--primary)',
                            color: isActive('/scanner') ? 'black' : 'white',
                            borderRadius: "50%",
                            width: "45px",
                            height: "45px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            marginBottom: "-15px",
                            border: "4px solid var(--background)",
                            transform: isActive('/scanner') ? "translateY(-13px) scale(1.1)" : "translateY(-10px)",
                            transition: "all 0.3s ease",
                            boxShadow: isActive('/scanner') ? "0 0 20px rgba(255, 204, 0, 0.6)" : "none"
                        }}>
                        📸
                    </span>
                    <span className="nav-text" style={{
                        marginTop: "15px",
                        color: isActive('/scanner') ? '#ffcc00' : 'inherit',
                        fontWeight: isActive('/scanner') ? 'bold' : 'normal'
                    }}>Spese</span>
                </Link>

                <Link href="/tasse" className={`nav-item ${isActive('/tasse') ? 'active-nav-safe' : ''}`}>
                    <span className="nav-icon" style={{
                        transform: isActive('/tasse') ? 'scale(1.2) translateY(-2px)' : 'none',
                        color: isActive('/tasse') ? '#ffcc00' : 'inherit',
                        transition: 'all 0.2s ease',
                        textShadow: isActive('/tasse') ? '0 0 15px rgba(255, 204, 0, 0.6)' : 'none'
                    }}>🧮</span>
                    <span className="nav-text" style={{
                        color: isActive('/tasse') ? '#ffcc00' : 'inherit',
                        fontWeight: isActive('/tasse') ? 'bold' : 'normal'
                    }}>Tasse</span>
                </Link>

                <Link href="/cause" className={`nav-item ${isActive('/cause') ? 'active-nav-safe' : ''}`}>
                    <span className="nav-icon" style={{
                        transform: isActive('/cause') ? 'scale(1.2) translateY(-2px)' : 'none',
                        color: isActive('/cause') ? '#ffcc00' : 'inherit',
                        transition: 'all 0.2s ease',
                        textShadow: isActive('/cause') ? '0 0 15px rgba(255, 204, 0, 0.6)' : 'none'
                    }}>⚖️</span>
                    <span className="nav-text" style={{
                        color: isActive('/cause') ? '#ffcc00' : 'inherit',
                        fontWeight: isActive('/cause') ? 'bold' : 'normal'
                    }}>Cause</span>
                </Link>

                <Link href="/impostazioni" className={`nav-item ${isActive('/impostazioni') ? 'active-nav-safe' : ''}`}>
                    <span className="nav-icon" style={{
                        transform: isActive('/impostazioni') ? 'scale(1.2) translateY(-2px)' : 'none',
                        color: isActive('/impostazioni') ? '#ffcc00' : 'inherit',
                        transition: 'all 0.2s ease',
                        textShadow: isActive('/impostazioni') ? '0 0 15px rgba(255, 204, 0, 0.6)' : 'none'
                    }}>⚙️</span>
                    <span className="nav-text" style={{
                        color: isActive('/impostazioni') ? '#ffcc00' : 'inherit',
                        fontWeight: isActive('/impostazioni') ? 'bold' : 'normal'
                    }}>Impo.</span>
                </Link>
            </nav>

            {/* DESKTOP SIDEBAR (>= md) */}
            <aside className="hidden md:flex flex-col fixed inset-y-0 left-0 w-64 border-r border-white/5 bg-[#0c1017]/80 backdrop-blur-2xl z-50">

                {/* Logo Area */}
                <div className="h-16 flex items-center justify-between px-6 border-b border-white/5">
                    <span className="text-lg font-bold tracking-tighter text-white">Gestionale Facile</span>
                </div>

                {/* Nav Links */}
                <div className="flex-1 py-6 flex flex-col gap-2 px-3 overflow-y-auto">
                    {[
                        { href: "/dashboard", icon: "📊", label: "Dashboard" },
                        { href: "/scanner", icon: "📸", label: "Aggiungi Spesa" },
                        { href: "/tasse", icon: "🧮", label: "Cassetto Fiscale" },
                        { href: "/cause", icon: "⚖️", label: "Fatture / Cause" },
                        { href: "/impostazioni", icon: "⚙️", label: "Impostazioni" }
                    ].map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${isActive(item.href)
                                    ? "bg-[#18212f] text-white border-l-4 border-l-[#ffcc00]"
                                    : "text-slate-400 hover:bg-[#18212f]/50 hover:text-white border-l-4 border-l-transparent"
                                }`}
                        >
                            <span className="text-xl" style={{ filter: isActive(item.href) ? "drop-shadow(0 0 8px rgba(255, 204, 0, 0.4))" : "none" }}>
                                {item.icon}
                            </span>
                            <span className={`font-medium ${isActive(item.href) ? "text-[#ffcc00]" : ""}`}>
                                {item.label}
                            </span>
                        </Link>
                    ))}
                </div>

                {/* User Area Bottom */}
                <div className="p-4 border-t border-white/5 w-full">
                    <div className="flex items-center gap-3 w-full bg-[#18212f]/50 p-2 rounded-xl">
                        <UserButton afterSignOutUrl="/" appearance={{ elements: { userButtonAvatarBox: "w-9 h-9" } }} />
                        <div className="flex flex-col overflow-hidden">
                            <span className="text-sm font-semibold text-white truncate">{user?.firstName || 'Avvocato'}</span>
                            <span className="text-xs text-slate-500 truncate">{user?.primaryEmailAddress?.emailAddress}</span>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}
