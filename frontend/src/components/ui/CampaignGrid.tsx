import { Campaign } from '@/types';
import CampaignCard from './CampaignCard';
import { motion } from 'motion/react';

export default function CampaignGrid({ campaigns, onDonate, onClick }: { campaigns: Campaign[], onDonate: (c: Campaign) => void, onClick: (c: Campaign) => void }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {campaigns.map((campaign, index) => (
        <motion.div
          key={campaign.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <CampaignCard campaign={campaign} onDonate={() => onDonate(campaign)} onClick={() => onClick(campaign)} />
        </motion.div>
      ))}
    </div>
  );
}
