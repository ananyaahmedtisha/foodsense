import CalorieCounter from '@/components/CalorieCounter';
import FoodRequestForm from '@/components/FoodRequestForm';
import PageHero from '@/components/PageHero';

export const metadata = {
  title: 'Bangladeshi Calorie Counter — FoodSense',
  description: 'Search 77 Bangladeshi foods in English or Bangla, set portions, and count calories, protein, carbs, fat, and fibre.',
};

export default function CaloriesPage() {
  return (
    <div className="py-8">
      <PageHero
        eyebrow="Bangladeshi Calorie Counter"
        title="Know what's on your plate 🍛"
        sub="75 local foods with Bangla search. Pick portions, build your plate, see totals against your daily goal."
        tone="amber"
      />
      <div className="mt-6">
        <CalorieCounter />
      </div>
      <FoodRequestForm />
    </div>
  );
}
