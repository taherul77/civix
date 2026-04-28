import { PageHeader } from "@/components/ui/page-header";
import { BillingStats } from "./_components/billing-stats";
import { ComplianceCards } from "./_components/compliance-cards";
import { InvoicesTable } from "./_components/invoices-table";
import { NewInvoiceButton } from "./_components/new-invoice-button";

export default function BillingPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing — ZATCA & Etimad"
        description="VAT e-invoicing (Phase 2) and government procurement integration."
        actions={<NewInvoiceButton />}
      />
      <BillingStats />
      <ComplianceCards />
      <InvoicesTable />
    </div>
  );
}
