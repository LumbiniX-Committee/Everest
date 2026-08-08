import { useLocalSearchParams } from 'expo-router';

import { AnswerScreen } from '@/features/dhamma';

/**
 * Either a question from the collection (`questionId`) or one the visitor typed
 * (`q`). One route, because it is one task — asking, and reading the answer.
 */
export default function QuestionRoute() {
  const { questionId, q } = useLocalSearchParams<{ questionId?: string; q?: string }>();
  return <AnswerScreen questionId={questionId} query={q} />;
}
