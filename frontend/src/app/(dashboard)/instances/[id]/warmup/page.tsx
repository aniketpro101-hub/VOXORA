import WarmupDashboardClientPage from './ClientPage';

export function generateStaticParams() {
  return [{ id: 'default' }];
}

export default function Page() {
  return <WarmupDashboardClientPage />;
}
