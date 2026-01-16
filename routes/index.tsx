import { createFileRoute } from "@tanstack/react-router";
import { AppWrapper } from "@/components/AppWrapper";

export const Route = createFileRoute("/")({
	component: App,
});

function App() {
	return <AppWrapper />;
}
