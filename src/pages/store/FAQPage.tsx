import { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { FAQ } from '../../lib/types';

export function FAQPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    supabase.from('faqs').select('*').order('sort_order').then(({ data }) => {
      setFaqs(data as FAQ[] || []);
      if (data && data.length > 0) setOpenId(data[0].id);
    });
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="text-center mb-12">
        <h1 className="font-serif text-4xl font-bold text-secondary-900 mb-3">Frequently Asked Questions</h1>
        <p className="text-secondary-600">Find answers to common questions about our products and services.</p>
      </div>

      <div className="space-y-3">
        {faqs.map(faq => (
          <div key={faq.id} className="card overflow-hidden">
            <button
              onClick={() => setOpenId(openId === faq.id ? null : faq.id)}
              className="w-full flex items-center justify-between p-5 text-left hover:bg-secondary-50 transition-colors"
            >
              <span className="font-serif text-lg font-semibold text-secondary-900">{faq.question}</span>
              <ChevronDown className={`w-5 h-5 text-secondary-500 transition-transform ${openId === faq.id ? 'rotate-180' : ''}`} />
            </button>
            {openId === faq.id && (
              <div className="px-5 pb-5 text-secondary-700 leading-relaxed animate-slide-down">
                {faq.answer}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
