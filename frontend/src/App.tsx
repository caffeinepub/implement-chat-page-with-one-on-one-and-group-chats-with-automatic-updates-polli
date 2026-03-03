import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile } from './hooks/useQueries';
import { Loader2 } from 'lucide-react';
import Header from './components/Header';
import Footer from './components/Footer';
import ProfileSetupModal from './components/ProfileSetupModal';
import MainMenu from './pages/MainMenu';
import Store from './pages/Store';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentFailure from './pages/PaymentFailure';
import SinglePlayerRace from './components/SinglePlayerRace';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import { RouterProvider, createRouter, createRoute, createRootRoute, Outlet } from '@tanstack/react-router';

function RootComponent() {
  const { identity, loginStatus } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();

  const isAuthenticated = !!identity;
  const isInitializing = loginStatus === 'initializing';

  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;

  if (isInitializing) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        {!isAuthenticated ? (
          <div className="container mx-auto flex min-h-[calc(100vh-8rem)] items-center justify-center px-4">
            <div className="text-center">
              <h1 className="mb-4 text-4xl font-bold text-foreground">Welcome to Racing Arena</h1>
              <p className="mb-8 text-lg text-muted-foreground">
                Please log in to start racing and compete on the leaderboards
              </p>
            </div>
          </div>
        ) : showProfileSetup ? (
          <ProfileSetupModal />
        ) : (
          <Outlet />
        )}
      </main>
      <Footer />
      <Toaster />
    </div>
  );
}

const rootRoute = createRootRoute({
  component: RootComponent,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: MainMenu,
});

const storeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/store',
  component: Store,
});

const paymentSuccessRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/payment-success',
  component: PaymentSuccess,
});

const paymentFailureRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/payment-failure',
  component: PaymentFailure,
});

const singlePlayerRaceRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/single-player-race',
  component: SinglePlayerRace,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  storeRoute,
  paymentSuccessRoute,
  paymentFailureRoute,
  singlePlayerRaceRoute,
]);

const router = createRouter({ routeTree });

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}
