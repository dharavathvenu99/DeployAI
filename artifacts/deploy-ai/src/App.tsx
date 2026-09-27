import { type ButtonHTMLAttributes, type ChangeEvent, type ReactNode, useEffect, useRef, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, Check, ChevronRight, CircleAlert, Clock3, Code2, Copy, ExternalLink, FileCode2, FileText, Github, Globe2, Layers3, Lightbulb, LoaderCircle, LockKeyhole, PackageCheck, Rocket, Server, ShieldCheck, Sparkles, Terminal, UploadCloud, WandSparkles, X, Zap, type LucideIcon } from 'lucide-react';
import { Link, Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();

type ProviderId = 'vercel' | 'railway';
type SourceKind = 'ZIP upload' | 'GitHub repository';

type Project = {
  name: string;
  source: SourceKind;
  language: string;
  framework: string;
  packageManager: string;
  dependencies: number;
  buildCommand: string;
  outputDirectory: string;
  confidence: number;
};

const SAMPLE_PROJECT: Project = {
  name: 'launchpad-web',
  source: 'GitHub repository',
  language: 'TypeScript',
  framework: 'React + Vite',
  packageManager: 'pnpm',
  dependencies: 18,
  buildCommand: 'pnpm build',
  outputDirectory: 'dist',
  confidence: 98,
};

const PROVIDERS: Record<ProviderId, { name: string; mark: string; description: string; cost: string; time: string; color: string }> = {
  vercel: { name: 'Vercel', mark: 'V', description: 'Edge delivery with zero-config previews.', cost: '$0–20 / month', time: 'about 45 seconds', color: '#171c3a' },
  railway: { name: 'Railway', mark: 'R', description: 'Simple infrastructure for teams that want more control.', cost: '$5–18 / month', time: 'about 1 minute', color: '#5c49d8' },
};

const STAGES = [
  { label: 'Preparing project', detail: 'Checking source files and deployment settings', icon: Layers3 },
  { label: 'Installing dependencies', detail: 'Resolving 18 packages from pnpm-lock.yaml', icon: PackageCheck },
  { label: 'Running build', detail: 'Creating an optimized production bundle', icon: Terminal },
  { label: 'Uploading files', detail: 'Sending dist/ to the edge network', icon: UploadCloud },
  { label: 'Health check', detail: 'Verifying your live URL responds correctly', icon: ShieldCheck },
];

function Button({ children, className = '', variant = 'primary', ...props }: { children: ReactNode; className?: string; variant?: 'primary' | 'secondary' | 'quiet' | 'danger' } & ButtonHTMLAttributes<HTMLButtonElement>) {
  const variants = {
    primary: 'bg-[#5965df] text-white shadow-[0_10px_24px_rgba(89,101,223,.22)] hover:bg-[#4e59d0]',
    secondary: 'border border-[#d9ddf1] bg-white text-[#252b59] hover:border-[#aeb6ea] hover:bg-[#f8f8ff]',
    quiet: 'text-[#687099] hover:bg-[#edf0fb] hover:text-[#343b6d]',
    danger: 'border border-[#f3c7ca] bg-[#fff8f8] text-[#b34e58] hover:bg-[#fff0f1]',
  };
  return <button className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-all duration-200 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`} {...props}>{children}</button>;
}

function Logo() {
  return (
    <Link href="/" className="group flex items-center gap-2.5" data-testid="link-brand-home">
      <span className="relative grid size-9 place-items-center rounded-xl bg-[#5965df] text-white shadow-[0_7px_18px_rgba(89,101,223,.25)]">
        <Rocket size={18} strokeWidth={2.4} />
        <span className="absolute -bottom-0.5 -right-0.5 size-2 rounded-full border-2 border-[#f4f5fb] bg-[#67d3ca]" />
      </span>
      <span className="text-[15px] font-extrabold tracking-[-.03em] text-[#24294f]">Deploy<span className="text-[#5965df]">AI</span></span>
    </Link>
  );
}

function Header() {
  const [location] = useLocation();
  const flowPath = ['/analysis', '/providers', '/approve', '/deploying', '/success'].includes(location);
  return (
    <header className="relative z-10 border-b border-[#e7e9f3] bg-[#fafaff]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-[1160px] items-center justify-between px-5 sm:px-8">
        <Logo />
        <div className="flex items-center gap-3">
          {flowPath && <div className="hidden items-center gap-2 rounded-full border border-[#dfe2f1] bg-white px-3 py-1.5 text-[11px] font-semibold text-[#6d7598] sm:flex"><span className="size-1.5 rounded-full bg-[#67d3ca]" /> Prototype workspace</div>}
          <div className="hidden items-center gap-1.5 text-xs font-medium text-[#9298b5] sm:flex"><LockKeyhole size={13} /> Private by default</div>
        </div>
      </div>
    </header>
  );
}

function FlowRail({ current }: { current: number }) {
  const steps = ['Source', 'Analysis', 'Provider', 'Launch'];
  return (
    <div className="mb-9 flex items-center justify-center gap-1.5 sm:gap-3" data-testid="navigation-flow">
      {steps.map((step, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <div className="flex items-center gap-1.5 sm:gap-3" key={step}>
            <div className={`flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.12em] ${active ? 'text-[#5965df]' : done ? 'text-[#3d9e95]' : 'text-[#a4a9c1]'}`}>
              <span className={`grid size-6 place-items-center rounded-full border text-[10px] ${active ? 'border-[#5965df] bg-[#5965df] text-white' : done ? 'border-[#a7ddd8] bg-[#e7f8f6] text-[#3d9e95]' : 'border-[#d9ddeb] bg-white'}`}>
                {done ? <Check size={12} strokeWidth={3} /> : index + 1}
              </span>
              <span className="hidden sm:inline">{step}</span>
            </div>
            {index < steps.length - 1 && <span className={`h-px w-5 sm:w-12 ${index < current ? 'bg-[#a7ddd8]' : 'bg-[#dfe2ee]'}`} />}
          </div>
        );
      })}
    </div>
  );
}

function PageShell({ children, flowStep, className = '' }: { children: ReactNode; flowStep?: number; className?: string }) {
  return (
    <div className="app-grid min-h-[calc(100dvh-72px)] bg-[#f8f9fe]">
      <main className={`mx-auto w-full max-w-[1160px] px-5 py-8 sm:px-8 sm:py-12 ${className}`}>
        {typeof flowStep === 'number' && <FlowRail current={flowStep} />}
        {children}
      </main>
    </div>
  );
}

function Home({ onChooseSource }: { onChooseSource: (source: SourceKind, fileName?: string) => void }) {
  const [, setLocation] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [githubOpen, setGithubOpen] = useState(false);
  const [repo, setRepo] = useState('octavia-labs/launchpad-web');
  const [connecting, setConnecting] = useState(false);

  const onFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) onChooseSource('ZIP upload', file.name.replace(/\.zip$/i, '') || 'launchpad-web');
  };
  const connectGithub = () => {
    setConnecting(true);
    window.setTimeout(() => {
      setConnecting(false);
      setGithubOpen(false);
      onChooseSource('GitHub repository', repo.split('/').pop() || 'launchpad-web');
    }, 650);
  };

  return (
    <PageShell className="relative overflow-hidden">
      <div className="pointer-events-none absolute -left-32 top-14 size-80 rounded-full bg-[#dfe4ff] opacity-60 blur-3xl" />
      <div className="pointer-events-none absolute -right-40 top-44 size-[30rem] rounded-full bg-[#d7f5f2] opacity-60 blur-3xl" />
      <div className="relative grid items-center gap-12 pb-12 pt-8 lg:grid-cols-[1.04fr_.96fr] lg:gap-20 lg:pb-20 lg:pt-16">
        <section className="fade-up">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#dfe3f4] bg-white/80 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[.14em] text-[#5965df] shadow-sm">
            <Sparkles size={13} /> A clearer route to production
          </div>
          <h1 className="max-w-[650px] text-[clamp(2.75rem,8vw,5.7rem)] font-extrabold leading-[.98] tracking-[-.075em] text-[#252a52]">
            From code<br /><span className="text-[#5965df]">to live URL.</span>
          </h1>
          <p className="mt-7 max-w-[510px] text-base leading-7 text-[#697194] sm:text-lg">
            DeployAI reads your project, explains the choices, and gets it online without the usual guessing game.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button onClick={() => fileInputRef.current?.click()} data-testid="button-upload-zip"><UploadCloud size={17} /> Upload ZIP <ArrowRight size={15} /></Button>
            <Button variant="secondary" onClick={() => setGithubOpen(true)} data-testid="button-connect-github"><Github size={17} /> Connect GitHub</Button>
            <input ref={fileInputRef} onChange={onFile} type="file" accept=".zip,application/zip" className="hidden" data-testid="input-upload-zip" />
          </div>
          <button onClick={() => onChooseSource('GitHub repository', 'launchpad-web')} className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-[#5965df] transition-colors hover:text-[#3f48b8]" data-testid="button-try-sample">
            <WandSparkles size={14} /> Try the sample project <ChevronRight size={14} />
          </button>
          <div className="mt-12 flex items-center gap-6 border-t border-[#e3e6f2] pt-5 text-[11px] font-semibold text-[#8b91ac]">
            <span className="flex items-center gap-1.5"><ShieldCheck size={14} className="text-[#45aaa0]" /> No credentials stored</span>
            <span className="flex items-center gap-1.5"><Zap size={14} className="text-[#e6a542]" /> Guided setup</span>
          </div>
        </section>
        <section className="fade-up fade-up-delay-2 relative">
          <div className="absolute -inset-5 rounded-[2rem] bg-[#e9ecff]/70 blur-2xl" />
          <div className="relative overflow-hidden rounded-[1.5rem] border border-[#e0e3f3] bg-white shadow-[var(--shadow-float)]">
            <div className="flex items-center justify-between border-b border-[#eceef7] px-5 py-4">
              <div className="flex items-center gap-2"><span className="size-2 rounded-full bg-[#f5b45e]" /><span className="size-2 rounded-full bg-[#7bd0c8]" /><span className="size-2 rounded-full bg-[#aeb8ed]" /></div>
              <span className="font-mono text-[10px] tracking-wide text-[#9ba1bb]">deployai / workspace</span>
              <span className="size-4" />
            </div>
            <div className="space-y-6 p-6 sm:p-8">
              <div className="flex items-start justify-between">
                <div><p className="font-mono text-[11px] font-medium text-[#979db8]">READY TO DEPLOY</p><h2 className="mt-1 text-2xl font-extrabold tracking-[-.05em] text-[#292e59]">launchpad-web</h2></div>
                <span className="rounded-full bg-[#e8f8f5] px-2.5 py-1 text-[10px] font-bold text-[#3d9e95]">ANALYZED</span>
              </div>
              <div className="rounded-xl border border-[#e9ebf5] bg-[#fafaff] p-4">
                <div className="mb-4 flex items-center gap-2 text-xs font-bold text-[#424a78]"><Code2 size={15} className="text-[#5965df]" /> Project profile</div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                  {[['Framework', 'React + Vite'], ['Language', 'TypeScript'], ['Build', 'pnpm build'], ['Output', 'dist/']].map(([label, value]) => <div key={label}><p className="text-[10px] font-semibold uppercase tracking-[.1em] text-[#a1a6bd]">{label}</p><p className="mt-1 font-mono text-xs font-medium text-[#4d557e]">{value}</p></div>)}
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-[#dfe3ff] bg-[#f5f6ff] p-4">
                <div className="grid size-9 place-items-center rounded-lg bg-white text-[#5965df] shadow-sm"><Lightbulb size={17} /></div>
                <div><p className="text-xs font-bold text-[#3f4775]">A good fit for Vercel</p><p className="mt-0.5 text-[11px] leading-4 text-[#7c83a2]">Fast static hosting, no configuration needed.</p></div>
              </div>
              <button onClick={() => setLocation('/analysis')} className="flex w-full items-center justify-between rounded-xl bg-[#5965df] px-4 py-3.5 text-left text-sm font-bold text-white shadow-[0_8px_18px_rgba(89,101,223,.2)] transition hover:bg-[#4e59d0]" data-testid="button-preview-deploy">
                <span className="flex items-center gap-2"><Rocket size={16} /> Review deployment</span><ArrowRight size={16} />
              </button>
            </div>
          </div>
          <div className="absolute -bottom-7 -left-5 hidden items-center gap-3 rounded-xl border border-[#dfe3f2] bg-white p-3 shadow-[0_12px_35px_rgba(65,70,150,.12)] sm:flex">
            <span className="grid size-8 place-items-center rounded-lg bg-[#e7f8f6] text-[#3d9e95]"><Check size={16} /></span><span className="text-[11px] font-bold text-[#515a81]">Clarity before launch</span>
          </div>
        </section>
      </div>
      {githubOpen && <div className="fixed inset-0 z-30 grid place-items-center bg-[#272b55]/25 p-5 backdrop-blur-sm" role="dialog" aria-modal="true">
        <div className="w-full max-w-md rounded-2xl border border-[#e2e4f1] bg-white p-6 shadow-[var(--shadow-float)] fade-up">
          <div className="flex items-start justify-between"><div><div className="mb-3 grid size-10 place-items-center rounded-xl bg-[#f0f1ff] text-[#5965df]"><Github size={20} /></div><h2 className="text-xl font-extrabold tracking-[-.04em] text-[#292e59]">Connect a repository</h2><p className="mt-1 text-sm text-[#7b82a4]">We’ll inspect the project structure, not your source code.</p></div><button onClick={() => setGithubOpen(false)} className="rounded-lg p-1.5 text-[#9ba1bb] hover:bg-[#f1f2fa]" data-testid="button-close-github"><X size={18} /></button></div>
          <label className="mt-6 block text-xs font-bold text-[#4b537c]">Repository URL or owner/name<input value={repo} onChange={(event) => setRepo(event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-[#dfe2f1] bg-[#fbfbff] px-3.5 font-mono text-sm text-[#3d456f] outline-none transition focus:border-[#5965df] focus:ring-4 focus:ring-[#5965df]/10" data-testid="input-github-repository" /></label>
          <Button onClick={connectGithub} className="mt-5 w-full" disabled={connecting} data-testid="button-confirm-github">{connecting ? <><LoaderCircle size={16} className="animate-spin" /> Reading repository</> : <>Continue with GitHub <ArrowRight size={15} /></>}</Button>
        </div>
      </div>}
    </PageShell>
  );
}

function Analysis({ project, setLocation }: { project: Project; setLocation: (path: string) => void }) {
  const rows = [
    { label: 'Language', value: project.language, icon: Code2 },
    { label: 'Framework', value: project.framework, icon: Layers3 },
    { label: 'Package manager', value: project.packageManager, icon: PackageCheck },
    { label: 'Dependencies', value: `${project.dependencies} detected`, icon: FileCode2 },
    { label: 'Build command', value: project.buildCommand, icon: Terminal, mono: true },
    { label: 'Output directory', value: `${project.outputDirectory}/`, icon: FolderIcon, mono: true },
  ];
  return <PageShell flowStep={1}>
    <div className="mx-auto max-w-[850px]">
      <div className="fade-up"><p className="font-mono text-[11px] font-medium uppercase tracking-[.16em] text-[#5965df]">01 / Project analysis</p><div className="mt-3 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><h1 className="text-3xl font-extrabold tracking-[-.06em] text-[#292e59] sm:text-4xl">Here’s what we found.</h1><p className="mt-2 text-sm text-[#757d9e]">DeployAI mapped the safest path for <span className="font-semibold text-[#4e567e]">{project.name}</span>.</p></div><span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[#e8f8f5] px-3 py-1.5 text-xs font-bold text-[#3d9e95]"><Check size={14} /> Scan complete</span></div></div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{rows.map(({ label, value, icon: Icon, mono }) => <div key={label} className="fade-up fade-up-delay-1 rounded-2xl border border-[#e1e4f1] bg-white p-5 shadow-[var(--shadow-card)]"><div className="flex items-center justify-between"><span className="grid size-8 place-items-center rounded-lg bg-[#f0f1ff] text-[#5965df]"><Icon size={16} /></span><span className="text-[10px] font-bold uppercase tracking-[.12em] text-[#b0b4c8]">detected</span></div><p className="mt-5 text-xs font-semibold text-[#8a91ad]">{label}</p><p className={`mt-1 text-[15px] font-bold text-[#39416c] ${mono ? 'font-mono text-[13px]' : ''}`} data-testid={`text-analysis-${label.toLowerCase().replaceAll(' ', '-')}`}>{value}</p></div>)}</div>
      <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_1.25fr]">
        <div className="rounded-2xl border border-[#cfd5ff] bg-[#f4f5ff] p-5"><div className="flex items-center gap-2 text-xs font-bold text-[#4e5790]"><Sparkles size={15} /> AI confidence</div><div className="mt-4 flex items-end justify-between"><span className="text-4xl font-extrabold tracking-[-.07em] text-[#5965df]" data-testid="text-ai-confidence">{project.confidence}%</span><span className="mb-1 text-[11px] font-semibold text-[#7d85ac]">high confidence</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-[#dfe3ff]"><div className="h-full w-[98%] rounded-full bg-[#5965df]" /></div></div>
        <div className="rounded-2xl border border-[#e1e4f1] bg-white p-5 shadow-[var(--shadow-card)]"><div className="flex items-start gap-3"><span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#fff4df] text-[#d58b2d]"><Lightbulb size={16} /></span><div><p className="text-xs font-bold text-[#414a76]">Why this matters</p><p className="mt-1 text-sm leading-6 text-[#757d9e]">Your app is a static Vite build. It can ship without a server, database, or extra configuration.</p></div></div></div>
      </div>
      <div className="mt-8 flex flex-col-reverse justify-between gap-3 sm:flex-row sm:items-center"><Button variant="quiet" onClick={() => setLocation('/')} data-testid="button-back-source"><ArrowLeft size={15} /> Choose another source</Button><Button onClick={() => setLocation('/providers')} data-testid="button-continue-providers">Compare deployment options <ArrowRight size={16} /></Button></div>
    </div>
  </PageShell>;
}

function FolderIcon(props: { size?: number }) {
  return <FileText {...props} />;
}

function Providers({ provider, setProvider, setLocation }: { provider: ProviderId; setProvider: (provider: ProviderId) => void; setLocation: (path: string) => void }) {
  return <PageShell flowStep={2}>
    <div className="mx-auto max-w-[960px]">
      <div className="fade-up"><p className="font-mono text-[11px] font-medium uppercase tracking-[.16em] text-[#5965df]">02 / Deployment provider</p><h1 className="mt-3 text-3xl font-extrabold tracking-[-.06em] text-[#292e59] sm:text-4xl">Pick your launch lane.</h1><p className="mt-2 max-w-xl text-sm leading-6 text-[#757d9e]">Both options fit your project. We’ve highlighted the trade-offs so you can make the call with confidence.</p></div>
      <div className="mt-8 grid gap-5 lg:grid-cols-2">{(Object.keys(PROVIDERS) as ProviderId[]).map((id) => { const item = PROVIDERS[id]; const selected = provider === id; return <button key={id} onClick={() => setProvider(id)} className={`relative text-left rounded-2xl border p-6 transition-all duration-200 ${selected ? 'border-[#5965df] bg-[#f7f7ff] shadow-[0_12px_35px_rgba(89,101,223,.12)]' : 'border-[#e1e4f1] bg-white hover:-translate-y-0.5 hover:border-[#b9c0ed] hover:shadow-[var(--shadow-card)]'}`} data-testid={`card-provider-${id}`}><div className="flex items-start justify-between"><div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-xl text-lg font-extrabold text-white" style={{ backgroundColor: item.color }}>{item.mark}</span><div><h2 className="font-extrabold tracking-[-.03em] text-[#303762]">{item.name}</h2><p className="mt-0.5 text-xs text-[#8990ad]">{item.description}</p></div></div><span className={`grid size-6 place-items-center rounded-full border ${selected ? 'border-[#5965df] bg-[#5965df] text-white' : 'border-[#d6d9e8] text-transparent'}`}><Check size={13} strokeWidth={3} /></span></div><div className="mt-7 grid grid-cols-2 divide-x divide-[#e6e8f2] rounded-xl bg-white p-4 shadow-sm"><div><p className="text-[10px] font-bold uppercase tracking-[.1em] text-[#a0a6be]">Estimated cost</p><p className="mt-1.5 text-sm font-extrabold text-[#414a76]">{item.cost}</p></div><div className="pl-4"><p className="text-[10px] font-bold uppercase tracking-[.1em] text-[#a0a6be]">First deploy</p><p className="mt-1.5 text-sm font-extrabold text-[#414a76]">{item.time}</p></div></div>{id === 'vercel' && <span className="absolute -top-3 left-5 rounded-full bg-[#5965df] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.1em] text-white">AI recommendation</span>}</button> })}</div>
      <div className="mt-5 flex gap-3 rounded-2xl border border-[#d6e3f0] bg-[#f1f8fc] p-5"><div className="grid size-9 shrink-0 place-items-center rounded-lg bg-white text-[#4386a6] shadow-sm"><WandSparkles size={17} /></div><div><p className="text-xs font-bold text-[#3f5974]">DeployAI recommends Vercel for this project</p><p className="mt-1 text-sm leading-6 text-[#668099]">The static output maps directly to Vercel’s edge network, so you get the shortest path from build to a fast global URL.</p></div></div>
      <div className="mt-8 flex flex-col-reverse justify-between gap-3 sm:flex-row sm:items-center"><Button variant="quiet" onClick={() => setLocation('/analysis')} data-testid="button-back-analysis"><ArrowLeft size={15} /> Back to analysis</Button><Button onClick={() => setLocation('/approve')} data-testid="button-continue-approve">Review launch details <ArrowRight size={16} /></Button></div>
    </div>
  </PageShell>;
}

function Approve({ project, provider, setProject, setLocation }: { project: Project; provider: ProviderId; setProject: (project: Project) => void; setLocation: (path: string) => void }) {
  const choice = PROVIDERS[provider];
  const [name, setName] = useState(project.name);
  return <PageShell flowStep={3}>
    <div className="mx-auto max-w-[820px]">
      <div className="fade-up"><p className="font-mono text-[11px] font-medium uppercase tracking-[.16em] text-[#5965df]">03 / Final review</p><h1 className="mt-3 text-3xl font-extrabold tracking-[-.06em] text-[#292e59] sm:text-4xl">Ready when you are.</h1><p className="mt-2 text-sm leading-6 text-[#757d9e]">One last look before DeployAI sends your project into the world.</p></div>
      <div className="mt-8 overflow-hidden rounded-2xl border border-[#e1e4f1] bg-white shadow-[var(--shadow-card)]">
        <div className="grid gap-6 p-6 sm:grid-cols-[1.05fr_.95fr] sm:p-8">
          <div><label className="text-xs font-bold text-[#4c557e]">Project name<input value={name} onChange={(event) => setName(event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-[#dfe2f1] bg-[#fbfbff] px-3.5 text-sm font-semibold text-[#39416c] outline-none transition focus:border-[#5965df] focus:ring-4 focus:ring-[#5965df]/10" data-testid="input-project-name" /></label><div className="mt-7 space-y-5"><ReviewRow icon={Code2} label="Detected technology" value={`${project.framework} · ${project.language}`} /><ReviewRow icon={Globe2} label="Deployment provider" value={choice.name} mark={choice.mark} /><ReviewRow icon={Clock3} label="Estimated first deploy" value={choice.time} /></div></div>
          <div className="rounded-2xl bg-[#f5f6ff] p-5"><p className="text-xs font-bold uppercase tracking-[.12em] text-[#858cac]">Estimated monthly cost</p><p className="mt-3 text-4xl font-extrabold tracking-[-.07em] text-[#5965df]" data-testid="text-estimated-cost">{choice.cost.split(' ')[0]}<span className="text-lg text-[#838ab0]"> / month</span></p><div className="my-5 h-px bg-[#dfe2f5]" /><p className="text-xs font-bold text-[#4d567f]">What happens next</p><ul className="mt-3 space-y-3 text-xs leading-5 text-[#737b9c]"><li className="flex gap-2"><Check size={14} className="mt-0.5 shrink-0 text-[#45aaa0]" /> Install dependencies in an isolated build</li><li className="flex gap-2"><Check size={14} className="mt-0.5 shrink-0 text-[#45aaa0]" /> Build and publish your static files</li><li className="flex gap-2"><Check size={14} className="mt-0.5 shrink-0 text-[#45aaa0]" /> Run a health check on the live URL</li></ul></div>
        </div>
        <div className="flex flex-col-reverse gap-3 border-t border-[#eceef6] bg-[#fcfcff] p-5 sm:flex-row sm:items-center sm:justify-between sm:px-8"><Button variant="quiet" onClick={() => setLocation('/providers')} data-testid="button-back-providers"><ArrowLeft size={15} /> Change provider</Button><Button onClick={() => { setProject({ ...project, name: name.trim() || 'launchpad-web' }); setLocation('/deploying'); }} data-testid="button-approve-deploy"><Rocket size={16} /> Approve & deploy <ArrowRight size={16} /></Button></div>
      </div>
      <p className="mt-5 flex justify-center gap-1.5 text-center text-[11px] text-[#979db6]"><LockKeyhole size={13} /> You can disconnect this deployment at any time.</p>
    </div>
  </PageShell>;
}

function ReviewRow({ icon: Icon, label, value, mark }: { icon: LucideIcon; label: string; value: string; mark?: string }) {
  return <div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-lg bg-[#f0f1ff] text-[#5965df]">{mark ? <span className="text-xs font-extrabold">{mark}</span> : <Icon size={16} />}</span><div><p className="text-[11px] font-semibold text-[#959bb4]">{label}</p><p className="mt-0.5 text-sm font-bold text-[#444c77]">{value}</p></div></div>;
}

function Deploying({ project, provider, setLocation }: { project: Project; provider: ProviderId; setLocation: (path: string) => void }) {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setActive((value) => value < STAGES.length ? value + 1 : value), 1350);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    if (active >= STAGES.length) {
      const timer = window.setTimeout(() => setLocation('/success'), 800);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [active, setLocation]);
  const percent = Math.min(100, Math.round((active / STAGES.length) * 100));
  return <PageShell flowStep={3}>
    <div className="mx-auto max-w-[720px]">
      <div className="text-center fade-up"><div className="mx-auto mb-5 grid size-14 place-items-center rounded-2xl bg-[#e9ebff] text-[#5965df] shadow-[0_0_0_8px_rgba(233,235,255,.65)]"><Rocket size={25} className={active < STAGES.length ? 'pulse-soft' : ''} /></div><p className="font-mono text-[11px] font-medium uppercase tracking-[.16em] text-[#5965df]">Launch sequence / {provider}</p><h1 className="mt-3 text-3xl font-extrabold tracking-[-.06em] text-[#292e59] sm:text-4xl">{active >= STAGES.length ? 'Everything is live.' : `Launching ${project.name}`}</h1><p className="mt-2 text-sm text-[#757d9e]">{active >= STAGES.length ? 'Redirecting you to your project status.' : 'Stay close. We’re taking care of the technical details.'}</p></div>
      <div className="mt-9 rounded-2xl border border-[#e1e4f1] bg-white p-6 shadow-[var(--shadow-card)] sm:p-8"><div className="flex items-center justify-between"><span className="text-xs font-bold text-[#545c84]">Deployment progress</span><span className="font-mono text-xs font-medium text-[#5965df]" data-testid="text-deployment-progress">{percent}%</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-[#e8eaf4]"><div className="h-full rounded-full bg-[#5965df] transition-all duration-500" style={{ width: `${percent}%` }} /></div><div className="mt-7 space-y-1">{STAGES.map(({ label, detail, icon: Icon }, index) => { const done = index < active; const working = index === active && active < STAGES.length; return <div key={label} className={`flex items-center gap-4 rounded-xl px-3 py-3 transition-colors ${working ? 'bg-[#f5f6ff]' : ''}`} data-testid={`status-stage-${index}`}><span className={`grid size-9 shrink-0 place-items-center rounded-lg ${done ? 'bg-[#e7f8f6] text-[#3d9e95]' : working ? 'bg-[#e9ebff] text-[#5965df]' : 'bg-[#f1f2f7] text-[#a2a8bd]'}`}>{done ? <Check size={17} strokeWidth={2.8} /> : working ? <LoaderCircle size={17} className="animate-spin" /> : <Icon size={16} />}</span><div className="min-w-0 flex-1"><p className={`text-sm font-bold ${done || working ? 'text-[#414a76]' : 'text-[#9ca2b7]'}`}>{label}</p><p className={`mt-0.5 truncate text-xs ${done || working ? 'text-[#8189a6]' : 'text-[#b1b5c7]'}`}>{detail}</p></div><span className={`text-[10px] font-bold uppercase tracking-[.1em] ${done ? 'text-[#3d9e95]' : working ? 'text-[#5965df]' : 'text-[#afb3c5]'}`}>{done ? 'done' : working ? 'working' : 'queued'}</span></div> })}</div></div>
      <p className="mt-6 flex justify-center items-center gap-2 text-xs text-[#9299b2]"><CircleAlert size={14} /> Safe to keep this tab open while we finish.</p>
    </div>
  </PageShell>;
}

function Success({ project, provider }: { project: Project; provider: ProviderId }) {
  const [copied, setCopied] = useState(false);
  const [logsOpen, setLogsOpen] = useState(false);
  const [opened, setOpened] = useState(false);
  const url = `launchpad-web-${provider}.deployai.app`;
  const copyUrl = async () => {
    try { await navigator.clipboard.writeText(`https://${url}`); } catch { /* Clipboard permissions can be unavailable in preview. */ }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };
  return <PageShell flowStep={3}>
    <div className="mx-auto max-w-[760px] text-center">
      <div className="fade-up"><div className="relative mx-auto mb-6 grid size-20 place-items-center rounded-[1.6rem] bg-[#e5f8f5] text-[#3d9e95] shadow-[0_0_0_10px_rgba(229,248,245,.7)]"><Check size={39} strokeWidth={2.2} /><span className="absolute -right-1 -top-1 size-3 rounded-full bg-[#f2bd68]" /></div><p className="font-mono text-[11px] font-medium uppercase tracking-[.16em] text-[#3d9e95]">Deployment complete</p><h1 className="mt-3 text-4xl font-extrabold tracking-[-.07em] text-[#292e59] sm:text-5xl">You’re live.</h1><p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#757d9e]">The first version of <span className="font-bold text-[#4b537d]">{project.name}</span> is now available to the world.</p></div>
      <div className="mt-9 rounded-2xl border border-[#d9e9e6] bg-white p-5 text-left shadow-[var(--shadow-card)] sm:p-7"><div className="flex items-center justify-between border-b border-[#edf0f4] pb-5"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-[#e7f8f6] text-[#3d9e95]"><Globe2 size={18} /></span><div><p className="text-[11px] font-semibold uppercase tracking-[.1em] text-[#9aa1b7]">Project status</p><p className="mt-0.5 text-sm font-extrabold text-[#3d9e95]" data-testid="status-project-live">Live and healthy</p></div></div><span className="rounded-full bg-[#e8f8f5] px-2.5 py-1 text-[10px] font-bold text-[#3d9e95]">HTTP 200</span></div><div className="mt-5"><p className="text-[11px] font-bold uppercase tracking-[.1em] text-[#9aa1b7]">Live URL</p><div className="mt-2 flex flex-col gap-3 sm:flex-row"><div className="flex min-h-12 flex-1 items-center rounded-xl border border-[#dfe2f1] bg-[#fbfbff] px-3.5 font-mono text-sm text-[#5965df]" data-testid="text-live-url">https://{url}</div><Button variant="secondary" onClick={copyUrl} className="shrink-0" data-testid="button-copy-url">{copied ? <Check size={16} className="text-[#3d9e95]" /> : <Copy size={16} />} {copied ? 'Copied' : 'Copy URL'}</Button></div></div><div className="mt-6 flex flex-col gap-3 sm:flex-row"><Button onClick={() => setOpened(true)} className="flex-1" data-testid="button-open-live"><ExternalLink size={16} /> {opened ? 'Opening live project' : 'Open live project'}</Button><Button variant="secondary" onClick={() => setLogsOpen(!logsOpen)} className="flex-1" data-testid="button-view-logs"><FileText size={16} /> {logsOpen ? 'Hide deployment logs' : 'View deployment logs'}</Button></div>{logsOpen && <div className="mt-5 overflow-hidden rounded-xl bg-[#20254a] p-4 font-mono text-[11px] leading-6 text-[#c4caf1]" data-testid="panel-deployment-logs"><p><span className="text-[#72d2c7]">09:41:02</span> build completed in 18.4s</p><p><span className="text-[#72d2c7]">09:41:03</span> uploaded 24 files to edge</p><p><span className="text-[#72d2c7]">09:41:04</span> health check returned HTTP 200</p><p><span className="text-[#f4c477]">09:41:04</span> deployment marked live</p></div>}</div>
      <div className="mt-6 flex flex-col items-center justify-center gap-3 text-xs text-[#9299b2] sm:flex-row sm:gap-6"><span className="flex items-center gap-1.5"><ShieldCheck size={14} className="text-[#3d9e95]" /> SSL active</span><span className="flex items-center gap-1.5"><Server size={14} className="text-[#5965df]" /> Hosted on {PROVIDERS[provider].name}</span><Link href="/" className="font-bold text-[#5965df] hover:text-[#3e49b8]" data-testid="link-deploy-another">Deploy another project <ArrowRight size={13} className="inline" /></Link></div>
    </div>
  </PageShell>;
}

function AppRouter() {
  const [, setLocation] = useLocation();
  const [project, setProject] = useState<Project>(SAMPLE_PROJECT);
  const [provider, setProvider] = useState<ProviderId>('vercel');

  const chooseSource = (source: SourceKind, fileName = 'launchpad-web') => {
    setProject({ ...SAMPLE_PROJECT, source, name: fileName.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase() });
    setLocation('/analysis');
  };

  return <RoutedErrorBoundary>
    <Header />
    <Switch>
      <Route path="/" component={() => <Home onChooseSource={chooseSource} />} />
      <Route path="/analysis" component={() => <Analysis project={project} setLocation={setLocation} />} />
      <Route path="/providers" component={() => <Providers provider={provider} setProvider={setProvider} setLocation={setLocation} />} />
      <Route path="/approve" component={() => <Approve project={project} provider={provider} setProject={setProject} setLocation={setLocation} />} />
      <Route path="/deploying" component={() => <Deploying project={project} provider={provider} setLocation={setLocation} />} />
      <Route path="/success" component={() => <Success project={project} provider={provider} />} />
      <Route component={NotFound} />
    </Switch>
  </RoutedErrorBoundary>;
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><AppRouter /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;