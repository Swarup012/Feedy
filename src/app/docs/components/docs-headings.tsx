import { headingId } from "../docs-nav";

function anchor(id: string) {
  return (
    <a href={`#${id}`} className="docs-heading-anchor" aria-label="Link to section">
      #
    </a>
  );
}

export function DocsH2({ children }: { children: string }) {
  const id = headingId(children);
  return (
    <h2 id={id} className="text-[1.375rem] font-semibold">
      {children}
      {anchor(id)}
    </h2>
  );
}

export function DocsH3({ children }: { children: string }) {
  const id = headingId(children);
  return (
    <h3 id={id} className="text-[1.0625rem] font-semibold">
      {children}
      {anchor(id)}
    </h3>
  );
}
