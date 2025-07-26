//import { Projects } from '@/components/Projects'
import Projects from "@/components/Projects";
import { createFileRoute } from "@tanstack/react-router";

const RouteComponent = () => {
  return (
    <>
      <h1>Projects</h1>
      <Projects />
    </>
  );
};

export const Route = createFileRoute("/")({
  component: RouteComponent,
});
