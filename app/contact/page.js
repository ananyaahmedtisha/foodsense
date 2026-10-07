import { getContactInfo } from '@/lib/content';
import ContactForm from '@/components/ContactForm';

export default async function ContactPage() {
  const info = await getContactInfo();

  return (
    <div className="py-8 max-w-3xl mx-auto">
      <h1 className="font-display text-3xl font-extrabold">Contact Us ✉️</h1>
      <p className="text-stone-500 mt-1">{info.about}</p>
      <div className="grid md:grid-cols-2 gap-4 mt-6">
        <div className="bg-white rounded-2xl shadow-soft p-6">
          <p className="font-bold">Reach us</p>
          <div className="text-sm text-stone-600 mt-2 flex flex-col gap-1.5">
            {info.email && <p>📧 <a href={`mailto:${info.email}`} className="text-fresh font-semibold">{info.email}</a></p>}
            {info.phone && <p>📞 {info.phone}</p>}
            {info.address && <p>📍 {info.address}</p>}
            {info.hours && <p>🕙 {info.hours}</p>}
            <div className="flex gap-3 mt-2">
              {info.facebook && <a href={info.facebook} target="_blank" className="text-sm font-bold text-fresh">Facebook →</a>}
              {info.instagram && <a href={info.instagram} target="_blank" className="text-sm font-bold text-fresh">Instagram →</a>}
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-soft p-6">
          <p className="font-bold">Send a message</p>
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
