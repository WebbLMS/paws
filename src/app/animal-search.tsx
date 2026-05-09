"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type KeyboardEvent, useActionState, useMemo, useState } from "react";

import { createAdoptionEnquiry, createSavedSearchAlert, recordPublicSearchActivity, type EnquiryResult } from "./actions";
import { PublicFooter, PublicHeader, type PublicBranding } from "./public-chrome";

export type PublicAnimal = {
  id: string;
  slug: string;
  name: string;
  species: string;
  breed: string;
  age: string;
  sex: string;
  size: string;
  shelter: string;
  shelterSlug: string;
  area: string;
  photo: string;
  traits: string[];
  health: {
    vaccinationsUpToDate: boolean;
    neutered: boolean;
    microchipped: boolean;
    tickFleaPreventionActive: boolean;
  };
  description: string;
  searchText: string;
  urgent?: boolean;
  recent?: boolean;
};

export type PublicShelter = {
  id: string;
  slug: string;
  name: string;
  location: string;
  logoUrl: string | null;
  animalCount: number;
};

const sizeOptions = ["All", "Small", "Medium", "Large", "Extra Large"];
const healthFilterOptions = [
  {
    key: "vaccinationsUpToDate",
    label: "Vaccinated",
  },
  {
    key: "neutered",
    label: "Neutered",
  },
  {
    key: "microchipped",
    label: "Microchipped",
  },
  {
    key: "tickFleaPreventionActive",
    label: "Tick/Flea protected",
  },
] as const;

type FilterSnapshot = {
  species?: string[];
  sizes?: string[];
  areas?: string[];
  shelters?: string[];
  healthFilters?: string[];
  resultsCount?: number;
};

function toggleSelectedValue(current: string[], value: string) {
  if (value === "All") return [];
  return current.includes(value) ? current.filter((item) => item !== value) : [...current, value];
}

function SearchIcon() {
  return (
    <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <path d="M11 8l1 2 2 1-2 1-1 2-1-2-2-1 2-1z" fill="currentColor" stroke="none" />
    </svg>
  );
}

function scoreSearch(query: string, animal: PublicAnimal) {
  const text = animal.searchText.toLowerCase();
  const normalizedQuery = query.toLowerCase().trim();
  const words = normalizedQuery.split(/\s+/).filter((word) => word.length > 1);
  let score = text.includes(normalizedQuery) ? 30 : 0;

  score += words.reduce((total, word) => {
    if (text.includes(word)) return total + 10;
    const stem = word.replace(/(ing|ed|s)$/u, "");
    return stem.length > 2 && text.includes(stem) ? total + 5 : total;
  }, 0);

  if (/\b(urgent|needs? home|at risk)\b/i.test(query) && animal.urgent) score += 25;
  if (/\b(new|recent|latest)\b/i.test(query) && animal.recent) score += 25;
  if (/\b(family|kid|child|gentle|friendly)\b/i.test(query) && /gentle|friendly|loving/i.test(text)) score += 20;
  if (/\b(calm|quiet|apartment|flat|senior)\b/i.test(query) && /calm|gentle|independent|small/i.test(text)) score += 20;
  if (/\b(active|energetic|running|hiking|adventure)\b/i.test(query) && /energetic|adventurous|playful/i.test(text)) score += 20;

  return score;
}

export function AnimalSearch({
  animals,
  shelters,
  branding,
}: {
  animals: PublicAnimal[];
  shelters: PublicShelter[];
  branding?: PublicBranding;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const speciesOptions = useMemo(() => ["All", ...Array.from(new Set(animals.map((animal) => animal.species)))], [animals]);
  const requestedSpecies = searchParams.get("species");
  const initialSpecies = requestedSpecies
    ? (speciesOptions.find((option) => option.toLowerCase() === requestedSpecies.toLowerCase()) ?? "")
    : "";
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [species, setSpecies] = useState<string[]>(initialSpecies && initialSpecies !== "All" ? [initialSpecies] : []);
  const [sizes, setSizes] = useState<string[]>([]);
  const [areas, setAreas] = useState<string[]>([]);
  const [selectedShelters, setSelectedShelters] = useState<string[]>([]);
  const [healthFilters, setHealthFilters] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showShelterMenu, setShowShelterMenu] = useState(false);
  const [shelterSearch, setShelterSearch] = useState("");
  const [showAlert, setShowAlert] = useState(false);
  const [selectedAnimal, setSelectedAnimal] = useState<PublicAnimal | null>(null);
  const [enquiryState, enquiryAction, isSubmittingEnquiry] = useActionState<EnquiryResult, FormData>(createAdoptionEnquiry, {
    ok: false,
    message: "",
  });
  const [alertState, alertAction, isSubmittingAlert] = useActionState<EnquiryResult, FormData>(createSavedSearchAlert, {
    ok: false,
    message: "",
  });
  const areaOptions = useMemo(() => Array.from(new Set(animals.map((animal) => animal.area))).sort(), [animals]);
  const filteredShelters = useMemo(() => {
    const search = shelterSearch.trim().toLowerCase();
    if (!search) return shelters;
    return shelters.filter((shelter) => `${shelter.name} ${shelter.location}`.toLowerCase().includes(search));
  }, [shelterSearch, shelters]);
  const selectedShelterNames = useMemo(
    () => selectedShelters.map((slug) => shelters.find((shelter) => shelter.slug === slug)?.name).filter(Boolean) as string[],
    [selectedShelters, shelters],
  );
  const shelterFilterLabel =
    selectedShelterNames.length === 0
      ? "All shelters"
      : selectedShelterNames.length === 1
        ? selectedShelterNames[0]
        : `${selectedShelterNames.length} shelters`;

  const results = useMemo(() => {
    const searched = submittedQuery
      ? animals
          .map((animal) => ({ animal, score: scoreSearch(submittedQuery, animal) }))
          .filter((result) => result.score > 0)
          .sort((a, b) => b.score - a.score)
          .map((result) => result.animal)
      : animals;

    return searched.filter((animal) => {
      if (species.length && !species.includes(animal.species)) return false;
      if (sizes.length && !sizes.includes(animal.size)) return false;
      if (areas.length && !areas.includes(animal.area)) return false;
      if (selectedShelters.length && !selectedShelters.includes(animal.shelterSlug)) return false;
      if (
        healthFilters.some((filter) => {
          const key = filter as keyof PublicAnimal["health"];
          return !animal.health[key];
        })
      ) {
        return false;
      }
      return true;
    });
  }, [animals, areas, healthFilters, selectedShelters, sizes, species, submittedQuery]);

  const resultLabel = submittedQuery ? `Results for "${submittedQuery}"` : "";

  function logSearchActivity(action: string, nextQuery = submittedQuery, snapshot: FilterSnapshot = {}) {
    const activeSpecies = snapshot.species ?? species;
    const activeSizes = snapshot.sizes ?? sizes;
    const activeAreas = snapshot.areas ?? areas;
    const activeShelters = snapshot.shelters ?? selectedShelters;
    const activeHealth = snapshot.healthFilters ?? healthFilters;
    const formData = new FormData();
    formData.set("action", action);
    formData.set("query", nextQuery);
    formData.set("species", activeSpecies.join(","));
    formData.set("size", activeSizes.join(","));
    formData.set("area", activeAreas.join(","));
    formData.set("shelters", activeShelters.join(","));
    formData.set("health", activeHealth.join(","));
    formData.set("results", String(snapshot.resultsCount ?? results.length));
    void recordPublicSearchActivity(formData);
  }

  function runSearch() {
    const nextQuery = query.trim();
    setSubmittedQuery(nextQuery);
    logSearchActivity("searched", nextQuery);
  }

  function quickSearch(value: string) {
    setQuery(value);
    setSubmittedQuery(value);
    logSearchActivity("quick_search", value);
  }

  function toggleHealthFilter(key: string) {
    const next = healthFilters.includes(key) ? healthFilters.filter((filter) => filter !== key) : [...healthFilters, key];
    setHealthFilters(next);
    logSearchActivity("filter_changed", submittedQuery, { healthFilters: next });
  }

  function changeSpecies(option: string) {
    const next = toggleSelectedValue(species, option);
    setSpecies(next);
    logSearchActivity("filter_changed", submittedQuery, { species: next });
  }

  function changeSize(option: string) {
    const next = toggleSelectedValue(sizes, option);
    setSizes(next);
    logSearchActivity("filter_changed", submittedQuery, { sizes: next });
  }

  function changeArea(option: string) {
    const next = toggleSelectedValue(areas, option);
    setAreas(next);
    logSearchActivity("filter_changed", submittedQuery, { areas: next });
  }

  function changeShelter(slug: string) {
    const next = toggleSelectedValue(selectedShelters, slug);
    setSelectedShelters(next);
    logSearchActivity("filter_changed", submittedQuery, { shelters: next });
  }

  function openAnimalProfile(animal: PublicAnimal) {
    router.push(`/animals/${animal.slug}`, { scroll: false });
  }

  function openAnimalProfileFromKeyboard(event: KeyboardEvent<HTMLElement>, animal: PublicAnimal) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openAnimalProfile(animal);
    }
  }

  return (
    <main className="site-shell">
      <PublicHeader active="adopt" branding={branding} />

      <section className="hero">
        <div className="hero-inner">
          <div className="hero-pill">
            Connecting Cape Town rescues with loving homes
          </div>
          <h1>
            Find your perfect companion with <span>smart matching</span>
          </h1>
          <p>
            Describe your lifestyle, home, and what you are looking for. Search animals from multiple Cape Town shelters in one place.
          </p>

          <div className="search-wrap">
            <div className="search-box">
              <SearchIcon />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") runSearch();
                }}
                placeholder="e.g. calm cat for my small apartment in Sea Point"
              />
              <button type="button" onClick={runSearch}>
                Find Match
              </button>
            </div>
          </div>

          <div className="popular">
            <span>Popular searches:</span>
            {["Good with kids", "Active dog for hiking", "Calm cat for apartment", "Urgent needs home"].map((term) => (
              <button key={term} type="button" onClick={() => quickSearch(term)}>
                {term}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="filters" id="animals" aria-label="Animal filters">
        <div className="filter-row">
          <button className={`filter-chip ${showFilters ? "active" : ""}`} type="button" onClick={() => setShowFilters((value) => !value)}>
            Filters
          </button>
          {speciesOptions.map((option) => (
            <button
              key={option}
              className={`filter-chip ${option === "All" ? (species.length === 0 ? "active" : "") : species.includes(option) ? "active" : ""}`}
              type="button"
              onClick={() => changeSpecies(option)}
            >
              {option === "All" ? "All Animals" : `${option}s`}
            </button>
          ))}
        </div>

        {showFilters ? (
          <div className="filter-row filter-row-extra">
            <span>Size</span>
            {sizeOptions.map((option) => (
              <button
                key={option}
                className={`filter-chip ${option === "All" ? (sizes.length === 0 ? "active" : "") : sizes.includes(option) ? "active" : ""}`}
                type="button"
                onClick={() => changeSize(option)}
              >
                {option}
              </button>
            ))}
            <span>Area</span>
            {["All", ...areaOptions].map((option) => (
              <button
                key={option}
                className={`filter-chip ${option === "All" ? (areas.length === 0 ? "active" : "") : areas.includes(option) ? "active" : ""}`}
                type="button"
                onClick={() => changeArea(option)}
              >
                {option}
              </button>
            ))}
            <span>Shelter</span>
            <div className="multi-select-filter">
              <button
                className={`filter-chip multi-select-trigger ${selectedShelters.length ? "active" : ""}`}
                type="button"
                aria-haspopup="listbox"
                aria-expanded={showShelterMenu}
                onClick={() => setShowShelterMenu((value) => !value)}
              >
                {shelterFilterLabel}
                <span aria-hidden="true">v</span>
              </button>
              {showShelterMenu ? (
                <div className="multi-select-menu" role="listbox" aria-label="Filter by shelter">
                  <label className="multi-select-search">
                    <span>Find shelter</span>
                    <input value={shelterSearch} onChange={(event) => setShelterSearch(event.target.value)} placeholder="Search shelters..." />
                  </label>
                  <button
                    type="button"
                    className={`multi-select-option ${selectedShelters.length === 0 ? "selected" : ""}`}
                    onClick={() => changeShelter("All")}
                  >
                    <span className="multi-select-check">{selectedShelters.length === 0 ? "✓" : ""}</span>
                    <span>
                      <strong>All shelters</strong>
                      <small>Show listings from every rescue</small>
                    </span>
                  </button>
                  {filteredShelters.map((shelter) => (
                    <button
                      type="button"
                      key={shelter.id}
                      className={`multi-select-option ${selectedShelters.includes(shelter.slug) ? "selected" : ""}`}
                      onClick={() => changeShelter(shelter.slug)}
                    >
                      <span className="multi-select-check">{selectedShelters.includes(shelter.slug) ? "✓" : ""}</span>
                      <span>
                        <strong>{shelter.name}</strong>
                        <small>
                          {shelter.location} · {shelter.animalCount} animal{shelter.animalCount === 1 ? "" : "s"}
                        </small>
                      </span>
                    </button>
                  ))}
                  {filteredShelters.length === 0 ? <p className="multi-select-empty">No shelters match that search.</p> : null}
                </div>
              ) : null}
            </div>
            <span>Health</span>
            {healthFilterOptions.map((option) => (
              <button
                key={option.key}
                className={`filter-chip ${healthFilters.includes(option.key) ? "active" : ""}`}
                type="button"
                onClick={() => toggleHealthFilter(option.key)}
              >
                {option.label}
              </button>
            ))}
          </div>
        ) : null}

        {resultLabel ? (
          <div className="match-note">
            <span>{resultLabel}</span>
            <strong>{results.length} result{results.length === 1 ? "" : "s"}</strong>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setSubmittedQuery("");
              }}
            >
              Clear
            </button>
            <button type="button" onClick={() => setShowAlert(true)}>
              Set Up Alert
            </button>
          </div>
        ) : null}
      </section>

      <section className="animal-section">
        {results.length ? (
          <div className="animal-grid">
            {results.map((animal, index) => (
              <article
                className="animal-card clickable-card"
                key={animal.id}
                role="link"
                tabIndex={0}
                onClick={() => openAnimalProfile(animal)}
                onKeyDown={(event) => openAnimalProfileFromKeyboard(event, animal)}
                style={{ animationDelay: `${index * 70}ms` }}
              >
                <div className="animal-image">
                  <Image src={animal.photo} alt={`${animal.name}, a ${animal.breed}`} fill sizes="(max-width: 800px) 100vw, (max-width: 1200px) 50vw, 25vw" />
                  <div className="badges">
                    {animal.urgent ? <span className="badge urgent">Urgent</span> : null}
                    {animal.recent ? <span className="badge recent">New</span> : null}
                  </div>
                  <div className="image-title">
                    <h2>{animal.name}</h2>
                    <p>{animal.breed} · {animal.age}</p>
                  </div>
                </div>
                <div className="animal-body">
                  <div className="meta-row">
                    <span>{animal.sex}</span>
                    <span>{animal.size}</span>
                    <span>{animal.area}</span>
                  </div>
                  <p className="description">{animal.description}</p>
                  <div className="trait-row">
                    {animal.traits.map((trait) => (
                      <span key={trait}>{trait}</span>
                    ))}
                  </div>
                  <div className="card-footer">
                    <div>
                      <p>Shelter</p>
                      <Link
                        href={`/shelters/${animal.shelterSlug}`}
                        prefetch={false}
                        onClick={(event) => event.stopPropagation()}
                        className="animal-shelter-link"
                      >
                        {animal.shelter}
                      </Link>
                    </div>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelectedAnimal(animal);
                      }}
                    >
                      Enquire
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <SearchIcon />
            <h2>No matches found</h2>
            <p>Try different search terms or adjust your filters.</p>
            <button type="button" onClick={() => setShowAlert(true)}>Set Up Alert</button>
          </div>
        )}
      </section>

      {shelters.length ? (
        <section className="shelter-strip-section" id="shelters" aria-label="Cape Town rescue shelters">
          <div className="shelter-strip-heading">
            <h2>Rescue partners</h2>
          </div>
          <div className="shelter-logo-marquee">
            <div className="shelter-logo-strip">
              {[...shelters, ...shelters].map((shelter, index) => (
                <Link
                  href={`/shelters/${shelter.slug}`}
                  prefetch={false}
                  className="shelter-logo-card"
                  key={`${shelter.id}-${index}`}
                  aria-hidden={index >= shelters.length ? true : undefined}
                  tabIndex={index >= shelters.length ? -1 : undefined}
                >
                  <span className={shelter.logoUrl ? "shelter-logo-image" : "shelter-logo-mark"}>
                    {shelter.logoUrl ? (
                      <Image src={shelter.logoUrl} alt="" fill sizes="72px" />
                    ) : (
                      <span>{shelter.name.slice(0, 2).toUpperCase()}</span>
                    )}
                  </span>
                  <strong>{shelter.name}</strong>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="shelter-cta">
        <div className="shelter-cta-inner">
          <div>
            <h2>Are you a registered Cape Town rescue?</h2>
            <p>List your animals, manage adoption enquiries centrally, and reach a wider audience across the Western Cape.</p>
          </div>
          <Link href="/shelter/register">Register Shelter</Link>
        </div>
      </section>

      <PublicFooter branding={branding} />

      {selectedAnimal ? (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setSelectedAnimal(null)}>
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="enquiry-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 id="enquiry-title">Enquire About {selectedAnimal.name}</h2>
                <p>via {selectedAnimal.shelter} · {selectedAnimal.area}</p>
              </div>
              <button type="button" aria-label="Close enquiry form" onClick={() => setSelectedAnimal(null)}>
                ×
              </button>
            </div>

            {enquiryState.ok ? (
              <div className="enquiry-success">
                <h3>Enquiry Sent</h3>
                <p>{enquiryState.message}</p>
                <button type="button" onClick={() => setSelectedAnimal(null)}>Done</button>
              </div>
            ) : (
              <form action={enquiryAction} className="enquiry-form">
                <input type="hidden" name="animalId" value={selectedAnimal.id} />
                <label>
                  <span>Your Name</span>
                  <input name="name" required autoComplete="name" />
                </label>
                <label>
                  <span>Email Address</span>
                  <input name="email" type="email" required autoComplete="email" />
                </label>
                <label>
                  <span>Phone Number</span>
                  <input name="phone" type="tel" autoComplete="tel" />
                </label>
                <label>
                  <span>Message</span>
                  <textarea name="message" rows={4} placeholder="Tell the shelter about your home and why you could be a good match." />
                </label>
                {enquiryState.message ? <p className="form-error">{enquiryState.message}</p> : null}
                <button type="submit" disabled={isSubmittingEnquiry}>
                  {isSubmittingEnquiry ? "Sending..." : "Send Enquiry"}
                </button>
              </form>
            )}
          </div>
        </div>
      ) : null}

      {showAlert ? (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setShowAlert(false)}>
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="alert-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 id="alert-title">Set Up Search Alert</h2>
                <p>Save this search and track future matching listings.</p>
              </div>
              <button type="button" aria-label="Close alert form" onClick={() => setShowAlert(false)}>
                ×
              </button>
            </div>

            {alertState.ok ? (
              <div className="enquiry-success">
                <h3>Alert Saved</h3>
                <p>{alertState.message}</p>
                <button type="button" onClick={() => setShowAlert(false)}>Done</button>
              </div>
            ) : (
              <form action={alertAction} className="enquiry-form">
                <input type="hidden" name="query" value={submittedQuery || query} />
                <input type="hidden" name="species" value={species.length === 1 ? species[0] : ""} />
                <input type="hidden" name="suburb" value={areas.length === 1 ? areas[0] : ""} />
                <label>
                  <span>Email Address</span>
                  <input name="email" type="email" required autoComplete="email" />
                </label>
                {alertState.message ? <p className="form-error">{alertState.message}</p> : null}
                <button type="submit" disabled={isSubmittingAlert}>
                  {isSubmittingAlert ? "Saving..." : "Save Alert"}
                </button>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </main>
  );
}
