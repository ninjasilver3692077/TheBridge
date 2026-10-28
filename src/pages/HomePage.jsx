import { Link } from "react-router-dom";
import AppShell from "../components/AppShell.jsx";
import CommunitySummary from "../components/home/CommunitySummary.jsx";
import FeaturedListings from "../components/home/FeaturedListings.jsx";
import HeroCarousel from "../components/home/HeroCarousel.jsx";
import {
  buttonPrimary,
  buttonSecondary,
  eyebrow,
} from "../styles/ui.js";

function HomePage() {
  return (
    <AppShell
      title="Home"
      subtitle="Find your next book connection"
    >
      <section className="relative isolate -mx-4 -mt-6 flex min-h-[480px] items-center overflow-hidden border-line sm:mx-0 sm:mt-0 sm:min-h-[520px] sm:rounded-3xl sm:border lg:min-h-[560px]">
        <HeroCarousel />

        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-wine/10 mix-blend-multiply dark:bg-wine-deep/40 dark:mix-blend-normal"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-canvas/85 lg:bg-transparent lg:bg-gradient-to-r lg:from-canvas lg:from-15% lg:via-canvas/90 lg:via-50% lg:to-canvas/25"
        />

        <div className="w-full px-6 py-16 sm:px-10 lg:px-14">
          <div className="max-w-xl">
            <p className={eyebrow}>Community book marketplace</p>

            <h1 className="mt-4 text-4xl font-bold leading-[1.08] tracking-tight text-ink sm:text-5xl lg:text-[3.4rem]">
              Find the book that connects you to what comes next.
            </h1>

            <p className="mt-5 max-w-lg text-[15px] leading-7 text-ink sm:text-lg sm:leading-8">
              Discover books shared by people in your community through
              exchange, loan, rental, and sale.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/marketplace" className={buttonPrimary}>
                Explore Marketplace
              </Link>

              <Link to="/add-book" className={buttonSecondary}>
                Add your book
              </Link>
            </div>
          </div>
        </div>
      </section>

      <CommunitySummary />
      <FeaturedListings />
    </AppShell>
  );
}

export default HomePage;
