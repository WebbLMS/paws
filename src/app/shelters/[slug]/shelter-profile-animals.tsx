"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

export type ShelterProfileAnimal = {
  id: string;
  slug: string;
  name: string;
  species: string;
  breed: string;
  age: string;
  photo: string;
  status: string;
  urgent: boolean;
};

const filters = ["All", "Dogs", "Cats"];

export function ShelterProfileAnimals({ animals }: { animals: ShelterProfileAnimal[] }) {
  const [filter, setFilter] = useState("All");
  const filteredAnimals = useMemo(() => {
    if (filter === "Dogs") return animals.filter((animal) => animal.species === "Dog");
    if (filter === "Cats") return animals.filter((animal) => animal.species === "Cat");
    return animals;
  }, [animals, filter]);

  return (
    <>
      <div className="shelter-profile-filter" role="tablist" aria-label="Animal species filter">
        {filters.map((option) => (
          <button
            key={option}
            type="button"
            className={filter === option ? "active" : ""}
            onClick={() => setFilter(option)}
          >
            {option}
          </button>
        ))}
      </div>

      {filteredAnimals.length ? (
        <div className="shelter-profile-grid">
          {filteredAnimals.map((animal) => (
            <Link href={`/animals/${animal.slug}`} prefetch={false} className="shelter-profile-animal-card" key={animal.id}>
              <div className="shelter-profile-animal-image">
                <Image src={animal.photo} alt={animal.name} fill sizes="(max-width: 800px) 100vw, 33vw" />
                <span>{animal.age}</span>
                {animal.urgent ? <em>Urgent</em> : null}
              </div>
              <div>
                <h3>{animal.name}</h3>
                <p>{animal.breed} · {animal.species}</p>
              </div>
            </Link>
          ))}
          <div className="shelter-load-more-card">
            <span>⌕</span>
            <strong>More animals soon</strong>
            <p>Check back as this shelter adds new adoption-ready listings.</p>
          </div>
        </div>
      ) : (
        <div className="shelter-profile-empty">
          <strong>No {filter === "All" ? "available animals" : filter.toLowerCase()} right now.</strong>
          <p>Try another filter or check back later.</p>
        </div>
      )}
    </>
  );
}
