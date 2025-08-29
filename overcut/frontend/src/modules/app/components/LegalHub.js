import React from "react";
import { Link } from "react-router-dom";
import { FormattedMessage } from "react-intl";
import "./LegalHub.css";

const items = [
  { to: "/legal/notice", id: "project.LegalNotice", fallback: "Legal Notice", descId: "project.LegalNoticeDesc", fallbackDesc: "Ownership, contact, and general info." },
  { to: "/legal/terms", id: "project.TermsOfUse", fallback: "Terms of Use", descId: "project.TermsOfUseDesc", fallbackDesc: "Rules for using OverCut." },
  { to: "/legal/privacy", id: "project.PrivacyPolicy", fallback: "Privacy Policy", descId: "project.PrivacyPolicyDesc", fallbackDesc: "Data processing and your rights." },
  { to: "/legal/intellectualProperty", id: "project.IntellectualProperty", fallback: "Intellectual Property", descId: "project.IntellectualPropertyDesc", fallbackDesc: "IP ownership and permitted uses." },
  { to: "/legal/cookies", id: "project.CookiesPolicy", fallback: "Cookies Policy", descId: "project.CookiesPolicyDesc", fallbackDesc: "Cookies used and settings." },
];

const LegalHub = () => {
  return (
    <main className="legalhub-wrapper" role="main">
      <header className="legalhub-header">
        <h1>
          <FormattedMessage id="project.LegalPolicies" defaultMessage="Legal Policies" />
        </h1>
        <p className="legalhub-sub">
          <FormattedMessage
            id="project.LegalPoliciesSubtitle"
            defaultMessage="Find all our legal documents in one place."
          />
        </p>
      </header>

      <section className="legalhub-grid" aria-label="Legal documents">
        {items.map((item) => (
          <Link key={item.to} to={item.to} className="legalhub-card" aria-label={item.fallback}>
            <h2 className="legalhub-card-title">
              <FormattedMessage id={item.id} defaultMessage={item.fallback} />
            </h2>
            <p className="legalhub-card-desc">
              <FormattedMessage id={item.descId} defaultMessage={item.fallbackDesc} />
            </p>
            <span className="legalhub-card-cta">
              <FormattedMessage id="project.ReadMore" defaultMessage="Read more" />
            </span>
          </Link>
        ))}
      </section>
    </main>
  );
};

export default LegalHub;
