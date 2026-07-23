import CampaignReportClientPage from './ClientPage';

export function generateStaticParams() {
  return [{ id: 'default' }];
}

export default function Page() {
  return <CampaignReportClientPage />;
}
