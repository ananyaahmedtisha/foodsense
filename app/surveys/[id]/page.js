import SurveyTaker from '@/components/SurveyTaker';
import { createServerSupabase, isSupabaseConfigured } from '@/lib/supabaseServer';

async function getSurvey(id) {
  if (id === 's1' || id === 's2' || !isSupabaseConfigured()) {
    return {
      survey: { id, title: id === 's2' ? 'Workshop Feedback — Merul Badda' : 'Food Safety Baseline — Aug 2026' },
      questions: [
        { id: 'q1', question_text: 'How long is it safe to leave cooked rice at room temperature?', question_type: 'multiple_choice', options: ['30 minutes only', 'Up to 2 hours', '6–8 hours is fine', 'Overnight is fine'] },
        { id: 'q2', question_text: 'Which practices do you currently follow? (tick all)', question_type: 'checkbox', options: ['Separate cutting boards', 'Reheat until steaming', 'Thaw meat in fridge', 'Check expiry dates'] },
        { id: 'q3', question_text: 'What is your biggest food challenge in the hostel?', question_type: 'text', options: [] },
      ],
      demo: true,
    };
  }
  const sb = createServerSupabase();
  const { data: survey } = await sb.from('surveys').select('*').eq('id', id).single();
  const { data: questions } = await sb.from('survey_questions').select('*').eq('survey_id', id).order('created_at');
  return { survey, questions: questions || [], demo: false };
}

export default async function TakeSurvey({ params }) {
  const { survey, questions } = await getSurvey(params.id);
  if (!survey) return <p className="py-10">Survey not found.</p>;
  return (
    <div className="py-8 max-w-2xl mx-auto">
      <h1 className="font-display text-2xl font-extrabold">{survey.title}</h1>
      <p className="text-sm text-stone-500 mt-1">Anonymous • ~2 minutes • helps us measure 30% improvement</p>
      <SurveyTaker surveyId={survey.id} questions={questions} />
    </div>
  );
}
