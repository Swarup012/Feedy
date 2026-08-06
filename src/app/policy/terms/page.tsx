"use client";

import { useEffect, useRef } from "react";

const NAV_ITEMS = [
  { href: "agreement",      label: "1. Agreement" },
  { href: "services",       label: "2. Our Services" },
  { href: "ip",             label: "3. Intellectual Property" },
  { href: "userreps",       label: "4. User Representations" },
  { href: "userreg",        label: "5. User Registration" },
  { href: "purchases",      label: "6. Purchases & Payment" },
  { href: "subscriptions",  label: "7. Subscriptions" },
  { href: "prohibited",     label: "8. Prohibited Activities" },
  { href: "ugc",            label: "9. User Contributions" },
  { href: "sitemanage",     label: "10. Services Management" },
  { href: "privacy",        label: "11. Privacy Policy" },
  { href: "termination",    label: "12. Term & Termination" },
  { href: "modifications",  label: "13. Modifications" },
  { href: "law",            label: "14. Governing Law" },
  { href: "disputes",       label: "15. Dispute Resolution" },
  { href: "disclaimer",     label: "16. Disclaimer" },
  { href: "liability",      label: "17. Limitations of Liability" },
  { href: "indemnification",label: "18. Indemnification" },
  { href: "misc",           label: "19. Miscellaneous" },
  { href: "contact",        label: "20. Contact Us" },
];

function SectionHeader({ num, title }: { num: string; title: string }) {
  return (
    <>
      <p className="tos-num">Section {num}</p>
      <h2 className="tos-h2">{title}</h2>
    </>
  );
}

function Sub({ title }: { title: string }) {
  return <h3 className="tos-h3">{title}</h3>;
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="tos-p">{children}</p>;
}

function UL({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="tos-ul">
      {items.map((item, i) => <li key={i}>{item}</li>)}
    </ul>
  );
}

function Divider() {
  return <hr className="tos-hr" />;
}

function InfoBox({ children }: { children: React.ReactNode }) {
  return <div className="tos-box">{children}</div>;
}

export default function TermsOfService() {
  const navRefs = useRef<Record<string, HTMLAnchorElement | null>>({});

  useEffect(() => {
    const sections = document.querySelectorAll<HTMLElement>(".tos-section");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            Object.values(navRefs.current).forEach((el) => el?.classList.remove("tos-active"));
            const id = entry.target.getAttribute("id");
            if (id && navRefs.current[id]) navRefs.current[id]?.classList.add("tos-active");
          }
        });
      },
      { rootMargin: "-30% 0px -60% 0px" }
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <style>{`
        .tos-wrap {
          display: grid;
          grid-template-columns: 240px 1fr;
          max-width: 1100px;
          margin: 0 auto;
          min-height: 100vh;
          padding: 0 16px;
          gap: 32px;
          background: #ffffff;
          color: #1e293b;
          font-family: 'Inter', system-ui, sans-serif;
          font-size: 15px;
          line-height: 1.75;
        }
        .tos-side {
          position: sticky; top: 0; height: 100vh;
          overflow-y: auto; padding: 32px 0;
          border-right: 1px solid #e2e8f0;
        }
        .tos-side::-webkit-scrollbar { display: none; }
        .tos-logo {
          font-size: 18px; font-weight: 700; color: #1e293b;
          text-decoration: none; display: flex; align-items: center;
          gap: 8px; margin-bottom: 32px;
        }
        .tos-dot {
          width: 8px; height: 8px; background: #6366f1;
          border-radius: 50%; display: inline-block;
        }
        .tos-label {
          font-size: 10px; font-weight: 600; letter-spacing: 0.12em;
          text-transform: uppercase; color: #94a3b8;
          margin-bottom: 12px; padding-left: 12px;
        }
        .tos-nav { list-style: none; display: flex; flex-direction: column; gap: 2px; padding: 0; margin: 0; }
        .tos-nav a {
          display: block; padding: 7px 12px; border-radius: 6px;
          color: #64748b; text-decoration: none; font-size: 13px;
          transition: background 0.15s, color 0.15s;
          border-left: 2px solid transparent;
        }
        .tos-nav a:hover, .tos-nav a.tos-active {
          background: #eef2ff; color: #4f46e5; border-left-color: #6366f1;
        }
        .tos-main { padding: 32px 0 60px; }
        .tos-header {
          margin-bottom: 32px; padding-bottom: 20px;
          border-bottom: 1px solid #e2e8f0;
        }
        .tos-badge {
          display: inline-block; background: #eef2ff; color: #6366f1;
          font-size: 11px; font-weight: 600; letter-spacing: 0.1em;
          text-transform: uppercase; padding: 4px 10px;
          border-radius: 99px; border: 1px solid #c7d2fe; margin-bottom: 16px;
        }
        .tos-title {
          font-size: 22px; font-weight: 700; color: #0f172a;
          line-height: 1.2; margin-bottom: 12px;
        }
        .tos-meta { display: flex; gap: 20px; flex-wrap: wrap; margin-bottom: 20px; }
        .tos-meta-item { font-size: 13px; color: #94a3b8; display: flex; align-items: center; gap: 6px; }
        .tos-meta-item span { color: #64748b; font-weight: 500; }
        .tos-section { margin-bottom: 40px; scroll-margin-top: 32px; }
        .tos-num {
          font-size: 11px; font-weight: 600; letter-spacing: 0.1em;
          text-transform: uppercase; color: #6366f1; margin-bottom: 8px;
        }
        .tos-h2 { font-size: 18px; font-weight: 600; color: #0f172a; margin-bottom: 16px; }
        .tos-h3 { font-size: 15px; font-weight: 600; color: #0f172a; margin: 20px 0 10px; }
        .tos-p { color: #475569; font-size: 14.5px; margin-bottom: 14px; }
        .tos-p:last-child { margin-bottom: 0; }
        .tos-link { color: #6366f1; text-decoration: none; border-bottom: 1px solid #c7d2fe; transition: border-color 0.15s; }
        .tos-link:hover { border-bottom-color: #6366f1; }
        .tos-ul { list-style: none; display: flex; flex-direction: column; gap: 8px; margin: 14px 0; padding: 0; }
        .tos-ul li {
          display: flex; align-items: flex-start; gap: 10px;
          font-size: 14px; color: #475569;
        }
        .tos-ul li::before {
          content: ''; width: 5px; height: 5px; background: #6366f1;
          border-radius: 50%; flex-shrink: 0; margin-top: 8px;
        }
        .tos-box {
          background: #f8fafc; border: 1px solid #e2e8f0;
          border-left: 3px solid #6366f1; border-radius: 8px;
          padding: 16px 20px; margin: 20px 0;
          font-size: 14px; color: #64748b;
        }
        .tos-warn {
          background: #fff7ed; border: 1px solid #fed7aa;
          border-left: 3px solid #f97316; border-radius: 8px;
          padding: 16px 20px; margin: 20px 0;
          font-size: 14px; color: #7c3d12;
        }
        .tos-contact-card {
          background: #f8fafc; border: 1px solid #e2e8f0;
          border-radius: 12px; padding: 24px 28px;
          display: flex; align-items: center;
          justify-content: space-between; gap: 20px;
          flex-wrap: wrap; margin-top: 20px;
        }
        .tos-contact-text strong { display: block; font-size: 15px; color: #0f172a; margin-bottom: 4px; }
        .tos-contact-text span { font-size: 13px; color: #94a3b8; }
        .tos-btn {
          display: inline-flex; align-items: center; gap: 8px;
          background: #6366f1; color: #fff; font-size: 13px;
          font-weight: 600; padding: 10px 20px; border-radius: 8px;
          text-decoration: none; transition: opacity 0.15s;
        }
        .tos-btn:hover { opacity: 0.88; }
        .tos-hr { border: none; border-top: 1px solid #e2e8f0; margin: 0 0 40px; }
        .tos-powered { font-size: 12px; color: #94a3b8; text-align: center; padding: 16px 0 32px; }
        .tos-powered span { color: #64748b; font-weight: 600; }
        @media (max-width: 768px) {
          .tos-wrap { grid-template-columns: 1fr; padding: 0 16px; gap: 0; }
          .tos-side { position: static; height: auto; border-right: none; border-bottom: 1px solid #e2e8f0; padding: 32px 0 24px; }
          .tos-title { font-size: 26px; }
        }
      `}</style>

      <div className="tos-wrap">
        <aside className="tos-side">
          <a href="https://faddy.site" className="tos-logo">
            <span className="tos-dot" /> Faddy
          </a>
          <p className="tos-label">On this page</p>
          <ul className="tos-nav">
            {NAV_ITEMS.map(({ href, label }) => (
              <li key={href}>
                <a href={`#${href}`} ref={(el) => { navRefs.current[href] = el; }}>{label}</a>
              </li>
            ))}
          </ul>
        </aside>

        <main className="tos-main">
          <header className="tos-header">
            <div className="tos-badge">Legal</div>
            <h1 className="tos-title">Terms of Service</h1>
            <div className="tos-meta">
              <div className="tos-meta-item">Last updated <span>August 5, 2026</span></div>
              <div className="tos-meta-item">Applies to <span>faddy.site</span></div>
            </div>
            <InfoBox>
              Please read these Terms carefully before using Faddy. By accessing or using our Services, you agree to be legally bound by these Terms. If you do not agree, you must not use the Services.
            </InfoBox>
          </header>

          {/* 1 */}
          <section className="tos-section" id="agreement">
            <SectionHeader num="01" title="Agreement to Our Legal Terms" />
            <P>Faddy is a service operated by <strong>Swarup Basu</strong>, a sole proprietor based in India, providing a role-based, multi-tenant user feedback management platform at <a href="https://faddy.site" className="tos-link">faddy.site</a>. Faddy helps businesses and developers collect, track, and organise user feedback across teams and organisations.</P>
            <P>These Terms of Service ("<strong>Terms</strong>") constitute a legally binding agreement between you ("<strong>User</strong>" or "<strong>you</strong>") and Swarup Basu, sole proprietor, operating as Faddy ("<strong>Faddy</strong>," "<strong>we</strong>," "<strong>us</strong>," or "<strong>our</strong>"), governing your access to and use of our website, platform, and any related services (collectively, the "<strong>Services</strong>").</P>
            <P>By using the Services, you confirm that you are at least 18 years old, have read and understood these Terms, and agree to be bound by them. <strong>If you do not agree, you must stop using the Services immediately.</strong></P>
            <P>We may update these Terms at any time. We will notify you of material changes via email to <a href="mailto:info@faddy.site" className="tos-link">info@faddy.site</a> or through an in-app notice. Continued use of the Services after the effective date constitutes acceptance of the updated Terms.</P>
          </section>

          <Divider />

          {/* 2 */}
          <section className="tos-section" id="services">
            <SectionHeader num="02" title="Our Services" />
            <P>Faddy provides a SaaS feedback management platform. Our Services are intended for use in accordance with applicable law. If your jurisdiction restricts any aspect of the Services, you are responsible for compliance with local laws.</P>
            <P>The Services are not tailored to comply with industry-specific regulations such as HIPAA or FISMA. If your use would be subject to such laws, you may not use the Services.</P>
          </section>

          <Divider />

          {/* 3 */}
          <section className="tos-section" id="ip">
            <SectionHeader num="03" title="Intellectual Property Rights" />
            <Sub title="Our intellectual property" />
            <P>We own or license all intellectual property in the Services, including source code, databases, software, designs, text, graphics, and logos (collectively, "<strong>Content</strong>") and all trademarks and service marks ("<strong>Marks</strong>"). Our Content and Marks are protected by applicable copyright, trademark, and other intellectual property laws.</P>
            <P>Subject to your compliance with these Terms, we grant you a limited, non-exclusive, non-transferable, revocable licence to access the Services for your personal or internal business use only. No part of the Services may be copied, reproduced, distributed, sold, or exploited for commercial purposes without our prior written permission.</P>
            <Sub title="Your submissions" />
            <P>By sending us feedback, suggestions, or other submissions, you assign to us all intellectual property rights in such submissions. We may use them freely without any obligation to compensate you.</P>
          </section>

          <Divider />

          {/* 4 */}
          <section className="tos-section" id="userreps">
            <SectionHeader num="04" title="User Representations" />
            <P>By using the Services, you represent and warrant that:</P>
            <UL items={[
              "All registration information you submit is true, accurate, current, and complete.",
              "You will maintain the accuracy of such information and promptly update it as necessary.",
              "You have the legal capacity to agree to these Terms.",
              "You are not a minor in your jurisdiction of residence.",
              "You will not access the Services through automated or non-human means.",
              "You will not use the Services for any illegal or unauthorised purpose.",
              "Your use will not violate any applicable law or regulation.",
            ]} />
            <P>If you provide false information, we have the right to suspend or terminate your account and refuse all current or future use of the Services.</P>
          </section>

          <Divider />

          {/* 5 */}
          <section className="tos-section" id="userreg">
            <SectionHeader num="05" title="User Registration" />
            <P>You may be required to register to use the Services. You agree to keep your password confidential and are responsible for all activity under your account. We reserve the right to remove or reclaim usernames we deem inappropriate at our sole discretion.</P>
          </section>

          <Divider />

          {/* 6 */}
          <section className="tos-section" id="purchases">
            <SectionHeader num="06" title="Purchases and Payment" />
            <P>All purchases are processed through <a href="https://www.paddle.com" target="_blank" rel="noopener noreferrer" className="tos-link">Paddle.com</a>, who acts as our Merchant of Record. Paddle handles all payment processing, billing, and related compliance. By purchasing, you also agree to <a href="https://www.paddle.com/legal/terms" target="_blank" rel="noopener noreferrer" className="tos-link">Paddle&apos;s Terms of Service</a>.</P>
            <P>Accepted payment methods include all major credit/debit cards and payment options supported by Paddle. You agree to provide accurate and complete billing information and authorise recurring charges where applicable.</P>
            <P>We reserve the right to refuse any order and to correct pricing errors at any time.</P>
          </section>

          <Divider />

          {/* 7 */}
          <section className="tos-section" id="subscriptions">
            <SectionHeader num="07" title="Subscriptions" />
            <Sub title="Billing and Renewal" />
            <P>Your subscription will automatically renew unless cancelled. You consent to recurring charges without prior approval for each cycle. The billing period depends on the plan you selected at sign-up.</P>
            <Sub title="Free Trial" />
            <P>We offer a 14-day free trial for new users. At the end of the trial, your account will be charged according to your chosen subscription plan unless you cancel before the trial ends.</P>
            <Sub title="Cancellation" />
            <P>You may cancel your subscription at any time from your account settings. Cancellation takes effect at the end of the current billing period. All purchases are non-refundable except as set out in our <a href="/policy/refund" className="tos-link">Refund Policy</a>. For questions, email <a href="mailto:support@faddy.site" className="tos-link">support@faddy.site</a>.</P>
            <Sub title="Fee Changes" />
            <P>We may change subscription fees from time to time and will notify you in accordance with applicable law.</P>
          </section>

          <Divider />

          {/* 8 */}
          <section className="tos-section" id="prohibited">
            <SectionHeader num="08" title="Prohibited Activities" />
            <P>You may not use the Services for any purpose other than as intended. As a user, you agree not to:</P>
            <UL items={[
              "Systematically retrieve data to build a collection or database without written permission.",
              "Trick, defraud, or mislead us or other users, including attempts to obtain sensitive account information.",
              "Circumvent, disable, or interfere with security features of the Services.",
              "Use information from the Services to harass, abuse, or harm others.",
              "Make unauthorised use of the Services, including scraping, bots, or automated scripts.",
              "Upload or transmit viruses, malware, or any malicious code.",
              "Attempt to impersonate another user or person.",
              "Interfere with or create an undue burden on the Services or connected networks.",
              "Reverse engineer, decompile, or disassemble any part of the Services.",
              "Use the Services to compete with us or for any unauthorised commercial purpose.",
              "Collect user email addresses for unsolicited communications.",
              "Use the Services in any manner that violates applicable law or regulation.",
            ]} />
          </section>

          <Divider />

          {/* 9 */}
          <section className="tos-section" id="ugc">
            <SectionHeader num="09" title="User Generated Contributions" />
            <P>The Services may allow you to submit, post, or transmit content ("<strong>Contributions</strong>"). By posting Contributions, you grant us a worldwide, irrevocable, royalty-free licence to use, reproduce, modify, publish, and distribute such content for any purpose.</P>
            <P>You represent that your Contributions are original, do not infringe any third-party rights, and comply with these Terms. You are solely responsible for your Contributions. We reserve the right to remove any Contributions at any time without notice.</P>
          </section>

          <Divider />

          {/* 10 */}
          <section className="tos-section" id="sitemanage">
            <SectionHeader num="10" title="Services Management" />
            <P>We reserve the right, but not the obligation, to monitor the Services for violations; take appropriate legal action; restrict or disable access to any Contributions; and otherwise manage the Services to protect our rights and ensure proper functioning.</P>
          </section>

          <Divider />

          {/* 11 */}
          <section className="tos-section" id="privacy">
            <SectionHeader num="11" title="Privacy Policy" />
            <P>We care about your data. Please review our <a href="/policy/privacy" className="tos-link">Privacy Policy</a>, which is incorporated into these Terms. By using the Services, you agree to our Privacy Policy. Our servers are located in India and the United States.</P>
          </section>

          <Divider />

          {/* 12 */}
          <section className="tos-section" id="termination">
            <SectionHeader num="12" title="Term and Termination" />
            <P>These Terms remain in effect while you use the Services. We may, at our sole discretion and without notice or liability, terminate your access for any reason, including breach of these Terms.</P>
            <P>If your account is terminated, you are prohibited from creating a new account under any name without our express permission. We also reserve the right to take appropriate legal action.</P>
          </section>

          <Divider />

          {/* 13 */}
          <section className="tos-section" id="modifications">
            <SectionHeader num="13" title="Modifications and Interruptions" />
            <P>We reserve the right to change, modify, or remove the contents of the Services at any time without notice. We are not liable for any modification, suspension, or discontinuance of the Services.</P>
            <P>We cannot guarantee uninterrupted availability. We may experience downtime for maintenance or other reasons without liability to you.</P>
          </section>

          <Divider />

          {/* 14 */}
          <section className="tos-section" id="law">
            <SectionHeader num="14" title="Governing Law" />
            <P>These Terms are governed by and construed in accordance with the laws of <strong>India</strong>. You and Faddy irrevocably consent to the exclusive jurisdiction of the courts of India to resolve any dispute arising in connection with these Terms.</P>
          </section>

          <Divider />

          {/* 15 */}
          <section className="tos-section" id="disputes">
            <SectionHeader num="15" title="Dispute Resolution" />
            <Sub title="Informal Negotiations" />
            <P>Before initiating any formal proceedings, the parties agree to attempt to resolve any dispute informally for at least <strong>30 days</strong> via written notice.</P>
            <Sub title="Binding Arbitration" />
            <P>Any unresolved dispute shall be submitted to binding arbitration in <strong>Kolkata, India</strong>. Proceedings shall be conducted in English. The substantive law of India shall apply.</P>
            <Sub title="Restrictions" />
            <P>All arbitration shall be conducted on an individual basis. No class-action or representative proceedings are permitted.</P>
          </section>

          <Divider />

          {/* 16 */}
          <section className="tos-section" id="disclaimer">
            <SectionHeader num="16" title="Disclaimer" />
            <div className="tos-warn">
              THE SERVICES ARE PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. TO THE FULLEST EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICES WILL BE UNINTERRUPTED, ERROR-FREE, OR FREE OF VIRUSES OR OTHER HARMFUL COMPONENTS.
            </div>
          </section>

          <Divider />

          {/* 17 */}
          <section className="tos-section" id="liability">
            <SectionHeader num="17" title="Limitations of Liability" />
            <div className="tos-warn">
              IN NO EVENT SHALL FADDY, ITS OPERATOR, EMPLOYEES, OR AGENTS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES. OUR TOTAL LIABILITY TO YOU FOR ANY CAUSE SHALL NOT EXCEED THE GREATER OF THE AMOUNT YOU PAID TO US IN THE 12 MONTHS PRECEDING THE CLAIM OR ₹500 INR.
            </div>
          </section>

          <Divider />

          {/* 18 */}
          <section className="tos-section" id="indemnification">
            <SectionHeader num="18" title="Indemnification" />
            <P>You agree to defend, indemnify, and hold harmless Faddy and its operator, employees, and agents from any loss, damage, liability, or claim arising from: (1) your Contributions; (2) your use of the Services; (3) breach of these Terms; (4) violation of third-party rights; or (5) any harmful act toward another user.</P>
          </section>

          <Divider />

          {/* 19 */}
          <section className="tos-section" id="misc">
            <SectionHeader num="19" title="Miscellaneous" />
            <P>These Terms, together with our Privacy Policy, Refund Policy, and Cookie Policy, constitute the entire agreement between you and Faddy. Our failure to enforce any right or provision shall not be a waiver of that right. If any provision is found unenforceable, the remaining provisions remain in full effect.</P>
            <P>We may assign our rights and obligations under these Terms to others at any time. There is no joint venture, partnership, or agency relationship created by these Terms.</P>
          </section>

          <Divider />

          {/* 20 */}
          <section className="tos-section" id="contact">
            <SectionHeader num="20" title="Contact Us" />
            <P>If you have questions about these Terms or need to resolve a complaint, please contact us:</P>
            <div className="tos-contact-card">
              <div className="tos-contact-text">
                <strong>Faddy — Operated by Swarup Basu (Sole Proprietor)</strong>
                <span>Kolkata, West Bengal 743248, India</span>
              </div>
              <a href="mailto:support@faddy.site" className="tos-btn">
                ✉ support@faddy.site
              </a>
            </div>
          </section>

          <div className="tos-powered">Powered by <span>Faddy</span></div>
        </main>
      </div>
    </>
  );
}
