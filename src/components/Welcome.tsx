import { Button } from "@/components/ui/button";

export function Welcome({ onEnter, leaving }: { onEnter: () => void; leaving: boolean }) {
  return (
    <main className={`welcome-backdrop fixed inset-0 grid place-items-center overflow-hidden px-6 transition-opacity duration-700 ${leaving ? "opacity-0" : "opacity-100"}`}>
      <div className="welcome-enter flex flex-col items-center text-center">
        <h1 className="font-display text-[clamp(6rem,22vw,15rem)] leading-[0.9] text-foreground">Jenia</h1>
        <p className="mt-10 text-sm tracking-[0.18em] text-muted-foreground sm:text-base">Welcome to Jenia's World.</p>
        <Button variant="enter" size="lg" className="mt-12 rounded-full" onClick={onEnter} disabled={leaving}>
          Enter
        </Button>
      </div>
    </main>
  );
}
