import { forwardRef, type AnchorHTMLAttributes, type ReactNode } from "react";
import { Link as RouterLink } from "react-router-dom";

/** Shim next/link → react-router Link (prop href → to). */
interface LinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  href: string;
  children?: ReactNode;
  prefetch?: boolean;
  replace?: boolean;
  scroll?: boolean;
}

const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  { href, prefetch: _prefetch, scroll: _scroll, replace, children, ...rest },
  ref,
) {
  return (
    <RouterLink to={href} replace={replace} ref={ref} {...rest}>
      {children}
    </RouterLink>
  );
});

export default Link;
