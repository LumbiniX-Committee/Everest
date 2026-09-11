import { BottomSheet } from '@/components/ui';
import { QuestAreaCollection, type QuestAreaCollectionProps } from '@/features/quests';

export function QuestSheet({ visible, onClose, ...collection }: QuestAreaCollectionProps & { visible: boolean; onClose: () => void }) {
  return <BottomSheet visible={visible} onClose={onClose} title="Nearby adventures" subtitle="Choose a place. Make a memory." scroll>
    <QuestAreaCollection {...collection} />
  </BottomSheet>;
}
