import { Link, useLocation } from "react-router-dom";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface NavLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  activeClassName?: string;
  pendingClassName?: string;
}

const NavLink = forwardRef<HTMLAnchorElement, NavLinkProps>(
  ({ className, activeClassName, pendingClassName, href, ...props }, ref) => {
    const location = useLocation();
    const isActive = location.pathname === href;

    return (
      <Link
        ref={ref}
        to={href}
        className={cn(className, isActive && activeClassName)}
        {...props as any}
      />
    );
  },
);

NavLink.displayName = "NavLink";

export { NavLink };
