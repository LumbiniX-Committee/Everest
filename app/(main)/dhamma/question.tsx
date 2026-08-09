import { useLocalSearchParams } from 'expo-router';

import { DhammaChatScreen } from '@/features/dhamma';

/**
 * Either a question from the collection (`questionId`) or one the visitor typed
 * (`q`). One route, because it is one task — asking, and reading the answer.
 *
 * The parameter is the *opening* question now rather than the only one: the
 * screen is a conversation, and asking a second question no longer means going
 * back to type into a box on another screen.
 */
export default function QuestionRoute() {
  const { questionId, q } = useLocalSearchParams<{ questionId?: string; q?: string }>();
  return <DhammaChatScreen questionId={questionId} query={q} />;
}
