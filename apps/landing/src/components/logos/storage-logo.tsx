import { BrandLogo, type LogoProps } from "./brand-logo";

export function StorageLogo(props: LogoProps) {
  return (
    <BrandLogo
      size={1254}
      markViewBox="277 260 700 700"
      glyph="M378 407H952l-76 76H302zM350 523H904V737l-76 76H350zM506 581H748l-44 44H506z"
      glyphFillRule="evenodd"
      {...props}
    />
  );
}
