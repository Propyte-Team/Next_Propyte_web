import { describe, it, expect } from 'vitest';
import { resolvePostAuthor, teamAnchorId, type TeamAuthorSource } from './post-author';

const TEAM: TeamAuthorSource[] = [
  { name: 'Felipe Luksic', role: 'Director Comercial', photo_url: 'https://cdn/felipe.webp', bio_short: null },
  { name: 'Laura UC', role: 'Diseñadora Gráfica', photo_url: 'https://cdn/laura.webp', bio_short: null },
];

describe('resolvePostAuthor', () => {
  it('deja intacto el byline genérico de los 18 artículos actuales', () => {
    const a = resolvePostAuthor({ author_name: 'Propyte', author_image: null }, TEAM, 'es');
    expect(a.isTeamMember).toBe(false);
    expect(a.name).toBe('Propyte');
    expect(a.profileUrl).toBeNull();
    expect(a.role).toBeNull();
  });

  it('resuelve cargo, foto y perfil enlazable de un miembro real', () => {
    const a = resolvePostAuthor({ author_name: 'Felipe Luksic', author_image: null }, TEAM, 'es');
    expect(a.isTeamMember).toBe(true);
    expect(a.role).toBe('Director Comercial');
    expect(a.photo).toBe('https://cdn/felipe.webp');
    expect(a.profileUrl).toBe('/es/nosotros/equipo-comercial#felipe-luksic');
  });

  it('matchea ignorando acentos, caso y espacios de más', () => {
    const team: TeamAuthorSource[] = [
      { name: 'Álvaro Sansores', role: 'Asesor', photo_url: null, bio_short: null },
    ];
    const a = resolvePostAuthor({ author_name: '  alvaro   SANSORES ' }, team, 'en');
    expect(a.isTeamMember).toBe(true);
    expect(a.profileUrl).toBe('/en/nosotros/equipo-comercial#alvaro-sansores');
  });

  it('no enlaza cuando el nombre es ambiguo (dos miembros homónimos)', () => {
    const team: TeamAuthorSource[] = [
      { name: 'Laura UC', role: 'Diseñadora Gráfica', photo_url: null, bio_short: null },
      { name: 'laura uc', role: 'Asesor', photo_url: null, bio_short: null },
    ];
    const a = resolvePostAuthor({ author_name: 'Laura UC' }, team, 'es');
    expect(a.isTeamMember).toBe(false);
    expect(a.profileUrl).toBeNull();
  });

  it('la foto del artículo gana sobre la del directorio', () => {
    const a = resolvePostAuthor(
      { author_name: 'Felipe Luksic', author_image: 'https://cdn/editorial.webp' },
      TEAM,
      'es'
    );
    expect(a.photo).toBe('https://cdn/editorial.webp');
  });

  it('credentials queda null mientras el Hub no tenga bio_short', () => {
    expect(resolvePostAuthor({ author_name: 'Laura UC' }, TEAM, 'es').credentials).toBeNull();
    const conBio = resolvePostAuthor({ author_name: 'Laura UC' }, [
      { ...TEAM[1], bio_short: 'Especialista en identidad de marca' },
    ], 'es');
    expect(conBio.credentials).toBe('Especialista en identidad de marca');
  });

  it('el ancla es estable y URL-safe', () => {
    expect(teamAnchorId('Zyanya Martineau')).toBe('zyanya-martineau');
    expect(teamAnchorId('Pablo Toral')).toBe('pablo-toral');
    expect(teamAnchorId('José  Benjamín Paredes')).toBe('jose-benjamin-paredes');
  });
});
