import ProposalForm from '@/components/forms/ProposalForm'

export default async function NewProposalPage({ searchParams }: { searchParams: Promise<{ lead?: string; deal_id?: string }> }) {
  const { lead, deal_id } = await searchParams
  return <ProposalForm mode="create" prefillLeadId={lead} prefillDealId={deal_id} />
}
