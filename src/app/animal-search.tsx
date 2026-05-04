"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useMemo, useState } from "react";

import { createAdoptionEnquiry, createSavedSearchAlert, type EnquiryResult } from "./actions";

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
  area: string;
  photo: string;
  traits: string[];
  description: string;
  urgent?: boolean;
  recent?: boolean;
};

const sizeOptions = ["All", "Small", "Medium", "Large", "Extra Large"];

function PawIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <ellipse cx="7.5" cy="10" rx="2.5" ry="3" />
      <ellipse cx="16.5" cy="10" rx="2.5" ry="3" />
      <ellipse cx="4" cy="5.5" rx="2" ry="2.5" />
      <ellipse cx="20" cy="5.5" rx="2" ry="2.5" />
      <path d="M12 20c-4 0-7-3-7-5.5S9 10 12 10s7 2 7 4.5S16 20 12 20z" />
    </svg>
  );
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

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

function scoreSearch(query: string, animal: PublicAnimal) {
  const text = `${animal.name} ${animal.species} ${animal.breed} ${animal.description} ${animal.traits.join(" ")} ${animal.shelter} ${animal.area} ${animal.age} ${animal.sex} ${animal.size}`.toLowerCase();
  const words = query.toLowerCase().split(/\s+/).filter((word) => word.length > 1);
  let score = words.reduce((total, word) => total + (text.includes(word) ? 10 : 0), 0);

  if (/\b(urgent|needs? home|at risk)\b/i.test(query) && animal.urgent) score += 25;
  if (/\b(new|recent|latest)\b/i.test(query) && animal.recent) score += 25;
  if (/\b(family|kid|child|gentle|friendly)\b/i.test(query) && /gentle|friendly|loving/i.test(text)) score += 20;
  if (/\b(calm|quiet|apartment|flat|senior)\b/i.test(query) && /calm|gentle|independent|small/i.test(text)) score += 20;
  if (/\b(active|energetic|running|hiking|adventure)\b/i.test(query) && /energetic|adventurous|playful/i.test(text)) score += 20;

  return score;
}

export function AnimalSearch({ animals }: { animals: PublicAnimal[] }) {
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [species, setSpecies] = useState("All");
  const [size, setSize] = useState("All");
  const [area, setArea] = useState("All");
  const [showFilters, setShowFilters] = useState(false);
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
  const speciesOptions = useMemo(() => ["All", ...Array.from(new Set(animals.map((animal) => animal.species)))], [animals]);
  const areaOptions = useMemo(() => ["All", ...Array.from(new Set(animals.map((animal) => animal.area)))], [animals]);

  const results = useMemo(() => {
    const searched = submittedQuery
      ? animals
          .map((animal) => ({ animal, score: scoreSearch(submittedQuery, animal) }))
          .filter((result) => result.score > 0)
          .sort((a, b) => b.score - a.score)
          .map((result) => result.animal)
      : animals;

    return searched.filter((animal) => {
      if (species !== "All" && animal.species !== species) return false;
      if (size !== "All" && animal.size !== size) return false;
      if (area !== "All" && animal.area !== area) return false;
      return true;
    });
  }, [animals, area, size, species, submittedQuery]);

  const resultLabel = submittedQuery ? `Results for "${submittedQuery}"` : "";

  function runSearch() {
    setSubmittedQuery(query.trim());
  }

  function quickSearch(value: string) {
    setQuery(value);
    setSubmittedQuery(value);
  }

  return (
    <main className="site-shell">
      <header className="header">
        <a className="brand" href="#">
          <span className="brand-mark">
            <PawIcon />
          </span>
          <span>Paws of Cape Town</span>
        </a>
        <nav className="nav" aria-label="Primary navigation">
          <a href="#animals">Adopt</a>
          <a href="#shelters">Our Shelters</a>
          <a href="#stories">Success Stories</a>
          <Link href="/shelter/login" className="nav-login">Shelter Login</Link>
        </nav>
      </header>

      <section className="hero">
        <div className="hero-inner">
          <div className="hero-pill">
            <PawIcon />
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

      <section className="filters" aria-label="Animal filters">
        <div className="filter-row">
          <button className={`filter-chip ${showFilters ? "active" : ""}`} type="button" onClick={() => setShowFilters((value) => !value)}>
            Filters
          </button>
          {speciesOptions.map((option) => (
            <button key={option} className={`filter-chip ${species === option ? "active" : ""}`} type="button" onClick={() => setSpecies(option)}>
              {option === "All" ? "All Animals" : `${option}s`}
            </button>
          ))}
        </div>

        {showFilters ? (
          <div className="filter-row filter-row-extra">
            <span>Size</span>
            {sizeOptions.map((option) => (
              <button key={option} className={`filter-chip ${size === option ? "active" : ""}`} type="button" onClick={() => setSize(option)}>
                {option}
              </button>
            ))}
            <span>Area</span>
            {areaOptions.map((option) => (
              <button key={option} className={`filter-chip ${area === option ? "active" : ""}`} type="button" onClick={() => setArea(option)}>
                {option}
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

      <section className="animal-section" id="animals">
        {results.length ? (
          <div className="animal-grid">
            {results.map((animal, index) => (
              <article className="animal-card" key={animal.id} style={{ animationDelay: `${index * 70}ms` }}>
                <div className="animal-image">
                  <Image src={animal.photo} alt={`${animal.name}, a ${animal.breed}`} fill sizes="(max-width: 800px) 100vw, (max-width: 1200px) 50vw, 25vw" />
                  <div className="badges">
                    {animal.urgent ? <span className="badge urgent">Urgent</span> : null}
                    {animal.recent ? <span className="badge recent">New</span> : null}
                  </div>
                  <Link className="share-button" href={`/animals/${animal.slug}`} aria-label={`Open ${animal.name}'s profile`}>
                    <ShareIcon />
                  </Link>
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
                      <strong>{animal.shelter}</strong>
                    </div>
                    <div className="card-actions">
                      <Link href={`/animals/${animal.slug}`}>View Profile</Link>
                      <button type="button" onClick={() => setSelectedAnimal(animal)}>Enquire</button>
                    </div>
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

      <section className="shelter-cta" id="shelters">
        <div>
          <h2>Are you a registered Cape Town rescue?</h2>
          <p>List your animals, manage adoption enquiries centrally, and reach a wider audience across the Western Cape.</p>
        </div>
        <Link href="/shelter/register">Register Shelter</Link>
      </section>

      <footer className="footer">
        <div className="footer-top">
          <div>
            <div className="footer-brand">
              <PawIcon />
              <span>Paws of Cape Town</span>
            </div>
            <p>A centralised marketplace helping rescue animals across the Western Cape find suitable homes.</p>
          </div>
          <div>
            <h3>For the Public</h3>
            <a href="#animals">Search Animals</a>
            <a href="#stories">Adoption Process</a>
            <a href="#stories">Success Stories</a>
            <a href="#stories">Foster an Animal</a>
          </div>
          <div>
            <h3>For Shelters</h3>
            <Link href="/shelter/login">Shelter Login</Link>
            <Link href="/shelter/register">Partner With Us</Link>
            <a href="#shelters">Resources</a>
            <a href="#shelters">Contact Support</a>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2026 Paws of Cape Town. All rights reserved.</p>
          <div>
            <a href="#privacy">Privacy Policy</a>
            <a href="#terms">Terms of Service</a>
          </div>
        </div>
      </footer>

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
                <input type="hidden" name="species" value={species} />
                <input type="hidden" name="suburb" value={area} />
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
