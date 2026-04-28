import { SampleDetailView } from "./_components/sample-detail-view";

export default async function SampleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SampleDetailView id={id} />;
}
