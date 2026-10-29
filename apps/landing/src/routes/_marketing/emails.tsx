import { createFileRoute } from "@tanstack/react-router";

import { CodeProvider } from "@/components/marketing/code";
import type { SnippetId } from "@/content/snippets";
import { EmailsPage } from "@/features/emails/emails-page";
import { swapSnippetIds } from "@/features/emails/provider-switch";
import { Playground, playgroundExampleIds, visualCode } from "@/features/visual";
import { highlightSnippets } from "@/lib/highlight";
import { keyedSnippets } from "@/lib/magic";
import { siteImageUrl } from "@/lib/og/urls";
import { breadcrumbLd, packageLd, pageTitle, seo, webPageLd } from "@/lib/seo";
import { site } from "@/lib/site";

const snippetIds: readonly SnippetId[] = ["emails.react"];

export const Route = createFileRoute("/_marketing/emails")({
  loader: async () => {
    const [code, tokens, visual] = await Promise.all([
      highlightSnippets({ data: snippetIds }),
      keyedSnippets({ data: swapSnippetIds }),
      visualCode({ data: playgroundExampleIds(["emails"]) }),
    ]);

    return { code, tokens, visual };
  },
  head: () =>
    seo({
      title: "Email for Effect",
      description:
        "One typed Email service for Effect across 16 providers, including Resend, Amazon SES, Postmark and SMTP. Capability checks before sending, React templates, batches and idempotent retries.",
      path: "/emails",
      image: {
        url: siteImageUrl("emails"),
        alt: "Email for Effect: one Email service for 16 providers",
      },
      keywords: [
        "email",
        "Effect",
        "Effect-TS",
        "TypeScript",
        "Resend",
        "Amazon SES",
        "Postmark",
        "SendGrid",
        "Nodemailer",
        "React Email",
        "transactional email",
      ],
      jsonLd: [
        packageLd({
          name: "Effect Kit Emails",
          npm: "@effect-kit/emails",
          description:
            "One typed Email service for Effect across 16 providers, including Resend, Amazon SES, Postmark and SMTP. Capability checks before sending, React templates, batches and idempotent retries.",
          path: "/emails",
          repository: "https://github.com/effect-kit/emails",
          image: siteImageUrl("emails"),
          keywords: [
            "email",
            "Effect",
            "Effect-TS",
            "TypeScript",
            "Resend",
            "Amazon SES",
            "Postmark",
            "SendGrid",
            "Nodemailer",
            "React Email",
            "transactional email",
          ],
        }),
        webPageLd({
          name: pageTitle("Email for Effect"),
          description:
            "One typed Email service for Effect across 16 providers, including Resend, Amazon SES, Postmark and SMTP. Capability checks before sending, React templates, batches and idempotent retries.",
          path: "/emails",
          image: siteImageUrl("emails"),
        }),
        breadcrumbLd([
          { name: site.name, path: "/" },
          { name: "Email for Effect", path: "/emails" },
        ]),
      ],
    }),
  component: Emails,
});

function Emails() {
  const { code, tokens, visual } = Route.useLoaderData();

  return (
    <CodeProvider value={code}>
      <EmailsPage
        tokens={tokens}
        playground={<Playground categories={["emails"]} code={visual} />}
      />
    </CodeProvider>
  );
}
