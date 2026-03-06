"use client";

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

export default function NavActiveGlow() {
    const pathname = usePathname();

    useEffect(() => {
        const items = document.querySelectorAll('.bottom-nav .nav-item');
        items.forEach(item => {
            if (item.getAttribute('href') === pathname) {
                item.classList.add('active-nav');
            } else {
                item.classList.remove('active-nav');
            }
        });
    }, [pathname]);

    return null;
}
