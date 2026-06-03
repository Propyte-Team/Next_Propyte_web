'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Users, MapPin, MessageCircle } from '@/lib/icons';
import type { TeamMemberRow } from '@/lib/supabase/queries';
import { pickBio, getInitials, pickAvatarColor, type TeamBioPerson } from '@/lib/team-bio';
import TeamBioModal from '@/components/shared/TeamBioModal';

function buildWhatsappLink(member: TeamMemberRow): string | null {
  const phone = member.whatsapp || member.phone;
  if (!phone) return null;
  const clean = phone.replace(/[^0-9]/g, '');
  if (clean.length < 10) return null;
  return `https://wa.me/${clean}`;
}

function Avatar({ photoUrl, name }: { photoUrl: string | null; name: string }) {
  if (photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl}
        alt={name}
        width={144}
        height={144}
        className="w-36 h-36 rounded-full object-cover object-top mx-auto mb-4 ring-4 ring-[#A2F9FF]/30 transition-transform duration-300 group-hover:scale-105"
        loading="lazy"
      />
    );
  }
  return (
    <div
      className="w-36 h-36 rounded-full flex items-center justify-center mx-auto mb-4 ring-4 ring-[#A2F9FF]/30 transition-transform duration-300 group-hover:scale-105"
      style={{ backgroundColor: pickAvatarColor(name) }}
    >
      <span className="text-white text-3xl font-bold" aria-hidden="true">
        {getInitials(name)}
      </span>
    </div>
  );
}

export default function EquipoBios({ teamMembers }: { teamMembers: TeamMemberRow[] }) {
  const locale = useLocale();
  const t = useTranslations('equipoPage');
  const tBio = useTranslations('teamBio');
  const [selected, setSelected] = useState<TeamBioPerson | null>(null);

  if (teamMembers.length === 0) {
    return (
      <div className="max-w-2xl mx-auto propyte-card-glass-light p-8 md:p-12 text-center border-2 border-dashed border-[#A2F9FF]/40 rounded-2xl">
        <div className="w-14 h-14 mx-auto mb-5 bg-[#A2F9FF]/20 rounded-2xl flex items-center justify-center">
          <Users size={28} strokeWidth={1.5} className="text-[#0E7490]" />
        </div>
        <p className="text-base md:text-lg text-gray-700 leading-relaxed max-w-lg mx-auto">
          {t('section2Placeholder')}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
        {teamMembers.map((m) => {
          const waLink = buildWhatsappLink(m);
          const bio = pickBio(locale, m.bio_long, m.bio_long_en);
          const openProfile = () =>
            setSelected({
              name: m.name,
              role: m.role,
              city: m.city,
              photoUrl: m.photo_url,
              bio: bio ?? '',
              whatsappLink: waLink,
            });
          return (
            <div
              key={m.id}
              className="group bg-white p-6 rounded-xl border border-gray-100 text-center hover:shadow-lg transition-shadow"
            >
              <Avatar photoUrl={m.photo_url} name={m.name} />
              <h3 className="font-bold text-[#1A2F3F] text-lg">{m.name}</h3>
              <p className="text-sm text-gray-600 mt-1">{m.role}</p>
              {m.city && (
                <p className="text-xs text-gray-600 mt-1 flex items-center justify-center gap-1">
                  <MapPin size={11} aria-hidden="true" /> {m.city}
                </p>
              )}
              {m.bio_short && (
                <p className="text-xs text-gray-600 mt-3 leading-relaxed">{m.bio_short}</p>
              )}
              <div className="mt-4 flex flex-col items-center gap-2">
                {bio && (
                  <button
                    type="button"
                    onClick={openProfile}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-[#0E7490] border border-[#0E7490]/30 rounded-full hover:bg-[#0E7490]/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5CE0D2]"
                  >
                    {tBio('viewProfile')}
                  </button>
                )}
                {waLink && (
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366]/10 text-[#075E54] text-xs font-semibold rounded-full hover:bg-[#25D366]/20 transition-colors"
                  >
                    <MessageCircle size={12} aria-hidden="true" /> WhatsApp
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <TeamBioModal open={selected !== null} onClose={() => setSelected(null)} person={selected} />
    </>
  );
}
