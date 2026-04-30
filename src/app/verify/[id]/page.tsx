import { VerifyView } from "./_components/verify-view";

export default async function VerifyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <VerifyView id={id} />;
}
