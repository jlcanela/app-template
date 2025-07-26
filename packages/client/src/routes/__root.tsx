import { Layout } from "@/components/Layout";
import { type QueryClient } from "@tanstack/react-query";
import { Outlet, createRootRouteWithContext } from "@tanstack/react-router";

const RootComponent = () => {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
};

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  component: RootComponent,
});
