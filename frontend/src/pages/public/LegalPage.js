import React, { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { getStoredValue } from "../../utils/adminPortalStorage";
import {
  DEFAULT_CMS_PAGES,
  ensureCurrentLegalPageContent,
  normalizePolicySlug,
} from "../../data/legalPages";
import "../../STYLES/LegalPage.css";

function splitLegalContent(description) {
  return String(description || "")
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);
}

export default function LegalPage() {
  const { slug } = useParams();
  const normalizedSlug = normalizePolicySlug(slug);

  const pages = useMemo(() => {
    const storedPages = getStoredValue("cms-pages", DEFAULT_CMS_PAGES);
    return ensureCurrentLegalPageContent(storedPages);
  }, []);

  const page = pages.find(
    (item) =>
      normalizePolicySlug(item?.slug) === normalizedSlug &&
      String(item?.status || "Active").toLowerCase() !== "inactive"
  );

  if (!page) {
    return (
      <main className="legal-page">
        <section className="legal-shell legal-empty">
          <Link className="legal-back-link" to="/">
            <ArrowLeft size={18} />
            Back to home
          </Link>
          <h1>Page not available</h1>
          <p>The requested policy page is not configured yet.</p>
        </section>
      </main>
    );
  }

  const contentBlocks = splitLegalContent(page.description);

  return (
    <main className="legal-page">
      <section className="legal-shell">
        <Link className="legal-back-link" to="/">
          <ArrowLeft size={18} />
          Back to home
        </Link>

        <header className="legal-hero">
          <p>Pick N Book Policy</p>
          <h1>{page.title}</h1>
          {page.metaDescription ? <span>{page.metaDescription}</span> : null}
        </header>

        <article className="legal-content-card">
          {contentBlocks.length > 0 ? (
            contentBlocks.map((block, index) => {
              const headingMatch = block.match(/^(\d+\.\s+.+)$/m);
              const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
              const isSection = headingMatch && lines[0] === headingMatch[1];

              if (isSection) {
                return (
                  <section className="legal-section" key={`${lines[0]}-${index}`}>
                    <h2>{lines[0]}</h2>
                    {lines.slice(1).map((line) => (
                      <p key={line}>{line}</p>
                    ))}
                  </section>
                );
              }

              return (
                <p className="legal-intro" key={`${block.slice(0, 24)}-${index}`}>
                  {block}
                </p>
              );
            })
          ) : (
            <p className="legal-intro">This policy content is being updated.</p>
          )}
        </article>
      </section>
    </main>
  );
}
