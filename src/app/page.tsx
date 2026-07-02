import type { Metadata } from "next";

import { LandingPage } from "@/components/landing/landing-page";

export const metadata: Metadata = {
  title: "Acceso | Oro Negro",
  description: "Landing de acceso a los paneles trader e inversor",
};

type HomeProps = {
  searchParams?: Promise<{
    login_error?: string;
    login_status?: string;
    role?: string;
  }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;

  return (
    <LandingPage
      loginError={params?.login_error}
      loginStatus={params?.login_status}
      role={params?.role}
    />
  );
}
