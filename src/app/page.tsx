"use client";

import { useUser, SignIn } from "@clerk/nextjs";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push('/dashboard');
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded || isSignedIn) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
        {/* Spinner di caricamento opzionale */}
      </div>
    );
  }

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "85vh",
      padding: "1rem"
    }}>
      <div style={{ marginBottom: "2rem", textAlign: "center" }}>
        <h1 style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>Benvenuto</h1>
        <p style={{ opacity: 0.7, fontSize: "1.2rem" }}>Accedi al tuo Gestionale Finanziario.</p>
      </div>

      {/* 
        Aggiungiamo un wrapper per rendere il componente SignIn 
        visivamente più imponente come richiesto 
      */}
      <div style={{ transform: "scale(1.1)", transformOrigin: "top center" }}>
        <SignIn routing="hash" />
      </div>
    </div>
  );
}
