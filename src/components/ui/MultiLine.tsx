import { Fragment } from "react";

/**
 * Renders "\n" in CMS text as a line break. With `mobileOnly` the break only
 * applies below lg; on desktop it becomes a space.
 */
export function MultiLine({ text, mobileOnly = false }: { text: string; mobileOnly?: boolean }) {
  return (
    <>
      {text.split("\n").map((line, i) => (
        <Fragment key={i}>
          {i > 0 &&
            (mobileOnly ? (
              <>
                <br className="lg:hidden" />
                <span className="hidden lg:inline"> </span>
              </>
            ) : (
              <br />
            ))}
          {line}
        </Fragment>
      ))}
    </>
  );
}
