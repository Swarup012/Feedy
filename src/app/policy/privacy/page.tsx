"use client";

import { useEffect, useRef } from "react";

const NAV_ITEMS = [
  { href: "collect",       label: "1. What We Collect" },
  { href: "process",       label: "2. How We Process It" },
  { href: "legal-bases",   label: "3. Legal Bases" },
  { href: "share",         label: "4. When We Share It" },
  { href: "cookies",       label: "5. Cookies" },
  { href: "international", label: "6. International Transfers" },
  { href: "retention",     label: "7. How Long We Keep It" },
  { href: "security",      label: "8. How We Keep It Safe" },
  { href: "minors",        label: "9. Minors" },
  { href: "rights",        label: "10. Your Rights" },
  { href: "updates",       label: "11. Policy Updates" },
  { href: "contact",       label: "12. Contact Us" },
];

const LEGAL_BASES = [
  {
    tag: "Contract",
    desc: "To fulfil our contractual obligations to you — providing, maintaining, and improving the Services you signed up for.",
  },
  {
    tag: "Consent",
    desc: "Where you have given us explicit permission to process your data for a specific purpose. You may withdraw consent at any time by contacting us at support@faddy.site.",
  },
  {
    tag: "Legitimate Interest",
    desc: "To improve our Services, ensure platform security, prevent fraud, and communicate relevant service updates.",
  },
  {
    tag: "Legal Obligation",
    desc: "Where processing is required to comply with applicable laws, regulations, or enforceable government requests.",
  },
];

const RIGHTS = [
  { title: "Access",      desc: "Request a copy of the personal data we hold about you." },
  { title: "Correct",     desc: "Request correction of inaccurate or incomplete data." },
  { title: "Delete",      desc: "Request deletion of your personal data from our systems." },
  { title: "Portability", desc: "Receive your data in a structured, machine-readable format." },
  { title: "Restrict",    desc: "Request that we limit how we use your personal data." },
  { title: "Object",      desc: "Object to processing based on legitimate interests." },
];

function SectionHeader({ num, title }: { num: string; title: string }) {
  return (
    <>
      <p className="pp-section-number">Section {num}</p>
      <h2 className="pp-section-title">{title}</h2>
    </>
  );
}

function InfoCard({ children }: { children: React.ReactNode }) {
  return <div className="pp-info-card">{children}</div>;
}

function DataList({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="pp-data-list">
      {items.map((item, i) => <li key={i}>{item}</li>)}
    </ul>
  );
}

function Divider() {
  return <hr className="pp-divider" />;
}

export default function PrivacyPolicy() {
  const navRefs = useRef<Record<string, HTMLAnchorElement | null>>({});

  useEffect(() => {
    const sections = document.querySelectorAll<HTMLElement>(".pp-section");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            Object.values(navRefs.current).forEach((el) => el?.classList.remove("pp-active"));
            const id = entry.target.getAttribute("id");
            if (id && navRefs.current[id]) navRefs.current[id]?.classList.add("pp-active");
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
        .pp-wrapper {
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
        .pp-sidebar {
          position: sticky;
          top: 0;
          height: 100vh;
          overflow-y: auto;
          padding: 32px 0;
          border-right: 1px solid #e2e8f0;
        }
        .pp-sidebar::-webkit-scrollbar { display: none; }
        .pp-logo {
          font-size: 18px;
          font-weight: 700;
          color: #1e293b;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 32px;
        }
        .pp-logo-dot {
          width: 8px; height: 8px;
          background: #6366f1;
          border-radius: 50%;
          display: inline-block;
        }
        .pp-sidebar-label {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #94a3b8;
          margin-bottom: 12px;
          padding-left: 12px;
        }
        .pp-nav-list { list-style: none; display: flex; flex-direction: column; gap: 2px; padding: 0; margin: 0; }
        .pp-nav-list a {
          display: block;
          padding: 7px 12px;
          border-radius: 6px;
          color: #64748b;
          text-decoration: none;
          font-size: 13px;
          transition: background 0.15s, color 0.15s;
          border-left: 2px solid transparent;
        }
        .pp-nav-list a:hover, .pp-nav-list a.pp-active {
          background: #eef2ff;
          color: #4f46e5;
          border-left-color: #6366f1;
        }
        .pp-main { padding: 32px 0 60px; }
        .pp-page-header {
          margin-bottom: 32px;
          padding-bottom: 20px;
          border-bottom: 1px solid #e2e8f0;
        }
        .pp-badge {
          display: inline-block;
          background: #eef2ff;
          color: #6366f1;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 4px 10px;
          border-radius: 99px;
          border: 1px solid #c7d2fe;
          margin-bottom: 16px;
        }
        .pp-page-title {
          font-size: 22px;
          font-weight: 700;
          color: #0f172a;
          line-height: 1.2;
          margin-bottom: 12px;
        }
        .pp-page-meta { display: flex; gap: 20px; flex-wrap: wrap; margin-bottom: 20px; }
        .pp-meta-item { font-size: 13px; color: #94a3b8; display: flex; align-items: center; gap: 6px; }
        .pp-meta-item span { color: #64748b; font-weight: 500; }
        .pp-section { margin-bottom: 40px; scroll-margin-top: 32px; }
        .pp-section-number {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #6366f1;
          margin-bottom: 8px;
        }
        .pp-section-title {
          font-size: 18px;
          font-weight: 600;
          color: #0f172a;
          margin-bottom: 16px;
        }
        .pp-body { color: #475569; font-size: 14.5px; }
        .pp-body p { margin-bottom: 14px; }
        .pp-body p:last-child { margin-bottom: 0; }
        .pp-link {
          color: #6366f1;
          text-decoration: none;
          border-bottom: 1px solid #c7d2fe;
          transition: border-color 0.15s;
        }
        .pp-link:hover { border-bottom-color: #6366f1; }
        .pp-info-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-left: 3px solid #6366f1;
          border-radius: 8px;
          padding: 16px 20px;
          margin: 20px 0;
          font-size: 14px;
          color: #64748b;
        }
        .pp-data-list { list-style: none; display: flex; flex-direction: column; gap: 8px; margin: 16px 0; padding: 0; }
        .pp-data-list li {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          font-size: 14px;
          color: #475569;
        }
        .pp-data-list li::before {
          content: '';
          width: 5px; height: 5px;
          background: #6366f1;
          border-radius: 50%;
          flex-shrink: 0;
          margin-top: 8px;
        }
        .pp-rights-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 20px 0; }
        .pp-right-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 14px 16px;
          font-size: 13.5px;
          color: #475569;
        }
        .pp-right-title { color: #0f172a; display: block; font-weight: 600; margin-bottom: 3px; }
        .pp-basis-list { display: flex; flex-direction: column; gap: 10px; margin: 16px 0; }
        .pp-basis-item { display: flex; gap: 14px; align-items: flex-start; }
        .pp-basis-tag {
          background: #eef2ff;
          color: #4f46e5;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          padding: 3px 8px;
          border-radius: 4px;
          white-space: nowrap;
          margin-top: 2px;
          flex-shrink: 0;
        }
        .pp-basis-desc { font-size: 14px; color: #475569; line-height: 1.6; }
        .pp-contact-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 24px 28px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          flex-wrap: wrap;
          margin-top: 20px;
        }
        .pp-contact-text strong { display: block; font-size: 15px; color: #0f172a; margin-bottom: 4px; }
        .pp-contact-text span { font-size: 13px; color: #94a3b8; }
        .pp-contact-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #6366f1;
          color: #fff;
          font-size: 13px;
          font-weight: 600;
          padding: 10px 20px;
          border-radius: 8px;
          text-decoration: none;
          transition: opacity 0.15s;
          white-space: nowrap;
        }
        .pp-contact-btn:hover { opacity: 0.88; }
        .pp-divider { border: none; border-top: 1px solid #e2e8f0; margin: 0 0 40px; }
        .pp-powered {
          font-size: 12px;
          color: #94a3b8;
          text-align: center;
          padding: 16px 0 32px;
        }
        .pp-powered span { color: #64748b; font-weight: 600; }
        @media (max-width: 768px) {
          .pp-wrapper { grid-template-columns: 1fr; padding: 0 16px; gap: 0; }
          .pp-sidebar { position: static; height: auto; border-right: none; border-bottom: 1px solid #e2e8f0; padding: 32px 0 24px; }
          .pp-rights-grid { grid-template-columns: 1fr; }
          .pp-page-title { font-size: 26px; }
        }
      `}</style>

      <div className="pp-wrapper">
        {/* Sidebar */}
        <aside className="pp-sidebar">
          <a href="https://faddy.site" className="pp-logo">
            <span className="pp-logo-dot" />
            Faddy
          </a>
          <p className="pp-sidebar-label">On this page</p>
          <ul className="pp-nav-list">
            {NAV_ITEMS.map(({ href, label }) => (
              <li key={href}>
                <a href={`#${href}`} ref={(el) => { navRefs.current[href] = el; }}>
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </aside>

        {/* Main */}
        <main className="pp-main">
          <header className="pp-page-header">
            <div className="pp-badge">Legal</div>
            <h1 className="pp-page-title">Privacy Policy</h1>
            <div className="pp-page-meta">
              <div className="pp-meta-item">Last updated <span>January 23, 2026</span></div>
              <div className="pp-meta-item">Applies to <span>faddy.site</span></div>
            </div>
            <InfoCard>
              This policy describes how Faddy collects, uses, and protects your personal information.
              All payments are processed by{" "}
              <a href="https://www.paddle.com/legal/privacy" target="_blank" rel="noopener noreferrer" className="pp-link">Paddle.com</a>,
              who acts as the merchant of record for all transactions on this platform.
            </InfoCard>
          </header>

          {/* 1 */}
          <section className="pp-section" id="collect">
            <SectionHeader num="01" title="What Information Do We Collect?" />
            <div className="pp-body">
              <p>We collect personal information that you voluntarily provide when you register, use our Services, or contact us.</p>
              <DataList items={[
                "Names and email addresses",
                "Passwords and authentication data",
                "Billing addresses and job titles",
                "Any other information you choose to provide",
              ]} />
              <p>
                <strong style={{ color: "#0f172a" }}>Payment data:</strong> All payment data is handled and stored securely by{" "}
                <a href="https://www.paddle.com/legal/privacy" target="_blank" rel="noopener noreferrer" className="pp-link">Paddle.com</a>.
                We do not store your card details on our servers.
              </p>
              <p>
                <strong style={{ color: "#0f172a" }}>Information collected automatically:</strong> IP address, browser type, device
                characteristics, operating system, language preferences, and referring URLs.
              </p>
              <InfoCard>We do not process sensitive personal information such as health data, biometric data, or racial/ethnic origin.</InfoCard>
            </div>
          </section>

          <Divider />

          {/* 2 */}
          <section className="pp-section" id="process">
            <SectionHeader num="02" title="How Do We Process Your Information?" />
            <div className="pp-body">
              <p>We process your personal information only for specific, legitimate purposes:</p>
              <DataList items={[
                "To create and manage your account and authenticate your identity",
                "To deliver and maintain our Services",
                "To respond to your inquiries and provide customer support",
                "To send administrative information such as service updates or policy changes",
                "To fulfil and manage subscription orders and payments",
                "To detect, prevent, and address security incidents or fraud",
                "To comply with applicable legal obligations",
              ]} />
            </div>
          </section>

          <Divider />

          {/* 3 */}
          <section className="pp-section" id="legal-bases">
            <SectionHeader num="03" title="What Legal Bases Do We Rely On?" />
            <div className="pp-body">
              <p>We only process your personal information when we have a valid legal reason to do so, including:</p>
              <div className="pp-basis-list">
                {LEGAL_BASES.map(({ tag, desc }) => (
                  <div className="pp-basis-item" key={tag}>
                    <span className="pp-basis-tag">{tag}</span>
                    <span className="pp-basis-desc">{desc}</span>
                  </div>
                ))}
              </div>
              <p style={{ marginTop: 16 }}>
                If you are located in the EU or UK, these bases correspond to the lawful grounds under the GDPR and UK GDPR.
              </p>
            </div>
          </section>

          <Divider />

          {/* 4 */}
          <section className="pp-section" id="share">
            <SectionHeader num="04" title="When and With Whom Do We Share Your Information?" />
            <div className="pp-body">
              <p>We do not sell your personal information. We may share it only in the following limited circumstances:</p>
              <DataList items={[
                <><strong style={{ color: "#0f172a" }}>Payment processing:</strong> Your payment information is shared with Paddle.com, our merchant of record.</>,
                <><strong style={{ color: "#0f172a" }}>Service providers:</strong> Trusted vendors who assist in operating our platform (hosting, analytics, email delivery) under strict data processing agreements.</>,
                <><strong style={{ color: "#0f172a" }}>Business transfers:</strong> In the event of a merger, acquisition, or sale of assets.</>,
                <><strong style={{ color: "#0f172a" }}>Legal requirements:</strong> Where required by law, court order, or to protect the rights and safety of Faddy or its users.</>,
              ]} />
            </div>
          </section>

          <Divider />

          {/* 5 */}
          <section className="pp-section" id="cookies">
            <SectionHeader num="05" title="Cookies and Tracking Technologies" />
            <div className="pp-body">
              <p>We use cookies and similar technologies to maintain session security and understand how our platform is used. You can set your browser to refuse cookies, though this may affect certain features.</p>
              <p>For detailed information, please see our <a href="/policy/cookie" className="pp-link">Cookie Policy</a>.</p>
            </div>
          </section>

          <Divider />

          {/* 6 */}
          <section className="pp-section" id="international">
            <SectionHeader num="06" title="Is Your Information Transferred Internationally?" />
            <div className="pp-body">
              <p>Our primary servers are located in <strong style={{ color: "#0f172a" }}>India</strong>. Some third-party service providers (including Paddle.com) may process your information in the United States or other countries.</p>
              <p>We take all reasonable measures to ensure your information is protected in accordance with this Privacy Policy and applicable law.</p>
            </div>
          </section>

          <Divider />

          {/* 7 */}
          <section className="pp-section" id="retention">
            <SectionHeader num="07" title="How Long Do We Keep Your Information?" />
            <div className="pp-body">
              <p>We retain your personal information only for as long as necessary to fulfil the purposes outlined in this Privacy Policy, unless a longer retention period is required by law.</p>
              <p>When your account is closed, we will delete or anonymise your data. Where immediate deletion is not possible (e.g., backup archives), we will securely isolate it until deletion is feasible.</p>
            </div>
          </section>

          <Divider />

          {/* 8 */}
          <section className="pp-section" id="security">
            <SectionHeader num="08" title="How Do We Keep Your Information Safe?" />
            <div className="pp-body">
              <p>We implement appropriate technical and organisational security measures including encrypted data transmission, access controls, and regular security reviews.</p>
              <InfoCard>No method of electronic transmission or storage is 100% secure. You are responsible for keeping your account credentials confidential.</InfoCard>
            </div>
          </section>

          <Divider />

          {/* 9 */}
          <section className="pp-section" id="minors">
            <SectionHeader num="09" title="Do We Collect Information From Minors?" />
            <div className="pp-body">
              <p>We do not knowingly collect data from children under 18 years of age. By using our Services, you represent that you are at least 18 years old.</p>
              <p>If we learn we hold data about a minor, we will promptly delete it. Please contact us at <a href="mailto:support@faddy.site" className="pp-link">support@faddy.site</a> if you believe this has occurred.</p>
            </div>
          </section>

          <Divider />

          {/* 10 */}
          <section className="pp-section" id="rights">
            <SectionHeader num="10" title="What Are Your Privacy Rights?" />
            <div className="pp-body">
              <p>Depending on your location, you may have the following rights over your personal information:</p>
              <div className="pp-rights-grid">
                {RIGHTS.map(({ title, desc }) => (
                  <div className="pp-right-card" key={title}>
                    <span className="pp-right-title">{title}</span>
                    {desc}
                  </div>
                ))}
              </div>
              <p style={{ marginTop: 16 }}>
                To exercise any of these rights, visit your{" "}
                <a href="https://faddy.site/admin/profile" className="pp-link">account settings</a>{" "}
                or email <a href="mailto:support@faddy.site" className="pp-link">support@faddy.site</a>.
                We will respond within <strong style={{ color: "#0f172a" }}>30 days</strong>.
              </p>
            </div>
          </section>

          <Divider />

          {/* 11 */}
          <section className="pp-section" id="updates">
            <SectionHeader num="11" title="Do We Update This Policy?" />
            <div className="pp-body">
              <p>We may update this Privacy Policy from time to time. When we make material changes, we will update the &quot;Last updated&quot; date and, where required, notify you via email.</p>
            </div>
          </section>

          <Divider />

          {/* 12 */}
          <section className="pp-section" id="contact">
            <SectionHeader num="12" title="Contact Us" />
            <div className="pp-body">
              <p>If you have questions or requests regarding this Privacy Policy, please reach out:</p>
              <div className="pp-contact-card">
                <div className="pp-contact-text">
                  <strong>Faddy — Privacy Team</strong>
                  <span>Digital-only Service · Kolkata, West Bengal 743248, India</span>
                </div>
                <a href="mailto:support@faddy.site" className="pp-contact-btn">
                  ✉ support@faddy.site
                </a>
              </div>
            </div>
          </section>

          <div className="pp-powered">Powered by <span>Faddy</span></div>
        </main>
      </div>
    </>
  );
}
