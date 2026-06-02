import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, FileText, Mail, ShieldCheck } from 'lucide-react';

const pageContent = {
  '/privasi': {
    title: 'Privacy Policy',
    icon: <ShieldCheck size={22} />,
    lead: 'Halaman ini berisi ringkasan kebijakan privasi sementara untuk demo Finly.',
    items: [
      'Data yang tampil di aplikasi demo sebagian besar masih berupa data contoh atau data lokal browser.',
      'Integrasi backend final akan menentukan penyimpanan, penghapusan, dan pemrosesan data pengguna.',
      'Jangan gunakan halaman demo ini untuk menyimpan data sensitif asli sebelum backend dan legal final siap.',
    ],
  },
  '/syarat': {
    title: 'Terms of Service',
    icon: <FileText size={22} />,
    lead: 'Halaman ini adalah draft syarat penggunaan sementara untuk kebutuhan presentasi aplikasi.',
    items: [
      'Fitur AI, investasi, dan notifikasi masih bersifat demo dan edukatif.',
      'Analisis saham bukan rekomendasi beli atau jual.',
      'Ketentuan resmi perlu ditinjau ulang sebelum aplikasi dipakai secara publik.',
    ],
  },
  '/kontak': {
    title: 'Contact',
    icon: <Mail size={22} />,
    lead: 'Kontak ini masih placeholder untuk versi capstone/demo.',
    items: [
      'Email demo: support@finly.demo',
      'Jam layanan demo: Senin-Jumat, 09.00-17.00 WIB.',
      'Informasi kontak final dapat diganti setelah tim menentukan kanal resmi.',
    ],
  },
};

export default function LegalPage() {
  const { pathname } = useLocation();
  const content = pageContent[pathname] || pageContent['/privasi'];

  return (
    <main className="min-h-screen bg-[#F8F9FA] dark:bg-[#161616] px-4 py-8 font-sans">
      <div className="max-w-3xl mx-auto">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-[14px] font-semibold text-[#05A845] hover:text-[#048A38] mb-6"
        >
          <ArrowLeft size={16} />
          Kembali
        </Link>

        <section className="app-card rounded-[24px] p-6 sm:p-8">
          <div className="w-12 h-12 rounded-2xl bg-[#EAF6ED] dark:bg-[#05A845]/10 text-[#05A845] flex items-center justify-center mb-5">
            {content.icon}
          </div>
          <h1 className="text-[26px] font-black app-heading mb-2">{content.title}</h1>
          <p className="text-[14px] app-muted leading-relaxed mb-5">{content.lead}</p>

          <div className="rounded-2xl bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-100 dark:border-yellow-500/20 px-4 py-3 text-[13px] text-yellow-800 dark:text-yellow-200 mb-6">
            Konten halaman ini masih dummy/draft untuk kebutuhan demo capstone, bukan dokumen legal final.
          </div>

          <div className="space-y-3">
            {content.items.map((item) => (
              <div key={item} className="flex items-start gap-3 text-[14px] app-heading">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#05A845] shrink-0" />
                <span className="break-words">{item}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
