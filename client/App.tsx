import { DirectionProvider } from "@base-ui/react/direction-provider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lazy, Suspense, type ReactNode } from "react";
import { BrowserRouter, Route, Routes } from "react-router";
import { Spinner, ToastProvider, TooltipProvider } from "./components";
import { AuthProvider, RequireAuth } from "./lib/auth";
import { DIRECTION, SHOW_DEMOS } from "./lib/config";
import { AuthCallbackPage } from "./pages/AuthCallbackPage";
import { EventDetailPage } from "./pages/EventDetailPage";
import { EventEditPage } from "./pages/EventEditPage";
import { EventNewPage } from "./pages/EventNewPage";
import { EventsPage } from "./pages/EventsPage";
import { HomePage } from "./pages/HomePage";
import { Layout } from "./pages/Layout";
import { NotFoundPage } from "./pages/NotFoundPage";
import { SignInPage } from "./pages/SignInPage";

// The gallery and the demos are loaded only if someone visits them, each as
// a separate file the rest of your visitors never download.
const ComponentsPage = lazy(() =>
  import("./pages/ComponentsPage").then((m) => ({ default: m.ComponentsPage })),
);
const DemosPage = lazy(() =>
  import("./pages/demos/DemosPage").then((m) => ({ default: m.DemosPage })),
);
const BlankDemoPage = lazy(() =>
  import("./pages/demos/BlankDemoPage").then((m) => ({
    default: m.BlankDemoPage,
  })),
);
const ElementsDemoPage = lazy(() =>
  import("./pages/demos/ElementsDemoPage").then((m) => ({
    default: m.ElementsDemoPage,
  })),
);
const VizDemoPage = lazy(() =>
  import("./pages/demos/VizDemoPage").then((m) => ({ default: m.VizDemoPage })),
);

/** What shows for the split second while a lazy page downloads. */
function Loading({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <main>
          <Spinner />
        </main>
      }
    >
      {children}
    </Suspense>
  );
}

// Holds the data fetched from the server, so two pages asking for the same
// thing only cause one request. See client/features/events/ for how it's used.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Don't refetch everything the moment the user clicks back into the tab.
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

/**
 * The top of the browser app.
 *
 * The providers wrap everything, then the router picks a page based on the URL.
 * To add a page: make a file in client/pages/, then add a <Route> below.
 * Wrap it in <RequireAuth> if you have to be logged in to see it.
 */
export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <DirectionProvider direction={DIRECTION}>
        <TooltipProvider>
          <ToastProvider>
            <BrowserRouter>
              <AuthProvider>
                <Routes>
                  {/* Full-screen pages, without the header and footer. */}
                  <Route path="/signin" element={<SignInPage />} />
                  <Route path="/auth/callback" element={<AuthCallbackPage />} />

                  {/* Everything in here gets the header and footer from
                  client/pages/Layout.tsx. */}
                  <Route element={<Layout />}>
                    <Route path="/" element={<HomePage />} />
                    {/* The example feature. Everything here needs a login. */}
                    <Route
                      path="/events"
                      element={
                        <RequireAuth>
                          <EventsPage />
                        </RequireAuth>
                      }
                    />
                    <Route
                      path="/events/new"
                      element={
                        <RequireAuth>
                          <EventNewPage />
                        </RequireAuth>
                      }
                    />
                    <Route
                      path="/events/:id"
                      element={
                        <RequireAuth>
                          <EventDetailPage />
                        </RequireAuth>
                      }
                    />
                    <Route
                      path="/events/:id/edit"
                      element={
                        <RequireAuth>
                          <EventEditPage />
                        </RequireAuth>
                      }
                    />

                    {/* The component gallery and the demos. Set
                    VITE_SHOW_DEMOS=false in .env to hide them before handing
                    the app over. */}
                    {SHOW_DEMOS ? (
                      <>
                        <Route
                          path="/components"
                          element={
                            <Loading>
                              <ComponentsPage />
                            </Loading>
                          }
                        />
                        <Route
                          path="/demos"
                          element={
                            <Loading>
                              <DemosPage />
                            </Loading>
                          }
                        />
                        <Route
                          path="/demos/blank"
                          element={
                            <Loading>
                              <BlankDemoPage />
                            </Loading>
                          }
                        />
                        <Route
                          path="/demos/elements"
                          element={
                            <Loading>
                              <ElementsDemoPage />
                            </Loading>
                          }
                        />
                        <Route
                          path="/demos/viz"
                          element={
                            <Loading>
                              <VizDemoPage />
                            </Loading>
                          }
                        />
                      </>
                    ) : null}

                    <Route path="*" element={<NotFoundPage />} />
                  </Route>
                </Routes>
              </AuthProvider>
            </BrowserRouter>
          </ToastProvider>
        </TooltipProvider>
      </DirectionProvider>
    </QueryClientProvider>
  );
}
