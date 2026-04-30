import { VerifyInvoiceView } from "./_components/verify-invoice-view";

export default async function VerifyInvoicePage({ params }: { params: Promise<{ uuid: string }> }) {
  const { uuid } = await params;
  return <VerifyInvoiceView uuid={uuid} />;
}
