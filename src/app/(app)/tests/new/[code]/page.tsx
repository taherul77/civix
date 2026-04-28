import { DynamicTestForm } from "./_components/dynamic-form";

export default async function GenericTestFormPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <DynamicTestForm code={code} />;
}
