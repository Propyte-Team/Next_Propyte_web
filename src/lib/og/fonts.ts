import fs from 'fs';
import path from 'path';

export function loadOGFonts() {
  const semiBold = fs.readFileSync(
    path.join(process.cwd(), 'public/fonts/SpaceGrotesk-SemiBold.woff')
  );
  const bold = fs.readFileSync(
    path.join(process.cwd(), 'public/fonts/SpaceGrotesk-Bold.woff')
  );
  return [
    { name: 'Space Grotesk', data: semiBold, weight: 600 as const, style: 'normal' as const },
    { name: 'Space Grotesk', data: bold, weight: 700 as const, style: 'normal' as const },
  ];
}
