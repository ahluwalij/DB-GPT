import { Think } from "../../components/ui/think";
import { FlipWords } from "../../components/ui/flip-words";
import { BackgroundPaths } from "../../components/ui/background-paths";

export default function AuthLayout({
  children,
}: { children: React.ReactNode }) {
  return (
    <main className="relative w-full flex flex-col h-screen">
      <div className="flex-1">
        <div className="flex min-h-screen w-full">
          <div className="hidden lg:flex lg:w-1/2 bg-muted border-r flex-col p-18 relative">
            <div className="absolute inset-0 w-full h-full">
              <BackgroundPaths />
            </div>
            <h1 className="text-xl font-semibold flex items-center gap-3 animate-in fade-in duration-1000">
              <Think />
              <span>UniversalAGI</span>
            </h1>
            <div className="flex-1" />
            <FlipWords
              words={[""]}
              className=" mb-4 text-muted-foreground"
            />
          </div>

          <div className="w-full lg:w-1/2 p-6">{children}</div>
        </div>
      </div>
    </main>
  );
}