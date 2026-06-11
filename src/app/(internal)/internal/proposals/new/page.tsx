import ProposalForm from '@/components/forms/ProposalForm'

export default async function NewProposalPage({ searchParams }: { searchParams: Promise<{ lead?: string }> }) {
  const { lead } = await searchParams
  return <ProposalForm mode="create" prefillLeadId={lead} />
}
