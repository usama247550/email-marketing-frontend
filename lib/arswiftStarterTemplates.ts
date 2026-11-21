/**
 * Ready-to-edit cold email drafts for ArSwift — website development.
 * Caravan website marketing uses separate templates — do not mix offers in one email.
 */

export type ArswiftStarterMarket = 'US' | 'DE';

export interface ArswiftStarterTemplate {
  id: string;
  market: ArswiftStarterMarket;
  title: string;
  subtitle: string;
  name: string;
  subject: string;
  body: string;
}

const p = (lines: string[]) => lines.map((line) => `<p>${line}</p>`).join('');

export const ARSWIFT_STARTER_TEMPLATES: ArswiftStarterTemplate[] = [
  {
    id: 'us-first-touch',
    market: 'US',
    title: 'First email (US)',
    subtitle: 'Short main outreach — under ~120 words. Free homepage design.',
    name: 'ArSwift US — Website (short)',
    subject: 'Is {{companyName}} losing customers to competitors in {{city}}?',
    body: p([
      'Hi {{companyName}} team,',
      'I’m {{senderName}}, a web developer at ArSwift. On {{website}} I noticed {{websiteIssue}}.',
      'In {{city}}, people choose whoever looks easiest to trust online. If your site feels slow or awkward on a phone, they call your competitor instead.',
      'I’ll send a <strong>free homepage design</strong> for {{companyName}} — no cost, no obligation. Reply “yes” and I’ll email it, or we can talk for <strong>5 minutes</strong>.',
      'Reply “no” and I won’t follow up.',
      'Best,<br>{{senderName}}<br>ArSwift',
    ]),
  },
  {
    id: 'us-first-touch-alt',
    market: 'US',
    title: 'Same email — alt subject',
    subtitle: 'Use the same body as “First email (US)”. Only the subject line changes.',
    name: 'ArSwift US — Website (short, alt subject)',
    subject: '{{companyName}} — are you losing customers online?',
    body: p([
      'Hi {{companyName}} team,',
      'I’m {{senderName}}, a web developer at ArSwift. On {{website}} I noticed {{websiteIssue}}.',
      'In {{city}}, people choose whoever looks easiest to trust online. If your site feels slow or awkward on a phone, they call your competitor instead.',
      'I’ll send a <strong>free homepage design</strong> for {{companyName}} — no cost, no obligation. Reply “yes” and I’ll email it, or we can talk for <strong>5 minutes</strong>.',
      'Reply “no” and I won’t follow up.',
      'Best,<br>{{senderName}}<br>ArSwift',
    ]),
  },
  {
    id: 'de-first-touch',
    market: 'DE',
    title: 'Erste E-Mail (Deutschland)',
    subtitle: 'Kurz + kostenloses Startseiten-Design.',
    name: 'ArSwift DE — Website (kurz)',
    subject: 'Verliert {{companyName}} in {{city}} Kunden an die Konkurrenz?',
    body: p([
      'Guten Tag {{companyName}}-Team,',
      'hier ist {{senderName}}, Webentwickler bei ArSwift. Auf {{website}}: {{websiteIssueDe}}.',
      'In {{city}} entscheiden Kunden schnell — wirkt die Website schwach auf dem Handy, ruft oft der Wettbewerb an.',
      'Ich schicke ein <strong>kostenloses Startseiten-Design</strong> für {{companyName}}. Antwort „Ja“ genügt — oder <strong>5 Minuten</strong> Gespräch. Mit „Nein“ höre ich auf.',
      'Freundliche Grüße<br>{{senderName}}<br>ArSwift',
    ]),
  },
];

export const ARSWIFT_TEMPLATE_TIPS = [
  'Use one subject per campaign: competitors in {{city}} OR losing customers online.',
  'Send the free homepage design only after they reply yes.',
  'Search real business niches in Lead Finder (dentist, roofer), not “web design”.',
];