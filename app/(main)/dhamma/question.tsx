import { useLocalSearchParams } from 'expo-router';

import { QuestionScreen } from '@/features/dhamma';

export default function QuestionRoute() {
  const { questionId } = useLocalSearchParams<{ questionId: string }>();
  return <QuestionScreen questionId={questionId} />;
}
