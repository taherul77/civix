import { TestDetailView } from "./_components/test-detail-view";

export default async function TestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TestDetailView id={id} />;
}
