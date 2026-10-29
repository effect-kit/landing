import { useRef } from "react";

import { GitHubIcon } from "@/components/icons/github-icon";
import { EmailsLogo } from "@/components/logos";
import { ButtonLink, ExternalButton } from "@/components/marketing/button";
import { useReducedMotion, useSectionView } from "@/components/marketing/hooks";
import { InstallCommand } from "@/components/marketing/install-command";
import { isoProjector } from "@/components/marketing/iso";
import { Container, Eyebrow, Heading } from "@/components/marketing/section";

const install = [
  { id: "resend", label: "resend", packages: "@effect-kit/emails effect resend" },
  { id: "ses", label: "ses", packages: "@effect-kit/emails effect @aws-sdk/client-sesv2" },
  { id: "postmark", label: "postmark", packages: "@effect-kit/emails effect postmark" },
  { id: "nodemailer", label: "smtp", packages: "@effect-kit/emails effect nodemailer" },
] as const;

const { at, box, plane, poly } = isoProjector(250, 130);

/**
 * Closing: your app plate on the left, an open outbox tray on the right, and envelopes riding
 * the cable from one to the other and settling on the stack.
 */
function Illustration() {
  const reduced = useReducedMotion();

  const app = box(0, 120, 0, 150, 110, 14);
  const tray = { u: 200, v: -70, w: 130, d: 100, h: 46 };
  const walls = box(tray.u, tray.v, 0, tray.w, tray.d, tray.h);
  const floor = box(tray.u + 8, tray.v + 8, 6, tray.w - 16, tray.d - 16, 0);
  const letters = [0, 1, 2, 3].map((index) =>
    box(tray.u + 18, tray.v + 16, 8 + index * 7, tray.w - 36, tray.d - 32, 4),
  );

  const plug = at(150, 175, 7);
  const port = at(tray.u, tray.v + tray.d / 2, 20);
  const cable = `M${plug[0]} ${plug[1]}Q${(plug[0] + port[0]) / 2} ${Math.max(plug[1], port[1]) + 50} ${port[0]} ${port[1]}`;

  return (
    <svg viewBox="-10 -20 620 420" className="h-auto w-full" aria-hidden="true">
      <path d={cable} className="ek-cta-cable" />
      {reduced
        ? null
        : [0, 1.1].map((begin) => (
            <g key={begin} className="ek-mail-flyer">
              <rect x={-9} y={-6} width={18} height={12} rx={1.5} />
              <path d="M-9 -5L0 1L9 -5" fill="none" />
              <animateMotion
                dur="2.2s"
                begin={`${begin}s`}
                repeatCount="indefinite"
                path={cable}
                rotate="auto"
              />
            </g>
          ))}

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

      <g data-accent="emails">
        {/* Back walls first, then the floor and letters, then the front walls. */}
        <path
          className="ek-cta-side-dark"
          d={poly([
            at(tray.u, tray.v, 0),
            at(tray.u + tray.w, tray.v, 0),
            at(tray.u + tray.w, tray.v, tray.h),
            at(tray.u, tray.v, tray.h),
          ])}
        />
        <path
          className="ek-cta-side"
          d={poly([
            at(tray.u, tray.v, 0),
            at(tray.u, tray.v + tray.d, 0),
            at(tray.u, tray.v + tray.d, tray.h),
            at(tray.u, tray.v, tray.h),
          ])}
        />
        <path className="ek-cta-top" d={floor.top} />
        {letters.map((faces) => (
          <g key={faces.top} className="ek-cta-module is-docked">
            <path className="ek-cta-module-side" d={faces.left} />
            <path className="ek-cta-module-side-dark" d={faces.right} />
            <path className="ek-cta-module-top" d={faces.top} />
          </g>
        ))}
        <g transform={plane(8 + 3 * 7 + 4)}>
          <path
            className="ek-mail-flap"
            d={`M${tray.u + 18} ${tray.v + 16}L${tray.u + tray.w / 2} ${tray.v + tray.d / 2}L${tray.u + tray.w - 18} ${tray.v + 16}`}
          />
          <EmailsLogo
            x={tray.u + tray.w / 2 - 16}
            y={tray.v + tray.d / 2 + 6}
            width={32}
            height={32}
            className="ek-cta-logo is-on"
          />
        </g>
        <path className="ek-cta-side ek-mail-wall" d={walls.left} />
        <path className="ek-cta-side-dark ek-mail-wall" d={walls.right} />
      </g>
    </svg>
  );
}

export function EmailsClosing() {
  const root = useRef<HTMLElement>(null);
  useSectionView(root, "closing");

  return (
    <section
      ref={root}
      id="closing"
      data-section=""
      aria-labelledby="emails-closing-title"
      className="border-t border-(--ek-line)"
    >
      <Container className="max-w-[1400px] py-20 md:py-28">
        <div className="relative grid grid-cols-1 border border-(--ek-line) lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] [&>*]:min-w-0">
          <div className="ek-corners pointer-events-none absolute -inset-px" aria-hidden="true" />
          <div className="flex flex-col justify-center gap-7 p-8 md:p-14">
            <Eyebrow>Get started</Eyebrow>
            <Heading id="emails-closing-title">Send your first email from Effect.</Heading>
            <InstallCommand options={install} />
            <div className="flex flex-wrap gap-3">
              <ButtonLink
                to="/docs/$"
                params={{ _splat: "emails" }}
                label="Read the docs"
                location="closing"
                cta="emails_docs"
                icon={<EmailsLogo className="size-4" />}
              />
              <ExternalButton
                href="https://github.com/effect-kit/emails"
                label="GitHub"
                location="closing"
                cta="emails_github"
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
