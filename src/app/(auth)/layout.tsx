import { ThemeSwitcher } from '@/components/common/ThemeSwitcher';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="absolute top-4 right-4">
        <ThemeSwitcher />
      </header>
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {children}
        </div>
      </main>
      <footer className="py-4 text-center text-sm text-muted-foreground">
        <p>Restaurant AI Agents</p>
      </footer>
    </div>
  );
}
