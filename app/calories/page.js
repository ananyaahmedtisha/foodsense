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
        title="We count calories of Bangladeshi foods 🍛"
        sub="Search local dishes in English or Bangla, set your portion, and see exactly what's on your plate against your daily goal."
        tone="amber"
      />
      <div className="mt-6">
        <CalorieCounter />
      </div>
      <FoodRequestForm />
    </div>
  );
}
