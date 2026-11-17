#!/usr/bin/env python3
"""Build searchable indexes from a checkout of PokéAPI's data/v2/csv directory."""

import argparse
import csv
import json
from collections import defaultdict
from pathlib import Path

OUTPUT = Path(__file__).resolve().parents[1] / "src" / "data"
KOREAN = "3"


def build_indexes(source):
    def rows(table):
        with (source / f"{table}.csv").open(encoding="utf-8", newline="") as file:
            return list(csv.DictReader(file))

    def localized(table, key, field="name", language=KOREAN):
        return {
            row[key]: row[field]
            for row in rows(table)
            if row["local_language_id"] == language and row[field]
        }

    species = {row["id"]: row for row in rows("pokemon_species")}
    species_names = localized("pokemon_species_names", "pokemon_species_id")
    forms = {row["pokemon_id"]: row for row in rows("pokemon_forms") if row["is_default"] == "1"}
    form_names = localized("pokemon_form_names", "pokemon_form_id", "form_name")
    form_pokemon_names = localized("pokemon_form_names", "pokemon_form_id", "pokemon_name")
    type_ids = {row["id"]: row["identifier"] for row in rows("types")}
    pokemon_types = defaultdict(list)
    for row in sorted(rows("pokemon_types"), key=lambda row: int(row["slot"])):
        pokemon_types[row["pokemon_id"]].append(type_ids[row["type_id"]])
    stats = defaultdict(dict)
    for row in rows("pokemon_stats"):
        stats[row["pokemon_id"]][row["stat_id"]] = int(row["base_stat"])

    default_form_labels = {"gmax": "거다이맥스", "mega": "메가진화", "mega-x": "메가진화 X", "mega-y": "메가진화 Y"}
    catalogue = []
    for pokemon in rows("pokemon"):
        key = pokemon["id"]
        species_id = pokemon["species_id"]
        info = species[species_id]
        default = pokemon["is_default"] == "1"
        form = forms.get(key, {})
        form_id = form.get("id")
        species_name = species_names.get(species_id, info["identifier"])
        form_slug = form.get("form_identifier") or pokemon["identifier"]
        form_name = form_names.get(form_id) or default_form_labels.get(form_slug) or form_slug
        local_name = form_pokemon_names.get(form_id) or (form_name if species_name in form_name else f"{species_name} · {form_name}")
        name = species_name if default else local_name
        catalogue.append({
            "id": key,
            "number": int(species_id),
            "slug": pokemon["identifier"],
            "name": name,
            "speciesName": species_name,
            "default": default,
            "generation": int(info["generation_id"]),
            "types": pokemon_types[key],
            "stats": [stats[key].get(str(index)) for index in range(1, 7)],
            "height": int(pokemon["height"]) if pokemon["height"] else None,
            "weight": int(pokemon["weight"]) if pokemon["weight"] else None,
        })

    damage = defaultdict(dict)
    for row in rows("type_efficacy"):
        attack = type_ids[row["damage_type_id"]]
        defense = type_ids[row["target_type_id"]]
        damage[defense][attack] = int(row["damage_factor"]) / 100
    type_names = localized("type_names", "type_id")
    write("catalogue", {
        "pokemon": sorted(catalogue, key=lambda entry: (entry["number"], not entry["default"], int(entry["id"]))),
        "types": {slug: type_names.get(key, slug) for key, slug in type_ids.items() if 1 <= int(key) <= 18},
        "damage": damage,
    })

    regional_ids = "kanto original-johto hoenn original-sinnoh original-unova kalos-central kalos-coastal kalos-mountain original-alola galar paldea".split()
    regional_names = {
        "kanto": "관동", "original-johto": "성도", "hoenn": "호연", "original-sinnoh": "신오",
        "original-unova": "하나", "kalos-central": "칼로스 센트럴", "kalos-coastal": "칼로스 코스트",
        "kalos-mountain": "칼로스 마운틴", "original-alola": "알로라", "galar": "가라르", "paldea": "팔데아",
    }
    dex_rows = defaultdict(list)
    for row in rows("pokemon_dex_numbers"):
        dex_rows[row["pokedex_id"]].append((int(row["pokedex_number"]), int(row["species_id"])))
    write("regional", [
        {
            "id": row["identifier"],
            "name": regional_names[row["identifier"]],
            "numbers": [species_id for _, species_id in sorted(dex_rows[row["id"]])],
        }
        for row in rows("pokedexes") if row["identifier"] in regional_ids
    ])

    version_names = localized("version_names", "version_id")
    groups = {row["id"]: row["identifier"] for row in rows("version_groups")}
    move_names = localized("move_names", "move_id")
    learn_names = localized("pokemon_move_method_prose", "pokemon_move_method_id")
    encounter_names = localized("encounter_method_prose", "encounter_method_id")
    condition_names = localized("encounter_condition_value_prose", "encounter_condition_value_id", language="9")
    area_names = localized("location_area_prose", "location_area_id")
    location_names = localized("location_names", "location_id")
    locations = {row["id"]: row["identifier"] for row in rows("locations")}

    write("versions", [
        {"id": row["identifier"], "group": groups[row["version_group_id"]],
         "name": version_names.get(row["id"], row["identifier"])}
        for row in rows("versions")
    ])
    write("games", {
        "moves": [
            {"id": row["id"], "slug": row["identifier"], "name": move_names.get(row["id"], row["identifier"]),
             "type": type_ids[row["type_id"]],
             "power": int(row["power"]) if row["power"] else None,
             "accuracy": int(row["accuracy"]) if row["accuracy"] else None,
             "pp": int(row["pp"]) if row["pp"] else None}
            for row in rows("moves")
        ],
        "learnMethods": {row["identifier"]: learn_names.get(row["id"], row["identifier"])
                         for row in rows("pokemon_move_methods")},
        "encounterMethods": {row["identifier"]: encounter_names.get(row["id"], row["identifier"])
                              for row in rows("encounter_methods")},
        "encounterConditions": {row["identifier"]: condition_names.get(row["id"], row["identifier"])
                                for row in rows("encounter_condition_values")},
        "areas": {row["id"]: [locations[row["location_id"]],
                             area_names.get(row["id"], row["identifier"]),
                             location_names.get(row["location_id"], locations[row["location_id"]])]
                  for row in rows("location_areas")},
    })


def write(name, data):
    OUTPUT.mkdir(parents=True, exist_ok=True)
    with (OUTPUT / f"{name}.json").open("w", encoding="utf-8") as file:
        json.dump(data, file, ensure_ascii=False, separators=(",", ":"))
        file.write("\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    build_indexes(parser.parse_args().source)
