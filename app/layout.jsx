import "./globals.css";
import { PermissionsProvider } from "@/lib/hooks/usePermissions";

export const metadata = {
    title: "CodFlow - E-commerce Management",
    description: "Advanced e-commerce management and dispatch system",
};

export default function RootLayout({ children }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body suppressHydrationWarning>
                <PermissionsProvider>
                    {children}
                </PermissionsProvider>
            </body>
        </html>
    );
}