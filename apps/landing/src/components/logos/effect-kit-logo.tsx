import { BrandLogo, type LogoProps } from "./brand-logo";

export function EffectKitLogo(props: LogoProps) {
  return (
    <BrandLogo
      size={200}
      markViewBox="47 44 110 110"
      glyph="M53 65h82l-17 17H53zM79.5 90H151l-17 17H79.5zM53 115.5h82l-17 17H53z"
      {...props}
    />
  );
}
