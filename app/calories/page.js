import CalorieCounter from '@/components/CalorieCounter';

export const metadata = {
  title: 'Bangladeshi Calorie Counter — FoodSense',
  description: 'Search 77 Bangladeshi foods in English or Bangla, set portions, and count calories, protein, carbs, fat, and fibre.',
};

export default function CaloriesPage() {
  return (
    <div className="py-8">
      <h1 className="font-display text-3xl font-extrabold">Bangladeshi Calorie Counter 🍛</h1>
      <p className="text-stone-500 mt-1">77 local foods with Bangla search. Pick portions, build your plate, see totals against your daily goal.</p>
      <div className="mt-6">
        <CalorieCounter />
      </div>
    </div>
  );
}
