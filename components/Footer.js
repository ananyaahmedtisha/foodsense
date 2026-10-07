import { getContactInfo } from '@/lib/content';

export default async function Footer() {
  const info = await getContactInfo();
  return (
    <footer className="mt-16 border-t bg-white">
      <div className="max-w-6xl mx-auto px-4 py-10 grid md:grid-cols-3 gap-6 text-sm">
        <div>
          <p className="font-display font-bold text-lg">FoodSense</p>
          <p className="text-stone-600 mt-2">Translating microbiology into everyday food advice for students in Dhaka and beyond.</p>
        </div>
        <div>
          <p className="font-semibold mb-2">Explore</p>
          <div className="flex flex-col gap-1 text-stone-600">
            <a href="/articles">Science Pantry</a>
            <a href="/posters">Awareness Gallery</a>
            <a href="/videos">Visual Learning</a>
            <a href="/surveys">Campus Pulse</a>
          </div>
        </div>
        <div>
          <p className="font-semibold mb-2">Contact Us</p>
          <div className="flex flex-col gap-1 text-stone-600">
            {info.email && <a href={`mailto:${info.email}`}>{info.email}</a>}
            {info.address && <span>{info.address}</span>}
            {info.hours && <span>{info.hours}</span>}
            <a href="/contact" className="text-fresh font-semibold">Send a message →</a>
          </div>
        </div>
      </div>
      <div className="text-center text-xs text-stone-500 pb-6">© 2026 FoodSense • Built for students, by students.</div>
    </footer>
  );
}
