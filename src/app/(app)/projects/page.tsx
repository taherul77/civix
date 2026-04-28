import { PageHeader } from "@/components/ui/page-header";
import { ProjectsTable } from "./_components/projects-table";
import { NewProjectButton } from "./_components/new-project-button";

export default function ProjectsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        description="Active and completed projects across the laboratory."
        actions={<NewProjectButton />}
      />
      <ProjectsTable />
    </div>
  );
}
