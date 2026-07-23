import React from 'react';
import CampaignReportClient from './CampaignReportClient';

export function generateStaticParams() {
  return [{ id: 'default' }, { id: 'demo' }];
}

export default function CampaignReportPage({ params }: { params: { id: string } }) {
  return <CampaignReportClient id={params.id} />;
}
