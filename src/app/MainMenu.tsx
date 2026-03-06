"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function MainMenu() {
    const pathname = usePathname();

    return (
        <nav className="bottom-nav">
            <Link href="/dashboard" className={`nav-item ${pathname === '/dashboard' ? 'active-nav-safe' : ''}`}>
                <span className="nav-icon" style={{
                    transform: pathname === '/dashboard' ? 'scale(1.2) translateY(-2px)' : 'none',
                    color: pathname === '/dashboard' ? '#ffcc00' : 'inherit',
                    transition: 'all 0.2s ease',
                    textShadow: pathname === '/dashboard' ? '0 0 15px rgba(255, 204, 0, 0.6)' : 'none'
                }}>📊</span>
                <span className="nav-text" style={{
                    color: pathname === '/dashboard' ? '#ffcc00' : 'inherit',
                    fontWeight: pathname === '/dashboard' ? 'bold' : 'normal'
                }}>Dashboard</span>
            </Link>

            <Link href="/scanner" className="nav-item">
                <span
                    className="nav-icon"
                    style={{
                        background: pathname === '/scanner' ? '#ffcc00' : 'var(--primary)',
                        color: pathname === '/scanner' ? 'black' : 'white',
                        borderRadius: "50%",
                        width: "45px",
                        height: "45px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: "-15px",
                        border: "4px solid var(--background)",
                        transform: pathname === '/scanner' ? "translateY(-13px) scale(1.1)" : "translateY(-10px)",
                        transition: "all 0.3s ease",
                        boxShadow: pathname === '/scanner' ? "0 0 20px rgba(255, 204, 0, 0.6)" : "none"
                    }}>
                    📸
                </span>
                <span className="nav-text" style={{
                    marginTop: "15px",
                    color: pathname === '/scanner' ? '#ffcc00' : 'inherit',
                    fontWeight: pathname === '/scanner' ? 'bold' : 'normal'
                }}>Scanner</span>
            </Link>

            <Link href="/tasse" className={`nav-item ${pathname === '/tasse' ? 'active-nav-safe' : ''}`}>
                <span className="nav-icon" style={{
                    transform: pathname === '/tasse' ? 'scale(1.2) translateY(-2px)' : 'none',
                    color: pathname === '/tasse' ? '#ffcc00' : 'inherit',
                    transition: 'all 0.2s ease',
                    textShadow: pathname === '/tasse' ? '0 0 15px rgba(255, 204, 0, 0.6)' : 'none'
                }}>🧮</span>
                <span className="nav-text" style={{
                    color: pathname === '/tasse' ? '#ffcc00' : 'inherit',
                    fontWeight: pathname === '/tasse' ? 'bold' : 'normal'
                }}>Tasse</span>
            </Link>

            <Link href="/cause" className={`nav-item ${pathname === '/cause' ? 'active-nav-safe' : ''}`}>
                <span className="nav-icon" style={{
                    transform: pathname === '/cause' ? 'scale(1.2) translateY(-2px)' : 'none',
                    color: pathname === '/cause' ? '#ffcc00' : 'inherit',
                    transition: 'all 0.2s ease',
                    textShadow: pathname === '/cause' ? '0 0 15px rgba(255, 204, 0, 0.6)' : 'none'
                }}>⚖️</span>
                <span className="nav-text" style={{
                    color: pathname === '/cause' ? '#ffcc00' : 'inherit',
                    fontWeight: pathname === '/cause' ? 'bold' : 'normal'
                }}>Cause</span>
            </Link>

            <Link href="/impostazioni" className={`nav-item ${pathname === '/impostazioni' ? 'active-nav-safe' : ''}`}>
                <span className="nav-icon" style={{
                    transform: pathname === '/impostazioni' ? 'scale(1.2) translateY(-2px)' : 'none',
                    color: pathname === '/impostazioni' ? '#ffcc00' : 'inherit',
                    transition: 'all 0.2s ease',
                    textShadow: pathname === '/impostazioni' ? '0 0 15px rgba(255, 204, 0, 0.6)' : 'none'
                }}>⚙️</span>
                <span className="nav-text" style={{
                    color: pathname === '/impostazioni' ? '#ffcc00' : 'inherit',
                    fontWeight: pathname === '/impostazioni' ? 'bold' : 'normal'
                }}>Impo.</span>
            </Link>
        </nav>
    );
}
