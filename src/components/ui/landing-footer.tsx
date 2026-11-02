import "./landing-footer.css";

interface LandingFooterProps {
  showCTA?: boolean;
}

export function LandingFooter({ showCTA = true }: LandingFooterProps) {
  return (
    <footer className="lf">
      <div className="lf__container">
        <div className="lf__inner">
          <div className="lf__mast">
            <span className="lf__wordmark">Faddy</span>
            {showCTA && (
              <div className="lf__actions">
                <a href="/signup" className="lf__cta">
                  Get Started Free
                </a>
                <a href="/contact" className="lf__cta lf__cta--quiet">
                  Contact Sales
                </a>
              </div>
            )}
          </div>

          <div className="lf__grid">
            <div className="lf__cell lf__cell--brand">
              <div className="lf__social">
                <a
                  href="https://www.linkedin.com/in/swarup-basu-314465211/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="lf__social-link"
                  aria-label="LinkedIn"
                >
                  <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.045-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.14.92-2.063 2.063-2.063 1.14 0 2.064.922 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </a>
                <a
                  href="https://discord.gg/Dx69zsH2CV"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="lf__social-link"
                  aria-label="Discord"
                >
                  <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
                  </svg>
                </a>
                <a
                  href="https://whatsapp.com/channel/0029VaBW4gzHltYELmDUZ13T"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="lf__social-link"
                  aria-label="WhatsApp"
                >
                  <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                </a>
              </div>
              <p className="lf__copy">© {new Date().getFullYear()} Faddy</p>
            </div>

            <div className="lf__cell lf__cell--product">
              <h4 className="lf__heading">Product</h4>
              <ul className="lf__links">
                <li><a href="/feedback" className="lf__link">Feedback Boards</a></li>
                <li><a href="/roadmap" className="lf__link">Roadmap</a></li>
                <li><a href="/changelog" className="lf__link">Changelog</a></li>
                <li><a href="/pricing" className="lf__link">Pricing</a></li>
              </ul>
            </div>

            <div className="lf__cell lf__cell--company">
              <h4 className="lf__heading">Company</h4>
              <ul className="lf__links">
                <li><a href="/docs" className="lf__link">Documentation</a></li>
                <li><a href="/contact" className="lf__link">Contact Us</a></li>
              </ul>
            </div>

            <div className="lf__cell lf__cell--legal">
              <h4 className="lf__heading">Legal</h4>
              <ul className="lf__links">
                <li><a href="/policy/privacy" className="lf__link">Privacy Policy</a></li>
                <li><a href="/policy/terms" className="lf__link">Terms and Conditions</a></li>
                <li><a href="/policy/refund" className="lf__link">Refund Policy</a></li>
                <li><a href="/policy/cookie" className="lf__link">Cookies</a></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
