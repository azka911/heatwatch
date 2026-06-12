import Link from "next/link";
import Image from "next/image";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Top bar */}
      <header className="border-b border-slate-200">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-2.5">
            <Image src="/nav_logo.svg" alt="HeatWatch" width={28} height={28} className="rounded-md" />
            <span className="text-sm font-semibold tracking-tight text-slate-900">HeatWatch</span>
          </div>
          <Link
            href="/login"
            className="text-sm font-medium text-slate-600 hover:text-slate-900 transition"
          >
            Sign in
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-6 py-16 sm:py-24">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-8 lg:items-center">
            <div className="lg:col-span-7">
              <h1 className="mt-6 text-5xl font-semibold leading-[1.05] tracking-tight text-slate-900 sm:text-6xl lg:text-6xl">
                Urban Heat Island
                <br />
                Monitoring{" "}
                <span className="bg-gradient-to-r from-[#D13A2F] to-[#E88D53] bg-clip-text text-transparent">
                    Dashboard
                </span>
                </h1>
              <p className="mt-8 max-w-lg text-lg text-slate-600">
                See exactly where Kuala Lumpur is overheating, why it's happening,
                and what to do about it. Built on real satellite data and machine
                learning, mapped down to the city block.
              </p>
              <div className="mt-8 flex gap-3">
                <Link
                  href="/login?mode=signup"
                  className="rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition"
                >
                  Get started
                </Link>
                <Link
                  href="/login"
                  className="rounded-lg border border-slate-300 px-6 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
                >
                  Open dashboard
                </Link>
              </div>
            </div>

            {/* Zone lookup card */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-medium text-slate-500">Zone lookup</div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
                    High risk
                  </span>
                </div>

                <div className="mt-4">
                  <div className="text-lg font-semibold text-slate-900">Bukit Bintang, Kuala Lumpur</div>
                  <div className="mt-1 text-xs text-slate-500">3.146°N, 101.711°E</div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <div className="text-2xl font-semibold text-[#D13A2F]">37.2°C</div>
                    <div className="mt-1 text-xs text-slate-500">Surface temperature</div>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <div className="text-2xl font-semibold text-emerald-600">0.12</div>
                    <div className="mt-1 text-xs text-slate-500">Vegetation index</div>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-slate-200 p-3">
                  <div className="text-xs font-medium text-slate-500">Recommended intervention</div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                      Tree planting
                    </span>
                    <span className="text-xs text-slate-500">Priority: high</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Data strip */}
      <section className="border-b border-slate-200 bg-slate-900 text-white">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <p className="text-xs font-medium uppercase tracking-widest text-slate-400">
            Current readings
          </p>
          <div className="mt-4 grid grid-cols-2 gap-8 sm:grid-cols-4">
            <div>
              <div className="text-3xl font-semibold sm:text-4xl">33.4°C</div>
              <div className="mt-1 text-xs text-slate-400">Average surface temperature</div>
            </div>
            <div>
              <div className="text-3xl font-semibold text-[#E88D53] sm:text-4xl">554</div>
              <div className="mt-1 text-xs text-slate-400">Zones at high risk</div>
            </div>
            <div>
              <div className="text-3xl font-semibold sm:text-4xl">+5.18°C</div>
              <div className="mt-1 text-xs text-slate-400">Hotter than rural surroundings</div>
            </div>
            <div>
              <div className="text-3xl font-semibold sm:text-4xl">1,932</div>
              <div className="mt-1 text-xs text-slate-400">Zones monitored citywide</div>
            </div>
          </div>
        </div>
      </section>

      {/* Asymmetric feature blocks */}
      <section>
        <div className="mx-auto max-w-7xl px-6 py-16 sm:py-24">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-8">
            <div className="lg:col-span-4">
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                How it works
              </h2>
              <p className="mt-3 text-sm text-slate-600">
                Three steps, from raw satellite data to a recommendation a
                planning team can act on.
              </p>
            </div>

            <div className="lg:col-span-8 space-y-8">
              <div className="flex gap-6 border-t border-slate-200 pt-6">
                <div className="text-sm font-semibold text-[#D13A2F]">01</div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Map every degree</h3>
                  <p className="mt-2 text-sm text-slate-600 max-w-lg">
                    A live thermal grid built from MODIS satellite data. Zoom into
                    any block to see its temperature, vegetation cover, and elevation.
                  </p>
                </div>
              </div>

              <div className="flex gap-6 border-t border-slate-200 pt-6">
                <div className="text-sm font-semibold text-[#D13A2F]">02</div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Predict what's expected</h3>
                  <p className="mt-2 text-sm text-slate-600 max-w-lg">
                    A Random Forest model trained on vegetation, land cover,
                    elevation, and distance from the city centre estimates the
                    temperature each zone should have, and flags the ones running
                    hotter than expected.
                  </p>
                </div>
              </div>

              <div className="flex gap-6 border-t border-slate-200 pt-6">
                <div className="text-sm font-semibold text-[#D13A2F]">03</div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Recommend a fix</h3>
                  <p className="mt-2 text-sm text-slate-600 max-w-lg">
                    High-risk zones come with a suggested cooling intervention,
                    such as tree planting, reflective roofing, or shaded walkways.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-slate-200">
        <div className="mx-auto max-w-7xl px-6 py-16 sm:py-20">
          <div className="rounded-2xl bg-gradient-to-r from-[#D13A2F] to-[#E88D53] px-8 py-12 text-center sm:px-16">
            <h2 className="text-2xl font-semibold text-white sm:text-3xl">
              Start exploring the heat map
            </h2>
            <p className="mt-2 text-sm text-orange-50">
              Free to use. Sign up in seconds.
            </p>
            <Link
              href="/login?mode=signup"
              className="mt-6 inline-flex rounded-lg bg-white px-6 py-3 text-sm font-semibold text-[#D13A2F] hover:bg-orange-50 transition"
            >
              Get started
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200">
        <div className="mx-auto max-w-7xl px-6 py-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-slate-500">
          <div>© 2026 HeatWatch</div>
          <div>Data: MODIS LST, Sentinel-2 NDVI, ESA WorldCover, NASA NASADEM</div>
        </div>
      </footer>
    </div>
  );
}