"use client";

import { useState } from 'react';
import MainMenu from './MainMenu';

export default function SidebarLayout({ children }: { children: React.ReactNode }) {
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <div className="flex w-full h-full">
            <MainMenu isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
            <main
                className={`main-content pb-24 md:pb-8 w-full transition-all duration-300 ${
                    isCollapsed ? 'md:pl-20' : 'md:pl-64'
                }`}
            >
                <div className="max-w-7xl mx-auto w-full h-full">
                    {children}
                </div>
            </main>
        </div>
    );
}
