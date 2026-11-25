import { notFound } from "next/navigation";
import { HouseExplorer } from "@/components/HouseExplorer";
import { getShowcase } from "@/sanity/server";
export const metadata = {
  title: "House explorer",
  robots: { index: false, follow: false },
};
export default async function ModelPage() {
  const data = await getShowcase();
  if (!data?.project.model) notFound();
  const { project, settings } = data;
  return (
    <main>
      <HouseExplorer
        title={project.title}
        wordmark={settings.wordmark}
        demo={project.demo}
        media={data.project.model}
        rooms={project.rooms}
        floors={project.floors.map(({ floorId, title }) => ({
          floorId,
          title,
        }))}
      />
    </main>
  );
}
