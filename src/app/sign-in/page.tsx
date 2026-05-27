import { SignIn } from "@clerk/nextjs";

export default function Page() {
    return (
        <div className="relative min-h-screen flex items-center justify-center bg-[#f2f2f7] dark:bg-black p-4 overflow-hidden">
            {/* Background premium ambient glows */}
            <div className="absolute top-[-20%] left-[-20%] w-[600px] h-[600px] bg-gradient-to-br from-[#007AFF]/15 to-transparent blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-20%] w-[600px] h-[600px] bg-gradient-to-tl from-[#007AFF]/10 to-transparent blur-[120px] rounded-full pointer-events-none" />
            
            <div className="relative z-10 w-full max-w-[420px] flex justify-center items-center">
                <SignIn routing="hash" />
            </div>
        </div>
    );
}
