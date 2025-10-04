import { Metadata } from "next";

interface MainLayoutProps {
    children: React.ReactNode;
}

export const metadata: Metadata = {
    title: "Hotel Management System",
    description:
        "The ultimate collection of design-agnostic, flexible and accessible React UI Components.",
    robots: { index: false, follow: false },
    openGraph: {
        type: "website",
        title: "Hotel Management System",
        url: "https://www.primefaces.org/apollo-react",
        description:
            "The ultimate collection of design-agnostic, flexible and accessible React UI Components.",
        images: ["https://www.primefaces.org/static/social/apollo-react.png"],
        ttl: 604800,
    },
    icons: {
        icon: "/favicon.ico",
    },
};

export default function MainLayout({ children }: MainLayoutProps) {
    return <div>{children}</div>;
}
