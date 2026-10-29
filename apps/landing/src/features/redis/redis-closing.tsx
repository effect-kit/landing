import { GitHubIcon } from "@/components/icons/github-icon";
import { RedisLogo } from "@/components/logos";
import { ButtonLink, ExternalButton } from "@/components/marketing/button";
import { useReducedMotion } from "@/components/marketing/hooks";
import { InstallCommand } from "@/components/marketing/install-command";
import { isoProjector } from "@/components/marketing/iso";
import { Container, Eyebrow, Heading } from "@/components/marketing/section";

const install = [{ id: "redis", label: "redis", packages: "@effect-kit/redis effect" }] as const;

const { at, box, plane } = isoProjector(250, 120);

/**
 * Closing: your app plate on the left, a Redis node of three slabs on the right, and one
 * cable between them with commands going out and replies coming back.
 */
function Illustration() {
  const reduced = useReducedMotion();

  const app = box(0, 120, 0, 150, 110, 14);
  const slabs = [0, 1, 2].map((index) => box(200, -60, index * 30, 110, 110, 24));

  const plug = at(150, 175, 7);
  const port = at(200, -5, 12);
  const mid = [(plug[0] + port[0]) / 2, Math.max(plug[1], port[1]) + 40] as const;
  const cable = `M${plug[0]} ${plug[1]}Q${mid[0]} ${mid[1]} ${port[0]} ${port[1]}`;

  return (
    <svg viewBox="-10 -10 620 400" className="h-auto w-full" aria-hidden="true">
      <path d={cable} className="ek-cta-cable" />
      {reduced ? null : (
        <>
          {[0, 0.9].map((begin) => (
            <circle key={`out-${begin}`} r={3.5} className="ek-cta-packet">
              <animateMotion dur="1.8s" begin={`${begin}s`} repeatCount="indefinite" path={cable} />
            </circle>
          ))}
          <circle r={3} className="ek-cta-packet is-back">
            <animateMotion
              dur="1.8s"
              begin="0.45s"
              repeatCount="indefinite"
              keyPoints="1;0"
              keyTimes="0;1"
              calcMode="linear"
              path={cable}
            />
          </circle>
        </>
      )}

      <g>
        <path className="ek-cta-side" d={app.left} />
        <path className="ek-cta-side-dark" d={app.right} />
        <path className="ek-cta-top" d={app.top} />
        <g transform={plane(14)}>
          <rect className="ek-cta-line" x={10} y={130} width={130} height={90} fill="none" />
          <text
            className="ek-cta-engrave font-mono text-[9px] tracking-[0.14em] uppercase"
            x={20}
            y={150}
          >
            your app
          </text>
          {[170, 180, 190].map((y, index) => (
            <path key={y} className="ek-cta-line" d={`M20 ${y}h${80 - index * 18}`} />
          ))}
        </g>
      </g>

      {slabs.map((faces, index) => (
        <g key={faces.top} className="ek-cta-module is-docked" data-accent="redis">
          <path className="ek-cta-module-side" d={faces.left} />
          <path className="ek-cta-module-side-dark" d={faces.right} />
          <path className="ek-cta-module-top" d={faces.top} />
          {[8, 14].map((z) => {
            const a = at(212, 50, index * 30 + z);
            const b = at(290, 50, index * 30 + z);

            return <path key={z} className="ek-cta-line" d={`M${a[0]} ${a[1]}L${b[0]} ${b[1]}`} />;
          })}
        </g>
      ))}
      <g transform={plane(84)} data-accent="redis">
        <RedisLogo x={225} y={-35} width={60} height={60} className="ek-cta-logo is-on" />
      </g>
    </svg>
  );
}

export function RedisClosing() {
  return (
    <section aria-labelledby="redis-closing-title" className="border-t border-(--ek-line)">
      <Container className="max-w-[1400px] py-20 md:py-28">
        <div className="relative grid grid-cols-1 border border-(--ek-line) lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] [&>*]:min-w-0">
          <div className="ek-corners pointer-events-none absolute -inset-px" aria-hidden="true" />
          <div className="flex flex-col justify-center gap-7 p-8 md:p-14">
            <Eyebrow>Get started</Eyebrow>
            <Heading id="redis-closing-title">Add Redis to your Effect app.</Heading>
            <InstallCommand options={install} />
            <div className="flex flex-wrap gap-3">
              <ButtonLink
                to="/docs/$"
                params={{ _splat: "redis" }}
                label="Read the docs"
                icon={<RedisLogo className="size-4" />}
              />
              <ExternalButton
                href="https://github.com/effect-kit/redis"
                label="GitHub"
                icon={<GitHubIcon className="size-4" />}
              />
            </div>
          </div>
          <div className="ek-dotted flex items-center justify-center border-t border-(--ek-line) px-6 py-10 lg:border-t-0 lg:border-s">
            <Illustration />
          </div>
        </div>
      </Container>
    </section>
  );
}
