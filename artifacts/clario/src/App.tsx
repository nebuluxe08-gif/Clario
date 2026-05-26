import { useEffect, useRef, useState } from "react";
import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";
import { Home } from "@/pages/home";
import { Workspace } from "@/pages/workspace";
import { Profile } from "@/pages/profile";
import NotFound from "@/pages/not-found";

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
    socialButtonsPlacement: "top" as const,
    socialButtonsVariant: "blockButton" as const,
  },
  variables: {
    colorPrimary: "#6b8f4a",
    colorForeground: "#1e2418",
    colorMutedForeground: "#6b7a5c",
    colorDanger: "#c0392b",
    colorBackground: "#f6f8f3",
    colorInput: "#edf0e8",
    colorInputForeground: "#1e2418",
    colorNeutral: "#c8d0bd",
    fontFamily: "'Outfit', sans-serif",
    borderRadius: "0.625rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-[#f6f8f3] rounded-2xl w-[440px] max-w-full overflow-hidden shadow-lg border border-[#c8d0bd]",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "font-serif text-[#1e2418] text-2xl",
    headerSubtitle: "text-[#6b7a5c] font-light",
    socialButtonsBlockButtonText: "text-[#1e2418] font-medium",
    formFieldLabel: "text-[#1e2418] font-medium text-sm",
    footerActionLink: "text-[#6b8f4a] font-medium hover:text-[#557a38]",
    footerActionText: "text-[#6b7a5c]",
    dividerText: "text-[#6b7a5c] text-xs",
    identityPreviewEditButton: "text-[#6b8f4a]",
    formFieldSuccessText: "text-[#6b8f4a]",
    alertText: "text-[#1e2418]",
    logoBox: "flex justify-center py-2",
    logoImage: "w-12 h-12",
    socialButtonsBlockButton: "border border-[#c8d0bd] bg-white hover:bg-[#edf0e8] transition-colors",
    formButtonPrimary: "bg-[#6b8f4a] hover:bg-[#557a38] text-white font-medium transition-colors",
    formFieldInput: "border border-[#c8d0bd] bg-white text-[#1e2418] focus:ring-[#6b8f4a] focus:border-[#6b8f4a]",
    footerAction: "border-t border-[#c8d0bd] pt-4",
    dividerLine: "bg-[#c8d0bd]",
    alert: "border border-[#c8d0bd] bg-[#edf0e8]",
    otpCodeFieldInput: "border border-[#c8d0bd] bg-white",
    formFieldRow: "gap-3",
    main: "gap-5",
  },
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignIn
        routing="path"
        path={`${basePath}/sign-in`}
        signUpUrl={`${basePath}/sign-up`}
        fallbackRedirectUrl={`${basePath}/workspace`}
      />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignUp
        routing="path"
        path={`${basePath}/sign-up`}
        signInUrl={`${basePath}/sign-in`}
        fallbackRedirectUrl={`${basePath}/workspace`}
      />
    </div>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);

  return null;
}

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/workspace" component={Workspace} />
        <Route path="/profile" component={Profile} />
        <Route path="/sign-in/*?" component={SignInPage} />
        <Route path="/sign-up/*?" component={SignUpPage} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: {
            title: "Welcome back to Clario",
            subtitle: "Sign in to continue polishing your writing",
          },
        },
        signUp: {
          start: {
            title: "Start writing with clarity",
            subtitle: "Create your Clario account — it's free",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
